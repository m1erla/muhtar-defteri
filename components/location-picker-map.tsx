import { divIcon, type Marker as LeafletMarker } from 'leaflet';
import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { colors } from '@/lib/theme';

// Web-only: leaflet touches `window` at import time, so this module must only
// ever be loaded via a client-side dynamic import (see report-details).
type Props = {
  latitude: number;
  longitude: number;
  onMove: (latitude: number, longitude: number) => void;
};

// A stamp-style dot instead of Leaflet's default pin — the default marker
// image assets don't survive bundlers, and the dot matches the design anyway.
const pinIcon = divIcon({
  className: '',
  html: `<div style="width:22px;height:22px;border-radius:11px;background:${colors.terracotta};border:3px solid ${colors.paper};box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function RecenterOnChange({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom());
  }, [map, latitude, longitude]);
  return null;
}

export default function LocationPickerMap({ latitude, longitude, onMove }: Props) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={16}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <RecenterOnChange latitude={latitude} longitude={longitude} />
      <Marker
        position={[latitude, longitude]}
        icon={pinIcon}
        draggable
        eventHandlers={{
          dragend: (event) => {
            const pos = (event.target as LeafletMarker).getLatLng();
            onMove(pos.lat, pos.lng);
          },
        }}
      />
    </MapContainer>
  );
}
