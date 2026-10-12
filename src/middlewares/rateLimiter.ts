import { Request, Response, NextFunction } from 'express';

/**
 * Token Bucket implementation for rate limiting
 * - Capacity: Maximum tokens in the bucket (burst capacity, e.g. 100)
 * - Refill Rate: Tokens added per millisecond (e.g. 100 tokens per 15 minutes)
 */
export class TokenBucket {
  public capacity: number;
  public tokens: number;
  public refillRatePerMs: number;
  public lastRefillTime: number;

  constructor(capacity = 100, refillPeriodMs = 15 * 60 * 1000) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRatePerMs = capacity / refillPeriodMs;
    this.lastRefillTime = Date.now();
  }

  public refill(now = Date.now()): void {
    const elapsed = Math.max(0, now - this.lastRefillTime);
    const addedTokens = elapsed * this.refillRatePerMs;
    this.tokens = Math.min(this.capacity, this.tokens + addedTokens);
    this.lastRefillTime = now;
  }

  public consume(cost = 1): {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
    resetTime: Date;
  } {
    const now = Date.now();
    this.refill(now);

    if (this.tokens >= cost) {
      this.tokens -= cost;
      const msToFull = Math.ceil((this.capacity - this.tokens) / this.refillRatePerMs);
      return {
        allowed: true,
        remaining: Math.floor(this.tokens),
        retryAfterSeconds: 0,
        resetTime: new Date(now + msToFull)
      };
    } else {
      const neededTokens = cost - this.tokens;
      const msWait = Math.ceil(neededTokens / this.refillRatePerMs);
      const retryAfterSeconds = Math.max(1, Math.ceil(msWait / 1000));
      return {
        allowed: false,
        remaining: Math.max(0, Math.floor(this.tokens)),
        retryAfterSeconds,
        resetTime: new Date(now + msWait)
      };
    }
  }
}

// In-memory store for client token buckets
const buckets = new Map<string, TokenBucket>();

// Helper to reset buckets (useful for tests)
export const resetTokenBuckets = (): void => {
  buckets.clear();
};

export const tokenBucketLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.ip ||
    req.socket.remoteAddress ||
    'unknown';

  let bucket = buckets.get(clientIp);
  if (!bucket) {
    bucket = new TokenBucket(100, 15 * 60 * 1000); // 100 requests per 15 minutes
    buckets.set(clientIp, bucket);
  }

  const result = bucket.consume(1);

  res.setHeader('X-RateLimit-Limit', bucket.capacity);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', result.resetTime.toISOString());

  if (!result.allowed) {
    res.setHeader('Retry-After', result.retryAfterSeconds);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Too many requests, please try again later.'
    });
    return;
  }

  next();
};

