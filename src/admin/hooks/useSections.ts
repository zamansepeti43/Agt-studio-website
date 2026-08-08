import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Section } from '../types/admin';

export function useSections() {
  const [data, setData] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: sections, error: err } = await supabase
        .from('sections')
        .select('*')
        .order('order', { ascending: true });

      if (err) throw err;
      setData((sections || []) as Section[]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Veriler yüklenemedi';
      setError(msg);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const update = async (key: string, updates: Partial<Section>) => {
    try {
      const { data: updated, error: err } = await supabase
        .from('sections')
        .update(updates)
        .eq('key', key)
        .select()
        .single();

      if (err) throw err;
      setData((prev) => prev.map((s) => (s.key === key ? (updated as Section) : s)));
      return updated;
    } catch (e) {
      throw e instanceof Error ? e : new Error('Bölüm güncellenemedi');
    }
  };

  const toggleVisible = async (key: string) => {
    const item = data.find((s) => s.key === key);
    if (!item) return;
    return update(key, { visible: !item.visible });
  };

  const move = async (key: string, direction: -1 | 1) => {
    const sorted = [...data].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.key === key);
    const swapIdx = idx + direction;

    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    try {
      // Swap orders
      const a = sorted[idx];
      const b = sorted[swapIdx];

      const tempOrder = a.order;
      a.order = b.order;
      b.order = tempOrder;

      // Update both in Supabase
      const { error: err1 } = await supabase
        .from('sections')
        .update({ order: a.order })
        .eq('key', a.key);

      const { error: err2 } = await supabase
        .from('sections')
        .update({ order: b.order })
        .eq('key', b.key);

      if (err1 || err2) throw err1 || err2;

      setData([...sorted]);
    } catch (e) {
      throw e instanceof Error ? e : new Error('Sıra değiştirilemedi');
    }
  };

  const reset = async () => {
    const defaults: Section[] = [
      { key: 'hero',      label: 'Ana Sayfa',   visible: true, order: 0 },
      { key: 'services',  label: 'Hizmetler',   visible: true, order: 1 },
      { key: 'portfolio', label: 'Portföy',     visible: true, order: 2 },
      { key: 'about',     label: 'Hakkımızda',  visible: true, order: 3 },
      { key: 'pricing',   label: 'Paketler',    visible: true, order: 4 },
      { key: 'contact',   label: 'İletişim',    visible: true, order: 5 },
    ];

    try {
      for (const section of defaults) {
        await supabase
          .from('sections')
          .update(section)
          .eq('key', section.key);
      }
      setData(defaults);
    } catch (e) {
      throw e instanceof Error ? e : new Error('Sıfırlama başarısız');
    }
  };

  return { data, loading, error, fetchData, update, toggleVisible, move, reset };
}
