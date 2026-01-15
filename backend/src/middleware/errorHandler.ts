import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  code?: string;
}

export class HttpError extends Error implements AppError {
  statusCode: number;
  status: string;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends HttpError {
  constructor(message: string = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends HttpError {
  constructor(message: string = 'Conflict') {
    super(message, 409, 'CONFLICT');
  }
}

// 404 Not Found Handler
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

// Global Error Handler
export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = { ...err } as AppError;
  
  // Log the error
  logger.error('Error occurred', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  // Handle non-HttpError errors
  if (!(err instanceof HttpError)) {
    error = new HttpError(
      process.env.NODE_ENV === 'production' 
        ? 'Something went wrong' 
        : err.message,
      500,
      'INTERNAL_SERVER_ERROR'
    );
  }

  // Handle Mongoose validation errors (if using Mongoose)
  if (error.name === 'ValidationError') {
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
  }

  // Handle duplicate key errors (MongoDB/Mongoose)
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0];
    error.statusCode = 409;
    error.code = 'DUPLICATE_KEY';
    error.message = `${field} already exists`;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    error.statusCode = 401;
    error.code = 'INVALID_TOKEN';
  }

  if (error.name === 'TokenExpiredError') {
    error.statusCode = 401;
    error.code = 'TOKEN_EXPIRED';
  }

  // Send response
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Something went wrong',
    ...(error.code && { code: error.code }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack
    })
  });
};