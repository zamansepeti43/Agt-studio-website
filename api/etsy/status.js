import { getConfig, getStoredToken } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { supabaseUrl, serviceRoleKey } = getConfig();
    const token = await getStoredToken({ supabaseUrl, serviceRoleKey });

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      connected: Boolean(token),
      shopUserId: token?.shop_user_id ?? null,
      scope: token?.scope ?? null,
      connectedAt: token?.created_at ?? null,
      updatedAt: token?.updated_at ?? null,
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
