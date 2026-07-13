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

// Adana bounding box, kept IN SYNC with schema.sql `reports_within_adana`.
// Snug around the province (all 15 district centres fit with margin) so it
// excludes the ~110 km of open sea to the south and most of neighbouring
// Mersin/Tarsus to the west — a looser box would let the search offer, and the
// guard accept, non-Adana points (breaking the Adana-only invariant). A
// rectangle can't perfectly trace the border, so a sliver of Tarsus (~lon 34.89,
// next to Adana's own Pozantı) is unavoidably inside; that's the tightest a box
// gets without dropping Pozantı.
const BBOX = { minLat: 36.35, maxLat: 38.5, minLon: 34.7, maxLon: 36.5 };
// Nominatim viewbox is minLon,minLat,maxLon,maxLat.
const VIEWBOX = `${BBOX.minLon},${BBOX.minLat},${BBOX.maxLon},${BBOX.maxLat}`;

export type GeoResult = {
  label: string; // short, human-readable place label (Turkish)
  latitude: number;
  longitude: number;
};

// Shared Nominatim call: the hardcoded host plus the AbortSignal.timeout
// feature-detect (missing on older Safari) that BOTH the forward search here and
// the reverse geocode in lib/reports.ts need. One place, so a policy change
// (timeout, a future required header) is a single edit, not two that can drift.
export async function nominatimFetch(path: string, timeoutMs: number): Promise<Response> {
  const signal = typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(timeoutMs) : undefined;
  return fetch(`https://nominatim.openstreetmap.org/${path}`, { signal });
}

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

  const res = await nominatimFetch(
    `search?q=${encodeURIComponent(q)}&format=jsonv2&countrycodes=tr` +
      `&viewbox=${VIEWBOX}&bounded=1&accept-language=tr&limit=6`,
    6000
  );
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
