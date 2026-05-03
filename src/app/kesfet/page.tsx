'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './kesfet.module.css';
import { useToast } from '@/components/Toast';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useDebounce } from '@/hooks/useDebounce';
import type { Spot, GeographicNote, Route, WeatherCurrent } from '@/lib/database.types';
import type { User } from '@supabase/supabase-js';
import {
  IconMap,
  IconCamp,
  IconTool,
  IconUser,
  IconBell,
  IconSun,
  IconCloud,
  IconRain,
  IconWind
} from '@/components/Icons';

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
  const { showToast } = useToast();
  const scrollRef = useScrollReveal();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [notes, setNotes] = useState<GeographicNote[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filteredSpots, setFilteredSpots] = useState<Spot[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [activeFilter, setActiveFilter] = useState('Hepsi');
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [weather, setWeather] = useState<WeatherCurrent | null>(null);
  
  // Location state
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  
  // Modal state for Note
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  
  // Modal & Draw state for Route
  const [drawMode, setDrawMode] = useState(false);
  const [draftRoute, setDraftRoute] = useState<{start: [number, number] | null, end: [number, number] | null}>({ start: null, end: null });
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [newRoute, setNewRoute] = useState({ title: '', desc: '', startName: '', endName: '' });
  
  const [user, setUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookmarkedSpots, setBookmarkedSpots] = useState<Set<number>>(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase.from('bookmarks').select('item_id').eq('user_id', user.id).eq('item_type', 'spot').then(({ data }) => {
          if (data) setBookmarkedSpots(new Set(data.map(b => b.item_id)));
        });
      }
    });
    fetchAllData();
  }, []);

  const toggleSpotBookmark = async () => {
    if (!user || !selectedSpot) return showToast("Favoriye eklemek için giriş yapmalısınız.", "info");

    const isBookmarked = bookmarkedSpots.has(selectedSpot.id);
    const next = new Set(bookmarkedSpots);

    if (isBookmarked) {
      next.delete(selectedSpot.id);
      setBookmarkedSpots(next);
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('item_type', 'spot').eq('item_id', selectedSpot.id);
      showToast("Favorilerden kaldırıldı.", "info");
    } else {
      next.add(selectedSpot.id);
      setBookmarkedSpots(next);
      await supabase.from('bookmarks').insert([{ user_id: user.id, item_type: 'spot', item_id: selectedSpot.id }]);
      showToast("Favorilere eklendi!", "success");
    }
  };

  const openDirections = () => {
    if (!selectedSpot) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedSpot.lat},${selectedSpot.lng}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const spotNotes = selectedSpot
    ? notes.filter(n => n.location_name === selectedSpot.title)
    : [];

  const fetchAllData = async () => {
    try {
      const [spotsRes, notesRes, routesRes] = await Promise.all([
        supabase.from('vw_spots').select('*'),
        supabase.from('vw_geographic_notes').select('*, profiles(full_name)'),
        supabase.from('vw_routes').select('*')
      ]);

      if (spotsRes.data) {
        setSpots(spotsRes.data);
        setFilteredSpots(spotsRes.data);
      }
      if (notesRes.data) setNotes(notesRes.data);
      if (routesRes.data) setRoutes(routesRes.data);
    } catch (err) {
      console.error("Data fetch error:", err);
      showToast("Veriler yüklenirken bir hata oluştu.", "error");
    }
  };


  // Calculate distance between two coordinates in km using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
  };

  useEffect(() => {
    let result = [...spots];
    if (activeFilter !== 'Hepsi' && activeFilter !== 'Yakınımda') {
      result = result.filter(s => s.category === activeFilter);
    }
    
    if (debouncedSearch.trim() !== '') {
      result = result.filter(s =>
        s.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (s.address && s.address.toLowerCase().includes(debouncedSearch.toLowerCase()))
      );
    }

    if (activeFilter === 'Yakınımda' && userLocation) {
      result = result.sort((spotA, spotB) => {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, spotA.lat ?? 0, spotA.lng ?? 0);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, spotB.lat ?? 0, spotB.lng ?? 0);
        return distA - distB;
      });
    }

    setFilteredSpots(result);
  }, [debouncedSearch, activeFilter, spots, userLocation]);

  useEffect(() => {
    if (!selectedSpot) return;
    const controller = new AbortController();
    setWeather(null);
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${selectedSpot.lat}&longitude=${selectedSpot.lng}&current_weather=true`,
      { signal: controller.signal }
    )
      .then(res => res.json())
      .then(data => { if (data.current_weather) setWeather(data.current_weather); })
      .catch(err => { if (err.name !== 'AbortError') console.error("Weather fetch error:", err); });
    return () => controller.abort();
  }, [selectedSpot]);

  const getWeatherIcon = (code: number) => {
    if (code <= 3) return <IconSun size={20} color="#FFD700" />;
    if (code <= 50) return <IconCloud size={20} color="#A0A0A0" />;
    if (code <= 80) return <IconRain size={20} color="#4A90E2" />;
    return <IconWind size={20} color="#8E8E8E" />;
  };

  const handleNearMe = () => {
    if (activeFilter === 'Yakınımda') {
      setActiveFilter('Hepsi');
      return;
    }
    
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setActiveFilter('Yakınımda');
          setIsLocating(false);
          showToast("Konumunuz tespit edildi.", "success");
        },
        (error) => {
          showToast("Konum alınamadı. Lütfen izinleri kontrol edin.", "error");
          setIsLocating(false);
        }
      );
    } else {
      showToast("Tarayıcınız konumu desteklemiyor.", "error");
      setIsLocating(false);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (!drawMode) return;
    
    if (!draftRoute.start) {
      setDraftRoute({ start: [lat, lng], end: null });
      showToast("Başlangıç noktası seçildi, bitişi seçin.", "info");
    } else if (!draftRoute.end) {
      setDraftRoute({ start: draftRoute.start, end: [lat, lng] });
      setIsRouteModalOpen(true);
      setDrawMode(false);
    }
  };

  const handleShareRoute = async () => {
    if (!user) return showToast('Lütfen önce giriş yapın.', 'warning');
    if (!draftRoute.start || !draftRoute.end) return;
    
    setIsSubmitting(true);
    
    // PostGIS LineString expects LONGITUDE LATITUDE
    const lineWkt = `LINESTRING(${draftRoute.start[1]} ${draftRoute.start[0]}, ${draftRoute.end[1]} ${draftRoute.end[0]})`;
    
    const { error } = await supabase.from('routes').insert([
      {
        user_id: user.id,
        title: newRoute.title,
        description: newRoute.desc,
        start_location_name: newRoute.startName,
        end_location_name: newRoute.endName,
        path: lineWkt
      }
    ]);

    if (!error) {
      showToast("Rotanız başarıyla kaydedildi!", "success");
      setNewRoute({ title: '', desc: '', startName: '', endName: '' });
      setDraftRoute({ start: null, end: null });
      setIsRouteModalOpen(false);
      fetchAllData();
    } else {
      showToast("Hata: " + error.message, "error");
    }
    setIsSubmitting(false);
  };

  return (
    <div className={styles.container} ref={scrollRef}>
      <aside className={styles.sidebar}>
        
        {/* If a spot is selected, show detail view, else show list */}
        {selectedSpot ? (
          <div className={styles.detailView + " reveal-left visible"}>
            <button className={styles.backBtn} onClick={() => setSelectedSpot(null)}>
              ← Geri Dön
            </button>
            <div className={styles.detailImage} style={{ 
              backgroundImage: selectedSpot.image_url ? `url("${selectedSpot.image_url}")` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: selectedSpot.category === 'Sakin Köşe' ? 'var(--forest-green)' : 'var(--sunset-orange)'
            }}>
              {!selectedSpot.image_url && (selectedSpot.category === 'Sakin Köşe' ? <IconCamp size={48} color="white" /> : <IconTool size={48} color="white" />)}
            </div>
            <div className={styles.detailContent}>
              <span className={styles.detailCategory}>{selectedSpot.category}</span>
              <h2>{selectedSpot.title}</h2>
              <p className={styles.detailAddress}>📍 {selectedSpot.address || 'Konum belirtilmedi'}</p>
              
              <div className={styles.detailSection}>
                <h3>Hakkında</h3>
                <p>{selectedSpot.description || 'Bu mekan için henüz detaylı bir açıklama eklenmemiş.'}</p>
              </div>

              <div className={styles.detailSection}>
                <div className={styles.weatherWidget}>
                  <div className={styles.weatherHeader}>
                    <span>Anlık Hava Durumu</span>
                    {weather ? getWeatherIcon(weather.weathercode) : <div className={styles.skeleton} />}
                  </div>
                  {weather ? (
                    <div className={styles.weatherBody}>
                      <div className={styles.weatherStat}>
                        <span className={styles.statVal}>{Math.round(weather.temperature)}°C</span>
                        <span className={styles.statLabel}>Sıcaklık</span>
                      </div>
                      <div className={styles.weatherStat}>
                        <span className={styles.statVal}>{weather.windspeed} km/h</span>
                        <span className={styles.statLabel}>Rüzgar</span>
                      </div>
                    </div>
                  ) : (
                    <p style={{fontSize: '0.8rem', opacity: 0.5}}>Yükleniyor...</p>
                  )}
                </div>
              </div>

              {selectedSpot.attributes && (
                <div className={styles.attributesGrid}>
                  {selectedSpot.attributes.water && <div className={styles.attrItem}>💧 Su Var</div>}
                  {selectedSpot.attributes.electricity && <div className={styles.attrItem}>⚡ Elektrik Var</div>}
                  {selectedSpot.attributes.wc && <div className={styles.attrItem}>🚽 WC Var</div>}
                  {selectedSpot.attributes.pet_friendly && <div className={styles.attrItem}>🐾 Evcil Hayvan</div>}
                </div>
              )}

              {spotNotes.length > 0 && (
                <div className={styles.detailSection}>
                  <h3>Komşu Notları ({spotNotes.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {spotNotes.slice(0, 5).map(n => (
                      <div key={n.id} style={{ padding: 12, background: 'rgba(0,0,0,0.03)', borderRadius: 12, fontSize: '0.9rem' }}>
                        <div style={{ fontStyle: 'italic', marginBottom: 6 }}>"{n.note}"</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                          — {n.profile_full_name || n.profiles?.full_name || 'Gizli Karavancı'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.detailActions}>
                <button className="btn-primary" style={{width: '100%'}} onClick={openDirections}>
                  🧭 Yol Tarifi Al
                </button>
                <button
                  className="btn-secondary"
                  style={{width: '100%', marginTop: '12px'}}
                  onClick={() => user ? setIsNoteModalOpen(true) : showToast("Not bırakmak için giriş yapmalısınız!", "warning")}
                >
                  Askıda Not Bırak
                </button>
                <button
                  className="btn-ghost"
                  style={{width: '100%', marginTop: '12px', color: bookmarkedSpots.has(selectedSpot.id) ? 'var(--sunset-orange)' : undefined}}
                  onClick={toggleSpotBookmark}
                >
                  {bookmarkedSpots.has(selectedSpot.id) ? '★ Favorilerde' : '☆ Favorilere Ekle'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.searchBox + " reveal-left"}>
              <input 
                type="text" 
                placeholder="Usta, mekan veya şehir ara..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className={styles.filters + " reveal-left"}>
              {['Hepsi', 'Sakin Köşe', 'Yol Yardımcısı'].map(f => (
                <button 
                  key={f}
                  className={activeFilter === f ? styles.activeFilter : ''}
                  onClick={() => setActiveFilter(f)}
                >
                  {f}
                </button>
              ))}
              <button 
                className={`${activeFilter === 'Yakınımda' ? styles.activeFilter : ''} ${styles.nearMeBtn}`}
                onClick={handleNearMe}
                disabled={isLocating}
              >
                {isLocating ? '📍 Bulunuyor...' : '📍 Yakınımda'}
              </button>
            </div>

            <div className={styles.resultsList + " stagger-children"}>
              {filteredSpots.length === 0 ? (
                <p style={{textAlign: 'center', opacity: 0.5, marginTop: '20px'}}>Sonuç bulunamadı.</p>
              ) : (
                filteredSpots.map((spot) => {
                  const distance = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, spot.lat, spot.lng).toFixed(1) : null;
                  
                  return (
                  <div 
                    key={spot.id} 
                    className={styles.resultCard + " glass-card"}
                    onClick={() => setSelectedSpot(spot)}
                  >
                    <div className={styles.cardImage} style={{ 
                      backgroundImage: spot.image_url ? `url("${spot.image_url}")` : 'none',
                      backgroundColor: spot.image_url ? 'transparent' : (spot.category === 'Sakin Köşe' ? 'rgba(45, 90, 39, 0.1)' : 'rgba(255, 140, 66, 0.1)'),
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex', 
                      alignSelf: 'center',
                      justifyContent: 'center', 
                      color: spot.category === 'Sakin Köşe' ? 'var(--forest-green)' : 'var(--sunset-orange)' 
                    }}>
                      {!spot.image_url && (spot.category === 'Sakin Köşe' ? <IconCamp size={24} /> : <IconTool size={24} />)}
                    </div>
                    <div className={styles.cardInfo}>
                      <h4>{spot.title}</h4>
                      <p>{spot.category}</p>
                      <div className={styles.cardFooter}>
                        <span>{spot.address || 'Konum belirtilmedi'}</span>
                        {distance && <span className={styles.distanceBadge}>{distance} km</span>}
                      </div>
                      {spot.attributes && (
                        <div className={styles.cardAttributes}>
                          {spot.attributes.water && <span>💧</span>}
                          {spot.attributes.electricity && <span>⚡</span>}
                          {spot.attributes.wc && <span>🚽</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )})
              )}
            </div>
          </>
        )}
      </aside>

      <main className={styles.mapArea}>
        <MapWithNoSSR 
          spots={selectedSpot ? [selectedSpot] : filteredSpots} 
          notes={notes} 
          routes={routes} 
          onMapClick={handleMapClick}
          draftRoute={draftRoute}
        />
        
        <div className={styles.mapActions}>
          <button 
            className={`btn-primary ${drawMode ? styles.activeDraw : ''}`}
            onClick={() => {
              setDrawMode(!drawMode);
              if (!drawMode) showToast("Haritaya tıklayarak rota çizebilirsin.", "info");
            }}
          >
            <IconMap size={18} /> {drawMode ? 'Çizmeyi Bırak' : 'Rota Çiz'}
          </button>
        </div>
      </main>

      {/* Note Modal */}
      {isNoteModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent + " glass-card reveal-scale visible"}>
            <h3>📌 {selectedSpot?.title} İçin Not Bırak</h3>
            <p style={{fontSize: '0.9rem', marginBottom: '15px', opacity: 0.8}}>Buraya uğrayacak diğer komşuların için bir ipucu, uyarı veya güzel bir mesaj bırak.</p>
            
            <textarea 
              placeholder="Örn: 'Su musluğu bozuk ama manzara harika!', 'Gece biraz rüzgarlı olabiliyor...'" 
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
              className={styles.noteInput}
            />

            <div className={styles.modalActions}>
              <button onClick={() => setIsNoteModalOpen(false)} className="btn-ghost">İptal</button>
              <button 
                className="btn-primary" 
                disabled={isSubmitting || !newNote.trim()}
                onClick={async () => {
                  if (!user || !selectedSpot) return;
                  setIsSubmitting(true);
                  const pointWkt = `POINT(${selectedSpot.lng} ${selectedSpot.lat})`;
                  const { error } = await supabase.from('geographic_notes').insert([
                    {
                      user_id: user.id,
                      note: newNote,
                      location_name: selectedSpot.title,
                      location: pointWkt,
                    }
                  ]);
                  if (error) {
                    showToast("Hata: " + error.message, "error");
                  } else {
                    showToast("Notunuz başarıyla askıya bırakıldı!", "success");
                    setIsNoteModalOpen(false);
                    setNewNote('');
                    fetchAllData();
                  }
                  setIsSubmitting(false);
                }}
              >
                {isSubmitting ? 'Kaydediliyor...' : 'Notu Askıya Bırak'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Route Modal */}
      {isRouteModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent + " glass-card reveal-scale visible"}>
            <h3>🗺️ Rotanı Kaydet</h3>
            <p style={{fontSize: '0.9rem', marginBottom: '15px', opacity: 0.8}}>Haritaya çizdiğin izi diğer karavancılarla paylaş.</p>
            
            <input 
              type="text" 
              placeholder="Rota Başlığı (Örn: Ege Kıyıları)" 
              value={newRoute.title}
              onChange={(e) => setNewRoute({...newRoute, title: e.target.value})}
              style={{width: '100%', marginBottom: '12px'}}
            />
            <div style={{display: 'flex', gap: '10px', marginBottom: '12px'}}>
              <input 
                type="text" 
                placeholder="Nereden?" 
                value={newRoute.startName}
                onChange={(e) => setNewRoute({...newRoute, startName: e.target.value})}
                style={{flex: 1}}
              />
              <input 
                type="text" 
                placeholder="Nereye?" 
                value={newRoute.endName}
                onChange={(e) => setNewRoute({...newRoute, endName: e.target.value})}
                style={{flex: 1}}
              />
            </div>
            <textarea 
              placeholder="Rotanın detayları, yol durumu, manzara..." 
              value={newRoute.desc}
              onChange={(e) => setNewRoute({...newRoute, desc: e.target.value})}
              rows={3}
              style={{width: '100%', marginBottom: '12px'}}
            />

            <div className={styles.modalActions}>
              <button 
                onClick={() => {
                  setIsRouteModalOpen(false);
                  setDraftRoute({ start: null, end: null });
                }} 
                className="btn-ghost"
              >İptal</button>
              <button 
                className="btn-primary" 
                disabled={isSubmitting || !newRoute.title.trim()}
                onClick={handleShareRoute}
              >
                {isSubmitting ? 'Kaydediliyor...' : 'İz Bırak'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

