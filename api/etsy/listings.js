import { etsyApiFetch, getEtsyAccessToken } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { shopUserId } = await getEtsyAccessToken();
    const shop = await etsyApiFetch(`/users/${shopUserId}/shops`);
    if (!shop?.shop_id) throw new Error('Etsy shop ID alınamadı.');

    const state = String(req.query.state || 'active');
    const limit = Math.min(Math.max(Number(req.query.limit || 25), 1), 100);
    const offset = Math.max(Number(req.query.offset || 0), 0);

    const query = new URLSearchParams({
      state,
      limit: String(limit),
      offset: String(offset),
      sort_on: 'updated',
      includes: 'Images',
    });

    const listings = await etsyApiFetch(
      `/shops/${shop.shop_id}/listings?${query.toString()}`
    );

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      shop,
      listings,
    });
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Etsy listings request failed',
    });
  }
}
