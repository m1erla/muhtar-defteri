import { Platform } from 'react-native';

// Ad system — ON by default on web since 2026-07-15 (owner decision; the
// competition submission was withdrawn, so the keep-dormant constraint is gone).
// Kill switch: set EXPO_PUBLIC_ADS=0 in the build env and push — every slot,
// the banner and the loader vanish. Full runbook: OPERATIONS.md § Reklamlar.
//
// Placement plan + revenue analysis (2026-07-15, subagent survey): the five
// slots wired to AdSlot are the only harm-free inventory — end of report-detail,
// map-list in-feed every 10 rows, end of how-it-works, home below the ledger
// preview, and the desktop right gutter. HARD do-not-place list (trust/safety):
// anywhere in the report flow or beside official channel numbers (an ad next to
// ALO 153 reads as a paid listing — or worse, gets called), mobile sticky
// anchors (overlap the 44px action rows), and anything styled like app content
// (a ledger-row-shaped ad is indistinguishable from a fake report).
export const ADS_ENABLED = Platform.OS === 'web' && process.env.EXPO_PUBLIC_ADS !== '0';

// AdSense publisher + per-placement unit ids (AdSense dashboard → By ad unit:
// mdr-rect / mdr-infeed / mdr-sky, created 2026-07-15). Committed as defaults —
// these are public by design, visible in ads.txt and any page's source; the
// env vars still win if ever set.
export const ADSENSE_CLIENT =
  process.env.EXPO_PUBLIC_ADSENSE_CLIENT ?? 'ca-pub-3856977788453087';
export const AD_SLOT_IDS = {
  rect: process.env.EXPO_PUBLIC_ADSENSE_SLOT_RECT ?? '4650307975',
  infeed: process.env.EXPO_PUBLIC_ADSENSE_SLOT_INFEED ?? '7983048320',
  sky: process.env.EXPO_PUBLIC_ADSENSE_SLOT_SKY ?? '2152017003',
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

// KVKK requires consent to be as easy to withdraw as to give. Clearing the
// stored choice re-surfaces the banner; already-loaded ad scripts only stop on
// the next page load (noted on the /gizlilik page).
export function clearAdsConsent() {
  try {
    window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    // ignore
  }
  listeners.forEach((cb) => cb(null));
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
