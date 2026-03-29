import type { NextApiRequest, NextApiResponse } from 'next';
import { format, subDays } from 'date-fns';

const MIXPANEL_SECRET = process.env.MIXPANEL_SECRET!;
const BASE = 'https://data.mixpanel.com/api/2.0';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');

  const days = Math.min(Number(req.query.days) || 30, 90);
  const today = new Date();
  const from = format(subDays(today, days), 'yyyy-MM-dd');
  const to = format(today, 'yyyy-MM-dd');

  const auth = 'Basic ' + Buffer.from(MIXPANEL_SECRET + ':').toString('base64');

  // Query 1: just run_started — simplest possible
  const params1 = new URLSearchParams({
    event: JSON.stringify(['run_started']),
    from_date: from,
    to_date: to,
    unit: 'day',
    type: 'general',
  });

  let raw1: any = null;
  let error1: string | null = null;
  let status1 = 0;

  try {
    const r1 = await fetch(`${BASE}/events/?${params1}`, {
      headers: { Authorization: auth },
    });
    status1 = r1.status;
    raw1 = await r1.json();
  } catch (e: any) {
    error1 = e.message;
  }

  // Extract from raw — try all possible locations
  const possibleLocations = {
    'data.values.run_started': raw1?.data?.values?.run_started,
    'data.series': raw1?.data?.series,
    'data.values': raw1?.data?.values ? Object.keys(raw1.data.values) : null,
    'top_level_keys': raw1 ? Object.keys(raw1) : null,
    'error': raw1?.error,
    'status': raw1?.status,
  };

  // Sum if we found it
  const runData = raw1?.data?.values?.run_started;
  const total = runData
    ? Object.values(runData as Record<string, number>).reduce((s, v) => s + (Number(v) || 0), 0)
    : 0;

  res.status(200).json({
    period: { from, to, days },
    mixpanel_status: status1,
    mixpanel_error: error1,
    total_runs: total,
    has_secret: !!MIXPANEL_SECRET,
    secret_length: MIXPANEL_SECRET?.length ?? 0,
    debug: possibleLocations,
    // First 3 dates of run_started if found
    sample: runData
      ? Object.entries(runData as Record<string, number>)
          .filter(([, v]) => Number(v) > 0)
          .slice(0, 5)
      : null,
  });
}
