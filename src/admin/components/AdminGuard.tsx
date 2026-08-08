import type { ReactNode } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';

interface Props {
  children: ReactNode;
}

export default function AdminGuard({ children }: Props) {
  const { isAdmin, loading, error } = useAdminAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#0d1117',
          color: '#e1e4e8',
          fontSize: '14px',
        }}
      >
        Yükleniyor...
      </div>
    );
  }

  if (error || !isAdmin) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#0d1117',
          color: '#f85149',
          fontSize: '14px',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <div>
          <p style={{ marginBottom: '10px' }}>❌ {error || 'Yetkisiz erişim'}</p>
          <p style={{ color: '#8b949e', fontSize: '12px' }}>
            Lütfen yönetici hesabınızla giriş yapın.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
