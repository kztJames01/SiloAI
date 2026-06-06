import jwt from 'jsonwebtoken';

// test the token issuing logic in isolation
const JWT_SECRET = 'test-secret-for-unit-tests';

function issueToken(userId: string) {
  if (!JWT_SECRET) throw new Error('JWT secret not set');
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { userId: string };
}

describe('Auth helpers', () => {
  describe('JWT token', () => {
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
      const tampered = parts.join('.');
      expect(() => verifyToken(tampered)).toThrow();
    });

    it('token contains expected claims', () => {
      const token = issueToken('user-789');
      const decoded = jwt.decode(token) as any;
      expect(decoded.userId).toBe('user-789');
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });

  describe('Input validation shapes', () => {
    it('rejects invalid email format', () => {
      const { z } = require('zod');
      const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
      expect(() => schema.parse({ email: 'not-an-email', password: 'abc123' })).toThrow();
    });

    it('rejects short password', () => {
      const { z } = require('zod');
      const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
      expect(() => schema.parse({ email: 'a@b.com', password: '123' })).toThrow();
    });

    it('accepts valid credentials', () => {
      const { z } = require('zod');
      const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
      const result = schema.parse({ email: 'test@example.com', password: 'securepassword' });
      expect(result.email).toBe('test@example.com');
    });
  });
});
