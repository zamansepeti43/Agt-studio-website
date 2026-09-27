import { etsyApiFetch, getEtsyAccessToken, requireAdminRequest } from './_lib.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { shopUserId } = await getEtsyAccessToken();
      const shop = await etsyApiFetch(`/users/${shopUserId}/shops`);
      if (!shop?.shop_id) throw new Error('Etsy shop ID alınamadı.');

      const state = String(req.query.state || 'active');
      const limit = Math.min(Math.max(Number(req.query.limit || 25), 1), 100);
      const offset = Math.max(Number(req.query.offset || 0), 0);
      const query = new URLSearchParams({
        state, limit: String(limit), offset: String(offset), sort_on: 'updated', includes: 'Images',
      });

      const [listings, sections] = await Promise.all([
        etsyApiFetch(`/shops/${shop.shop_id}/listings?${query.toString()}`),
        etsyApiFetch(`/shops/${shop.shop_id}/sections`),
      ]);

      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({
        shop,
        listings,
        sections: Array.isArray(sections?.results) ? sections.results : [],
      });
      return;
    } catch (error) {
      res.status(502).json({ error: error instanceof Error ? error.message : 'Etsy listings request failed' });
      return;
    }
  }

  if (req.method === 'PUT') {
    try {
      await requireAdminRequest(req);
      const { shopUserId } = await getEtsyAccessToken();
      const shop = await etsyApiFetch(`/users/${shopUserId}/shops`);
      const shopId = Number(shop?.shop_id);
      if (!shopId) throw new Error('Etsy shop ID bulunamadı.');

      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const assignments = Array.isArray(body?.assignments) ? body.assignments : [];
      if (!assignments.length) {
        res.status(400).json({ error: 'Uygulanacak kategori değişikliği bulunamadı.' });
        return;
      }

      const results = [];
      for (const item of assignments) {
        const listingId = Number(item?.listing_id);
        const sectionId = Number(item?.section_id);
        if (!listingId || !sectionId) {
          results.push({ listing_id: listingId || null, ok: false, error: 'Geçersiz ilan veya kategori.' });
          continue;
        }
        try {
          await etsyApiFetch(`/shops/${shopId}/listings/${listingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
            body: new URLSearchParams({ section_id: String(sectionId) }).toString(),
          });
          results.push({ listing_id: listingId, section_id: sectionId, ok: true });
        } catch (error) {
          results.push({ listing_id: listingId, section_id: sectionId, ok: false, error: error instanceof Error ? error.message : 'Etsy güncellemesi başarısız' });
        }
      }

      const failed = results.filter((item) => !item.ok);
      res.status(failed.length ? 207 : 200).json({
        ok: failed.length === 0,
        total: results.length,
        updated: results.length - failed.length,
        failed: failed.length,
        results,
      });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Etsy kategori güncellemesi başarısız';
      const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 502;
      res.status(status).json({ error: message });
      return;
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
