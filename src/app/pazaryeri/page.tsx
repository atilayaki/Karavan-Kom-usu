'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './pazaryeri.module.css';
import Link from 'next/link';
import { uploadImage } from '@/lib/uploadImage';
import { useToast } from '@/components/Toast';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useDebounce } from '@/hooks/useDebounce';
import type { MarketplaceItem } from '@/lib/database.types';
import type { User } from '@supabase/supabase-js';
import { IconMap, IconSOS, IconHeart, IconUser, IconBell, IconBook } from '@/components/Icons';

export default function PazaryeriPage() {
  const { showToast } = useToast();
  const scrollRef = useScrollReveal();
  const [products, setProducts] = useState<MarketplaceItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [newItem, setNewItem] = useState({ 
    title: '', 
    description: '', 
    category: 'Elektronik', 
    price: '', 
    location_name: '' 
  });

  const categories = ['Tümü', 'Enerji & Elektrik', 'Su & Tesisat', 'Isıtma & Soğutma', 'Dış Donanım', 'Mobilya & İç Mekan', 'Elektronik', 'İç Donanım'];

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchBookmarks(user.id);
    });
    fetchProducts();
  }, [activeCategory]);

  const fetchBookmarks = async (userId: string) => {
    const { data } = await supabase
      .from('bookmarks')
      .select('item_id')
      .eq('user_id', userId)
      .eq('item_type', 'marketplace_item');
    if (data) {
      setBookmarks(new Set(data.map(b => b.item_id)));
    }
  };

  const toggleBookmark = async (e: React.MouseEvent, productId: number) => {
    e.stopPropagation();
    if (!user) return showToast("Favoriye eklemek için giriş yapmalısınız.", "info");

    const isBookmarked = bookmarks.has(productId);
    
    // Optimistic UI update
    const newBookmarks = new Set(bookmarks);
    if (isBookmarked) {
      newBookmarks.delete(productId);
      showToast("İlan favorilerden kaldırıldı.", "info");
    } else {
      newBookmarks.add(productId);
      showToast("İlan favorilere eklendi!", "success");
    }
    setBookmarks(newBookmarks);

    if (isBookmarked) {
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('item_type', 'marketplace_item').eq('item_id', productId);
    } else {
      await supabase.from('bookmarks').insert([{ user_id: user.id, item_type: 'marketplace_item', item_id: productId }]);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase.from('marketplace_items').select(`*, profiles(full_name)`).order('created_at', { ascending: false });
      
      if (activeCategory !== 'Tümü') {
        query = query.eq('category', activeCategory);
      }

      const { data, error } = await query;
      
      const dummyItems: any[] = [
        {
          id: 9991,
          title: '200W Katlanabilir Güneş Paneli - Sıfır Ayarında',
          description: 'Sadece 2 kamp döneminde kullanıldı. Monokristal hücreli, çok verimli. Karavanımı sattığım için satıyorum. Pazarlık payı vardır.',
          price: 4500,
          category: 'Enerji & Elektrik',
          location_name: 'Muğla / Fethiye',
          image_url: 'https://images.unsplash.com/photo-1509391366360-feaf9fa44452?q=80&w=800&auto=format&fit=crop',
          profiles: { full_name: 'Ahmet Yılmaz' },
          created_at: new Date().toISOString()
        },
        {
          id: 9992,
          title: 'Webasto Dizel Isıtıcı 5kW - Garantili',
          description: 'Geçen yıl alındı, bakımları yeni yapıldı. Dijital ekranlı ve uzaktan kumandalı. Kış kampları için vazgeçilmez.',
          price: 8200,
          category: 'Isıtma & Soğutma',
          location_name: 'Bursa / Nilüfer',
          image_url: 'https://images.unsplash.com/photo-1594541818212-9b9ba1f80b27?q=80&w=800&auto=format&fit=crop',
          profiles: { full_name: 'Selin Aras' },
          created_at: new Date().toISOString()
        },
        {
          id: 9993,
          title: 'Helinox Tarzı Hafif Kamp Sandalye Seti (2 Adet)',
          description: 'Çok az yer kaplar, ultra hafiftir. 120kg taşıma kapasiteli. Dağcılık ve karavan kullanımı için ideal.',
          price: 2100,
          category: 'Dış Donanım',
          location_name: 'Antalya / Kaş',
          image_url: 'https://images.unsplash.com/photo-1533626904905-cc52fd99285e?q=80&w=800&auto=format&fit=crop',
          profiles: { full_name: 'Can Gezgin' },
          created_at: new Date().toISOString()
        }
      ];

      const filteredDummy = activeCategory === 'Tümü' 
        ? dummyItems 
        : dummyItems.filter(item => item.category === activeCategory);

      if (error) {
        setProducts(filteredDummy);
      } else {
        setProducts([...(data || []), ...filteredDummy]);
      }
    } catch (err) {
      console.error("Unexpected error in fetchProducts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return showToast("İlan vermek için giriş yapmalısınız!", "error");
    if (!newItem.title || !newItem.price) return showToast("Lütfen zorunlu alanları doldurun.", "info");
    
    setIsSubmitting(true);

    let finalImageUrl = 'https://images.unsplash.com/photo-1582214695027-e4c1f60ce3cb?q=80&w=400&auto=format&fit=crop';
    
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      } else {
        showToast("Görsel yüklenemedi, varsayılan görsel kullanılacak.", "info");
      }
    }

    const { error } = await supabase.from('marketplace_items').insert([
      {
        user_id: user.id,
        title: newItem.title,
        description: newItem.description,
        category: newItem.category,
        price: parseFloat(newItem.price),
        image_url: finalImageUrl,
        location_name: newItem.location_name
      }
    ]);

    if (!error) {
      setIsModalOpen(false);
      setNewItem({ title: '', description: '', category: 'Elektronik', price: '', location_name: '' });
      setImageFile(null);
      showToast("İlan başarıyla yayınlandı!", "success");
      fetchProducts();
    } else {
      showToast("Hata: " + error.message, "error");
    }
    setIsSubmitting(false);
  };

  return (
    <div className={styles.container} ref={scrollRef}>
      <div className={styles.header + " reveal"}>
        <div className={styles.headerContent}>
          <span className="font-accent" style={{fontSize: '1.2rem', color: 'var(--sunset-orange)'}}>Ekipman & Aksesuar</span>
          <h2>Karavancı Pazaryeri</h2>
          <p>Karavanını yenile, fazlalıkları sat, bütçeni koru. Karavancılar arası güvenli alışveriş.</p>
        </div>
        {user ? (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>+ Yeni İlan</button>
        ) : (
          <Link href="/gunluk" className="btn-secondary" style={{textDecoration: 'none'}}>Giriş Yap</Link>
        )}
      </div>

      <div className={styles.searchBar + " reveal"}>
        <div className={styles.searchInputWrapper}>
          <input
            type="text"
            placeholder="Ürün, marka veya şehir ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => setSearch('')}>×</button>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <aside className={styles.filtersSidebar + " reveal"}>
          <h3>Kategoriler</h3>
          <ul className={styles.categoryList}>
            {categories.map((cat) => (
              <li key={cat}>
                <button 
                  className={activeCategory === cat ? styles.activeCategory : ''}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className={styles.productsGrid + " stagger-children"}>
          {loading ? (
            <div className={styles.skeletonGrid}>
              {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton-loader" style={{height: '350px', borderRadius: '24px'}}></div>)}
            </div>
          ) : (() => {
            const q = debouncedSearch.trim().toLowerCase();
            const visible = q
              ? products.filter(p =>
                  (p.title || '').toLowerCase().includes(q) ||
                  (p.description || '').toLowerCase().includes(q) ||
                  (p.location_name || '').toLowerCase().includes(q)
                )
              : products;

            if (visible.length === 0) return (
              <div className={styles.emptyState}>
                <IconSOS size={48} color="var(--sunset-orange)" />
                <p>{q ? 'Aramana uygun ilan bulunamadı.' : 'Bu kategoride henüz ilan yok.'}</p>
                <button className="btn-ghost" onClick={() => {setSearch(''); setActiveCategory('Tümü')}}>Tüm İlanları Gör</button>
              </div>
            );

            return visible.map((product) => (
              <Link href={`/pazaryeri/${product.id}`} key={product.id} className={styles.productCard + " glass-card reveal"} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className={styles.imageContainer}>
                  {product.image_url && (
                    <img src={product.image_url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  <button 
                    className={`${styles.bookmarkBtn} ${bookmarks.has(product.id) ? styles.bookmarked : ''}`}
                    onClick={(e) => toggleBookmark(e, product.id)}
                  >
                    <IconHeart size={18} filled={bookmarks.has(product.id)} />
                  </button>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardMeta}>
                    <span className={styles.categoryBadge}>{product.category}</span>
                    <span className={styles.priceTag}>{product.price} TL</span>
                  </div>
                  <h4 className={styles.title}>{product.title}</h4>
                  <p className={styles.excerpt}>{product.description?.substring(0, 80)}...</p>
                  <div className={styles.footer}>
                    <div className={styles.seller}>
                      <IconUser size={14} /> <span>{product.profiles?.full_name?.split(' ')[0] || 'Üye'}</span>
                    </div>
                    <div className={styles.location}>
                      <IconMap size={14} /> <span>{product.location_name}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ));
          })()}
        </main>
      </div>

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent + " glass-card reveal-scale visible"} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Yeni İlan Oluştur</h3>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddItem} className={styles.modalForm}>
              <div className={styles.inputGroup}>
                <label>Ürün Başlığı</label>
                <input 
                  type="text" 
                  placeholder="Örn: 200Ah Jel Akü - Sıfır Ayarında" 
                  value={newItem.title}
                  onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                  required
                />
              </div>
              
              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <label>Fiyat (TL)</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={newItem.price}
                    onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                    required
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Şehir</label>
                  <input 
                    type="text" 
                    placeholder="Muğla / Marmaris" 
                    value={newItem.location_name}
                    onChange={(e) => setNewItem({...newItem, location_name: e.target.value})}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Kategori</label>
                <select 
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                >
                  {categories.filter(c => c !== 'Tümü').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>Ürün Görseli</label>
                <div className={styles.fileInputWrapper}>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                  />
                  <span>{imageFile ? imageFile.name : 'Dosya seçin veya sürükleyin'}</span>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Açıklama</label>
                <textarea 
                  placeholder="Ürün durumu, garanti süresi, teknik detaylar..." 
                  rows={4}
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Yayınlanıyor...' : 'İlanı Yayınla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
