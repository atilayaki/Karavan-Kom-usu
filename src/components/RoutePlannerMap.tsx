'use client';

import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo } from 'react';

const ICON_BASE = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img';
const SHADOW = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions as L.LatLngBoundsExpression, { padding: [40, 40] });
    }
  }, [positions, map]);
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

  const isDarkMode = typeof document !== 'undefined' && document.body.classList.contains('dark-mode');
  const tileUrl = isDarkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const fitPositions: [number, number][] = path.length > 0 ? path : [start, end].filter(Boolean) as [number, number][];

  return (
    <MapContainer center={[38.9637, 35.2433]} zoom={6} style={{ height: '100%', width: '100%', zIndex: 1 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={tileUrl}
      />
      {start && <Marker position={start} icon={icons.green} />}
      {end && <Marker position={end} icon={icons.red} />}
      {path.length >= 2 && (
        <Polyline positions={path} pathOptions={{ color: '#FF8C42', weight: 5, opacity: 0.85 }} />
      )}
      <FitBounds positions={fitPositions} />
    </MapContainer>
  );
}
