# Mahalle Defteri

Adana'daki yerel bir sorunu doğru resmi kanala yönlendiren ve isteğe bağlı olarak
herkese açık bir şeffaflık haritasına kaydeden, topluluk temelli bir web uygulaması.
Resmî bir devlet kanalı değildir — mevcut kanalların (ALO 153, e-belediye, 112,
Alo 181, CİMER) yanında çalışan bir yönlendirme ve şeffaflık katmanıdır.

**Live:** https://dijital-muhtar.pages.dev — ⚠️ `*.pages.dev` is SNI-blocked on some
Turkish ISPs; a custom domain (pending purchase) will be the real public URL.
Interim fallback reachable from Turkey: https://dijital-muhtar-puce.vercel.app

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

```sh
npm run build:web   # expo export + copies +not-found.html to 404.html for Cloudflare
npm run deploy      # build + upload dist/ to Cloudflare Pages (needs `npx wrangler login` once)
```

Hosted on Cloudflare Pages (project `dijital-muhtar`). Clean URLs (`/home` →
`home.html`) are native Pages behavior. The 404.html copy step matters: without
it, Pages treats the site as an SPA and serves unknown paths as 200s.

> The Cloudflare/Vercel project slugs and `*.pages.dev` URL still read
> `dijital-muhtar`. That's a **legacy identifier kept on purpose** after the
> product was renamed to Mahalle Defteri — renaming the project would change the
> live URL. The user-facing brand comes from the app itself and the custom
> domain (pending); the slug is invisible to users.

`vercel.json` exists only for the interim Vercel fallback (reachable from
Turkish networks while `*.pages.dev` is ISP-blocked): refresh it with
`npx -y vercel@48.0.0 deploy --prod --yes`. Delete the file and the Vercel
project once the custom domain is live.
