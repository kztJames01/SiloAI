import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { AppError } from '../api/middleware/error.middleware';

const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

function isPrivateIp(host: string): boolean {
  if (host.includes(':')) {
    const h = host.toLowerCase();
    if (h === '::1' || h.startsWith('fe80:') || h.startsWith('fc') || h.startsWith('fd')) return true;
    return false;
  }
  const parts = host.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

export function assertSafeOutboundUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new AppError('Invalid URL', 400);
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new AppError('Only http/https URLs are allowed', 400);
  }

  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host) || isPrivateIp(host) || host.endsWith('.local')) {
    throw new AppError('Blocked URL target', 400);
  }

  return parsed;
}

export function signOAuthState(payload: Record<string, unknown>): string {
  if (!process.env.JWT_SECRET) throw new AppError('JWT secret is not defined', 500);
  const data = Buffer.from(JSON.stringify({ ...payload, nonce: crypto.randomBytes(12).toString('hex'), ts: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', process.env.JWT_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyOAuthState<T extends Record<string, unknown>>(state: string): T {
  if (!process.env.JWT_SECRET) throw new AppError('JWT secret is not defined', 500);
  const [data, sig] = state.split('.');
  if (!data || !sig) throw new AppError('Invalid OAuth state', 400);

  const expected = crypto.createHmac('sha256', process.env.JWT_SECRET).update(data).digest('base64url');
  if (sig !== expected) throw new AppError('Invalid OAuth state', 400);

  const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as T & { ts?: number };
  if (!payload.ts || Date.now() - payload.ts > 10 * 60 * 1000) {
    throw new AppError('OAuth state expired', 400);
  }
  return payload;
}

let appleKeysCache: { keys: any[]; at: number } | null = null;

export async function verifyAppleIdToken(idToken: string, clientId: string) {
  const decoded = jwt.decode(idToken, { complete: true }) as any;
  if (!decoded?.header?.kid) throw new AppError('Apple token invalid', 400);

  const now = Date.now();
  if (!appleKeysCache || now - appleKeysCache.at > 60 * 60 * 1000) {
    const res = await axios.get('https://appleid.apple.com/auth/keys');
    appleKeysCache = { keys: res.data.keys, at: now };
  }

  const jwk = appleKeysCache.keys.find((k: any) => k.kid === decoded.header.kid);
  if (!jwk) throw new AppError('Apple signing key not found', 400);

  const pubKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const verified = jwt.verify(idToken, pubKey, {
    algorithms: ['RS256'],
    issuer: 'https://appleid.apple.com',
    audience: clientId,
  }) as any;

  return verified;
}

export function ensureProductionSecrets() {
  if (process.env.NODE_ENV !== 'production') return;

  const weakJwt = !process.env.JWT_SECRET || process.env.JWT_SECRET === 'change-me';
  const weakEnc = !process.env.INTEGRATION_ENCRYPTION_KEY || process.env.INTEGRATION_ENCRYPTION_KEY.length < 32;

  if (weakJwt || weakEnc) {
    throw new Error('Set strong JWT_SECRET and INTEGRATION_ENCRYPTION_KEY (32+ chars) in production');
  }
}
