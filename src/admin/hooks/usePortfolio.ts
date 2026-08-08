import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { PortfolioItem } from '../types/admin';

export function usePortfolio() {
  const [data, setData] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: portfolio, error: err } = await supabase
        .from('portfolio')
        .select('*')
        .order('order', { ascending: true });

      if (err) throw err;
      setData((portfolio || []) as PortfolioItem[]);
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

  const create = async (item: Omit<PortfolioItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: newItem, error: err } = await supabase
        .from('portfolio')
        .insert([{ ...item }])
        .select()
        .single();

      if (err) throw err;
      setData((prev) => [...prev, newItem as PortfolioItem]);
      return newItem;
    } catch (e) {
      throw e instanceof Error ? e : new Error('Öğe eklenemedi');
    }
  };

  const update = async (id: string, updates: Partial<PortfolioItem>) => {
    try {
      const { data: updated, error: err } = await supabase
        .from('portfolio')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (err) throw err;
      setData((prev) => prev.map((p) => (p.id === id ? (updated as PortfolioItem) : p)));
      return updated;
    } catch (e) {
      throw e instanceof Error ? e : new Error('Öğe güncellenemedi');
    }
  };

  const remove = async (id: string) => {
    try {
      const { error: err } = await supabase.from('portfolio').delete().eq('id', id);
      if (err) throw err;
      setData((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      throw e instanceof Error ? e : new Error('Öğe silinemedi');
    }
  };

  const toggleActive = async (id: string) => {
    const item = data.find((p) => p.id === id);
    if (!item) return;
    return update(id, { active: !item.active });
  };

  return { data, loading, error, fetchData, create, update, remove, toggleActive };
}
