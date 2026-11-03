import { etsyApiFetch, getEtsyAccessToken, requireAdminRequest } from './_lib.js';

const SEO_UPDATES = {
  "4576154195": {
    "title": "AI API Finder Pro Android App: 26+ Providers & Live Updates",
    "tags": [
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
    "descriptionIntro": "AI API Finder Pro is an Android directory for discovering and comparing 26+ AI API providers, with live data refreshes for supported provider updates.",
    "descriptionNote": ""
  },
  "4576139109": {
    "title": "Android APK Builder App: ZIP to APK Without Coding",
    "tags": [
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
    "descriptionIntro": "AGT Studio Android APK Builder is an Android app that converts compatible ZIP projects containing an index.html or index.htm file into signed APK files, with app-name and logo options.",
    "descriptionNote": "IMPORTANT: This is the Android APK Builder app. The selected ZIP project must contain index.html or index.htm. The app lets you choose the generated app name and logo and signs the output APK."
  },
  "4573718071": {
    "title": "Etsy Product Research System: 83 Ideas, Validation & Profit Tools",
    "tags": [
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
    "descriptionIntro": "Etsy Product Research System combines 83 researched product opportunities with competitor analysis, a 9-factor validation scorecard, profit estimates and listing-planning tools.",
    "descriptionNote": ""
  },
  "4574820715": {
    "title": "Barbershop Management Software for Windows: Appointments & Inventory",
    "tags": [
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
    "descriptionIntro": "BarberOS Pro is a Windows 10/11 desktop app for managing barbershop appointments, customers, barbers, services, inventory and reports with local data storage.",
    "descriptionNote": "COMPATIBILITY: Windows 10/11 x64 desktop application. Normal use stores data locally and does not require an internet connection."
  },
  "4574114283": {
    "title": "Bakery Pricing Calculator Excel: Recipe Costs & Profit Tracker",
    "tags": [
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
    "descriptionIntro": "Bakery Profit Command Center is an Excel workbook for ingredient and recipe costing, product pricing, profit-margin analysis and order tracking for home bakeries.",
    "descriptionNote": ""
  },
  "4576174491": {
    "title": "AI API Finder Basic Android App: 26+ AI API Providers",
    "tags": [
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
    "descriptionIntro": "AI API Finder Basic is an Android app for searching and comparing 26+ AI API providers from its included data snapshot; it does not include the Pro live-update system.",
    "descriptionNote": ""
  },
  "4576184560": {
    "title": "Windows APK Builder: Convert ZIP Projects to Android APK",
    "tags": [
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
    "descriptionIntro": "Windows APK Builder is a Windows desktop tool for converting compatible ZIP/HTML projects into Android APK packages, with app-name, logo and signing options.",
    "descriptionNote": ""
  },
  "4573839919": {
    "title": "Etsy Profit Tracker Excel Workbook: Fees, Pricing & Dashboard",
    "tags": [
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
    "descriptionIntro": "Etsy Profit Command Center is a 21-sheet Excel system for tracking sales, Etsy fees, advertising costs, product pricing, payout estimates and profit scenarios.",
    "descriptionNote": ""
  },
  "4574138529": {
    "title": "Pressure Washing Business Spreadsheet: Quotes, Jobs & Profit",
    "tags": [
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
    "descriptionIntro": "Pressure Washing Profit Command Center is an Excel and Google Sheets system for estimating job prices, preparing quotes, tracking customers and jobs, and monitoring costs and profit.",
    "descriptionNote": ""
  },
  "4584002494": {
    "title": "College Application Tracker Spreadsheet: Deadlines & Scholarships",
    "tags": [
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
    "descriptionIntro": "College Application Tracker is a 17-sheet Excel command center for researching colleges, tracking applications and deadlines, managing essays and recommendations, and comparing costs and scholarships.",
    "descriptionNote": "IMPORTANT: Sample/demo data is included. Replace it with your own information and independently verify scholarship eligibility and deadlines."
  },
  "4580683019": {
    "title": "Beauty Salon Management Software for Windows: Clients & Appointments",
    "tags": [
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
    "descriptionIntro": "BeautyOS Pro is an offline Windows salon-management app with appointments, client records, treatments, packages, services, inventory, staff, payments and reports.",
    "descriptionNote": "COMPATIBILITY: Windows desktop application. The included build is designed for offline use."
  },
  "4579223691": {
    "title": "AI Product Photo Generator for Windows: E-Commerce Images",
    "tags": [
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
    "descriptionIntro": "AGT Product AI is a Windows desktop app that turns an uploaded product photo and a written prompt into e-commerce visuals using a connected AI provider or model.",
    "descriptionNote": "AI PROVIDER NOTE: Image generation requires a supported connected AI provider/model. Puter sign-in or provider API details may be required. Third-party fees, free quotas and usage limits are controlled by the provider and are not included in the purchase."
  },
  "4580566924": {
    "title": "Travel Planner Spreadsheet: Itinerary, Budget & Group Expenses",
    "tags": [
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
    "descriptionIntro": "AGT Studio Ultimate Travel Planner is a bilingual Excel and Google Sheets workbook for trip itineraries, budgets, shared expenses, packing, reservations and preparation tasks.",
    "descriptionNote": "CURRENCY NOTE: Exchange rates are entered manually. The workbook does not provide live exchange-rate updates."
  },
  "4579183270": {
    "title": "AI Product Photo Generator Android App: E-Commerce Images",
    "tags": [
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
    "descriptionIntro": "AGT Product AI is an Android app for uploading a product photo, writing a prompt, choosing a supported AI provider or model, generating image variations, and saving results to History or Favorites.",
    "descriptionNote": "AI PROVIDER NOTE: Image generation requires a supported connected AI provider/model. Puter sign-in or provider API details may be required. Third-party fees, free quotas and usage limits are controlled by the provider and are not included in the purchase."
  },
  "4582064360": {
    "title": "AGT LIFE Android Organizer App: Tasks, Goals & Reminders",
    "tags": [
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
    "descriptionIntro": "AGT LIFE is an Android personal-organizer app with task and goal tracking, reminders, Life Rescue planning and the İZCİ smart-tracking system.",
    "descriptionNote": "ANDROID NOTE: This is an Android APK; iPhone and iPad are not supported. Allow notifications and exact alarms if you want reminders. Some online features may require an internet connection."
  },
  "4583609425": {
    "title": "Moving Planner Spreadsheet: Box Inventory & Missing Box Radar",
    "tags": [
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
    "descriptionIntro": "Moving Command Center PRO is a bilingual Excel and Google Sheets moving system with box-status tracking, a Missing Box Radar, packing tasks, budget planning and a printable binder.",
    "descriptionNote": "GOOGLE SHEETS: Upload the XLSX to Google Drive and open it with Google Sheets. Make a copy before editing."
  }
};

const HELD_LISTINGS = {
  "4575285227": "BEKLEMEDE: İlan 120 Etsy müşteri yanıtı şablonu vaat ediyor; elimdeki benzer isimli yerel çalışma kitabı 2.169 genel yapay zekâ istemi içeriyor. İlanın Etsy'ye yüklenmiş asıl dosyası eşleştirilmeden bu ürünü değiştirmeyeceğim.",
  "4577542450": "BEKLEMEDE: İlan Android Product Radar uygulaması olarak tanıtılıyor; elimdeki yerel Product-Radar-Setup.exe Windows kurulum dosyası ve eşleşen Android APK bulunamadı. Gerçek teslimat dosyası doğrulanmadan bu ürünü değiştirmeyeceğim."
};

function buildDescription(existing, intro, note, listingId) {
  let current = String(existing || '').trim();
  if (Number(listingId) === 4579183270) {
    current = current
      .replace(/Simply type or speak what you want, connect your preferred AI model, and create product images designed for online stores, marketplaces and social media\./i,
        'Upload a product photo, write a prompt, connect a supported AI provider or model, and generate product visuals for online stores and marketplaces.')
      .replace(/🎙️ Type or Speak\s*\nDescribe what you want using text or voice\. No complicated design process required\./i,
        '✍️ Write a Prompt\nDescribe the scene, background, lighting and visual style you want in a written prompt.')
      .replace(/✨ Smart Editing\s*\nCustomize your product visuals, backgrounds, colors, text and presentation\./i,
        '✨ Prompt-Based Visual Direction\nDescribe the background, lighting, colors and presentation you want in your written prompt.')
      .replace(/Type it\. Speak it\. Create it\. Sell it\./i,
        'Upload it. Describe it. Create it. Sell it.');
  }
  let result = current && current.startsWith(intro) ? current : (intro + (current ? '\n\n' + current : ''));
  if (note && !result.includes(note)) result += '\n\n' + note;
  return result;
}

function validateUpdate(id, update) {
  if (!update.title || update.title.length > 140 || update.title.split(/\s+/).length > 14) {
    throw new Error('SEO başlığı Etsy sınırlarını aşıyor: ' + id);
  }
  if (!Array.isArray(update.tags) || update.tags.length !== 13 || new Set(update.tags).size !== 13 || update.tags.some(tag => String(tag).length > 20)) {
    throw new Error('SEO etiketleri 13 farklı etiket / 20 karakter koşulunu karşılamıyor: ' + id);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    await requireAdminRequest(req);
    const { shopUserId } = await getEtsyAccessToken();
    const shop = await etsyApiFetch('/users/' + shopUserId + '/shops');
    const shopId = Number(shop?.shop_id);
    if (!shopId) throw new Error('Etsy shop ID bulunamadı.');

    const live = await etsyApiFetch('/shops/' + shopId + '/listings?state=active&limit=100&offset=0');
    const changed = [];
    const skipped = [];
    for (const listing of live?.results || []) {
      const id = Number(listing.listing_id);
      if (HELD_LISTINGS[id]) {
        skipped.push({ listing_id: id, reason: HELD_LISTINGS[id] });
        continue;
      }
      const update = SEO_UPDATES[id];
      if (!update) continue;
      validateUpdate(id, update);
      const nextDescription = buildDescription(listing.description, update.descriptionIntro, update.descriptionNote, id);
      const titleChanged = String(listing.title || '') !== update.title;
      const tagsChanged = JSON.stringify(Array.isArray(listing.tags) ? listing.tags : []) !== JSON.stringify(update.tags);
      const descriptionChanged = String(listing.description || '') !== nextDescription;
      if (!titleChanged && !tagsChanged && !descriptionChanged) {
        skipped.push({ listing_id: id, reason: 'SEO başlığı, etiketler ve doğrulanmış açıklama notları zaten güncel.' });
        continue;
      }
      const payload = {};
      if (titleChanged) payload.title = update.title;
      if (tagsChanged) payload.tags = update.tags.join(',');
      if (descriptionChanged) payload.description = nextDescription;
      await etsyApiFetch('/shops/' + shopId + '/listings/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(payload).toString(),
      });
      changed.push({ listing_id: id, old_title: listing.title, new_title: update.title, tags_updated: tagsChanged, description_updated: descriptionChanged });
    }
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      ok: true,
      changed,
      skipped,
      message: `${changed.length} üründe başlık, 13 etiket ve açıklama girişi güncellendi. Görseller, fiyatlar, kategoriler ve dijital dosyalar değiştirilmedi. ${Object.keys(HELD_LISTINGS).length} ürün dosya doğrulaması nedeniyle beklemede.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Etsy SEO optimization failed';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 502;
    res.status(status).json({ error: message });
  }
}
