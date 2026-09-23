import fs from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
const source = path.join(dist, "index.html");

const routes = [
  {
    path: "/etsy-profit-calculator",
    title: "Etsy Profit Calculator & Fee Tracker | AGT Studio",
    description: "Etsy profit calculator and fee tracker for sellers. Track Etsy fees, pricing and product profitability with a practical Excel-based digital tool.",
    keywords: "etsy profit calculator, etsy fee calculator, etsy pricing calculator, etsy seller spreadsheet",
    type: "SoftwareApplication",
    name: "Etsy Profit Calculator & Fee Tracker"
  },
  {
    path: "/etsy-product-research-tool",
    title: "Etsy Product Research Tool | AGT Studio",
    description: "Research digital product ideas, competitors and opportunities with an Etsy product research tool built for sellers and creators.",
    keywords: "etsy product research tool, digital product ideas, etsy competitor analysis, product validation",
    type: "SoftwareApplication",
    name: "Etsy Product Research Tool"
  },
  {
    path: "/etsy-product-idea-finder",
    title: "Etsy Product Idea Finder | AGT Studio",
    description: "Explore a large library of digital product ideas with an Etsy product idea finder Android app for sellers and creators.",
    keywords: "etsy product ideas, etsy product idea finder, digital product ideas, etsy seller tool",
    type: "SoftwareApplication",
    name: "Etsy Product Idea Finder"
  },
  {
    path: "/pressure-washing-pricing-calculator",
    title: "Pressure Washing Pricing Calculator | AGT Studio",
    description: "Pressure washing pricing calculator and job tracker for businesses. Manage pricing, jobs and profitability in one Excel workspace.",
    keywords: "pressure washing pricing calculator, pressure washing spreadsheet, pressure washing business tracker",
    type: "SoftwareApplication",
    name: "Pressure Washing Pricing Calculator & Job Tracker"
  },
  {
    path: "/bakery-pricing-calculator",
    title: "Bakery Pricing Calculator & Recipe Cost Tool | AGT Studio",
    description: "Bakery pricing calculator and recipe cost spreadsheet for home bakers and bakeries to manage costs, pricing, profit and orders.",
    keywords: "bakery pricing calculator, recipe cost calculator, cake cost calculator, home bakery spreadsheet",
    type: "SoftwareApplication",
    name: "Bakery Pricing Calculator & Recipe Cost Tool"
  },
  {
    path: "/etsy-customer-support-tool",
    title: "Etsy Seller Customer Support Tool | AGT Studio",
    description: "Prepare faster, more consistent Etsy buyer responses with a practical customer support tool combining Excel workflows and AI-ready reply templates.",
    keywords: "etsy customer support tool, etsy message templates, ai buyer replies",
    type: "SoftwareApplication",
    name: "Etsy Seller Customer Support Tool"
  },
  {
    path: "/ai-api-finder-pro",
    title: "AI API Finder Pro | AGT Studio",
    description: "Discover AI API providers and developer options with an Android app designed to make AI API research faster and easier.",
    keywords: "ai api finder, ai api providers, free ai APIs, developer AI tools",
    type: "SoftwareApplication",
    name: "AI API Finder Pro"
  },
  {
    path: "/ai-api-finder-basic",
    title: "AI API Finder Basic | AGT Studio",
    description: "Explore AI API options with a simple Android discovery app for developers looking for practical AI API resources.",
    keywords: "ai api finder, AI API list, AI API discovery, developer AI tools",
    type: "SoftwareApplication",
    name: "AI API Finder Basic"
  },
  {
    path: "/no-code-apk-builder",
    title: "No-Code Android APK Builder | AGT Studio",
    description: "Turn a ZIP-based Android project into an APK with a practical no-code desktop workflow designed to simplify app packaging.",
    keywords: "apk builder, android apk builder, zip to apk, no code apk builder",
    type: "SoftwareApplication",
    name: "No-Code Android APK Builder"
  },
  {
    path: "/windows-apk-builder",
    title: "Windows APK Builder – ZIP to Android App | AGT Studio",
    description: "Simplify converting ZIP-based projects into Android applications with a practical Windows APK builder.",
    keywords: "windows apk builder, zip to android app, apk maker windows, android app builder",
    type: "SoftwareApplication",
    name: "Windows APK Builder"
  },
  {
    path: "/barbershop-management-software",
    title: "Barbershop Management Software | AGT Studio",
    description: "Windows barbershop management software for appointments, customer records and inventory in one practical desktop app.",
    keywords: "barbershop management software, barber appointment software, barber crm, barber inventory",
    type: "SoftwareApplication",
    name: "Barbershop Management Software"
  },
  {
    path: "/logo-tasarimi",
    title: "Logo Design | AGT Studio",
    description: "Original logo design services for brands and businesses, with professional visual identity concepts for digital and print use.",
    keywords: "logo design, professional logo, brand logo, business logo design",
    type: "Service",
    name: "Logo Design"
  },
  {
    path: "/sosyal-medya-tasarimi",
    title: "Social Media Design | AGT Studio",
    description: "Professional social media design for Instagram and other channels, aligned with your brand identity and digital content needs.",
    keywords: "social media design, Instagram design, social media post design",
    type: "Service",
    name: "Social Media Design"
  },
  {
    path: "/web-tasarim",
    title: "Web Design | AGT Studio",
    description: "Mobile-friendly, conversion-focused web design for businesses that need a professional and modern online presence.",
    keywords: "web design, corporate web design, mobile-friendly website",
    type: "Service",
    name: "Web Design"
  },
  {
    path: "/menu-tasarimi",
    title: "Menu Design | AGT Studio",
    description: "Readable, stylish menu design for restaurants, cafes and businesses, including print, digital and QR menu use cases.",
    keywords: "menu design, restaurant menu design, cafe menu design",
    type: "Service",
    name: "Menu Design"
  },
  {
    path: "/kartvizit-tasarimi",
    title: "Business Card Design | AGT Studio",
    description: "Professional, clean and print-ready business card designs for businesses and personal brands.",
    keywords: "business card design, professional business card, corporate business card",
    type: "Service",
    name: "Business Card Design"
  },
  {
    path: "/yapay-zeka-cozumleri",
    title: "AI Solutions | AGT Studio",
    description: "Practical AI-powered solutions for business content, design workflows and digital processes.",
    keywords: "AI solutions, artificial intelligence solutions, AI for businesses",
    type: "Service",
    name: "AI Solutions"
  },
  {
    path: "/privacy",
    title: "Pinterest API Privacy Policy | AGT Studio",
    description: "AGT Studio privacy policy for the Pinterest API integration, OAuth authorization, data handling, security and account access.",
    keywords: "AGT Studio privacy policy, Pinterest API privacy policy, Pinterest OAuth, data privacy",
    type: "WebPage",
    name: "Privacy Policy"
  }
];

if (!fs.existsSync(source)) {
  throw new Error("dist/index.html not found after Vite build");
}

const base = fs.readFileSync(source, "utf8");

function esc(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function setMeta(html, pattern, replacement) {
  return html.match(pattern) ? html.replace(pattern, replacement) : html.replace("</head>", replacement + "</head>");
}

for (const route of routes) {
  const url = `https://agt-studio.vercel.app${route.path}`;
  let html = base;

  // Pinterest's reviewer must be able to read the privacy policy from the
  // raw public HTML without depending on client-side React execution.
  if (route.path === "/privacy") {
    html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Privacy Policy | AGT Studio / AGTStudioCo Pin Publisher</title>
<meta name="description" content="AGT Studio privacy policy for the AGTStudioCo Pin Publisher Pinterest API and OAuth integration.">
<link rel="canonical" href="https://agt-studio.vercel.app/privacy">
<meta name="robots" content="index, follow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="AGT Studio">
<meta property="og:title" content="Privacy Policy | AGT Studio">
<meta property="og:description" content="Privacy policy for AGTStudioCo Pin Publisher and its Pinterest API integration.">
<meta property="og:url" content="https://agt-studio.vercel.app/privacy">
</head>
<body style="margin:0;background:#080808;color:#f5f5f5;font-family:Arial,sans-serif;line-height:1.7">
<main style="max-width:900px;margin:0 auto;padding:48px 24px">
<h1>Privacy Policy</h1>
<p><strong>AGT Studio / AGTStudioCo Pin Publisher</strong></p>
<p><strong>Last updated:</strong> September 23, 2026</p>
<p><strong>Policy version:</strong> 1.2</p>
<p><strong>Contact email:</strong> <a href="mailto:agtstudyo@gmail.com" style="color:#d4af37">agtstudyo@gmail.com</a></p>
<p><strong>Application website:</strong> <a href="https://agt-studio.vercel.app/" style="color:#d4af37">https://agt-studio.vercel.app/</a></p>

<h2>1. About This Policy</h2>
<p>This Privacy Policy explains how AGT Studio (AGTStudioCo) handles information for the AGTStudioCo Pin Publisher application and related website services. The application is operated by AGT Studio and uses the official Pinterest API to manage and publish content to the authorized Pinterest account.</p>

<h2>2. Pinterest API and OAuth</h2>
<p>AGTStudioCo Pin Publisher uses the official Pinterest API and Pinterest OAuth authorization flow. We do not request or store a Pinterest account password. Authorization takes place on Pinterest, and API access is granted only after the account owner explicitly approves the requested permissions.</p>

<h2>3. Information We Process</h2>
<p>Depending on the permissions granted, the application may process Pinterest account identifiers, board information, Pin information, and OAuth access credentials required to perform authorized API operations. We request only the permissions necessary for the publishing workflow.</p>

<h2>4. How Information Is Used</h2>
<p>Pinterest API information is used only to authenticate the authorized account, create or manage Pins and boards where permitted, synchronize publishing tasks, and operate AGT Studio's Pinterest publishing workflow. Pinterest API data is not sold, rented, or used for unrelated advertising purposes.</p>

<h2>5. Data Sharing</h2>
<p>We do not sell Pinterest API data, provide it to data brokers, or share it with unrelated third parties. Information may be processed by infrastructure providers used to operate the AGT Studio website and application, only as necessary to provide the service.</p>

<h2>6. Security</h2>
<p>OAuth credentials and access tokens are treated as confidential application data and are not intentionally exposed in the public website or browser interface. We use reasonable technical measures to protect application credentials and API data against unauthorized access.</p>

<h2>7. Data Retention and Access Revocation</h2>
<p>We retain API-related information only for as long as reasonably necessary to operate the authorized workflow. The account owner can revoke the application's Pinterest access through Pinterest. After access is revoked, the application can no longer make authorized API requests on behalf of that account.</p>

<h2>8. Data Deletion Requests</h2>
<p>You may request deletion of application-held personal information by contacting AGT Studio at <a href="mailto:agtstudyo@gmail.com" style="color:#d4af37">agtstudyo@gmail.com</a>. We will review valid requests and delete information that we are not required to retain for legal, security, or operational reasons.</p>

<h2>9. Third-Party Services</h2>
<p>Pinterest is a third-party platform used by the application. Pinterest independently processes information under its own terms and privacy policy. AGT Studio does not control Pinterest's independent processing.</p>

<h2>10. Contact</h2>
<p><strong>AGT Studio / AGTStudioCo</strong><br>
Website: <a href="https://agt-studio.vercel.app/" style="color:#d4af37">https://agt-studio.vercel.app/</a><br>
Privacy Policy: <a href="https://agt-studio.vercel.app/privacy" style="color:#d4af37">https://agt-studio.vercel.app/privacy</a><br>
Email: <a href="mailto:agtstudyo@gmail.com" style="color:#d4af37">agtstudyo@gmail.com</a></p>

<h2>11. Policy Updates</h2>
<p>We may update this Privacy Policy when the application, Pinterest API integration, or applicable requirements change. The current version is always published at this URL.</p>

<hr style="margin:48px 0 32px;border:0;border-top:1px solid #333">

<h1>Gizlilik Politikası</h1>
<p><strong>AGT Studio / AGTStudioCo Pin Publisher</strong></p>
<p><strong>Son güncelleme:</strong> 23 Eylül 2026</p>
<p><strong>Politika sürümü:</strong> 1.2</p>
<p><strong>İletişim e-postası:</strong> <a href="mailto:agtstudyo@gmail.com" style="color:#d4af37">agtstudyo@gmail.com</a></p>
<p><strong>Uygulama web sitesi:</strong> <a href="https://agt-studio.vercel.app/" style="color:#d4af37">https://agt-studio.vercel.app/</a></p>

<h2>1. Bu Politika Hakkında</h2>
<p>Bu politika, AGT Studio'nun AGTStudioCo Pin Publisher uygulaması ve ilgili web hizmetleri kapsamında bilgileri nasıl işlediğini açıklar. Uygulama AGT Studio tarafından işletilir ve yetkilendirilmiş Pinterest hesabındaki içerikleri yönetmek ve yayınlamak için resmi Pinterest API'sini kullanır.</p>

<h2>2. Pinterest API ve OAuth</h2>
<p>Uygulama resmi Pinterest API'sini ve Pinterest OAuth yetkilendirme akışını kullanır. Pinterest hesabının şifresi istenmez veya saklanmaz. Yetkilendirme Pinterest üzerinde gerçekleştirilir ve API erişimi yalnızca hesap sahibinin açık onayından sonra verilir.</p>

<h2>3. İşlenen Bilgiler</h2>
<p>Verilen izinlere bağlı olarak Pinterest hesap kimliği, pano bilgileri, Pin bilgileri ve yetkili API işlemleri için gerekli OAuth erişim bilgileri işlenebilir. Yalnızca yayınlama iş akışı için gerekli izinler talep edilir.</p>

<h2>4. Bilgilerin Kullanımı</h2>
<p>Pinterest API bilgileri yalnızca yetkili hesabın doğrulanması, izin verilen Pin ve pano işlemlerinin yapılması, yayınlama görevlerinin senkronize edilmesi ve AGT Studio Pinterest yayınlama iş akışının çalıştırılması için kullanılır. Pinterest API verileri satılmaz, kiralanmaz veya ilgisiz reklam amaçlarıyla kullanılmaz.</p>

<h2>5. Veri Paylaşımı</h2>
<p>Pinterest API verileri satılmaz, veri brokerlarına verilmez ve ilgisiz üçüncü taraflarla paylaşılmaz. Bilgiler yalnızca hizmeti sağlamak için gerekli olduğu ölçüde AGT Studio web sitesi ve uygulamasını çalıştıran altyapı sağlayıcıları tarafından işlenebilir.</p>

<h2>6. Güvenlik</h2>
<p>OAuth kimlik bilgileri ve erişim belirteçleri gizli uygulama verileri olarak ele alınır ve herkese açık web sitesinde veya tarayıcı arayüzünde bilerek gösterilmez. Uygulama kimlik bilgilerini ve API verilerini yetkisiz erişime karşı korumak için makul teknik önlemler kullanılır.</p>

<h2>7. Veri Saklama ve Erişimin İptali</h2>
<p>API ile ilgili bilgiler yalnızca yetkili iş akışını yürütmek için makul ölçüde gerekli olduğu süre boyunca saklanır. Hesap sahibi Pinterest üzerinden uygulamanın erişimini iptal edebilir. Erişim iptal edildiğinde uygulama bu hesap adına yetkili API istekleri gönderemez.</p>

<h2>8. Veri Silme Talepleri</h2>
<p>Uygulama tarafından tutulan kişisel bilgilerin silinmesini <a href="mailto:agtstudyo@gmail.com" style="color:#d4af37">agtstudyo@gmail.com</a> adresinden AGT Studio'ya talep edebilirsiniz. Geçerli talepler incelenir ve yasal, güvenlik veya operasyonel nedenlerle saklanması gerekmeyen bilgiler silinir.</p>

<h2>9. Üçüncü Taraf Hizmetler</h2>
<p>Pinterest uygulama tarafından kullanılan üçüncü taraf bir platformdur. Pinterest bilgileri kendi şartları ve gizlilik politikası kapsamında bağımsız olarak işler. AGT Studio, Pinterest'in bağımsız veri işleme faaliyetlerini kontrol etmez.</p>

<h2>10. İletişim</h2>
<p><strong>AGT Studio / AGTStudioCo</strong><br>
Web sitesi: <a href="https://agt-studio.vercel.app/" style="color:#d4af37">https://agt-studio.vercel.app/</a><br>
Gizlilik Politikası: <a href="https://agt-studio.vercel.app/privacy" style="color:#d4af37">https://agt-studio.vercel.app/privacy</a><br>
E-posta: <a href="mailto:agtstudyo@gmail.com" style="color:#d4af37">agtstudyo@gmail.com</a></p>

<h2>11. Politika Güncellemeleri</h2>
<p>Uygulama, Pinterest API entegrasyonu veya geçerli gereklilikler değiştiğinde bu Gizlilik Politikası güncellenebilir. Güncel sürüm her zaman bu URL'de yayımlanır.</p>
<p><a href="https://agt-studio.vercel.app/" style="color:#d4af37">AGT Studio ana sayfasına dön</a></p>
</main>
</body>
</html>`;
  }

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(route.title)}</title>`);
  html = setMeta(html, /<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${esc(route.description)}"/>`);
  html = setMeta(html, /<meta name="keywords" content="[^"]*"\s*\/>/, `<meta name="keywords" content="${esc(route.keywords)}"/>`);
  html = setMeta(html, /<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${esc(url)}"/>`);
  html = setMeta(html, /<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${esc(route.title)}"/>`);
  html = setMeta(html, /<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${esc(route.description)}"/>`);
  html = setMeta(html, /<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${esc(url)}"/>`);
  html = setMeta(html, /<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${esc(route.title)}"/>`);
  html = setMeta(html, /<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${esc(route.description)}"/>`);

  const schema = {
    "@context": "https://schema.org",
    "@type": route.type === "Service" ? "Service" : "WebPage",
    name: route.name,
    description: route.description,
    url,
    keywords: route.keywords,
    ...(route.type === "SoftwareApplication"
      ? {
          mainEntity: {
            "@type": "SoftwareApplication",
            name: route.name,
            applicationCategory: "BusinessApplication",
            operatingSystem: route.name.includes("Android") ? "Android" : route.name.includes("Windows") || route.name.includes("Barbershop") ? "Windows" : "Web"
          }
        }
      : {}),
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "AGT Studio", item: "https://agt-studio.vercel.app/" },
        { "@type": "ListItem", position: 2, name: route.name, item: url }
      ]
    }
  };

  html = html.replace("</head>", `<script id="agt-route-schema" type="application/ld+json">${JSON.stringify(schema).replaceAll("</", "<\/")}</script></head>`);

  const outDir = path.join(dist, route.path.replace(/^\//, ""));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");
}

console.log(`Generated ${routes.length} SEO route pages.`);
