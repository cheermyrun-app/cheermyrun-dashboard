import type { NextApiRequest, NextApiResponse } from 'next';
import { format, subDays } from 'date-fns';

const MIXPANEL_SECRET = process.env.MIXPANEL_SECRET ?? '';
const BASE = 'https://data.mixpanel.com/api/2.0';

function dateStr(d: Date) { return format(d, 'yyyy-MM-dd'); }
function auth() { return 'Basic ' + Buffer.from(MIXPANEL_SECRET + ':').toString('base64'); }

async function mpEvents(from: string, to: string, events: string[]) {
  const params = new URLSearchParams({ event: JSON.stringify(events), from_date: from, to_date: to, unit: 'day', type: 'general' });
  try {
    const r = await fetch(`${BASE}/events/?${params}`, { headers: { Authorization: auth(), Accept: 'application/json' } });
    const text = await r.text();
    if (!r.ok) return { error: r.status, body: text.substring(0, 300) };
    return JSON.parse(text);
  } catch (e: any) { return { error: e.message }; }
}

async function mpSeg(from: string, to: string, event: string, prop: string) {
  const params = new URLSearchParams({ event, from_date: from, to_date: to, on: `properties["${prop}"]`, unit: 'day', type: 'general' });
  try {
    const r = await fetch(`${BASE}/segmentation/?${params}`, { headers: { Authorization: auth() } });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

function sumVal(data: any, event: string): number {
  const v = data?.data?.values?.[event];
  if (!v) return 0;
  return Object.values(v as Record<string, number>).reduce((s, x) => s + (Number(x) || 0), 0);
}

function daily(data: any, event: string): Record<string, number> {
  const v = data?.data?.values?.[event];
  if (!v) return {};
  const r: Record<string, number> = {};
  for (const [d, n] of Object.entries(v as Record<string, number>)) { if (Number(n) > 0) r[d] = Number(n); }
  return r;
}

function seg(data: any): Record<string, number> {
  const v = data?.data?.values;
  if (!v) return {};
  const r: Record<string, number> = {};
  for (const [k, days] of Object.entries(v as Record<string, Record<string, number>>)) {
    if (!k || k === 'undefined' || k === 'null' || k === '(not set)') continue;
    const t = Object.values(days).reduce((s, x) => s + (Number(x) || 0), 0);
    if (t > 0) r[k] = t;
  }
  return r;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  const days = Math.min(Number(req.query.days) || 30, 90);
  const today = new Date();
  const from = dateStr(subDays(today, days));
  const to = dateStr(today);
  const pFrom = dateStr(subDays(today, days * 2));
  const pTo = dateStr(subDays(today, days));

  const [b1, b2, b3, p1, p2] = await Promise.all([
    mpEvents(from, to, ['run_started', 'run_completed']),
    mpEvents(from, to, ['cheer_received', 'cheer_favorited', 'cheer_replayed']),
    mpEvents(from, to, ['app_opened', 'onboarding_started', 'onboarding_completed', 'paywall_presented', 'subscription_started']),
    mpEvents(pFrom, pTo, ['run_started']),
    mpEvents(pFrom, pTo, ['subscription_started', 'cheer_received']),
  ]);

  const [sGender, sAge, sLevel, sWatch, sIntent, sDisc, sPlan, sClub] = await Promise.all([
    mpSeg(from, to, 'subscription_started', 'gender'),
    mpSeg(from, to, 'subscription_started', 'age_group'),
    mpSeg(from, to, 'subscription_started', 'running_level'),
    mpSeg(from, to, 'subscription_started', 'watch_brand'),
    mpSeg(from, to, 'subscription_started', 'usage_intent'),
    mpSeg(from, to, 'subscription_started', 'discovery_source'),
    mpSeg(from, to, 'subscription_started', 'plan_type'),
    mpSeg(from, to, 'subscription_started', 'run_club_member'),
  ]);

  const runs = sumVal(b1, 'run_started');
  const runsC = sumVal(b1, 'run_completed');
  const subs = sumVal(b3, 'subscription_started');
  const cheers = sumVal(b2, 'cheer_received');
  const cheersF = sumVal(b2, 'cheer_favorited');
  const cheersR = sumVal(b2, 'cheer_replayed');
  const opens = sumVal(b3, 'app_opened');
  const obStart = sumVal(b3, 'onboarding_started');
  const obDone = sumVal(b3, 'onboarding_completed');
  const paywall = sumVal(b3, 'paywall_presented');
  const pRuns = sumVal(p1, 'run_started');
  const pSubs = sumVal(p2, 'subscription_started');
  const pCheers = sumVal(p2, 'cheer_received');

  const d = (a: number, b: number) => b > 0 ? Math.round(((a - b) / b) * 100) : null;
  const rate = (a: number, b: number) => b > 0 ? Math.round((a / b) * 100) : null;

  res.status(200).json({
    period: { from, to, days },
    ok: !b1?.error,
    mixpanel_error: b1?.error ?? null,
    mixpanel_error_body: b1?.body ?? null,
    sources: { mixpanel: b1?.error ? 'error' : 'connected' },
    totals: { runs, runsCompleted: runsC, subscriptions: subs, cheersReceived: cheers, cheersFavorited: cheersF, cheersReplayed: cheersR, appOpens: opens, onboardingStarted: obStart, onboardingCompleted: obDone, paywallPresented: paywall },
    deltas: { runs: d(runs, pRuns), subscriptions: d(subs, pSubs), cheers: d(cheers, pCheers) },
    funnel: { onboardingCompletionRate: rate(obDone, obStart), paywallConversionRate: rate(subs, paywall), runCompletionRate: rate(runsC, runs), cheerFavoriteRate: rate(cheersF, cheers), cheerReplayRate: rate(cheersR, cheers) },
    series: { runs: daily(b1, 'run_started'), subscriptions: daily(b3, 'subscription_started'), cheers: daily(b2, 'cheer_received'), appOpens: daily(b3, 'app_opened') },
    icp: { byGender: seg(sGender), byAgeGroup: seg(sAge), byRunningLevel: seg(sLevel), byWatchBrand: seg(sWatch), byUsageIntent: seg(sIntent), byDiscovery: seg(sDisc), byPlanType: seg(sPlan), byRunClub: seg(sClub) },
  });
}
