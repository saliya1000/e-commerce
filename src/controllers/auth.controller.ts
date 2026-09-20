import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../prisma';
import { generateAccessToken, generateRefreshToken, hashToken, verifyRefreshToken } from '../utils/jwt';
import Joi from 'joi';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { sendPasswordResetEmail } from '../utils/mailer';
import jwt from 'jsonwebtoken';

// Schemas
export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  captchaToken: Joi.string().required() // Mock CAPTCHA requirement
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  twoFactorToken: Joi.string().optional()
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).required()
});

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().allow('').optional(),
  lastName: Joi.string().allow('').optional()
});

export const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().optional(), // Optional — not required for OAuth users who have no password yet
  newPassword: Joi.string().min(8).required()
});

export const deleteAccountSchema = Joi.object({
  email: Joi.string().email().required(),
  // Local users supply their password; OAuth users supply confirmationText instead
  password: Joi.string().optional(),
  confirmationText: Joi.string().optional()
});

// Controllers
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, captchaToken } = req.body;

    // Real CAPTCHA verification
    if (process.env.NODE_ENV !== 'test') {
      const secretKey = process.env.RECAPTCHA_SECRET_KEY;
      const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`;
      
      const recaptchaRes = await fetch(verifyUrl, { method: 'POST' });
      const recaptchaData = await recaptchaRes.json();
      
      if (!recaptchaData.success) {
        return res.status(400).json({ error: 'Invalid CAPTCHA validation' });
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
      select: { id: true, email: true, role: true, createdAt: true }
    });

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, twoFactorToken } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 2FA check
    if (user.twoFactorEnabled) {
      if (!twoFactorToken) {
        return res.status(401).json({ error: '2FA token required' });
      }
      
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token: twoFactorToken
      });

      if (!verified) {
        return res.status(401).json({ error: 'Invalid 2FA token' });
      }
    }

    // Generate Tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    const hashedRT = hashToken(refreshToken);

    // Save refresh token in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        tokenHash: hashedRT,
        userId: user.id,
        expiresAt
      }
    });

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // For local dev, force false to avoid https requirement issues
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ accessToken, user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, hasPassword: !!user.passwordHash } });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token not found' });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const hashedRT = hashToken(refreshToken);
    const savedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashedRT }
    });

    if (!savedToken || savedToken.isRevoked) {
      // If a revoked token is used, it means it was leaked. We should revoke ALL tokens for this user ideally, but for now we'll just deny.
      if (savedToken && savedToken.isRevoked) {
        console.warn(`Attempted to use revoked token for user ${savedToken.userId}`);
      }
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: savedToken.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    // Revoke old token
    await prisma.refreshToken.update({
      where: { id: savedToken.id },
      data: { isRevoked: true }
    });

    // Generate new Tokens (Refresh Token Rotation)
    const newAccessToken = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);
    const newHashedRT = hashToken(newRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        tokenHash: newHashedRT,
        userId: user.id,
        expiresAt
      }
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: false, // For local dev, force false to avoid https requirement issues
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ 
      accessToken: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        hasPassword: !!user.passwordHash
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;

    // Revoke Refresh Token if present
    if (refreshToken) {
      const hashedRT = hashToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hashedRT },
        data: { isRevoked: true }
      });
    }

    // Revoke Access Token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.split(' ')[1];
      try {
        const decoded = jwt.decode(accessToken) as jwt.JwtPayload;
        if (decoded && decoded.exp) {
          const expiresAt = new Date(decoded.exp * 1000);
          const hashedAT = hashToken(accessToken);
          
          await prisma.revokedAccessToken.upsert({
            where: { tokenHash: hashedAT },
            update: {},
            create: {
              tokenHash: hashedAT,
              expiresAt
            }
          });
        }
      } catch (err) {
        console.warn('Failed to parse access token during logout');
      }
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: false, // Match the setting used when setting the cookie
      sameSite: 'lax'
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const generate2fa = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.twoFactorEnabled) return res.status(400).json({ error: '2FA is already enabled' });

    const secret = speakeasy.generateSecret({ name: `ILoveShopping (${user.email})` });

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 }
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

    res.json({
      secret: secret.base32,
      qrCodeUrl
    });
  } catch (error) {
    next(error);
  }
};

export const verify2fa = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { token } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA setup incomplete' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });

    if (verified) {
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true }
      });
      res.json({ message: '2FA enabled successfully' });
    } else {
      res.status(400).json({ error: 'Invalid 2FA token' });
    }
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(200).json({ message: 'If an account exists, a reset link has been sent.' });
    }

    const secret = process.env.JWT_ACCESS_SECRET + user.passwordHash;
    const token = jwt.sign({ email: user.email, id: user.id }, secret, { expiresIn: '15m' });

    await sendPasswordResetEmail(user.email, token);
    res.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.decode(token) as { email: string, id: string } | null;
    if (!decoded) return res.status(400).json({ error: 'Invalid token' });

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.passwordHash) return res.status(400).json({ error: 'Invalid token' });

    const secret = process.env.JWT_ACCESS_SECRET + user.passwordHash;
    try {
      jwt.verify(token, secret);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

export const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as any; // From Passport
    if (!user) return res.status(401).json({ error: 'OAuth failed' });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    const hashedRT = hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        tokenHash: hashedRT,
        userId: user.id,
        expiresAt
      }
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // For local dev, force false to avoid https requirement issues
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Redirect to the frontend with token and user payload in the URL hash
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const userPayload = Buffer.from(JSON.stringify({ 
      id: user.id, 
      email: user.email, 
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      hasPassword: !!user.passwordHash
    })).toString('base64');
    
    let redirectUrl = `${clientUrl}/oauth/callback#token=${accessToken}&user=${userPayload}`;
    if (req.query.state) {
      redirectUrl += `&redirect=${encodeURIComponent(String(req.query.state))}`;
    }
    
    res.redirect(redirectUrl);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { firstName, lastName } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { firstName, lastName },
      select: { id: true, email: true, role: true, firstName: true, lastName: true, createdAt: true }
    });

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isOAuthUser = !user.passwordHash;

    if (isOAuthUser) {
      // OAuth user (e.g. Google) — no existing password, allow setting one directly
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash }
      });
      return res.json({ message: 'Password set successfully' });
    } else {
      // Local auth user — must verify their current password first
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to change your password' });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash!);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid current password' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash }
      });
      return res.json({ message: 'Password changed successfully' });
    }
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { email, password, confirmationText } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Step 1 — Always verify the email matches (prevents token misuse)
    if (user.email !== email) {
      return res.status(400).json({ error: 'Email does not match your account' });
    }

    const isOAuthUser = !user.passwordHash;

    if (isOAuthUser) {
      // OAuth path — no password to verify, require explicit "DELETE" confirmation text instead
      if (!confirmationText || confirmationText.trim().toUpperCase() !== 'DELETE') {
        return res.status(400).json({ error: 'Please type DELETE to confirm account deletion' });
      }
    } else {
      // Local auth path — verify password
      if (!password) {
        return res.status(400).json({ error: 'Password is required to delete your account' });
      }
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash!);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    // Revoke Refresh Token if present
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      const hashedRT = hashToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hashedRT },
        data: { isRevoked: true }
      });
    }

    // Revoke Access Token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.split(' ')[1];
      try {
        const decoded = jwt.decode(accessToken) as jwt.JwtPayload;
        if (decoded && decoded.exp) {
          const expiresAt = new Date(decoded.exp * 1000);
          const hashedAT = hashToken(accessToken);
          
          await prisma.revokedAccessToken.upsert({
            where: { tokenHash: hashedAT },
            update: {},
            create: {
              tokenHash: hashedAT,
              expiresAt
            }
          });
        }
      } catch (err) {
        console.warn('Failed to parse access token during account deletion');
      }
    }

    // Clear cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax'
    });

    // Delete user (cascades to related data via Prisma schema)
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'Account permanently deleted' });
  } catch (error) {
    next(error);
  }
};
