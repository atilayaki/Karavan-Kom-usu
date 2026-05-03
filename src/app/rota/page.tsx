'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import type { User } from '@supabase/supabase-js';
import { IconMap, IconCamp } from '@/components/Icons';
import styles from './rota.module.css';

const RoutePlannerMap = dynamic(() => import('@/components/RoutePlannerMap'), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Harita yükleniyor...</div>,
});

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

interface Endpoint {
  name: string;
  lat: number;
  lon: number;
}

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h}sa ${m}dk`;
  return `${m}dk`;
};

const formatDistance = (meters: number) => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
};

function PlaceInput({
  label,
  placeholder,
  value,
  onChange,
  onSelect,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSelect: (e: Endpoint) => void;
}) {
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(value, 400);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!debounced || debounced.length < 3) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debounced)}&countrycodes=tr&limit=5`,
      { signal: controller.signal, headers: { 'Accept-Language': 'tr' } }
    )
      .then(r => r.json())
      .then((data: NominatimResult[]) => {
        setResults(data || []);
        setOpen(true);
      })
      .catch(err => { if (err.name !== 'AbortError') console.error(err); })
      .finally(() => setSearching(false));
    return () => controller.abort();
  }, [debounced]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className={styles.placeInput} ref={wrapperRef}>
      <label>{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && (results.length > 0 || searching) && (
        <div className={styles.suggestions + ' glass-card'}>
          {searching && <div className={styles.suggestionItem} style={{opacity: 0.5}}>Aranıyor...</div>}
          {results.map(r => (
            <button
              key={r.place_id}
              className={styles.suggestionItem}
              onClick={() => {
                onSelect({ name: r.display_name, lat: parseFloat(r.lat), lon: parseFloat(r.lon) });
                setOpen(false);
              }}
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RotaPage() {
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);

  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  const [from, setFrom] = useState<Endpoint | null>(null);
  const [to, setTo] = useState<Endpoint | null>(null);

  const [path, setPath] = useState<[number, number][]>([]);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [routing, setRouting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [routeMeta, setRouteMeta] = useState({ title: '', description: '' });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const findRoute = async () => {
    if (!from || !to) return showToast('Başlangıç ve bitiş noktalarını seçin.', 'warning');
    setRouting(true);
    setPath([]);

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.code !== 'Ok' || !data.routes?.[0]) {
        showToast('Rota bulunamadı.', 'error');
        setRouting(false);
        return;
      }

      const route = data.routes[0];
      const coords: [number, number][] = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
      setPath(coords);
      setDistance(route.distance);
      setDuration(route.duration);
      setRouteMeta(prev => ({
        ...prev,
        title: prev.title || `${from.name.split(',')[0]} → ${to.name.split(',')[0]}`,
      }));
    } catch (err: any) {
      showToast('Rota servisi şu anda yanıt vermiyor.', 'error');
    } finally {
      setRouting(false);
    }
  };

  const saveRoute = async () => {
    if (!user) return showToast('Kaydetmek için giriş yapın.', 'warning');
    if (!from || !to || path.length < 2) return showToast('Önce bir rota oluşturun.', 'warning');
    if (!routeMeta.title.trim()) return showToast('Rotaya bir başlık verin.', 'info');

    setSaving(true);
    const lineWkt = `LINESTRING(${path.map(p => `${p[1]} ${p[0]}`).join(', ')})`;

    const { error } = await supabase.from('routes').insert([{
      user_id: user.id,
      title: routeMeta.title,
      description: routeMeta.description,
      start_location_name: from.name.split(',')[0],
      end_location_name: to.name.split(',')[0],
      path: lineWkt,
    }]);

    if (error) {
      showToast('Hata: ' + error.message, 'error');
    } else {
      showToast('Rota kaydedildi! 🛣️', 'success');
      setRouteMeta({ title: '', description: '' });
    }
    setSaving(false);
  };

  const swap = () => {
    setFromText(toText);
    setToText(fromText);
    setFrom(to);
    setTo(from);
    setPath([]);
    setDistance(null);
    setDuration(null);
  };

  const openInGoogleMaps = () => {
    if (!from || !to) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lon}&destination=${to.lat},${to.lon}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <header className={styles.header}>
          <span className="font-accent" style={{ fontSize: '1.1rem', color: 'var(--sunset-orange)' }}>Rota Planlama</span>
          <h1>Nereye Gidiyoruz?</h1>
          <p>Başlangıç ve hedef noktanı seç, sürüş rotasını planla.</p>
        </header>

        <div className={styles.controls}>
          <PlaceInput
            label="Nereden"
            placeholder="Başlangıç şehri / adres"
            value={fromText}
            onChange={(v) => { setFromText(v); if (!v) setFrom(null); }}
            onSelect={(p) => { setFrom(p); setFromText(p.name); }}
          />

          <button className={styles.swapBtn} onClick={swap} aria-label="Yer değiştir">⇅</button>

          <PlaceInput
            label="Nereye"
            placeholder="Hedef şehir / adres"
            value={toText}
            onChange={(v) => { setToText(v); if (!v) setTo(null); }}
            onSelect={(p) => { setTo(p); setToText(p.name); }}
          />

          <button
            className="btn-primary"
            onClick={findRoute}
            disabled={!from || !to || routing}
            style={{ width: '100%', marginTop: 8 }}
          >
            {routing ? 'Rota hesaplanıyor...' : '🧭 Rotayı Bul'}
          </button>
        </div>

        {distance !== null && duration !== null && (
          <div className={styles.summary + ' glass-card'}>
            <div className={styles.summaryStat}>
              <span className={styles.statValue}>{formatDistance(distance)}</span>
              <span className={styles.statLabel}>Mesafe</span>
            </div>
            <div className={styles.summaryStat}>
              <span className={styles.statValue}>{formatDuration(duration)}</span>
              <span className={styles.statLabel}>Tahmini Süre</span>
            </div>
          </div>
        )}

        {path.length >= 2 && (
          <div className={styles.saveSection}>
            <h3>Rotayı Kaydet</h3>
            <input
              type="text"
              placeholder="Rota başlığı"
              value={routeMeta.title}
              onChange={(e) => setRouteMeta({ ...routeMeta, title: e.target.value })}
              className={styles.metaInput}
            />
            <textarea
              placeholder="Notlar, manzara, mola noktaları..."
              value={routeMeta.description}
              onChange={(e) => setRouteMeta({ ...routeMeta, description: e.target.value })}
              rows={3}
              className={styles.metaInput}
            />
            <div className={styles.saveActions}>
              <button className="btn-primary" onClick={saveRoute} disabled={saving} style={{ flex: 1 }}>
                {saving ? 'Kaydediliyor...' : '💾 Topluluğa Paylaş'}
              </button>
              <button className="btn-ghost" onClick={openInGoogleMaps}>
                🗺️ Google Maps
              </button>
            </div>
            {!user && (
              <small style={{ opacity: 0.6, marginTop: 8, display: 'block' }}>
                Kaydetmek için giriş yapmalısın.
              </small>
            )}
          </div>
        )}
      </aside>

      <main className={styles.mapArea}>
        <RoutePlannerMap
          start={from ? [from.lat, from.lon] : null}
          end={to ? [to.lat, to.lon] : null}
          path={path}
        />
      </main>
    </div>
  );
}
