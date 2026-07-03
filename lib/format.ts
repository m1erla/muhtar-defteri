// Date helpers for the ledger treatment — dates render in mono, Turkish style.

export function formatLedgerDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}`;
}

export function daysAgoLabel(iso: string): string {
  // Compare local calendar dates, not elapsed 24h buckets — "dün 22:00"
  // viewed at 09:00 must read "Dün", not "Bugün".
  const then = new Date(iso);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(then)) / 86_400_000);
  if (days <= 0) return 'Bugün';
  if (days === 1) return 'Dün';
  return `${days} gün önce`;
}
