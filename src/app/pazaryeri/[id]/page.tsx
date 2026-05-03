'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import type { MarketplaceItem } from '@/lib/database.types';
import type { User } from '@supabase/supabase-js';
import { IconHeart, IconUser, IconMap, IconCalendar, IconChat, IconTrash } from '@/components/Icons';
import styles from './detail.module.css';

interface ItemWithProfile extends MarketplaceItem {
  profiles?: {
    full_name: string | null;
    avatar_url?: string | null;
    caravan_type?: string | null;
  };
}

export default function MarketplaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const scrollRef = useScrollReveal();

  const [item, setItem] = useState<ItemWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [related, setRelated] = useState<MarketplaceItem[]>([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(user);

      const { data, error } = await supabase
        .from('marketplace_items')
        .select(`*, profiles(full_name, avatar_url, caravan_type)`)
        .eq('id', id)
        .single();

      if (!mounted) return;

      if (error || !data) {
        showToast('İlan bulunamadı.', 'error');
        router.push('/pazaryeri');
        return;
      }

      setItem(data as ItemWithProfile);
      setLoading(false);

      if (user) {
        const { data: bm } = await supabase
          .from('bookmarks')
          .select('id')
          .eq('user_id', user.id)
          .eq('item_type', 'marketplace_item')
          .eq('item_id', Number(id))
          .maybeSingle();
        if (mounted) setIsBookmarked(!!bm);
      }

      const { data: rel } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('category', data.category)
        .neq('id', Number(id))
        .order('created_at', { ascending: false })
        .limit(4);
      if (mounted && rel) setRelated(rel);
    })();

    return () => { mounted = false; };
  }, [id, router, showToast]);

  const toggleBookmark = async () => {
    if (!user) return showToast('Favoriye eklemek için giriş yapmalısınız.', 'info');
    if (!item) return;

    const next = !isBookmarked;
    setIsBookmarked(next);

    if (next) {
      await supabase.from('bookmarks').insert([{ user_id: user.id, item_type: 'marketplace_item', item_id: item.id }]);
      showToast('Favorilere eklendi!', 'success');
    } else {
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('item_type', 'marketplace_item').eq('item_id', item.id);
      showToast('Favorilerden kaldırıldı.', 'info');
    }
  };

  const handleDelete = async () => {
    if (!item || !user || user.id !== item.user_id) return;
    if (!confirm('Bu ilanı silmek istediğine emin misin?')) return;

    const { error } = await supabase.from('marketplace_items').delete().eq('id', item.id);
    if (error) {
      showToast('Silinemedi: ' + error.message, 'error');
    } else {
      showToast('İlan silindi.', 'success');
      router.push('/pazaryeri');
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try { await navigator.share({ title: item?.title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      showToast('Link kopyalandı!', 'success');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className="skeleton-loader" style={{ height: '500px', borderRadius: '24px' }}></div>
      </div>
    );
  }

  if (!item) return null;

  const isOwner = user?.id === item.user_id;
  const createdDate = new Date(item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className={styles.container} ref={scrollRef}>
      <Link href="/pazaryeri" className={styles.backLink}>← Pazaryerine Dön</Link>

      <div className={styles.layout}>
        <div className={styles.imageSection + ' glass-card reveal'}>
          {item.image_url ? (
            <img src={item.image_url} alt={item.title} />
          ) : (
            <div className={styles.imagePlaceholder}>Görsel Yok</div>
          )}
        </div>

        <div className={styles.infoSection + ' reveal'}>
          <span className={styles.categoryBadge}>{item.category}</span>
          <h1 className={styles.title}>{item.title}</h1>
          <div className={styles.price}>{item.price.toLocaleString('tr-TR')} TL</div>

          <div className={styles.meta}>
            {item.location_name && (
              <div className={styles.metaItem}><IconMap size={16} /> {item.location_name}</div>
            )}
            <div className={styles.metaItem}><IconCalendar size={16} /> {createdDate}</div>
          </div>

          <div className={styles.sellerCard + ' glass-card'}>
            <div className={styles.sellerInfo}>
              <div className={styles.sellerAvatar}>
                {item.profiles?.avatar_url ? (
                  <img src={item.profiles.avatar_url} alt={item.profiles.full_name || 'Üye'} />
                ) : (
                  <IconUser size={28} />
                )}
              </div>
              <div>
                <div className={styles.sellerName}>{item.profiles?.full_name || 'Üye'}</div>
                {item.profiles?.caravan_type && (
                  <div className={styles.sellerType}>{item.profiles.caravan_type}</div>
                )}
              </div>
            </div>
            <Link href={`/profil/${item.user_id}`} className="btn-ghost">Profili Gör</Link>
          </div>

          <div className={styles.actions}>
            {!isOwner && (
              <Link href={`/telsiz?dm=${item.user_id}`} className="btn-primary" style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}>
                <IconChat size={16} /> Satıcıyla İletişim
              </Link>
            )}
            <button onClick={toggleBookmark} className={`btn-secondary ${isBookmarked ? styles.activeBookmark : ''}`}>
              <IconHeart size={16} filled={isBookmarked} />
              {isBookmarked ? 'Favorilerde' : 'Favorile'}
            </button>
            <button onClick={handleShare} className="btn-ghost" aria-label="Paylaş">Paylaş</button>
            {isOwner && (
              <button onClick={handleDelete} className="btn-ghost" style={{ color: 'var(--sunset-orange)' }}>
                <IconTrash size={16} /> Sil
              </button>
            )}
          </div>
        </div>
      </div>

      {item.description && (
        <section className={styles.descriptionCard + ' glass-card reveal'}>
          <h3>Açıklama</h3>
          <p>{item.description}</p>
        </section>
      )}

      {related.length > 0 && (
        <section className={styles.relatedSection + ' reveal'}>
          <h3>Benzer İlanlar</h3>
          <div className={styles.relatedGrid}>
            {related.map(r => (
              <Link href={`/pazaryeri/${r.id}`} key={r.id} className={styles.relatedCard + ' glass-card'}>
                <div className={styles.relatedImage}>
                  {r.image_url && <img src={r.image_url} alt={r.title} />}
                </div>
                <div className={styles.relatedBody}>
                  <h4>{r.title}</h4>
                  <span className={styles.relatedPrice}>{r.price.toLocaleString('tr-TR')} TL</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
