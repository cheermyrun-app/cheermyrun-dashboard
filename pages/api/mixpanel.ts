import type { NextApiRequest, NextApiResponse } from 'next';

const PROJECT_ID = '3993852';
const API_SECRET = process.env.MIXPANEL_SECRET || '';

async function mpEvents(event: string, from: string, to: string) {
  const url = new URL('https://mixpanel.com/api/query/events');
  url.searchParams.set('event', JSON.stringify([event]));
  url.searchParams.set('from_date', from);
  url.searchParams.set('to_date', to);
  url.searchParams.set('type', 'general');
  url.searchParams.set('unit', 'day');
  url.searchParams.set('project_id', PROJECT_ID);
  const auth = Buffer.from(`${API_SECRET}:`).toString('base64');
  const r = await fetch(url.toString(), { headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' } });
  if (!r.ok) throw new Error(`MP ${r.status}: ${event}`);
  return r.json();
}

function extractSeries(data: any, event: string): Record<string, number> {
  return data?.data?.values?.[event] || {};
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
  if (!API_SECRET) return res.status(500).json({ error: 'MIXPANEL_SECRET not set', fallback: true });

  const today = new Date().toISOString().split('T')[0];
  const d90 = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
  const d30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  try {
    const [appOpen, subStart, subCancel, renewal, runStart, cheerRcv, paywallView] = await Promise.all([
      mpEvents('app_opened', d30, today),
      mpEvents('subscription_started', d90, today),
      mpEvents('Subscription Cancelled', d90, today),
      mpEvents('Renewal', d90, today),
      mpEvents('run_started', d90, today),
      mpEvents('cheer_received', d90, today),
      mpEvents('paywall_open', d30, today),
    ]);

    const dauSeries  = extractSeries(appOpen, 'app_opened');
    const subSeries  = extractSeries(subStart, 'subscription_started');
    const canSeries  = extractSeries(subCancel, 'Subscription Cancelled');
    const renSeries  = extractSeries(renewal, 'Renewal');
    const runSeries  = extractSeries(runStart, 'run_started');
    const cherSeries = extractSeries(cheerRcv, 'cheer_received');
    const paySeries  = extractSeries(paywallView, 'paywall_open');

    const dates30 = Object.keys(dauSeries).sort().slice(-31);
    const dates90 = Object.keys(subSeries).sort();

    const pick = (series: Record<string, number>, keys: string[]) => keys.map(k => series[k] || 0);

    return res.status(200).json({
      ok: true,
      fetchedAt: new Date().toISOString(),
      dates30,
      dau:     pick(dauSeries, dates30),
      subs30:  pick(subSeries, dates30),
      cancels: pick(canSeries, dates30),
      renewals:pick(renSeries, dates30),
      runs:    pick(runSeries, dates30),
      cheers:  pick(cherSeries, dates30),
      paywall: pick(paySeries, dates30),
      totals: {
        dau30:    Object.values(dauSeries).slice(-31).reduce((a:number,b:any)=>a+Number(b),0),
        subs90:   Object.values(subSeries).reduce((a:number,b:any)=>a+Number(b),0),
        subs30:   dates30.reduce((s:number,d)=>s+(subSeries[d]||0),0),
        cancels30:dates30.reduce((s:number,d)=>s+(canSeries[d]||0),0),
        renewals30:dates30.reduce((s:number,d)=>s+(renSeries[d]||0),0),
        runs30:   dates30.reduce((s:number,d)=>s+(runSeries[d]||0),0),
        cheers30: dates30.reduce((s:number,d)=>s+(cherSeries[d]||0),0),
      },
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message, fallback: true });
  }
}
