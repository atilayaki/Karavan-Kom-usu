'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './profil.module.css';
import { useToast } from '@/components/Toast';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import type { Profile, UserAchievement } from '@/lib/database.types';
import { IconUser, IconMap, IconChat, IconCamp, IconVerified, IconRadio } from '@/components/Icons';

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: profileId } = use(params);
  const { showToast } = useToast();
  const scrollRef = useScrollReveal();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted'>('none');
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({ routes: 0, friends: 0, posts: 0 });
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    fetchData();
    checkPresence();
  }, [profileId]);

  const fetchData = async () => {
    setLoading(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setMyId(user?.id || null);

      // Get target profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileError || !profileData) {
        console.error("Profile not found:", profileError);
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch stats individually to avoid Promise.all failure if one table is missing
      const fetchStats = async () => {
        const { count: routesCount } = await supabase.from('routes').select('id', { count: 'exact', head: true }).eq('user_id', profileId);
        const { count: friendsCount } = await supabase.from('friendships').select('id', { count: 'exact', head: true }).or(`user_id.eq.${profileId},friend_id.eq.${profileId}`).eq('status', 'accepted');
        const { count: postsCount } = await supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', profileId);
        
        setStats({
          routes: routesCount || 0,
          friends: friendsCount || 0,
          posts: postsCount || 0
        });
      };

      const fetchAchievements = async () => {
        try {
          const { data: achData } = await supabase.from('user_achievements').select('*, achievements(*)').eq('user_id', profileId);
          if (achData) setAchievements(achData);
        } catch (e) {
          console.warn("Achievements table might be missing:", e);
        }
      };

      const fetchFriendship = async () => {
        if (user && user.id !== profileId) {
          const { data: friendData } = await supabase
            .from('friendships')
            .select('*')
            .or(`and(user_id.eq.${user.id},friend_id.eq.${profileId}),and(user_id.eq.${profileId},friend_id.eq.${user.id})`)
            .maybeSingle();

          if (friendData) {
            setFriendshipId(friendData.id);
            if (friendData.status === 'accepted') setFriendshipStatus('accepted');
            else if (friendData.user_id === user.id) setFriendshipStatus('pending_sent');
            else setFriendshipStatus('pending_received');
          }
        }
      };

      await Promise.allSettled([fetchStats(), fetchAchievements(), fetchFriendship()]);

    } catch (err) {
      console.error("Unexpected data fetch error:", err);
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
    if (!myId) return showToast("Etkileşim için giriş yapmalısınız.", "warning");
    setActionLoading(true);

    try {
      if (friendshipStatus === 'none') {
        const { data, error } = await supabase.from('friendships').insert([
          { user_id: myId, friend_id: profileId, status: 'pending' }
        ]).select().single();
        if (error) throw error;
        setFriendshipStatus('pending_sent');
        setFriendshipId(data.id);
        showToast("Arkadaşlık isteği gönderildi!", "success");
      } 
      else if (friendshipStatus === 'pending_received') {
        const { error } = await supabase.from('friendships')
          .update({ status: 'accepted' })
          .eq('id', friendshipId);
        if (error) throw error;
        setFriendshipStatus('accepted');
        showToast("Artık yol arkadaşısınız!", "success");
      }
      else if (friendshipStatus === 'accepted' || friendshipStatus === 'pending_sent') {
        const confirmMsg = friendshipStatus === 'accepted' ? "Arkadaşlıktan çıkarmak istediğine emin misin?" : "İsteği iptal etmek istiyor musun?";
        if (window.confirm(confirmMsg)) {
          const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
          if (error) throw error;
          setFriendshipStatus('none');
          setFriendshipId(null);
          showToast("İşlem tamamlandı.", "info");
        }
      }
    } catch (error: any) {
      showToast("Hata: " + error.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container} style={{justifyContent: 'center', alignItems: 'center'}}>
        <div className="pulse-dot"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.container}>
        <div className="glass-card" style={{padding: '40px', textAlign: 'center'}}>
          <h2>Komşu Bulunamadı</h2>
          <p>Aradığın karavancı henüz yola çıkmamış olabilir.</p>
          <Link href="/" className="btn-primary" style={{marginTop: '20px', display: 'inline-block'}}>Ana Sayfaya Dön</Link>
        </div>
      </div>
    );
  }

  const xp = profile.xp || 0;
  const level = Math.floor(xp / 100) + 1;

  return (
    <div className={styles.container} ref={scrollRef}>
      <div className={styles.profileCard + " glass-card reveal visible"}>
        <div className={styles.header}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatarLarge}>
              {profile.avatar_url ? (
                <Image fill src={profile.avatar_url} alt={profile.full_name || 'Profil'} sizes="120px" />
              ) : (
                (profile.full_name || 'K').charAt(0).toUpperCase()
              )}
            </div>
            {isOnline && <div className={styles.onlineBadge}></div>}
          </div>
          
          <div className={styles.info}>
            <div className={styles.nameRow}>
              <h2>{profile.full_name || 'Gizli Komşu'}</h2>
              {profile.is_verified && <IconVerified size={24} color="var(--forest-green)" />}
            </div>
            <span className={styles.username}>@{profile.username || 'karavanci'}</span>
            <div className={styles.caravanTag}>
              🚐 {profile.caravan_type || 'Gezgin'}
            </div>
            
            {myId !== profileId && (
              <div className={styles.actions}>
                <button 
                  className={`btn-${friendshipStatus === 'accepted' ? 'secondary' : 'primary'}`}
                  onClick={handleFriendAction}
                  disabled={actionLoading}
                >
                  {friendshipStatus === 'none' && '+ Arkadaş Ekle'}
                  {friendshipStatus === 'pending_sent' && '⏳ İstek Gönderildi'}
                  {friendshipStatus === 'pending_received' && '✅ İsteği Kabul Et'}
                  {friendshipStatus === 'accepted' && '🤝 Yol Arkadaşı'}
                </button>
                <Link href={`/mesajlar/${profileId}`} className="btn-ghost" style={{background: 'rgba(255,255,255,0.05)'}}>
                  <IconChat size={20} /> Mesaj
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <IconMap size={24} color="var(--sunset-orange)" />
            <strong>{stats.routes}</strong>
            <span>Rota</span>
          </div>
          <div className={styles.statBox}>
            <IconUser size={24} color="var(--forest-green)" />
            <strong>{stats.friends}</strong>
            <span>Arkadaş</span>
          </div>
          <div className={styles.statBox}>
            <IconCamp size={24} color="var(--forest-green)" />
            <strong>{stats.posts}</strong>
            <span>Paylaşım</span>
          </div>
        </div>

        <div className={styles.gamification}>
          <div className={styles.levelHeader}>
            <div className={styles.levelLabel}>
              <span>Karavancı Seviyesi</span>
              <strong>{level}. Seviye Gezgin</strong>
            </div>
            <span style={{fontSize: '0.8rem', opacity: 0.7}}>{xp} XP</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${xp % 100}%` }}></div>
          </div>
          
          {achievements.length > 0 && (
            <div className={styles.badges}>
              {achievements.map((ua: any) => (
                <div key={ua.achievement_id} className={styles.badgeItem} title={ua.achievements?.description}>
                  <div className={styles.badgeIcon}>{ua.achievements?.icon || '🏆'}</div>
                  <span>{ua.achievements?.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {(profile.battery_capacity || profile.solar_panel || profile.water_tank) && (
          <div className={styles.garageSection}>
            <h3><IconRadio size={18} /> Karavan Donanımı</h3>
            <div className={styles.garageGrid}>
              {profile.battery_capacity && (
                <div className={styles.garageItem}>
                  <label>Enerji / Akü</label>
                  <span>{profile.battery_capacity}</span>
                </div>
              )}
              {profile.solar_panel && (
                <div className={styles.garageItem}>
                  <label>Güneş Paneli</label>
                  <span>{profile.solar_panel}</span>
                </div>
              )}
              {profile.water_tank && (
                <div className={styles.garageItem}>
                  <label>Su Kapasitesi</label>
                  <span>{profile.water_tank}</span>
                </div>
              )}
              {profile.heating_system && (
                <div className={styles.garageItem}>
                  <label>Isıtma Sistemi</label>
                  <span>{profile.heating_system}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {profile.bio && (
          <div className={styles.bioSection}>
            <h3><IconUser size={18} /> Hakkında</h3>
            <p className={styles.bioText}>{profile.bio}</p>
          </div>
        )}
      </div>
    </div>
  );
}
