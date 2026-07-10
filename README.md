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

Supabase setup (dashboard):
1. Run [supabase/schema.sql](supabase/schema.sql) in the SQL editor — creates
   `channels`, `reports`, `confirmations`.
2. Run [supabase/seed/channels.sql](supabase/seed/channels.sql) — loads the verified
   Adana + national routing data.
3. Create a **public** storage bucket named `report-photos` (Storage → New bucket)
   — report photo uploads land there.

## Build & deploy

```sh
npm run build:web   # expo export + copies +not-found.html to 404.html for Cloudflare
npm run deploy      # build + upload dist/ to Cloudflare Pages (needs `npx wrangler login` once)
```

Hosted on Cloudflare Pages (project `dijital-muhtar`). Clean URLs (`/home` →
`home.html`) are native Pages behavior. The 404.html copy step matters: without
it, Pages treats the site as an SPA and serves unknown paths as 200s.

`vercel.json` exists only for the interim Vercel fallback (reachable from
Turkish networks while `*.pages.dev` is ISP-blocked): refresh it with
`npx -y vercel@48.0.0 deploy --prod --yes`. Delete the file and the Vercel
project once the custom domain is live.
