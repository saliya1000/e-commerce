import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const generateAccessToken = (userId: string, role: string) => {
  const secret = process.env.JWT_ACCESS_SECRET || 'access_secret';
  // Short-lived access token (15-60 mins as per requirement, let's do 15m)
  return jwt.sign({ userId, role }, secret, { expiresIn: '15m' });
};

export const generateRefreshToken = (userId: string) => {
  const secret = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
  // Longer-lived refresh token (3-7 days as per requirement, let's do 7d)
  // Include a random jti (JWT ID) to ensure uniqueness if generated multiple times per second
  return jwt.sign({ userId, jti: crypto.randomUUID() }, secret, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string) => {
  const secret = process.env.JWT_ACCESS_SECRET || 'access_secret';
  return jwt.verify(token, secret) as { userId: string, role: string };
};

export const verifyRefreshToken = (token: string) => {
  const secret = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
  return jwt.verify(token, secret) as { userId: string };
};

// Generate a cryptographic hash of the refresh token to store in the DB
export const hashToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
