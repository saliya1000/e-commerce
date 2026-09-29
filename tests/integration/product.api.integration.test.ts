import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Product API Integration', () => {
  const uniqueId = Date.now();
  let adminToken: string;
  let categoryId: string;
  let productId: string;

  beforeAll(async () => {
    // 1. Create an admin user directly
    const adminEmail = `admin_${uniqueId}@example.com`;
    const passwordHash = await bcrypt.hash('adminPass', 10);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'admin'
      }
    });

    // 2. Generate a valid JWT for the admin
    adminToken = jwt.sign(
      { userId: admin.id, role: admin.role, twoFactorEnabled: true }, 
      process.env.JWT_ACCESS_SECRET || 'access_secret', 
      { expiresIn: '15m' }
    );
  });

  afterAll(async () => {
    // Cleanup
    if (productId) {
      await prisma.product.deleteMany({ where: { id: productId } });
    }
    if (categoryId) {
      await prisma.category.deleteMany({ where: { id: categoryId } });
    }
    await prisma.user.deleteMany({ where: { email: `admin_${uniqueId}@example.com` } });
    await prisma.$disconnect();
  });

  it('should allow admin to create a category', async () => {
    const res = await request(app)
      .post('/api/products/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Test Category ${uniqueId}`,
        description: 'A category for integration testing'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    categoryId = res.body.id;
  });

  it('should allow admin to create a product', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Test Product ${uniqueId}`,
        description: 'A great test product',
        price: 99.99,
        stockQuantity: 10,
        categoryId,
        brand: 'TestBrand',
        images: [{ url: 'http://example.com/img1.jpg', isPrimary: true }]
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    productId = res.body.id;
  });

  it('should fetch products via faceted search', async () => {
    const res = await request(app)
      .get('/api/products')
      .query({
        q: 'Test Product',
        brand: 'TestBrand',
        categoryId
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].name).toContain('Test Product');
  });

  it('should return 403 when a normal user tries to create a product', async () => {
    // Generate a normal user token
    const userToken = jwt.sign(
      { userId: 'fake_id', role: 'customer', twoFactorEnabled: false }, 
      process.env.JWT_ACCESS_SECRET || 'access_secret', 
      { expiresIn: '15m' }
    );

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Should Fail',
        description: 'Fail',
        price: 1,
        stockQuantity: 1,
        categoryId: 'fake'
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden: Insufficient permissions');
  });
});
