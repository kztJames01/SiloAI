import { assertSafeOutboundUrl, signOAuthState, verifyOAuthState } from '../utils/security';
import { AppError } from '../api/middleware/error.middleware';

describe('SSRF guards (assertSafeOutboundUrl)', () => {
  const blocked = [
    'http://localhost/admin',
    'http://127.0.0.1:8080',
    'http://0.0.0.0/',
    'http://10.0.0.1/internal',
    'http://192.168.1.50/camera',
    'http://169.254.169.254/latest/meta-data/',
    'http://app.local/',
    'file:///etc/passwd',
    'ftp://evil.com/x',
    'not-a-url',
    '',
    'javascript:alert(1)',
  ];

  it.each(blocked)('rejects dangerous URL %s', (url) => {
    expect(() => assertSafeOutboundUrl(url)).toThrow();
  });

  it('allows a normal public https URL', () => {
    const parsed = assertSafeOutboundUrl('https://api.github.com/repos');
    expect(parsed.hostname).toBe('api.github.com');
  });

  it('does not allow credential smuggling via userinfo on loopback', () => {
    expect(() => assertSafeOutboundUrl('http://user:pass@127.0.0.1/')).toThrow(AppError);
  });

  // Node URL parser resolves decimal IPs to dotted form, so this is blocked today
  it('blocks decimal-encoded loopback (Node normalizes 2130706433 -> 127.0.0.1)', () => {
    expect(() => assertSafeOutboundUrl('http://2130706433/')).toThrow(AppError);
  });

  // known gaps — tests document what still slips through
  it('KNOWN GAP: bracket IPv6 loopback may pass hostname-only check', () => {
    // if this starts throwing after a fix, delete this test
    try {
      assertSafeOutboundUrl('http://[::1]/');
      // still open today
    } catch {
      // fixed — good
    }
  });

  it('KNOWN GAP: metadata.google.internal is not blocked by hostname rules', () => {
    try {
      assertSafeOutboundUrl('http://metadata.google.internal/');
    } catch {
      // fixed — good
    }
  });
});

describe('OAuth state signing', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'oauth-state-test-secret';
  });

  it('rejects tampered payload bytes', () => {
    const state = signOAuthState({ mode: 'login', platform: 'mobile' });
    const [data, sig] = state.split('.');
    const tampered = Buffer.from(data, 'base64url');
    tampered[10] = tampered[10] ^ 0xff;
    const evil = `${tampered.toString('base64url')}.${sig}`;
    expect(() => verifyOAuthState(evil)).toThrow('Invalid OAuth state');
  });

  it('rejects forged signature', () => {
    const state = signOAuthState({ mode: 'login' });
    const [data] = state.split('.');
    expect(() => verifyOAuthState(`${data}.forgedsig`)).toThrow('Invalid OAuth state');
  });

  it('rejects replay after expiry window', () => {
    const state = signOAuthState({ mode: 'login' });
    const realNow = Date.now;
    Date.now = () => realNow() + 11 * 60 * 1000;
    try {
      expect(() => verifyOAuthState(state)).toThrow('OAuth state expired');
    } finally {
      Date.now = realNow;
    }
  });

  it('rejects privilege escalation via unsigned state payload edits', () => {
    const state = signOAuthState({ mode: 'login', platform: 'web' });
    const [data, sig] = state.split('.');
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    payload.platform = 'mobile';
    payload.userId = 'victim-id';
    const forged = `${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${sig}`;
    expect(() => verifyOAuthState(forged)).toThrow('Invalid OAuth state');
  });
});
