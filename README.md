# Mahalle Defteri

Adana'daki yerel bir sorunu doğru resmi kanala yönlendiren ve isteğe bağlı olarak
herkese açık bir şeffaflık haritasına kaydeden, topluluk temelli bir web uygulaması.
Resmî bir devlet kanalı değildir — mevcut kanalların (ALO 153, e-belediye, 112,
Alo 181, CİMER) yanında çalışan bir yönlendirme ve şeffaflık katmanıdır.

**Live:** https://muhtar-defteri.com — a Cloudflare custom domain, reachable
from Turkey. (Cloudflare's `*.workers.dev` / legacy `*.pages.dev` hostnames are
SNI-blocked on some Turkish ISPs, which is why the custom domain is the public URL.)

Full product context: [PRD.md](PRD.md) · Design system: [FRONTEND.md](FRONTEND.md) · Operating rules: [CLAUDE.md](CLAUDE.md)

## Stack

- Expo (React Native) — **web is the primary deploy target**
- Supabase (Postgres + REST client), no auth — anonymous session id only
- `react-leaflet` + OpenStreetMap for the map (not `react-native-maps`)

## Setup

```sh
npm install
cp .env.example .env   # then fill in the Supabase URL + anon key
npx expo start --web   # local dev
```

Supabase setup (SQL editor, run as project owner):
1. Run [supabase/schema.sql](supabase/schema.sql) — creates `channels`, `reports`,
   `confirmations`, all RLS policies + integrity constraints, **and** the public
   `report-photos` storage bucket (with a 5 MB / image-only cap). No manual
   dashboard step for storage — just confirm the bucket exists afterward.
2. Run [supabase/seed/channels.sql](supabase/seed/channels.sql) — loads the verified
   Adana + national routing data.
3. Optional, for a live demo: run [supabase/seed/demo-reports.sql](supabase/seed/demo-reports.sql)
   to populate illustrative reports (a repeat-cluster + an overdue record) so the
   map/list/home aren't empty. Remove with the delete statements at the bottom of
   that file before a real launch.

## Build & deploy

Hosted on **Cloudflare Workers** (Static Assets), app `muhtar-defteri`,
git-connected to `github.com/m1erla/muhtar-defteri`. Deploy config lives in
[wrangler.jsonc](wrangler.jsonc) (`assets.directory` = `dist`).

- **Canonical deploy: push to `main`.** Cloudflare's Workers Builds integration
  builds the web export and deploys automatically. The Supabase credentials come
  from the Worker's build environment variables (`EXPO_PUBLIC_SUPABASE_URL`,
  `EXPO_PUBLIC_SUPABASE_ANON_KEY`) — they must stay set there or a CI build ships
  keyless (blank map + a "database not set up" notice).
- **Manual override (emergency):** `npm run deploy` — runs `npm run build:web`
  (which uses `--clear`, so it picks up your current `.env`) and uploads `dist/`
  via `wrangler deploy`.

```sh
npm run build:web   # local check: expo export --clear + copies +not-found.html to 404.html
```

Clean URLs (`/home` → `/home.html`) are automatic in Workers Static Assets. Unknown
paths serve the branded `dist/404.html` with a real 404 status (not an SPA 200) —
this is why `wrangler.jsonc` sets `assets.not_found_handling` to `"404-page"` and
`build:web` copies `+not-found.html` → `404.html`.

> **Note on the legacy `*.pages.dev` / `*.workers.dev` slugs.** The old
> `dijital-muhtar.pages.dev` name and the Worker's `*.workers.dev` route are both
> SNI-blocked on Turkish ISPs and are not the public URL — **muhtar-defteri.com**
> is. Users never see either slug.

Vercel is retired — Cloudflare is the sole host.
