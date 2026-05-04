'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, LayersControl } from 'react-leaflet';
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

  const center: [number, number] = userLocation && isValidLatLng(userLocation.lat, userLocation.lng)
    ? [userLocation.lat, userLocation.lng]
    : [38.9637, 35.2433];

  return (
    <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%', zIndex: 1 }} zoomControl={false}>
      <L.Control.Zoom position="bottomright" />
      
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Modern Sokak">
          <TileLayer
            attribution='&copy; JawgMaps'
            url="https://{s}.tile.jawg.io/jawg-streets/{z}/{x}/{y}{r}.png?access-token=guest"
          />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer name="Premium Uydu">
          <TileLayer
            attribution='&copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="Arazi (Topo)">
          <TileLayer
            attribution='&copy; OpenTopoMap'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer name="Gece Modu">
          <TileLayer
            attribution='&copy; CartoDB'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      <MapEvents onMapClick={onMapClick} />

      {userLocation && isValidLatLng(userLocation.lat, userLocation.lng) && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={icons.blue}>
          <Popup className="premium-popup">
            <div style={{textAlign:'center', padding:'5px'}}>
              <strong>Sen Buradasın</strong><br/>
              <span style={{fontSize:'0.8rem', opacity:0.7}}>Mevcut Konumun</span>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Spots, Notes and Routes markers logic remains similar but with improved Popups */}
      {spots.filter(s => isValidLatLng(s?.lat, s?.lng)).map((spot) => (
        <Marker
          key={`spot-${spot.id}`}
          position={[spot.lat, spot.lng]}
          icon={spot.category === 'Sakin Köşe' ? icons.green : icons.red}
        >
          <Popup className="premium-popup">
            <div style={{ minWidth: '200px', padding:'5px' }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                <strong style={{fontSize: '1.1rem', color:'var(--text)'}}>{spot.title}</strong>
                <span style={{ 
                  fontSize:'0.7rem', 
                  padding:'2px 8px', 
                  borderRadius:'10px',
                  background: spot.category === 'Sakin Köşe' ? 'rgba(45,90,39,0.1)' : 'rgba(255,140,66,0.1)',
                  color: spot.category === 'Sakin Köşe' ? 'var(--forest-green)' : 'var(--sunset-orange)',
                  fontWeight: 700
                }}>{spot.category}</span>
              </div>
              
              {spot.image_url && <img src={spot.image_url} style={{width:'100%', height:'100px', objectFit:'cover', borderRadius:'8px', marginBottom:'8px'}} />}

              {spot.attributes && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  {spot.attributes.water && <span title="Su">💧</span>}
                  {spot.attributes.electricity && <span title="Elektrik">⚡</span>}
                  {spot.attributes.wc && <span title="WC">🚽</span>}
                </div>
              )}

              {spot.address && <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>📍 {spot.address}</div>}
            </div>
          </Popup>
        </Marker>
      ))}

      {notes.filter(n => isValidLatLng(n?.lat, n?.lng)).map((note) => (
        <Marker key={`note-${note.id}`} position={[note.lat, note.lng]} icon={icons.orange}>
          <Popup className="premium-popup">
            <div style={{padding:'5px'}}>
              <strong style={{color:'var(--sunset-orange)'}}>📌 Askıda Not</strong><br />
              <p style={{margin:'8px 0', fontSize:'0.9rem', fontStyle:'italic'}}>"{note.note}"</p>
              <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                — {note.profiles?.full_name || 'Gizli Karavancı'}
              </span>
            </div>
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
            pathOptions={{ color: 'var(--sunset-orange)', weight: 5, opacity: 0.7, lineCap: 'round' }}
          >
            <Popup className="premium-popup">
              <div style={{padding:'5px'}}>
                <strong style={{fontSize:'1rem'}}>🛣️ {route.title}</strong><br />
                <div style={{margin:'5px 0', fontSize:'0.85rem'}}>
                  <span style={{opacity:0.6}}>Başlangıç:</span> {route.start_location_name}<br/>
                  <span style={{opacity:0.6}}>Varış:</span> {route.end_location_name}
                </div>
                {route.description && <p style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '8px', borderTop:'1px solid rgba(0,0,0,0.05)', paddingTop:'5px' }}>{route.description}</p>}
              </div>
            </Popup>
          </Polyline>
        );
      })}

      {draftRoute?.start && <Marker position={draftRoute.start} icon={icons.blue} />}
      {draftRoute?.end && <Marker position={draftRoute.end} icon={icons.blue} />}
      {draftRoute?.start && draftRoute?.end && (
        <Polyline positions={[draftRoute.start, draftRoute.end]} pathOptions={{ color: 'var(--forest-green)', weight: 4, dashArray: '10, 10' }} />
      )}
    </MapContainer>
  );
}
