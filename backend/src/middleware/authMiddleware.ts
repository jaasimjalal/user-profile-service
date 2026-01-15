import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Mock authentication middleware
// In production, replace with JWT validation or session-based auth
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // For now, skip authentication (allow all requests)
  // Remove this comment and implement actual authentication in production
  next();
};

// Mock authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    next();
  };
};