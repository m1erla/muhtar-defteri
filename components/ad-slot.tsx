import { useEffect, useRef, useState } from 'react';

import {
  AD_SLOT_IDS,
  ADS_ENABLED,
  ADSENSE_CLIENT,
  ensureAdsLoader,
  getAdsConsent,
  subscribeAdsConsent,
  type AdFormat,
} from '@/lib/ads';

// One ad slot. DORMANT by default: with EXPO_PUBLIC_ADS unset this renders
// nothing at all (no reserved space, no script, no bytes on screen) — the gate
// below is a build-time constant, so the whole subtree is dead until the owner
// flips the env var (OPERATIONS.md § Reklamlar).
//
// When enabled + consented (lib/ads.ts):
// - The frame has a FIXED reserved height per format, so a slow ad network can
//   never shift layout (zero CLS — a moving confirm button is a misclick on an
//   irreversible civic action).
// - The <ins> is only mounted, and the AdSense loader only injected, when the
//   slot comes within ~600px of the viewport (IntersectionObserver) — a 500-row
//   map-list scroll doesn't fire dozens of requests, and below-fold slots on
//   unscrolled pages cost nothing.
// - Visibly labelled "Reklam" and framed unlike any app content: an ad that
//   could be mistaken for a ledger row or a channel card is a trust failure.
// - The frame interior stays light paper in ALL themes: AdSense iframes ignore
//   our CSS variables, and a white creative flash-banging dark mode is worse
//   than a consistently light, clearly-foreign box.
//
// Rules of Hooks: the export is a hook-free gate; hooks live in MountedAdSlot,
// which only exists when the gate passes (build-time constant, so the tree
// shape never changes between renders).

const RESERVED: Record<AdFormat, { height: number; maxWidth: number | '100%' }> = {
  rect: { height: 280, maxWidth: 336 },
  infeed: { height: 140, maxWidth: '100%' },
  sky: { height: 600, maxWidth: 300 },
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdSlot({ format }: { format: AdFormat }) {
  if (!ADS_ENABLED || !ADSENSE_CLIENT || !AD_SLOT_IDS[format]) return null;
  return <MountedAdSlot format={format} />;
}

function MountedAdSlot({ format }: { format: AdFormat }) {
  const [consent, setConsent] = useState(getAdsConsent);
  const [near, setNear] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const pushedRef = useRef(false);

  useEffect(() => subscribeAdsConsent(setConsent), []);

  // Flip `near` once the slot approaches the viewport. The mount-time rect
  // check handles slots already on/near screen deterministically (IO delivery
  // can lag behind first paint); the observer covers the genuinely below-fold
  // ones (e.g. the 500-row map-list feed) without any scroll listeners.
  useEffect(() => {
    const el = boxRef.current;
    if (!el || near) return;
    if (el.getBoundingClientRect().top < window.innerHeight + 600) {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '600px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  // Near + consented → load the script (idempotent) and mount the unit once.
  useEffect(() => {
    if (!near || consent !== 'granted' || pushedRef.current) return;
    const el = boxRef.current;
    if (!el) return;
    ensureAdsLoader();
    pushedRef.current = true;
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.style.width = '100%';
    ins.style.height = '100%';
    ins.setAttribute('data-ad-client', ADSENSE_CLIENT);
    ins.setAttribute('data-ad-slot', AD_SLOT_IDS[format]);
    el.appendChild(ins);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Loader blocked (ad blocker) — the reserved frame stays quietly empty.
    }
  }, [near, consent, format]);

  // No consent → no reserved space either: the page reads exactly as ads-off.
  if (consent !== 'granted') return null;

  const { height, maxWidth } = RESERVED[format];
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: 10,
          letterSpacing: 1,
          color: 'var(--ink-muted)',
          alignSelf: 'center',
          marginBottom: 2,
        }}
      >
        REKLAM
      </div>
      <div
        ref={boxRef}
        style={{
          width: '100%',
          maxWidth,
          height,
          background: '#F4EFE4',
          border: '1px solid var(--ink-muted)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      />
    </div>
  );
}
