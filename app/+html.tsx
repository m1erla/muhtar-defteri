import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

import { colors } from '@/lib/theme';

// Static HTML shell for the web export — this is what crawlers and the
// pre-hydration browser tab see. Per-screen titles take over after hydration.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content={colors.paper} />

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
        <meta property="og:title" content="Mahalle Defteri" />
        <meta
          property="og:description"
          content="Adana'daki yerel bir sorunu doğru resmi kanala yönlendirir; istersen mahallenin açık kaydına eklersin. Resmi bir kanal değil."
        />
        {/* Absolute URL: WhatsApp/Facebook crawlers frequently fail to resolve a
            root-relative og:image. */}
        <meta property="og:image" content="https://muhtar-defteri.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Mahalle Defteri" />
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
        {/* Three web-only, zero-network touches:
            1. Riso paper grain — monochrome fractal noise fixed over everything
               at 4% opacity. Enough to read as printed paper up close, far too
               faint to affect text contrast (FRONTEND.md: texture serves the
               ledger metaphor, never fights readability).
            2. Keyboard focus — a consistent petrol focus ring, only for
               keyboard/switch navigation (:focus-visible), not mouse taps.
            3. Reduced motion — kill residual animation (spinners etc.) for
               users who asked their OS for less motion. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  pointer-events: none;
  opacity: 0.04;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 160px 160px;
}
:focus-visible {
  outline: 2px solid ${colors.petrol};
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
