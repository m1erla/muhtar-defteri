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
// config-vs-network distinction in one place.
export function friendlyDbError(err: unknown, fallback: string): string {
  return err instanceof SupabaseConfigError ? 'Veritabanı bağlantısı henüz kurulmadı.' : fallback;
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
