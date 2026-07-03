import { divIcon, type Marker as LeafletMarker } from 'leaflet';
import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import type { Report } from '@/lib/reports';
import { colors } from '@/lib/theme';

// Both map components live in ONE module on purpose: it is the app's only
// async chunk that pulls in leaflet. Splitting them made Metro hoist leaflet
// into an eagerly-loaded __common chunk on every page — a ~173KB first-paint
// regression on an app scored for load speed. Only ever load this module via
// client-side dynamic import (leaflet touches `window` at import time).

const ADANA_CENTER: [number, number] = [36.9914, 35.3308];

// Stamp-style dots instead of Leaflet's default pin — the default marker
// image assets don't survive bundlers, and dots match the design language.
function dotIcon(color: string, sizePx: number) {
  const border = Math.max(2, Math.round(sizePx / 7));
  return divIcon({
    className: '',
    html: `<div style="width:${sizePx}px;height:${sizePx}px;border-radius:${sizePx / 2}px;background:${color};border:${border}px solid ${colors.paper};box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [sizePx, sizePx],
    iconAnchor: [sizePx / 2, sizePx / 2],
  });
}

const pickerIcon = dotIcon(colors.terracotta, 22);

function RecenterOnChange({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom());
  }, [map, latitude, longitude]);
  return null;
}

export function LocationPickerMap({
  latitude,
  longitude,
  onMove,
}: {
  latitude: number;
  longitude: number;
  onMove: (latitude: number, longitude: number) => void;
}) {
  return (
    <MapContainer center={[latitude, longitude]} zoom={16} style={{ width: '100%', height: '100%' }}>
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <RecenterOnChange latitude={latitude} longitude={longitude} />
      <Marker
        position={[latitude, longitude]}
        icon={pickerIcon}
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

// Read-only pins for the map/list view. Status is never color-only
// (FRONTEND.md §7): resolved pins carry a check glyph, open pins are plain.
function statusPinIcon(status: 'open' | 'resolved') {
  const color = status === 'open' ? colors.terracotta : colors.moss;
  const check =
    status === 'resolved'
      ? `<span style="color:${colors.paper};font-size:11px;line-height:18px;display:block;text-align:center;font-weight:bold;">✓</span>`
      : '';
  return divIcon({
    className: '',
    html: `<div title="${status === 'open' ? 'Açık' : 'Çözüldü'}" style="width:18px;height:18px;border-radius:9px;background:${color};border:2px solid ${colors.paper};box-shadow:0 1px 3px rgba(0,0,0,0.4);">${check}</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export function ReportsMap({
  reports,
  onSelect,
}: {
  reports: Report[];
  onSelect: (id: string) => void;
}) {
  return (
    <MapContainer center={ADANA_CENTER} zoom={12} style={{ width: '100%', height: '100%' }}>
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {reports.map((r) => (
        <Marker
          key={r.id}
          position={[r.latitude, r.longitude]}
          icon={statusPinIcon(r.status)}
          eventHandlers={{ click: () => onSelect(r.id) }}
        />
      ))}
    </MapContainer>
  );
}
