'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

function MapEvents({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Fix for default marker icons in Leaflet with Next.js
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function Map({ 
  spots = [], 
  notes = [], 
  routes = [],
  onMapClick,
  draftRoute,
  userLocation
}: { 
  spots?: any[], 
  notes?: any[], 
  routes?: any[],
  onMapClick?: (lat: number, lng: number) => void,
  draftRoute?: { start: [number, number] | null, end: [number, number] | null },
  userLocation?: { lat: number, lng: number } | null
}) {
  useEffect(() => {
    // Delete default icon to prevent missing asset errors
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  const noteIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  // Default center (Turkey)
  const center: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : [38.9637, 35.2433];

  return (
    <MapContainer 
      center={center as [number, number]} 
      zoom={6} 
      style={{ height: '100%', width: '100%', zIndex: 1 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEvents onMapClick={onMapClick} />
      
      {/* User Location Marker */}
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={blueIcon}>
          <Popup>
            <strong>Sen Buradasın</strong> <br/>
            Şu anki konumun.
          </Popup>
        </Marker>
      )}

      {/* Draft Route Points */}
      {draftRoute?.start && (
        <Marker position={draftRoute.start} icon={blueIcon}>
          <Popup>Başlangıç Noktası (Bitiş için haritaya dokun)</Popup>
        </Marker>
      )}
      {draftRoute?.end && (
        <Marker position={draftRoute.end} icon={blueIcon}>
          <Popup>Bitiş Noktası</Popup>
        </Marker>
      )}
      {draftRoute?.start && draftRoute?.end && (
        <Polyline 
          positions={[draftRoute.start, draftRoute.end]} 
          color="#00C853" 
          weight={4} 
          dashArray="10, 10" 
        />
      )}
      
      {spots.map((spot) => (
        <Marker 
          key={`spot-${spot.id}`} 
          position={[spot.lat, spot.lng]} 
          icon={spot.category === 'Sakin Köşe' ? greenIcon : redIcon}
        >
          <Popup>
            <div style={{minWidth: '150px'}}>
              <strong style={{color: spot.category === 'Sakin Köşe' ? 'var(--forest-green)' : 'var(--sunset-orange)'}}>{spot.title}</strong> <br/>
              <span style={{fontWeight: 600, fontSize: '0.8rem'}}>{spot.category}</span> <br/>
              {spot.address && <div style={{fontSize: '0.8rem', marginTop: '5px', opacity: 0.8}}>📍 {spot.address}</div>}
            </div>
          </Popup>
        </Marker>
      ))}

      {notes.map((note) => (
        <Marker key={`note-${note.id}`} position={[note.lat, note.lng]} icon={noteIcon}>
          <Popup>
            <strong>📌 Askıda Not</strong> <br/>
            {note.note} <br/>
            <span style={{fontSize: '0.7rem', opacity: 0.6}}>Bırakan: {note.profile_full_name || note.profiles?.full_name || 'Gizli Karavancı'}</span>
          </Popup>
        </Marker>
      ))}

      {routes.map((route) => {
        // PostGIS GeoJSON output format for LINESTRING:
        // { "type": "LineString", "coordinates": [ [lng, lat], [lng, lat] ] }
        if (!route.geojson_path || !route.geojson_path.coordinates) return null;
        
        // Leaflet expects [lat, lng], so we map it
        const positions = route.geojson_path.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        
        return (
          <Polyline 
            key={`route-${route.id}`} 
            positions={positions} 
            color="var(--sunset-orange, #FF8C42)" 
            weight={4} 
            opacity={0.8}
          >
            <Popup>
              <strong>🛣️ {route.title}</strong><br/>
              {route.start_location_name} ➔ {route.end_location_name}<br/>
              <span style={{fontSize: '0.8rem', opacity: 0.8}}>{route.description}</span>
            </Popup>
          </Polyline>
        );
      })}

    </MapContainer>
  );
}

