import { etsyApiFetch } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { shopUserId } = await import('./_lib.js').then(m => m.getEtsyAccessToken());
    const shop = await etsyApiFetch(`/users/${shopUserId}/shops`);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(shop);
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Etsy shop request failed',
    });
  }
}
