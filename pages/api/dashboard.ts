import type { NextApiRequest, NextApiResponse } from 'next';
import { getMixpanelEvents, getMixpanelRetention } from '../../lib/mixpanel';
import { getSuperwallMRR, getSuperwallChurn, getSuperwallSubscribers, getSuperwallRevenue } from '../../lib/superwall';
import { format, subDays, subMonths } from 'date-fns';

function dateStr(d: Date) { return format(d, 'yyyy-MM-dd'); }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const days = parseInt((req.query.days as string) || '30');
  const today = new Date();
  const fromDate = dateStr(subDays(today, days));
  const toDate = dateStr(today);
  const from6m = dateStr(subMonths(today, 6));

  const [mrrData, churnData, subscribersData, revenueData, appOpenEvents, cheerEvents, runEvents, retentionData] = await Promise.allSettled([
    getSuperwallMRR(), getSuperwallChurn(), getSuperwallSubscribers(), getSuperwallRevenue(from6m, toDate),
    getMixpanelEvents(fromDate, toDate, ['App Open']),
    getMixpanelEvents(fromDate, toDate, ['Cheer Sent', 'cheer_sent', 'send_cheer']),
    getMixpanelEvents(fromDate, toDate, ['Run Started', 'run_started', 'race_started']),
    getMixpanelRetention(fromDate, toDate),
  ]);

  const get = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? r.value : null;
  const mrr = get(mrrData); const churn = get(churnData); const subscribers = get(subscribersData);

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).json({
    period: { from: fromDate, to: toDate, days },
    revenue: { mrr: mrr?.mrr ?? mrr?.data?.mrr ?? null, arr: mrr?.arr ?? null },
    churn: { rate: churn?.churn_rate ?? churn?.data?.churn_rate ?? null },
    subscribers: { total: subscribers?.total ?? subscribers?.data?.length ?? null, active: subscribers?.active ?? null },
    revenueHistory: get(revenueData)?.data ?? null,
    engagement: { appOpens: get(appOpenEvents)?.data ?? null, cheers: get(cheerEvents)?.data ?? null, runs: get(runEvents)?.data ?? null },
    retention: get(retentionData)?.data ?? null,
    sources: {
      superwall: mrr !== null ? 'connected' : 'error',
      mixpanel: get(appOpenEvents) !== null ? 'connected' : 'error',
      appsflyer: process.env.APPSFLYER_API_TOKEN ? 'connected' : 'not_configured'
    }
  });
}