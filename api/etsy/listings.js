import { etsyApiFetch, getEtsyAccessToken, requireAdminRequest } from './_lib.js';

const SECTION_ALIASES = new Map([
  ['iş araçları', 'İş Araçları'],
  ['business tools', 'İş Araçları'],
  ['yapay zeka ve geliştirici araçları', 'Yapay Zeka ve Geliştirici Araçları'],
  ['ai & developer tools', 'Yapay Zeka ve Geliştirici Araçları'],
  ['ai and developer tools', 'Yapay Zeka ve Geliştirici Araçları'],
  ['etsy satıcı araçları', 'Etsy satıcı araçları'],
  ['etsy seller tools', 'Etsy satıcı araçları'],
  ['android geliştirici araçları', 'Android Geliştirici Araçları'],
  ['android developer tools', 'Android Geliştirici Araçları'],
  ['işletme yönetimi', 'İşletme Yönetimi'],
  ['business management', 'İşletme Yönetimi'],
  ['planlayıcılar / verimlilik', 'Planlayıcılar / Verimlilik'],
  ['planners / productivity', 'Planlayıcılar / Verimlilik'],
  ['hayat verimliliği', 'Hayat verimliliği'],
  ['life productivity', 'Hayat verimliliği'],
]);

function canonicalSectionTitle(title) {
  return SECTION_ALIASES.get(String(title || '').trim().toLocaleLowerCase('tr-TR')) || null;
}

function flattenTaxonomy(nodes, parentPath = []) {
  const out = [];
  for (const node of Array.isArray(nodes) ? nodes : []) {
    const path = [...parentPath, node.name].filter(Boolean);
    out.push({ id: Number(node.id), name: String(node.name || ''), level: Number(node.level || 0), parent_id: node.parent_id == null ? null : Number(node.parent_id), path: path.join(' → ') });
    if (Array.isArray(node.children)) out.push(...flattenTaxonomy(node.children, path));
  }
  return out;
}

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

      const [listings, sections, taxonomy] = await Promise.all([
        etsyApiFetch(`/shops/${shop.shop_id}/listings?${query.toString()}`),
        etsyApiFetch(`/shops/${shop.shop_id}/sections`),
        etsyApiFetch('/seller-taxonomy/nodes'),
      ]);

      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({
        shop,
        listings,
        sections: Array.isArray(sections?.results) ? sections.results : [],
        taxonomy: flattenTaxonomy(taxonomy?.results || []),
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
        res.status(400).json({ error: 'Uygulanacak mağaza bölümü değişikliği bulunamadı.' });
        return;
      }

      const currentSections = await etsyApiFetch('/shops/' + shopId + '/sections');
      const sectionsToNormalize = Array.isArray(currentSections?.results)
        ? currentSections.results
            .map(section => ({
              id: Number(section.shop_section_id),
              currentTitle: String(section.title || ''),
              canonicalTitle: canonicalSectionTitle(section.title),
            }))
            .filter(section => section.id && section.canonicalTitle && section.currentTitle !== section.canonicalTitle)
        : [];

      const renamedSections = [];
      for (const section of sectionsToNormalize) {
        try {
          await etsyApiFetch('/shops/' + shopId + '/sections/' + section.id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
            body: new URLSearchParams({ title: section.canonicalTitle }).toString(),
          });
          renamedSections.push({ section_id: section.id, title: section.canonicalTitle });
        } catch (error) {
          // Keep the listing assignment attempt independent from a section-title rename failure.
        }
      }

      const results = [];
      for (const item of assignments) {
        const listingId = Number(item?.listing_id);
        const sectionId = item?.section_id == null || item?.section_id === '' ? null : Number(item.section_id);
        if (!listingId || !sectionId) {
          results.push({ listing_id: listingId || null, ok: false, error: 'Geçersiz ilan veya mağaza bölümü.' });
          continue;
        }

        try {
          const form = new URLSearchParams();
          form.set('section_id', String(sectionId));

          try {
            await etsyApiFetch(`/shops/${shopId}/listings/${listingId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
              body: form.toString(),
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : '';
            if (/\(405\)|\(404\)/.test(message)) {
              await etsyApiFetch(`/shops/${shopId}/listings/${listingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
                body: form.toString(),
              });
            } else {
              throw error;
            }
          }
          results.push({ listing_id: listingId, section_id: sectionId, ok: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Etsy güncellemesi başarısız';
          console.error('[Etsy section assignment failed]', { listingId, sectionId, message });
          results.push({ listing_id: listingId, section_id: sectionId, ok: false, error: message });
        }
      }

      const failed = results.filter((item) => !item.ok);
      res.status(failed.length ? 207 : 200).json({
        ok: failed.length === 0,
        total: results.length,
        updated: results.length - failed.length,
        failed: failed.length,
        renamedSections,
        results,
      });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Etsy mağaza bölümü güncellemesi başarısız';
      const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 502;
      res.status(status).json({ error: message });
      return;
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
