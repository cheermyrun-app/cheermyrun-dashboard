import type { NextApiRequest, NextApiResponse } from 'next';
import { getSuperwallMRR, getSuperwallSubscribers } from '../../lib/superwall';
import { getMixpanelEvents } from '../../lib/mixpanel';
import { format, subDays } from 'date-fns';

function dateStr(d: Date) { return format(d, 'yyyy-MM-dd'); }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const today = new Date();
  const thisWeekFrom = dateStr(subDays(today, 7));
  const thisWeekTo = dateStr(today);
  const lastWeekFrom = dateStr(subDays(today, 14));
  const lastWeekTo = dateStr(subDays(today, 7));

  const [mrrNow, subsNow, cheerNow, cheerPrev, runNow, runPrev] = await Promise.allSettled([
    getSuperwallMRR(), getSuperwallSubscribers(),
    getMixpanelEvents(thisWeekFrom, thisWeekTo, ['Cheer Sent', 'cheer_sent']),
    getMixpanelEvents(lastWeekFrom, lastWeekTo, ['Cheer Sent', 'cheer_sent']),
    getMixpanelEvents(thisWeekFrom, thisWeekTo, ['Run Started', 'run_started']),
    getMixpanelEvents(lastWeekFrom, lastWeekTo, ['Run Started', 'run_started']),
  ]);

  const get = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? r.value : null;

  const sumEvents = (data: any): number => {
    if (!data?.data?.series) return 0;
    let total = 0;
    for (const v of Object.values(data.data.series) as any[]) {
      for (const n of Object.values(v as object)) {
        total += Number(n) || 0;
      }
    }
    return total;
  };

  const mrr = get(mrrNow);
  const subs = get(subsNow);
  const cheersThis = sumEvents(get(cheerNow));
  const cheersLast = sumEvents(get(cheerPrev));
  const runsThis = sumEvents(get(runNow));
  const runsLast = sumEvents(get(runPrev));
  const pct = (a: number, b: number) => b === 0 ? null : Math.round(((a - b) / b) * 100);

  res.status(200).json({
    generatedAt: new Date().toISOString(),
    weekLabel: thisWeekFrom + ' to ' + thisWeekTo,
    revenue: { mrr: mrr?.mrr ?? mrr?.data?.mrr ?? null, activeSubscribers: subs?.active ?? subs?.total ?? null },
    engagement: {
      cheersThisWeek: cheersThis, cheersLastWeek: cheersLast, cheersDelta: pct(cheersThis, cheersLast),
      runsThisWeek: runsThis, runsLastWeek: runsLast, runsDelta: pct(runsThis, runsLast)
    },
    text: 'WEEKLY REPORT - CHEER MY RUN\nWeek: ' + thisWeekFrom + ' to ' + thisWeekTo
  });
}
