'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './kesfet.module.css';
import { useToast } from '@/components/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import SpotReview from '@/components/SpotReview';
import type { Spot, GeographicNote, Route, WeatherCurrent } from '@/lib/database.types';
import type { User } from '@supabase/supabase-js';
import {
  IconMap,
  IconCamp,
  IconTool,
  IconSun,
  IconCloud,
  IconRain,
  IconWind
} from '@/components/Icons';

const MapWithNoSSR = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className={styles.mapOverlay}>
      <p>Harita Yükleniyor...</p>
    </div>
  )
});

interface SpotRating { avg: number; count: number; }

const EMPTY_NEW_SPOT = {
  title: '', category: 'Sakin Köşe', address: '', description: '',
  lat: '', lng: '',
  water: false, electricity: false, wc: false, pet_friendly: false,
};

export default function KesfetPage() {
  const { showToast } = useToast();

  const [spots, setSpots] = useState<Spot[]>([]);
  const [notes, setNotes] = useState<GeographicNote[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filteredSpots, setFilteredSpots] = useState<Spot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mobile View Switcher: 'map' or 'list'
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [activeCategory, setActiveCategory] = useState('Hepsi');
  
  // Amenity filters
  const [filterWater, setFilterWater] = useState(false);
  const [filterElectricity, setFilterElectricity] = useState(false);
  const [filterWc, setFilterWc] = useState(false);
  const [filterPet, setFilterPet] = useState(false);

  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [weather, setWeather] = useState<WeatherCurrent | null>(null);
  const [spotRatings, setSpotRatings] = useState<Record<number, SpotRating>>({});

  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');

  const [drawMode, setDrawMode] = useState(false);
  const [draftRoute, setDraftRoute] = useState<{start: [number, number] | null, end: [number, number] | null}>({ start: null, end: null });
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [newRoute, setNewRoute] = useState({ title: '', desc: '', startName: '', endName: '' });

  const [isAddSpotOpen, setIsAddSpotOpen] = useState(false);
  const [isPickingSpotLocation, setIsPickingSpotLocation] = useState(false);
  const [newSpot, setNewSpot] = useState(EMPTY_NEW_SPOT);

  const [user, setUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookmarkedSpots, setBookmarkedSpots] = useState<Set<number>>(new Set());
  const [checkedInSpots, setCheckedInSpots] = useState<Set<number>>(new Set());
  const [checkinCounts, setCheckinCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        Promise.all([
          supabase.from('bookmarks').select('item_id').eq('user_id', u.id).eq('item_type', 'spot'),
          supabase.from('spot_checkins').select('spot_id').eq('user_id', u.id),
        ]).then(([bookRes, checkinRes]) => {
          if (bookRes.data) setBookmarkedSpots(new Set(bookRes.data.map(b => b.item_id)));
          if (checkinRes.data) setCheckedInSpots(new Set(checkinRes.data.map(c => c.spot_id)));
        });
      }
    });
    fetchAllData();
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [spotsRes, notesRes, routesRes] = await Promise.all([
        supabase.from('vw_spots').select('*'),
        supabase.from('vw_geographic_notes').select('*, profiles(full_name)'),
        supabase.from('vw_routes').select('*'),
      ]);

      if (spotsRes.data) {
        setSpots(spotsRes.data);
        setFilteredSpots(spotsRes.data);

        const ids = spotsRes.data.map(s => s.id);
        if (ids.length > 0) {
          const { data: ratingRows } = await supabase
            .from('spot_reviews')
            .select('spot_id, rating')
            .in('spot_id', ids);
          if (ratingRows) {
            const map: Record<number, { sum: number; count: number }> = {};
            ratingRows.forEach(r => {
              if (!map[r.spot_id]) map[r.spot_id] = { sum: 0, count: 0 };
              map[r.spot_id].sum += r.rating;
              map[r.spot_id].count += 1;
            });
            const result: Record<number, SpotRating> = {};
            Object.entries(map).forEach(([id, v]) => {
              result[Number(id)] = { avg: v.sum / v.count, count: v.count };
            });
            setSpotRatings(result);
          }
        }
      }
      if (notesRes.data) setNotes(notesRes.data);
      if (routesRes.data) setRoutes(routesRes.data);
    } catch {
      showToast("Veriler yüklenirken bir hata oluştu.", "error");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    let result = [...spots];
    if (activeCategory !== 'Hepsi' && activeCategory !== 'Yakınımda') {
      result = result.filter(s => s.category === activeCategory);
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(s =>
        s.title.toLowerCase().includes(q) ||
        (s.address && s.address.toLowerCase().includes(q))
      );
    }
    // Amenity filters
    if (filterWater) {
      result = result.filter(s => s.attributes?.water);
    }
    if (filterElectricity) {
      result = result.filter(s => s.attributes?.electricity);
    }
    if (filterWc) {
      result = result.filter(s => s.attributes?.wc);
    }
    if (filterPet) {
      result = result.filter(s => s.attributes?.pet_friendly);
    }

    if (activeCategory === 'Yakınımda' && userLocation) {
      result = result.sort((a, b) =>
        calculateDistance(userLocation.lat, userLocation.lng, a.lat ?? 0, a.lng ?? 0) -
        calculateDistance(userLocation.lat, userLocation.lng, b.lat ?? 0, b.lng ?? 0)
      );
    }
    setFilteredSpots(result);
  }, [debouncedSearch, activeCategory, filterWater, filterElectricity, filterWc, filterPet, spots, userLocation]);

  useEffect(() => {
    if (!selectedSpot) return;
    supabase
      .from('spot_checkins')
      .select('*', { count: 'exact', head: true })
      .eq('spot_id', selectedSpot.id)
      .then(({ count }) => setCheckinCounts(c => ({ ...c, [selectedSpot.id]: count || 0 })));
  }, [selectedSpot]);

  useEffect(() => {
    if (!selectedSpot) return;
    const controller = new AbortController();
    setWeather(null);
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${selectedSpot.lat}&longitude=${selectedSpot.lng}&current=temperature_2m,apparent_temperature,precipitation_probability,weathercode,windspeed_10m`,
      { signal: controller.signal }
    )
      .then(r => r.json())
      .then(data => {
        if (data.current) {
          setWeather({
            temperature: data.current.temperature_2m,
            apparent_temperature: data.current.apparent_temperature,
            precipitation_probability: data.current.precipitation_probability,
            windspeed: data.current.windspeed_10m,
            weathercode: data.current.weathercode,
          });
        }
      })
      .catch(err => { if (err.name !== 'AbortError') console.error(err); });
    return () => controller.abort();
  }, [selectedSpot]);

  const getWeatherIcon = (code: number) => {
    if (code <= 3) return <IconSun size={20} color="#FFD700" />;
    if (code <= 48) return <IconCloud size={20} color="#A0A0A0" />;
    if (code <= 67 || (code >= 80 && code <= 82)) return <IconRain size={20} color="#4A90E2" />;
    if (code >= 71 && code <= 77) return <IconCloud size={20} color="#B0C4DE" />;
    return <IconWind size={20} color="#8E8E8E" />;
  };

  const getWeatherLabel = (code: number) => {
    if (code <= 3) return 'Açık';
    if (code <= 48) return 'Bulutlu';
    if (code <= 67 || (code >= 80 && code <= 82)) return 'Yağmurlu';
    if (code >= 71 && code <= 77) return 'Karlı';
    return 'Fırtınalı';
  };

  const spotNotes = selectedSpot
    ? notes.filter(n => {
        if (n.location_name === selectedSpot.title) return true;
        if (typeof n.lat === 'number' && typeof n.lng === 'number') {
          return calculateDistance(selectedSpot.lat, selectedSpot.lng, n.lat, n.lng) <= 1;
        }
        return false;
      })
    : [];

  const handleNearMe = () => {
    if (activeCategory === 'Yakınımda') { setActiveCategory('Hepsi'); return; }
    setIsLocating(true);
    if (!('geolocation' in navigator)) {
      showToast("Tarayıcınız konumu desteklemiyor.", "error");
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setActiveCategory('Yakınımda');
        setIsLocating(false);
        showToast("Konumunuz tespit edildi.", "success");
      },
      () => {
        showToast("Konum alınamadı. Lütfen izinleri kontrol edin.", "error");
        setIsLocating(false);
      }
    );
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (isPickingSpotLocation) {
      setNewSpot(prev => ({ ...prev, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
      setIsPickingSpotLocation(false);
      setIsAddSpotOpen(true);
      showToast(`Konum seçildi: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, "success");
      return;
    }

    if (!drawMode) return;
    if (!draftRoute.start) {
      setDraftRoute({ start: [lat, lng], end: null });
      showToast("Başlangıç noktası seçildi. Şimdi varış noktasına tıkla.", "info");
    } else if (!draftRoute.end) {
      setDraftRoute(prev => ({ ...prev, end: [lat, lng] }));
      showToast("Bitiş noktası seçildi! Rotanı kaydedebilirsin.", "success");
      setIsRouteModalOpen(true);
    }
  };

  const toggleSpotBookmark = async () => {
    if (!user || !selectedSpot) {
      showToast('Favoriye eklemek için giriş yapmalısınız.', 'info');
      return;
    }
    const isBookmarked = bookmarkedSpots.has(selectedSpot.id);
    const next = new Set(bookmarkedSpots);
    if (isBookmarked) {
      next.delete(selectedSpot.id);
      setBookmarkedSpots(next);
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('item_type', 'spot').eq('item_id', selectedSpot.id);
      showToast('Favorilerden kaldırıldı.', 'info');
    } else {
      next.add(selectedSpot.id);
      setBookmarkedSpots(next);
      await supabase.from('bookmarks').insert({ user_id: user.id, item_type: 'spot', item_id: selectedSpot.id });
      showToast('Favorilere eklendi! ★', 'success');
    }
  };

  const toggleCheckin = async () => {
    if (!user || !selectedSpot) {
      showToast('Check-in yapmak için giriş yapmalısınız.', 'info');
      return;
    }
    const isChecked = checkedInSpots.has(selectedSpot.id);
    const next = new Set(checkedInSpots);
    if (isChecked) {
      next.delete(selectedSpot.id);
      setCheckedInSpots(next);
      setCheckinCounts(c => ({ ...c, [selectedSpot.id]: Math.max(0, (c[selectedSpot.id] || 1) - 1) }));
      await supabase.from('spot_checkins').delete().eq('user_id', user.id).eq('spot_id', selectedSpot.id);
      showToast('Check-in kaldırıldı.', 'info');
    } else {
      next.add(selectedSpot.id);
      setCheckedInSpots(next);
      setCheckinCounts(c => ({ ...c, [selectedSpot.id]: (c[selectedSpot.id] || 0) + 1 }));
      await supabase.from('spot_checkins').upsert({ user_id: user.id, spot_id: selectedSpot.id }, { onConflict: 'user_id,spot_id' });
      showToast('Check-in kaydedildi! 🏕️', 'success');
    }
  };

  const openDirections = (spot: Spot) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}&travelmode=driving`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={styles.container}>
      {/* ─── Top Floating Filter & Search Bar ─── */}
      <div className={styles.topFloatingBar}>
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Mekan veya şehir ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <button className={styles.clearSearchBtn} onClick={() => setSearch('')}>✕</button>}
          </div>

          <button
            className={styles.addSpotBtn}
            onClick={() => user ? setIsAddSpotOpen(true) : showToast('Spot eklemek için giriş yapın.', 'info')}
            title="Yeni Mekan Ekle"
          >
            + Mekan Ekle
          </button>
        </div>

        {/* Chips Bar */}
        <div className={styles.chipsScroll}>
          {['Hepsi', 'Sakin Köşe', 'Yol Yardımcısı'].map(f => (
            <button
              key={f}
              className={`${styles.chip} ${activeCategory === f ? styles.chipActive : ''}`}
              onClick={() => setActiveCategory(f)}
            >
              {f === 'Sakin Köşe' ? '🏕️ ' : f === 'Yol Yardımcısı' ? '🔧 ' : '✨ '}
              {f}
            </button>
          ))}

          <button
            className={`${styles.chip} ${activeCategory === 'Yakınımda' ? styles.chipActive : ''}`}
            onClick={handleNearMe}
            disabled={isLocating}
          >
            📍 {isLocating ? 'Bulunuyor...' : 'Yakınımda'}
          </button>

          {/* Amenity Toggles */}
          <button
            className={`${styles.chip} ${filterWater ? styles.chipAmenityActive : ''}`}
            onClick={() => setFilterWater(!filterWater)}
          >
            💧 Su
          </button>
          <button
            className={`${styles.chip} ${filterElectricity ? styles.chipAmenityActive : ''}`}
            onClick={() => setFilterElectricity(!filterElectricity)}
          >
            ⚡ Elektrik
          </button>
          <button
            className={`${styles.chip} ${filterWc ? styles.chipAmenityActive : ''}`}
            onClick={() => setFilterWc(!filterWc)}
          >
            🚽 WC
          </button>
          <button
            className={`${styles.chip} ${filterPet ? styles.chipAmenityActive : ''}`}
            onClick={() => setFilterPet(!filterPet)}
          >
            🐾 Evcil Hayvan
          </button>
        </div>
      </div>

      {/* ─── Mobile View Toggle Button (Floating) ─── */}
      <div className={styles.mobileViewToggle}>
        <button
          className={`${styles.toggleBtn} ${mobileView === 'map' ? styles.toggleBtnActive : ''}`}
          onClick={() => setMobileView('map')}
        >
          🗺️ Harita
        </button>
        <button
          className={`${styles.toggleBtn} ${mobileView === 'list' ? styles.toggleBtnActive : ''}`}
          onClick={() => setMobileView('list')}
        >
          📋 Liste ({filteredSpots.length})
        </button>
      </div>

      {/* ─── Sidebar (Desktop Always, Mobile only in list view) ─── */}
      <aside className={`${styles.sidebar} ${mobileView === 'map' ? styles.sidebarMobileHidden : ''}`}>
        {selectedSpot ? (
          <div className={styles.detailView}>
            <button className={styles.backBtn} onClick={() => setSelectedSpot(null)}>← Mekan Listesine Dön</button>
            <div className={styles.detailImage} style={{
              backgroundImage: selectedSpot.image_url ? `url("${selectedSpot.image_url}")` : 'none',
              backgroundSize: 'cover', backgroundPosition: 'center',
              backgroundColor: selectedSpot.category === 'Sakin Köşe' ? 'var(--forest-green)' : 'var(--sunset-orange)'
            }}>
              {!selectedSpot.image_url && (selectedSpot.category === 'Sakin Köşe' ? <IconCamp size={48} color="white" /> : <IconTool size={48} color="white" />)}
            </div>

            <div className={styles.detailContent}>
              <div className={styles.detailTitleRow}>
                <span className={styles.detailCategory}>{selectedSpot.category}</span>
                {spotRatings[selectedSpot.id] && (
                  <span className={styles.detailRatingBadge}>
                    ★ {spotRatings[selectedSpot.id].avg.toFixed(1)}
                    <span className={styles.ratingCount}>({spotRatings[selectedSpot.id].count})</span>
                  </span>
                )}
              </div>
              <h2>{selectedSpot.title}</h2>
              <p className={styles.detailAddress}>📍 {selectedSpot.address || 'Konum belirtilmedi'}</p>

              <div className={styles.detailSection}>
                <h3>Hakkında</h3>
                <p>{selectedSpot.description || 'Bu mekan için henüz detaylı bir açıklama eklenmemiş.'}</p>
              </div>

              {/* Weather widget */}
              <div className={styles.detailSection}>
                <div className={styles.weatherWidget}>
                  <div className={styles.weatherHeader}>
                    <span>Anlık Hava Durumu</span>
                    {weather ? getWeatherIcon(weather.weathercode) : <div className={styles.skeleton} />}
                  </div>
                  {weather ? (
                    <>
                      <div className={styles.weatherCondition}>{getWeatherLabel(weather.weathercode)}</div>
                      <div className={styles.weatherBody}>
                        <div className={styles.weatherStat}>
                          <span className={styles.statVal}>{Math.round(weather.temperature)}°C</span>
                          <span className={styles.statLabel}>Sıcaklık</span>
                        </div>
                        {weather.apparent_temperature !== undefined && (
                          <div className={styles.weatherStat}>
                            <span className={styles.statVal}>{Math.round(weather.apparent_temperature)}°C</span>
                            <span className={styles.statLabel}>Hissedilen</span>
                          </div>
                        )}
                        <div className={styles.weatherStat}>
                          <span className={styles.statVal}>{weather.windspeed} km/h</span>
                          <span className={styles.statLabel}>Rüzgar</span>
                        </div>
                        {weather.precipitation_probability !== undefined && (
                          <div className={styles.weatherStat}>
                            <span className={styles.statVal}>%{weather.precipitation_probability}</span>
                            <span className={styles.statLabel}>Yağış İht.</span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <p style={{fontSize: '0.8rem', opacity: 0.5, marginTop: 8}}>Yükleniyor...</p>
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
                      <div key={n.id} className={styles.noteCard}>
                        <div className={styles.noteText}>"{n.note}"</div>
                        <div className={styles.noteAuthor}>— {n.profile_full_name || n.profiles?.full_name || 'Gizli Karavancı'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.detailActions}>
                <button className="btn-primary" style={{width: '100%'}} onClick={() => openDirections(selectedSpot)}>
                  🧭 Yol Tarifi Al
                </button>
                <button
                  className="btn-secondary"
                  style={{
                    width: '100%',
                    background: checkedInSpots.has(selectedSpot.id) ? 'var(--forest-green)' : undefined,
                    color: checkedInSpots.has(selectedSpot.id) ? 'white' : undefined
                  }}
                  onClick={toggleCheckin}
                >
                  {checkedInSpots.has(selectedSpot.id)
                    ? `🏕️ Konaklandı (${checkinCounts[selectedSpot.id] ?? '…'})`
                    : `🏕️ Burada Konakla (${checkinCounts[selectedSpot.id] ?? '…'})`}
                </button>
                <button
                  className="btn-ghost"
                  style={{width: '100%'}}
                  onClick={() => user ? setIsNoteModalOpen(true) : showToast("Not bırakmak için giriş yapmalısınız!", "warning")}
                >
                  📌 Askıda Not Bırak
                </button>
                <button
                  className="btn-ghost"
                  style={{width: '100%', color: bookmarkedSpots.has(selectedSpot.id) ? 'var(--sunset-orange)' : undefined}}
                  onClick={toggleSpotBookmark}
                >
                  {bookmarkedSpots.has(selectedSpot.id) ? '★ Favorilerde' : '☆ Favorilere Ekle'}
                </button>
              </div>

              <div className={styles.detailSection}>
                <SpotReview spotId={selectedSpot.id} />
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.resultsList}>
            <div className={styles.resultsHeader}>
              <span>{filteredSpots.length} Mekan Listeleniyor</span>
            </div>

            {isLoading ? (
              <>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={styles.skeletonCard}>
                    <div className={styles.skeletonImg} />
                    <div className={styles.skeletonInfo}>
                      <div className={styles.skeletonLine} style={{width: '70%'}} />
                      <div className={styles.skeletonLine} style={{width: '45%', height: 10}} />
                      <div className={styles.skeletonLine} style={{width: '90%', height: 10}} />
                    </div>
                  </div>
                ))}
              </>
            ) : filteredSpots.length === 0 ? (
              <div className={styles.emptyResults}>
                <span>🏕️</span>
                <p>Aramanıza uygun mekan bulunamadı.</p>
                <small>Filtreleri sıfırlamayı veya haritayı kaydırmayı deneyin.</small>
              </div>
            ) : (
              filteredSpots.map((spot) => {
                const distance = userLocation
                  ? calculateDistance(userLocation.lat, userLocation.lng, spot.lat, spot.lng).toFixed(1)
                  : null;
                const rating = spotRatings[spot.id];
                return (
                  <div
                    key={spot.id}
                    className={styles.resultCard + " glass-card"}
                    onClick={() => {
                      setSelectedSpot(spot);
                      setMobileView('map');
                    }}
                  >
                    <div className={styles.cardImage} style={{
                      backgroundImage: spot.image_url ? `url("${spot.image_url}")` : 'none',
                      backgroundColor: spot.image_url ? 'transparent' : (spot.category === 'Sakin Köşe' ? 'rgba(45, 90, 39, 0.15)' : 'rgba(255, 140, 66, 0.15)'),
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      display: 'flex', alignSelf: 'center', justifyContent: 'center',
                      color: spot.category === 'Sakin Köşe' ? 'var(--forest-green)' : 'var(--sunset-orange)'
                    }}>
                      {!spot.image_url && (spot.category === 'Sakin Köşe' ? <IconCamp size={24} /> : <IconTool size={24} />)}
                    </div>
                    <div className={styles.cardInfo}>
                      <h4>{spot.title}</h4>
                      <p>{spot.category}</p>
                      <div className={styles.cardFooter}>
                        <span>{spot.address || 'Konum belirtilmedi'}</span>
                        <div className={styles.cardBadges}>
                          {rating && (
                            <span className={styles.ratingBadge}>★ {rating.avg.toFixed(1)}</span>
                          )}
                          {distance && <span className={styles.distanceBadge}>{distance} km</span>}
                        </div>
                      </div>
                      {spot.attributes && (
                        <div className={styles.cardAttributes}>
                          {spot.attributes.water && <span>💧</span>}
                          {spot.attributes.electricity && <span>⚡</span>}
                          {spot.attributes.wc && <span>🚽</span>}
                          {spot.attributes.pet_friendly && <span>🐾</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </aside>

      {/* ─── Map Area ─── */}
      <main className={`${styles.mapArea} ${mobileView === 'list' ? styles.mapAreaMobileHidden : ''}`}>
        {isPickingSpotLocation && (
          <div className={styles.pickingOverlay}>
            📍 Haritaya tıklayarak mekanın tam konumunu seçin
          </div>
        )}
        <MapWithNoSSR
          spots={selectedSpot ? [selectedSpot] : filteredSpots}
          notes={notes}
          routes={routes}
          onMapClick={handleMapClick}
          draftRoute={draftRoute}
          userLocation={userLocation}
          selectedSpot={selectedSpot}
        />

        {/* Floating Quick Card for Selected Spot on Map (Desktop & Mobile) */}
        {selectedSpot && (
          <div className={styles.floatingSpotCard}>
            <div className={styles.floatingCardLeft}>
              <div
                className={styles.floatingCardImg}
                style={{
                  backgroundImage: selectedSpot.image_url ? `url("${selectedSpot.image_url}")` : 'none',
                  backgroundColor: selectedSpot.category === 'Sakin Köşe' ? 'var(--forest-green)' : 'var(--sunset-orange)'
                }}
              >
                {!selectedSpot.image_url && (selectedSpot.category === 'Sakin Köşe' ? '🏕️' : '🔧')}
              </div>
              <div className={styles.floatingCardMeta}>
                <h4>{selectedSpot.title}</h4>
                <p>{selectedSpot.category} • {selectedSpot.address || 'Konum'}</p>
                {selectedSpot.attributes && (
                  <div className={styles.floatingAmenities}>
                    {selectedSpot.attributes.water && <span>💧 Su</span>}
                    {selectedSpot.attributes.electricity && <span>⚡ Elektrik</span>}
                    {selectedSpot.attributes.wc && <span>🚽 WC</span>}
                    {selectedSpot.attributes.pet_friendly && <span>🐾 Pet</span>}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.floatingCardActions}>
              <button
                className="btn-primary"
                onClick={() => openDirections(selectedSpot)}
              >
                🧭 Yol Tarifi
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setMobileView('list');
                }}
              >
                Detaylar
              </button>
              <button
                className={styles.floatingCardClose}
                onClick={() => setSelectedSpot(null)}
              >
                ✕
              </button>
            </div>
          </div>
        )}

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
          <div className={styles.modalContent + " glass-card"}>
            <h3>📌 {selectedSpot?.title} İçin Not Bırak</h3>
            <p style={{fontSize: '0.9rem', marginBottom: '15px', opacity: 0.8}}>
              Buraya uğrayacak diğer komşuların için bir ipucu, uyarı veya güzel bir mesaj bırak.
            </p>
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
                  const { error } = await supabase.from('geographic_notes').insert([{
                    user_id: user.id, note: newNote,
                    location_name: selectedSpot.title, location: pointWkt,
                  }]);
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
                {isSubmitting ? 'Kaydediliyor...' : 'Askıya Bırak'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Spot Modal */}
      {isAddSpotOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent + " glass-card"}>
            <h3>📍 Yeni Mekan Ekle</h3>
            <p style={{fontSize: '0.85rem', marginBottom: '15px', opacity: 0.8}}>
              Bildiğin bir sakin köşeyi veya güvendiğin bir yol yardımcısını komşularınla paylaş.
            </p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!user) return;
              if (!newSpot.title || !newSpot.lat || !newSpot.lng) {
                showToast("Lütfen isim ve konum bilgilerini doldurun.", "info");
                return;
              }
              setIsSubmitting(true);
              const pointWkt = `POINT(${newSpot.lng} ${newSpot.lat})`;
              const { error } = await supabase.from('spots').insert([{
                created_by: user.id,
                title: newSpot.title,
                category: newSpot.category,
                address: newSpot.address || null,
                description: newSpot.description || null,
                location: pointWkt,
                attributes: {
                  water: newSpot.water,
                  electricity: newSpot.electricity,
                  wc: newSpot.wc,
                  pet_friendly: newSpot.pet_friendly,
                }
              }]);
              if (error) {
                showToast("Hata: " + error.message, "error");
              } else {
                showToast("Yeni mekan eklendi! Teşekkürler komşu.", "success");
                setIsAddSpotOpen(false);
                setNewSpot(EMPTY_NEW_SPOT);
                fetchAllData();
              }
              setIsSubmitting(false);
            }}>
              <div className={styles.formGroup}>
                <label>Mekan Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Akbük Koyu Sakin Kamp Alanı"
                  value={newSpot.title}
                  onChange={e => setNewSpot(p => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Kategori</label>
                <select
                  value={newSpot.category}
                  onChange={e => setNewSpot(p => ({ ...p, category: e.target.value }))}
                >
                  <option value="Sakin Köşe">Sakin Köşe (Kamp / Konaklama)</option>
                  <option value="Yol Yardımcısı">Yol Yardımcısı (Usta / Servis / Lastikçi)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Konum Koordinatları</label>
                <div style={{display: 'flex', gap: '8px'}}>
                  <input
                    type="text"
                    readOnly
                    placeholder="Enlem, Boylam"
                    value={newSpot.lat && newSpot.lng ? `${newSpot.lat}, ${newSpot.lng}` : ''}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setIsAddSpotOpen(false);
                      setIsPickingSpotLocation(true);
                      showToast("Haritada konuma tıklayın.", "info");
                    }}
                  >
                    Haritadan Seç
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Adres / Yol Tarifi Notu</label>
                <input
                  type="text"
                  placeholder="Örn: Muğla, Milas yolu üzeri sahil tarafı"
                  value={newSpot.address}
                  onChange={e => setNewSpot(p => ({ ...p, address: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Açıklama</label>
                <textarea
                  rows={3}
                  placeholder="Mekan hakkında bilinenler, zemin durumu, yol kalitesi vb."
                  value={newSpot.description}
                  onChange={e => setNewSpot(p => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Olanaklar</label>
                <div className={styles.checkboxGrid}>
                  <label><input type="checkbox" checked={newSpot.water} onChange={e => setNewSpot(p => ({...p, water: e.target.checked}))} /> 💧 Su</label>
                  <label><input type="checkbox" checked={newSpot.electricity} onChange={e => setNewSpot(p => ({...p, electricity: e.target.checked}))} /> ⚡ Elektrik</label>
                  <label><input type="checkbox" checked={newSpot.wc} onChange={e => setNewSpot(p => ({...p, wc: e.target.checked}))} /> 🚽 WC</label>
                  <label><input type="checkbox" checked={newSpot.pet_friendly} onChange={e => setNewSpot(p => ({...p, pet_friendly: e.target.checked}))} /> 🐾 Evcil Hayvan</label>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsAddSpotOpen(false)} className="btn-ghost">İptal</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Ekleniyor...' : 'Mekanı Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Route Modal */}
      {isRouteModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent + " glass-card"}>
            <h3>🛣️ Yeni Rota Kaydet</h3>
            <p style={{fontSize: '0.85rem', marginBottom: '15px', opacity: 0.8}}>
              Çizdiğin bu rotayı komşularınla paylaş.
            </p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!user || !draftRoute.start || !draftRoute.end) return;
              setIsSubmitting(true);
              const linestringWkt = `LINESTRING(${draftRoute.start[1]} ${draftRoute.start[0]}, ${draftRoute.end[1]} ${draftRoute.end[0]})`;
              const { error } = await supabase.from('routes').insert([{
                user_id: user.id,
                title: newRoute.title,
                description: newRoute.desc,
                start_name: newRoute.startName || 'Başlangıç',
                end_name: newRoute.endName || 'Varış',
                route_line: linestringWkt,
              }]);
              if (error) {
                showToast("Hata: " + error.message, "error");
              } else {
                showToast("Rotanız paylaşıldı!", "success");
                setIsRouteModalOpen(false);
                setDraftRoute({ start: null, end: null });
                setDrawMode(false);
                fetchAllData();
              }
              setIsSubmitting(false);
            }}>
              <div className={styles.formGroup}>
                <label>Rota Başlığı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ege Sahil Güzergahı"
                  value={newRoute.title}
                  onChange={e => setNewRoute(p => ({...p, title: e.target.value}))}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Açıklama</label>
                <textarea
                  rows={3}
                  placeholder="Yol durumu, manzaralar, dikkat edilecek virajlar..."
                  value={newRoute.desc}
                  onChange={e => setNewRoute(p => ({...p, desc: e.target.value}))}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsRouteModalOpen(false)} className="btn-ghost">İptal</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Kaydediliyor...' : 'Rotayı Paylaş'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
