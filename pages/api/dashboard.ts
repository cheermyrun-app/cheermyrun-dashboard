import type { NextApiRequest, NextApiResponse } from 'next';
import { format, subDays } from 'date-fns';

const MIXPANEL_SECRET = process.env.MIXPANEL_SECRET!;
const BASE = 'https://data.mixpanel.com/api/2.0';

function dateStr(d: Date) { return format(d, 'yyyy-MM-dd'); }

function authHeader() {
  return { Authorization: 'Basic ' + Buffer.from(MIXPANEL_SECRET + ':').toString('base64') };
}

// Mixpanel events response shape:
// { data: { series: string[], values: { "event_name": { "YYYY-MM-DD": number } } } }
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
  } catch { return null; }
}

// Mixpanel segmentation response shape:
// { data: { series: string[], values: { "segment_value": { "YYYY-MM-DD": number } } } }
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
  } catch { return null; }
}

// Sum total for one event name from a batch events response
// data.data.values["event_name"]["date"] = count
function sumEvent(data: any, eventName: string): number {
  const eventData = data?.data?.values?.[eventName];
  if (!eventData) return 0;
  return Object.values(eventData as Record<string, number>)
    .reduce((s, v) => s + (Number(v) || 0), 0);
}

// Build daily series { "YYYY-MM-DD": count } for one event, only non-zero
function dailySeries(data: any, eventName: string): Record<string, number> {
  const eventData = data?.data?.values?.[eventName];
  if (!eventData) return {};
  const result: Record<string, number> = {};
  for (const [date, val] of Object.entries(eventData as Record<string, number>)) {
    if (Number(val) > 0) result[date] = Number(val);
  }
  return result;
}

// Collapse segmentation values into { segment_label: total_count }
// data.data.values["segment_value"]["date"] = count
function collapseSeg(data: any): Record<string, number> {
  const values = data?.data?.values;
  if (!values) return {};
  const result: Record<string, number> = {};
  for (const [label, days] of Object.entries(values as Record<string, Record<string, number>>)) {
    if (!label || label === 'undefined' || label === 'null' || label === '(not set)') continue;
    const total = Object.values(days).reduce((s, v) => s + (Number(v) || 0), 0);
    if (total > 0) result[label] = total;
  }
  return result;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const days = Math.min(Number(req.query.days) || 30, 90);
  const today = new Date();
  const from = dateStr(subDays(today, days));
  const to = dateStr(today);
  const prevFrom = dateStr(subDays(today, days * 2));
  const prevTo = dateStr(subDays(today, days));

  try {
    // Batch 1: core product events — all in parallel
    const [
      batch1,     // run_started, run_completed
      batch2,     // cheer_received, cheer_favorited, cheer_replayed
      batch3,     // app_opened, onboarding_started, onboarding_completed, paywall_presented, subscription_started
      prevBatch1, // previous period: run_started
      prevBatch2, // previous period: subscription_started, cheer_received
    ] = await Promise.all([
      queryEvents(from, to, ['run_started', 'run_completed']),
      queryEvents(from, to, ['cheer_received', 'cheer_favorited', 'cheer_replayed']),
      queryEvents(from, to, ['app_opened', 'onboarding_started', 'onboarding_completed', 'paywall_presented', 'subscription_started']),
      queryEvents(prevFrom, prevTo, ['run_started']),
      queryEvents(prevFrom, prevTo, ['subscription_started', 'cheer_received']),
    ]);

    // Batch 2: ICP segmentations by onboarding properties — all in parallel
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

    // Totals from current period
    const totalRuns = sumEvent(batch1, 'run_started');
    const totalRunsCompleted = sumEvent(batch1, 'run_completed');
    const totalSubs = sumEvent(batch3, 'subscription_started');
    const totalCheersReceived = sumEvent(batch2, 'cheer_received');
    const totalCheersFavorited = sumEvent(batch2, 'cheer_favorited');
    const totalCheersReplayed = sumEvent(batch2, 'cheer_replayed');
    const totalAppOpens = sumEvent(batch3, 'app_opened');
    const totalOnboardingStarted = sumEvent(batch3, 'onboarding_started');
    const totalOnboardingCompleted = sumEvent(batch3, 'onboarding_completed');
    const totalPaywall = sumEvent(batch3, 'paywall_presented');

    // Previous period totals for deltas
    const prevRuns = sumEvent(prevBatch1, 'run_started');
    const prevSubs = sumEvent(prevBatch2, 'subscription_started');
    const prevCheers = sumEvent(prevBatch2, 'cheer_received');

    const delta = (curr: number, prev: number) =>
      prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null;

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

      series: {
        runs: dailySeries(batch1, 'run_started'),
        runsCompleted: dailySeries(batch1, 'run_completed'),
        subscriptions: dailySeries(batch3, 'subscription_started'),
        cheers: dailySeries(batch2, 'cheer_received'),
        appOpens: dailySeries(batch3, 'app_opened'),
      },

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

      // Debug: raw response snapshot for troubleshooting
      _debug: {
        batch1_has_data: !!batch1?.data?.values,
        batch1_events: batch1?.data?.values ? Object.keys(batch1.data.values) : [],
        batch3_events: batch3?.data?.values ? Object.keys(batch3.data.values) : [],
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
