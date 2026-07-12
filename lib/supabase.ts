import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Thrown (and caught by screens) when the env placeholders haven't been filled
// in yet. A typed error — never string-match on the message.
export class SupabaseConfigError extends Error {
  constructor() {
    super(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env (see .env.example).'
    );
    this.name = 'SupabaseConfigError';
  }
}

function readConfig(): { url: string; anonKey: string } | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || url.startsWith('REPLACE') || anonKey.startsWith('REPLACE')) {
    return null;
  }
  return { url, anonKey };
}

// User-facing (Turkish) message for a failed data operation. Owns the
// config-vs-network distinction in one place, plus the moderation guards:
// schema.sql's triggers/constraints raise deliberate 'MDR_*' codes and named
// check constraints — those strings are OUR contract with the DB (unlike
// generic error text, which we still never match on). Copy stays neutral,
// never accusatory (the visitor may be entirely legitimate).
export function friendlyDbError(err: unknown, fallback: string): string {
  if (err instanceof SupabaseConfigError) return 'Veritabanı bağlantısı henüz kurulmadı.';
  const msg = err instanceof Error ? err.message : '';
  if (msg.includes('MDR_RATE_LIMIT')) {
    return 'Bu cihazdan kısa sürede çok fazla kayıt gönderildi. Biraz bekleyip tekrar dene.';
  }
  if (msg.includes('MDR_DUPLICATE')) {
    return 'Bu kaydı kısa süre önce zaten eklemişsin. Sorun sürüyorsa kaydın sayfasından "Ben de Gördüm" diyebilirsin.';
  }
  if (msg.includes('reports_description_no_links')) {
    return 'Açıklamaya internet bağlantısı (link) eklenemiyor — sorunu kendi cümlelerinle anlatman yeterli.';
  }
  if (msg.includes('reports_within_adana')) {
    return 'Konum Adana sınırları dışında görünüyor — pini Adana içine taşıyıp tekrar dene.';
  }
  return fallback;
}

// Lazy singleton so the app shell can render before real credentials exist.
// Screens must call getSupabase() at usage time, never at module top level.
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const config = readConfig();
    if (!config) throw new SupabaseConfigError();
    client = createClient(config.url, config.anonKey);
  }
  return client;
}
