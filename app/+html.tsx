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
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
