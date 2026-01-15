import { Router, Request, Response } from 'express';
import { db } from '../database';
import { logger } from '../utils/logger';

const router = Router();

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  service: string;
  database?: string;
  memory?: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}

const getMemoryUsage = () => {
  const mem = process.memoryUsage();
  return {
    rss: Math.round(mem.rss / 1024 / 1024), // MB
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
    heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
    external: Math.round(mem.external / 1024 / 1024)
  };
};

// Main health check endpoint
router.get('/', async (req: Request, res: Response<HealthResponse>) => {
  const startTime = Date.now();
  
  try {
    const databaseHealth = await db.healthCheck();
    
    const healthData: HealthResponse = {
      status: databaseHealth ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'user-profile-service',
      database: databaseHealth ? 'connected' : 'disconnected',
      memory: getMemoryUsage()
    };

    const statusCode = databaseHealth ? 200 : 503;
    
    logger.info('Health check completed', {
      duration: Date.now() - startTime,
      status: healthData.status
    });

    return res.status(statusCode).json(healthData);
  } catch (error) {
    logger.error('Health check failed', { error: String(error) });
    
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'user-profile-service',
      database: 'error'
    });
  }
});

// Readiness probe (checks if app is ready to accept requests)
router.get('/ready', async (req: Request, res: Response) => {
  const isReady = await db.healthCheck();
  
  if (isReady) {
    return res.status(200).json({ status: 'ready' });
  } else {
    return res.status(503).json({ status: 'not ready' });
  }
});

// Liveness probe (checks if app is running)
router.get('/live', (req: Request, res: Response) => {
  return res.status(200).json({ status: 'alive' });
});

export default router;