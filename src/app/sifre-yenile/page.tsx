'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export default function SifreYenilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

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

  if (!ready) {
    return (
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px'}}>
        <div className="pulse-dot"></div>
        <p style={{opacity: 0.6, fontSize: '0.9rem'}}>Güvenlik bağlantısı doğrulanıyor...</p>
      </div>
    );
  }

  return (
    <div style={{display: 'flex', justifyContent: 'center', padding: '40px 16px'}}>
      <div className="glass-card" style={{width: '100%', maxWidth: '400px', padding: '32px 24px'}}>
        <h2 style={{marginBottom: '8px'}}>Yeni Şifre Belirle</h2>
        <p style={{opacity: 0.6, fontSize: '0.9rem', marginBottom: '24px'}}>Hesabın için yeni bir şifre oluştur.</p>

        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
            <label style={{fontSize: '0.85rem', opacity: 0.8}}>Yeni Şifre</label>
            <input
              type="password"
              placeholder="En az 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '1rem'}}
            />
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
            <label style={{fontSize: '0.85rem', opacity: 0.8}}>Yeni Şifre (Tekrar)</label>
            <input
              type="password"
              placeholder="••••••••"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              minLength={6}
              style={{padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '1rem'}}
            />
          </div>
          <button type="submit" className="btn-primary" style={{marginTop: '8px'}} disabled={loading}>
            {loading ? 'Güncelleniyor...' : 'Şifreyi Kaydet'}
          </button>
        </form>
      </div>
    </div>
  );
}
