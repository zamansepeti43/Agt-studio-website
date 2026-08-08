import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  category: string;
}

const CATEGORY_DEFS = [
  { key: 'Logo',         icon: '🎨', title: 'Logo Tasarımı',         description: 'İşletmenizi öne çıkaracak modern, kurumsal ve özgün logo tasarımları hazırlıyoruz.' },
  { key: 'Menü',         icon: '📋', title: 'Menü Tasarımı',          description: 'Restoranlar ve kafeler için özgün, şık menü tasarımları oluşturuyoruz.' },
  { key: 'Kartvizit',    icon: '💼', title: 'Kartvizit Tasarımı',     description: 'Markanıza özel, profesyonel ve baskıya hazır kartvizit tasarımları oluşturuyoruz.' },
  { key: 'Sosyal Medya', icon: '📱', title: 'Sosyal Medya Tasarımı',  description: 'Instagram, TikTok ve diğer platformlar için dikkat çekici içerik tasarımları üretiyoruz.' },
  { key: 'Web',          icon: '🌐', title: 'Web Tasarımı',           description: 'Mobil uyumlu, hızlı ve modern internet siteleri geliştiriyoruz.' },
  { key: 'Diğer',        icon: '🤖', title: 'Diğer Çalışmalar',      description: 'Yapay zekâ destekli otomasyon, içerik üretimi ve dijital dönüşüm çözümleri sunuyoruz.' },
];

const normalize = (cat: string) =>
  CATEGORY_DEFS.some((c) => c.key === cat) ? cat : 'Diğer';

export default function Portfolio() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('portfolio')
      .select('id, title, description, image_url, category')
      .eq('active', true)
      .order('order', { ascending: true })
      .then(({ data }) => {
        if (data) setItems(data as PortfolioItem[]);
      });
  }, []);

  // Show only categories that have items; if DB is empty show all 6 as fallback
  const populatedKeys = new Set(items.map((i) => normalize(i.category)));
  const displayCats = items.length === 0
    ? CATEGORY_DEFS
    : CATEGORY_DEFS.filter((c) => populatedKeys.has(c.key));

  const toggle = (key: string) => setOpenKey((prev) => (prev === key ? null : key));

  return (
    <section id="portfolio" className="portfolio-section">
      <h2>Portföyümüz</h2>

      <div className="cards">
        {displayCats.map((cat) => {
          const catItems = items.filter((i) => normalize(i.category) === cat.key);
          const isOpen = openKey === cat.key;

          return (
            <div
              key={cat.key}
              className={`card portfolio-accordion${isOpen ? ' portfolio-accordion--open' : ''}`}
              onClick={() => toggle(cat.key)}
            >
              {/* Chevron — top-right corner */}
              <span className="portfolio-chevron">{isOpen ? '▲' : '▼'}</span>

              {/* Original card layout preserved when closed */}
              <div className="card-icon">{cat.icon}</div>
              <h3>{cat.title}</h3>
              <p>{cat.description}</p>

              {/* Expanded section — click inside won't toggle card */}
              {isOpen && (
                <div
                  className="portfolio-expand"
                  onClick={(e) => e.stopPropagation()}
                >
                  {catItems.length === 0 ? (
                    <p style={{ color: '#666', fontSize: 13 }}>Bu kategoride henüz içerik bulunmuyor.</p>
                  ) : (
                    <div className="portfolio-expand-grid">
                      {catItems.map((item) => (
                        <div key={item.id} className="portfolio-expand-item">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.title} />
                          ) : (
                            <div className="portfolio-expand-placeholder">{cat.icon}</div>
                          )}
                          <strong>{item.title}</strong>
                          {item.description && <p>{item.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}