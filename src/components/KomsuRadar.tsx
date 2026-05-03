'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './KomsuRadar.module.css';

interface RadarUser {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  xp: number | null;
  caravan_type: string | null;
}

export default function KomsuRadar() {
  const [users, setUsers] = useState<RadarUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, xp, caravan_type')
      .order('updated_at', { ascending: false })
      .limit(8)
      .then(({ data }) => {
        if (!mounted) return;
        setUsers(data || []);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading || users.length === 0) return null;

  return (
    <section className={styles.wrapper + ' glass-card'}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h3>📡 Komşu Radarı</h3>
          <span className={styles.live}>● CANLI</span>
        </div>
        <p className={styles.sub}>Yakın zamanda aktif olan karavancılar</p>
      </div>

      <div className={styles.radarWrap} aria-hidden="true">
        <div className={styles.radarRing} />
        <div className={styles.radarRing} style={{ animationDelay: '-1s', opacity: 0.5 }} />
        <div className={styles.radarRing} style={{ animationDelay: '-2s', opacity: 0.25 }} />
        <div className={styles.radarSweep} />
        <div className={styles.radarDot} />
      </div>

      <div className={styles.userList}>
        {users.map((u, i) => (
          <Link
            key={u.id}
            href={`/profil/${u.id}`}
            className={styles.userRow}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={styles.avatarWrap}>
              {u.avatar_url
                ? <img src={u.avatar_url} alt={u.full_name || 'Üye'} />
                : <span className={styles.avatarFallback}>{(u.full_name || u.username || '?')[0].toUpperCase()}</span>
              }
              <span className={styles.onlineDot} />
            </div>
            <div className={styles.userInfo}>
              <span className={styles.name}>{u.full_name || u.username || 'Karavancı'}</span>
              {u.username && <span className={styles.handle}>@{u.username}</span>}
            </div>
            <div className={styles.meta}>
              {u.caravan_type && <span className={styles.badge}>🚐 {u.caravan_type}</span>}
              {u.xp != null && <span className={styles.xp}>{u.xp} XP</span>}
            </div>
          </Link>
        ))}
      </div>

      <Link href="/kesfet" className={styles.viewAll}>Tüm Komşuları Keşfet →</Link>
    </section>
  );
}
