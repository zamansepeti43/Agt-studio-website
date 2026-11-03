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
  4576174491: ["AI API Finder Basic Android App: 26+ AI API Providers",["ai api finder","ai api directory","ai api providers","android app","developer tools","ai tools directory","api discovery","ai software","programming tool","tech tools","api research","ai developer app","digital download"],"AI API Finder Basic is an Android app for discovering 26+ AI API providers in one organized directory."],
  4576154195: ["AI API Finder Pro Android App: 26+ AI API Providers",["ai api finder","ai api directory","ai api providers","android app","developer tools","ai tools directory","api discovery","ai software","programming tool","tech tools","api research","ai developer app","digital download"],"AI API Finder Pro is an Android app that helps developers discover 26+ AI API providers in one organized directory."],
  4576139109: ["No-Code Android APK Builder for Windows: ZIP to APK Tool",["apk builder","zip to apk","android app maker","no code android","apk creator","windows app","android builder","app package tool","developer tool","apk converter","windows software","app builder","digital download"],"This Windows desktop tool helps turn supported ZIP-based app projects into Android APK files."],
  4576184560: ["Windows APK Builder: Convert ZIP Projects to Android APK",["apk builder","zip to apk","windows apk tool","android app maker","apk converter","no code android","apk creator","windows software","android package","app builder tool","developer tool","apk generator","digital download"],"Windows APK Builder helps convert supported ZIP app projects into Android APK packages from a desktop workflow."],
  4573718071: ["Etsy Product Research Spreadsheet: Ideas & Competitor Analysis",["etsy research tool","etsy product ideas","product research","competitor analysis","etsy seller tool","digital ideas","etsy spreadsheet","product opportunity","etsy seo tool","seller research","etsy analytics","market research","excel template"],"Etsy Product Research Tool helps sellers organize product ideas, competitor research and opportunity analysis in a practical spreadsheet."],
  4574820715: ["Barbershop Management Software: Appointments, Clients & Inventory",["barbershop software","barber management","barber booking","barber appointments","barber crm","barber inventory","salon software","client management","barber business","windows software","staff management","payment tracker","digital download"],"Manage barbershop appointments, customer records and inventory in one Windows application."],
  4574114283: ["Bakery Pricing Calculator Spreadsheet: Recipe Costs & Profit",["bakery pricing","recipe cost sheet","bakery profit","cake pricing","food cost calculator","home bakery","bakery spreadsheet","recipe costing","cake costing","order tracker","baking business","pricing calculator","excel template"],"Bakery Pricing Calculator is an Excel spreadsheet for calculating recipe costs, selling prices and bakery profit."],
  4575285227: ["Etsy Customer Reply Templates: 120 Buyer Response Scripts",["etsy reply templates","etsy seller support","buyer reply scripts","customer service","etsy messages","reply templates","chatgpt prompts","refund response","review response","etsy seller tool","customer support","excel template","digital download"],"This Etsy seller toolkit includes 120 buyer reply scenarios, reusable response scripts and ChatGPT prompts for common customer messages."],
  4584002494: ["College Application Tracker Spreadsheet: University Deadlines",["college application","college tracker","application tracker","university planner","college spreadsheet","admission tracker","student planner","deadline tracker","college checklist","school planner","student spreadsheet","excel planner","digital download"],"College Application Tracker is a spreadsheet for organizing university applications, requirements, deadlines and application progress."],
  4580566924: ["Travel Planner Spreadsheet: Itinerary, Budget & Packing List",["travel planner","trip planner","travel itinerary","vacation planner","travel budget","packing list","trip spreadsheet","vacation checklist","travel organizer","holiday planner","travel checklist","excel planner","digital download"],"Plan trip itineraries, budgets and packing lists with one editable travel planning spreadsheet."],
  4573839919: ["Etsy Profit Calculator Spreadsheet: Fees, Pricing & Profit Tracker",["etsy fee calculator","etsy pricing","etsy profit tracker","etsy fees","profit tracker","pricing calculator","seller finance","etsy business tool","excel spreadsheet","etsy accounting","profit calculator","seller spreadsheet","digital download"],"Etsy Profit Calculator helps sellers estimate fees, plan product prices and track profit in an Excel spreadsheet."],
  4580683019: ["Beauty Salon Management Software: Clients, Staff & Inventory",["salon management","beauty salon app","salon software","salon booking","client management","salon inventory","staff manager","beauty business","spa management","appointment app","windows software","salon crm","digital download"],"BeautyOS Pro is an offline Windows application for managing salon clients, staff, inventory and payments."],
  4579223691: ["AI Product Photo Generator for Windows: E-Commerce Image Tool",["ai product photos","product photo ai","ai image generator","ecommerce photos","product photography","photo generator","windows software","etsy product photos","shopify photos","amazon photos","ai photo editor","listing images","digital download"],"AGT AI Product Photo Generator is a Windows desktop tool for creating product-focused visuals for e-commerce listings."],
  4577542450: ["Etsy Product Idea Finder Android App: 259K Digital Product Ideas",["etsy product ideas","etsy idea finder","product idea tool","etsy seller tools","product research","etsy niche ideas","digital downloads","etsy business","product radar","etsy research app","android app","seller research","digital product list"],"Etsy Product Idea Finder helps sellers explore a catalog of 259,200 digital product concepts from an Android app."],
  4579183270: ["AI Product Photo Generator for Etsy, Amazon & Shopify",["ai product photos","product photography","ai photo generator","etsy product photos","shopify photos","amazon photos","ecommerce visuals","product image ai","listing photos","ai image tool","product mockup","photo editor","digital download"],"AI Product Photo Generator helps online sellers create product-focused visuals for listings across Etsy, Amazon and Shopify."],
  4574138529: ["Pressure Washing Business Spreadsheet: Quotes, Jobs & Profit",["pressure washing","pressure wash biz","job costing sheet","service business","quote calculator","job tracker","profit tracker","business spreadsheet","cleaning business","pricing calculator","income tracker","excel template","digital download"],"Organize customer jobs, estimates and profit calculations with this pressure washing business spreadsheet."],
  4582064360: ["AGT LIFE Organizer App: Tasks, Goals & Reminders",["life organizer","daily task app","goal tracker","task manager","reminder app","personal planner","productivity app","habit planner","life planner","windows app","digital organizer","goal planner","digital download"],"AGT LIFE is a personal organizer for managing everyday tasks, personal goals and reminders in one digital workspace."],
  4583609425: ["Moving Planner Spreadsheet: Moving Checklist & Box Inventory",["moving planner","moving checklist","relocation planner","moving spreadsheet","box inventory","packing checklist","moving organizer","house move list","moving budget","home relocation","excel template","packing planner","digital download"],"Moving Planner helps organize a move with checklists, box inventory and practical planning sheets."],
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
  if (req.method === 'GET' && String(req.query.sales || '') === '1') {
    try {
      await requireAdminRequest(req);
      const { shopUserId, scope } = await getEtsyAccessToken();
      const grantedScopes = String(scope || '').split(/\s+/).filter(Boolean);
      if (!grantedScopes.includes('transactions_r')) {
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).json({
          available: false,
          reason: 'transactions_scope_required',
          message: 'Ürün bazında gerçek satış verisi için Etsy bağlantısına transactions_r (satışları okuma) izni eklenmeli. Etsy bağlantısını yeniden yetkilendir.',
        });
        return;
      }

      const shop = await etsyApiFetch('/users/' + shopUserId + '/shops');
      const shopId = Number(shop?.shop_id);
      if (!shopId) throw new Error('Etsy mağaza kimliği bulunamadı.');

      const transactions = [];
      const pageSize = 100;
      const maxPages = 10;
      let reportedCount = null;
      for (let page = 0; page < maxPages; page += 1) {
        const payload = await etsyApiFetch('/shops/' + shopId + '/transactions?limit=' + pageSize + '&offset=' + (page * pageSize));
        const rows = Array.isArray(payload?.results) ? payload.results : [];
        if (reportedCount == null && Number.isFinite(Number(payload?.count))) reportedCount = Number(payload.count);
        transactions.push(...rows);
        if (rows.length < pageSize || (reportedCount != null && transactions.length >= reportedCount)) break;
      }

      const byListing = new Map();
      let grossTotal = 0;
      let unitsTotal = 0;
      for (const transaction of transactions) {
        const listingId = Number(transaction.listing_id || 0);
        const quantity = Math.max(0, Number(transaction.quantity || 0));
        const unitPrice = transaction.price?.amount == null ? 0 : Number(transaction.price.amount) / Number(transaction.price.divisor || 1);
        const gross = unitPrice * quantity;
        grossTotal += gross;
        unitsTotal += quantity;
        if (!listingId) continue;
        const current = byListing.get(listingId) || {
          listing_id: listingId,
          title: transaction.title || 'Etsy ilanı',
          orders: 0,
          units: 0,
          gross_revenue: 0,
          currency: transaction.price?.currency_code || shop.currency_code || null,
          last_sale_timestamp: null,
        };
        current.orders += 1;
        current.units += quantity;
        current.gross_revenue += gross;
        const timestamp = Number(transaction.paid_timestamp || transaction.create_timestamp || transaction.created_timestamp || 0);
        current.last_sale_timestamp = Math.max(current.last_sale_timestamp || 0, timestamp) || null;
        byListing.set(listingId, current);
      }

      const listingSales = [...byListing.values()]
        .map((item) => ({ ...item, gross_revenue: Number(item.gross_revenue.toFixed(2)) }))
        .sort((a, b) => b.gross_revenue - a.gross_revenue || b.units - a.units);

      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({
        available: true,
        source: 'Etsy Open API transactions',
        transaction_count_returned: transactions.length,
        transaction_count_reported: reportedCount,
        truncated: reportedCount != null && transactions.length < reportedCount,
        units_sold: unitsTotal,
        gross_revenue: Number(grossTotal.toFixed(2)),
        currency: shop.currency_code || null,
        listing_sales: listingSales,
        measurement_note: 'İlan bazında satış ve brüt satır tutarı Etsy işlem kayıtlarından hesaplanır. Bu tutar Etsy ücretleri, vergiler, iadeler ve ödeme kesintileri sonrası net kazanç değildir.',
      });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Etsy satış verileri alınamadı.';
      const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 502;
      res.status(status).json({ error: message });
      return;
    }
  }

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
