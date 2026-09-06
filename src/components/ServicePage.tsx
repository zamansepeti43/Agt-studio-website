import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const services = {
  "/logo-tasarimi": {
    title: "Logo Tasarımı",
    description: "Markanızı profesyonel ve akılda kalıcı bir görsel kimlikle buluşturan özgün logo tasarımları.",
    keywords: "logo tasarımı, profesyonel logo, marka logosu, işletme logo tasarımı",
    points: ["Özgün ve markaya özel konsept", "Dijital ve baskı kullanımına uygun dosyalar", "Sosyal medya ve kurumsal kullanım uyumu", "Revizyon süreci ve teslim sonrası destek"],
  },
  "/sosyal-medya-tasarimi": {
    title: "Sosyal Medya Tasarımı",
    description: "Instagram ve diğer sosyal medya kanalları için markanızın kimliğini yansıtan profesyonel görsel içerikler.",
    keywords: "sosyal medya tasarımı, Instagram tasarım, sosyal medya post tasarımı",
    points: ["Post ve story tasarımları", "Kampanya ve duyuru görselleri", "Marka bütünlüğünü koruyan tasarım dili", "Dijital platformlara uygun ölçü ve formatlar"],
  },
  "/web-tasarim": {
    title: "Web Tasarım",
    description: "İşletmenizi profesyonel şekilde temsil eden, mobil uyumlu ve dönüşüm odaklı web siteleri.",
    keywords: "web tasarım, kurumsal web tasarım, mobil uyumlu web sitesi",
    points: ["Mobil ve masaüstü uyumlu arayüz", "Modern ve hızlı kullanıcı deneyimi", "SEO temellerine uygun yapı", "İletişim ve WhatsApp dönüşüm odaklı yapı"],
  },
  "/menu-tasarimi": {
    title: "Menü Tasarımı",
    description: "Restoran, kafe ve işletmeler için okunaklı, şık ve marka kimliğine uygun menü tasarımları.",
    keywords: "menü tasarımı, restoran menü tasarımı, kafe menü tasarımı",
    points: ["Basılı ve dijital menü seçenekleri", "QR menü kullanımına uygun tasarım", "Fiyat ve ürün bilgilerinde güçlü hiyerarşi", "Markanıza özel renk ve tipografi"],
  },
  "/kartvizit-tasarimi": {
    title: "Kartvizit Tasarımı",
    description: "İşletmeniz ve kişisel markanız için profesyonel, sade ve baskıya hazır kartvizit tasarımları.",
    keywords: "kartvizit tasarımı, profesyonel kartvizit, kurumsal kartvizit",
    points: ["Kurumsal kimlikle uyumlu tasarım", "Baskıya hazır dosya teslimi", "Sade veya premium tasarım seçenekleri", "QR kod ve dijital iletişim bilgileri"],
  },
  "/yapay-zeka-cozumleri": {
    title: "Yapay Zekâ Çözümleri",
    description: "İşletmeler için içerik, tasarım ve dijital süreçlerde yapay zekâ destekli pratik çözümler.",
    keywords: "yapay zekâ çözümleri, AI çözümleri, işletmeler için yapay zekâ",
    points: ["İçerik üretim süreçleri", "Yapay zekâ destekli tasarım fikirleri", "Tekrarlayan işlerde otomasyon yaklaşımı", "İşletmeye özel AI kullanım senaryoları"],
  },
} as const;

type ServiceKey = keyof typeof services;

export default function ServicePage() {
  const { pathname } = useLocation();
  const service = services[pathname as ServiceKey] ?? services["/logo-tasarimi"];

  useEffect(() => {
    document.title = `${service.title} | AGT Studio`;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", service.description);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute("href", `https://agt-studio.vercel.app${pathname}`);
  }, [pathname, service]);

  return (
    <main style={{ minHeight: "100vh", background: "#080808", color: "#fff", padding: "100px 24px 60px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <Link to="/" style={{ color: "#d4af37", textDecoration: "none" }}>← AGT Studio Ana Sayfa</Link>
        <section style={{ padding: "70px 0 40px" }}>
          <p style={{ color: "#d4af37", letterSpacing: 2, textTransform: "uppercase" }}>AGT Studio</p>
          <h1 style={{ fontSize: "clamp(38px, 7vw, 72px)", lineHeight: 1.05, margin: "14px 0 22px" }}>{service.title}</h1>
          <p style={{ maxWidth: 760, fontSize: 20, lineHeight: 1.7, color: "#cfcfcf" }}>{service.description}</p>
          <a href="https://wa.me/905343767308" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 28, padding: "14px 24px", borderRadius: 10, background: "#d4af37", color: "#080808", fontWeight: 700, textDecoration: "none" }}>Teklif Al / WhatsApp</a>
        </section>
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 18, marginTop: 30 }}>
          {service.points.map((point) => <article key={point} style={{ border: "1px solid #292929", borderRadius: 14, padding: 24, background: "#111" }}><h2 style={{ fontSize: 18, marginTop: 0 }}>✓ {point}</h2><p style={{ color: "#aaa", lineHeight: 1.6 }}>İhtiyacınıza göre planlanan, markanızın kullanım alanlarına uygun profesyonel tasarım yaklaşımı.</p></article>)}
        </section>
        <section style={{ marginTop: 60, padding: 30, borderRadius: 16, background: "#111", border: "1px solid #292929" }}>
          <h2>Neden AGT Studio?</h2>
          <p style={{ color: "#bbb", lineHeight: 1.8 }}>AGT Studio, tasarımın yalnızca güzel görünmesini değil, işletmenizin dijitalde daha profesyonel görünmesini ve müşteriye güven vermesini hedefler. Projenin ihtiyacına göre sade, modern ve kullanışlı çözümler üretiriz.</p>
          <p style={{ color: "#777", marginBottom: 0 }}>Anahtar hizmetler: {service.keywords}</p>
        </section>
      </div>
    </main>
  );
}
