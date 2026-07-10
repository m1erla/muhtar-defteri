import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Static HTML shell for the web export — this is what crawlers and the
// pre-hydration browser tab see. Per-screen titles take over after hydration.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#EDE6D8" />

        {/* Static so crawlers and link-preview bots (WhatsApp is central to the
            flow) see a titled, described, branded card — not a bare URL. */}
        <meta
          name="description"
          content="Adana'da bir yerel sorunu doğru resmi kanala yönlendiren ve isteğe bağlı olarak herkese açık mahalle kaydına ekleyen topluluk aracı. Resmi bir devlet kanalı değildir."
        />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="tr_TR" />
        <meta property="og:title" content="Mahalle Defteri" />
        <meta
          property="og:description"
          content="Adana'daki yerel bir sorunu doğru resmi kanala yönlendirir; istersen mahallenin açık kaydına eklersin. Resmi bir kanal değil."
        />
        <meta property="og:image" content="/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Mahalle Defteri" />
        <meta name="twitter:image" content="/og-image.png" />

        {/* Branded stamp mark — SVG for crisp tabs, PNG for iOS home-screen. */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
