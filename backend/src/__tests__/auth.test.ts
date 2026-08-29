import jwt from 'jsonwebtoken';
import { z } from 'zod';

// mirrors production register/login validation — tests must track auth.routes.ts
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const JWT_SECRET = 'test-secret-for-unit-tests';

function issueToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { userId: string };
}

describe('Auth token crypto', () => {
  it('issues a valid token with userId', () => {
    const token = issueToken('user-123');
    expect(typeof token).toBe('string');
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe('user-123');
  });

  it('rejects a tampered token', () => {
    const token = issueToken('user-456');
    const parts = token.split('.');
    parts[1] = Buffer.from(JSON.stringify({ userId: 'hacker' })).toString('base64url');
    expect(() => verifyToken(parts.join('.'))).toThrow();
  });

  it('rejects token signed with wrong secret', () => {
    const evil = jwt.sign({ userId: 'hacker' }, 'wrong-secret', { expiresIn: '7d' });
    expect(() => verifyToken(evil)).toThrow();
  });
});

describe('Registration validation (production rules)', () => {
  it('rejects invalid email', () => {
    expect(() => registerSchema.parse({ email: 'not-an-email', password: 'abcdefgh' })).toThrow();
  });

  it('rejects password shorter than 8 chars', () => {
    expect(() => registerSchema.parse({ email: 'a@b.com', password: '1234567' })).toThrow();
  });

  it('strips unknown role field without using it — role is server-assigned', () => {
    const parsed = registerSchema.parse({
      email: 'test@example.com',
      password: 'securepassword',
      role: 'ADMIN',
    } as any);
    expect((parsed as any).role).toBeUndefined();
  });

  it('accepts valid registration payload', () => {
    const result = registerSchema.parse({ email: 'test@example.com', password: 'securepassword' });
    expect(result.email).toBe('test@example.com');
  });
});

describe('Login validation', () => {
  it('allows short passwords on login (legacy accounts)', () => {
    const result = loginSchema.parse({ email: 'a@b.com', password: '123' });
    expect(result.password).toBe('123');
  });
});
