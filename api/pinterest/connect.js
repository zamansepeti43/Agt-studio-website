import crypto from 'node:crypto';
import { buildOAuthUrl } from './_lib.js';

function setCookie(res, name, value) {
  const cookie = name + '=' + encodeURIComponent(value) + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600';
  const existing = res.getHeader('Set-Cookie');
  const cookies = Array.isArray(existing) ? existing : existing ? [String(existing)] : [];
  res.setHeader('Set-Cookie', [...cookies, cookie]);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const state = crypto.randomBytes(24).toString('hex');
    const environment = String(req.query.environment || 'production') === 'sandbox' ? 'sandbox' : 'production';
    setCookie(res, 'pinterest_oauth_state', state);
    setCookie(res, 'pinterest_oauth_environment', environment);
    res.redirect(302, buildOAuthUrl(state));
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Pinterest OAuth could not start',
    });
  }
}
