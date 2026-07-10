import type { Report } from './reports';

// Coarse same-spot grouping for the "this is a repeat problem" signal
// (PRD §8/§12). CLAUDE.md: group by neighborhood or coarse coordinate rounding,
// NOT a spatial radius query — no PostGIS. Reports are stored at 3-decimal
// (~110 m) precision, so same category + same rounded spot = the same recurring
// problem reported more than once.

type Located = Pick<Report, 'category' | 'latitude' | 'longitude'>;

export function clusterKey(r: Located): string {
  return `${r.category}|${r.latitude.toFixed(3)}|${r.longitude.toFixed(3)}`;
}

// key → how many reports sit in that cluster. Used to badge ledger rows.
export function clusterCounts(reports: Report[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const r of reports) {
    const k = clusterKey(r);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

export type ReportCluster = {
  key: string;
  latitude: number;
  longitude: number;
  reports: Report[];
  count: number;
  status: 'open' | 'resolved'; // open if ANY report in the cluster is still open
  representative: Report; // the pin's tap target — the OLDEST report in the cluster
};

// One entry per distinct spot+category. Input is sorted created_at desc, so the
// representative (pin tap target) is the LAST element = the oldest report — the
// origin of the recurring problem, whose "İlk bildirilme" answers PRD story 4's
// "how long has this spot been a problem".
export function clusterReports(reports: Report[]): ReportCluster[] {
  const groups = new Map<string, Report[]>();
  for (const r of reports) {
    const k = clusterKey(r);
    const arr = groups.get(k);
    if (arr) arr.push(r);
    else groups.set(k, [r]);
  }
  const clusters: ReportCluster[] = [];
  for (const [key, rs] of groups) {
    clusters.push({
      key,
      latitude: rs[0].latitude,
      longitude: rs[0].longitude,
      reports: rs,
      count: rs.length,
      status: rs.some((r) => r.status === 'open') ? 'open' : 'resolved',
      representative: rs[rs.length - 1],
    });
  }
  return clusters;
}
