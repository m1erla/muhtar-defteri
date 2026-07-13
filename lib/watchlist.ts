// Device-local watchlist (no account): the report ids a resident chose to follow
// so a returning visitor can check whether their issues moved. Mirrors the
// localStorage pattern in session.ts / display-settings.tsx — no table, no auth,
// nothing leaves the device. Newest-followed first.

const KEY = 'mdr:watchlist';
const hasWindow = typeof window !== 'undefined';

function read(): string[] {
  if (!hasWindow) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  if (!hasWindow) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Storage full/blocked (private mode) — the watchlist is a convenience, not
    // a source of truth; failing silently is acceptable.
  }
}

export function getWatchlist(): string[] {
  return read();
}

export function isWatched(id: string): boolean {
  return read().includes(id);
}

// Toggle follow state; returns the NEW state (true = now watched).
export function toggleWatch(id: string): boolean {
  const ids = read();
  const i = ids.indexOf(id);
  if (i >= 0) {
    ids.splice(i, 1);
    write(ids);
    return false;
  }
  ids.unshift(id);
  write(ids);
  return true;
}
