import type { NextApiRequest, NextApiResponse } from 'next';
import { format, subDays } from 'date-fns';

const MIXPANEL_SECRET = process.env.MIXPANEL_SECRET;
const SUPERWALL_API_KEY = process.env.SUPERWALL_API_KEY;

function dateStr(d: Date) { return format(d, 'yyyy-MM-dd'); }

// Query Mixpanel event counts with daily breakdown
async function queryMixpanel(events: string[], from: string, to: string) {
  if (!MIXPANEL_SECRET) return null;
  const params = new URLSearchParams({
    event: JSON.stringify(events),
    from_date: from,
    to_date: to,
    type: 'general',
    unit: 'day',
  });
  try {
    const res = await fetch(`https://data.mixpanel.com/api/2.0/events?${params}`, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(MIXPANEL_SECRET + ':').toString('base64'),
        'Accept': 'application/json',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch { return null; }
}

// Query Mixpanel user property segmentation
async function querySegmentation(event: string, prop: string, from: string, to: string) {
  if (!MIXPANEL_SECRET) return null;
  const params = new URLSearchParams({
    event,
    on: `properties["${prop}"]`,
    from_date: from,
    to_date: to,
    type: 'general',
    unit: 'month',
  });
  try {
    const res = await fetch(`https://data.mixpanel.com/api/2.0/segmentation?${params}`, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(MIXPANEL_SECRET + ':').toString('base64'),
        'Accept': 'application/json',
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// Sum all values in a Mixpanel events response
function sumEvents(data: any): number {
  if (!data?.data?.values) return 0;
  let total = 0;
  for (const ev of Object.values(data.data.values) as any[]) {
    for (const n of Object.values(ev)) total += Number(n) || 0;
  }
  return total;
}

// Get daily series for a specific event name
function getDailySeries(data: any, eventName: string): Record<string, number> {
  if (!data?.data?.values?.[eventName]) return {};
  return data.data.values[eventName];
}

// Sum segmentation data into { label: count }
function sumSegmentation(data: any): Record<string, number> {
  if (!data?.data?.values) return {};
  const result: Record<string, number> = {};
  for (const [segment, days] of Object.entries(data.data.values) as any[]) {
    result[segment] = Object.values(days).reduce((s: number, n: any) => s + (Number(n) || 0), 0);
  }
  return result;
}

async function getSuperwallData() {
  if (!SUPERWALL_API_KEY) return null;
  try {
    const res = await fetch('https://api.superwall.com/api/v1/subscribers?status=active&limit=1', {
      headers: { 'Authorization': `Bearer ${SUPERWALL_API_KEY}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch { return null; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const days = Number(req.query.days) || 30;
  const to = dateStr(new Date());
  const from = dateStr(subDays(new Date(), days));

  // Batch all V2 event names from Analytics V2 spec
  const [
    coreEvents,
    cheerEvents,
    funnelEvents,
    appOpenData,
    superwallData,
    // Segmentation by user properties
    genderRunStarted,
    ageGroupRunStarted,
    runLevelRunStarted,
    watchBrandRunStarted,
    genderSubscription,
    ageGroupSubscription,
    hourRunStarted,
    dayRunStarted,
    usageIntentSub,
  ] = await Promise.all([
    // Core product events (V2 exact names)
    queryMixpanel(['run_started', 'run_completed', 'run_saved', 'run_deleted'], from, to),
    // Emotional engagement events
    queryMixpanel(['cheer_received', 'cheer_favorited', 'cheer_replayed'], from, to),
    // Funnel events
    queryMixpanel(['onboarding_started', 'onboarding_completed', 'paywall_presented', 'subscription_started'], from, to),
    // DAU/MAU via app_opened
    queryMixpanel(['app_opened'], from, to),
    // Superwall
    getSuperwallData(),
    // ICP segmentation - only for events we know exist
    querySegmentation('run_started', 'gender', from, to),
    querySegmentation('run_started', 'age_group', from, to),
    querySegmentation('run_started', 'running_level', from, to),
    querySegmentation('run_started', 'watch_brand', from, to),
    querySegmentation('subscription_started', 'gender', from, to),
    querySegmentation('subscription_started', 'age_group', from, to),
    querySegmentation('run_started', 'local_hour', from, to),
    querySegmentation('run_started', 'local_day_of_week', from, to),
    querySegmentation('subscription_started', 'usage_intent', from, to),
  ]);

  // Extract counts
  const runStartedTotal = sumEvents({ data: { values: { run_started: getDailySeries(coreEvents, 'run_started') } } });
  const runCompletedTotal = sumEvents({ data: { values: { run_completed: getDailySeries(coreEvents, 'run_completed') } } });
  const runSavedTotal = sumEvents({ data: { values: { run_saved: getDailySeries(coreEvents, 'run_saved') } } });
  const cheerReceivedTotal = sumEvents({ data: { values: { cheer_received: getDailySeries(cheerEvents, 'cheer_received') } } });
  const cheerFavoritedTotal = sumEvents({ data: { values: { cheer_favorited: getDailySeries(cheerEvents, 'cheer_favorited') } } });
  const cheerReplayedTotal = sumEvents({ data: { values: { cheer_replayed: getDailySeries(cheerEvents, 'cheer_replayed') } } });
  const onboardingStarted = sumEvents({ data: { values: { onboarding_started: getDailySeries(funnelEvents, 'onboarding_started') } } });
  const onboardingCompleted = sumEvents({ data: { values: { onboarding_completed: getDailySeries(funnelEvents, 'onboarding_completed') } } });
  const paywallPresented = sumEvents({ data: { values: { paywall_presented: getDailySeries(funnelEvents, 'paywall_presented') } } });
  const subscriptionStarted = sumEvents({ data: { values: { subscription_started: getDailySeries(funnelEvents, 'subscription_started') } } });
  const appOpenedTotal = sumEvents(appOpenData);

  res.status(200).json({
    period: { from, to, days },
    sources: {
      mixpanel: MIXPANEL_SECRET ? 'connected' : 'not_configured',
      superwall: SUPERWALL_API_KEY ? (superwallData ? 'connected' : 'error') : 'not_configured',
      appsflyer: 'not_configured',
    },
    // Core product
    runs: {
      started: runStartedTotal || null,
      completed: runCompletedTotal || null,
      saved: runSavedTotal || null,
      completionRate: runStartedTotal > 0 && runCompletedTotal > 0 ? Math.round((runCompletedTotal / runStartedTotal) * 100) : null,
      saveRate: runStartedTotal > 0 && runSavedTotal > 0 ? Math.round((runSavedTotal / runStartedTotal) * 100) : null,
      dailySeries: getDailySeries(coreEvents, 'run_started'),
      completedSeries: getDailySeries(coreEvents, 'run_completed'),
    },
    // Emotional engagement
    cheers: {
      received: cheerReceivedTotal || null,
      favorited: cheerFavoritedTotal || null,
      replayed: cheerReplayedTotal || null,
      favoriteRate: cheerReceivedTotal > 0 && cheerFavoritedTotal > 0 ? Math.round((cheerFavoritedTotal / cheerReceivedTotal) * 100) : null,
      replayRate: cheerReceivedTotal > 0 && cheerReplayedTotal > 0 ? Math.round((cheerReplayedTotal / cheerReceivedTotal) * 100) : null,
      dailySeries: getDailySeries(cheerEvents, 'cheer_received'),
    },
    // Funnel
    funnel: {
      onboardingStarted: onboardingStarted || null,
      onboardingCompleted: onboardingCompleted || null,
      paywallPresented: paywallPresented || null,
      subscriptionStarted: subscriptionStarted || null,
      onboardingCompletionRate: onboardingStarted > 0 && onboardingCompleted > 0 ? Math.round((onboardingCompleted / onboardingStarted) * 100) : null,
      paywallConversionRate: paywallPresented > 0 && subscriptionStarted > 0 ? Math.round((subscriptionStarted / paywallPresented) * 100) : null,
    },
    // DAU
    engagement: {
      appOpened: appOpenedTotal || null,
      appOpenedSeries: getDailySeries(appOpenData, 'app_opened'),
    },
    // ICP segmentation (real user properties from onboarding)
    icp: {
      genderByRun: sumSegmentation(genderRunStarted),
      ageGroupByRun: sumSegmentation(ageGroupRunStarted),
      runLevelByRun: sumSegmentation(runLevelRunStarted),
      watchBrandByRun: sumSegmentation(watchBrandRunStarted),
      genderBySubscription: sumSegmentation(genderSubscription),
      ageGroupBySubscription: sumSegmentation(ageGroupSubscription),
      hourByRun: sumSegmentation(hourRunStarted),
      dayByRun: sumSegmentation(dayRunStarted),
      usageIntentBySubscription: sumSegmentation(usageIntentSub),
    },
    // Superwall raw
    superwall: superwallData,
  });
}
