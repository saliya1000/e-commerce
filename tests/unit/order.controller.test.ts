import { Request, Response, NextFunction } from 'express';
import { checkout } from '../../src/controllers/order.controller';
import prisma from '../../src/prisma';

jest.mock('../../src/prisma', () => ({
  __esModule: true,
  default: {
    cart: {
      findUnique: jest.fn(),
    },
    cartItem: {
      deleteMany: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    }
  }
}));

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        client_secret: 'pi_test_secret_123',
        id: 'pi_123'
      })
    }
  }));
});

describe('Order Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockReq = { 
      user: { userId: 'user123', email: 'test@test.com', role: 'user' } as any,
      body: {
        shippingAddress: {
          line1: '123 Main St',
          city: 'Anytown',
          country: 'Finland',
          postal_code: '00100',
          phone: '+358401234567'
        }
      }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('checkout', () => {
    it('should fail if cart is empty', async () => {
      (prisma.cart.findUnique as jest.Mock).mockResolvedValue(null);

      await checkout(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Cart is empty' });
    });

    it('should create order and return client secret', async () => {
      const mockCart = {
        id: 'cart1',
        items: [
          {
            product: { id: 'prod1', price: 10, stockQuantity: 10, name: 'Test Product' },
            quantity: 2
          }
        ]
      };
      
      (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);
      (prisma.order.create as jest.Mock).mockResolvedValue({ id: 'order1' });

      await checkout(mockReq as Request, mockRes as Response);

      expect(prisma.order.create).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        clientSecret: 'pi_test_secret_123',
        orderId: 'order1'
      });
    });
  });
});
