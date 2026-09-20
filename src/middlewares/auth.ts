import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, hashToken } from '../utils/jwt';
import prisma from '../prisma';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);

    const hashedAT = hashToken(token);
    const isRevoked = await prisma.revokedAccessToken.findUnique({
      where: { tokenHash: hashedAT }
    });

    if (isRevoked) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);

    const hashedAT = hashToken(token);
    const isRevoked = await prisma.revokedAccessToken.findUnique({
      where: { tokenHash: hashedAT }
    });

    if (isRevoked) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (roles: string | string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }


    next();
  };
};
