'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './kesfet.module.css';

// Dynamically import the Map component to prevent SSR errors with Leaflet
const MapWithNoSSR = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className={styles.mapOverlay}>
      <p>Harita Yükleniyor...</p>
    </div>
  )
});

export default function KesfetPage() {
  const [spots, setSpots] = useState<any[]>([]);
  const [filteredSpots, setFilteredSpots] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Hepsi');
  const [selectedSpot, setSelectedSpot] = useState<any>(null);

  useEffect(() => {
    const fetchSpots = async () => {
      const { data, error } = await supabase.from('vw_spots').select('*');
      if (data) {
        setSpots(data);
        setFilteredSpots(data);
      }
    };
    fetchSpots();
  }, []);

  useEffect(() => {
    let result = spots;
    if (activeFilter !== 'Hepsi') {
      result = result.filter(s => s.category === activeFilter);
    }
    if (search.trim() !== '') {
      result = result.filter(s => 
        s.title.toLowerCase().includes(search.toLowerCase()) || 
        (s.address && s.address.toLowerCase().includes(search.toLowerCase()))
      );
    }
    setFilteredSpots(result);
  }, [search, activeFilter, spots]);

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        
        {/* If a spot is selected, show detail view, else show list */}
        {selectedSpot ? (
          <div className={styles.detailView}>
            <button className={styles.backBtn} onClick={() => setSelectedSpot(null)}>
              ← Geri Dön
            </button>
            <div className={styles.detailImage} style={{ background: selectedSpot.category === 'Sakin Köşe' ? 'var(--forest-green)' : 'var(--sunset-orange)'}}>
              {selectedSpot.category === 'Sakin Köşe' ? '🏕️' : '🛠️'}
            </div>
            <div className={styles.detailContent}>
              <span className={styles.detailCategory}>{selectedSpot.category}</span>
              <h2>{selectedSpot.title}</h2>
              <p className={styles.detailAddress}>📍 {selectedSpot.address || 'Konum belirtilmedi'}</p>
              
              <div className={styles.detailSection}>
                <h3>Hakkında</h3>
                <p>{selectedSpot.description || 'Bu mekan için henüz detaylı bir açıklama eklenmemiş.'}</p>
              </div>

              <div className={styles.detailActions}>
                <button className="btn-primary" style={{width: '100%'}}>Yol Tarifi Al</button>
                <button className="btn-secondary" style={{width: '100%', marginTop: '10px'}}>Askıda Not Bırak</button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.searchBox}>
              <input 
                type="text" 
                placeholder="Usta, mekan veya şehir ara..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className={styles.filters}>
              {['Hepsi', 'Sakin Köşe', 'Yol Yardımcısı'].map(f => (
                <button 
                  key={f}
                  className={activeFilter === f ? styles.activeFilter : ''}
                  onClick={() => setActiveFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className={styles.resultsList}>
              {filteredSpots.length === 0 ? (
                <p style={{textAlign: 'center', opacity: 0.5, marginTop: '20px'}}>Sonuç bulunamadı.</p>
              ) : (
                filteredSpots.map((spot) => (
                  <div 
                    key={spot.id} 
                    className={styles.resultCard + " glass-card"}
                    onClick={() => setSelectedSpot(spot)}
                  >
                    <div className={styles.cardImage} style={{ background: spot.category === 'Sakin Köşe' ? 'var(--forest-green)' : 'var(--sunset-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px' }}>
                      {spot.category === 'Sakin Köşe' ? '🏕️' : '🛠️'}
                    </div>
                    <div className={styles.cardInfo}>
                      <h4>{spot.title}</h4>
                      <p>{spot.category}</p>
                      <div className={styles.cardFooter}>
                        <span>{spot.address || 'Konum belirtilmedi'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </aside>

      <main className={styles.mapArea}>
        <MapWithNoSSR spots={selectedSpot ? [selectedSpot] : filteredSpots} />
      </main>
    </div>
  );
}

