import { etsyApiFetch, getEtsyAccessToken, requireAdminRequest } from './_lib.js';

const RECOMMENDATIONS = {
  4576154195: {
    title: 'AI API Finder Pro | 26+ AI API Providers | Android App',
    tags: ['ai api finder','ai api tools','api provider list','android app','ai developer tool','api directory','ai tools','developer tools','api discovery','ai software','programming tool','tech tools','digital download'],
    intro: 'AI API Finder Pro helps developers discover and compare 26+ AI API providers from one Android app. A practical reference tool for developers exploring AI APIs, providers and integrations.',
  },
  4584002494: {
    title: 'College Application Tracker | University Application Planner | Excel Spreadsheet',
    tags: ['college planner','college tracker','application tracker','university planner','college spreadsheet','application spreadsheet','student planner','admission tracker','college checklist','school planner','student spreadsheet','excel planner','digital download'],
    intro: 'College Application Tracker is an Excel spreadsheet for organizing university applications, deadlines, requirements, documents and application progress in one place.',
  },
  4573718071: {
    title: 'Etsy Product Research Tool | Product Ideas & Competitor Analysis Spreadsheet',
    tags: ['etsy product research','etsy product ideas','product research tool','etsy research','competitor analysis','etsy seller tool','digital product ideas','etsy spreadsheet','product finder','etsy seo tool','seller research','etsy analytics','digital download'],
    intro: 'Etsy Product Research Tool helps sellers organize product ideas, competitor research and opportunity analysis in a practical spreadsheet workflow.',
  },
  4576184560: {
    title: 'Windows APK Builder | Convert ZIP to Android APK | No Code App Builder',
    tags: ['apk builder','android app builder','zip to apk','windows app','no code android','apk creator','android builder','app maker','android software','apk generator','developer tool','digital download','windows software'],
    intro: 'Windows APK Builder converts supported ZIP app projects into Android APK packages with a simple desktop workflow, without requiring a full Android development environment.',
  },
  4574114283: {
    title: 'Bakery Pricing Calculator | Recipe Cost & Profit Spreadsheet | Excel',
    tags: ['bakery pricing','recipe cost sheet','bakery profit','cake pricing','food cost calculator','home bakery','bakery spreadsheet','recipe costing','cake costing','order tracker','baking business','pricing calculator','excel template'],
    intro: 'Bakery Pricing Calculator is an Excel spreadsheet for home bakers and small bakeries to calculate recipe costs, selling prices, profit margins and order economics.',
  },
  4580683019: {
    title: 'Beauty Salon Management Software | Client Staff Inventory & Payments | Windows',
    tags: ['salon management','beauty salon software','salon client tracker','salon inventory','appointment software','beauty business','salon software','staff management','payment tracker','windows software','client management','business software','digital download'],
    intro: 'BeautyOS Pro is a Windows management app for beauty salons to organize clients, staff, inventory, appointments and payments in one place.',
  },
  4575285227: {
    title: 'Etsy Customer Service Templates | 120 Buyer Reply Scripts | Excel & ChatGPT',
    tags: ['etsy seller support','etsy reply templates','customer service','buyer replies','etsy messages','reply scripts','chatgpt prompts','refund response','review response','etsy seller tool','customer support','excel template','digital download'],
    intro: 'Etsy Customer Service Templates includes 120 buyer reply scenarios, reusable response scripts and ChatGPT prompts for handling common Etsy customer messages.',
  },
  4576139109: {
    title: 'No-Code Android APK Builder | ZIP to APK App Maker | Windows',
    tags: ['apk builder','android app builder','zip to apk','no code android','apk maker','android app maker','windows software','apk creator','app builder','android tool','developer tool','digital download','windows app'],
    intro: 'No-Code Android APK Builder is a desktop tool for turning supported ZIP app projects into Android APK packages with a simpler no-code workflow.',
  },
  4580566924: {
    title: 'Travel Planner Spreadsheet | Itinerary Budget & Packing List | Excel',
    tags: ['travel planner','trip planner','travel itinerary','vacation planner','travel budget','packing list','trip spreadsheet','vacation checklist','travel organizer','holiday planner','travel checklist','excel planner','digital download'],
    intro: 'Travel Planner is an Excel spreadsheet for organizing trip itineraries, budgets, packing lists and travel tasks in one place.',
  },
  4579183270: {
    title: 'AI Product Photo Generator | E-commerce Product Images | Etsy Amazon Shopify',
    tags: ['product photo ai','ai product photos','product photography','etsy product images','amazon product photo','shopify images','ecommerce visuals','ai photo generator','product mockup ai','listing images','ecommerce tool','digital download','ai design tool'],
    intro: 'AI Product Photo Generator helps e-commerce sellers create product visuals for Etsy, Amazon and Shopify listings with a faster AI-assisted workflow.',
  },
  4579223691: {
    title: 'AI Product Photo Generator for Windows | E-commerce Listing Images',
    tags: ['ai product photos','product photo generator','windows ai tool','etsy product images','amazon product photo','shopify images','ecommerce visuals','ai photo tool','product mockup','listing images','windows software','digital download','ai design tool'],
    intro: 'AGT AI Product Photo Generator is a Windows tool for creating e-commerce product visuals and listing images for online stores.',
  },
  4582064360: {
    title: 'Life Organizer App | Tasks Goals Reminders | Windows Productivity Tool',
    tags: ['life organizer','task planner','goal tracker','reminder app','productivity app','daily planner','life planner','task manager','goal planner','windows app','personal organizer','productivity tool','digital download'],
    intro: 'AGT LIFE is a productivity app for organizing tasks, goals and reminders in one simple personal workspace.',
  },
  4573839919: {
    title: 'Etsy Profit Calculator | Fee Calculator Pricing Tracker | Excel Spreadsheet',
    tags: ['etsy profit calculator','etsy fee calculator','etsy pricing','etsy seller spreadsheet','etsy profit tracker','etsy fees','profit tracker','pricing calculator','seller finance','etsy business tool','excel spreadsheet','etsy accounting','digital download'],
    intro: 'Etsy Profit Command Center is an Excel spreadsheet for estimating Etsy fees, pricing products, tracking profit and reviewing seller economics.',
  },
  4577542450: {
    title: 'Etsy Product Idea Finder | 259,200 Product Concepts | Android App',
    tags: ['etsy product ideas','etsy idea finder','product idea generator','etsy seller tool','product research','digital product ideas','etsy research tool','product finder','etsy niche ideas','android app','seller research','etsy business','digital download'],
    intro: 'Etsy Product Idea Finder helps sellers explore 259,200 product concepts and organize product research ideas from an Android app.',
  },
  4583609425: {
    title: 'Moving Planner | Moving Checklist & Box Inventory | Excel Spreadsheet',
    tags: ['moving planner','moving checklist','moving organizer','box inventory','house move planner','relocation planner','moving spreadsheet','packing checklist','moving tracker','home organization','moving list','excel planner','digital download'],
    intro: 'Moving Planner is an Excel spreadsheet for organizing moving tasks, packing checklists and box inventory during a home move.',
  },
  4574820715: {
    title: 'Barbershop Management Software | Appointments CRM Inventory | Windows',
    tags: ['barbershop software','barber management','barber appointment','barber crm','barbershop inventory','salon software','appointment manager','client management','barber business','windows software','staff management','payment tracker','digital download'],
    intro: 'Barbershop Management Software is a Windows app for appointments, customer records, inventory and day-to-day barbershop operations.',
  },
  4576174491: {
    title: 'AI API Finder Basic | 26+ AI Providers | Android App',
    tags: ['ai api finder','ai api tools','api providers','android app','ai developer tool','api directory','ai tools','developer tools','api discovery','ai software','programming tool','tech tools','digital download'],
    intro: 'AI API Finder Basic is an Android app for discovering 26+ AI API providers and exploring options for AI development projects.',
  },
  4574138529: {
    title: 'Pressure Washing Business Spreadsheet | Pricing Calculator & Job Tracker',
    tags: ['pressure washing','pressure washing pricing','pressure washing business','job tracker','profit calculator','service business','pricing spreadsheet','pressure washing quotes','job costing','business spreadsheet','profit tracker','excel template','digital download'],
    intro: 'Pressure Washing Business Spreadsheet helps service businesses calculate pricing, track jobs, estimate profit and organize pressure washing work in Excel.',
  },
};

function buildRecommendation(listing) {
  const id = Number(listing.listing_id);
  const preset = RECOMMENDATIONS[id];
  const currentTitle = String(listing.title || '').trim();
  const currentTags = Array.isArray(listing.tags) ? listing.tags.map(String) : [];
  const currentDescription = String(listing.description || '').trim();
  if (preset) {
    const description = currentDescription
      ? (currentDescription.startsWith(preset.intro) ? currentDescription : preset.intro + '\n\n' + currentDescription)
      : preset.intro;
    return {
      listing_id: id,
      current: { title: currentTitle, tags: currentTags, description: currentDescription },
      proposed: { title: preset.title, tags: preset.tags.slice(0, 13), description },
      reasons: [
        'Başlık daha kısa ve ana satın alma niyetini ilk bölümde anlatıyor.',
        'Etiketler ürünün gerçek kullanım amacına ve arama niyetine göre yeniden gruplanıyor.',
        'Açıklama ilk paragrafta ürünün ne olduğunu ve kimin için olduğunu netleştiriyor.',
        'Mevcut açıklamanın geri kalanı korunuyor; fiyat, görsel ve dosya içeriğine dokunulmuyor.',
      ],
    };
  }
  const words = currentTitle.replace(/[|,:/()]+/g, ' ').split(/\s+/).filter(Boolean);
  const core = words.slice(0, 8).join(' ');
  const tags = [...new Set([...currentTags, ...words.filter(w => w.length >= 4)])].slice(0, 13);
  const title = core.length > 120 ? core.slice(0, 120).trim() : core;
  const intro = title || currentTitle;
  const description = currentDescription ? 'What it is: ' + intro + '.\n\n' + currentDescription : intro + '.';
  return {
    listing_id: id,
    current: { title: currentTitle, tags: currentTags, description: currentDescription },
    proposed: { title, tags, description },
    reasons: ['Başlık sadeleştirildi ve ana ürün ifadesi öne alındı.', 'Mevcut etiketlerden ve başlıktaki güçlü terimlerden daha sıkı bir etiket seti oluşturuldu.', 'Açıklamanın ilk satırına net ürün özeti eklendi.'],
  };
}

export default async function handler(req, res) {
  try {
    await requireAdminRequest(req);
    const { shopUserId } = await getEtsyAccessToken();
    const shop = await etsyApiFetch('/users/' + shopUserId + '/shops');
    const shopId = Number(shop?.shop_id);
    const listingId = Number(req.query.listing_id || req.body?.listing_id || 0);
    if (!shopId || !listingId) {
      res.status(400).json({ error: 'Geçerli bir Etsy ilanı seçilmedi.' });
      return;
    }

    const listing = await etsyApiFetch('/listings/' + listingId + '?includes=Images');
    const recommendation = buildRecommendation(listing);

    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json(recommendation);
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    if (body?.action !== 'apply') {
      res.status(400).json({ error: 'Uygulamak için action=apply gönderilmelidir.' });
      return;
    }

    const proposed = body.proposed || recommendation.proposed;
    const title = String(proposed.title || '').trim().slice(0, 140);
    const tags = Array.isArray(proposed.tags) ? proposed.tags.map(String).map(t => t.trim()).filter(Boolean).slice(0, 13) : [];
    const description = String(proposed.description || '').trim();
    if (!title || !tags.length) {
      res.status(400).json({ error: 'Başlık ve etiket önerisi boş bırakılamaz.' });
      return;
    }
    if (tags.some(tag => tag.length > 20)) {
      res.status(400).json({ error: 'Etsy etiketleri 20 karakteri aşamaz.' });
      return;
    }

    await etsyApiFetch('/shops/' + shopId + '/listings/' + listingId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
      body: new URLSearchParams({ title, tags: tags.join(','), description }).toString(),
    });

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ ok: true, message: 'SEO önerisi Etsy ilanına uygulandı.', recommendation: { ...recommendation, proposed: { title, tags, description } } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Etsy optimizasyonu başarısız';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 502;
    res.status(status).json({ error: message });
  }
}
