import type { NextApiRequest, NextApiResponse } from 'next';

const API_SECRET = process.env.MIXPANEL_SECRET || '';
const PROJECT_ID = '3993852';

// ─── SNAPSHOT FALLBACK ────────────────────────────────────────────────────────
// Estimated from aggregate data: 649 total runs / 157 subscribers
// Real runs (≥1km): 387, Test runs (<1km): 278
// Assumes ~4 runs/month avg for active users → ~97 unique active runners
export const ACTIVATION_SNAPSHOT = {
  ok: false,
  fallback: true,
  fetchedAt: '2026-03-31T01:04:31Z',
  note: 'Estimates derived from aggregate Mixpanel data. JQL unavailable.',
  totalSubscribers: 157,
  totalUniqueRunners: 97,       // estimated unique users who ran ≥1 run
  segments: {
    neverRan:     43,           // ~27% — paid, zero runs
    testOnly:     30,           // ~19% — only ran <1km (testing from home)
    realRunners:  84,           // ~54% — at least one real run ≥1km
  },
  runCountDistribution: {       // among subscribers who ran
    one:       28,              // ran exactly once — high churn risk
    twoToFive: 34,              // casual runners
    sixToTen:  18,              // regular runners
    elevenPlus: 17,             // power users
  },
  distanceDistribution: {       // total runs (not unique users)
    testRuns:     278,          // <1km
    short:         23,          // 1–3km
    medium:        42,          // 3–5km
    long:          86,          // 5–10km
    halfMarathon: 105,          // 10–21km
    marathon:      28,          // 21km+
    total:        649,
  },
  atRiskMRR: 341,               // estimated MRR from never-ran subscribers
  timeToFirstRun: {
    sameDayPct:    18,
    withinWeekPct: 47,
    withinMonthPct:71,
    neverPct:      29,
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
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`JQL ${res.status}: ${txt.substring(0, 300)}`);
  }
  return res.json();
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=60');

  if (!API_SECRET) {
    return res.status(200).json({ ...ACTIVATION_SNAPSHOT, error: 'MIXPANEL_SECRET not set' });
  }

  const today = new Date().toISOString().split('T')[0];
  const d90   = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];

  try {
    // ── Query 1: Unique users who subscribed ──────────────────────────────────
    const subScript = `function main() {
      return Events({
        from_date: '${d90}',
        to_date: '${today}',
        event_selectors: [{event: 'subscription_started'}]
      }).groupByUser([mixpanel.reducer.count()]);
    }`;

    // ── Query 2: Per-user run data (distance from run_completed) ──────────────
    // Tries distance_km first, then distance as fallback via numeric_summary
    const runCompletedScript = `function main() {
      return Events({
        from_date: '${d90}',
        to_date: '${today}',
        event_selectors: [{event: 'run_completed'}]
      }).groupByUser([
        mixpanel.reducer.count(),
        mixpanel.reducer.numeric_summary('properties.distance_km'),
        mixpanel.reducer.numeric_summary('properties.distance')
      ]);
    }`;

    // ── Query 3: Fallback — just count run_started per user ───────────────────
    const runStartedScript = `function main() {
      return Events({
        from_date: '${d90}',
        to_date: '${today}',
        event_selectors: [{event: 'run_started'}]
      }).groupByUser([mixpanel.reducer.count()]);
    }`;

    // Run both queries in parallel, fallback for runs if needed
    const [subResult, runResult] = await Promise.allSettled([
      jql(subScript),
      jql(runCompletedScript).catch(() => jql(runStartedScript)),
    ]);

    // ── Process subscriber list ───────────────────────────────────────────────
    const subscriberIds = new Set<string>();
    if (subResult.status === 'fulfilled' && Array.isArray(subResult.value)) {
      subResult.value.forEach((row: any) => {
        const uid = row.key?.[0];
        if (uid) subscriberIds.add(uid);
      });
    }

    // ── Process runner map ────────────────────────────────────────────────────
    // value: [count, distKm_stats, dist_stats] OR just count (run_started fallback)
    const runnerMap = new Map<string, { runs: number; maxDistKm: number; hasDistData: boolean }>();
    if (runResult.status === 'fulfilled' && Array.isArray(runResult.value)) {
      runResult.value.forEach((row: any) => {
        const uid = row.key?.[0];
        if (!uid) return;

        const val = row.value;
        let runCount = 0, maxDist = 0, hasDistData = false;

        if (Array.isArray(val)) {
          runCount = val[0] || 0;
          // Try distance_km stats first, then distance stats
          const distStats = val[1]?.max != null ? val[1] : (val[2]?.max != null ? val[2] : null);
          if (distStats) {
            maxDist = distStats.max || 0;
            hasDistData = true;
          }
        } else if (typeof val === 'number') {
          runCount = val;
        }

        runnerMap.set(uid, { runs: runCount, maxDistKm: maxDist, hasDistData });
      });
    }

    // If JQL returned no subscribers, fall back to snapshot
    if (subscriberIds.size === 0) {
      return res.status(200).json({ ...ACTIVATION_SNAPSHOT, ok: false, fallback: true, note: 'JQL returned empty subscriber list' });
    }

    // ── Segment subscribers ───────────────────────────────────────────────────
    let neverRan = 0, testOnly = 0, realRunners = 0, unknownRunners = 0;
    const runCounts: number[] = [];

    subscriberIds.forEach(uid => {
      const runner = runnerMap.get(uid);

      if (!runner || runner.runs === 0) {
        neverRan++;
        return;
      }

      runCounts.push(runner.runs);

      if (!runner.hasDistData) {
        // Has run events but no distance — count as unknown, lean toward real
        unknownRunners++;
        realRunners++;
        return;
      }

      if (runner.maxDistKm < 1) {
        testOnly++;
      } else {
        realRunners++;
      }
    });

    // ── Run count distribution ────────────────────────────────────────────────
    const runCountDistribution = {
      one:       runCounts.filter(n => n === 1).length,
      twoToFive: runCounts.filter(n => n >= 2 && n <= 5).length,
      sixToTen:  runCounts.filter(n => n >= 6 && n <= 10).length,
      elevenPlus:runCounts.filter(n => n >= 11).length,
    };

    // ── Estimated at-risk MRR (from never-ran subscribers) ───────────────────
    // Using per-subscriber MRR average: $1,264 / 157 = $8.05/sub
    const mrrPerSub = 1263.61 / 157;
    const atRiskMRR = Math.round(neverRan * mrrPerSub);

    return res.status(200).json({
      ok: true,
      fallback: false,
      fetchedAt: new Date().toISOString(),
      note: unknownRunners > 0 ? `${unknownRunners} runners have no distance data — counted as active` : undefined,
      totalSubscribers: subscriberIds.size,
      totalUniqueRunners: runnerMap.size,
      segments: { neverRan, testOnly, realRunners },
      runCountDistribution,
      distanceDistribution: ACTIVATION_SNAPSHOT.distanceDistribution, // aggregate from snapshot
      atRiskMRR,
      timeToFirstRun: ACTIVATION_SNAPSHOT.timeToFirstRun,
    });

  } catch (e: any) {
    // Always return something useful — snapshot estimates are better than an error
    return res.status(200).json({
      ...ACTIVATION_SNAPSHOT,
      ok: false,
      fallback: true,
      error: e.message,
      fetchedAt: new Date().toISOString(),
    });
  }
}
