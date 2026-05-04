'use client';

import { MapContainer, TileLayer, Marker, Polyline, useMap, LayersControl, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo } from 'react';

const ICON_BASE = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img';
const SHADOW = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

function MapController({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions as L.LatLngBoundsExpression, { padding: [40, 40] });
    }
  }, [positions, map]);

  useEffect(() => {
    // Force recalculate size after render
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [map]);

  return null;
}

export default function RoutePlannerMap({
  start,
  end,
  path,
}: {
  start: [number, number] | null;
  end: [number, number] | null;
  path: [number, number][];
}) {
  const icons = useMemo(() => ({
    green: new L.Icon({ iconUrl: `${ICON_BASE}/marker-icon-2x-green.png`, shadowUrl: SHADOW, iconSize: [25, 41], iconAnchor: [12, 41] }),
    red: new L.Icon({ iconUrl: `${ICON_BASE}/marker-icon-2x-red.png`, shadowUrl: SHADOW, iconSize: [25, 41], iconAnchor: [12, 41] }),
  }), []);

  const fitPositions: [number, number][] = path.length > 0 ? path : [start, end].filter(Boolean) as [number, number][];

  return (
    <MapContainer center={[38.9637, 35.2433]} zoom={6} style={{ height: '100%', width: '100%', zIndex: 1 }} zoomControl={false}>
      <ZoomControl position="bottomright" />
      
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Modern Sokak">
          <TileLayer
            attribution='&copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
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
      </LayersControl>

      {start && <Marker position={start} icon={icons.green} />}
      {end && <Marker position={end} icon={icons.red} />}
      {path.length >= 2 && (
        <Polyline 
          positions={path} 
          pathOptions={{ 
            color: 'var(--sunset-orange)', 
            weight: 6, 
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round'
          }} 
        />
      )}
      <MapController positions={fitPositions} />
    </MapContainer>
  );
}
