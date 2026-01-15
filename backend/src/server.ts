import 'dotenv/config';
import app from './app';
import { logger } from './utils/logger';
import { db } from './database';

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    await db.connect();
    
    // Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running in ${NODE_ENV} mode`, {
        port: PORT,
        timestamp: new Date().toISOString()
      });
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Received shutdown signal');
      
      server.close(async () => {
        logger.info('HTTP server closed');
        await db.close();
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.warn('Force shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: String(error) });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason: String(reason), promise });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server', { error: String(error) });
    process.exit(1);
  }
};

startServer();