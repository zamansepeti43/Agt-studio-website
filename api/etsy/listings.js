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
  "4576154195": [
    "AI API Finder Pro Android App: 26+ Providers & Live Updates",
    [
      "ai api finder",
      "ai api directory",
      "ai api providers",
      "android app",
      "ai developer tool",
      "api discovery",
      "api comparison",
      "provider directory",
      "live data updates",
      "ai api research",
      "developer app",
      "ai software",
      "tech tools"
    ],
    "AI API Finder Pro is an Android directory for discovering and comparing 26+ AI API providers, with live data refreshes for supported provider updates."
  ],
  "4576139109": [
    "Android APK Builder App: ZIP to APK Without Coding",
    [
      "android app builder",
      "zip to apk",
      "html to apk",
      "apk creator",
      "no code app",
      "android apk",
      "custom app logo",
      "custom app name",
      "web to app",
      "html app maker",
      "apk converter",
      "android tools",
      "app builder"
    ],
    "AGT Studio Android APK Builder is an Android app that converts compatible ZIP projects containing an index.html or index.htm file into signed APK files, with app-name and logo options."
  ],
  "4573718071": [
    "Etsy Product Research System: 83 Ideas, Validation & Profit Tools",
    [
      "etsy product ideas",
      "etsy research tool",
      "product research",
      "competitor research",
      "niche research",
      "digital product",
      "etsy seller tools",
      "product validation",
      "profit calculator",
      "listing planner",
      "opportunity score",
      "market research",
      "excel workbook"
    ],
    "Etsy Product Research System combines 83 researched product opportunities with competitor analysis, a 9-factor validation scorecard, profit estimates and listing-planning tools."
  ],
  "4574820715": [
    "Barbershop Management Software for Windows: Appointments & Inventory",
    [
      "barbershop software",
      "barber management",
      "barber booking",
      "barber appointments",
      "barber crm",
      "barber inventory",
      "barber business",
      "salon software",
      "client management",
      "windows software",
      "staff manager",
      "service manager",
      "offline software"
    ],
    "BarberOS Pro is a Windows 10/11 desktop app for managing barbershop appointments, customers, barbers, services, inventory and reports with local data storage."
  ],
  "4574114283": [
    "Bakery Pricing Calculator Excel: Recipe Costs & Profit Tracker",
    [
      "bakery pricing",
      "recipe costing",
      "recipe cost sheet",
      "home bakery",
      "cake pricing",
      "food cost calc",
      "bakery profit",
      "order tracker",
      "baking business",
      "excel template",
      "ingredient cost",
      "profit margin",
      "bakery spreadsheet"
    ],
    "Bakery Profit Command Center is an Excel workbook for ingredient and recipe costing, product pricing, profit-margin analysis and order tracking for home bakeries."
  ],
  "4576174491": [
    "AI API Finder Basic Android App: 26+ AI API Providers",
    [
      "ai api finder",
      "ai api directory",
      "ai api providers",
      "android app",
      "ai developer tool",
      "api discovery",
      "api comparison",
      "provider directory",
      "api search tool",
      "ai api research",
      "developer app",
      "ai software",
      "tech tools"
    ],
    "AI API Finder Basic is an Android app for searching and comparing 26+ AI API providers from its included data snapshot; it does not include the Pro live-update system."
  ],
  "4576184560": [
    "Windows APK Builder: Convert ZIP Projects to Android APK",
    [
      "windows apk tool",
      "zip to apk",
      "apk builder",
      "apk creator",
      "windows software",
      "html to apk",
      "app signing",
      "custom app logo",
      "custom app name",
      "android app maker",
      "no android studio",
      "developer tool",
      "app converter"
    ],
    "Windows APK Builder is a Windows desktop tool for converting compatible ZIP/HTML projects into Android APK packages, with app-name, logo and signing options."
  ],
  "4573839919": [
    "Etsy Profit Tracker Excel Workbook: Fees, Pricing & Dashboard",
    [
      "etsy profit tracker",
      "etsy fee calculator",
      "etsy pricing tool",
      "profit spreadsheet",
      "profit margin",
      "etsy seller tools",
      "pricing calculator",
      "etsy ads tracker",
      "fee tracker",
      "payout tracker",
      "product profit",
      "excel workbook",
      "etsy business"
    ],
    "Etsy Profit Command Center is a 21-sheet Excel system for tracking sales, Etsy fees, advertising costs, product pricing, payout estimates and profit scenarios."
  ],
  "4574138529": [
    "Pressure Washing Business Spreadsheet: Quotes, Jobs & Profit",
    [
      "pressure washing",
      "power washing",
      "job quote tool",
      "quote calculator",
      "job tracker",
      "service business",
      "job costing",
      "profit tracker",
      "pricing calculator",
      "cleaning business",
      "contractor tool",
      "excel template",
      "business spreadsheet"
    ],
    "Pressure Washing Profit Command Center is an Excel and Google Sheets system for estimating job prices, preparing quotes, tracking customers and jobs, and monitoring costs and profit."
  ],
  "4584002494": [
    "College Application Tracker Spreadsheet: Deadlines & Scholarships",
    [
      "college tracker",
      "college application",
      "application planner",
      "college admissions",
      "deadline tracker",
      "scholarship tracker",
      "essay tracker",
      "college comparison",
      "university planner",
      "student spreadsheet",
      "college checklist",
      "document tracker",
      "cost comparison"
    ],
    "College Application Tracker is a 17-sheet Excel command center for researching colleges, tracking applications and deadlines, managing essays and recommendations, and comparing costs and scholarships."
  ],
  "4580683019": [
    "Beauty Salon Management Software for Windows: Clients & Appointments",
    [
      "beauty salon app",
      "salon management",
      "salon software",
      "salon appointments",
      "client management",
      "salon inventory",
      "staff manager",
      "beauty business",
      "treatment tracker",
      "salon payments",
      "offline software",
      "windows software",
      "spa salon tool"
    ],
    "BeautyOS Pro is an offline Windows salon-management app with appointments, client records, treatments, packages, services, inventory, staff, payments and reports."
  ],
  "4579223691": [
    "AI Product Photo Generator for Windows: E-Commerce Images",
    [
      "ai product photo",
      "product photo ai",
      "ecommerce images",
      "windows software",
      "product photography",
      "ai image generator",
      "etsy product photos",
      "shopify product",
      "amazon product photo",
      "lifestyle product",
      "image generator",
      "photo editing tool",
      "digital download"
    ],
    "AGT Product AI is a Windows desktop app that turns an uploaded product photo and a written prompt into e-commerce visuals using a connected AI provider or model."
  ],
  "4580566924": [
    "Travel Planner Spreadsheet: Itinerary, Budget & Group Expenses",
    [
      "travel planner",
      "travel spreadsheet",
      "trip itinerary",
      "trip budget",
      "packing checklist",
      "group expenses",
      "travel reservations",
      "currency helper",
      "family travel",
      "excel planner",
      "google sheets",
      "trip organizer",
      "pre trip checklist"
    ],
    "AGT Studio Ultimate Travel Planner is a bilingual Excel and Google Sheets workbook for trip itineraries, budgets, shared expenses, packing, reservations and preparation tasks."
  ],
  "4579183270": [
    "AI Product Photo Generator Android App: E-Commerce Images",
    [
      "ai product photo",
      "product photo ai",
      "android app",
      "ecommerce images",
      "product photography",
      "ai image generator",
      "etsy product photos",
      "shopify product",
      "amazon product photo",
      "lifestyle product",
      "image generator",
      "product visuals",
      "digital download"
    ],
    "AGT Product AI is an Android app for uploading a product photo, writing a prompt, choosing a supported AI provider or model, generating image variations, and saving results to History or Favorites."
  ],
  "4582064360": [
    "AGT LIFE Android Organizer App: Tasks, Goals & Reminders",
    [
      "android organizer",
      "life organizer",
      "task manager app",
      "goal tracker",
      "reminder app",
      "daily planner",
      "productivity app",
      "personal planner",
      "life planner app",
      "task planner",
      "goal planner",
      "android planner",
      "digital organizer"
    ],
    "AGT LIFE is an Android personal-organizer app with task and goal tracking, reminders, Life Rescue planning and the İZCİ smart-tracking system."
  ],
  "4583609425": [
    "Moving Planner Spreadsheet: Box Inventory & Missing Box Radar",
    [
      "moving planner",
      "moving checklist",
      "box inventory",
      "packing tracker",
      "moving spreadsheet",
      "relocation planner",
      "moving budget",
      "moving day",
      "unpacking tracker",
      "excel planner",
      "google sheets",
      "box labels",
      "home relocation"
    ],
    "Moving Command Center PRO is a bilingual Excel and Google Sheets moving system with box-status tracking, a Missing Box Radar, packing tasks, budget planning and a printable binder."
  ]
};

const SEO_HOLDS = {
  "4575285227": "BEKLEMEDE: İlan 120 Etsy müşteri yanıtı şablonu vaat ediyor; elimdeki benzer isimli yerel çalışma kitabı 2.169 genel yapay zekâ istemi içeriyor. İlanın Etsy'ye yüklenmiş asıl dosyası eşleştirilmeden bu ürünü değiştirmeyeceğim.",
  "4577542450": "BEKLEMEDE: İlan Android Product Radar uygulaması olarak tanıtılıyor; elimdeki yerel Product-Radar-Setup.exe Windows kurulum dosyası ve eşleşen Android APK bulunamadı. Gerçek teslimat dosyası doğrulanmadan bu ürünü değiştirmeyeceğim."
};

function seoRecommendation(listing) {
  const id = Number(listing.listing_id);
  const currentTitle = String(listing.title || '').trim();
  const currentTags = Array.isArray(listing.tags) ? listing.tags.map(String) : [];
  const currentDescription = String(listing.description || '').trim();
  const current = { title: currentTitle, tags: currentTags, description: currentDescription };
  const holdReason = SEO_HOLDS[id];
  if (holdReason) {
    return {
      listing_id: id,
      current,
      proposed: { ...current },
      reasons: [holdReason],
      hold: true,
      hold_reason: holdReason,
    };
  }
  const preset = SEO_PRESETS[id];
  const data = preset || [
    currentTitle.replace(/[|,:/()]+/g,' ').replace(/\s+/g,' ').trim().slice(0,140),
    [...new Set(currentTags.concat(currentTitle.split(/\s+/).filter(w => w.length >= 4)))].slice(0,13),
    currentTitle + '.',
  ];
  let proposedDescription = currentDescription && currentDescription.startsWith(data[2])
    ? currentDescription
    : data[2] + (currentDescription ? '\n\n' + currentDescription : '');

  if (id === 4579183270) {
    proposedDescription = proposedDescription
      .replace(/Simply type or speak what you want, connect your preferred AI model, and create product images designed for online stores, marketplaces and social media\./i,
        'Upload a product photo, write a prompt, connect a supported AI provider or model, and generate product visuals for online stores and marketplaces.')
      .replace(/🎙️ Type or Speak\s*\nDescribe what you want using text or voice\. No complicated design process required\./i,
        '✍️ Write a Prompt\nDescribe the scene, background, lighting and visual style you want in a written prompt.')
      .replace(/✨ Smart Editing\s*\nCustomize your product visuals, backgrounds, colors, text and presentation\./i,
        '✨ Prompt-Based Visual Direction\nDescribe the background, lighting, colors and presentation you want in your written prompt.')
      .replace(/Type it\. Speak it\. Create it\. Sell it\./i,
        'Upload it. Describe it. Create it. Sell it.');
  }
  return {
    listing_id: id,
    current,
    proposed: { title: data[0], tags: data[1].slice(0,13), description: proposedDescription },
    reasons: [
      'Başlık sadeleştirildi; ürün türü ve ana arama niyeti başa alındı.',
      '13 etiket, mevcut ilan içeriğinde açıkça anlatılan kullanım amacına göre seçildi; her etiket 20 karakteri aşmıyor.',
      'Açıklamanın ilk paragrafı ürünün ne yaptığını daha hızlı anlatıyor; doğrulanmamış yeni özellik eklenmedi.',
      'Görseller, fiyat, kategori ve dijital dosyalar değiştirilmez.',
      'Türkçe karşılığı: ' + {"4576154195":"26'dan fazla yapay zekâ API sağlayıcısını canlı güncellemelerle keşfetmeye ve karşılaştırmaya yarayan Android uygulaması.","4576139109":"İçinde index.html bulunan uyumlu ZIP projelerini uygulama adı ve logo seçeneğiyle imzalı APK dosyasına dönüştüren Android uygulaması.","4573718071":"83 araştırılmış ürün fırsatı, rakip analizi, 9 kriterli doğrulama puanlaması, kâr tahmini ve ilan planlama araçlarını birleştiren Etsy araştırma sistemi.","4574820715":"Randevu, müşteri, berber, hizmet, stok ve rapor yönetimini Windows bilgisayarda yerel olarak yapan berber dükkânı yazılımı.","4574114283":"Ev tipi fırın ve pasta işletmeleri için malzeme/reçete maliyeti, satış fiyatı, kâr marjı ve sipariş takibi sağlayan Excel çalışma kitabı.","4576174491":"26'dan fazla yapay zekâ API sağlayıcısını uygulamaya ekli sabit veri listesi üzerinden arayan ve karşılaştıran temel Android sürümü; Pro canlı güncellemeleri içermez.","4576184560":"Uyumlu ZIP/HTML projelerini uygulama adı, logo ve imzalama seçenekleriyle Android APK paketlerine dönüştüren Windows masaüstü aracı.","4573839919":"Satış, Etsy ücretleri, reklam maliyetleri, ürün fiyatlandırması, ödeme tahminleri ve kâr senaryolarını izleyen 21 sayfalı Excel sistemi.","4574138529":"Basınçlı yıkama işletmeleri için iş fiyatı ve teklif hazırlama, müşteri/iş takibi, maliyet ve kâr izleme sistemi.","4584002494":"Üniversite araştırması, başvuru ve son tarih takibi, kompozisyonlar, referanslar, maliyet ve burs karşılaştırması için 17 sayfalı Excel yönetim dosyası.","4580683019":"Randevu, müşteri kayıtları, bakım işlemleri, paketler, hizmetler, stok, personel, ödeme ve rapor modüllerine sahip çevrimdışı Windows salon yazılımı.","4579223691":"Yüklenen ürün fotoğrafını yazılı komut ve bağlı yapay zekâ sağlayıcısıyla e-ticaret görsellerine dönüştüren Windows masaüstü uygulaması.","4580566924":"Seyahat programı, bütçe, ortak harcamalar, bavul, rezervasyonlar ve hazırlık görevleri için Türkçe-İngilizce Excel ve Google Sheets dosyası.","4579183270":"Ürün fotoğrafı yükleme, yazılı komut girme, desteklenen yapay zekâ sağlayıcısı/modeli seçme, görsel varyasyonları üretme ve geçmiş/favorilere kaydetme özellikli Android uygulaması.","4582064360":"Görev ve hedef takibi, hatırlatıcılar, Life Rescue planlaması ve İZCİ akıllı takip sistemine sahip Android kişisel düzenleyici.","4583609425":"Koli durum takibi, kayıp koli radarı, paketleme görevleri, bütçe planı ve yazdırılabilir taşınma dosyası içeren Türkçe-İngilizce Excel/Google Sheets sistemi."}[id],
      ...(id === 4579183270 ? ['Ürün dosyasında sesli komut bulunmadığı için sesle konuşma ve doğrudan görsel düzenleme iddiaları kaldırıldı.'] : []),
    ],
    hold: false,
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
      if (recommendation.hold) { res.status(409).json({ error: recommendation.hold_reason }); return; }
      let body=req.body; if (typeof body === 'string') { try { body=JSON.parse(body); } catch { body={}; } }
      if (body?.action !== 'apply') { res.status(400).json({ error:'Uygulamak için action=apply gönderilmelidir.' }); return; }
      const proposed=body.proposed || recommendation.proposed;
      const title=String(proposed.title||'').trim().slice(0,140);
      const tags=Array.isArray(proposed.tags) ? proposed.tags.map(String).map(t=>t.trim()).filter(Boolean).slice(0,13) : [];
      const description=String(proposed.description||'').trim();
      if (!title || !tags.length) { res.status(400).json({ error:'Başlık ve etiket önerisi boş bırakılamaz.' }); return; }
      if (tags.length !== 13 || new Set(tags).size !== 13) { res.status(400).json({ error:'Tam 13 farklı Etsy etiketi gönderilmelidir.' }); return; }
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
