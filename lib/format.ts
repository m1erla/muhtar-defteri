// Date helpers for the ledger treatment — dates render in mono, Turkish style.

export function formatLedgerDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}`;
}

export function daysAgoLabel(iso: string): string {
  // Shares its calendar-day math with calendarDaysSince (below) so the label and
  // the numeric staleness thresholds can never desync — "dün 22:00" viewed at
  // 09:00 reads "Dün", not "Bugün", because both compare local calendar dates.
  const days = calendarDaysSince(iso);
  if (days <= 0) return 'Bugün';
  if (days === 1) return 'Dün';
  return `${days} gün önce`;
}

// Weekdays elapsed since a date — the benchmark for Adana Büyükşehir's stated
// "15 iş günü" response window (PRD §11). Weekends only; public holidays are
// out of scope, so this is a slight over-count, acceptable for a benchmark.
export function businessDaysSince(iso: string): number {
  const cursor = new Date(iso);
  cursor.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let days = 0;
  while (cursor < today) {
    cursor.setDate(cursor.getDate() + 1);
    const wd = cursor.getDay();
    if (wd !== 0 && wd !== 6) days += 1;
  }
  return days;
}

// The instant that splits overdue from on-time, so the "gecikmiş" tally can be a
// DB head-count instead of a row download. businessDaysSince() is monotonically
// decreasing in created_at, so `businessDaysSince(t) > n` is exactly equivalent
// to `t < cutoff` for a single cutoff — walk back day by day until more than `n`
// weekdays have elapsed, then take the start of the following day. Same local
// calendar-day math as businessDaysSince, so the count and the per-report line
// can never disagree.
export function overdueCutoffISO(n: number = RESPONSE_BENCHMARK_DAYS): string {
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  let elapsed = 0;
  while (elapsed <= n) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) elapsed += 1; // the day we're about to step off
    cursor.setDate(cursor.getDate() - 1);
  }
  // cursor is now the newest day that is still overdue; a report is overdue iff
  // it was created before the END of that day.
  cursor.setDate(cursor.getDate() + 1);
  return cursor.toISOString();
}

// Calendar days elapsed since a date (the numeric form of daysAgoLabel) —
// used for the freshness / staleness thresholds below.
export function calendarDaysSince(iso: string): number {
  const then = new Date(iso);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.max(0, Math.round((startOfDay(now) - startOfDay(then)) / 86_400_000));
}

// Adana Büyükşehir's published response standard (PRD §11 / channels seed
// notes): 15 business days, 30 if the request spans departments.
export const RESPONSE_BENCHMARK_DAYS = 15;

// Freshness thresholds for the community re-verification model (there is no
// official status feed, so freshness = time since the last community
// confirmation). An open report with no verification for STALE_DAYS prompts
// "hâlâ duruyor mu?"; open + never verified + ARCHIVE_DAYS old drops off the
// default map (hidden, never deleted — CLAUDE.md: nothing auto-deletes).
export const STALE_DAYS = 45;
export const ARCHIVE_DAYS = 60;
