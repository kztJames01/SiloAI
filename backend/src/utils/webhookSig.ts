import crypto from 'crypto';

export function parseSignatureHeader(header?: string | string[]) {
  if (!header) return null;
  const raw = Array.isArray(header) ? header[0] : header;
  const hex = raw.startsWith('sha256=') ? raw.slice(7) : raw;
  if (!/^[a-f0-9]{64}$/i.test(hex)) return null;
  return hex;
}

export function hmacSha256Hex(secret: string, body: Buffer | string) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

export function signaturesMatch(secret: string, body: Buffer | string, header?: string | string[]) {
  const provided = parseSignatureHeader(header);
  if (!provided) return false;
  const expected = hmacSha256Hex(secret, body);
  try {
    return crypto.timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}
