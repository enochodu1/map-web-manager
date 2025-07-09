import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';

export function requestLogger(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Log the request
    logger.info('Request received', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    // Override res.end to log the response
    const originalEnd = res.end.bind(res);
    res.end = function(...args: any[]) {
      const duration = Date.now() - startTime;
      
      logger.info('Request completed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      return originalEnd(...args);
    };

    next();
  };
}
