'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './profil.module.css';
import Link from 'next/link';
import { IconMap, IconSOS, IconHeart, IconChat } from '@/components/Icons';
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
  const [posts, setPosts] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
    const cleanupPresence = checkPresence();
    return () => {
      if (cleanupPresence) cleanupPresence();
    };
  }, [profileId]);

  const photoPosts = posts.filter(p => p.image_url);

  const navigateLightbox = useCallback((dir: number) => {
    setSelectedPost((prev: any) => {
      if (!prev) return null;
      const idx = photoPosts.findIndex(p => p.id === prev.id);
      const next = photoPosts[idx + dir];
      return next ?? prev;
    });
  }, [photoPosts]);

  useEffect(() => {
    if (!selectedPost) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPost(null);
      if (e.key === 'ArrowRight') navigateLightbox(1);
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedPost, navigateLightbox]);

  const fetchData = async () => {
    if (!profileId || profileId === 'undefined') {
      console.error("Invalid Profile ID");
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      // 1. Session ve User kontrolü
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) console.warn("Auth check error:", authError);

      const currentUser = session?.user;
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

      const fetchPosts = async () => {
        try {
          const { data } = await supabase
            .from('posts')
            .select('id, image_url, caption, location_name, likes_count, created_at, comments(id)')
            .eq('user_id', profileId)
            .not('image_url', 'is', null)
            .order('created_at', { ascending: false });
          if (data) setPosts(data);
        } catch (e) { }
      };

      const fetchListings = async () => {
        try {
          const { data } = await supabase
            .from('marketplace_items')
            .select('id, title, price, image_url, category, location_name')
            .eq('user_id', profileId)
            .order('created_at', { ascending: false })
            .limit(4);
          if (data) setListings(data);
        } catch (e) { }
      };

      await Promise.allSettled([fetchStats(), fetchAchievements(), fetchFriendship(), fetchPosts(), fetchListings()]);

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
              <>
                <button onClick={handleFriendAction} className={friendshipStatus === 'accepted' ? 'btn-ghost' : 'btn-primary'}>
                  {friendshipStatus === 'accepted' ? '✔️ Arkadaş' :
                   friendshipStatus === 'pending_sent' ? '⏳ Bekliyor' :
                   friendshipStatus === 'pending_received' ? '✅ Kabul Et' : '➕ Ekle'}
                </button>
                {myId && (
                  <Link href={`/mesajlar/${profileId}`} className="btn-secondary" style={{ textDecoration: 'none' }}>
                    <IconChat size={15} /> Mesaj
                  </Link>
                )}
              </>
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
            <>
              {/* Fotoğraf Galerisi */}
              <div className={styles.sectionCard + ' glass-card'}>
                <div className={styles.sectionHeader}>
                  <h3>Manzaralar</h3>
                  <span className={styles.sectionCount}>{photoPosts.length} fotoğraf</span>
                </div>
                {photoPosts.length > 0 ? (
                  <div className={styles.photoGrid}>
                    {photoPosts.map(post => (
                      <button key={post.id} className={styles.photoItem} onClick={() => setSelectedPost(post)}>
                        <img src={post.image_url} alt={post.caption ?? ''} />
                        <div className={styles.photoOverlay}>
                          <span><IconHeart size={14} filled /> {post.likes_count}</span>
                          <span><IconChat size={14} /> {post.comments?.length ?? 0}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptySection}>
                    <IconMap size={32} />
                    <p>Henüz fotoğraf paylaşılmamış.</p>
                  </div>
                )}
              </div>

              {/* Aktif İlanlar */}
              {listings.length > 0 && (
                <div className={styles.sectionCard + ' glass-card'}>
                  <div className={styles.sectionHeader}>
                    <h3>Aktif İlanlar</h3>
                    <Link href={`/pazaryeri`} className={styles.sectionLink}>Tümünü Gör →</Link>
                  </div>
                  <div className={styles.listingGrid}>
                    {listings.map(item => (
                      <Link key={item.id} href={`/pazaryeri/${item.id}`} className={styles.listingCard} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className={styles.listingImg}>
                          {item.image_url && <img src={item.image_url} alt={item.title} />}
                        </div>
                        <div className={styles.listingInfo}>
                          <p className={styles.listingTitle}>{item.title}</p>
                          <span className={styles.listingPrice}>{Number(item.price).toLocaleString('tr-TR')} TL</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
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

      {selectedPost && (() => {
        const idx = photoPosts.findIndex(p => p.id === selectedPost.id);
        return (
          <div className={styles.lightboxOverlay} onClick={() => setSelectedPost(null)}>
            <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
              <button className={styles.lightboxClose} onClick={() => setSelectedPost(null)}>×</button>
              <div className={styles.lightboxImg}>
                <img src={selectedPost.image_url} alt={selectedPost.caption ?? ''} />
                {idx > 0 && (
                  <button className={`${styles.lightboxNav} ${styles.lightboxPrev}`} onClick={() => navigateLightbox(-1)}>&#8249;</button>
                )}
                {idx < photoPosts.length - 1 && (
                  <button className={`${styles.lightboxNav} ${styles.lightboxNext}`} onClick={() => navigateLightbox(1)}>&#8250;</button>
                )}
              </div>
              <div className={styles.lightboxInfo}>
                {selectedPost.location_name && (
                  <div className={styles.lightboxLoc}><IconMap size={14} /> {selectedPost.location_name}</div>
                )}
                {selectedPost.caption && <p className={styles.lightboxCaption}>{selectedPost.caption}</p>}
                <div className={styles.lightboxMeta}>
                  <span><IconHeart size={14} filled /> {selectedPost.likes_count}</span>
                  <span><IconChat size={14} /> {selectedPost.comments?.length ?? 0}</span>
                  <span>{new Date(selectedPost.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className={styles.lightboxCounter}>{idx + 1} / {photoPosts.length}</div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
