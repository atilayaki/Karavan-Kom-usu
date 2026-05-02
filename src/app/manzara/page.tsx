'use client';

import styles from './manzara.module.css';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { uploadImage } from '@/lib/uploadImage';
import { useToast } from '@/components/Toast';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { IconHeart, IconChat, IconMap, IconCamp, IconUser, IconBell, IconShare, IconTrash } from '@/components/Icons';

export default function ManzaraPage() {
  const { showToast } = useToast();
  const scrollRef = useScrollReveal();
  const [filter, setFilter] = useState<'En Yeniler' | 'Popüler' | 'Askıda Notlar' | 'İz Bırak (Rotalar)'>('En Yeniler');
  const [posts, setPosts] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({ caption: '', location_name: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Comments state
  const [activeCommentPost, setActiveCommentPost] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [filter]);

  const handleShareLink = async (post: any) => {
    const shareData = {
      title: 'Karavan Komşusu - Yol Manzarası',
      text: `${post.profiles?.full_name} harika bir manzara paylaştı: "${post.caption}"`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Link panoya kopyalandı!", "success");
      }
    } catch (err) {
      console.log('Error sharing', err);
    }
  };

  const fetchFeed = async () => {
    setLoading(true);
    try {
      if (filter === 'Askıda Notlar') {
        const { data, error } = await supabase
          .from('vw_geographic_notes')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Notes fetch error details:', error.message, error.details, error.hint);
          setNotes([]);
          showToast(`Notlar yüklenemedi: ${error.message}`, "error");
        } else {
          setNotes(data || []);
        }
      } else if (filter === 'İz Bırak (Rotalar)') {
        const { data, error } = await supabase
          .from('vw_routes')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Routes fetch error details:', error.message, error.details);
          const fallback = await supabase.from('routes').select('*').order('created_at', { ascending: false });
          setRoutes(fallback.data || []);
          showToast(`Rotalar yüklenemedi: ${error.message}`, "error");
        } else {
          setRoutes(data || []);
        }
      } else {
        let query = supabase.from('posts').select(`
          *,
          profiles(full_name),
          comments(id, comment, created_at, profiles(full_name))
        `);
        if (filter === 'Popüler') {
          query = query.order('likes_count', { ascending: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }
        const res = await query;
        if (res.error) {
          console.error("Posts fetch error details:", res.error);
          showToast("Veri çekme hatası: " + res.error.message, "error");
          setPosts([]);
        } else if (res.data) {
          setPosts(res.data);
        }
      }
    } catch (err: any) {
      console.error("Unexpected error in fetchFeed:", err);
      showToast("Beklenmedik bir hata: " + (err.message || 'Bilinmiyor'), "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = fetchFeed;

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Bu manzarayı silmek istediğinden emin misin? Geri alınamaz.')) return;
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) {
      showToast('Silinemedi: ' + error.message, "error");
    } else {
      setPosts(prev => prev.filter(p => p.id !== postId));
      showToast("Manzara silindi.", "info");
    }
  };

  const handleLike = async (postId: number, currentLikes: number) => {
    const { error } = await supabase.from('posts').update({ likes_count: currentLikes + 1 }).eq('id', postId);
    if (!error) {
      setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: currentLikes + 1 } : p));
      showToast("Beğenildi! ❤️", "success");
    }
  };

  const handleSharePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return showToast("Giriş yapmalısınız!", "warning");
    if (!imageFile) return showToast("Lütfen bir fotoğraf seçin.", "warning");
    
    setIsSubmitting(true);
    
    const uploadedUrl = await uploadImage(imageFile);
    if (!uploadedUrl) {
      showToast("Görsel yüklenemedi.", "error");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from('posts').insert([
      {
        user_id: user.id,
        caption: newPost.caption,
        location_name: newPost.location_name,
        image_url: uploadedUrl
      }
    ]);

    if (!error) {
      showToast("Manzaranız başarıyla paylaşıldı!", "success");
      setIsModalOpen(false);
      setNewPost({ caption: '', location_name: '' });
      setImageFile(null);
      fetchPosts();
    } else {
      showToast("Hata: " + error.message, "error");
    }
    setIsSubmitting(false);
  };

  const handleAddComment = async (e: React.FormEvent, postId: number) => {
    e.preventDefault();
    if (!user) return showToast("Yorum yapmak için giriş yapmalısınız!", "warning");
    if (!newComment.trim()) return;

    setIsCommenting(true);
    const { error } = await supabase.from('comments').insert([
      {
        post_id: postId,
        user_id: user.id,
        comment: newComment
      }
    ]);

    if (!error) {
      showToast("Yorumunuz eklendi.", "success");
      setNewComment('');
      fetchPosts();
    } else {
      showToast("Yorum eklenemedi: " + error.message, "error");
    }
    setIsCommenting(false);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.container} ref={scrollRef}>
      <div className={styles.feedWrapper}>
        
        {/* Header / Actions */}
        <div className={styles.header + " reveal"}>
          <div>
            <span className="font-accent" style={{fontSize: '1.2rem', color: 'var(--sunset-orange)'}}>Topluluk Akışı</span>
            <h2 className={styles.title}>Yol Manzarası</h2>
          </div>
          {user ? (
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>+ Manzara Paylaş</button>
          ) : (
            <Link href="/gunluk" className="btn-secondary" style={{textDecoration: 'none'}}>Aramıza Katıl</Link>
          )}
        </div>

        {/* Filters */}
        <div className={styles.filters + " reveal"}>
          {['En Yeniler', 'Popüler', 'Askıda Notlar', 'İz Bırak (Rotalar)'].map((f) => (
            <button 
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.activeFilter : ''}`}
              onClick={() => setFilter(f as typeof filter)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div className={styles.feed + " stagger-children"}>
          {loading ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
              <div className="skeleton skeleton-image" style={{height: '300px'}} />
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-text" />
            </div>
          ) : filter === 'Askıda Notlar' ? (
            notes.length === 0 ? (
              <p style={{textAlign: 'center', opacity: 0.7}}>Henüz askıya bir not bırakılmamış.</p>
            ) : (
              notes.map((n) => (
                <div key={`note-${n.id}`} className={styles.postCard + " glass-card"}>
                  <div className={styles.postHeader}>
                    <div className={styles.userInfo}>
                      <div className={styles.avatarWrap}>
                        <div className={styles.avatar} style={{background: 'var(--forest-green-glow)'}}>📌</div>
                      </div>
                      <div>
                        <h4>{n.profile_full_name || 'Gizli Karavancı'}</h4>
                        <span className={styles.location}>📍 {n.location_name || 'Konum belirtilmedi'} • {formatTime(n.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <p className={styles.postText} style={{fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--forest-green)'}}>"{n.note}"</p>
                  <div className={styles.postFooter}>
                    <Link href="/kesfet" className={styles.actionBtn}>
                      <IconMap size={18} /> Haritada Gör
                    </Link>
                  </div>
                </div>
              ))
            )
          ) : filter === 'İz Bırak (Rotalar)' ? (
            routes.length === 0 ? (
              <p style={{textAlign: 'center', opacity: 0.7}}>Henüz paylaşılmış bir rota yok.</p>
            ) : (
              routes.map((r) => (
                <div key={`route-${r.id}`} className={styles.postCard + " glass-card"}>
                  <div className={styles.postHeader}>
                    <div className={styles.userInfo}>
                      <div className={styles.avatarWrap}>
                        <div className={styles.avatar} style={{background: 'var(--sunset-glow)'}}>🛣️</div>
                      </div>
                      <div>
                        <h4>{r.profile_full_name || 'Gizli Karavancı'}</h4>
                        <span className={styles.location}>{r.start_location_name} ➔ {r.end_location_name} • {formatTime(r.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <h3 style={{margin: '12px 0 8px', color: 'var(--sunset-orange)'}}>{r.title}</h3>
                  {r.description && <p className={styles.postText}>{r.description}</p>}
                  <div className={styles.postFooter}>
                    <Link href="/kesfet" className={styles.actionBtn}>
                      <IconMap size={18} /> Rotayı Haritada Aç
                    </Link>
                  </div>
                </div>
              ))
            )
          ) : posts.length === 0 ? (
            <p style={{textAlign: 'center', opacity: 0.7}}>Henüz bir manzara paylaşılmamış.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className={styles.postCard + " glass-card"}>
                
                <div className={styles.postHeader}>
                  <div className={styles.userInfo}>
                    <div className={styles.avatarWrap}>
                      <div className={styles.avatar}>{(post.profiles?.full_name || 'G').charAt(0)}</div>
                    </div>
                    <div>
                      <h4 style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                        {post.profiles?.full_name || 'Gizli Karavancı'}
                        <span className="badge badge-verified">✓</span>
                      </h4>
                      <span className={styles.location}>📍 {post.location_name} • {formatTime(post.created_at)}</span>
                    </div>
                  </div>
                  {user?.id === post.user_id && (
                    <button
                      className={styles.deleteBtn}
                      title="Manzarayı sil"
                      onClick={() => handleDeletePost(post.id)}
                    >
                      <IconTrash size={18} color="var(--danger)" />
                    </button>
                  )}
                </div>

                <p className={styles.postText}>{post.caption}</p>
                
                <div className={styles.imageContainer}>
                  <img src={post.image_url} alt="Manzara" className={styles.postImage} />
                </div>

                <div className={styles.postFooter}>
                  <button className={styles.actionBtn} onClick={() => handleLike(post.id, post.likes_count)}>
                    <IconHeart size={20} filled={post.likes_count > 0} color={post.likes_count > 0 ? 'var(--danger)' : 'currentColor'} /> 
                    <span>{post.likes_count}</span>
                  </button>
                  <button 
                    className={styles.actionBtn} 
                    onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                  >
                    <IconChat size={20} /> 
                    <span>{post.comments?.length || 0}</span>
                  </button>
                  <button className={styles.actionBtn} style={{ marginLeft: 'auto' }} onClick={() => handleShareLink(post)}>
                    <IconShare size={20} /> <span>Paylaş</span>
                  </button>
                </div>
                
                {/* Comments Section */}
                {activeCommentPost === post.id && (
                  <div className={styles.commentsSection}>
                    {post.comments && post.comments.length > 0 ? (
                      <div className={styles.commentsList}>
                        {post.comments.map((c: any) => (
                          <div key={c.id} className={styles.commentItem}>
                            <strong className={styles.commentAuthor}>{c.profiles?.full_name || 'Gizli Karavancı'}</strong>
                            <p className={styles.commentText}>{c.comment}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{fontSize: '0.85rem', opacity: 0.6, marginBottom: '15px'}}>İlk yorumu sen yap!</p>
                    )}
                    
                    <form onSubmit={(e) => handleAddComment(e, post.id)} className={styles.commentForm}>
                      <input 
                        type="text" 
                        placeholder="Yorum ekle..." 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <button type="submit" className="btn-primary" disabled={isCommenting || !newComment.trim()}>
                        Gönder
                      </button>
                    </form>
                  </div>
                )}

              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Post Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent + " glass-card reveal-scale visible"}>
            <h3>Yeni Manzara Paylaş</h3>
            <p style={{opacity: 0.7, fontSize: '0.9rem', marginBottom: '20px'}}>Yolculuğundan bir anıyı komşularınla paylaş.</p>
            <form onSubmit={handleSharePost} className={styles.modalForm}>
              <div className={styles.inputGroup}>
                <label>📍 Konum</label>
                <input 
                  type="text" 
                  placeholder="Örn: Kaz Dağları, Balıkesir" 
                  value={newPost.location_name}
                  onChange={(e) => setNewPost({...newPost, location_name: e.target.value})}
                  required
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label>📸 Fotoğraf</label>
                <div className={styles.fileDropZone}>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                    required
                    id="manzara-upload"
                  />
                  <label htmlFor="manzara-upload" className={styles.fileLabel}>
                    {imageFile ? imageFile.name : 'Görsel Seç veya Sürükle'}
                  </label>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>✍️ Açıklama</label>
                <textarea 
                  placeholder="Günün nasıl geçiyor? Manzaranı tarif et..." 
                  rows={4}
                  value={newPost.caption}
                  onChange={(e) => setNewPost({...newPost, caption: e.target.value})}
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost">İptal</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Paylaşılıyor...' : 'Manzarayı Paylaş'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
