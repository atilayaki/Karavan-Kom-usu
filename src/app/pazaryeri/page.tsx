'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './pazaryeri.module.css';
import Link from 'next/link';

export default function PazaryeriPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newItem, setNewItem] = useState({ 
    title: '', 
    description: '', 
    category: 'Elektronik', 
    price: '', 
    image_url: '', 
    location_name: '' 
  });

  const categories = ['Tümü', 'Enerji & Elektrik', 'Su & Tesisat', 'Isıtma & Soğutma', 'Dış Donanım', 'Mobilya & İç Mekan', 'Elektronik', 'İç Donanım'];

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
    fetchProducts();
  }, [activeCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase.from('marketplace_items').select(`*, profiles(full_name)`).order('created_at', { ascending: false });
    
    if (activeCategory !== 'Tümü') {
      query = query.eq('category', activeCategory);
    }

    const { data, error } = await query;
    if (data) setProducts(data);
    setLoading(false);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("İlan vermek için giriş yapmalısınız!");
    if (!newItem.title || !newItem.price) return alert("Lütfen zorunlu alanları doldurun.");
    
    setIsSubmitting(true);
    const { error } = await supabase.from('marketplace_items').insert([
      {
        user_id: user.id,
        title: newItem.title,
        description: newItem.description,
        category: newItem.category,
        price: parseFloat(newItem.price),
        image_url: newItem.image_url || 'https://images.unsplash.com/photo-1582214695027-e4c1f60ce3cb?q=80&w=400&auto=format&fit=crop',
        location_name: newItem.location_name
      }
    ]);

    if (!error) {
      setIsModalOpen(false);
      setNewItem({ title: '', description: '', category: 'Elektronik', price: '', image_url: '', location_name: '' });
      fetchProducts();
    } else {
      alert("Hata: " + error.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h2>İkinci El Ekipman Pazaryeri</h2>
          <p>Karavanını yenile, fazlalıkları sat, bütçeni koru. Karavancılar arası güvenli alışveriş.</p>
        </div>
        {user ? (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>+ İlan Ver</button>
        ) : (
          <Link href="/gunluk" className="btn-secondary" style={{textDecoration: 'none', padding: '10px 20px', borderRadius: '12px'}}>Giriş Yap</Link>
        )}
      </div>

      <div className={styles.searchBar}>
        <input type="text" placeholder="Ne aramıştınız? (Örn: Lityum Akü, Tente...)" />
        <button className={styles.searchBtn}>Ara</button>
      </div>

      <div className={styles.content}>
        <aside className={styles.filtersSidebar}>
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

        <main className={styles.productsGrid}>
          {loading ? (
            <p>Yükleniyor...</p>
          ) : products.length === 0 ? (
            <p>Bu kategoride henüz ilan yok.</p>
          ) : (
            products.map((product) => (
              <div key={product.id} className={styles.productCard + " glass-card"}>
                <div className={styles.imageContainer}>
                  <img src={product.image_url} alt={product.title} />
                </div>
                <div className={styles.cardBody}>
                  <span className={styles.category}>{product.category}</span>
                  <h4 className={styles.title}>{product.title}</h4>
                  <p className={styles.price}>{product.price} {product.currency}</p>
                  <div className={styles.footer}>
                    <span className={styles.seller}>👤 {product.profiles?.full_name || 'Gizli Satıcı'}</span>
                    <span className={styles.location}>📍 {product.location_name}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </main>
      </div>

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent + " glass-card"}>
            <h3>Yeni İlan Ver</h3>
            <form onSubmit={handleAddItem} className={styles.modalForm}>
              <input 
                type="text" 
                placeholder="İlan Başlığı" 
                value={newItem.title}
                onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                required
              />
              <div style={{display: 'flex', gap: '10px'}}>
                <input 
                  type="number" 
                  placeholder="Fiyat (TL)" 
                  value={newItem.price}
                  onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                  required
                  style={{flex: 1}}
                />
                <input 
                  type="text" 
                  placeholder="Şehir" 
                  value={newItem.location_name}
                  onChange={(e) => setNewItem({...newItem, location_name: e.target.value})}
                  style={{flex: 1}}
                />
              </div>
              <select 
                value={newItem.category}
                onChange={(e) => setNewItem({...newItem, category: e.target.value})}
              >
                {categories.filter(c => c !== 'Tümü').map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input 
                type="url" 
                placeholder="Görsel URL (İsteğe Bağlı)" 
                value={newItem.image_url}
                onChange={(e) => setNewItem({...newItem, image_url: e.target.value})}
              />
              <textarea 
                placeholder="Ürün açıklaması, durumu, kullanım süresi vb..." 
                rows={3}
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
              />
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{background: 'transparent', color: 'var(--foreground)', border: '1px solid rgba(0,0,0,0.1)'}}>İptal</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Kaydediliyor...' : 'İlan Ver'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
