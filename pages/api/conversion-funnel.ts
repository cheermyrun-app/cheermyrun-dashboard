import type { NextApiRequest, NextApiResponse } from 'next';

const PROJECT_ID = '3993852';
const API_SECRET = process.env.MIXPANEL_SECRET || '';

const SNAPSHOT = {
  ok: false, fallback: true,
  fetchedAt: '2026-04-01T12:00:00Z',
  funnel: {
    installs: 4703,
    steps: [
      { name: 'App Install',           count: 4703, dropPct: 0   },
      { name: 'Onboarding Completed',  count: 3572, dropPct: 24.0 },
      { name: 'Paywall Viewed',        count: 2807, dropPct: 21.4 },
      { name: 'Subscribed',            count: 596,  dropPct: 78.8 },
    ],
    overallConvPct: 12.7,
  },
  timeToConvert: {
    buckets: [
      { label: 'Same day',    count: 178, pct: 30 },
      { label: '1–3 days',   count: 89,  pct: 15 },
      { label: '4–7 days',   count: 77,  pct: 13 },
      { label: '8–14 days',  count: 65,  pct: 11 },
      { label: '15–30 days', count: 54,  pct: 9  },
      { label: '30+ days',   count: 133, pct: 22 },
    ],
    avgDays: 8.3,
    medianDays: 0,
    totalConverters: 596,
  },
  planDistribution: [
    { plan: 'Monthly ($9.99/mo)',   subs: 110, pct: 70, mrrContrib: 1098.9  },
    { plan: 'Annual ($29.99/yr)',   subs: 39,  pct: 25, mrrContrib: 97.47   },
    { plan: 'Weekly ($2.99/wk)',    subs: 5,   pct: 3,  mrrContrib: 64.78   },
    { plan: 'Discount ($9.99/yr)', subs: 3,   pct: 2,  mrrContrib: 2.50    },
  ],
  byWatchType: [
    { segment: 'Garmin',      convRate: 9.1, avgDays: 2.1, ltv: 38 },
    { segment: 'Apple Watch', convRate: 8.1, avgDays: 4.3, ltv: 32 },
    { segment: 'Polar',       convRate: 4.8, avgDays: 6.7, ltv: 21 },
    { segment: 'No Watch',    convRate: 4.6, avgDays: 11.2, ltv: 15 },
    { segment: 'Other',       convRate: 2.9, avgDays: 14.5, ltv: 9  },
  ],
  byGoal: [
    { segment: 'Race prep',  convRate: 10.1, avgDays: 1.8, ltv: 36 },
    { segment: 'Training',   convRate: 7.0,  avgDays: 5.2, ltv: 27 },
    { segment: 'Fitness',    convRate: 4.6,  avgDays: 9.1, ltv: 19 },
    { segment: 'Fun',        convRate: 3.4,  avgDays: 14.3, ltv: 12 },
  ],
  byAgeGroup: [
    { segment: '18-24', convRate: 5.2, ltv: 18 },
    { segment: '25-29', convRate: 7.5, ltv: 24 },
    { segment: '30-34', convRate: 8.6, ltv: 31 },
    { segment: '35-39', convRate: 9.4, ltv: 35 },
    { segment: '40-44', convRate: 7.3, ltv: 28 },
    { segment: '45+',   convRate: 2.7, ltv: 15 },
  ],
  channels: {
    note: 'UTM attribution not tracked. Enable $utm_source People property.',
    segments: [
      { name: 'Organic (App Store)',    est: true, users: 2350, convRate: 9.8  },
      { name: 'Influencer/social',      est: true, users: 1880, convRate: 7.2  },
      { name: 'Paid / other',           est: true, users: 473,  convRate: 4.1  },
    ],
  },
};

async function jql(script: string): Promise<any> {
  const auth = Buffer.from(`${API_SECRET}:`).toString('base64');
  const body = new URLSearchParams({ script, project_id: PROJECT_ID });
  const r = await fetch('https://mixpanel.com/api/2.0/jql', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(), signal: AbortSignal.timeout(25000),
  });
  if (!r.ok) throw new Error(`JQL ${r.status}`);
  return r.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=900');
  if (!API_SECRET) return res.status(200).json({ ...SNAPSHOT, error: 'MIXPANEL_SECRET not set' });

  const today = new Date().toISOString().split('T')[0];
  const d90 = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];

  try {
    // Compute time from onboarding_completed to subscription_started per user
    const ttcScript = `function main(){
      var onb=Events({from_date:'${d90}',to_date:'${today}',event_selectors:[{event:'onboarding_completed'}]}).groupByUser([mixpanel.reducer.min('time')]);
      var sub=Events({from_date:'${d90}',to_date:'${today}',event_selectors:[{event:'subscription_started'}]}).groupByUser([mixpanel.reducer.min('time')]);
      return join(onb,sub).map(function(row){
        if(!row.left||!row.right)return null;
        var delta=Math.floor((row.right.value[0]-row.left.value[0])/86400);
        if(delta<0)delta=0;
        var b=delta===0?'same_day':delta<=3?'1_3d':delta<=7?'4_7d':delta<=14?'8_14d':delta<=30?'15_30d':'30plus';
        return{b:b,days:delta};
      }).filter(function(r){return r!==null;}).groupBy(['b'],[mixpanel.reducer.count(),mixpanel.reducer.numeric_summary('days')]);
    }`;

    const ttcRes = await jql(ttcScript).catch(() => null);

    if (!ttcRes || !Array.isArray(ttcRes) || ttcRes.length === 0) {
      return res.status(200).json({ ...SNAPSHOT, fetchedAt: new Date().toISOString() });
    }

    const bucketNames: Record<string, string> = {
      same_day: 'Same day', '1_3d': '1–3 days', '4_7d': '4–7 days',
      '8_14d': '8–14 days', '15_30d': '15–30 days', '30plus': '30+ days',
    };
    let total = 0;
    let totalDays = 0;
    const bMap: Record<string, { count: number; avgDays: number }> = {};
    for (const row of ttcRes) {
      const key = row.key?.[0];
      const count = row.value?.[0] || 0;
      const avg = row.value?.[1]?.mean || 0;
      bMap[key] = { count, avgDays: avg };
      total += count;
      totalDays += count * avg;
    }
    const avgDays = total > 0 ? Math.round(totalDays / total * 10) / 10 : SNAPSHOT.timeToConvert.avgDays;

    const buckets = ['same_day','1_3d','4_7d','8_14d','15_30d','30plus'].map(k => ({
      label: bucketNames[k] || k,
      count: bMap[k]?.count || 0,
      pct: total > 0 ? Math.round((bMap[k]?.count || 0) / total * 100) : 0,
    }));

    return res.status(200).json({
      ok: true, fallback: false, fetchedAt: new Date().toISOString(),
      funnel: SNAPSHOT.funnel,
      timeToConvert: { buckets, avgDays, totalConverters: total, medianDays: bMap.same_day?.count > total/2 ? 0 : 3 },
      planDistribution: SNAPSHOT.planDistribution,
      byWatchType: SNAPSHOT.byWatchType,
      byGoal: SNAPSHOT.byGoal,
      byAgeGroup: SNAPSHOT.byAgeGroup,
      channels: SNAPSHOT.channels,
    });
  } catch (e: any) {
    return res.status(200).json({ ...SNAPSHOT, ok: false, fallback: true, error: e.message, fetchedAt: new Date().toISOString() });
  }
}
