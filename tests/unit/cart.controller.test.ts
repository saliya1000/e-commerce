import { Request, Response, NextFunction } from 'express';
import { getCart, addToCart } from '../../src/controllers/cart.controller';
import prisma from '../../src/prisma';

jest.mock('../../src/prisma', () => ({
  __esModule: true,
  default: {
    cart: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    cartItem: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    }
  }
}));

describe('Cart Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockReq = { 
      user: { userId: 'user123', email: 'test@test.com', role: 'user' } as any,
      query: {},
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('should return empty cart if not found', async () => {
      (prisma.cart.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.cart.create as jest.Mock).mockResolvedValue({ id: 'cart1', items: [] });

      await getCart(mockReq as Request, mockRes as Response);

      expect(prisma.cart.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        include: { items: { include: { product: { include: { images: true } } }, orderBy: { createdAt: 'asc' } } }
      });
      expect(mockRes.json).toHaveBeenCalledWith({ id: 'cart1', items: [] });
    });

    it('should return cart with items', async () => {
      const mockCart = { id: 'cart1', items: [{ id: 'item1', quantity: 2 }] };
      (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);

      await getCart(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(mockCart);
    });
  });

  describe('addItemToCart', () => {
    it('should add new item if not exists', async () => {
      mockReq.body = { productId: 'prod1', quantity: 1 };
      
      const mockCart = { id: 'cart1', items: [] };
      (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);
      (prisma.cartItem.findUnique as jest.Mock).mockResolvedValue(null); // Item not in cart
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({ id: 'prod1', stockQuantity: 10, isEnabled: true });

      await addToCart(mockReq as Request, mockRes as Response);

      expect(prisma.cartItem.create).toHaveBeenCalledWith({
        data: {
          cartId: 'cart1',
          productId: 'prod1',
          quantity: 1,
        }
      });
      expect(mockRes.json).toHaveBeenCalled();
    });
  });
});
