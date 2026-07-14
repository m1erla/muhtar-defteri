import { Linking } from 'react-native';

import { getCategory, type CategorySlug } from './categories';
import { getDraft } from './report-draft';
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
  contact_whatsapp: string | null; // tappable wa.me line (ALO 153); usually null
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

// wa.me deep link from a Turkish number. Strips formatting and normalises to the
// 90-prefixed international form wa.me expects (a local "0535…" → "90535…").
export function whatsappHref(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, '');
  const intl = digits.startsWith('90')
    ? digits
    : digits.startsWith('0')
      ? `90${digits.slice(1)}`
      : `90${digits}`;
  return `https://wa.me/${intl}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

// A ready-to-send Turkish message for the WhatsApp hand-off and the copy button.
// It is plainly the resident's OWN message to the channel — Mahalle Defteri never
// submits on their behalf. Includes an OSM location link when the draft has
// coordinates.
//
// The category is passed in, not read from the draft. routing-result resolves it
// from the URL param precisely BECAUSE the draft doesn't survive a reload, a
// shared link, or the resetDraft() that add-to-map does on submit — and this
// helper used to read the draft alone, so on all three paths the screen showed
// the right channel while the WhatsApp prefill said "Bir sorun". The description
// and coordinates genuinely only live in the draft (report-draft.ts: a refresh
// restarts the flow), so they're appended only when they're actually there.
export function buildReportMessage(category: CategorySlug): string {
  const d = getDraft();
  const label = getCategory(category)?.label ?? 'Bir sorun';
  const lines = [`Merhaba, ${label} ile ilgili bir bildirim iletmek istiyorum.`];
  const desc = d.description?.trim();
  if (desc) lines.push(desc);
  if (d.latitude != null && d.longitude != null) {
    lines.push(
      `Konum: https://www.openstreetmap.org/?mlat=${d.latitude}&mlon=${d.longitude}#map=18/${d.latitude}/${d.longitude}`
    );
  }
  return lines.join('\n');
}
