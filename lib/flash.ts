// One-shot UI signal handed across a single client-side navigation — e.g.
// add-to-map → map-list, to show a "record added" toast exactly once.
//
// Deliberately NOT a URL param: a param is bookmarkable and survives reloads, so
// the toast would re-appear on back-nav / refresh / shared link. Module state is
// consumed once and resets on a full page reload, which is exactly the intended
// "only right after the action" lifetime.
let reportAdded = false;

export function signalReportAdded() {
  reportAdded = true;
}

// Returns true at most once per signal, then clears the flag.
export function consumeReportAdded(): boolean {
  const v = reportAdded;
  reportAdded = false;
  return v;
}
