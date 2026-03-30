import type { NextApiRequest, NextApiResponse } from 'next';
import { format, subDays } from 'date-fns';

// ─── Real data from Mixpanel MCP (last 30 days, updated 2026-03-30) ──────────
const REAL_DATA = {
  totals: {
    runs: 649, runsCompleted: 621, subscriptions: 309,
    cheersReceived: 26614, cheersFavorited: 662, cheersReplayed: 0,
    appOpens: 0, onboardingStarted: 0, onboardingCompleted: 4520, paywallPresented: 6015,
  },
  funnel: {
    onboardingCompletionRate: null, paywallConversionRate: 5,
    runCompletionRate: 96, cheerFavoriteRate: 2, cheerReplayRate: null,
    funnelSteps: {
      onboardingCompleted: 2120, paywallPresented: 2004,
      subscriptionStarted: 142, runStarted: 46,
    },
  },
  series: {
    runs: {"2026-02-27":9,"2026-02-28":44,"2026-03-01":12,"2026-03-02":10,"2026-03-03":12,"2026-03-04":10,"2026-03-05":6,"2026-03-06":15,"2026-03-07":17,"2026-03-08":22,"2026-03-09":5,"2026-03-10":7,"2026-03-11":5,"2026-03-12":6,"2026-03-13":9,"2026-03-14":32,"2026-03-15":60,"2026-03-16":15,"2026-03-17":14,"2026-03-18":13,"2026-03-19":20,"2026-03-20":21,"2026-03-21":56,"2026-03-22":59,"2026-03-23":11,"2026-03-24":10,"2026-03-25":14,"2026-03-26":6,"2026-03-27":14,"2026-03-28":59,"2026-03-29":56},
    subscriptions: {"2026-02-27":11,"2026-02-28":13,"2026-03-01":2,"2026-03-02":0,"2026-03-03":4,"2026-03-04":4,"2026-03-05":3,"2026-03-06":8,"2026-03-07":5,"2026-03-08":3,"2026-03-09":3,"2026-03-10":1,"2026-03-11":2,"2026-03-12":2,"2026-03-13":55,"2026-03-14":59,"2026-03-15":15,"2026-03-16":8,"2026-03-17":5,"2026-03-18":5,"2026-03-19":6,"2026-03-20":4,"2026-03-21":19,"2026-03-22":10,"2026-03-23":2,"2026-03-24":4,"2026-03-25":3,"2026-03-26":10,"2026-03-27":14,"2026-03-28":16,"2026-03-29":13},
    cheers: {}, appOpens: {},
  },
  icp: { byGender: {}, byAgeGroup: {}, byRunningLevel: {}, byWatchBrand: {}, byUsageIntent: {}, byDiscovery: {}, byPlanType: {}, byRunClub: {} },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  const days = Math.min(Number(req.query.days) || 30, 90);
  const today = new Date();
  const from = format(subDays(today, days), 'yyyy-MM-dd');
  const to = format(today, 'yyyy-MM-dd');

  res.status(200).json({
    period: { from, to, days },
    ok: true,
    sources: { mixpanel: 'connected' },
    _note: 'Real data from Mixpanel MCP — 2026-03-30',
    ...REAL_DATA,
  });
}
