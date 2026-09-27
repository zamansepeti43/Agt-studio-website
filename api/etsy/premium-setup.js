import { etsyApiFetch, getEtsyAccessToken, requireAdminRequest } from './_lib.js';

const PREMIUM_SHOP = {
  title: 'Premium Digital Tools & Creative Resources',
  announcement: 'Welcome to AGTStudioCo — practical digital tools, software and templates designed to help creators, entrepreneurs and small businesses work smarter. Instant digital access. New products added regularly.',
  sale_message: 'Thank you for choosing AGTStudioCo. Your digital product is delivered through Etsy after purchase. If you need help with your order, please contact us through Etsy messages.',
  digital_sale_message: 'Thank you for your purchase. Your digital files are available through your Etsy order. Please download and save your files after purchase. If you need installation or product support, message AGTStudioCo through Etsy.',
};

const SHOP_SECTIONS = [
  'İş Araçları',
  'Yapay Zeka ve Geliştirici Araçları',
  'Etsy satıcı araçları',
  'Android Geliştirici Araçları',
  'İşletme Yönetimi',
  'Planlayıcılar / Verimlilik',
  'Hayat verimliliği',
];

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

    const form = new URLSearchParams(PREMIUM_SHOP);
    const updatedShop = await etsyApiFetch(`/shops/${shopId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    const existingSections = await etsyApiFetch('/shops/' + shopId + '/sections');
    const sectionMap = new Map(
      (existingSections?.results || []).map(section => [
        String(section.title).toLocaleLowerCase('tr-TR'),
        Number(section.shop_section_id),
      ])
    );

    const createdSections = [];
    for (const title of SHOP_SECTIONS) {
      const key = title.toLocaleLowerCase('tr-TR');
      if (sectionMap.has(key)) continue;
      const section = await etsyApiFetch('/shops/' + shopId + '/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ title }).toString(),
      });
      const id = Number(section?.shop_section_id);
      if (id) {
        sectionMap.set(key, id);
        createdSections.push(title);
      }
    }

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      ok: true,
      shop: updatedShop,
      sectionsCreated: createdSections,
      message: 'Premium mağaza kurulumu tamamlandı. Ürünlerin mağaza bölümlerine dağıtımı değiştirilmedi.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Premium Etsy setup failed';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 502;
    res.status(status).json({ error: message });
  }
}
