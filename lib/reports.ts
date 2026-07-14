import type { CategorySlug } from './categories';
import {
  ARCHIVE_DAYS,
  RESPONSE_BENCHMARK_DAYS,
  businessDaysSince,
  calendarDaysSince,
  overdueCutoffISO,
} from './format';
import { nominatimFetch } from './geocode';
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

// An open report past Adana Büyükşehir's stated response-time benchmark (PRD §11)
// — the same "gecikmiş" test the detail screen shows, so the map/list chip, the
// stats strip and Home's count all agree with the per-report line.
export function isOverdue(report: Pick<Report, 'status' | 'created_at'>): boolean {
  return report.status === 'open' && businessDaysSince(report.created_at) > RESPONSE_BENCHMARK_DAYS;
}

// A report the community has let go stale: still open, never re-verified by
// anyone, and older than the archive window. Hidden from the default map (kept
// in the DB — nothing auto-deletes). Derived, so it needs no writes or cron.
export function isArchivable(report: Report): boolean {
  return (
    report.status === 'open' &&
    confirmationCount(report) === 0 &&
    calendarDaysSince(report.created_at) >= ARCHIVE_DAYS
  );
}

// The newest confirmation's timestamp for a report — the "last verified" moment
// that drives the freshness line + the stale re-verification prompt. null when
// no one has confirmed yet.
export async function fetchLastConfirmation(reportId: string): Promise<string | null> {
  const { data, error } = await getSupabase()
    .from('confirmations')
    .select('created_at')
    .eq('report_id', reportId)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return (data?.[0]?.created_at as string) ?? null;
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

// The ledger stats line (Home + the map/list strip): three head-only counts, ZERO
// rows downloaded. Overdue needs business-day math, but businessDaysSince() only
// decreases as created_at rises, so "overdue" is exactly "created before the
// cutoff" (lib/format overdueCutoffISO) — which Postgres can count. This used to
// download up to 1000 open rows and run a day-by-day loop over them on the scored
// landing screen; it was also silently wrong past that cap. Now it is exact at any
// table size, and both screens read the same numbers from the same query.
export async function fetchReportStats(): Promise<{
  total: number;
  resolved: number;
  overdue: number;
}> {
  const sb = getSupabase();
  const head = () => sb.from('reports').select('*', { count: 'exact', head: true });
  const [totalRes, resolvedRes, overdueRes] = await Promise.all([
    head(),
    head().eq('status', 'resolved'),
    head().eq('status', 'open').lt('created_at', overdueCutoffISO()),
  ]);
  if (totalRes.error) throw new Error(totalRes.error.message);
  if (resolvedRes.error) throw new Error(resolvedRes.error.message);
  if (overdueRes.error) throw new Error(overdueRes.error.message);
  return {
    total: totalRes.count ?? 0,
    resolved: resolvedRes.count ?? 0,
    overdue: overdueRes.count ?? 0,
  };
}

// Report ids reach us from places Postgres doesn't control — a URL param on a
// shared link, an entry in localStorage. PostgREST 400s on a malformed uuid, so
// every such id is checked here before it ever reaches a query.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isReportId(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

// Reports for the device-local watchlist (lib/watchlist.ts). Fetched by id in
// one round trip; caller re-orders to the saved order. A watched report that was
// purged simply drops out. Empty in → empty out (no query).
//
// The ids come from localStorage, which is user-editable and can also carry junk
// from an older build. PostgREST rejects the WHOLE `in.(…)` filter with a 400 if
// any element isn't a valid uuid, so one bad entry would brick the entire
// watchlist screen forever (the error is not self-healing — the bad id stays in
// storage). Drop non-uuids instead: a garbage id can't match a row anyway.
export async function fetchReportsByIds(ids: string[]): Promise<Report[]> {
  const valid = ids.filter(isReportId);
  if (valid.length === 0) return [];
  const { data, error } = await getSupabase()
    .from('reports')
    .select('*, confirmations(count)')
    .in('id', valid);
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
    const res = await nominatimFetch(
      `reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&accept-language=tr&zoom=14`,
      4000
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      address?: Record<string, string | undefined>;
    };
    const a = json.address ?? {};
    const name = a.neighbourhood ?? a.suburb ?? a.quarter ?? a.village ?? a.town;
    // Trim and treat blank as "unknown": an empty/whitespace string would slip
    // past the `?? 'Adana'` display fallbacks and render a blank place cell.
    return name?.trim() || null;
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

  // "Bu düzeldi" flips the community-maintained status. The DB's status guard
  // (schema.sql reports_status_guard) enforces the real invariant — a resolve
  // needs a backing 'resolved' confirmation row — so:
  // - inserted: our own confirmation backs the flip; surface real failures.
  // - 23505 duplicate: STILL attempt the update, quietly. This heals the
  //   retry-after-partial-failure case (first attempt's insert committed but
  //   the update never ran, leaving the report stuck open). If the earlier
  //   confirmation wasn't 'resolved' (stale second tab), the DB rejects the
  //   flip with MDR_STATUS and we swallow it — the caller reloads true state.
  if (type === 'resolved') {
    const { error: updateError } = await getSupabase()
      .from('reports')
      .update({ status: 'resolved' })
      .eq('id', reportId);
    if (updateError && inserted) throw new Error(updateError.message);
  }
  return inserted;
}
