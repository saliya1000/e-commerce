import request from 'supertest';
import app from '../../src/app';

describe('Security Middlewares & Auth Tests', () => {
  it('should reject requests to protected routes without a token (401 Unauthorized)', async () => {
    const res = await request(app).post('/api/products');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Authentication required');
  });

  it('should reject requests with invalid or malformed tokens (401 Unauthorized)', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', 'Bearer invalid.token.string');
    
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid or expired token');
  });

  it('should enforce rate limiting on aggressive requests', async () => {
    // The rate limiter is set to 100 requests per 15 minutes. 
    // Sending >100 requests in a loop should eventually trigger a 429 Too Many Requests.
    let hitRateLimit = false;
    
    // We send up to 105 requests to ensure we cross the 100 threshold
    for (let i = 0; i < 105; i++) {
      const res = await request(app).get('/api/products/suggest?q=test');
      if (res.status === 429) {
        hitRateLimit = true;
        break;
      }
    }
    
    expect(hitRateLimit).toBe(true);
  }, 30000);
});
