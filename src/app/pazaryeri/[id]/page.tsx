'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import type { MarketplaceItem } from '@/lib/database.types';
import type { User } from '@supabase/supabase-js';
import { IconHeart, IconUser, IconMap, IconCalendar, IconChat, IconTrash } from '@/components/Icons';
import styles from './detail.module.css';

interface SellerProfile {
  full_name: string | null;
  avatar_url?: string | null;
  caravan_type?: string | null;
  is_verified?: boolean;
  created_at?: string;
}

interface ItemWithProfile extends MarketplaceItem {
  profiles?: SellerProfile;
}

const QUICK_TEMPLATES = [
  'Merhaba, bu ürün hâlâ satılık mı?',
  'Pazarlık şansı var mı?',
  'Satın almak istiyorum, biraz daha detay verebilir misiniz?',
];

export default function MarketplaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();

  const [item, setItem] = useState<ItemWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [related, setRelated] = useState<MarketplaceItem[]>([]);

  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(user);

      const { data, error } = await supabase
        .from('marketplace_items')
        .select(`*, profiles(full_name, avatar_url, caravan_type, is_verified, created_at)`)
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

  const sendMessage = async () => {
    if (!user || !item) return;
    const text = msgText.trim();
    if (!text) {
      showToast('Mesaj boş olamaz.', 'info');
      return;
    }
    setSending(true);
    const prefix = `[İlan: ${item.title}]\n`;
    const content = text.startsWith('[İlan:') ? text : prefix + text;
    const { error } = await supabase.from('direct_messages').insert({
      sender_id: user.id,
      receiver_id: item.user_id,
      content,
    });
    setSending(false);
    if (error) {
      showToast('Mesaj gönderilemedi: ' + error.message, 'error');
    } else {
      setSent(true);
      setMsgText('');
      showToast('Mesajınız gönderildi!', 'success');
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
  const sellerSince = item.profiles?.created_at
    ? new Date(item.profiles.created_at).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className={styles.container}>
      <Link href="/pazaryeri" className={styles.backLink}>← Pazaryerine Dön</Link>

      <div className={styles.layout}>
        <div className={styles.imageSection + ' glass-card'}>
          {item.image_url ? (
            <img src={item.image_url} alt={item.title} />
          ) : (
            <div className={styles.imagePlaceholder}>
              <span>📦</span>
              <span>Görsel paylaşılmamış</span>
            </div>
          )}
        </div>

        <div className={styles.infoSection}>
          <span className={styles.categoryBadge}>{item.category}</span>
          <h1 className={styles.title}>{item.title}</h1>
          <div className={styles.price}>{item.price.toLocaleString('tr-TR')} TL</div>

          <div className={styles.specsGrid + ' glass-card'}>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>İlan No</span>
              <span className={styles.specValue}>#{item.id}</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Kategori</span>
              <span className={styles.specValue}>{item.category}</span>
            </div>
            {item.location_name && (
              <div className={styles.specRow}>
                <span className={styles.specLabel}><IconMap size={14} /> Konum</span>
                <span className={styles.specValue}>{item.location_name}</span>
              </div>
            )}
            <div className={styles.specRow}>
              <span className={styles.specLabel}><IconCalendar size={14} /> İlan Tarihi</span>
              <span className={styles.specValue}>{createdDate}</span>
            </div>
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
              <div className={styles.sellerMeta}>
                <div className={styles.sellerName}>
                  {item.profiles?.full_name || 'Üye'}
                  {item.profiles?.is_verified && <span className={styles.verifiedDot} title="Doğrulanmış üye">✓</span>}
                </div>
                {item.profiles?.caravan_type && (
                  <div className={styles.sellerType}>{item.profiles.caravan_type}</div>
                )}
                {sellerSince && (
                  <div className={styles.sellerSince}>Üyelik: {sellerSince}</div>
                )}
              </div>
            </div>
            <Link href={`/profil/${item.user_id}`} className="btn-ghost">Profili Gör</Link>
          </div>

          {!isOwner && (
            <div className={styles.contactCard + ' glass-card'}>
              <div className={styles.contactHeader}>
                <IconChat size={18} />
                <h3>Satıcıyla İletişime Geç</h3>
              </div>

              {!user ? (
                <div className={styles.contactBody}>
                  <p className={styles.contactHint}>Mesaj göndermek için giriş yapmalısın.</p>
                  <Link href="/gunluk" className="btn-primary" style={{ alignSelf: 'flex-start', textDecoration: 'none' }}>Giriş Yap</Link>
                </div>
              ) : sent ? (
                <div className={styles.contactBody}>
                  <p className={styles.sentMessage}>✓ Mesajınız satıcıya iletildi.</p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button type="button" className="btn-ghost" onClick={() => setSent(false)}>Yeni Mesaj</button>
                    <Link href="/mesajlar" className="btn-primary" style={{ textDecoration: 'none' }}>Sohbete Devam Et →</Link>
                  </div>
                </div>
              ) : (
                <div className={styles.contactBody}>
                  <div className={styles.templates}>
                    {QUICK_TEMPLATES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={styles.templateChip}
                        onClick={() => setMsgText(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className={styles.messageInput}
                    rows={4}
                    placeholder="Satıcıya mesajınızı yazın…"
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    maxLength={500}
                  />
                  <div className={styles.contactFooter}>
                    <span className={styles.charCount}>{msgText.length}/500</span>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={sendMessage}
                      disabled={sending || !msgText.trim()}
                    >
                      {sending ? 'Gönderiliyor…' : 'Mesaj Gönder'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={styles.actions}>
            <button onClick={toggleBookmark} className={`btn-secondary ${isBookmarked ? styles.activeBookmark : ''}`}>
              <IconHeart size={16} filled={isBookmarked} />
              {isBookmarked ? 'Favorilerde' : 'Favorile'}
            </button>
            <button onClick={handleShare} className="btn-ghost">Paylaş</button>
            {isOwner && (
              <button onClick={handleDelete} className="btn-ghost" style={{ color: 'var(--sunset-orange)' }}>
                <IconTrash size={16} /> İlanı Sil
              </button>
            )}
          </div>
        </div>
      </div>

      {item.description && (
        <section className={styles.descriptionCard + ' glass-card'}>
          <h3>Açıklama</h3>
          <p>{item.description}</p>
        </section>
      )}

      {related.length > 0 && (
        <section className={styles.relatedSection}>
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
