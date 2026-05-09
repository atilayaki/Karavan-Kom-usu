'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { Suspense } from 'react';

function SifreYenileInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // PKCE flow: URL contains ?code=XXXXX
    const code = searchParams.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setError('Bağlantı geçersiz veya süresi dolmuş. Lütfen tekrar şifre sıfırlama isteği gönderin.');
        } else {
          setReady(true);
        }
      });
      return;
    }

    // Legacy implicit flow: tokens in URL hash handled by onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    // If no code and no recovery event after 5s, show error
    const timeout = setTimeout(() => {
      setError('Geçerli bir sıfırlama bağlantısı bulunamadı. Lütfen tekrar deneyin.');
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      showToast('Şifreler eşleşmiyor.', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Şifre en az 6 karakter olmalıdır.', 'error');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      showToast('Şifreniz başarıyla güncellendi! Giriş yapabilirsiniz.', 'success');
      router.push('/gunluk');
    } catch (error: any) {
      showToast(error.message || 'Bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 16px' }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '3rem' }}>⚠️</span>
          <h2 style={{ margin: 0 }}>Bağlantı Geçersiz</h2>
          <p style={{ opacity: 0.7, lineHeight: 1.6 }}>{error}</p>
          <button className="btn-primary" onClick={() => router.push('/gunluk')}>
            Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div className="pulse-dot"></div>
        <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Güvenlik bağlantısı doğrulanıyor...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 16px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '32px 24px' }}>
        <h2 style={{ marginBottom: '8px' }}>Yeni Şifre Belirle</h2>
        <p style={{ opacity: 0.6, fontSize: '0.9rem', marginBottom: '24px' }}>Hesabın için yeni bir şifre oluştur.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', opacity: 0.8 }}>Yeni Şifre</label>
            <input
              type="password"
              placeholder="En az 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--foreground)', fontSize: '1rem', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', opacity: 0.8 }}>Yeni Şifre (Tekrar)</label>
            <input
              type="password"
              placeholder="••••••••"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              minLength={6}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--foreground)', fontSize: '1rem', outline: 'none' }}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '8px' }} disabled={loading}>
            {loading ? 'Güncelleniyor...' : 'Şifreyi Kaydet'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SifreYenilePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="pulse-dot"></div>
      </div>
    }>
      <SifreYenileInner />
    </Suspense>
  );
}
