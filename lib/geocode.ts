// Forward geocoding for the address search on report-details: turn a typed
// address / mahalle / cadde into map coordinates so the user can drop a pin
// without hunting on the map. Adana-bounded by the SAME box as the
// reports_within_adana guard in supabase/schema.sql, so a picked result always
// passes the insert check — the search can never place a pin outside the
// province (Adana-only stays intact; this is a finer path, not a wider one).
//
// Deliberately user-triggered (a search button / Enter), NEVER per-keystroke:
// Nominatim's usage policy forbids autocomplete-style query floods. One tap =
// one request, well inside their 1 req/sec limit. Reverse geocoding of the
// final coordinates still happens once at submit (lib/reports.ts).

// Adana bounding box, matching schema.sql `reports_within_adana`
// (latitude 35.5–38.7, longitude 34.0–37.0).
const BBOX = { minLat: 35.5, maxLat: 38.7, minLon: 34.0, maxLon: 37.0 };
// Nominatim viewbox is minLon,minLat,maxLon,maxLat.
const VIEWBOX = `${BBOX.minLon},${BBOX.minLat},${BBOX.maxLon},${BBOX.maxLat}`;

export type GeoResult = {
  label: string; // short, human-readable place label (Turkish)
  latitude: number;
  longitude: number;
};

// A tidy label from Nominatim's long display_name ("Kayalıbağ, Seyhan, Adana,
// 01010, Türkiye") — keep the most specific two or three parts.
function shortLabel(displayName: string): string {
  return displayName
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(', ');
}

export async function searchAdanaAddress(query: string): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  // Feature-detect: AbortSignal.timeout is missing on older Safari — without the
  // guard the TypeError would break the search entirely (same pattern as the
  // reverse geocoder in lib/reports.ts).
  const signal = typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(6000) : undefined;

  const url =
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}` +
    `&format=jsonv2&countrycodes=tr&viewbox=${VIEWBOX}&bounded=1` +
    `&accept-language=tr&limit=6`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`geocode ${res.status}`);
  const json = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;

  return json
    .map((r) => ({ latitude: Number(r.lat), longitude: Number(r.lon), display_name: r.display_name }))
    // Defence in depth: even with bounded=1, keep only points actually inside
    // the Adana box, so a picked result can never fail the insert guard.
    .filter(
      (r) =>
        Number.isFinite(r.latitude) &&
        Number.isFinite(r.longitude) &&
        r.latitude >= BBOX.minLat &&
        r.latitude <= BBOX.maxLat &&
        r.longitude >= BBOX.minLon &&
        r.longitude <= BBOX.maxLon
    )
    .map((r) => ({
      label: shortLabel(r.display_name),
      latitude: r.latitude,
      longitude: r.longitude,
    }));
}
