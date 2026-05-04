'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './profil.module.css';
import Link from 'next/link';
import { IconMap, IconSOS } from '@/components/Icons';
import { useParams } from 'next/navigation';

export default function ProfilePage() {
  const params = useParams();
  const profileId = params?.id as string;
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [stats, setStats] = useState({ routes: 0, friends: 0, posts: 0 });
  const [achievements, setAchievements] = useState<any[]>([]);
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted'>('none');
  const [friendshipId, setFriendshipId] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    fetchData();
    const cleanupPresence = checkPresence();
    return () => {
      if (cleanupPresence) cleanupPresence();
    };
  }, [profileId]);

  const fetchData = async () => {
    if (!profileId || profileId === 'undefined') {
      console.error("Invalid Profile ID");
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      // 1. Session ve User kontrolü
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError) console.warn("Auth check error:", authError);
      
      const currentUser = userData?.user;
      setMyId(currentUser?.id || null);

      // 2. Profil verisi çekme
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();

      if (profileError) {
        console.error("Profile Error:", profileError);
        setLoading(false);
        return;
      }

      if (!profileData) {
        console.warn("No profile found for ID:", profileId);
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // 3. Diğer verileri çek (Hatalar sayfayı bozmasın)
      const fetchStats = async () => {
        try {
          const [routesRes, friendsRes, postsRes] = await Promise.all([
            supabase.from('routes').select('id', { count: 'exact', head: true }).eq('user_id', profileId),
            supabase.from('friendships').select('id', { count: 'exact', head: true }).or(`user_id.eq.${profileId},friend_id.eq.${profileId}`).eq('status', 'accepted'),
            supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', profileId)
          ]);
          
          setStats({ 
            routes: routesRes.count || 0, 
            friends: friendsRes.count || 0, 
            posts: postsRes.count || 0 
          });
        } catch (e) { console.error("Stats fetch fail"); }
      };

      const fetchAchievements = async () => {
        try {
          const { data } = await supabase.from('user_achievements').select('*, achievements(*)').eq('user_id', profileId);
          if (data) setAchievements(data);
        } catch (e) { }
      };

      const fetchFriendship = async () => {
        try {
          if (currentUser && currentUser.id !== profileId) {
            const { data } = await supabase
              .from('friendships')
              .select('*')
              .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${profileId}),and(user_id.eq.${profileId},friend_id.eq.${currentUser.id})`)
              .maybeSingle();

            if (data) {
              setFriendshipId(data.id);
              if (data.status === 'accepted') setFriendshipStatus('accepted');
              else if (data.user_id === currentUser.id) setFriendshipStatus('pending_sent');
              else setFriendshipStatus('pending_received');
            }
          }
        } catch (e) { }
      };

      await Promise.allSettled([fetchStats(), fetchAchievements(), fetchFriendship()]);

    } catch (err) {
      console.error("Global Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkPresence = () => {
    const channel = supabase.channel('online-users');
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      setIsOnline(Object.keys(state).includes(profileId));
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const handleFriendAction = async () => {
    if (!myId) return;
    
    if (friendshipStatus === 'none') {
      const { data, error } = await supabase.from('friendships').insert([
        { user_id: myId, friend_id: profileId, status: 'pending' }
      ]).select().single();
      if (!error && data) {
        setFriendshipStatus('pending_sent');
        setFriendshipId(data.id);
      }
    } else if (friendshipStatus === 'pending_received' && friendshipId) {
      const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
      if (!error) setFriendshipStatus('accepted');
    }
  };

  if (loading) return (
    <div style={{minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--foreground)'}}>
      Yükleniyor...
    </div>
  );

  if (!profile) return (
    <div style={{minHeight:'60vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--foreground)', gap:'20px', padding:'20px', textAlign:'center'}}>
      <IconSOS size={48} color="var(--sunset-orange)" />
      <h2>Komşu bulunamadı</h2>
      <Link href="/telsiz" className="btn-secondary">Geri Dön</Link>
    </div>
  );

  const isOwner = myId === profileId;
  const showContent = !profile.is_private || isOwner || friendshipStatus === 'accepted';

  return (
    <div className={styles.container}>
      <div className={styles.glow} />
      
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.avatarWrap} onClick={() => profile.avatar_url && setIsZoomed(true)}>
            <div className={styles.avatar}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%'}} />
              ) : (
                profile.full_name?.charAt(0)
              )}
            </div>
            {isOnline && <div className={styles.onlineDot} />}
          </div>
          
          <div className={styles.nameWrap}>
            <h1>{profile.full_name}</h1>
            <div className={styles.badges}>
              <span className={styles.levelBadge}>LVL {profile.level ?? Math.max(1, Math.floor((profile.xp ?? 0) / 100) + 1)}</span>
              <span className={styles.typeBadge}>{profile.caravan_type || 'Gezgin'}</span>
              {profile.is_private && <span className={styles.privateBadge}>🔒 Gizli</span>}
            </div>
          </div>
          
          <div className={styles.headerActions}>
            {isOwner ? (
              <Link href="/gunluk" className="btn-secondary">⚙️ Düzenle</Link>
            ) : (
              <button onClick={handleFriendAction} className={friendshipStatus === 'accepted' ? 'btn-ghost' : 'btn-primary'}>
                {friendshipStatus === 'accepted' ? '✔️ Arkadaş' : 
                 friendshipStatus === 'pending_sent' ? '⏳ Bekliyor' : 
                 friendshipStatus === 'pending_received' ? '✅ Kabul Et' : '➕ Ekle'}
              </button>
            )}
          </div>
        </div>
        
        <div className={styles.headerStats}>
          <div className={styles.stat}>
            <strong>{stats.friends}</strong>
            <span>Kampçı</span>
          </div>
          <div className={styles.stat}>
            <strong>{stats.routes}</strong>
            <span>Rota</span>
          </div>
          <div className={styles.stat}>
            <strong>{stats.posts}</strong>
            <span>Paylaşım</span>
          </div>
        </div>
      </header>

      <div className={styles.mainGrid}>
        <aside className={styles.sidebar}>
          <div className={styles.card + " glass-card"}>
            <h3>Hakkında</h3>
            <p>{profile.bio || "Merhaba! Ben bir karavancıyım."}</p>
            <div className={styles.details}>
              <div>📍 {profile.location_name || 'Yollarda'}</div>
              <div>🚐 {profile.caravan_model || 'Karavan'}</div>
            </div>
          </div>
          
          {achievements.length > 0 && (
            <div className={styles.card + " glass-card"}>
              <h3>Rozetler</h3>
              <div className={styles.achievementGrid}>
                {achievements.map((a: any) => (
                  <span key={a.id} className={styles.achIcon} title={a.achievements?.title}>
                    {a.achievements?.icon || '🏆'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>

        <main className={styles.content}>
          {!showContent ? (
            <div className={styles.privateCard + " glass-card"}>
              <div style={{fontSize: '3rem', marginBottom: '15px'}}>🔒</div>
              <h3>Bu profil gizlidir</h3>
              <p>Paylaşımları görmek için arkadaş olmalısınız.</p>
              <button className="btn-primary" onClick={handleFriendAction} style={{marginTop: '15px'}}>Arkadaşlık İsteği Gönder</button>
            </div>
          ) : (
            <div className={styles.feed}>
              <div className={styles.emptyFeed}>
                <IconMap size={40} />
                <p>Henüz paylaşılmış bir fotoğraf veya yer yok.</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {isZoomed && (
        <div className={styles.zoomModal} onClick={() => setIsZoomed(false)}>
          <div className={styles.zoomedAvatar}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} />
            ) : (
              profile.full_name?.charAt(0)
            )}
          </div>
          <div className={styles.zoomClose}>Kapatmak için tıkla</div>
        </div>
      )}
    </div>
  );
}
