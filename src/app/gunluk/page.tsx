'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import styles from './gunluk.module.css';
import { useToast } from '@/components/Toast';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import Link from 'next/link';
import type { Profile, UserAchievement } from '@/lib/database.types';
import type { Session } from '@supabase/supabase-js';
import { IconUser, IconMap, IconCamp, IconCamera } from '@/components/Icons';
import { uploadImage } from '@/lib/uploadImage';
import KaravanQRCard from '@/components/KaravanQRCard';
import OnboardingModal from '@/components/OnboardingModal';
import ConfettiCelebration from '@/components/ConfettiCelebration';
import CityStickers from '@/components/CityStickers';
import ActivityHeatmap from '@/components/ActivityHeatmap';

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
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

  // Active Tab for Modern Dashboard
  const [activeTab, setActiveTab] = useState<'passport' | 'garage' | 'settings'>('passport');

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
  const [celebrationAchievement, setCelebrationAchievement] = useState<{ icon: string; title: string; description?: string | null } | null>(null);
  const prevAchievementIds = useRef<Set<number> | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    
    const { data } = await supabase
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
      supabase.from('friendships').select('id', { count: 'exact', head: true }).or(`user_id.eq.${uid},friend_id.eq.${uid}`).eq('status', 'accepted'),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', uid),
    ]);
    setRoutesCount(routesRes.count || 0);
    setFriendsCount(friendsRes.count || 0);
    setPostsCount(postsRes.count || 0);
  };

  const fetchProfile = async () => {
    if (!session?.user?.id) return;
    const { data } = await supabase
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
      if (!data.bio && !data.caravan_type && !localStorage.getItem('onboarding_done')) {
        setShowOnboarding(true);
      }
    }
  };

  const fetchAchievements = async () => {
    if (!session?.user?.id) return;
    const { data } = await supabase
      .from('user_achievements')
      .select('achievement_id, earned_at, achievements(*)')
      .eq('user_id', session.user.id);

    if (data) {
      if (prevAchievementIds.current !== null) {
        const newOnes = data.filter(ua => !prevAchievementIds.current!.has(ua.achievement_id));
        if (newOnes.length > 0) {
          const first = newOnes[0];
          const ach = Array.isArray(first.achievements) ? first.achievements[0] : first.achievements;
          if (ach) {
            setCelebrationAchievement({
              icon: (ach as any).icon || '🏆',
              title: (ach as any).title || 'Yeni Başarım',
              description: (ach as any).description,
            });
          }
        }
      }
      prevAchievementIds.current = new Set(data.map(ua => ua.achievement_id));
      setUserAchievements(data);
    }
  };

  const handleCheckIn = async (uid: string) => {
    const { error } = await supabase.rpc('check_in_user', { p_user_id: uid });
    if (!error) {
      fetchProfile();
      fetchAchievements();
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user?.id) return;

    setIsUploading(true);
    const url = await uploadImage(file);
    if (url) {
      setAvatarUrl(url);
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
    }
    setIsUploading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showToast('Başarıyla giriş yapıldı!', "success");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;
    setLoading(true);

    try {
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
          share_location: shareLocation,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (error) throw error;
      showToast('Profil ve karavan bilgileri güncellendi!', 'success');
      fetchProfile();
    } catch (err: any) {
      showToast('Hata: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (authChecking) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingBox}>
          <div className="pulse-dot"></div>
          <p>Karavan Günlüğü Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Auth Form (Giriş / Kayıt)
  if (!session) {
    return (
      <div className={styles.container} ref={scrollRef}>
        <div className={styles.authCard + " glass-card"}>
          <div className={styles.authHeader}>
            <span style={{ fontSize: '2.5rem' }}>🚐</span>
            <h2>{isLogin ? 'Karavan Günlüğüne Giriş' : 'Aramıza Katıl, Komşu!'}</h2>
            <p>{isLogin ? 'Yolculuk anıların, rotaların ve komşuların seni bekliyor.' : 'Türkiye’nin en samimi karavancı topluluğunda yerini al.'}</p>
          </div>

          <form onSubmit={handleAuth} className={styles.authForm}>
            {!isLogin && (
              <div className={styles.inputGroup}>
                <label>Ad Soyad</label>
                <input
                  type="text"
                  required
                  placeholder="Ahmet Yılmaz"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                />
              </div>
            )}

            <div className={styles.inputGroup}>
              <label>E-posta Adresi</label>
              <input
                type="email"
                required
                placeholder="karavanci@ornek.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Şifre</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
              {loading ? 'İşleniyor...' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
            </button>
          </form>

          <div className={styles.authFooter}>
            <button
              type="button"
              className={styles.switchAuthBtn}
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Hesabın yok mu? Kayıt Ol' : 'Zaten hesabın var mı? Giriş Yap'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const level = Math.floor(xp / 100) + 1;
  const progressPercent = xp % 100;

  return (
    <div className={styles.container} ref={scrollRef}>
      {/* ─── Apple Wallet Stili Dijital Karavan Pasaportu ─── */}
      <section className={styles.passportHero}>
        <div className={styles.passportCard}>
          <div className={styles.passportHeader}>
            <div className={styles.passportBrand}>
              <span>🇹🇷</span>
              <div>
                <h4>T.C. KARAVAN PASAPORTU</h4>
                <small>REPUBLIC OF CARAVAN COMMUNITY</small>
              </div>
            </div>
            <div className={styles.passportLevelBadge}>
              LVL {level}
            </div>
          </div>

          <div className={styles.passportBody}>
            <div className={styles.passportAvatarCol}>
              <div className={styles.passportAvatarWrap}>
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Avatar" width={84} height={84} className={styles.passportAvatar} />
                ) : (
                  <div className={styles.passportAvatarFallback}>
                    {(profile?.full_name || 'K').charAt(0)}
                  </div>
                )}
                <label className={styles.cameraIconBtn}>
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden disabled={isUploading} />
                  <IconCamera size={14} color="#fff" />
                </label>
              </div>
              <span className={styles.passportCallsign}>
                {username ? `@${username}` : 'Gezgin'}
              </span>
            </div>

            <div className={styles.passportDetailsCol}>
              <div className={styles.passportRow}>
                <span className={styles.fieldLabel}>KAPTAN</span>
                <span className={styles.fieldVal}>{profile?.full_name || 'Karavan Komşusu'}</span>
              </div>
              <div className={styles.passportRow}>
                <span className={styles.fieldLabel}>ARAÇ TİPİ</span>
                <span className={styles.fieldVal}>{caravanType || 'Belirtilmedi'}</span>
              </div>
              <div className={styles.passportRowGrid}>
                <div>
                  <span className={styles.fieldLabel}>AKÜ</span>
                  <span className={styles.fieldVal}>{batteryCapacity || '—'}</span>
                </div>
                <div>
                  <span className={styles.fieldLabel}>SOLAR</span>
                  <span className={styles.fieldVal}>{solarPanel || '—'}</span>
                </div>
                <div>
                  <span className={styles.fieldLabel}>TEMİZ SU</span>
                  <span className={styles.fieldVal}>{waterTank || '—'}</span>
                </div>
                <div>
                  <span className={styles.fieldLabel}>ISITICI</span>
                  <span className={styles.fieldVal}>{heatingSystem || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.passportFooter}>
            <div className={styles.passportXpBar}>
              <div className={styles.xpLabelRow}>
                <span>Tecrübe: {xp} XP</span>
                <span>Sonraki Seviye: %{progressPercent}</span>
              </div>
              <div className={styles.xpTrack}>
                <div className={styles.xpFill} style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>

            <div className={styles.passportActions}>
              <button className={styles.qrTriggerBtn} onClick={() => setShowQRCard(true)}>
                📱 QR Kimliğim
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Dashboard İstatistik Sayaçları ─── */}
      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <IconMap size={22} color="var(--sunset-orange, #FF8C42)" />
          <strong>{routesCount}</strong>
          <span>Kayıtlı Rota</span>
        </div>
        <div className={styles.statBox} onClick={() => setShowFriendsModal(true)} style={{ cursor: 'pointer' }}>
          <IconUser size={22} color="var(--forest-green, #2D5A27)" />
          <strong>{friendsCount}</strong>
          <span>Yol Komşusu</span>
        </div>
        <div className={styles.statBox}>
          <IconCamp size={22} color="#4A90E2" />
          <strong>{postsCount}</strong>
          <span>Paylaşılan Manzara</span>
        </div>
      </div>

      {/* ─── Modern Tab Navigation ─── */}
      <div className={styles.tabNav}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'passport' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('passport')}
        >
          🪪 Rozetler & Şehirler
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'garage' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('garage')}
        >
          🚐 Karavan Garajı & Donanım
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'settings' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Profil & Ayarlar
        </button>
      </div>

      {/* ─── TAB 1: Rozetler & Şehir Çıkartmaları ─── */}
      {activeTab === 'passport' && (
        <div className={styles.tabContent}>
          <div className={styles.panelSection + " glass-card"}>
            <h3>🏆 Kazanılan Rozetler ({userAchievements.length})</h3>
            <div className={styles.badgesGrid}>
              {userAchievements.map((ua: any) => (
                <div key={ua.achievement_id} className={styles.badgeItem}>
                  <div className={styles.badgeIcon}>{ua.achievements?.icon || '🏆'}</div>
                  <span className={styles.badgeTitle}>{ua.achievements?.title}</span>
                  <small className={styles.badgeDesc}>{ua.achievements?.description}</small>
                </div>
              ))}
              {userAchievements.length === 0 && (
                <p className={styles.noBadgeNotice}>
                  Henüz bir rozet kazanmadın. Rota çizerek, check-in yaparak ve telsizde selam vererek rozetler kazan!
                </p>
              )}
            </div>
          </div>

          <div className={styles.panelSection + " glass-card"}>
            <CityStickers userId={session.user.id} />
          </div>

          <div className={styles.panelSection + " glass-card"}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.6rem' }}>🏃</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>VanLife Fit & Kamp Sağlığı</h3>
                  <small style={{ color: '#94a3b8' }}>Düzenli kamp egzersizleri ve hareket geçmişi</small>
                </div>
              </div>
              <Link href="/egzersiz" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Egzersiz Merkezine Git →
              </Link>
            </div>
            <ActivityHeatmap />
          </div>
        </div>
      )}

      {/* ─── TAB 2: Karavan Garajı Formu ─── */}
      {activeTab === 'garage' && (
        <form onSubmit={handleUpdateProfile} className={styles.tabContent}>
          <div className={styles.panelSection + " glass-card"}>
            <h3>🚐 Karavan Donanım Özellikleri</h3>
            <p className={styles.sectionSubtitle}>
              Karavanının teknik kapasitesi, yoldaki komşularının sana uygun tavsiyeler vermesini sağlar.
            </p>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Karavan Türü</label>
                <select value={caravanType} onChange={e => setCaravanType(e.target.value)}>
                  <option value="">Seçiniz...</option>
                  <option value="Motokaravan">Motokaravan (Alkovenli / Entegre)</option>
                  <option value="Campervan">Campervan (Panelvan Dönüşüm)</option>
                  <option value="Çekme Karavan">Çekme Karavan (750kg altı / üstü)</option>
                  <option value="Off-road / Teardrop">Off-road / Teardrop Karavan</option>
                  <option value="Araç Üstü Çadır">Araç Üstü Çadır / Kamp Donanımlı</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>🔋 Yaşam Aküsü Kapasitesi</label>
                <input
                  type="text"
                  placeholder="Örn: 200Ah LiFePO4 Lityum"
                  value={batteryCapacity}
                  onChange={e => setBatteryCapacity(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>☀️ Güneş Paneli Gücü</label>
                <input
                  type="text"
                  placeholder="Örn: 410W Monokristal Half-Cut"
                  value={solarPanel}
                  onChange={e => setSolarPanel(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>💧 Temiz Su Deposu</label>
                <input
                  type="text"
                  placeholder="Örn: 150 Litre Poliüretan"
                  value={waterTank}
                  onChange={e => setWaterTank(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>🔥 Ortam Isıtıcısı</label>
                <input
                  type="text"
                  placeholder="Örn: Webasto Air Top / Dizel 2kW / Truma Combi"
                  value={heatingSystem}
                  onChange={e => setHeatingSystem(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '16px' }} disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Garaj Bilgilerini Güncelle'}
            </button>
          </div>
        </form>
      )}

      {/* ─── TAB 3: Profil & Ayarlar ─── */}
      {activeTab === 'settings' && (
        <form onSubmit={handleUpdateProfile} className={styles.tabContent}>
          <div className={styles.panelSection + " glass-card"}>
            <h3>👤 Kişisel Bilgiler & Gizlilik</h3>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Kullanıcı Adı (Telsiz Çağrı Kodu)</label>
                <input
                  type="text"
                  placeholder="@kaptanali"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>E-posta (Salt Okunur)</label>
                <input type="email" value={session.user.email} disabled />
              </div>

              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Hakkımda & Karavan Hikayem</label>
                <textarea
                  rows={3}
                  placeholder="Yolculukların, rotaların, karavanla ilgili hayallerin..."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                />
              </div>

              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label>📍 Canlı Konum Paylaşımı</label>
                <div
                  className={styles.toggleRow}
                  onClick={() => setShareLocation(!shareLocation)}
                >
                  <div className={`${styles.toggle} ${shareLocation ? styles.toggleActive : ''}`}></div>
                  <span>{shareLocation ? 'Aktif: Yakındaki karavancı komşular beni radarda görebilir' : 'Gizli: Konumum diğer kullanıcılara kapalı'}</span>
                </div>
              </div>
            </div>

            <div className={styles.settingsBtnRow}>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>

              <button type="button" className="btn-secondary" onClick={handleLogout}>
                Güvenli Çıkış Yap
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Modallar */}
      {showQRCard && profile && (
        <KaravanQRCard profile={profile} userId={session.user.id} onClose={() => setShowQRCard(false)} />
      )}

      {showOnboarding && session?.user && (
        <OnboardingModal
          userId={session.user.id}
          onDone={() => {
            setShowOnboarding(false);
            localStorage.setItem('onboarding_done', 'true');
            fetchProfile();
          }}
        />
      )}

      {celebrationAchievement && (
        <ConfettiCelebration
          achievement={celebrationAchievement}
          onClose={() => setCelebrationAchievement(null)}
        />
      )}
    </div>
  );
}
