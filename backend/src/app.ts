import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { loggerMiddleware } from './middleware/loggerMiddleware';
import userRoutes from './routes/userRoutes';
import healthRoutes from './routes/healthRoutes';
import { logger } from './utils/logger';

const app: Express = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors());

// Compression
app.use(compression());

// Rate limiting (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(loggerMiddleware);

// Health check route (before auth/middleware)
app.use('/health', healthRoutes);

// API routes
app.use('/api/users', userRoutes);

// Health check at root
app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'user-profile-service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, starting graceful shutdown');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, starting graceful shutdown');
  process.exit(0);
});

export default app;