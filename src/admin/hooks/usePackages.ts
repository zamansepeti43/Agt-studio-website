import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Package, PackageItem } from '../types/admin';

export function usePackages() {
  const [data, setData] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: packages, error: err } = await supabase
        .from('packages')
        .select(`
          id,
          title,
          description,
          price,
          price_text,
          featured,
          active,
          order,
          created_at,
          updated_at,
          package_items(id, text, order)
        `)
        .order('order', { ascending: true });

      if (err) throw err;

      // Transform package_items array to features string array
      const transformed = (packages || []).map((pkg: any) => ({
        ...pkg,
        package_items: pkg.package_items?.sort((a: PackageItem, b: PackageItem) => a.order - b.order) || [],
      } as Package));

      setData(transformed);
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

  const create = async (pkg: Omit<Package, 'id' | 'created_at' | 'updated_at' | 'package_items'>) => {
    try {
      const { data: newPkg, error: err } = await supabase
        .from('packages')
        .insert([{ ...pkg }])
        .select()
        .single();

      if (err) throw err;

      const newPackage = { ...newPkg, package_items: [] } as Package;
      setData((prev) => [...prev, newPackage]);
      return newPackage;
    } catch (e) {
      throw e instanceof Error ? e : new Error('Paket eklenemedi');
    }
  };

  const update = async (id: string, updates: Partial<Package>) => {
    try {
      // package_items ayrı tabloda — burada exclude et
      const { package_items, ...updateData } = updates;
      
      const { data: updated, error: err } = await supabase
        .from('packages')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (err) throw err;

      const current = data.find((p) => p.id === id);
      const result = {
        ...updated,
        package_items: current?.package_items || [],
      } as Package;

      setData((prev) => prev.map((p) => (p.id === id ? result : p)));
      return result;
    } catch (e) {
      throw e instanceof Error ? e : new Error('Paket güncellenemedi');
    }
  };

  const remove = async (id: string) => {
    try {
      // Cascade silme — package_items otomatik silinecek
      const { error: err } = await supabase.from('packages').delete().eq('id', id);
      if (err) throw err;
      setData((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      throw e instanceof Error ? e : new Error('Paket silinemedi');
    }
  };

  const toggleActive = async (id: string) => {
    const item = data.find((p) => p.id === id);
    if (!item) return;
    return update(id, { active: !item.active });
  };

  // Package items
  const addItem = async (packageId: string, text: string) => {
    try {
      const pkg = data.find((p) => p.id === packageId);
      if (!pkg) throw new Error('Paket bulunamadı');

      const { data: newItem, error: err } = await supabase
        .from('package_items')
        .insert([{ package_id: packageId, text, order: (pkg.package_items?.length || 0) }])
        .select()
        .single();

      if (err) throw err;

      setData((prev) =>
        prev.map((p) =>
          p.id === packageId
            ? { ...p, package_items: [...(p.package_items || []), newItem as PackageItem] }
            : p
        )
      );
      return newItem;
    } catch (e) {
      throw e instanceof Error ? e : new Error('Madde eklenemedi');
    }
  };

  const updateItem = async (itemId: string, text: string) => {
    try {
      const { data: updated, error: err } = await supabase
        .from('package_items')
        .update({ text })
        .eq('id', itemId)
        .select()
        .single();

      if (err) throw err;

      setData((prev) =>
        prev.map((p) => ({
          ...p,
          package_items: p.package_items?.map((item) =>
            item.id === itemId ? (updated as PackageItem) : item
          ),
        }))
      );
      return updated;
    } catch (e) {
      throw e instanceof Error ? e : new Error('Madde güncellenemedi');
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error: err } = await supabase.from('package_items').delete().eq('id', itemId);
      if (err) throw err;

      setData((prev) =>
        prev.map((p) => ({
          ...p,
          package_items: p.package_items?.filter((item) => item.id !== itemId),
        }))
      );
    } catch (e) {
      throw e instanceof Error ? e : new Error('Madde silinemedi');
    }
  };

  return {
    data,
    loading,
    error,
    fetchData,
    create,
    update,
    remove,
    toggleActive,
    addItem,
    updateItem,
    removeItem,
  };
}
