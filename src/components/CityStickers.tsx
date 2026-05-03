'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './CityStickers.module.css';

interface Sticker {
  id: number;
  city_slug: string;
  city_name: string;
  region: string;
  emoji: string;
  description: string;
}

export default function CityStickers({ userId }: { userId: string }) {
  const [allStickers, setAllStickers] = useState<Sticker[]>([]);
  const [earnedIds, setEarnedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      supabase.from('city_stickers').select('*').order('region'),
      supabase.from('user_city_stickers').select('sticker_id').eq('user_id', userId),
    ]).then(([all, earned]) => {
      if (!mounted) return;
      setAllStickers(all.data || []);
      setEarnedIds(new Set((earned.data || []).map(e => e.sticker_id)));
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [userId]);

  if (loading) return null;
  if (allStickers.length === 0) return null;

  const earnedCount = earnedIds.size;
  const groupedByRegion = allStickers.reduce<Record<string, Sticker[]>>((acc, s) => {
    (acc[s.region] = acc[s.region] || []).push(s);
    return acc;
  }, {});

  return (
    <section className={styles.wrapper + ' glass-card'}>
      <header className={styles.header}>
        <h3>📍 Yol Damgaları</h3>
        <span className={styles.counter}>{earnedCount} / {allStickers.length}</span>
      </header>
      <p className={styles.subtitle}>Bir şehirde ilan veya manzara paylaş, o yörenin damgası senin olsun.</p>

      {Object.entries(groupedByRegion).map(([region, list]) => (
        <div key={region} className={styles.regionBlock}>
          <h4>{region}</h4>
          <div className={styles.grid}>
            {list.map(s => {
              const earned = earnedIds.has(s.id);
              return (
                <div
                  key={s.id}
                  className={`${styles.sticker} ${earned ? styles.earned : styles.locked}`}
                  title={earned ? s.description : 'Henüz kazanılmadı'}
                >
                  <span className={styles.stickerEmoji}>{s.emoji}</span>
                  <span className={styles.stickerName}>{s.city_name}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
