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
    title: "Privacy Policy | AGT Studio",
    description: "AGT Studio privacy policy and information about how website and service-related data is handled.",
    keywords: "AGT Studio privacy policy, privacy",
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

  html = html.replace(/<title>[\\s\\S]*?<\\/title>/, `<title>${esc(route.title)}</title>`);
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

  html = html.replace("</head>", `<script id="agt-route-schema" type="application/ld+json">${JSON.stringify(schema).replaceAll("</", "<\\/")}</script></head>`);

  const outDir = path.join(dist, route.path.replace(/^\\//, ""));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");
}

console.log(`Generated ${routes.length} SEO route pages.`);
