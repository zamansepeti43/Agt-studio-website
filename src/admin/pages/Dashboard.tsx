import { Link } from 'react-router-dom';
import { useServices } from '../hooks/useServices';
import { useJobs } from '../hooks/useJobs';
import { usePackages } from '../hooks/usePackages';
import { usePortfolio } from '../hooks/usePortfolio';
import { useSections } from '../hooks/useSections';

export default function Dashboard() {
  const services = useServices();
  const jobs = useJobs();
  const packages = usePackages();
  const portfolio = usePortfolio();
  const sections = useSections();

  const loading = services.loading || jobs.loading || packages.loading || portfolio.loading || sections.loading;
  const error = services.error || jobs.error || packages.error || portfolio.error || sections.error;

  const stats = [
    { value: jobs.data.filter((j) => j.active).length, label: 'Aktif İş', total: jobs.data.length },
    { value: packages.data.filter((p) => p.active).length, label: 'Aktif Paket', total: packages.data.length },
    { value: services.data.filter((s) => s.active).length, label: 'Aktif Hizmet', total: services.data.length },
    { value: portfolio.data.filter((p) => p.active).length, label: 'Portföy Öğesi', total: portfolio.data.length },
    { value: sections.data.filter((s) => s.visible).length, label: 'Görünür Bölüm', total: sections.data.length },
  ];

  const quickLinks = [
    { to: '/admin/sections', icon: '📋', label: 'Bölüm Yönetimi' },
    { to: '/admin/services', icon: '🎨', label: 'Hizmet Yönetimi' },
    { to: '/admin/jobs', icon: '💼', label: 'İş Listesi' },
    { to: '/admin/packages', icon: '📦', label: 'Paket Yönetimi' },
    { to: '/admin/portfolio', icon: '🖼️', label: 'Portföy' },
    { to: '/admin/settings', icon: '⚙️', label: 'Site Ayarları' },
  ];

  return (
    <>
      <div className="admin-page-header">
        <h1>Dashboard</h1>
        <p>AGT Studio yönetim paneline hoş geldiniz.</p>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(248,81,73,0.12)',
            border: '1px solid rgba(248,81,73,0.25)',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#f85149',
            fontSize: '13px',
            marginBottom: '20px',
          }}
        >
          ⚠️ Veriler yüklenirken hata oluştu: {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#8b949e' }}>
          Veriler yükleniyor...
        </div>
      ) : (
        <>
          <div className="admin-stats">
            {stats.map((s) => (
              <div key={s.label} className="admin-stat-card">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">
                  {s.label}
                  <span style={{ color: '#555', marginLeft: 4 }}>/ {s.total}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <span className="admin-card-title">Hızlı Erişim</span>
            </div>
            <div className="admin-quicklinks">
              {quickLinks.map((l) => (
                <Link key={l.to} to={l.to} className="admin-quicklink">
                  <span className="admin-quicklink-icon">{l.icon}</span>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
