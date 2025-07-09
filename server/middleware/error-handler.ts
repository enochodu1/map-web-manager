import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';

export function errorHandler(logger: Logger) {
  return (err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled error:', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Don't expose internal errors in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(err.status || 500).json({
      success: false,
      error: isDevelopment ? err.message : 'Internal Server Error',
      ...(isDevelopment && { stack: err.stack }),
      timestamp: new Date().toISOString()
    });
  };
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString()
  });
}
