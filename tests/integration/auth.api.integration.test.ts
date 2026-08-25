import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/prisma';

describe('Auth API Integration', () => {
  const uniqueId = Date.now();
  const testEmail = `testuser_${uniqueId}@example.com`;
  const testPassword = 'Password123!';
  let accessToken: string;

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: { email: testEmail }
    });
    await prisma.$disconnect();
  });

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        captchaToken: 'valid_mock_token'
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('User registered successfully');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(testEmail);
  });

  it('should prevent duplicate registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        captchaToken: 'valid_mock_token'
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('User with this email already exists');
  });

  it('should login and return access token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: testPassword
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    accessToken = res.body.accessToken;

    // Check that refresh token is set in cookies
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/refreshToken=/);
  });

  it('should access a protected route (2fa generate) with valid token', async () => {
    const res = await request(app)
      .post('/api/auth/2fa/generate')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('qrCodeUrl');
  });
});
