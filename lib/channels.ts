import { Linking } from 'react-native';

import type { CategorySlug } from './categories';
import { getSupabase } from './supabase';

// Row shape of the channels table — supabase/schema.sql / PRD §10.
export type Channel = {
  id: string;
  category: CategorySlug;
  name: string;
  scope: 'national' | 'adana';
  description: string | null;
  contact_phone: string | null;
  contact_url: string | null;
  required_info: string[] | null;
  notes: string | null;
};

// Adana-scoped channels sort first — the local channel is almost always the
// right first call, national lines are the fallback ('adana' < 'national').
// No category = the full directory (Kanal Rehberi; 21 rows, trivial payload).
export async function fetchChannels(category?: CategorySlug): Promise<Channel[]> {
  let query = getSupabase()
    .from('channels')
    .select('*')
    .order('scope', { ascending: true })
    .order('name', { ascending: true });
  if (category) query = query.eq('category', category);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Channel[];
}

// Channel rows come from the DB — only ever open web URLs from them. The one
// scheme guard for every screen that renders a channel's contact_url.
export function openContactUrl(url: string) {
  if (url.startsWith('https://') || url.startsWith('http://')) {
    Linking.openURL(url);
  }
}
