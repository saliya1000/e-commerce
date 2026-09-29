import { requireAuth, requireRole } from './auth';
import { Request, Response, NextFunction } from 'express';
import { generateAccessToken } from '../utils/jwt';
import prisma from '../prisma';

jest.mock('../prisma', () => ({
  __esModule: true,
  default: {
    revokedAccessToken: {
      findUnique: jest.fn()
    }
  }
}));
describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('should return 401 if no authorization header is present', () => {
    mockRequest = { headers: {} };
    requireAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Authentication required' });
  });

  it('should call next if a valid token is provided', async () => {
    const token = generateAccessToken('123', 'customer');
    mockRequest = {
      headers: { authorization: `Bearer ${token}` }
    };

    (prisma.revokedAccessToken.findUnique as jest.Mock).mockResolvedValue(null);

    await requireAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect((mockRequest as Request).user).toBeDefined();
    expect((mockRequest as Request).user?.userId).toBe('123');
  });

  it('requireRole should return 403 if user lacks role', () => {
    mockRequest = { user: { userId: '123', role: 'customer', twoFactorEnabled: false } };
    const middleware = requireRole('admin');
    
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);
    
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Forbidden: Insufficient permissions' });
  });

  it('requireRole should call next if user has role', () => {
    mockRequest = { user: { userId: '123', role: 'admin', twoFactorEnabled: true } };
    const middleware = requireRole('admin');
    
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);
    
    expect(nextFunction).toHaveBeenCalled();
  });
});
