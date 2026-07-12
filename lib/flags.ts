import { getSessionId } from './session';
import { getSupabase } from './supabase';

// User flagging — reporting a problem with an existing report (spam, offensive,
// wrong info, personal data…). Writes to the private `flags` table (owner
// reviews via OPERATIONS.md). Deterministic anti-abuse in the DB; no AI, and
// nothing here deletes a report. Mirrors confirmReport's shape.

export const FLAG_REASONS = [
  { slug: 'spam', label: 'Spam ya da reklam' },
  { slug: 'duplicate', label: 'Zaten var / tekrar kayıt' },
  { slug: 'wrong_info', label: 'Yanlış ya da yanıltıcı bilgi' },
  { slug: 'wrong_location', label: 'Yanlış konum' },
  { slug: 'wrong_category', label: 'Yanlış kategori' },
  { slug: 'offensive', label: 'Uygunsuz ya da saldırgan içerik' },
  { slug: 'personal_info', label: 'Kişisel bilgi görünüyor' },
  { slug: 'resolved', label: 'Sorun zaten çözülmüş' },
  { slug: 'other', label: 'Diğer' },
] as const;

export type FlagReason = (typeof FLAG_REASONS)[number]['slug'];

const UNIQUE_VIOLATION = '23505';

// Records a flag. Returns whether it was NEW — false means this session had
// already flagged this report (23505), which is the same neutral outcome the
// user wanted, not an error. Other DB errors (rate limit, bad detail) throw so
// the screen can surface neutral copy via friendlyDbError.
export async function submitFlag(
  reportId: string,
  reason: FlagReason,
  detail: string
): Promise<boolean> {
  const { error } = await getSupabase().from('flags').insert({
    report_id: reportId,
    reason,
    detail: detail.trim() || null,
    session_id: getSessionId(),
  });
  if (error && error.code !== UNIQUE_VIOLATION) throw new Error(error.message);
  return !error;
}
