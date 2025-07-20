// GitHub webhook signature verification
import crypto from 'crypto';

export function verifyGitHubSignature(body: string, signature: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('GITHUB_WEBHOOK_SECRET not configured');
    return false;
  }

  const hmac = crypto.createHmac('sha256', secret);
  const digest = `sha256=${hmac.update(body).digest('hex')}`;
  
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}