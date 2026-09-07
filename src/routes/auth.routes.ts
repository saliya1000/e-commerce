import { Router } from 'express';
import { register, login, refresh, logout, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, generate2fa, verify2fa, forgotPassword, resetPassword, googleCallback, updateProfile, updatePassword, updateProfileSchema, updatePasswordSchema, deleteAccount, deleteAccountSchema } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate';
import { requireAuth } from '../middlewares/auth';
import passport from '../config/passport';

const router = Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// 2FA Routes (requires auth to set up)
router.post('/2fa/generate', requireAuth, generate2fa);
router.post('/2fa/verify', requireAuth, verify2fa);

// Password Reset
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword);

// Profile Updates
router.put('/profile', requireAuth, validateRequest(updateProfileSchema), updateProfile);
router.put('/password', requireAuth, validateRequest(updatePasswordSchema), updatePassword);

// Account Deletion
router.delete('/account', requireAuth, validateRequest(deleteAccountSchema), deleteAccount);

// Google OAuth
router.get('/google', (req, res, next) => {
  const state = req.query.state ? String(req.query.state) : undefined;
  passport.authenticate('google', { scope: ['profile', 'email'], state })(req, res, next);
});
router.get('/google/callback', passport.authenticate('google', { session: false }), googleCallback);

export default router;
