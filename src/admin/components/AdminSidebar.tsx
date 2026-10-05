import { NavLink, Link } from 'react-router-dom';

interface Props { open: boolean; onClose: () => void; }

const NAV_GROUPS = [
  { label: 'Genel', items: [
    { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
    { to: '/admin/requests', label: 'Proje Talepleri', icon: '📩' },
  ]},
  { label: 'İçerik', items: [
    { to: '/admin/sections', label: 'Bölümler', icon: '📋' },
    { to: '/admin/services', label: 'Hizmetler', icon: '🎨' },
    { to: '/admin/jobs', label: 'İş Listesi', icon: '💼' },
    { to: '/admin/packages', label: 'Paketler', icon: '📦' },
    { to: '/admin/portfolio', label: 'Portföy', icon: '🖼️' },
  ]},
  { label: 'Büyüme', items: [
    { to: '/admin/etsy-intelligence', label: 'Etsy Intelligence', icon: '🧠' },
    { to: '/admin/etsy', label: 'Etsy Yönetimi', icon: '🛍️' },
    { to: '/admin/pinterest', label: 'Pinterest Yönetimi', icon: '📌' },
  ]},
  { label: 'Sistem', items: [
    { to: '/admin/settings', label: 'Site Ayarları', icon: '⚙️' },
  ]},
];

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/requests', label: 'Proje Talepleri', icon: '📩' },
  { to: '/admin/sections', label: 'Bölüm Yönetimi', icon: '📋' },
  { to: '/admin/services', label: 'Hizmet Yönetimi', icon: '🎨' },
  { to: '/admin/jobs', label: 'İş Listesi', icon: '💼' },
  { to: '/admin/packages', label: 'Paket Yönetimi', icon: '📦' },
  { to: '/admin/portfolio', label: 'Portföy', icon: '🖼️' },
  { to: '/admin/etsy', label: 'Etsy Yönetimi', icon: '🛍️' },
  { to: '/admin/etsy-intelligence', label: 'Etsy Intelligence', icon: '🧠' },
  { to: '/admin/pinterest', label: 'Pinterest Yönetimi', icon: '📌' },
  { to: '/admin/settings', label: 'Site Ayarları', icon: '⚙️' },
];

export default function AdminSidebar({ open, onClose }: Props) {
  return (
    <>
      <div className={`admin-sidebar-overlay ${open ? 'visible' : ''}`} onClick={onClose} />
      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-brand-text"><span>AGT Studio</span><small>Yönetim Paneli</small></div>
        </div>
        <nav className="admin-nav">
          <div className="admin-nav-section-label">Menü</div>
          {NAV_GROUPS.map((group) => (<div key={group.label} className="admin-nav-group"><div className="admin-nav-section-label">{group.label}</div>{group.items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`} onClick={onClose}>
              <span className="admin-nav-icon">{item.icon}</span>{item.label}
            </NavLink>
          ))}</div>}
        </nav>
        <div className="admin-sidebar-footer"><Link to="/" target="_blank" rel="noopener noreferrer">↗ Siteyi Görüntüle</Link></div>
      </aside>
    </>
  );
}
