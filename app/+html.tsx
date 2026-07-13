import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

import { PALETTES, RAW, type Palette } from '@/lib/theme';

// Static HTML shell for the web export — this is what crawlers and the
// pre-hydration browser tab see. Per-screen titles take over after hydration.

// Palette key -> CSS custom-property name (kebab). Kept in sync with lib/theme's
// `colors` var() references.
const VAR: Record<keyof Palette, string> = {
  ink: '--ink', paper: '--paper', petrol: '--petrol',
  terracotta: '--terracotta', moss: '--moss',
  terracottaText: '--terracotta-text', mossText: '--moss-text', inkMuted: '--ink-muted',
  pressOverlay: '--press-overlay', stampOpen: '--stamp-open', stampResolved: '--stamp-resolved',
  scopeAdanaBg: '--scope-adana-bg', scopeAdanaText: '--scope-adana-text',
  mapPinShadow: '--map-pin-shadow',
};
const vars = (p: Palette) =>
  (Object.keys(VAR) as (keyof Palette)[]).map((k) => `${VAR[k]}:${p[k]};`).join('');

// Theme swaps by attribute on <html>: data-theme=dark, data-contrast=hc (wins
// over theme), data-textscale=lg|xl, data-motion=reduce. Defaults = light.
const THEME_CSS = `
:root{${vars(PALETTES.light)}}
:root[data-theme="dark"]{${vars(PALETTES.dark)}}
:root[data-contrast="hc"]{${vars(PALETTES.hc)}}
html,body{background:var(--paper);}
body::after{
  content:'';position:fixed;inset:0;z-index:2147483647;pointer-events:none;opacity:0.04;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size:160px 160px;
}
:root[data-theme="dark"] body::after{opacity:0.06;}
:root[data-contrast="hc"] body::after{opacity:0;}
:focus-visible{outline:2px solid var(--petrol);outline-offset:2px;}
:root[data-textscale="lg"] body{zoom:1.15;}
:root[data-textscale="xl"] body{zoom:1.3;}
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;}
}
:root[data-motion="reduce"] *,:root[data-motion="reduce"] *::before,:root[data-motion="reduce"] *::after{
  animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;
}
/* "Sivri" the mascot — gentle CSS-only life. The reduced-motion + data-motion
   kill switches above (both use !important) freeze all of this automatically, so
   the mascot renders as a still illustration for anyone who opts out. */
@keyframes sivri-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes sivri-wing{from{transform:rotate(-7deg)}to{transform:rotate(5deg)}}
@keyframes sivri-wave{0%,100%{transform:rotate(0)}25%{transform:rotate(-20deg)}50%{transform:rotate(8deg)}75%{transform:rotate(-14deg)}}
@keyframes sivri-zzz{0%{opacity:0;transform:translate(0,0) scale(.7)}25%{opacity:.85}100%{opacity:0;transform:translate(9px,-20px) scale(1.05)}}
.sivri-float{animation:sivri-float 4.5s ease-in-out infinite}
.sivri-wings{transform-box:fill-box;transform-origin:22% 88%;animation:sivri-wing .3s ease-in-out infinite alternate}
.sivri[data-mood="sleep"]{animation-duration:6s}
.sivri[data-mood="sleep"] .sivri-wings{animation-duration:1.6s}
.sivri-wave{transform-box:fill-box;transform-origin:top center;animation:sivri-wave 1.7s ease-in-out infinite}
.sivri-zzz{transform-box:fill-box;animation:sivri-zzz 2.6s ease-in-out infinite}
/* Decorative Adana margin art (components/side-decor.tsx) — now genuinely
   transparent PNG→WebP, so no blend hacks: the art sits over the page directly.
   Two fixed panels fill ONLY the side gutters (calc), never the centred column;
   pointer-events:none. cover anchored to the outer-bottom corner fills any
   viewport height while keeping the edge stripe + skyline; a soft inner mask
   fades the art off the content. Hidden ≤980px. Shown in both themes; the dark
   treatment (if any) is set below. */
.mdr-side{
  position:fixed; top:0; bottom:0; z-index:0;
  width:calc((100% - 640px) / 2);
  max-width:440px;
  pointer-events:none;
  background-repeat:no-repeat;
  background-size:cover;
  opacity:0.92;
}
.mdr-side-l{ left:0;  background-image:url('/decor/margin-left.webp');  background-position:bottom left;
  -webkit-mask-image:linear-gradient(to right,#000 62%,transparent); mask-image:linear-gradient(to right,#000 62%,transparent); }
.mdr-side-r{ right:0; background-image:url('/decor/margin-right.webp'); background-position:bottom right;
  -webkit-mask-image:linear-gradient(to left,#000 62%,transparent); mask-image:linear-gradient(to left,#000 62%,transparent); }
@media (max-width:980px){ .mdr-side{ display:none; } }
`;

// Runs before first paint (no light->dark flash): apply the saved display
// preferences to <html> so the CSS variables above resolve correctly on load.
// Keys match lib/display-settings.ts. Wrapped in try/catch — a blocked
// localStorage must never break the page.
const NO_FLASH = `(function(){try{var d=document.documentElement,ls=localStorage;
var t=ls.getItem('mdr:theme')||'system';
d.dataset.theme=(t==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t);
if(ls.getItem('mdr:contrast')==='1')d.dataset.contrast='hc';
var s=ls.getItem('mdr:textscale');if(s==='lg'||s==='xl')d.dataset.textscale=s;
if(ls.getItem('mdr:motion')==='1')d.dataset.motion='reduce';}catch(e){}})();`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        {/* Browser-chrome colour follows the system scheme (concrete hex — a
            theme-color meta can't take a CSS var). */}
        <meta name="theme-color" content={RAW.paper} media="(prefers-color-scheme: light)" />
        <meta
          name="theme-color"
          content={PALETTES.dark.paper}
          media="(prefers-color-scheme: dark)"
        />

        {/* Apply saved theme/contrast/text-size/motion before paint. */}
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />

        {/* Static so crawlers and link-preview bots (WhatsApp is central to the
            flow) see a titled, described, branded card — not a bare URL. */}
        <meta
          name="description"
          content="Adana'da bir yerel sorunu doğru resmi kanala yönlendiren ve isteğe bağlı olarak herkese açık mahalle kaydına ekleyen topluluk aracı. Resmi bir devlet kanalı değildir."
        />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="tr_TR" />
        {/* Deliberately NO og:url: this static head wraps every exported page,
            so a root og:url would make crawlers (Facebook especially)
            canonicalize shared /report-detail links back to the homepage. With
            no og:url, crawlers fall back to the fetched URL. */}
        <meta property="og:title" content="Mahalle Defteri · Adana" />
        <meta
          property="og:description"
          content="Adana'daki yerel bir sorunu doğru resmi kanala yönlendirir; istersen mahallenin açık kaydına eklersin. Resmi bir kanal değil."
        />
        {/* Absolute URL: WhatsApp/Facebook crawlers frequently fail to resolve a
            root-relative og:image. */}
        <meta property="og:image" content="https://muhtar-defteri.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Mahalle Defteri · Adana" />
        <meta name="twitter:image" content="https://muhtar-defteri.com/og-image.png" />

        {/* Branded stamp mark — SVG for crisp tabs, PNG for iOS home-screen. */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        {/* Branded standalone launch when a resident adds the site to their home
            screen (the app is pitched as install-free but home-screen-friendly). */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Mahalle Defteri" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        <ScrollViewStyleReset />
        {/* Theme variables (light/dark/high-contrast), the Riso paper grain, the
            keyboard focus ring, text-size zoom, and reduced-motion — all
            web-only, zero-network. */}
        <style dangerouslySetInnerHTML={{ __html: THEME_CSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
