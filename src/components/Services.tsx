import { Link } from "react-router-dom";

const services = [
  {
    icon: "🎨",
    title: "Logo Tasarımı",
    text: "Markanız için özgün, profesyonel ve akılda kalıcı logo tasarımları.",
    href: "/logo-tasarimi",
  },
  {
    icon: "📱",
    title: "Sosyal Medya Tasarımı",
    text: "Instagram, TikTok ve diğer platformlar için marka odaklı görsel içerikler.",
    href: "/sosyal-medya-tasarimi",
  },
  {
    icon: "🌐",
    title: "Web Tasarımı",
    text: "Modern, hızlı, mobil uyumlu ve işletmenizi profesyonel gösteren web siteleri.",
    href: "/web-tasarim",
  },
  {
    icon: "🍽️",
    title: "Menü Tasarımı",
    text: "Restoran ve kafeler için basılı, dijital ve QR menü tasarımları.",
    href: "/menu-tasarimi",
  },
  {
    icon: "💼",
    title: "Kartvizit Tasarımı",
    text: "Kurumsal kimliğinize uygun, baskıya hazır profesyonel kartvizitler.",
    href: "/kartvizit-tasarimi",
  },
  {
    icon: "🤖",
    title: "Yapay Zekâ Çözümleri",
    text: "İçerik, tasarım ve dijital süreçlerde işletmelere yapay zekâ destekli çözümler.",
    href: "/yapay-zeka-cozumleri",
  },
];

export default function Services() {
  return (
    <section className="section" id="services">
      <h2 className="section-title">Hizmetlerimiz</h2>

      <div className="cards">
        {services.map((service) => (
          <article className="card" key={service.href}>
            <h3>
              {service.icon} {service.title}
            </h3>
            <p>{service.text}</p>
            <Link
              to={service.href}
              style={{
                display: "inline-block",
                marginTop: 12,
                color: "#d4af37",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Hizmeti İncele →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
