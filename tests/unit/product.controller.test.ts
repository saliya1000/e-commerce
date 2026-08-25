import { Request, Response, NextFunction } from 'express';
import { getProducts, suggestProducts } from '../../src/controllers/product.controller';
import prisma from '../../src/prisma';

jest.mock('../../src/prisma', () => ({
  __esModule: true,
  default: {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
    }
  }
}));

describe('Product Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockReq = { query: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should map query params to prisma query', async () => {
      mockReq.query = {
        q: 'dog food',
        categoryId: 'cat123',
        minPrice: '10',
        maxPrice: '50'
      };

      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(0);

      await getProducts(mockReq as Request, mockRes as Response, nextFunction);

      expect(prisma.product.findMany).toHaveBeenCalled();
      const callArgs = (prisma.product.findMany as jest.Mock).mock.calls[0][0];
      
      expect(callArgs.where.categoryId).toBe('cat123');
      expect(callArgs.where.price.gte).toBe(10);
      expect(callArgs.where.price.lte).toBe(50);
      expect(callArgs.where.OR).toBeDefined(); // Contains the full text search logic
    });
  });

  describe('suggestProducts', () => {
    it('should return empty array if no query provided', async () => {
      mockReq.query = {};
      await suggestProducts(mockReq as Request, mockRes as Response, nextFunction);
      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it('should fetch suggestions based on query', async () => {
      mockReq.query = { q: 'toy' };
      const mockResult = [{ id: '1', name: 'Dog Toy', brand: 'Kong' }];
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockResult);

      await suggestProducts(mockReq as Request, mockRes as Response, nextFunction);
      expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({
        take: 5
      }));
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });
  });
});
