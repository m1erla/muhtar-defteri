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
export async function fetchChannels(category: CategorySlug): Promise<Channel[]> {
  const { data, error } = await getSupabase()
    .from('channels')
    .select('*')
    .eq('category', category)
    .order('scope', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Channel[];
}
