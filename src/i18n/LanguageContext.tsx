import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Language = "tr" | "en";

type Dictionary = Record<string, string>;

const translations: Record<Language, Dictionary> = {
  tr: {
    home: "Ana Sayfa", services: "Hizmetler", portfolio: "Portföy", etsy: "Etsy Mağazamız", about: "Hakkımızda", contact: "İletişim",
    discoverServices: "Hizmetlerimizi Keşfet", digitalSolutions: "Dijital Tasarım ve Yapay Zekâ Çözümleri", heroEyebrow: "AGT STUDIO • DİJİTAL ÇÖZÜMLER", heroTitle: "Dijital araçlar ve", heroTitleAccent: "AI çözümleri.", heroDescription: "İşletmeler ve üreticiler için hazır dijital ürünler, yapay zekâ araçları ve modern web tasarımı. İhtiyacınıza uygun çözümü keşfedin.", heroProductsCta: "Dijital Ürünleri Keşfet", heroPointProducts: "Hazır dijital ürünler", heroPointAI: "AI & geliştirici araçları", heroPointWeb: "Web & tasarım hizmetleri", heroVisualLabel: "AGT STUDIO", heroVisualTitle: "Ürün + Hizmet", heroVisualText: "Tek yerde dijital ürünler, araçlar ve yaratıcı çözümler.",
    portfolioTitle: "Portföyümüz", aboutTitle: "Hakkımızda", packages: "Paketlerimiz",
    contactTitle: "İletişim", footerTagline: "Fikirden Markaya", allRights: "Tüm hakları saklıdır.",
    why: "Neden AGT Studio?", offer: "Teklif Al / WhatsApp", quote: "Teklif alınız",
    etsyEyebrow: "AGT STUDIO • ETSY", etsyTitleLead: "Etsy’de", etsyTitleAccent: "en çok ilgi gören", etsyTitleTrail: "araçlar", etsySubtitle: "AGTStudioCo mağazamızdaki dijital ürünleri keşfedin. Bir ürünü seçtiğinizde doğrudan Etsy ilanına geçebilirsiniz.",
    goShop: "🛍️ Mağazaya Git", loadingProducts: "Etsy ürünleri yükleniyor...", productsUnavailable: "Ürünler şu anda yüklenemedi.", openEtsy: "Etsy mağazasını aç →", viewOnEtsy: "🛒 Etsy'de İncele →", allProducts: "Tüm ürünleri Etsy mağazasında gör →",
    start: "Başlangıç Paketi", professional: "Profesyonel Paket", corporate: "Kurumsal Paket", premium: "Premium Paket",
    logoDesign: "Logo tasarımı", businessCard: "Kartvizit tasarımı", socialDesign: "Sosyal medya tasarımı", menuDesign: "Menü tasarımı", basicWeb: "Temel web sitesi", corporateIdentity: "Kurumsal kimlik tasarımı", advancedWeb: "Gelişmiş web sitesi", technicalSupport: "Teknik destek", contentManagement: "İçerik yönetimi", allServices: "Tüm hizmetler", aiSolutions: "Yapay zekâ çözümleri", prioritySupport: "Öncelikli destek", customProject: "Özel proje yönetimi",
    tellProject: "PROJENİZİ ANLATIN", dreamProject: "Hayalinizdeki projeyi birlikte yapalım.", projectIntro: "Ne yaptırmak istediğinizi anlatın. Talebinizi inceleyip size uygun çözüm ve teklif için dönüş yapalım.",
    fullName: "Ad Soyad", company: "İşletme / Firma", phone: "Telefon / WhatsApp", email: "E-posta", need: "İhtiyacınız nedir?", select: "Seçiniz", budget: "Tahmini bütçe", describe: "Projenizi anlatın", describePlaceholder: "Ne yaptırmak istiyorsunuz? İstediğiniz özellikleri mümkün olduğunca anlatın.", sending: "Gönderiliyor...", requestQuote: "Teklif Talep Et", success: "Talebiniz başarıyla alındı. En kısa sürede sizinle iletişime geçeceğiz.", error: "Talep gönderilemedi. Lütfen tekrar deneyin veya WhatsApp üzerinden bize ulaşın.",
    website: "Web sitesi", mobileApp: "Mobil uygulama", pwa: "PWA", ecommerce: "E-ticaret", customSoftware: "Özel yazılım", logoCorporate: "Logo / kurumsal tasarım", other: "Diğer",
    undecided: "Henüz karar vermedim", under5: "5.000 TL altı", five15: "5.000 – 15.000 TL", fifteen30: "15.000 – 30.000 TL", thirty50: "30.000 – 50.000 TL", over50: "50.000 TL+",
    reachWhatsApp: "WhatsApp'tan Ulaşın", instagram: "Instagram", gmail: "Gmail", tiktok: "TikTok", whatsapp: "WhatsApp",
    serviceInspect: "Hizmeti İncele →", noContent: "Bu kategoride henüz içerik bulunmuyor.", backHome: "← AGT Studio Ana Sayfa",
    serviceOffer: "Teklif Al / WhatsApp", keys: "Anahtar hizmetler",
    languageTR: "Türkçe", languageEN: "English", english: "English", turkish: "Türkçe"
  },
  en: {
    home: "Home", services: "Services", portfolio: "Portfolio", etsy: "Our Etsy Store", about: "About Us", contact: "Contact",
    discoverServices: "Explore Our Services", digitalSolutions: "Digital Design & AI Solutions", heroEyebrow: "AGT STUDIO • DIGITAL SOLUTIONS", heroTitle: "Digital tools and", heroTitleAccent: "AI solutions.", heroDescription: "Ready-to-use digital products, AI tools and modern web design for businesses and creators. Explore the solution that fits your needs.", heroProductsCta: "Explore Digital Products", heroPointProducts: "Ready-to-use products", heroPointAI: "AI & developer tools", heroPointWeb: "Web & design services", heroVisualLabel: "AGT STUDIO", heroVisualTitle: "Products + Services", heroVisualText: "Digital products, tools and creative solutions in one place.",
    portfolioTitle: "Our Portfolio", aboutTitle: "About Us", packages: "Our Packages",
    contactTitle: "Contact", footerTagline: "From Idea to Brand", allRights: "All rights reserved.",
    why: "Why AGT Studio?", offer: "Get a Quote / WhatsApp", quote: "Get a quote",
    etsyEyebrow: "AGT STUDIO • ETSY", etsyTitleLead: "Top", etsyTitleAccent: "trending", etsyTitleTrail: "tools on Etsy", etsySubtitle: "Explore the digital products in our AGTStudioCo store. Select a product to go directly to its Etsy listing.",
    goShop: "🛍️ Visit Store", loadingProducts: "Loading Etsy products...", productsUnavailable: "Products could not be loaded right now.", openEtsy: "Open Etsy store →", viewOnEtsy: "🛒 View on Etsy →", allProducts: "View all products on Etsy →",
    start: "Starter Package", professional: "Professional Package", corporate: "Business Package", premium: "Premium Package",
    logoDesign: "Logo design", businessCard: "Business card design", socialDesign: "Social media design", menuDesign: "Menu design", basicWeb: "Basic website", corporateIdentity: "Corporate identity design", advancedWeb: "Advanced website", technicalSupport: "Technical support", contentManagement: "Content management", allServices: "All services", aiSolutions: "AI solutions", prioritySupport: "Priority support", customProject: "Custom project management",
    tellProject: "TELL US ABOUT YOUR PROJECT", dreamProject: "Let's build your dream project together.", projectIntro: "Tell us what you need. We'll review your request and get back to you with a suitable solution and quote.",
    fullName: "Full name", company: "Business / Company", phone: "Phone / WhatsApp", email: "Email", need: "What do you need?", select: "Select", budget: "Estimated budget", describe: "Tell us about your project", describePlaceholder: "What would you like us to build? Describe the features you need in as much detail as possible.", sending: "Sending...", requestQuote: "Request a Quote", success: "Your request has been received. We'll contact you as soon as possible.", error: "Your request could not be sent. Please try again or contact us via WhatsApp.",
    website: "Website", mobileApp: "Mobile app", pwa: "PWA", ecommerce: "E-commerce", customSoftware: "Custom software", logoCorporate: "Logo / corporate design", other: "Other",
    undecided: "I haven't decided yet", under5: "Under 5,000 TL", five15: "5,000 – 15,000 TL", fifteen30: "15,000 – 30,000 TL", thirty50: "30,000 – 50,000 TL", over50: "50,000 TL+",
    reachWhatsApp: "Contact via WhatsApp", instagram: "Instagram", gmail: "Gmail", tiktok: "TikTok", whatsapp: "WhatsApp",
    serviceInspect: "View Service →", noContent: "No content in this category yet.", backHome: "← AGT Studio Home",
    serviceOffer: "Get a Quote / WhatsApp", keys: "Key services",
    languageTR: "Türkçe", languageEN: "English", english: "English", turkish: "Türkçe"
  }
};

type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; t: (key: string) => string };

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "tr";
    return window.localStorage.getItem("agt-language") === "en" ? "en" : "tr";
  });

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem("agt-language", next);
    document.documentElement.lang = next;
  };

  useEffect(() => { document.documentElement.lang = language; }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t: (key: string) => translations[language][key] ?? key }), [language, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
