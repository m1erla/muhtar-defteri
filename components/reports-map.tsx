import { divIcon } from 'leaflet';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import type { Report } from '@/lib/reports';
import { colors } from '@/lib/theme';

// Web-only, lazy-loaded (see location-picker-map for why). Read-only pins for
// the map/list view; pin color mirrors the status stamp language.
const ADANA_CENTER: [number, number] = [36.9914, 35.3308];

function pinIcon(status: 'open' | 'resolved') {
  const color = status === 'open' ? colors.terracotta : colors.moss;
  return divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:9px;background:${color};border:2.5px solid ${colors.paper};box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export default function ReportsMap({
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
          icon={pinIcon(r.status)}
          eventHandlers={{ click: () => onSelect(r.id) }}
        />
      ))}
    </MapContainer>
  );
}
