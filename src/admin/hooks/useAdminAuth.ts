import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export function useAdminAuth() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Mevcut session'ı kontrol et
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!currentSession) {
          // Oturum yok → login'e yönlendir
          setSession(null);
          setIsAdmin(false);
          setLoading(false);
          navigate('/admin/login', { replace: true });
          return;
        }

        setSession(currentSession);

        // Admin kontrolü: public.is_admin() fonksiyonunu çağır
        const { data: adminCheckResult, error: adminError } = await supabase.rpc(
          'is_admin'
        );

        if (adminError) {
          // RPC hatası varsa admin değil
          console.error('Admin kontrolü hatası:', adminError);
          setIsAdmin(false);
          setError('Yetkiniz kontrol edilemedi. Lütfen giriş yapın.');
          setLoading(false);
          navigate('/admin/login', { replace: true });
          return;
        }

        if (!adminCheckResult) {
          // Kullanıcı admin değil
          setIsAdmin(false);
          setError('Bu alanı ziyaret etme izniniz yok.');
          setLoading(false);
          navigate('/admin/login', { replace: true });
          return;
        }

        setIsAdmin(true);
        setError('');
        setLoading(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Auth hatası';
        setError(message);
        setLoading(false);
        navigate('/admin/login', { replace: true });
      }
    };

    checkAuth();

    // Session değişikliklerini dinle
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setIsAdmin(false);
        navigate('/admin/login', { replace: true });
      } else if (newSession) {
        setSession(newSession);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
    navigate('/admin/login', { replace: true });
  };

  return { session, isAdmin, loading, error, logout };
}
