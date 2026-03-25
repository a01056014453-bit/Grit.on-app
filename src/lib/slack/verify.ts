import crypto from 'crypto';

const FIVE_MINUTES = 60 * 5;

export function verifySlackRequest(
  signingSecret: string,
  headers: { timestamp: string; signature: string },
  rawBody: string
): boolean {
  const ts = parseInt(headers.timestamp, 10);
  const now = Math.floor(Date.now() / 1000);

  if (now - ts > FIVE_MINUTES) return false;

  const baseString = `v0:${headers.timestamp}:${rawBody}`;
  const computed =
    'v0=' +
    crypto
      .createHmac('sha256', signingSecret)
      .update(baseString, 'utf8')
      .digest('hex');

  const a = Buffer.from(computed, 'utf8');
  const b = Buffer.from(headers.signature, 'utf8');

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}
