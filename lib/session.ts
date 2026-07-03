// Anonymous per-device session id — the only identity in the app (no auth, by design).
// Used to rate-limit duplicate confirmations, nothing else. See PRD.md §9.
const SESSION_KEY = 'dm_session_id';

let cached: string | null = null;

// Exported for reuse anywhere a collision-resistant id is needed:
// crypto.randomUUID is missing on older Safari and on ANY insecure origin
// (http://192.168.x.x phone testing), so never call it unguarded.
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getSessionId(): string {
  if (cached) return cached;
  try {
    // localStorage exists on web (the primary target); guarded for static export/native.
    const stored = globalThis.localStorage?.getItem(SESSION_KEY);
    if (stored) {
      cached = stored;
      return cached;
    }
    const fresh = generateId();
    globalThis.localStorage?.setItem(SESSION_KEY, fresh);
    cached = fresh;
    return cached;
  } catch {
    cached = cached ?? generateId();
    return cached;
  }
}
