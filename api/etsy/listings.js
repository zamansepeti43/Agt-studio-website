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


const SEO_PRESETS = {
  4576154195: ['AI API Finder Pro | 26+ AI API Providers | Android App',['ai api finder','ai api tools','api provider list','android app','ai developer tool','api directory','ai tools','developer tools','api discovery','ai software','programming tool','tech tools','digital download'],'AI API Finder Pro helps developers discover and compare 26+ AI API providers from one Android app.'],
  4576139109: ['No-Code Android APK Builder | ZIP to APK App Maker | Windows',['apk builder','android app builder','zip to apk','no code android','apk maker','android app maker','windows software','apk creator','app builder','android tool','developer tool','digital download','windows app'],'No-Code Android APK Builder is a desktop tool for turning supported ZIP app projects into Android APK packages with a simpler no-code workflow.'],
  4576184560: ['Windows APK Builder | Convert ZIP to Android APK | No Code App Builder',['apk builder','android app builder','zip to apk','windows app','no code android','apk creator','android builder','app maker','android software','apk generator','developer tool','digital download','windows software'],'Windows APK Builder converts supported ZIP app projects into Android APK packages with a simple desktop workflow.'],
  4573718071: ['Etsy Product Research Tool | Product Ideas & Competitor Analysis Spreadsheet',['etsy product research','etsy product ideas','product research tool','etsy research','competitor analysis','etsy seller tool','digital product ideas','etsy spreadsheet','product finder','etsy seo tool','seller research','etsy analytics','digital download'],'Etsy Product Research Tool helps sellers organize product ideas, competitor research and opportunity analysis in a practical spreadsheet workflow.'],
  4574820715: ['Barbershop Management Software | Appointments CRM Inventory | Windows',['barbershop software','barber management','barber appointment','barber crm','barbershop inventory','salon software','appointment manager','client management','barber business','windows software','staff management','payment tracker','digital download'],'Barbershop Management Software is a Windows app for appointments, customer records, inventory and day-to-day barbershop operations.'],
  4574114283: ['Bakery Pricing Calculator | Recipe Cost & Profit Spreadsheet | Excel',['bakery pricing','recipe cost sheet','bakery profit','cake pricing','food cost calculator','home bakery','bakery spreadsheet','recipe costing','cake costing','order tracker','baking business','pricing calculator','excel template'],'Bakery Pricing Calculator is an Excel spreadsheet for home bakers and small bakeries to calculate recipe costs, selling prices and profit margins.'],
  4575285227: ['Etsy Customer Service Templates | 120 Buyer Reply Scripts | Excel & ChatGPT',['etsy seller support','etsy reply templates','customer service','buyer replies','etsy messages','reply scripts','chatgpt prompts','refund response','review response','etsy seller tool','customer support','excel template','digital download'],'Etsy Customer Service Templates includes 120 buyer reply scenarios, reusable response scripts and ChatGPT prompts for common Etsy customer messages.'],
  4584002494: ['College Application Tracker | University Application Planner | Excel Spreadsheet',['college planner','college tracker','application tracker','university planner','college spreadsheet','application spreadsheet','student planner','admission tracker','college checklist','school planner','student spreadsheet','excel planner','digital download'],'College Application Tracker is an Excel spreadsheet for organizing university applications, deadlines, requirements and application progress.'],
  4580566924: ['Travel Planner Spreadsheet | Itinerary Budget & Packing List | Excel',['travel planner','trip planner','travel itinerary','vacation planner','travel budget','packing list','trip spreadsheet','vacation checklist','travel organizer','holiday planner','travel checklist','excel planner','digital download'],'Travel Planner is an Excel spreadsheet for organizing trip itineraries, budgets, packing lists and travel tasks.'],
  4573839919: ['Etsy Profit Calculator | Fee Calculator Pricing Tracker | Excel Spreadsheet',['etsy profit calculator','etsy fee calculator','etsy pricing','etsy seller spreadsheet','etsy profit tracker','etsy fees','profit tracker','pricing calculator','seller finance','etsy business tool','excel spreadsheet','etsy accounting','digital download'],'Etsy Profit Calculator helps sellers estimate fees, set pricing and track profit in an Excel workflow.'],
};

function seoRecommendation(listing) {
  const preset = SEO_PRESETS[Number(listing.listing_id)];
  const currentTitle = String(listing.title || '').trim();
  const currentTags = Array.isArray(listing.tags) ? listing.tags.map(String) : [];
  const currentDescription = String(listing.description || '').trim();
  const data = preset || [
    currentTitle.replace(/[|,:/()]+/g,' ').replace(/\s+/g,' ').trim().slice(0,140),
    [...new Set(currentTags.concat(currentTitle.split(/\s+/).filter(w => w.length >= 4)))].slice(0,13),
    currentTitle + '.',
  ];
  const proposedDescription = currentDescription && currentDescription.startsWith(data[2])
    ? currentDescription
    : data[2] + (currentDescription ? '\n\n' + currentDescription : '');
  return {
    listing_id: Number(listing.listing_id),
    current: { title: currentTitle, tags: currentTags, description: currentDescription },
    proposed: { title: data[0], tags: data[1].slice(0,13), description: proposedDescription },
    reasons: [
      'Başlık daha net ve ana satın alma niyetini öne çıkaracak şekilde sadeleştirildi.',
      '13 etiket, ürünün gerçek kullanım amacı ve arama niyetine göre gruplanıyor.',
      'Açıklamanın ilk paragrafında ürünün ne yaptığı ve kimin için olduğu daha hızlı anlaşılıyor.',
      'Mevcut açıklamanın geri kalanı korunuyor; fiyat, görsel, kategori ve dosyalara dokunulmuyor.',
    ],
  };
}

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
  if ((req.method === 'GET' || req.method === 'POST') && req.query.listing_id) {
    try {
      await requireAdminRequest(req);
      const { shopUserId } = await getEtsyAccessToken();
      const shop = await etsyApiFetch('/users/' + shopUserId + '/shops');
      const shopId = Number(shop?.shop_id);
      const listingId = Number(req.query.listing_id);
      if (!shopId || !listingId) { res.status(400).json({ error: 'Geçerli bir Etsy ilanı seçilmedi.' }); return; }
      const listing = await etsyApiFetch('/listings/' + listingId + '?includes=Images');
      const recommendation = seoRecommendation(listing);
      if (req.method === 'GET') { res.setHeader('Cache-Control','no-store'); res.status(200).json(recommendation); return; }
      let body=req.body; if (typeof body === 'string') { try { body=JSON.parse(body); } catch { body={}; } }
      if (body?.action !== 'apply') { res.status(400).json({ error:'Uygulamak için action=apply gönderilmelidir.' }); return; }
      const proposed=body.proposed || recommendation.proposed;
      const title=String(proposed.title||'').trim().slice(0,140);
      const tags=Array.isArray(proposed.tags) ? proposed.tags.map(String).map(t=>t.trim()).filter(Boolean).slice(0,13) : [];
      const description=String(proposed.description||'').trim();
      if (!title || !tags.length) { res.status(400).json({ error:'Başlık ve etiket önerisi boş bırakılamaz.' }); return; }
      if (tags.some(tag=>tag.length>20)) { res.status(400).json({ error:'Etsy etiketleri 20 karakteri aşamaz.' }); return; }
      await etsyApiFetch('/shops/'+shopId+'/listings/'+listingId,{method:'PATCH',headers:{'Content-Type':'application/x-www-form-urlencoded; charset=utf-8'},body:new URLSearchParams({title,tags:tags.join(','),description}).toString()});
      res.setHeader('Cache-Control','no-store');
      res.status(200).json({ok:true,message:'SEO önerisi Etsy ilanına uygulandı.',recommendation:{...recommendation,proposed:{title,tags,description}}});
      return;
    } catch (error) {
      const message=error instanceof Error ? error.message : 'Etsy optimizasyonu başarısız';
      res.status(message==='Unauthorized'?401:message==='Forbidden'?403:502).json({error:message}); return;
    }
  }

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
