import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton so the app shell can render before real credentials exist.
// Screens must call getSupabase() at usage time, never at module top level.
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey || url.startsWith('REPLACE') || anonKey.startsWith('REPLACE')) {
      throw new Error(
        'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env (see .env.example).'
      );
    }
    client = createClient(url, anonKey);
  }
  return client;
}
