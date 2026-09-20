import { etsyApiFetch, getEtsyAccessToken, requireAdminRequest } from './_lib.js';

const SEO_UPDATES = {
  4574114283: {
    title: 'Bakery Pricing Calculator Spreadsheet | Home Bakery Recipe Cost & Profit | Excel Order Tracker',
    tags: [
      'bakery pricing tool',
      'recipe cost sheet',
      'recipe costing',
      'home bakery pricing',
      'home bakery business',
      'bakery profit calc',
      'food cost calculator',
      'cake pricing',
      'cake costing',
      'order tracker',
      'bakery spreadsheet',
      'baking business',
      'bakery cost tracker',
    ],
    descriptionIntro:
      'Bakery Pricing Calculator Excel Spreadsheet for home bakers, cake makers and small bakeries. Calculate recipe cost, food cost, selling price, profit margin and track orders in one workbook.',
  },
  4575285227: {
    title: 'Etsy Seller Customer Service Templates | 120 Buyer Reply Scripts | ChatGPT Prompts | Excel',
    tags: [
      'etsy seller support',
      'etsy support tool',
      'etsy customer reply',
      'etsy reply templates',
      'customer service',
      'reply templates',
      'buyer replies',
      'ai reply generator',
      'chatgpt prompts',
      'refund response',
      'review response',
      'etsy message replies',
      'excel template',
    ],
    descriptionIntro:
      'Etsy Seller Customer Service Templates with 120 buyer reply scenarios, ChatGPT prompts and an Excel-based workflow for handling common Etsy customer messages.',
  },
};

function buildDescription(existing, intro) {
  const current = String(existing || '').trim();
  if (!current) return intro;
  if (current.startsWith(intro)) return current;
  return `${intro}\n\n${current}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    await requireAdminRequest(req);
    const { shopUserId } = await getEtsyAccessToken();
    const shop = await etsyApiFetch(`/users/${shopUserId}/shops`);
    const shopId = Number(shop?.shop_id);
    if (!shopId) throw new Error('Etsy shop ID bulunamadı.');

    const live = await etsyApiFetch(`/shops/${shopId}/listings?state=active&limit=100&offset=0`);
    const changed = [];
    const skipped = [];

    for (const listing of live?.results || []) {
      const id = Number(listing.listing_id);
      const update = SEO_UPDATES[id];
      if (!update) continue;

      const nextDescription = buildDescription(listing.description, update.descriptionIntro);
      const titleChanged = String(listing.title || '') !== update.title;
      const tagsChanged = JSON.stringify(Array.isArray(listing.tags) ? listing.tags : []) !== JSON.stringify(update.tags);
      const descriptionChanged = String(listing.description || '') !== nextDescription;

      if (!titleChanged && !tagsChanged && !descriptionChanged) {
        skipped.push({ listing_id: id, reason: 'SEO başlığı, etiketler ve açıklama zaten güncel.' });
        continue;
      }

      const payload = {};
      if (titleChanged) payload.title = update.title;
      if (tagsChanged) payload.tags = update.tags.join(',');
      if (descriptionChanged) payload.description = nextDescription;

      await etsyApiFetch(`/shops/${shopId}/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(payload).toString(),
      });

      changed.push({
        listing_id: id,
        old_title: listing.title,
        new_title: update.title,
        tags_updated: tagsChanged,
        description_updated: descriptionChanged,
      });
    }

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      ok: true,
      changed,
      skipped,
      message: `${changed.length} Etsy ilanında SEO başlığı, etiket ve açıklama güncellemesi hazırlandı.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Etsy SEO optimization failed';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 502;
    res.status(status).json({ error: message });
  }
}
