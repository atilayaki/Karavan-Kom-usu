'use client';

import styles from './manzara.module.css';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ManzaraPage() {
  const [filter, setFilter] = useState('En Yeniler');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({ caption: '', location_name: '', image_url: '' });
  const [user, setUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase.from('posts').select(`*, profiles(full_name)`).order('created_at', { ascending: false });

    const { data, error } = await query;
    if (data) setPosts(data);
    setLoading(false);
  };

  const handleLike = async (postId: number, currentLikes: number) => {
    const { error } = await supabase.from('posts').update({ likes_count: currentLikes + 1 }).eq('id', postId);
    if (!error) {
      setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: currentLikes + 1 } : p));
    }
  };

  const handleSharePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Giriş yapmalısınız!");
    if (!newPost.image_url) return alert("Lütfen bir fotoğraf URL'si ekleyin.");
    
    setIsSubmitting(true);
    const { error } = await supabase.from('posts').insert([
      {
        user_id: user.id,
        caption: newPost.caption,
        location_name: newPost.location_name,
        image_url: newPost.image_url
      }
    ]);

    if (!error) {
      setIsModalOpen(false);
      setNewPost({ caption: '', location_name: '', image_url: '' });
      fetchPosts();
    } else {
      alert("Hata: " + error.message);
    }
    setIsSubmitting(false);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.container}>
      <div className={styles.feedWrapper}>
        
        {/* Header / Actions */}
        <div className={styles.header}>
          <h2>Yol Manzarası</h2>
          {user ? (
            <button className={styles.postButton + " btn-primary"} onClick={() => setIsModalOpen(true)}>+ Manzara Paylaş</button>
          ) : (
            <Link href="/gunluk" className="btn-secondary" style={{textDecoration: 'none', padding: '10px 20px', borderRadius: '12px'}}>Giriş Yap</Link>
          )}
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          {['En Yeniler', 'Popüler', 'Askıda Notlar', 'İz Bırak (Rotalar)'].map((f) => (
            <button 
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.activeFilter : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div className={styles.feed}>
          {loading ? (
            <p style={{textAlign: 'center', opacity: 0.7}}>Manzaralar yükleniyor...</p>
          ) : posts.length === 0 ? (
            <p style={{textAlign: 'center', opacity: 0.7}}>Henüz bir manzara paylaşılmamış.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className={styles.postCard + " glass-card"}>
                
                <div className={styles.postHeader}>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar}>{(post.profiles?.full_name || 'G').charAt(0)}</div>
                    <div>
                      <h4>{post.profiles?.full_name || 'Gizli Karavancı'}</h4>
                      <span className={styles.location}>📍 {post.location_name} • {formatTime(post.created_at)}</span>
                    </div>
                  </div>
                  <button className={styles.moreBtn}>•••</button>
                </div>

                <p className={styles.postText}>{post.caption}</p>
                
                <div className={styles.imageContainer}>
                  <img src={post.image_url} alt="Manzara" className={styles.postImage} />
                </div>

                <div className={styles.postFooter}>
                  <button className={styles.actionBtn} onClick={() => handleLike(post.id, post.likes_count)}>
                    <span className={styles.icon}>❤️</span> {post.likes_count}
                  </button>
                  <button className={styles.actionBtn}>
                    <span className={styles.icon}>💬</span> 0
                  </button>
                  <button className={styles.actionBtn} style={{ marginLeft: 'auto' }}>
                    <span className={styles.icon}>↗️</span> Paylaş
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Post Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent + " glass-card"}>
            <h3>Yeni Manzara Ekle</h3>
            <form onSubmit={handleSharePost} className={styles.modalForm}>
              <input 
                type="text" 
                placeholder="Konum (Örn: Kaz Dağları, Balıkesir)" 
                value={newPost.location_name}
                onChange={(e) => setNewPost({...newPost, location_name: e.target.value})}
                required
              />
              <input 
                type="url" 
                placeholder="Görsel URL'si (Geçici olarak URL giriniz)" 
                value={newPost.image_url}
                onChange={(e) => setNewPost({...newPost, image_url: e.target.value})}
                required
              />
              <textarea 
                placeholder="Günün nasıl geçiyor? Manzaranı tarif et..." 
                rows={4}
                value={newPost.caption}
                onChange={(e) => setNewPost({...newPost, caption: e.target.value})}
                required
              />
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{background: 'transparent', color: 'var(--foreground)', border: '1px solid rgba(0,0,0,0.1)'}}>İptal</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Paylaşılıyor...' : 'Paylaş'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
