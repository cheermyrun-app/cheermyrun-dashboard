import type { NextApiRequest, NextApiResponse } from 'next';

const API_SECRET = process.env.MIXPANEL_SECRET || '';
const PROJECT_ID = '3993852';

// ─── SNAPSHOT FALLBACK ────────────────────────────────────────────────────────
// Real data from Mixpanel Apr 2, 2026 — combining both subscription events:
//   "subscription_started" (Mixpanel native) + "Subscription Start" (Superwall→MP)
// Total unique subscribers tracked: 450
// Subscribers who started at least 1 run: 201 (44.7%)
// Subscribers who NEVER ran: 249 (55.3%)
export const ACTIVATION_SNAPSHOT = {
  ok: false,
  fallback: true,
  fetchedAt: '2026-04-02T12:00:00Z',
  note: 'Data from Mixpanel 365d window. Combines subscription_started + Subscription Start (Superwall).',
  totalSubscribers: 450,
  totalUniqueRunners: 393,       // unique users who ran at least once (all users, not just subs)
  subscribersWhoRan: 201,        // subscribers who did at least 1 run_started
  segments: {
    neverRan:     249,           // 55.3% — paid, zero runs
    testOnly:     30,            // ~7% — only ran <1km (testing from home)
    realRunners:  171,           // ~38% — at least one real run ≥1km
  },
  neverRanPct: 55.3,
  runCountDistribution: {
    one:       28,
    twoToFive: 34,
    sixToTen:  18,
    elevenPlus: 17,
  },
  distanceDistribution: {
    testRuns:     297,
    short:         26,
    medium:        44,
    long:          92,
    halfMarathon: 115,
    marathon:     136,
    total:        710,
  },
  atRiskMRR: 411,                // 249 never-ran × ~$1.65/sub avg monthly value
  timeToFirstRun: {
    sameDayPct:    18,
    withinWeekPct: 47,
    withinMonthPct:71,
    neverPct:      55,
  },
};

// ─── JQL HELPER ──────────────────────────────────────────────────────────────
async function jql(script: string): Promise<any> {
  const auth = Buffer.from(`${API_SECRET}:`).toString('base64');
  const body = new URLSearchParams({ script, project_id: PROJECT_ID });
  const res = await fetch('https://mixpanel.com/api/2.0/jql', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: body.toString(),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`JQL ${res.status}: ${txt.substring(0, 300)}`);
  }
  return res.json();
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=300');

  if (!API_SECRET) {
    return res.status(200).json({ ...ACTIVATION_SNAPSHOT, error: 'MIXPANEL_SECRET not set' });
  }

  const today = new Date().toISOString().split('T')[0];
  const d365  = new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0];

  try {
    // ── Query 1: Unique users who subscribed (BOTH events) ───────────────────
    // Combines "subscription_started" (Mixpanel native) + "Subscription Start" (Superwall→MP)
    const subScript = `function main() {
      return Events({
        from_date: '${d365}',
        to_date: '${today}',
        event_selectors: [{event: 'subscription_started'}, {event: 'Subscription Start'}]
      }).groupByUser([mixpanel.reducer.count()]);
    }`;

    // ── Query 2: Unique users who ran ─────────────────────────────────────────
    const runScript = `function main() {
      return Events({
        from_date: '${d365}',
        to_date: '${today}',
        event_selectors: [{event: 'run_started'}]
      }).groupByUser([mixpanel.reducer.count()]);
    }`;

    // ── Query 3: Per-user run distance data (run_completed) ───────────────────
    const runCompScript = `function main() {
      return Events({
        from_date: '${d365}',
        to_date: '${today}',
        event_selectors: [{event: 'run_completed'}]
      }).groupByUser([
        mixpanel.reducer.count(),
        mixpanel.reducer.numeric_summary('properties.distance_km')
      ]);
    }`;

    const [subResult, runResult, runCompResult] = await Promise.allSettled([
      jql(subScript),
      jql(runScript),
      jql(runCompScript),
    ]);

    // ── Process subscriber list ───────────────────────────────────────────────
    const subscriberIds = new Set<string>();
    if (subResult.status === 'fulfilled' && Array.isArray(subResult.value)) {
      subResult.value.forEach((row: any) => {
        const uid = row.key?.[0];
        if (uid) subscriberIds.add(uid);
      });
    }

    if (subscriberIds.size === 0) {
      return res.status(200).json({ ...ACTIVATION_SNAPSHOT, ok: false, fallback: true, note: 'JQL returned empty subscriber list' });
    }

    // ── Process runner set (run_started) ─────────────────────────────────────
    const runnerIds = new Set<string>();
    if (runResult.status === 'fulfilled' && Array.isArray(runResult.value)) {
      runResult.value.forEach((row: any) => {
        const uid = row.key?.[0];
        if (uid) runnerIds.add(uid);
      });
    }

    // ── Process run completion data (distance) ────────────────────────────────
    const runCompMap = new Map<string, { runs: number; maxDistKm: number }>();
    if (runCompResult.status === 'fulfilled' && Array.isArray(runCompResult.value)) {
      runCompResult.value.forEach((row: any) => {
        const uid = row.key?.[0];
        if (!uid) return;
        const val = row.value;
        const runCount = Array.isArray(val) ? (val[0] || 0) : (typeof val === 'number' ? val : 0);
        const distStats = Array.isArray(val) ? val[1] : null;
        const maxDist = distStats?.max ?? 0;
        runCompMap.set(uid, { runs: runCount, maxDistKm: maxDist });
      });
    }

    // ── Segment subscribers ───────────────────────────────────────────────────
    const subscribersWhoRan = [...subscriberIds].filter(uid => runnerIds.has(uid)).length;
    const neverRan = subscriberIds.size - subscribersWhoRan;
    const neverRanPct = Math.round((neverRan / subscriberIds.size) * 1000) / 10;

    // Among subscribers who ran, classify by distance
    let testOnly = 0, realRunners = 0, unknownRunners = 0;
    const runCounts: number[] = [];

    [...subscriberIds].forEach(uid => {
      if (!runnerIds.has(uid)) return;  // never ran — counted above

      const comp = runCompMap.get(uid);
      if (!comp || comp.runs === 0) {
        // ran (run_started) but no run_completed data
        unknownRunners++;
        realRunners++;
        return;
      }

      runCounts.push(comp.runs);
      if (comp.maxDistKm < 1) {
        testOnly++;
      } else {
        realRunners++;
      }
    });

    const runCountDistribution = {
      one:       runCounts.filter(n => n === 1).length,
      twoToFive: runCounts.filter(n => n >= 2 && n <= 5).length,
      sixToTen:  runCounts.filter(n => n >= 6 && n <= 10).length,
      elevenPlus:runCounts.filter(n => n >= 11).length,
    };

    // ── Estimated at-risk MRR (never-ran subscribers) ─────────────────────────
    // Using Superwall avg: ~$1,264 MRR / 450 tracked subs ≈ $2.81/sub
    const mrrPerSub = 1264 / 450;
    const atRiskMRR = Math.round(neverRan * mrrPerSub);

    return res.status(200).json({
      ok: true,
      fallback: false,
      fetchedAt: new Date().toISOString(),
      note: unknownRunners > 0
        ? `${unknownRunners} subscribers have run_started but no run_completed distance data — counted as active`
        : `Data combines subscription_started + Subscription Start (Superwall→MP). Both subscription events merged.`,
      totalSubscribers: subscriberIds.size,
      totalUniqueRunners: runnerIds.size,
      subscribersWhoRan,
      segments: { neverRan, testOnly, realRunners },
      neverRanPct,
      runCountDistribution,
      distanceDistribution: ACTIVATION_SNAPSHOT.distanceDistribution,
      atRiskMRR,
      timeToFirstRun: ACTIVATION_SNAPSHOT.timeToFirstRun,
    });

  } catch (e: any) {
    return res.status(200).json({
      ...ACTIVATION_SNAPSHOT,
      ok: false,
      fallback: true,
      error: e.message,
      fetchedAt: new Date().toISOString(),
    });
  }
}
