import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/prisma';
import jwt from 'jsonwebtoken';
import { generateAccessToken } from '../../src/utils/jwt';

describe('Checkout Integration Test', () => {
  let token: string;
  let user: any;
  let category: any;
  let product: any;

  beforeAll(async () => {
    // Clean up
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.user.deleteMany({});

    // Create a test user
    user = await prisma.user.create({
      data: {
        email: 'checkout@test.com',
        passwordHash: 'hashed',
        role: 'user',
      }
    });

    // Generate token
    token = generateAccessToken(user.id, user.role);

    // Create a test category
    category = await prisma.category.create({
      data: {
        name: 'Test Category',
        description: 'Test',
      }
    });

    // Create a test product
    product = await prisma.product.create({
      data: {
        name: 'Integration Toy',
        description: 'Test',
        price: 20,
        stockQuantity: 10,
        brand: 'TestBrand',
        categoryId: category.id,
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should complete checkout flow', async () => {
    // 1. Add item to cart
    const addRes = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product.id, quantity: 2 });
    
    expect(addRes.status).toBe(200);

    // 2. Checkout
    const checkoutRes = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shippingAddress: {
          line1: '123 Main St',
          city: 'Anytown',
          country: 'Finland',
          postal_code: '00100',
          phone: '+358401234567'
        }
      });
    
    expect(checkoutRes.status).toBe(200);
    expect(checkoutRes.body.clientSecret).toBeDefined();
    expect(checkoutRes.body.orderId).toBeDefined();

    // 3. Verify order created in DB
    const order = await prisma.order.findUnique({
      where: { id: checkoutRes.body.orderId },
      include: { items: true }
    });

    expect(order).toBeDefined();
    expect(order?.status).toBe('Pending Payment');
    expect(order?.totalAmount.toNumber()).toBe(45); // 2 * 20 + 5 standard shipping
    expect(order?.items.length).toBe(1);

    // 4. Verify cart is cleared
    const cart = await prisma.cart.findFirst({
      where: { userId: user.id },
      include: { items: true }
    });
    
    // The cart itself remains, but items should be cleared by the checkout process
    // Wait, let's check if our checkout logic clears the cart items. 
    // Wait! Did I implement cart clearing on checkout? Let's check `order.controller.ts`!
  });
});
