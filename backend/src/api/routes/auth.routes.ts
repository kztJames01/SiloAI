import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import prisma from '../../db/prisma';
import { AppError } from '../middleware/error.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { signOAuthState, verifyOAuthState, verifyAppleIdToken, signOAuthExchangeCode, verifyOAuthExchangeCode } from '../../utils/security';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const oauthModeSchema = z.enum(['login', 'register']);
const oauthPlatformSchema = z.enum(['web', 'mobile']);

function getMobileAppScheme() {
  return process.env.MOBILE_APP_SCHEME || 'silomobile';
}

function getApiBaseUrl() {
  return process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
}

function getFrontendBaseUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:5173';
}

function issueToken(userId: string) {
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT secret is not defined', 500);
  }
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    } as jwt.SignOptions
  );
}

async function findOrCreateOAuthUser(email: string, name?: string) {
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Random password since social users don't use password login by default.
    const randomPassword = randomBytes(24).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'FIELD',
      },
    });
  }
  return user;
}

function redirectAuthSuccess(res: any, userId: string, mode: 'login' | 'register', platform: 'web' | 'mobile' = 'web') {
  const exchangeCode = signOAuthExchangeCode(userId);
  if (platform === 'mobile') {
    const scheme = getMobileAppScheme();
    res.redirect(`${scheme}://oauth-callback?code=${encodeURIComponent(exchangeCode)}`);
    return;
  }
  const frontendBaseUrl = getFrontendBaseUrl();
  const target = mode === 'register' ? '/register' : '/login';
  res.redirect(`${frontendBaseUrl}${target}?oauth_code=${encodeURIComponent(exchangeCode)}`);
}

function redirectAuthError(res: any, message: string, platform: 'web' | 'mobile' = 'web') {
  if (platform === 'mobile') {
    const scheme = getMobileAppScheme();
    res.redirect(`${scheme}://oauth-callback?error=${encodeURIComponent(message)}`);
    return;
  }
  const frontendBaseUrl = getFrontendBaseUrl();
  res.redirect(`${frontendBaseUrl}/login?error=${encodeURIComponent(message)}`);
}

// Register
router.post('/register', async (req, res) => {
  const { email, password, name } = registerSchema.parse(req.body);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('User already exists', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'FIELD',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  const token = issueToken(user.id);

  res.status(201).json({
    user,
    token,
  });
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = issueToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Login error:', error);
    throw new AppError('Login failed', 500);
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  res.json({ user });
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

router.post('/change-password', authenticate, async (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) throw new AppError('User not found', 404);

  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) throw new AppError('Current password is incorrect', 400);

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  res.json({ success: true, message: 'Password updated' });
});

router.get('/oauth/google/start', async (req, res) => {
  const mode = oauthModeSchema.parse(req.query.mode || 'login');
  const platform = oauthPlatformSchema.parse(req.query.platform || 'web');
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new AppError('Google OAuth is not configured', 500);
  }

  const redirectUri = `${getApiBaseUrl()}/api/auth/oauth/google/callback`;
  const state = signOAuthState({ mode, platform });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    state,
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get('/oauth/google/callback', async (req, res) => {
  try {
    const code = String(req.query.code || '');
    const rawState = String(req.query.state || '');
    if (!code || !rawState) throw new AppError('Google OAuth callback is invalid', 400);

    const state = verifyOAuthState<{ mode?: string; platform?: string }>(rawState);
    const mode = oauthModeSchema.parse(state?.mode || 'login');
    const platform = oauthPlatformSchema.parse(state?.platform || 'web');

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new AppError('Google OAuth is not configured', 500);

    const redirectUri = `${getApiBaseUrl()}/api/auth/oauth/google/callback`;
    const tokenPayload = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', tokenPayload.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const accessToken = tokenResponse.data?.access_token;
    if (!accessToken) throw new AppError('Google OAuth token exchange failed', 400);

    const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const email = profileResponse.data?.email;
    const emailVerified = profileResponse.data?.email_verified;
    const name = profileResponse.data?.name;
    if (!email || emailVerified === false) throw new AppError('Google account email is not verified', 400);

    const user = await findOrCreateOAuthUser(email, name);
    redirectAuthSuccess(res, user.id, mode, platform);
  } catch (error: any) {
    const platform = (() => {
      try {
        const state = verifyOAuthState<{ platform?: string }>(String(req.query.state || ''));
        return oauthPlatformSchema.parse(state?.platform || 'web');
      } catch {
        return 'web' as const;
      }
    })();
    redirectAuthError(res, error?.message || 'Google OAuth failed', platform);
  }
});

router.get('/oauth/apple/start', async (req, res) => {
  const mode = oauthModeSchema.parse(req.query.mode || 'login');
  const platform = oauthPlatformSchema.parse(req.query.platform || 'web');
  const clientId = process.env.APPLE_CLIENT_ID;
  if (!clientId) {
    throw new AppError('Apple OAuth is not configured', 500);
  }

  const redirectUri = `${getApiBaseUrl()}/api/auth/oauth/apple/callback`;
  const state = signOAuthState({ mode, platform });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    response_mode: 'form_post',
    scope: 'name email',
    state,
  });

  res.redirect(`https://appleid.apple.com/auth/authorize?${params.toString()}`);
});

const appleCallbackHandler = async (req: any, res: any) => {
  try {
    const code = String(req.body?.code || req.query?.code || '');
    const rawState = String(req.body?.state || req.query?.state || '');
    if (!code || !rawState) throw new AppError('Apple OAuth callback is invalid', 400);

    const state = verifyOAuthState<{ mode?: string; platform?: string }>(rawState);
    const mode = oauthModeSchema.parse(state?.mode || 'login');
    const platform = oauthPlatformSchema.parse(state?.platform || 'web');

    const clientId = process.env.APPLE_CLIENT_ID;
    const clientSecret = process.env.APPLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new AppError('Apple OAuth is not configured', 500);

    const redirectUri = `${getApiBaseUrl()}/api/auth/oauth/apple/callback`;
    const tokenPayload = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    const tokenResponse = await axios.post('https://appleid.apple.com/auth/token', tokenPayload.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const idToken = tokenResponse.data?.id_token;
    if (!idToken) throw new AppError('Apple OAuth token exchange failed', 400);

    const verified = await verifyAppleIdToken(idToken, clientId);
    const email = verified?.email;
    const name = verified?.name || 'Apple User';
    if (!email) throw new AppError('Apple account has no email', 400);

    const user = await findOrCreateOAuthUser(email, name);
    redirectAuthSuccess(res, user.id, mode, platform);
  } catch (error: any) {
    const platform = (() => {
      try {
        const rawState = String(req.body?.state || req.query?.state || '');
        const state = verifyOAuthState<{ platform?: string }>(rawState);
        return oauthPlatformSchema.parse(state?.platform || 'web');
      } catch {
        return 'web' as const;
      }
    })();
    redirectAuthError(res, error?.message || 'Apple OAuth failed', platform);
  }
};

router.post('/oauth/apple/callback', appleCallbackHandler);
router.get('/oauth/apple/callback', appleCallbackHandler);

const oauthExchangeSchema = z.object({ code: z.string().min(1) });

router.post('/oauth/exchange', async (req, res) => {
  const { code } = oauthExchangeSchema.parse(req.body);
  const userId = verifyOAuthExchangeCode(code);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) throw new AppError('User not found', 404);

  const token = issueToken(user.id);
  res.json({ user, token });
});

export default router;
