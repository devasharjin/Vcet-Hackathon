import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode = 400, code = 'APP_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(`API Error on ${req.method} ${req.url}:`, {
    message: err.message,
    stack: err.stack,
    code: err.code,
  });

  const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
  const code = err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
  const message = err.message || 'An unexpected error occurred.';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details: err.details || undefined,
    },
  });
}
