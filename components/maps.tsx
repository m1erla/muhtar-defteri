import { divIcon, type Marker as LeafletMarker } from 'leaflet';
import { useEffect, useRef } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { clusterReports } from '@/lib/cluster';
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
    html: `<div style="width:${sizePx}px;height:${sizePx}px;border-radius:${sizePx / 2}px;background:${color};border:${border}px solid ${colors.paper};box-shadow:0 1px 4px ${colors.mapPinShadow};"></div>`,
    iconSize: [sizePx, sizePx],
    iconAnchor: [sizePx / 2, sizePx / 2],
  });
}

const pickerIcon = dotIcon(colors.terracotta, 22);

// One controller for the picker map's view. A programmatic "jump" (district
// select or geolocation) bumps `focusKey` and sets `focusZoom`; on that change
// we recenter AND zoom to the area. A pin drag changes lat/lng WITHOUT bumping
// focusKey, so we leave the view alone and never fight the user's drag. One
// effect, no cross-effect race. setView (not flyTo) is instant — reduced-motion
// safe by construction.
function MapController({
  latitude,
  longitude,
  focusZoom,
  focusKey,
}: {
  latitude: number;
  longitude: number;
  focusZoom: number;
  focusKey: number;
}) {
  const map = useMap();
  const lastFocus = useRef(0);
  useEffect(() => {
    if (focusKey !== lastFocus.current) {
      lastFocus.current = focusKey;
      if (focusKey !== 0) map.setView([latitude, longitude], focusZoom);
    }
  }, [map, latitude, longitude, focusZoom, focusKey]);
  return null;
}

export function LocationPickerMap({
  latitude,
  longitude,
  onMove,
  focusZoom = 16,
  focusKey = 0,
}: {
  latitude: number;
  longitude: number;
  onMove: (latitude: number, longitude: number) => void;
  // Bump `focusKey` (and optionally set `focusZoom`) to jump+zoom the view to
  // the current lat/lng — used when a district is picked or geolocation lands.
  focusZoom?: number;
  focusKey?: number;
}) {
  return (
    <MapContainer center={[latitude, longitude]} zoom={16} style={{ width: '100%', height: '100%' }}>
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <MapController
        latitude={latitude}
        longitude={longitude}
        focusZoom={focusZoom}
        focusKey={focusKey}
      />
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

// Read-only single-pin map for the report-detail screen. A report's location is
// otherwise only a neighborhood name — invisible when reverse-geocoding failed —
// so this shows WHERE the problem is. The pin isn't draggable; the user can
// still pan/zoom to get their bearings.
export function ReportLocationMap({
  latitude,
  longitude,
  status,
}: {
  latitude: number;
  longitude: number;
  status: 'open' | 'resolved';
}) {
  return (
    <MapContainer center={[latitude, longitude]} zoom={16} style={{ width: '100%', height: '100%' }}>
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <Marker
        position={[latitude, longitude]}
        icon={dotIcon(status === 'open' ? colors.terracotta : colors.moss, 22)}
      />
    </MapContainer>
  );
}

// Read-only cluster pins for the map/list view. Status is never color-only
// (FRONTEND.md §7): a lone resolved pin carries a check glyph. A cluster of >1
// report at the same spot shows its count, larger — density visible at a glance
// (PRD §8), so "this spot is a repeat problem" reads without any text.
function clusterPinIcon(status: 'open' | 'resolved', count: number) {
  const color = status === 'open' ? colors.terracotta : colors.moss;
  const label = status === 'open' ? 'Açık' : 'Çözüldü';
  if (count > 1) {
    const size = 26;
    return divIcon({
      className: '',
      html: `<div title="${label} · ${count} kayıt" style="width:${size}px;height:${size}px;border-radius:${size / 2}px;background:${color};border:2px solid ${colors.paper};box-shadow:0 1px 4px ${colors.mapPinShadow};color:${colors.paper};font-family:monospace;font-weight:700;font-size:13px;line-height:${size - 4}px;text-align:center;">${count}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }
  const check =
    status === 'resolved'
      ? `<span style="color:${colors.paper};font-size:11px;line-height:18px;display:block;text-align:center;font-weight:bold;">✓</span>`
      : '';
  return divIcon({
    className: '',
    html: `<div title="${label}" style="width:18px;height:18px;border-radius:9px;background:${color};border:2px solid ${colors.paper};box-shadow:0 1px 3px ${colors.mapPinShadow};">${check}</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export function ReportsMap({
  reports,
  onSelect,
  counts,
}: {
  reports: Report[];
  onSelect: (id: string) => void;
  // True same-spot totals computed over the UNFILTERED set, so a pin's number
  // stays honest even when a status/category chip hides part of its cluster.
  counts?: Map<string, number>;
}) {
  const clusters = clusterReports(reports);
  return (
    <MapContainer center={ADANA_CENTER} zoom={12} style={{ width: '100%', height: '100%' }}>
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {clusters.map((c) => (
        <Marker
          key={c.key}
          position={[c.latitude, c.longitude]}
          icon={clusterPinIcon(c.status, counts?.get(c.key) ?? c.count)}
          eventHandlers={{ click: () => onSelect(c.representative.id) }}
        />
      ))}
    </MapContainer>
  );
}
