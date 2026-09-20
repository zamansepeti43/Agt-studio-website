import { exchangeCode, storeOAuthToken } from './_lib.js';

function clearStateCookie(res) {
  res.setHeader(
    'Set-Cookie',
    'pinterest_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  );
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const code = String(req.query.code || '');
    const returnedState = String(req.query.state || '');
    const cookieHeader = String(req.headers.cookie || '');
    const stateCookie = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('pinterest_oauth_state='));
    const expectedState = stateCookie
      ? decodeURIComponent(stateCookie.split('=').slice(1).join('='))
      : '';

    if (!code || !returnedState || returnedState !== expectedState) {
      res.status(400).json({ error: 'Pinterest OAuth state doğrulaması başarısız.' });
      return;
    }

    const tokenData = await exchangeCode(code);
    await storeOAuthToken(tokenData);
    clearStateCookie(res);

    res.redirect(302, '/admin/pinterest?connected=1');
  } catch (error) {
    clearStateCookie(res);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Pinterest OAuth callback failed',
    });
  }
}
