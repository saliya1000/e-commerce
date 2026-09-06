import { Request, Response, NextFunction } from 'express';
import { register, login } from '../../src/controllers/auth.controller';
import prisma from '../../src/prisma';
import bcrypt from 'bcrypt';

jest.mock('../../src/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
    }
  }
}));

jest.mock('bcrypt');

describe('Auth Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('register', () => {
    // it('should return 400 if captcha is missing or invalid', async () => {
    //   mockReq.body = { email: 'test@example.com', password: 'password' }; // no captcha
    //   await register(mockReq as Request, mockRes as Response, nextFunction);
    //   expect(mockRes.status).toHaveBeenCalledWith(400);
    //   expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid CAPTCHA' });
    // });

    it('should return 400 if email is already in use', async () => {
      mockReq.body = { email: 'test@example.com', password: 'password', captchaToken: 'valid_mock_token' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1' }); // User exists

      await register(mockReq as Request, mockRes as Response, nextFunction);
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'User with this email already exists' });
    });

    it('should successfully register a new user', async () => {
      mockReq.body = { email: 'new@example.com', password: 'password', captchaToken: 'valid_mock_token' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (prisma.user.create as jest.Mock).mockResolvedValue({ id: '2', email: 'new@example.com', passwordHash: 'hashedPassword' });

      await register(mockReq as Request, mockRes as Response, nextFunction);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User registered successfully',
        user: expect.objectContaining({ email: 'new@example.com' })
      }));
    });
  });

  describe('login', () => {
    it('should return 401 for invalid credentials', async () => {
      mockReq.body = { email: 'test@example.com', password: 'wrong' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await login(mockReq as Request, mockRes as Response, nextFunction);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid email or password' });
    });
  });
});
