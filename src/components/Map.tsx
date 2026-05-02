'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo } from 'react';

function MapEvents({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const ICON_BASE = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img';
const SHADOW = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const isValidLatLng = (lat: any, lng: any): lat is number =>
  typeof lat === 'number' && typeof lng === 'number' &&
  !isNaN(lat) && !isNaN(lng) &&
  lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

export default function Map({
  spots = [],
  notes = [],
  routes = [],
  onMapClick,
  draftRoute,
  userLocation,
}: {
  spots?: any[];
  notes?: any[];
  routes?: any[];
  onMapClick?: (lat: number, lng: number) => void;
  draftRoute?: { start: [number, number] | null; end: [number, number] | null };
  userLocation?: { lat: number; lng: number } | null;
}) {
  const icons = useMemo(() => ({
    green:  new L.Icon({ iconUrl: `${ICON_BASE}/marker-icon-2x-green.png`,  shadowUrl: SHADOW, iconSize: [25, 41], iconAnchor: [12, 41] }),
    red:    new L.Icon({ iconUrl: `${ICON_BASE}/marker-icon-2x-red.png`,    shadowUrl: SHADOW, iconSize: [25, 41], iconAnchor: [12, 41] }),
    blue:   new L.Icon({ iconUrl: `${ICON_BASE}/marker-icon-2x-blue.png`,   shadowUrl: SHADOW, iconSize: [25, 41], iconAnchor: [12, 41] }),
    orange: new L.Icon({ iconUrl: `${ICON_BASE}/marker-icon-2x-orange.png`, shadowUrl: SHADOW, iconSize: [25, 41], iconAnchor: [12, 41] }),
  }), []);

  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl:     SHADOW,
    });
  }, []);

  const isDarkMode = typeof document !== 'undefined' && document.body.classList.contains('dark-mode');

  const tileUrl = isDarkMode 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const validSpots = spots.filter(s => isValidLatLng(s?.lat, s?.lng));
  const validNotes = notes.filter(n => isValidLatLng(n?.lat, n?.lng));

  const center: [number, number] = userLocation && isValidLatLng(userLocation.lat, userLocation.lng)
    ? [userLocation.lat, userLocation.lng]
    : [38.9637, 35.2433];

  return (
    <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%', zIndex: 1 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={tileUrl}
      />
      <MapEvents onMapClick={onMapClick} />

      {userLocation && isValidLatLng(userLocation.lat, userLocation.lng) && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={icons.blue}>
          <Popup><strong>Sen Buradasın</strong></Popup>
        </Marker>
      )}

      {draftRoute?.start && (
        <Marker position={draftRoute.start} icon={icons.blue}>
          <Popup>Başlangıç Noktası (bitiş için haritaya dokun)</Popup>
        </Marker>
      )}
      {draftRoute?.end && (
        <Marker position={draftRoute.end} icon={icons.blue}>
          <Popup>Bitiş Noktası</Popup>
        </Marker>
      )}
      {draftRoute?.start && draftRoute?.end && (
        <Polyline positions={[draftRoute.start, draftRoute.end]} pathOptions={{ color: '#00C853', weight: 4, dashArray: '10, 10' }} />
      )}

      {validSpots.map((spot) => (
        <Marker
          key={`spot-${spot.id}`}
          position={[spot.lat, spot.lng]}
          icon={spot.category === 'Sakin Köşe' ? icons.green : icons.red}
        >
          <Popup>
            <div style={{ minWidth: '180px' }}>
              <strong style={{fontSize: '1rem'}}>{spot.title}</strong><br />
              <span style={{ fontWeight: 700, color: spot.category === 'Sakin Köşe' ? '#2d5a27' : '#ff8c42' }}>{spot.category}</span>
              
              {spot.attributes && (
                <div style={{ display: 'flex', gap: '5px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {spot.attributes.water && <span title="Su Var" style={{opacity: 1}}>💧</span>}
                  {spot.attributes.electricity && <span title="Elektrik Var" style={{opacity: 1}}>⚡</span>}
                  {spot.attributes.wc && <span title="WC Var" style={{opacity: 1}}>🚽</span>}
                  {spot.attributes.pet_friendly && <span title="Evcil Hayvan Dostu" style={{opacity: 1}}>🐾</span>}
                </div>
              )}

              {spot.address && <div style={{ fontSize: '0.8rem', marginTop: '8px', opacity: 0.8, borderTop: '1px solid #eee', paddingTop: '5px' }}>📍 {spot.address}</div>}
            </div>
          </Popup>
        </Marker>
      ))}

      {validNotes.map((note) => (
        <Marker key={`note-${note.id}`} position={[note.lat, note.lng]} icon={icons.orange}>
          <Popup>
            <strong>📌 Askıda Not</strong><br />
            {note.note}<br />
            <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>
              Bırakan: {note.profiles?.full_name || 'Gizli Karavancı'}
            </span>
          </Popup>
        </Marker>
      ))}

      {routes.map((route) => {
        const coords = route?.geojson_path?.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) return null;
        const positions: [number, number][] = coords
          .map((c: any) => Array.isArray(c) && c.length >= 2 ? [c[1], c[0]] as [number, number] : null)
          .filter((p): p is [number, number] => p !== null && isValidLatLng(p[0], p[1]));
        if (positions.length < 2) return null;

        return (
          <Polyline
            key={`route-${route.id}`}
            positions={positions}
            pathOptions={{ color: '#FF8C42', weight: 4, opacity: 0.8 }}
          >
            <Popup>
              <strong>🛣️ {route.title}</strong><br />
              {route.start_location_name} ➔ {route.end_location_name}<br />
              {route.description && <p style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '5px' }}>{route.description}</p>}
            </Popup>
          </Polyline>
        );
      })}
    </MapContainer>
  );
}
