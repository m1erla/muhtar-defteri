# Dijital Muhtar

Adana'daki yerel bir sorunu doğru resmi kanala yönlendiren ve isteğe bağlı olarak
herkese açık bir şeffaflık haritasına kaydeden, topluluk temelli bir web uygulaması.
Resmî bir devlet kanalı değildir — mevcut kanalların (Alo 181, Alo 155, CİMER,
ALO 153, e-belediye) yanında çalışan bir yönlendirme ve şeffaflık katmanıdır.

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

Database schema lives in [supabase/schema.sql](supabase/schema.sql) — run it in the
Supabase SQL editor to create the three tables (`channels`, `reports`, `confirmations`).

## Build & deploy

```sh
npx expo export --platform web   # outputs static site to dist/
npx vercel deploy dist --prod    # deploy (project is linked to Vercel)
```
