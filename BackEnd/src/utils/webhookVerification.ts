import crypto from 'crypto';

export const verifyGitHubSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  const sigHashAlg = 'sha256';
  const sig = signature.split('=');

  if (sig.length !== 2 || sig[0] !== sigHashAlg) {
    return false;
  }

  const hmac = crypto.createHmac(sigHashAlg, secret);
  const digest = hmac.update(payload).digest('hex');

  const expected = Buffer.from(sig[1], 'hex');
  const actual = Buffer.from(digest, 'hex');

  return crypto.timingSafeEqual(expected, actual);
};