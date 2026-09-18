import crypto from 'node:crypto';
import { buildOAuthUrl } from './_lib.js';

function setCookie(res, name, value) {
  res.setHeader(
    'Set-Cookie',
    `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const state = crypto.randomBytes(24).toString('hex');
    setCookie(res, 'pinterest_oauth_state', state);
    res.redirect(302, buildOAuthUrl(state));
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Pinterest OAuth could not start',
    });
  }
}
