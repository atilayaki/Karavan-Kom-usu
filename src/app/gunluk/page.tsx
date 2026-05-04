'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import styles from './gunluk.module.css';
import { useToast } from '@/components/Toast';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import Link from 'next/link';
import type { Profile, UserAchievement } from '@/lib/database.types';
import type { Session } from '@supabase/supabase-js';
import { IconUser, IconMap, IconHeart, IconCamp, IconSOS, IconCamera } from '@/components/Icons';
import { uploadImage } from '@/lib/uploadImage';
import KaravanQRCard from '@/components/KaravanQRCard';
import OnboardingModal from '@/components/OnboardingModal';

export default function GunlukPage() {
  const { showToast } = useToast();
  const scrollRef = useScrollReveal();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setAuthChecking(false);
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthChecking(false);
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

  const [profile, setProfile] = useState<Profile | null>(null);
  const [bio, setBio] = useState('');
  const [caravanType, setCaravanType] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [shareLocation, setShareLocation] = useState(false);
  const [showQRCard, setShowQRCard] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Karavan Garaj states
  const [batteryCapacity, setBatteryCapacity] = useState('');
  const [solarPanel, setSolarPanel] = useState('');
  const [waterTank, setWaterTank] = useState('');
  const [heatingSystem, setHeatingSystem] = useState('');

  // Stats
  const [routesCount, setRoutesCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [xp, setXp] = useState(0);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [showFriendsModal, setShowFriendsModal] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
      fetchStats();
      fetchAchievements();
      fetchFriendsList();
      handleCheckIn(session.user.id);
    }
  }, [session]);

  const fetchFriendsList = async () => {
    if (!session?.user?.id) return;
    const uid = session.user.id;
    
    const { data, error } = await supabase
      .from('friendships')
      .select('*, sender:user_id(id, full_name, avatar_url, caravan_type), receiver:friend_id(id, full_name, avatar_url, caravan_type)')
      .eq('status', 'accepted')
      .or(`user_id.eq.${uid},friend_id.eq.${uid}`);

    if (data) {
      const friends = data.map(f => f.user_id === uid ? f.receiver : f.sender);
      setFriendsList(friends);
    }
  };

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
    if (!session?.user?.id) return;
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
      setAvatarUrl(data.avatar_url || '');
      setXp(data.xp || 0);
      setShareLocation(data.share_location || false);
      // Show onboarding for new users (no bio and no caravan_type set)
      if (!data.bio && !data.caravan_type && !localStorage.getItem('onboarding_done')) {
        setShowOnboarding(true);
      }
    }
  };

  const fetchAchievements = async () => {
    if (!session?.user?.id) return;
    const { data, error } = await supabase
      .from('user_achievements')
      .select('achievement_id, earned_at, achievements(*)')
      .eq('user_id', session.user.id);
    
    if (data) {
      setUserAchievements(data);
    }
  };

  const handleCheckIn = async (uid: string) => {
    // Supabase RPC call for check_in_user function
    const { error } = await supabase.rpc('check_in_user', { p_user_id: uid });
    if (!error) {
      // XP updated via trigger, refresh profile
      fetchProfile();
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user?.id) return;

    setIsUploading(true);
    const url = await uploadImage(file);
    if (url) {
      setAvatarUrl(url);
      // Hemen veritabanına da kaydet
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', session.user.id);
      
      if (!error) {
        showToast('Profil fotoğrafı güncellendi!', 'success');
        setProfile((prev: any) => ({ ...prev, avatar_url: url }));
      } else {
        showToast('Hata: ' + error.message, 'error');
      }
    } else {
      showToast('Görsel yüklenemedi.', 'error');
    }
    setIsUploading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    if (!session?.user?.id) return;
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
        heating_system: heatingSystem,
        avatar_url: avatarUrl,
        share_location: shareLocation
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

  if (authChecking) {
    return (
      <div className={styles.container} style={{flexDirection: 'column', gap: '20px'}}>
        <div className="pulse-dot"></div>
        <p style={{opacity: 0.6, fontSize: '0.9rem'}}>Yol durumu kontrol ediliyor...</p>
      </div>
    );
  }

  if (session) {
    return (
      <div className={styles.container} ref={scrollRef} key={session.user.id}>
        {showOnboarding && (
          <OnboardingModal
            userId={session.user.id}
            onDone={() => {
              setShowOnboarding(false);
              localStorage.setItem('onboarding_done', '1');
              fetchProfile();
            }}
          />
        )}
        <div className={styles.profileCard + " glass-card reveal visible"}>
          <div className={styles.profileHeader}>
            <div className={styles.avatarWrapper}>
              <div className={styles.avatarLarge}>
                {avatarUrl ? (
                  <Image fill src={avatarUrl} alt="Profil" style={{ objectFit: 'cover', borderRadius: '50%' }} sizes="100px" />
                ) : (
                  (profile?.full_name || profile?.username || 'K').charAt(0).toUpperCase()
                )}
                <label className={styles.avatarOverlay}>
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden disabled={isUploading} />
                  <IconCamera size={24} color="white" />
                  <span>{isUploading ? '...' : 'Değiştir'}</span>
                </label>
              </div>
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
                <strong>{Math.floor(xp / 100) + 1}</strong>
              </div>
              <div className={styles.progressContainer}>
                <div className={styles.progressHeader}>
                  <span>Karavancı Tecrübesi ({xp} XP)</span>
                  <span>%{xp % 100}</span>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${xp % 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className={styles.badgesGrid}>
              {userAchievements.map((ua: any) => (
                <div key={ua.achievement_id} className={`${styles.badgeItem} ${styles.earned}`}>
                  <div className={styles.badgeIcon}>{ua.achievements?.icon || '🏆'}</div>
                  <span>{ua.achievements?.title}</span>
                </div>
              ))}
              {userAchievements.length === 0 && (
                <p className={styles.noBadgeText}>Henüz bir rozet kazanılmadı. Yola çık ve paylaş!</p>
              )}
            </div>
          </div>

          <div className={styles.profileStats}>
            <div className={styles.statBox}>
              <IconMap size={24} color="var(--sunset-orange)" />
              <strong>{routesCount}</strong>
              <span>Rota</span>
            </div>
            <div className={styles.statBox} onClick={() => setShowFriendsModal(true)} style={{cursor: 'pointer'}}>
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
              <div className={styles.inputGroup}>
                <label>📍 Konum Paylaşımı</label>
                <div className={styles.toggleRow} onClick={() => setShareLocation(!shareLocation)}>
                  <div className={`${styles.toggle} ${shareLocation ? styles.toggleActive : ''}`}></div>
                  <span>{shareLocation ? 'Yakındaki komşular beni görebilir' : 'Konumum gizli'}</span>
                </div>
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
              <button type="button" onClick={() => setShowQRCard(true)} className="btn-secondary">
                🚐 Karavan Kartım
              </button>
              <button type="button" onClick={handleLogout} className="btn-ghost">
                Oturumu Kapat
              </button>
            </div>
          </form>
        </div>

        {showFriendsModal && (
          <div className={styles.modalOverlay} onClick={() => setShowFriendsModal(false)}>
            <div className={styles.friendsModal + " glass-card"} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Kampçı Arkadaşlarım</h3>
                <button onClick={() => setShowFriendsModal(false)}>✕</button>
              </div>
              <div className={styles.modalBody}>
                {friendsList.length === 0 ? (
                  <p className={styles.emptyListText}>Henüz bir arkadaşın yok. Telsizden yeni komşular bulabilirsin! 🚐</p>
                ) : (
                  friendsList.map(friend => (
                    <Link href={`/profil/${friend.id}`} key={friend.id} className={styles.friendRow}>
                      <div className={styles.friendAvatar}>
                        {friend.avatar_url ? (
                          <Image src={friend.avatar_url} fill alt={friend.full_name} style={{objectFit: 'cover', borderRadius: '50%'}} />
                        ) : (
                          friend.full_name?.charAt(0) || 'K'
                        )}
                      </div>
                      <div className={styles.friendInfo}>
                        <span className={styles.friendName}>{friend.full_name}</span>
                        <span className={styles.friendType}>{friend.caravan_type || 'Gezgin'}</span>
                      </div>
                      <div className={styles.viewProfile}>Gör →</div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {showQRCard && profile && session?.user && (
          <KaravanQRCard
            profile={profile}
            userId={session.user.id}
            onClose={() => setShowQRCard(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={styles.container} ref={scrollRef}>
      <div className={styles.authCard + " glass-card reveal-scale visible"}>
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

        <div className={styles.authHeader}>
          <h2>{isLogin ? 'Hoş Geldin Komşu!' : 'Aramıza Katıl'}</h2>
          <p>
            {isLogin 
              ? 'Yol arkadaşların seni bekliyor. Hemen oturum aç.' 
              : 'Karavan günlüğünü tutmaya başlamak için hesap oluştur.'}
          </p>
        </div>

        <form className={styles.form} onSubmit={handleAuth}>
          {!isLogin && (
            <div className={styles.inputGroup}>
              <label>Ad Soyad</label>
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
            <label>E-posta Adresi</label>
            <input 
              type="email" 
              placeholder="komsu@karavan.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Şifre</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          <button type="submit" className="btn-primary" style={{marginTop: '10px', width: '100%'}} disabled={loading}>
            {loading ? 'Bekleniyor...' : (isLogin ? 'Yola Çık' : 'Hesabı Oluştur')}
          </button>
        </form>
      </div>
    </div>
  );
}
