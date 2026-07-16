import { Platform } from 'react-native';

// Dormant ad system — OFF unless EXPO_PUBLIC_ADS=1 at build time.
//
// Decided 2026-07-15 (owner): ads are implemented but ship DISABLED until after
// the competition (load speed is a scored criterion; ad JS is ~200-300KB, and
// KVKK requires a consent banner that must not be the jury's first impression).
// Enabling is config-only — no code edits: set the env vars below in the
// Cloudflare Workers build env and push. Full runbook: OPERATIONS.md § Reklamlar.
//
// Placement plan + revenue analysis (2026-07-15, subagent survey): the five
// slots wired to AdSlot are the only harm-free inventory — end of report-detail,
// map-list in-feed every 10 rows, end of how-it-works, home below the ledger
// preview, and the desktop right gutter. HARD do-not-place list (trust/safety):
// anywhere in the report flow or beside official channel numbers (an ad next to
// ALO 153 reads as a paid listing — or worse, gets called), mobile sticky
// anchors (overlap the 44px action rows), and anything styled like app content
// (a ledger-row-shaped ad is indistinguishable from a fake report).
export const ADS_ENABLED = Platform.OS === 'web' && process.env.EXPO_PUBLIC_ADS === '1';

// AdSense publisher id (ca-pub-…) and per-placement slot ids, created in the
// AdSense dashboard after approval. All config, no code.
export const ADSENSE_CLIENT = process.env.EXPO_PUBLIC_ADSENSE_CLIENT ?? '';
export const AD_SLOT_IDS = {
  rect: process.env.EXPO_PUBLIC_ADSENSE_SLOT_RECT ?? '',
  infeed: process.env.EXPO_PUBLIC_ADSENSE_SLOT_INFEED ?? '',
  sky: process.env.EXPO_PUBLIC_ADSENSE_SLOT_SKY ?? '',
} as const;

export type AdFormat = keyof typeof AD_SLOT_IDS;

// ── KVKK consent ─────────────────────────────────────────────────────────────
// Turkey's KVKK cookie guideline requires prior EXPLICIT opt-in for advertising
// cookies (off by default, decline as prominent as accept). We take the clean
// reading: no consent → no ad script at all. localStorage, same pattern as
// display-settings; consent is per-device like everything else here.

const CONSENT_KEY = 'mdr:ads-consent';
export type AdsConsent = 'granted' | 'denied' | null;

const hasWindow = typeof window !== 'undefined';
const listeners = new Set<(c: AdsConsent) => void>();

export function getAdsConsent(): AdsConsent {
  if (!hasWindow) return null;
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

export function setAdsConsent(value: Exclude<AdsConsent, null>) {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Blocked storage: treat as session-only consent; the banner returns next visit.
  }
  listeners.forEach((cb) => cb(value));
}

export function subscribeAdsConsent(cb: (c: AdsConsent) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// ── Loader ───────────────────────────────────────────────────────────────────
// adsbygoogle.js is injected at most once, only when ads are enabled, configured
// AND consented — and never on the critical path: AdSlot calls this from an
// IntersectionObserver callback, so the script loads when the first slot nears
// the viewport, after the page has long since painted.

let loaderInjected = false;

export function ensureAdsLoader() {
  if (!ADS_ENABLED || !ADSENSE_CLIENT || loaderInjected || !hasWindow) return;
  if (getAdsConsent() !== 'granted') return;
  loaderInjected = true;
  const s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  document.head.appendChild(s);
}
