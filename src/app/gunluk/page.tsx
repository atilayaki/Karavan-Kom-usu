'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './gunluk.module.css';
import { useToast } from '@/components/Toast';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { IconUser, IconMap, IconHeart, IconCamp, IconSOS } from '@/components/Icons';

export default function GunlukPage() {
  const { showToast } = useToast();
  const scrollRef = useScrollReveal();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
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

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        showToast('Başarıyla giriş yapıldı!', "success");
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
        showToast('Kayıt başarılı! Lütfen e-postanızı onaylayın.', "success");
      }
    } catch (error: any) {
      showToast(error.message || 'Bir hata oluştu.', "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showToast("Güvenli çıkış yapıldı.", "info");
  };

  const [profile, setProfile] = useState<any>(null);
  const [bio, setBio] = useState('');
  const [caravanType, setCaravanType] = useState('');
  const [username, setUsername] = useState('');
  
  // Karavan Garaj states
  const [batteryCapacity, setBatteryCapacity] = useState('');
  const [solarPanel, setSolarPanel] = useState('');
  const [waterTank, setWaterTank] = useState('');
  const [heatingSystem, setHeatingSystem] = useState('');

  // Stats
  const [routesCount, setRoutesCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
      fetchStats();
    }
  }, [session]);

  const fetchStats = async () => {
    if (!session?.user?.id) return;
    const uid = session.user.id;
    const [routesRes, friendsRes, postsRes] = await Promise.all([
      supabase.from('routes').select('id', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('friendships').select('id', { count: 'exact', head: true }).or(`user_id.eq.${uid},friend_id.eq.${uid}`),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', uid),
    ]);
    setRoutesCount(routesRes.count || 0);
    setFriendsCount(friendsRes.count || 0);
    setPostsCount(postsRes.count || 0);
  };

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
      setBatteryCapacity(data.battery_capacity || '');
      setSolarPanel(data.solar_panel || '');
      setWaterTank(data.water_tank || '');
      setHeatingSystem(data.heating_system || '');
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
        username,
        battery_capacity: batteryCapacity,
        solar_panel: solarPanel,
        water_tank: waterTank,
        heating_system: heatingSystem
      })
      .eq('id', session.user.id);
      
    if (error) {
      showToast('Profil güncellenemedi: ' + error.message, "error");
    } else {
      showToast('Profil başarıyla güncellendi!', "success");
      fetchProfile();
    }
    setLoading(false);
  };

  if (session) {
    return (
      <div className={styles.container} ref={scrollRef}>
        <div className={styles.profileCard + " glass-card reveal"}>
          <div className={styles.profileHeader}>
            <div className={styles.avatarLarge}>
              {(profile?.full_name || 'K').charAt(0)}
            </div>
            <div className={styles.profileInfo}>
              <h2>{profile?.full_name || 'Komşu'}</h2>
              <p className={styles.emailLabel}>{session.user.email}</p>
              {profile?.is_verified && <span className="badge badge-verified">Onaylı Üye ✓</span>}
            </div>
          </div>
          
          <div className={styles.gamificationSection}>
            <div className={styles.levelInfo}>
              <div className={styles.levelBadge}>
                <span>Seviye</span>
                <strong>{Math.floor((routesCount * 2 + postsCount + friendsCount) / 5) + 1}</strong>
              </div>
              <div className={styles.progressContainer}>
                <div className={styles.progressHeader}>
                  <span>Karavancı Tecrübesi</span>
                  <span>%{((routesCount * 2 + postsCount + friendsCount) % 5) * 20}</span>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${((routesCount * 2 + postsCount + friendsCount) % 5) * 20}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className={styles.badgesGrid}>
              <div className={`${styles.badgeItem} ${routesCount > 0 ? styles.earned : ''}`}>
                <div className={styles.badgeIcon}>📍</div>
                <span>İlk Rota</span>
              </div>
              <div className={`${styles.badgeItem} ${friendsCount >= 5 ? styles.earned : ''}`}>
                <div className={styles.badgeIcon}>🤝</div>
                <span>Sosyal</span>
              </div>
              <div className={`${styles.badgeItem} ${postsCount >= 10 ? styles.earned : ''}`}>
                <div className={styles.badgeIcon}>📸</div>
                <span>Fenomen</span>
              </div>
              <div className={`${styles.badgeItem} ${profile?.is_verified ? styles.earned : ''}`}>
                <div className={styles.badgeIcon}>🛡️</div>
                <span>Güvenilir</span>
              </div>
            </div>
          </div>

          <div className={styles.profileStats}>
            <div className={styles.statBox}>
              <IconMap size={24} color="var(--sunset-orange)" />
              <strong>{routesCount}</strong>
              <span>Rota</span>
            </div>
            <div className={styles.statBox}>
              <IconUser size={24} color="var(--forest-green)" />
              <strong>{friendsCount}</strong>
              <span>Arkadaş</span>
            </div>
            <div className={styles.statBox}>
              <IconCamp size={24} color="var(--forest-green)" />
              <strong>{postsCount}</strong>
              <span>Manzara</span>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className={styles.form}>
            <div className={styles.sectionTitle}>
              <IconUser size={18} />
              <h3>Kişisel Bilgiler</h3>
            </div>
            
            <div className={styles.inputGrid}>
              <div className={styles.inputGroup}>
                <label>Kullanıcı Adı</label>
                <input 
                  type="text" 
                  placeholder="@gezginkomsu" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Karavan Tipi</label>
                <select value={caravanType} onChange={(e) => setCaravanType(e.target.value)}>
                  <option value="">Seçiniz...</option>
                  <option value="Motokaravan">Motokaravan</option>
                  <option value="Çekme Karavan">Çekme Karavan</option>
                  <option value="Campervan">Campervan</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
            </div>

            <div className={styles.sectionTitle} style={{marginTop: '20px'}}>
              <IconCamp size={18} />
              <h3>Karavan Garajı</h3>
            </div>
            
            <div className={styles.garageGrid}>
              <div className={styles.inputGroup}>
                <label>🔋 Akü</label>
                <input type="text" placeholder="200Ah Lityum" value={batteryCapacity} onChange={(e) => setBatteryCapacity(e.target.value)} />
              </div>
              <div className={styles.inputGroup}>
                <label>☀️ Güneş</label>
                <input type="text" placeholder="400W Monokristal" value={solarPanel} onChange={(e) => setSolarPanel(e.target.value)} />
              </div>
              <div className={styles.inputGroup}>
                <label>💧 Su</label>
                <input type="text" placeholder="150L Temiz" value={waterTank} onChange={(e) => setWaterTank(e.target.value)} />
              </div>
              <div className={styles.inputGroup}>
                <label>🔥 Isıtma</label>
                <input type="text" placeholder="Dizel Isıtıcı" value={heatingSystem} onChange={(e) => setHeatingSystem(e.target.value)} />
              </div>
            </div>

            <div className={styles.inputGroup} style={{marginTop: '15px'}}>
              <label>Hakkımda</label>
              <textarea 
                placeholder="Yolculuk hikayeni paylaş..." 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className={styles.profileActions}>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Güncelleniyor...' : 'Profili Kaydet'}
              </button>
              <button type="button" onClick={handleLogout} className="btn-ghost">
                Oturumu Kapat
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} ref={scrollRef}>
      <div className={styles.authCard + " glass-card reveal-scale visible"}>
        <div className={styles.tabs}>
          <button className={isLogin ? styles.activeTab : ''} onClick={() => setIsLogin(true)}>Giriş Yap</button>
          <button className={!isLogin ? styles.activeTab : ''} onClick={() => setIsLogin(false)}>Kayıt Ol</button>
        </div>

        <div className={styles.authHeader}>
          <h2>{isLogin ? 'Hoş Geldin Komşu!' : 'Aramıza Katıl'}</h2>
          <p>{isLogin ? 'Yol arkadaşların seni bekliyor.' : 'Karavan günlüğünü tutmaya başlamak için hesap oluştur.'}</p>
        </div>

        <form className={styles.form} onSubmit={handleAuth}>
          {!isLogin && (
            <div className={styles.inputGroup}>
              <label>Ad Soyad</label>
              <input type="text" placeholder="Örn: Ahmet Yılmaz" value={fullName} onChange={(e) => setFullName(e.target.value)} required={!isLogin} />
            </div>
          )}
          <div className={styles.inputGroup}>
            <label>E-posta</label>
            <input type="email" placeholder="komsu@karavan.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className={styles.inputGroup}>
            <label>Şifre</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          
          <button type="submit" className="btn-primary" style={{marginTop: '10px'}} disabled={loading}>
            {loading ? 'Bekleniyor...' : (isLogin ? 'Yola Çık' : 'Hesabı Oluştur')}
          </button>
        </form>
      </div>
    </div>
  );
}
