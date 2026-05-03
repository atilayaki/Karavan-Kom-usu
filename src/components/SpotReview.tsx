'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './SpotReview.module.css';

interface Review {
  id: number;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

interface Props {
  spotId: number;
}

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          className={`${styles.star} ${n <= (hover || value) ? styles.starFilled : ''}`}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          role={onChange ? 'button' : undefined}
        >★</span>
      ))}
    </div>
  );
}

export default function SpotReview({ spotId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [spotId]);

  async function fetchReviews() {
    const { data } = await supabase
      .from('spot_reviews')
      .select('*, profiles(full_name)')
      .eq('spot_id', spotId)
      .order('created_at', { ascending: false });
    const list = (data as Review[]) || [];
    setReviews(list);
  }

  useEffect(() => {
    if (!userId) return;
    const mine = reviews.find(r => r.user_id === userId) || null;
    setMyReview(mine);
    if (mine) { setRating(mine.rating); setComment(mine.comment || ''); }
  }, [reviews, userId]);

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  async function submit() {
    if (!userId || rating === 0) return;
    setSubmitting(true);
    await supabase.from('spot_reviews').upsert(
      { user_id: userId, spot_id: spotId, rating, comment: comment.trim() || null },
      { onConflict: 'user_id,spot_id' }
    );
    await fetchReviews();
    setShowForm(false);
    setSubmitting(false);
  }

  async function deleteReview() {
    if (!userId) return;
    await supabase.from('spot_reviews').delete().eq('user_id', userId).eq('spot_id', spotId);
    setMyReview(null);
    setRating(0);
    setComment('');
    await fetchReviews();
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3>Değerlendirmeler</h3>
        {avg && (
          <div className={styles.avgBadge}>
            <Stars value={Math.round(Number(avg))} />
            <span>{avg} ({reviews.length})</span>
          </div>
        )}
      </div>

      {userId && !showForm && (
        <button className={styles.writeBtn} onClick={() => setShowForm(true)}>
          {myReview ? '✏️ Değerlendirmeni Düzenle' : '+ Değerlendir'}
        </button>
      )}

      {showForm && (
        <div className={styles.form}>
          <Stars value={rating} onChange={setRating} />
          <textarea
            className={styles.commentInput}
            placeholder="Yorumun (isteğe bağlı, max 500 karakter)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <div className={styles.formActions}>
            <button className="btn-ghost" onClick={() => setShowForm(false)}>İptal</button>
            <button className="btn-primary" onClick={submit} disabled={rating === 0 || submitting}>
              {submitting ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}

      {reviews.length === 0 && (
        <p className={styles.empty}>Henüz değerlendirme yok. İlk sen yaz!</p>
      )}

      <div className={styles.list}>
        {reviews.map(r => (
          <div key={r.id} className={styles.reviewCard}>
            <div className={styles.reviewTop}>
              <Stars value={r.rating} />
              <span className={styles.reviewName}>{r.profiles?.full_name || 'Karavancı'}</span>
              {r.user_id === userId && (
                <button className={styles.deleteBtn} onClick={deleteReview} title="Sil">✕</button>
              )}
            </div>
            {r.comment && <p className={styles.reviewComment}>{r.comment}</p>}
            <span className={styles.reviewDate}>
              {new Date(r.created_at).toLocaleDateString('tr-TR')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
