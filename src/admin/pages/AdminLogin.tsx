import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      // Kullanıcı giriş yaptı, is_admin() kontrolü admin panel'de yapılacak
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş sırasında hata oluştu');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#0d1117',
        color: '#e1e4e8',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          background: '#161b22',
          padding: '40px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <h1 style={{ margin: '0 0 30px', fontSize: '24px', color: '#d4af37' }}>
          AGT Studio Admin
        </h1>

        {error && (
          <div
            style={{
              background: 'rgba(248,81,73,0.12)',
              border: '1px solid rgba(248,81,73,0.25)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              color: '#f85149',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '700',
              color: '#8b949e',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            E-posta
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              background: '#0d1117',
              color: '#e1e4e8',
              fontSize: '14px',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '700',
              color: '#8b949e',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Şifre
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              background: '#0d1117',
              color: '#e1e4e8',
              fontSize: '14px',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '8px',
            border: 'none',
            background: '#d4af37',
            color: '#000',
            font: '700 14px inherit',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.18s',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              (e.target as HTMLButtonElement).style.background = '#e2c04a';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              (e.target as HTMLButtonElement).style.background = '#d4af37';
            }
          }}
        >
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>
    </div>
  );
}
