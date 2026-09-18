import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

export const auditLogger = async (req: Request, res: Response, next: NextFunction) => {
  res.on('finish', async () => {
    try {
      if (req.user && req.user.userId) {
        const safeBody = { ...req.body };
        if (safeBody.password) safeBody.password = '[REDACTED]';
        
        await prisma.auditLog.create({
          data: {
            userId: req.user.userId,
            action: req.method,
            resource: req.originalUrl,
            details: JSON.stringify(safeBody),
            ipAddress: req.ip || req.connection?.remoteAddress || null
          }
        });
      }
    } catch (error) {
      console.error('Audit Logger Error:', error);
    }
  });

  next();
};
