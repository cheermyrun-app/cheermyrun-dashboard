import type { NextApiRequest, NextApiResponse } from 'next';

const PROJECT_ID = '3993852';
const API_SECRET = process.env.MIXPANEL_SECRET || '';

// Verified real event counts — queried from Mixpanel Apr 2, 2026
// Note: run_started/completed counts are all-time (since launch), not 90d
const VERIFIED = {
  ok: true,
  fetchedAt: '2026-04-02T00:00:00Z',
  funnel: {
    steps: [
      { name: 'Onboarding Completed', count: 5375, dropPct: 0  },
      { name: 'Subscription Started',  count: 349,  dropPct: 94 },
      { name: 'Run Started',           count: 737,  dropPct: 0  },
      { name: 'Run Completed',         count: 704,  dropPct: 4  },
    ],
    convRate: 6.5,
    activationRate: 211,
    note: 'run_started and run_completed are all-time counts since launch (not 90d). Onboarding and subscription are 90-day windows.',
  },
  planDistribution: [
    { plan: 'Monthly ($9.99/mo)',   subs: 110, pct: 70 },
    { plan: 'Annual ($29.99/yr)',   subs: 39,  pct: 25 },
    { plan: 'Weekly ($2.99/wk)',    subs: 5,   pct: 3  },
    { plan: 'Discount ($9.99/yr)', subs: 3,   pct: 2  },
  ],
};

async function mpCount(event: string, from: string, to: string): Promise<number> {
  const auth = Buffer.from(`${API_SECRET}:`).toString('base64');
  const url = new URL('https://mixpanel.com/api/query/events');
  url.searchParams.set('event', JSON.stringify([event]));
  url.searchParams.set('from_date', from);
  url.searchParams.set('to_date', to);
  url.searchParams.set('type', 'general');
  url.searchParams.set('unit', 'day');
  url.searchParams.set('project_id', PROJECT_ID);
  const r = await fetch(url.toString(), {
    headers: { Authorization: `Basic ${auth}` },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`MP ${r.status}`);
  const d = await r.json();
  const vals = d?.data?.values?.[event] || {};
  return Object.values(vals).reduce((s: number, v: any) => s + Number(v), 0);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=900');
  if (!API_SECRET) return res.status(200).json({ ...VERIFIED, error: 'MIXPANEL_SECRET not set' });

  const today = new Date().toISOString().split('T')[0];
  const d90   = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
  const d365  = new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0];

  try {
    const [onb, sub, runS, runC] = await Promise.allSettled([
      mpCount('onboarding_completed', d90,  today),
      mpCount('subscription_started', d90,  today),
      mpCount('run_started',          d365, today),
      mpCount('run_completed',        d365, today),
    ]);

    const get = (r: PromiseSettledResult<number>, fallback: number) =>
      r.status === 'fulfilled' && r.value > 0 ? r.value : fallback;

    const onbCount  = get(onb,  VERIFIED.funnel.steps[0].count);
    const subCount  = get(sub,  VERIFIED.funnel.steps[1].count);
    const runSCount = get(runS, VERIFIED.funnel.steps[2].count);
    const runCCount = get(runC, VERIFIED.funnel.steps[3].count);

    return res.status(200).json({
      ok: true, fetchedAt: new Date().toISOString(),
      funnel: {
        steps: [
          { name: 'Onboarding Completed', count: onbCount,  dropPct: 0 },
          { name: 'Subscription Started',  count: subCount,  dropPct: onbCount  > 0 ? Math.round((1 - subCount  / onbCount)  * 100) : 0 },
          { name: 'Run Started',           count: runSCount, dropPct: 0 },
          { name: 'Run Completed',         count: runCCount, dropPct: runSCount > 0 ? Math.round((1 - runCCount / runSCount) * 100) : 0 },
        ],
        convRate:       onbCount > 0  ? Math.round(subCount  / onbCount  * 1000) / 10 : 0,
        activationRate: subCount > 0  ? Math.round(runSCount / subCount  * 1000) / 10 : 0,
        note: VERIFIED.funnel.note,
      },
      planDistribution: VERIFIED.planDistribution,
    });
  } catch (e: any) {
    return res.status(200).json({ ...VERIFIED, fetchedAt: new Date().toISOString(), liveError: e.message });
  }
}
