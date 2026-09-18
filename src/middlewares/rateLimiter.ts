import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';

// Token Bucket configuration
const rateLimiter = new RateLimiterMemory({
  points: process.env.NODE_ENV === 'test' ? 1000 : 20, // Max 20 requests
  duration: 1, // Per 1 second (this essentially means 20 tokens, refilled at 20 tokens per second)
  blockDuration: 60, // Block IP for 1 minute if it consumes all points aggressively without letting them refill
});

export const tokenBucketLimiter = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  
  rateLimiter.consume(clientIp)
    .then((rateLimiterRes: RateLimiterRes) => {
      res.setHeader('Retry-After', rateLimiterRes.msBeforeNext / 1000);
      res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints);
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());
      next();
    })
    .catch((rateLimiterRes: RateLimiterRes) => {
      res.setHeader('Retry-After', rateLimiterRes.msBeforeNext / 1000);
      res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints);
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());
      res.status(429).json({ error: 'Too Many Requests' });
    });
};
