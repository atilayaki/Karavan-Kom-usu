'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './gunluk.module.css';

export default function GunlukPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMessage({ text: 'Başarıyla giriş yapıldı!', type: 'success' });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });
        if (error) throw error;
        setMessage({ text: 'Kayıt başarılı! Lütfen e-postanızı kontrol edin.', type: 'success' });
      }
    } catch (error: any) {
      setMessage({ text: error.message || 'Bir hata oluştu.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const [profile, setProfile] = useState<any>(null);
  const [bio, setBio] = useState('');
  const [caravanType, setCaravanType] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (data) {
      setProfile(data);
      setBio(data.bio || '');
      setCaravanType(data.caravan_type || '');
      setUsername(data.username || '');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        bio,
        caravan_type: caravanType,
        username
      })
      .eq('id', session.user.id);
      
    if (error) {
      alert('Profil güncellenemedi: ' + error.message);
    } else {
      alert('Profil güncellendi!');
      fetchProfile();
    }
    setLoading(false);
  };

  if (session) {
    return (
      <div className={styles.container}>
        <div className={styles.authCard + " glass-card"} style={{ maxWidth: '600px' }}>
          <h2>Hoş Geldin, {profile?.full_name || 'Komşu'}!</h2>
          <p className={styles.subtitle}>E-posta: {session.user.email}</p>
          
          <div className={styles.profileStats}>
            <div>
              <strong>0</strong>
              <span>İz Bırak</span>
            </div>
            <div>
              <strong>0</strong>
              <span>Yol Arkadaşı</span>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className={styles.form} style={{ marginTop: '30px' }}>
            <div className={styles.inputGroup}>
              <label>Kullanıcı Adı</label>
              <input 
                type="text" 
                placeholder="Örn: gezginkaravan" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Karavan Tipi</label>
              <select 
                value={caravanType}
                onChange={(e) => setCaravanType(e.target.value)}
              >
                <option value="">Seçiniz...</option>
                <option value="Motokaravan">Motokaravan</option>
                <option value="Çekme Karavan">Çekme Karavan</option>
                <option value="Campervan">Campervan (Panelvan)</option>
                <option value="Çadır/Diğer">Çadır / Diğer</option>
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label>Hakkımda (Bio)</label>
              <textarea 
                placeholder="Kendinden ve rotalarından bahset..." 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </div>
            
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Profili Güncelle'}
            </button>
          </form>

          <button onClick={handleLogout} className="btn-secondary" style={{ marginTop: '20px', width: '100%' }}>
            Çıkış Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.authCard + " glass-card"}>
        <div className={styles.tabs}>
          <button 
            className={isLogin ? styles.activeTab : ''} 
            onClick={() => setIsLogin(true)}
          >
            Giriş Yap
          </button>
          <button 
            className={!isLogin ? styles.activeTab : ''} 
            onClick={() => setIsLogin(false)}
          >
            Kayıt Ol
          </button>
        </div>

        <h2 className={styles.title}>
          {isLogin ? 'Hoş Geldin Komşu!' : 'Aramıza Katıl'}
        </h2>
        <p className={styles.subtitle}>
          {isLogin 
            ? 'Yol arkadaşların seni bekliyor.' 
            : 'Karavan günlüğünü tutmaya başlamak için hesap oluştur.'}
        </p>

        {message.text && (
          <div className={styles.messageBox} style={{ color: message.type === 'error' ? '#F44336' : '#4CAF50', marginBottom: '15px', fontSize: '0.9rem', fontWeight: 'bold' }}>
            {message.text}
          </div>
        )}

        <form className={styles.form} onSubmit={handleAuth}>
          {!isLogin && (
            <div className={styles.inputGroup}>
              <label>Adın Soyadın</label>
              <input 
                type="text" 
                placeholder="Örn: Ahmet Yılmaz" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}
          <div className={styles.inputGroup}>
            <label>E-posta Adresin</label>
            <input 
              type="email" 
              placeholder="komsu@karavan.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Şifren</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Bekleniyor...' : (isLogin ? 'Yola Çık' : 'Hesabı Oluştur')}
          </button>
        </form>
      </div>
    </div>
  );
}
