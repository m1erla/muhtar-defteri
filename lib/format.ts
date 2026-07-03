// Date helpers for the ledger treatment — dates render in mono, Turkish style.

export function formatLedgerDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}`;
}

export function daysAgoLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'Bugün';
  if (days === 1) return 'Dün';
  return `${days} gün önce`;
}
