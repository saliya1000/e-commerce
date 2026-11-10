import { Request, Response, NextFunction } from 'express';
import {
  getActivitySummary,
  getUserSessions,
  getActivityLogs,
  getUserActivityDossier,
  exportActivityLogs
} from './activityLog.controller';
import prisma from '../prisma';

jest.mock('../prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn()
    },
    userSession: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn()
    },
    auditLog: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn()
    }
  }
}));

describe('Activity Log Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  describe('Authorization check', () => {
    it('should deny non-superadmin users (e.g. admin)', async () => {
      mockReq = {
        user: { userId: 'admin-1', role: 'admin', twoFactorEnabled: true }
      };

      await getActivitySummary(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Only superadmins') })
      );
    });

    it('should deny support and sales roles', async () => {
      mockReq = {
        user: { userId: 'support-1', role: 'support', twoFactorEnabled: false }
      };

      await getUserSessions(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);

      mockReq.user!.role = 'sales';
      await getActivityLogs(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getActivitySummary', () => {
    it('should return role summary and staff users stats for superadmin', async () => {
      mockReq = {
        user: { userId: 'super-1', role: 'superadmin', twoFactorEnabled: true }
      };

      const mockStaff = [
        { id: 'u1', email: 'admin@test.com', firstName: 'A', lastName: 'U', role: 'admin', twoFactorEnabled: true, createdAt: new Date() },
        { id: 'u2', email: 'support@test.com', firstName: 'S', lastName: 'U', role: 'support', twoFactorEnabled: false, createdAt: new Date() }
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockStaff);
      (prisma.userSession.findMany as jest.Mock)
        .mockResolvedValueOnce([{ userId: 'u1', loginTime: new Date() }]) // active
        .mockResolvedValueOnce([{ userId: 'u1', loginTime: new Date() }]); // latest
      (prisma.userSession.groupBy as jest.Mock).mockResolvedValue([{ userId: 'u1', _count: { id: 5 } }]);
      (prisma.auditLog.groupBy as jest.Mock).mockResolvedValue([{ userId: 'u1', _count: { id: 12 } }]);
      (prisma.auditLog.count as jest.Mock)
        .mockResolvedValueOnce(3) // today
        .mockResolvedValueOnce(15); // total

      await getActivitySummary(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          rolesSummary: expect.any(Object),
          staffUsers: expect.any(Array),
          stats: expect.objectContaining({
            totalStaff: 2,
            activeSessionsNow: 1
          })
        })
      );
    });
  });

  describe('getUserSessions', () => {
    it('should return paginated sessions for superadmin', async () => {
      mockReq = {
        user: { userId: 'super-1', role: 'superadmin', twoFactorEnabled: true },
        query: { page: '1', limit: '10' }
      };

      (prisma.userSession.count as jest.Mock).mockResolvedValue(1);
      (prisma.userSession.findMany as jest.Mock).mockResolvedValue([
        {
          id: 's1',
          userId: 'u1',
          loginTime: new Date(Date.now() - 3600000),
          logoutTime: new Date(),
          status: 'LOGGED_OUT',
          ipAddress: '127.0.0.1',
          userAgent: 'Chrome',
          user: { id: 'u1', email: 'admin@test.com', firstName: 'A', lastName: 'U', role: 'admin' }
        }
      ]);

      await getUserSessions(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          sessions: expect.arrayContaining([
            expect.objectContaining({
              id: 's1',
              status: 'LOGGED_OUT',
              durationFormatted: expect.any(String)
            })
          ]),
          pagination: expect.objectContaining({
            page: 1,
            limit: 10,
            totalCount: 1
          })
        })
      );
    });
  });
});
