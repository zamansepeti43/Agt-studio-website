import { DEFAULT_SECTIONS } from '../data/defaults';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Section } from '../types/admin';

export default function SectionManager() {
  const [sections, setSections] = useLocalStorage<Section[]>('agt_sections', DEFAULT_SECTIONS);

  const sorted = [...sections].sort((a, b) => a.order - b.order);

  const toggleVisible = (key: string) => {
    setSections((prev) =>
      prev.map((s) => (s.key === key ? { ...s, visible: !s.visible } : s))
    );
  };

  const move = (key: string, dir: -1 | 1) => {
    setSections((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((s) => s.key === key);
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev;

      const updated = sorted.map((s, i) => {
        if (i === idx)     return { ...s, order: sorted[swapIdx].order };
        if (i === swapIdx) return { ...s, order: sorted[idx].order };
        return s;
      });
      return updated;
    });
  };

  const reset = () => setSections(DEFAULT_SECTIONS);

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-row">
          <div>
            <h1>Bölüm Yönetimi</h1>
            <p>Sitedeki bölümleri göster/gizle ve sırasını değiştir.</p>
          </div>
          <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={reset}>
            Varsayılana Sıfırla
          </button>
        </div>
      </div>

      <div className="admin-card">
        {sorted.map((section, idx) => (
          <div key={section.key} className="admin-section-row">
            <div className="admin-section-order-btns">
              <button
                className="admin-order-btn"
                onClick={() => move(section.key, -1)}
                disabled={idx === 0}
                title="Yukarı taşı"
              >
                ▲
              </button>
              <button
                className="admin-order-btn"
                onClick={() => move(section.key, 1)}
                disabled={idx === sorted.length - 1}
                title="Aşağı taşı"
              >
                ▼
              </button>
            </div>

            <span
              style={{ color: '#555', fontSize: 12, minWidth: 20, textAlign: 'center' }}
            >
              {idx + 1}
            </span>

            <span className="admin-section-label">{section.label}</span>

            <span
              className={`admin-badge ${section.visible ? 'admin-badge-active' : 'admin-badge-inactive'}`}
            >
              {section.visible ? 'Görünür' : 'Gizli'}
            </span>

            <label className="admin-toggle" title="Göster/Gizle">
              <input
                type="checkbox"
                checked={section.visible}
                onChange={() => toggleVisible(section.key)}
              />
              <span className="admin-toggle-slider" />
            </label>
          </div>
        ))}
      </div>

      <p style={{ color: '#555', fontSize: 12 }}>
        * Bölüm sırası ve görünürlük değişiklikleri localStorage'a kaydedilir.
        Gerçek site entegrasyonu ileride eklenecektir.
      </p>
    </>
  );
}
