import { supabaseRest } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const rows = await supabaseRest(
      'pinterest_oauth_tokens?select=pinterest_user_id,scope,expires_at,updated_at&order=updated_at.desc&limit=1'
    );
    const token = rows?.[0] || null;
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      connected: Boolean(token?.pinterest_user_id),
      pinterestUserId: token?.pinterest_user_id || null,
      scope: token?.scope || null,
      expiresAt: token?.expires_at || null,
      updatedAt: token?.updated_at || null,
    });
  } catch (error) {
    res.status(500).json({ connected: false, error: error instanceof Error ? error.message : 'Pinterest status failed' });
  }
}
