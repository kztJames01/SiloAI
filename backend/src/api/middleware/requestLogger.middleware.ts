import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { normalizeRoute, recordRequest } from '../../monitoring/metrics';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  res.setHeader('x-request-id', requestId);
  (req as any).requestId = requestId;

  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const route = normalizeRoute(req.path);
    recordRequest(req.method, route, res.statusCode, durationMs);

    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http';
    logger.log(level, `${req.method} ${req.path} ${res.statusCode} ${durationMs}ms [${requestId}]`);
  });

  next();
}
