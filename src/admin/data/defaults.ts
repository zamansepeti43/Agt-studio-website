import type { Job, Package, Section, PortfolioItem, Service, SiteSettings } from '../types/admin';

export const DEFAULT_SECTIONS: Section[] = [
  { key: 'hero',      label: 'Ana Sayfa',    visible: true, order: 0 },
  { key: 'services',  label: 'Hizmetler',    visible: true, order: 1 },
  { key: 'portfolio', label: 'Portföy',      visible: true, order: 2 },
  { key: 'about',     label: 'Hakkımızda',   visible: true, order: 3 },
  { key: 'pricing',   label: 'Paketler',     visible: true, order: 4 },
  { key: 'contact',   label: 'İletişim',     visible: true, order: 5 },
];

export const DEFAULT_JOBS: Job[] = [
  { id: '1', title: 'Logo Tasarımı',          category: 'Tasarım', description: 'Kurumsal logo tasarımı',                      price: null, price_type: 'quote', active: true, order: 0 },
  { id: '2', title: 'Sosyal Medya Tasarımı',  category: 'Tasarım', description: 'Instagram ve TikTok içerik tasarımı',         price: null, price_type: 'quote', active: true, order: 1 },
  { id: '3', title: 'Web Tasarımı',           category: 'Web',     description: 'Modern ve responsive web sitesi geliştirme',  price: null, price_type: 'quote', active: true, order: 2 },
  { id: '4', title: 'Yapay Zekâ Çözümleri',  category: 'AI',      description: 'Otomasyon ve yapay zekâ entegrasyonu',        price: null, price_type: 'quote', active: true, order: 3 },
];

export const DEFAULT_PACKAGES: Package[] = [
  { id: '1', title: 'Başlangıç Paketi',  description: 'Küçük işletmeler için temel paket',         package_items: [], price: null, price_text: 'Teklif alınız', featured: false, active: true, order: 0 },
  { id: '2', title: 'Profesyonel Paket', description: 'Büyüyen işletmeler için kapsamlı paket',    package_items: [], price: null, price_text: 'Teklif alınız', featured: false, active: true, order: 1 },
  { id: '3', title: 'Kurumsal Paket',    description: 'Kurumsal kimlik için eksiksiz çözüm',       package_items: [], price: null, price_text: 'Teklif alınız', featured: false, active: true, order: 2 },
  { id: '4', title: 'Premium Paket',     description: 'Tüm hizmetlerin dahil olduğu üst paket',   package_items: [], price: null, price_text: 'Teklif alınız', featured: true, active: true, order: 3 },
];

export const DEFAULT_SERVICES: Service[] = [
  { id: '1', title: 'Logo Tasarımı',         description: 'Markanız için özgün ve profesyonel logolar hazırlıyoruz.',                        category: 'Tasarım', icon: '🎨', price: null, price_type: 'fixed', active: true, order: 0 },
  { id: '2', title: 'Sosyal Medya Tasarımı', description: 'Instagram, TikTok ve diğer platformlar için içerikler üretiyoruz.',              category: 'Tasarım', icon: '📱', price: null, price_type: 'fixed', active: true, order: 1 },
  { id: '3', title: 'Web Tasarımı',          description: 'Modern, hızlı ve mobil uyumlu internet siteleri oluşturuyoruz.',                 category: 'Web',    icon: '🌐', price: null, price_type: 'fixed', active: true, order: 2 },
  { id: '4', title: 'Yapay Zekâ Çözümleri', description: 'İşlerinizi hızlandıracak yapay zekâ çözümleri sunuyoruz.',                       category: 'AI',     icon: '🤖', price: null, price_type: 'fixed', active: true, order: 3 },
];

export const DEFAULT_PORTFOLIO: PortfolioItem[] = [
  { id: '1', title: 'Logo Tasarımı',         category: 'Tasarım', description: 'İşletmenizi öne çıkaracak modern ve özgün logo tasarımları.',         image_url: '', active: true, order: 0 },
  { id: '2', title: 'Kartvizit Tasarımı',    category: 'Tasarım', description: 'Markanıza özel, profesyonel ve baskıya hazır kartvizit tasarımları.', image_url: '', active: true, order: 1 },
  { id: '3', title: 'Web Tasarımı',          category: 'Web',     description: 'Mobil uyumlu, hızlı ve modern internet siteleri.',                    image_url: '', active: true, order: 2 },
  { id: '4', title: 'Yapay Zekâ Çözümleri', category: 'AI',      description: 'Yapay zekâ destekli otomasyon ve dijital dönüşüm çözümleri.',         image_url: '', active: true, order: 3 },
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  site_name:  'AGT Studio',
  siteName:   'AGT Studio',
  tagline:    'Dijital Tasarım ve Yapay Zekâ Çözümleri',
  phone:      '0534 376 73 08',
  email:      'agtstudyo@gmail.com',
  instagram:  '@agtstudio.tr',
  tiktok:     '@agtstudio.tr',
  whatsapp:   '905343767308',
};
