// Anonymous per-device session id — the only identity in the app (no auth, by design).
// Used to rate-limit duplicate confirmations, nothing else. See PRD.md §9.
const SESSION_KEY = 'dm_session_id';

let cached: string | null = null;

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments without Web Crypto (should not happen on web targets)
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
