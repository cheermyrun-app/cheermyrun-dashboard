import type { NextApiRequest, NextApiResponse } from 'next';
import { format, subDays } from 'date-fns';

const MIXPANEL_SECRET = process.env.MIXPANEL_SECRET!;
const BASE = 'https://data.mixpanel.com/api/2.0';

function dateStr(d: Date) { return format(d, 'yyyy-MM-dd'); }

function authHeader() {
  return { Authorization: 'Basic ' + Buffer.from(MIXPANEL_SECRET + ':').toString('base64') };
}

// Query multiple events in one call, returns raw series data
async function queryEvents(fromDate: string, toDate: string, eventNames: string[]) {
  const params = new URLSearchParams({
    event: JSON.stringify(eventNames),
    from_date: fromDate,
    to_date: toDate,
    unit: 'day',
    type: 'general',
  });
  try {
    const res = await fetch(`${BASE}/events/?${params}`, { headers: authHeader() });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Query segmentation: event broken down by a user property
async function querySeg(fromDate: string, toDate: string, event: string, property: string) {
  const params = new URLSearchParams({
    event,
    from_date: fromDate,
    to_date: toDate,
    on: `properties["${property}"]`,
    unit: 'day',
    type: 'general',
  });
  try {
    const res = await fetch(`${BASE}/segmentation/?${params}`, { headers: authHeader() });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Sum all values across all events in a batch response, for a specific event name
function sumEvent(data: any, eventName: string): number {
  if (!data?.data?.series) return 0;
  const series = data.data.series[eventName];
  if (!series) return 0;
  return Object.values(series as Record<string, number>).reduce((s, v) => s + (Number(v) || 0), 0);
}

// Get daily series for one event from a batch response
function dailySeries(data: any, eventName: string): Record<string, number> {
  const series = data?.data?.series?.[eventName];
  if (!series) return {};
  // Only return dates with data
  const result: Record<string, number> = {};
  for (const [date, val] of Object.entries(series as Record<string, number>)) {
    if (Number(val) > 0) result[date] = Number(val);
  }
  return result;
}

// Collapse segmentation into { label: total }
function collapseSeg(data: any): Record<string, number> {
  if (!data?.data?.series) return {};
  const result: Record<string, number> = {};
  for (const [label, days] of Object.entries(data.data.series as Record<string, Record<string, number>>)) {
    if (!label || label === 'undefined' || label === 'null' || label === '(not set)') continue;
    const total = Object.values(days).reduce((s, v) => s + (Number(v) || 0), 0);
    if (total > 0) result[label] = total;
  }
  return result;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Cache for 5 minutes
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const days = Math.min(Number(req.query.days) || 30, 90);
  const today = new Date();
  const from = dateStr(subDays(today, days));
  const to = dateStr(today);
  const prevFrom = dateStr(subDays(today, days * 2));
  const prevTo = dateStr(subDays(today, days));

  try {
    // BATCH 1: Core product events (Analytics V2 exact names)
    const [
      batch1,       // run_started, run_completed
      batch2,       // cheer_received, cheer_favorited, cheer_replayed
      batch3,       // app_opened, onboarding_started, onboarding_completed, paywall_presented, subscription_started
      prevBatch1,   // previous period: run_started
      prevBatch2,   // previous period: subscription_started, cheer_received
    ] = await Promise.all([
      queryEvents(from, to, ['run_started', 'run_completed']),
      queryEvents(from, to, ['cheer_received', 'cheer_favorited', 'cheer_replayed']),
      queryEvents(from, to, ['app_opened', 'onboarding_started', 'onboarding_completed', 'paywall_presented', 'subscription_started']),
      queryEvents(prevFrom, prevTo, ['run_started']),
      queryEvents(prevFrom, prevTo, ['subscription_started', 'cheer_received']),
    ]);

    // BATCH 2: ICP segmentations — only if subscription_started has data
    const totalSubs = sumEvent(batch3, 'subscription_started');

    // Always query segmentations (they'll return empty if no data)
    const [
      segGender,
      segAgeGroup,
      segRunningLevel,
      segWatchBrand,
      segUsageIntent,
      segDiscovery,
      segPlanType,
      segRunClub,
    ] = await Promise.all([
      querySeg(from, to, 'subscription_started', 'gender'),
      querySeg(from, to, 'subscription_started', 'age_group'),
      querySeg(from, to, 'subscription_started', 'running_level'),
      querySeg(from, to, 'subscription_started', 'watch_brand'),
      querySeg(from, to, 'subscription_started', 'usage_intent'),
      querySeg(from, to, 'subscription_started', 'discovery_source'),
      querySeg(from, to, 'subscription_started', 'plan_type'),
      querySeg(from, to, 'subscription_started', 'run_club_member'),
    ]);

    // Core totals
    const totalRuns = sumEvent(batch1, 'run_started');
    const totalRunsCompleted = sumEvent(batch1, 'run_completed');
    const totalCheersReceived = sumEvent(batch2, 'cheer_received');
    const totalCheersFavorited = sumEvent(batch2, 'cheer_favorited');
    const totalCheersReplayed = sumEvent(batch2, 'cheer_replayed');
    const totalAppOpens = sumEvent(batch3, 'app_opened');
    const totalOnboardingStarted = sumEvent(batch3, 'onboarding_started');
    const totalOnboardingCompleted = sumEvent(batch3, 'onboarding_completed');
    const totalPaywall = sumEvent(batch3, 'paywall_presented');

    // Previous period
    const prevRuns = sumEvent(prevBatch1, 'run_started');
    const prevSubs = sumEvent(prevBatch2, 'subscription_started');
    const prevCheers = sumEvent(prevBatch2, 'cheer_received');

    // Delta helper
    const delta = (curr: number, prev: number) =>
      prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null;

    // Rate helpers
    const rate = (a: number, b: number) =>
      b > 0 ? Math.round((a / b) * 100) : null;

    res.status(200).json({
      period: { from, to, days },
      sources: {
        mixpanel: MIXPANEL_SECRET ? 'connected' : 'not_configured',
        appsflyer: 'not_configured',
      },

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

      deltas: {
        runs: delta(totalRuns, prevRuns),
        subscriptions: delta(totalSubs, prevSubs),
        cheers: delta(totalCheersReceived, prevCheers),
      },

      funnel: {
        onboardingCompletionRate: rate(totalOnboardingCompleted, totalOnboardingStarted),
        paywallConversionRate: rate(totalSubs, totalPaywall),
        runCompletionRate: rate(totalRunsCompleted, totalRuns),
        cheerFavoriteRate: rate(totalCheersFavorited, totalCheersReceived),
        cheerReplayRate: rate(totalCheersReplayed, totalCheersReceived),
      },

      // Daily series for charts (only non-zero dates)
      series: {
        runs: dailySeries(batch1, 'run_started'),
        runsCompleted: dailySeries(batch1, 'run_completed'),
        subscriptions: dailySeries(batch3, 'subscription_started'),
        cheers: dailySeries(batch2, 'cheer_received'),
        appOpens: dailySeries(batch3, 'app_opened'),
      },

      // ICP — paying users segmented by onboarding properties
      icp: {
        byGender: collapseSeg(segGender),
        byAgeGroup: collapseSeg(segAgeGroup),
        byRunningLevel: collapseSeg(segRunningLevel),
        byWatchBrand: collapseSeg(segWatchBrand),
        byUsageIntent: collapseSeg(segUsageIntent),
        byDiscovery: collapseSeg(segDiscovery),
        byPlanType: collapseSeg(segPlanType),
        byRunClub: collapseSeg(segRunClub),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message, stack: err.stack?.substring(0, 300) });
  }
}
