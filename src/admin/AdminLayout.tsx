import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import { useAdminAuth } from './hooks/useAdminAuth';

const PAGE_TITLES: Record<string, string> = {
  '/admin':           'Dashboard',
  '/admin/sections':  'Bölüm Yönetimi',
  '/admin/services':  'Hizmet Yönetimi',
  '/admin/jobs':      'İş Listesi',
  '/admin/packages':  'Paket Yönetimi',
  '/admin/portfolio': 'Portföy Yönetimi',
  '/admin/settings':  'Site Ayarları',
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Admin Panel';
  const { logout, session } = useAdminAuth();

  return (
    <div className="admin-root">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="admin-menu-toggle"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label="Menüyü aç/kapat"
            >
              ☰
            </button>
            <span className="admin-topbar-title">{pageTitle}</span>
          </div>

          <div className="admin-topbar-right">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-topbar-site-link"
            >
              ↗ Siteyi Görüntüle
            </a>
            <button
              onClick={logout}
              style={{
                background: 'transparent',
                border: '1px solid rgba(248,81,73,0.25)',
                color: '#f85149',
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = 'rgba(248,81,73,0.12)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = 'transparent';
              }}
              title={session?.user?.email}
            >
              Çıkış Yap
            </button>
          </div>
        </header>

        <main className="admin-page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
