'use client';

import { useState, useEffect } from 'react';
import type { Post } from '@/lib/database.types';
import styles from './PolaroidStory.module.css';

export default function PolaroidStory({
  posts,
  onClose,
  startIndex = 0,
}: {
  posts: Post[];
  onClose: () => void;
  startIndex?: number;
}) {
  const [index, setIndex] = useState(startIndex);

  const visiblePosts = posts.filter(p => p.image_url);
  const post = visiblePosts[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIndex(i => Math.min(i + 1, visiblePosts.length - 1));
      if (e.key === 'ArrowLeft') setIndex(i => Math.max(i - 1, 0));
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [visiblePosts.length, onClose]);

  if (!post) return null;

  const dateStr = new Date(post.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const tilt = (index % 5 - 2) * 1.5;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <button className={styles.closeBtn} onClick={onClose} aria-label="Kapat">×</button>

      <div className={styles.progress}>
        {visiblePosts.map((_, i) => (
          <div key={i} className={`${styles.progressBar} ${i === index ? styles.progressActive : ''} ${i < index ? styles.progressDone : ''}`} />
        ))}
      </div>

      {index > 0 && (
        <button
          className={`${styles.navBtn} ${styles.navPrev}`}
          onClick={(e) => { e.stopPropagation(); setIndex(i => i - 1); }}
          aria-label="Önceki"
        >‹</button>
      )}
      {index < visiblePosts.length - 1 && (
        <button
          className={`${styles.navBtn} ${styles.navNext}`}
          onClick={(e) => { e.stopPropagation(); setIndex(i => i + 1); }}
          aria-label="Sonraki"
        >›</button>
      )}

      <div
        className={styles.polaroid}
        style={{ transform: `rotate(${tilt}deg)` }}
        onClick={(e) => e.stopPropagation()}
        key={post.id}
      >
        <div className={styles.photoFrame}>
          <img src={post.image_url || ''} alt={post.caption || 'Manzara'} />
        </div>
        <div className={styles.cardBody}>
          <p className={styles.handwriting}>{post.caption || '—'}</p>
          <div className={styles.meta}>
            <span className={styles.location}>📍 {post.location_name || 'Bir yerlerde'}</span>
            <span className={styles.author}>— {post.profiles?.full_name || 'Karavancı'}</span>
            <span className={styles.date}>{dateStr}</span>
          </div>
        </div>
      </div>

      <div className={styles.hint}>{index + 1} / {visiblePosts.length}  ·  ← → ile gez · ESC ile çık</div>
    </div>
  );
}
