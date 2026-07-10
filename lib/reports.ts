import type { CategorySlug } from './categories';
import { generateId, getSessionId } from './session';
import { getSupabase } from './supabase';

// Row shape of the reports table — supabase/schema.sql / PRD §10.
// `confirmations` is PostgREST's embedded aggregate, not a column.
export type Report = {
  id: string;
  category: CategorySlug;
  description: string | null;
  photo_url: string | null;
  latitude: number;
  longitude: number;
  neighborhood: string | null;
  status: 'open' | 'resolved';
  session_id: string;
  created_at: string;
  confirmations?: { count: number }[];
};

export type ConfirmationType = 'still_open' | 'resolved';

export type ReportFilters = {
  category?: CategorySlug | null;
  status?: 'open' | 'resolved' | null;
};

export function confirmationCount(report: Report): number {
  return report.confirmations?.[0]?.count ?? 0;
}

export async function fetchReports(filters: ReportFilters = {}, limit = 100): Promise<Report[]> {
  let query = getSupabase()
    .from('reports')
    .select('*, confirmations(count)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.status) query = query.eq('status', filters.status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Report[];
}

export async function fetchReport(id: string): Promise<Report | null> {
  const { data, error } = await getSupabase()
    .from('reports')
    .select('*, confirmations(count)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Report | null;
}

// How many reports share this report's exact spot + category — the "this spot
// is a recurring problem" count for the detail screen (PRD story 4). Coords are
// stored rounded to 3 decimals, so exact equality matches the same coarse spot;
// no spatial query (CLAUDE.md: coarse rounding, not PostGIS).
export async function fetchSameSpotCount(report: Report): Promise<number> {
  const { count, error } = await getSupabase()
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('category', report.category)
    .eq('latitude', report.latitude)
    .eq('longitude', report.longitude);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

// Coarse neighborhood name via OSM Nominatim (free, no key; one call per
// submitted report is well inside their usage policy). Failure is fine —
// grouping falls back to coordinates and rows display "Adana".
async function reverseNeighborhood(latitude: number, longitude: number): Promise<string | null> {
  try {
    // Feature-detect: AbortSignal.timeout is missing on older Safari — without
    // the guard the TypeError would silently disable geocoding entirely.
    const signal =
      typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(4000) : undefined;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&accept-language=tr&zoom=14`,
      { signal }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      address?: Record<string, string | undefined>;
    };
    const a = json.address ?? {};
    return a.neighbourhood ?? a.suburb ?? a.quarter ?? a.village ?? a.town ?? null;
  } catch {
    return null;
  }
}

// Client-side compression before upload (FRONTEND.md §8) — phones produce
// multi-MB photos; the map never needs more than ~1280px.
async function uploadPhoto(photoUri: string): Promise<string | null> {
  try {
    // Dynamic import: the manipulator only runs on the submit-with-photo path
    // and has no business in the entry bundle every visitor parses.
    const { ImageManipulator, SaveFormat } = await import('expo-image-manipulator');
    const context = ImageManipulator.manipulate(photoUri);
    context.resize({ width: 1280 });
    const image = await context.renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.7 });

    const blob = await (await fetch(saved.uri)).blob();
    const path = `${generateId()}.jpg`;
    const { error } = await getSupabase()
      .storage.from('report-photos')
      .upload(path, blob, { contentType: 'image/jpeg' });
    if (error) throw new Error(error.message);
    return getSupabase().storage.from('report-photos').getPublicUrl(path).data.publicUrl;
  } catch (err) {
    // A report without its photo is still worth logging — don't fail the
    // submit. But deterministic breakage (missing bucket, manipulator failure)
    // must stay visible somewhere:
    console.warn('report photo upload failed:', err);
    return null;
  }
}

export async function submitReport(input: {
  category: CategorySlug;
  description: string;
  photoUri: string | null;
  latitude: number;
  longitude: number;
}): Promise<string> {
  // The opt-in copy promises "yaklaşık konum" — store ~110m precision
  // (3 decimals), which also gives coarse grouping for free later.
  const latitude = Math.round(input.latitude * 1000) / 1000;
  const longitude = Math.round(input.longitude * 1000) / 1000;

  const [photo_url, neighborhood] = await Promise.all([
    input.photoUri ? uploadPhoto(input.photoUri) : Promise.resolve(null),
    reverseNeighborhood(latitude, longitude),
  ]);

  const { data, error } = await getSupabase()
    .from('reports')
    .insert({
      category: input.category,
      description: input.description.trim() || null,
      photo_url,
      latitude,
      longitude,
      neighborhood,
      session_id: getSessionId(),
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return (data as { id: string }).id;
}

// One confirmation per session per report (PRD §9's only use of the session id).
export async function fetchMyConfirmation(reportId: string): Promise<ConfirmationType | null> {
  const { data, error } = await getSupabase()
    .from('confirmations')
    .select('type')
    .eq('report_id', reportId)
    .eq('session_id', getSessionId())
    .limit(1);
  if (error) throw new Error(error.message);
  return (data?.[0]?.type as ConfirmationType) ?? null;
}

// Postgres unique_violation: this session already confirmed this report.
const UNIQUE_VIOLATION = '23505';

// Returns whether this call actually recorded a NEW confirmation. false means
// this session had already confirmed the report (23505) and nothing changed —
// the caller must NOT then optimistically flip its own UI (e.g. to "resolved"),
// or it would diverge from the DB, which skipped the status update below.
export async function confirmReport(
  reportId: string,
  type: ConfirmationType
): Promise<boolean> {
  const { error } = await getSupabase()
    .from('confirmations')
    .insert({ report_id: reportId, type, session_id: getSessionId() });
  // The confirmations_one_per_session constraint makes this insert idempotent.
  // Hitting it (double tap, second tab) means the confirmation already exists,
  // which is the outcome the user wanted — not an error they can act on.
  const inserted = !error;
  if (error && error.code !== UNIQUE_VIOLATION) throw new Error(error.message);

  // "Bu düzeldi" flips the community-maintained status — but ONLY when this call
  // actually recorded a resolved confirmation. If the insert was a duplicate
  // (23505), a stale tab must not be able to force a resolve with no backing
  // resolved row. supabase-js doesn't throw on DB errors, so check explicitly.
  if (type === 'resolved' && inserted) {
    const { error: updateError } = await getSupabase()
      .from('reports')
      .update({ status: 'resolved' })
      .eq('id', reportId);
    if (updateError) throw new Error(updateError.message);
  }
  return inserted;
}
