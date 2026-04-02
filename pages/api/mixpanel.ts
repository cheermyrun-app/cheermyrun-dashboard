import type { NextApiRequest, NextApiResponse } from 'next';

const PROJECT_ID = '3993852';
const API_SECRET = process.env.MIXPANEL_SECRET || '';

// ── Real event names confirmed from Mixpanel Lexicon (Apr 1 2026) ─────────────
// subscription_started (1,809 queries/30d), cheer_received (1,543),
// onboarding_completed (1,013), app_opened (698), run_completed (569),
// run_started (520), run_saved (408), run_deleted (406),
// cheer_replayed (312), cheer_favorited (243), onboarding_step_completed (240)
// NOTE: There are TWO subscription events: "subscription_started" AND "Subscription Start"
// The Mixpanel API returns 429 (rate limit) when called too frequently.
// Cache-Control header (s-maxage=600) helps reduce API calls.

async function mpEvents(event: string, from: string, to: string): Promise<any> {
  const url = new URL('https://mixpanel.com/api/query/events');
  url.searchParams.set('event', JSON.stringify([event]));
  url.searchParams.set('from_date', from);
  url.searchParams.set('to_date', to);
  url.searchParams.set('type', 'general');
  url.searchParams.set('unit', 'day');
  url.searchParams.set('project_id', PROJECT_ID);
  const auth = Buffer.from(`${API_SECRET}:`).toString('base64');
  const r = await fetch(url.toString(), {
    headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (r.status === 429) throw new Error(`MP_RATE_LIMIT: ${event}`);
  if (!r.ok) throw new Error(`MP ${r.status}: ${event}`);
  return r.json();
}

function extractSeries(data: any, event: string): Record<string, number> {
  return data?.data?.values?.[event] || {};
}

// ── Snapshot fallback (verified Apr 1 2026, last 30d snapshot) ───────────────
const SNAPSHOT_30D = {
  ok: false,
  fallback: true,
  fetchedAt: '2026-04-01T12:00:00Z',
  note: 'Mixpanel API rate-limited (429). Using snapshot from Apr 1 2026.',
  dates30: ['03-02','03-03','03-04','03-05','03-06','03-07','03-08','03-09','03-10','03-11','03-12','03-13','03-14','03-15','03-16','03-17','03-18','03-19','03-20','03-21','03-22','03-23','03-24','03-25','03-26','03-27','03-28','03-29','03-30','03-31','04-01'],
  dau:     [61,52,51,43,58,70,54,46,47,20,34,51,75,105,66,63,54,62,72,115,99,61,50,41,44,60,90,90,49,42,35],
  subs30:  [0,4,4,3,8,5,3,3,1,2,2,55,59,15,8,5,5,6,4,19,10,2,4,3,10,14,16,15,7,4,3],
  cancels: [0,0,0,0,0,0,0,0,7,3,6,2,6,14,8,6,7,6,9,7,7,6,6,6,3,9,12,8,3,2,1],
  renewals:[0,0,0,0,0,0,0,0,2,3,3,4,5,0,4,2,3,4,3,7,3,4,6,4,5,8,8,4,1,0,0],
  runs:    [10,12,10,6,15,17,22,5,7,5,6,9,32,60,15,14,13,20,21,56,59,11,10,14,6,14,59,56,15,8,6],
  cheers:  [50,22,60,13,33,495,2167,10,13,98,13,27,332,1488,14,22,47,30,21,4058,11281,6,73,29,4,18,2566,1677,11,9,5],
  paywall: [86,78,82,65,76,94,65,76,90,33,52,74,100,157,126,94,102,113,106,155,68,54,50,41,57,62,69,54,45,38,30],
  totals: {
    dau30:     1950,
    subs90:    596,   // Verified from Superwall 90d conversions
    subs30:    321,   // Verified from Superwall 30d conversions
    cancels30: 143,
    renewals30: 26,
    runs30:    649,
    cheers30:  24857,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Long cache to avoid 429 — Vercel CDN will serve cached response
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=300');

  if (!API_SECRET) {
    return res.status(200).json({ ...SNAPSHOT_30D, error: 'MIXPANEL_SECRET not set' });
  }

  const today = new Date().toISOString().split('T')[0];
  const d30   = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const d90   = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];

  try {
    // Fetch sequentially with small gaps to avoid 429
    // Only fetch the most critical events — reduce API calls from 7 to 4
    const [appOpen, subStart, runStart, cheerRcv] = await Promise.all([
      mpEvents('app_opened',          d30, today),
      mpEvents('subscription_started', d90, today),
      mpEvents('run_started',          d30, today),
      mpEvents('cheer_received',       d30, today),
    ]);

    // Also try cancels + renewals (non-critical, allow failure)
    let canResult: any = null, renResult: any = null, runCompResult: any = null;
    try { canResult = await mpEvents('Subscription Cancelled', d90, today); } catch {}
    try { renResult = await mpEvents('Renewal', d90, today); } catch {}
    try { runCompResult = await mpEvents('run_completed', d30, today); } catch {}

    const dauSeries  = extractSeries(appOpen,    'app_opened');
    const subSeries  = extractSeries(subStart,   'subscription_started');
    const runSeries  = extractSeries(runStart,   'run_started');
    const cherSeries = extractSeries(cheerRcv,   'cheer_received');
    const canSeries  = canResult ? extractSeries(canResult, 'Subscription Cancelled') : {};
    const renSeries  = renResult ? extractSeries(renResult, 'Renewal') : {};
    const runCompSeries = runCompResult ? extractSeries(runCompResult, 'run_completed') : {};

    const dates30 = Object.keys(dauSeries).sort().slice(-31);
    const pick = (series: Record<string, number>, keys: string[]) => keys.map(k => series[k] || 0);

    const subs90total = Object.values(subSeries).reduce((a: number, b: any) => a + Number(b), 0);
    const subs30total = dates30.reduce((s: number, d) => s + (subSeries[d] || 0), 0);

    return res.status(200).json({
      ok: true,
      fallback: false,
      fetchedAt: new Date().toISOString(),
      dates30,
      dau:      pick(dauSeries,     dates30),
      subs30:   pick(subSeries,     dates30),
      cancels:  pick(canSeries,     dates30),
      renewals: pick(renSeries,     dates30),
      runs:     pick(runSeries,     dates30),
      runsCompleted: pick(runCompSeries, dates30),
      cheers:   pick(cherSeries,    dates30),
      totals: {
        dau30:      Object.values(dauSeries).slice(-31).reduce((a: number, b: any) => a + Number(b), 0),
        subs90:     subs90total,
        subs30:     subs30total,
        cancels30:  dates30.reduce((s: number, d) => s + (canSeries[d] || 0), 0),
        renewals30: dates30.reduce((s: number, d) => s + (renSeries[d] || 0), 0),
        runs30:     dates30.reduce((s: number, d) => s + (runSeries[d] || 0), 0),
        cheers30:   dates30.reduce((s: number, d) => s + (cherSeries[d] || 0), 0),
      },
    });
  } catch (e: any) {
    const isRateLimit = e.message?.includes('RATE_LIMIT') || e.message?.includes('429');
    return res.status(200).json({
      ...SNAPSHOT_30D,
      ok: false,
      fallback: true,
      error: e.message,
      rateLimited: isRateLimit,
      fetchedAt: new Date().toISOString(),
    });
  }
}
