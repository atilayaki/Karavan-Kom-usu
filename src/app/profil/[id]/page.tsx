'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useToast } from '@/components/Toast';
import type { Profile, MarketplaceItem, Post, UserAchievement } from '@/lib/database.types';
import { IconUser, IconCamp } from '@/components/Icons';
import styles from './profil.module.css';

type Tab = 'posts' | 'items' | 'achievements';

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const scrollRef = useScrollReveal();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('posts');
  const [stats, setStats] = useState({ posts: 0, items: 0, routes: 0 });

  useEffect(() => {
    let mounted = true;

    (async () => {
      const [{ data: prof }, { data: postData }, { data: itemData }, { data: achData }, { count: routesCount }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('posts').select('*').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('marketplace_items').select('*').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('user_achievements').select('*, achievements(*)').eq('user_id', id),
        supabase.from('routes').select('*', { count: 'exact', head: true }).eq('user_id', id),
      ]);

      if (!mounted) return;

      if (!prof) {
        showToast('Profil bulunamadı.', 'error');
        setLoading(false);
        return;
      }

      setProfile(prof);
      setPosts(postData || []);
      setItems(itemData || []);
      setAchievements(achData || []);
      setStats({
        posts: postData?.length || 0,
        items: itemData?.length || 0,
        routes: routesCount || 0,
      });
      setLoading(false);
    })();

    return () => { mounted = false; };
  }, [id, showToast]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className="skeleton-loader" style={{ height: '300px', borderRadius: '24px' }}></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound + ' glass-card'}>
          <IconUser size={48} color="var(--sunset-orange)" />
          <h2>Profil bulunamadı</h2>
          <Link href="/" className="btn-primary">Ana sayfaya dön</Link>
        </div>
      </div>
    );
  }

  const level = profile.level || Math.floor((profile.xp || 0) / 100) + 1;

  return (
    <div className={styles.container} ref={scrollRef}>
      <header className={styles.profileHeader + ' glass-card reveal'}>
        <div className={styles.avatarWrap}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name || 'Üye'} />
          ) : (
            <IconUser size={64} color="var(--forest-green)" />
          )}
        </div>

        <div className={styles.headerInfo}>
          <div className={styles.nameRow}>
            <h1>{profile.full_name || 'Üye'}</h1>
            {profile.is_verified && <span className={styles.verifiedBadge}>✓ Doğrulanmış</span>}
          </div>
          {profile.username && <div className={styles.username}>@{profile.username}</div>}
          {profile.bio && <p className={styles.bio}>{profile.bio}</p>}

          <div className={styles.statsRow}>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{level}</span>
              <span className={styles.statLabel}>Seviye</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{profile.xp || 0}</span>
              <span className={styles.statLabel}>XP</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{stats.posts}</span>
              <span className={styles.statLabel}>Paylaşım</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{stats.items}</span>
              <span className={styles.statLabel}>İlan</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{stats.routes}</span>
              <span className={styles.statLabel}>Rota</span>
            </div>
          </div>
        </div>
      </header>

      {(profile.caravan_type || profile.battery_capacity || profile.solar_panel || profile.water_tank || profile.heating_system) && (
        <section className={styles.garage + ' glass-card reveal'}>
          <h3><IconCamp size={20} /> Karavan Garajı</h3>
          <div className={styles.garageGrid}>
            {profile.caravan_type && <div><span>Tip</span><strong>{profile.caravan_type}</strong></div>}
            {profile.battery_capacity && <div><span>Akü</span><strong>{profile.battery_capacity}</strong></div>}
            {profile.solar_panel && <div><span>Güneş Paneli</span><strong>{profile.solar_panel}</strong></div>}
            {profile.water_tank && <div><span>Su Tankı</span><strong>{profile.water_tank}</strong></div>}
            {profile.heating_system && <div><span>Isıtma</span><strong>{profile.heating_system}</strong></div>}
          </div>
        </section>
      )}

      <div className={styles.tabBar + ' reveal'}>
        <button className={tab === 'posts' ? styles.tabActive : ''} onClick={() => setTab('posts')}>
          Paylaşımlar ({stats.posts})
        </button>
        <button className={tab === 'items' ? styles.tabActive : ''} onClick={() => setTab('items')}>
          İlanlar ({stats.items})
        </button>
        <button className={tab === 'achievements' ? styles.tabActive : ''} onClick={() => setTab('achievements')}>
          Başarımlar ({achievements.length})
        </button>
      </div>

      <div className={styles.tabContent}>
        {tab === 'posts' && (
          posts.length === 0
            ? <div className={styles.empty}>Henüz paylaşım yok.</div>
            : <div className={styles.postsGrid}>
                {posts.map(p => (
                  <div key={p.id} className={styles.postCard + ' glass-card'}>
                    {p.image_url && <img src={p.image_url} alt={p.caption || ''} />}
                    <div className={styles.postBody}>
                      <p>{p.caption}</p>
                      {p.location_name && <small>📍 {p.location_name}</small>}
                    </div>
                  </div>
                ))}
              </div>
        )}

        {tab === 'items' && (
          items.length === 0
            ? <div className={styles.empty}>Henüz ilan yok.</div>
            : <div className={styles.itemsGrid}>
                {items.map(i => (
                  <Link href={`/pazaryeri/${i.id}`} key={i.id} className={styles.itemCard + ' glass-card'}>
                    {i.image_url && <img src={i.image_url} alt={i.title} />}
                    <div className={styles.itemBody}>
                      <h4>{i.title}</h4>
                      <span className={styles.itemPrice}>{i.price.toLocaleString('tr-TR')} TL</span>
                    </div>
                  </Link>
                ))}
              </div>
        )}

        {tab === 'achievements' && (
          achievements.length === 0
            ? <div className={styles.empty}>Henüz başarım yok.</div>
            : <div className={styles.achievementsGrid}>
                {achievements.map(ua => {
                  const ach = Array.isArray(ua.achievements) ? ua.achievements[0] : ua.achievements;
                  if (!ach) return null;
                  return (
                    <div key={ua.achievement_id} className={styles.achievementCard + ' glass-card'}>
                      <div className={styles.achIcon} style={{ background: ach.badge_color || 'var(--forest-green-glow)' }}>
                        {ach.icon}
                      </div>
                      <div>
                        <h4>{ach.title}</h4>
                        <p>{ach.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
        )}
      </div>
    </div>
  );
}
