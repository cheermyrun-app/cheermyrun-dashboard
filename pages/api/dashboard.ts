import type { NextApiRequest, NextApiResponse } from 'next';
import { format, subDays } from 'date-fns';

const MIXPANEL_SECRET = process.env.MIXPANEL_SECRET!;
const BASE = 'https://data.mixpanel.com/api/2.0';

function dateStr(d: Date) { return format(d, 'yyyy-MM-dd'); }

// Query Mixpanel event series
async function queryEvents(fromDate: string, toDate: string, eventNames: string[]) {
  const params = new URLSearchParams({
    event: JSON.stringify(eventNames),
    from_date: fromDate,
    to_date: toDate,
    unit: 'day',
    type: 'general',
  });
  const res = await fetch(`${BASE}/events/?${params}`, {
    headers: { Authorization: 'Basic ' + Buffer.from(MIXPANEL_SECRET + ':').toString('base64') },
  });
  if (!res.ok) return null;
  return res.json();
}

// Query Mixpanel single total count for event
async function queryTotal(fromDate: string, toDate: string, eventNames: string[]) {
  const params = new URLSearchParams({
    event: JSON.stringify(eventNames),
    from_date: fromDate,
    to_date: toDate,
    unit: 'day',
    type: 'general',
  });
  const res = await fetch(`${BASE}/events/?${params}`, {
    headers: { Authorization: 'Basic ' + Buffer.from(MIXPANEL_SECRET + ':').toString('base64') },
  });
  if (!res.ok) return 0;
  const data = await res.json();
  if (!data?.data?.series) return 0;
  return (Object.values(data.data.series) as any[]).reduce((sum: number, ev: any) => {
    return sum + (Object.values(ev) as number[]).reduce((s, v) => s + (Number(v) || 0), 0);
  }, 0);
}

// Query Mixpanel user property segmentation
async function querySegmentation(fromDate: string, toDate: string, event: string, property: string) {
  const params = new URLSearchParams({
    event,
    from_date: fromDate,
    to_date: toDate,
    on: `properties["${property}"]`,
    unit: 'day',
    type: 'general',
  });
  const res = await fetch(`${BASE}/segmentation/?${params}`, {
    headers: { Authorization: 'Basic ' + Buffer.from(MIXPANEL_SECRET + ':').toString('base64') },
  });
  if (!res.ok) return null;
  return res.json();
}

// Collapse segmentation result into { label: count } totals
function collapseSegmentation(data: any): Record<string, number> {
  if (!data?.data?.series) return {};
  const result: Record<string, number> = {};
  for (const [label, days] of Object.entries(data.data.series)) {
    if (!label || label === 'undefined' || label === 'null') continue;
    const total = Object.values(days as Record<string, number>).reduce((s, v) => s + (Number(v) || 0), 0);
    if (total > 0) result[String(label)] = total;
  }
  return result;
}

// Build daily series for charting
function buildDailySeries(data: any, eventName: string): Record<string, number> {
  const series = data?.data?.series?.[eventName];
  if (!series) return {};
  return series;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const days = Math.min(Number(req.query.days) || 30, 180);
  const today = new Date();
  const from = dateStr(subDays(today, days));
  const to = dateStr(today);

  // Previous period for deltas
  const prevFrom = dateStr(subDays(today, days * 2));
  const prevTo = dateStr(subDays(today, days));

  try {
    // Fire all queries in parallel
    const [
      runsData,
      runCompletedData,
      subscriptionData,
      cheerReceivedData,
      cheerFavoritedData,
      cheerReplayedData,
      appOpenedData,
      onboardingData,
      paywallData,
      // Segmentation by user properties
      genderSeg,
      ageGroupSeg,
      runningLevelSeg,
      watchBrandSeg,
      usageIntentSeg,
      runClubSeg,
      discoverySeg,
      planTypeSeg,
      // Previous period
      prevRuns,
      prevSubs,
      prevCheers,
    ] = await Promise.all([
      queryEvents(from, to, ['run_started']),
      queryEvents(from, to, ['run_completed']),
      queryEvents(from, to, ['subscription_started']),
      queryEvents(from, to, ['cheer_received']),
      queryEvents(from, to, ['cheer_favorited']),
      queryEvents(from, to, ['cheer_replayed']),
      queryEvents(from, to, ['app_opened']),
      queryEvents(from, to, ['onboarding_started', 'onboarding_completed', 'paywall_presented']),
      queryEvents(from, to, ['paywall_presented']),
      // Segmentations — using subscription_started to get ICP of PAYING users
      querySegmentation(from, to, 'subscription_started', 'gender'),
      querySegmentation(from, to, 'subscription_started', 'age_group'),
      querySegmentation(from, to, 'subscription_started', 'running_level'),
      querySegmentation(from, to, 'subscription_started', 'watch_brand'),
      querySegmentation(from, to, 'subscription_started', 'usage_intent'),
      querySegmentation(from, to, 'subscription_started', 'run_club_member'),
      querySegmentation(from, to, 'subscription_started', 'discovery_source'),
      querySegmentation(from, to, 'subscription_started', 'plan_type'),
      // Previous period totals for deltas
      queryTotal(prevFrom, prevTo, ['run_started']),
      queryTotal(prevFrom, prevTo, ['subscription_started']),
      queryTotal(prevFrom, prevTo, ['cheer_received']),
    ]);

    // Totals
    const totalRuns = await queryTotal(from, to, ['run_started']);
    const totalRunsCompleted = await queryTotal(from, to, ['run_completed']);
    const totalSubs = await queryTotal(from, to, ['subscription_started']);
    const totalCheersReceived = await queryTotal(from, to, ['cheer_received']);
    const totalCheersFavorited = await queryTotal(from, to, ['cheer_favorited']);
    const totalCheersReplayed = await queryTotal(from, to, ['cheer_replayed']);
    const totalAppOpens = await queryTotal(from, to, ['app_opened']);
    const totalOnboardingStarted = await queryTotal(from, to, ['onboarding_started']);
    const totalOnboardingCompleted = await queryTotal(from, to, ['onboarding_completed']);
    const totalPaywall = await queryTotal(from, to, ['paywall_presented']);

    // Daily series for charts
    const runDailySeries = buildDailySeries(runsData, 'run_started');
    const subDailySeries = buildDailySeries(subscriptionData, 'subscription_started');
    const cheerDailySeries = buildDailySeries(cheerReceivedData, 'cheer_received');
    const appOpenDailySeries = buildDailySeries(appOpenedData, 'app_opened');

    // ICP segmentations
    const byGender = collapseSegmentation(genderSeg);
    const byAgeGroup = collapseSegmentation(ageGroupSeg);
    const byRunningLevel = collapseSegmentation(runningLevelSeg);
    const byWatchBrand = collapseSegmentation(watchBrandSeg);
    const byUsageIntent = collapseSegmentation(usageIntentSeg);
    const byRunClub = collapseSegmentation(runClubSeg);
    const byDiscovery = collapseSegmentation(discoverySeg);
    const byPlanType = collapseSegmentation(planTypeSeg);

    // Funnel rates
    const onboardingCompletionRate = totalOnboardingStarted > 0 ? Math.round((totalOnboardingCompleted / totalOnboardingStarted) * 100) : null;
    const paywallConversionRate = totalPaywall > 0 ? Math.round((totalSubs / totalPaywall) * 100) : null;
    const runCompletionRate = totalRuns > 0 ? Math.round((totalRunsCompleted / totalRuns) * 100) : null;

    // Engagement rates
    const cheerFavoriteRate = totalCheersReceived > 0 ? Math.round((totalCheersFavorited / totalCheersReceived) * 100) : null;
    const cheerReplayRate = totalCheersReceived > 0 ? Math.round((totalCheersReplayed / totalCheersReceived) * 100) : null;

    // Deltas vs previous period
    const delta = (curr: number, prev: number) => prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null;

    res.status(200).json({
      period: { from, to, days },
      sources: { mixpanel: 'connected', superwall: 'not_used', appsflyer: 'not_configured' },

      // Core totals
      totals: {
        runs: totalRuns,
        runsCompleted: totalRunsCompleted,
        subscriptions: totalSubs,
        cheersReceived: totalCheersReceived,
        cheersFavorited: totalCheersFavorited,
        cheersReplayed: totalCheersReplayed,
        appOpens: totalAppOpens,
        onboardingStarted: totalOnboardingStarted,
        onboardingCompleted: totalOnboardingCompleted,
        paywallPresented: totalPaywall,
      },

      // Deltas vs previous period
      deltas: {
        runs: delta(totalRuns, prevRuns),
        subscriptions: delta(totalSubs, prevSubs),
        cheers: delta(totalCheersReceived, prevCheers),
      },

      // Funnel
      funnel: {
        onboardingCompletionRate,
        paywallConversionRate,
        runCompletionRate,
        cheerFavoriteRate,
        cheerReplayRate,
      },

      // Daily series for charts
      series: {
        runs: runDailySeries,
        subscriptions: subDailySeries,
        cheers: cheerDailySeries,
        appOpens: appOpenDailySeries,
      },

      // ICP — paying users segmented by onboarding properties
      icp: {
        byGender,
        byAgeGroup,
        byRunningLevel,
        byWatchBrand,
        byUsageIntent,
        byRunClub,
        byDiscovery,
        byPlanType,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
