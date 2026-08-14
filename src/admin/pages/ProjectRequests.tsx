import { useMemo, useState } from 'react';
import { useProjectRequests, type ProjectRequest } from '../hooks/useProjectRequests';
import './ProjectRequests.css';

const STATUS_LABELS: Record<ProjectRequest['status'], string> = { new: 'Yeni', contacted: 'İletişime geçildi', quoted: 'Teklif verildi', won: 'Kazanıldı', lost: 'Kaybedildi' };

export default function ProjectRequests() {
  const { data, loading, error, fetchData, updateStatus } = useProjectRequests();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | ProjectRequest['status']>('all');
  const selected = data.find((item) => item.id === selectedId) ?? null;
  const filtered = useMemo(() => filter === 'all' ? data : data.filter((item) => item.status === filter), [data, filter]);
  const newCount = data.filter((item) => item.status === 'new').length;
  const handleStatus = async (id: string, status: ProjectRequest['status']) => { try { await updateStatus(id, status); } catch (e) { alert(e instanceof Error ? e.message : 'Durum güncellenemedi'); } };

  return <div>
    <div className="admin-page-header admin-page-header-row"><div><h1>Proje Talepleri</h1><p>Müşterilerden gelen proje ve teklif taleplerini buradan takip et.</p></div><button className="admin-btn admin-btn-secondary" onClick={() => void fetchData()}>↻ Yenile</button></div>
    <div className="admin-stats-row">
      <div className="admin-stat-card"><span>Toplam Talep</span><strong>{data.length}</strong></div><div className="admin-stat-card"><span>Yeni</span><strong>{newCount}</strong></div><div className="admin-stat-card"><span>Teklif Verildi</span><strong>{data.filter((item) => item.status === 'quoted').length}</strong></div><div className="admin-stat-card"><span>Kazanıldı</span><strong>{data.filter((item) => item.status === 'won').length}</strong></div>
    </div>
    <div className="admin-toolbar"><select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}><option value="all">Tüm talepler</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    {loading && <div className="admin-empty-state">Talepler yükleniyor...</div>}
    {error && <div className="admin-error">{error}<br /><small>Supabase'te admin kullanıcısının SELECT/UPDATE yetkilerini kontrol et.</small></div>}
    {!loading && !error && filtered.length === 0 && <div className="admin-empty-state">Henüz bu filtreye uygun proje talebi yok.</div>}
    <div className="project-request-admin-list">{filtered.map((item) => <article className={`project-request-admin-card ${item.status === 'new' ? 'is-new' : ''}`} key={item.id}>
      <div className="project-request-admin-main"><div className="project-request-admin-title-row"><h3>{item.name}</h3><span className={`project-request-status status-${item.status}`}>{STATUS_LABELS[item.status]}</span></div><p className="project-request-admin-meta">{item.company || 'Firma belirtilmemiş'} · {item.service} · {item.budget || 'Bütçe belirtilmemiş'}</p><p className="project-request-admin-message">{item.message}</p><small>{new Date(item.created_at).toLocaleString('tr-TR')}</small></div>
      <div className="project-request-admin-actions"><button className="admin-btn admin-btn-primary" onClick={() => setSelectedId(item.id)}>Detay</button><a className="admin-btn admin-btn-secondary" href={`https://wa.me/${item.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">WhatsApp</a><select value={item.status} onChange={(e) => void handleStatus(item.id, e.target.value as ProjectRequest['status'])} aria-label="Talep durumu">{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    </article>)}</div>
    {selected && <div className="admin-modal-backdrop" onClick={() => setSelectedId(null)}><div className="admin-modal" onClick={(e) => e.stopPropagation()}><div className="admin-modal-header"><h2>Proje Talebi</h2><button onClick={() => setSelectedId(null)}>✕</button></div><div className="admin-detail-grid"><div><span>Ad Soyad</span><strong>{selected.name}</strong></div><div><span>Firma</span><strong>{selected.company || '-'}</strong></div><div><span>Telefon</span><strong>{selected.phone}</strong></div><div><span>E-posta</span><strong>{selected.email || '-'}</strong></div><div><span>Hizmet</span><strong>{selected.service}</strong></div><div><span>Bütçe</span><strong>{selected.budget || '-'}</strong></div></div><div className="admin-detail-message"><span>Proje açıklaması</span><p>{selected.message}</p></div><div className="admin-modal-actions"><a className="admin-btn admin-btn-primary" href={`tel:${selected.phone}`}>📞 Ara</a><a className="admin-btn admin-btn-secondary" href={selected.email ? `mailto:${selected.email}` : '#'}>✉ E-posta</a><a className="admin-btn admin-btn-secondary" href={`https://wa.me/${selected.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">💬 WhatsApp</a></div></div></div>}
  </div>;
}
