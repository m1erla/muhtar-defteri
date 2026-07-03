import type { CategorySlug } from './categories';

// In-memory draft for the linear report flow (category → details → routing →
// optional add-to-map). Deliberately not persisted: a page refresh restarts the
// flow, which is fine for a <60s journey and avoids stale half-reports.
export type ReportDraft = {
  category: CategorySlug | null;
  description: string;
  photoUri: string | null;
  latitude: number | null;
  longitude: number | null;
};

const empty = (): ReportDraft => ({
  category: null,
  description: '',
  photoUri: null,
  latitude: null,
  longitude: null,
});

let draft: ReportDraft = empty();

export function getDraft(): ReportDraft {
  return draft;
}

export function updateDraft(patch: Partial<ReportDraft>) {
  draft = { ...draft, ...patch };
}

export function resetDraft() {
  draft = empty();
}
