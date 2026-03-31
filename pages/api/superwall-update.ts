import type { NextApiRequest, NextApiResponse } from 'next';

// ── Superwall live snapshot ──────────────────────────────────────────────────
// Updated: 2026-03-31T01:04:31Z  (auto-refreshed via POST from browser)
// To refresh: open superwall.com in Chrome, the dashboard auto-POSTs new data

const SNAPSHOT = {
  fetchedAt: "2026-03-31T01:04:31Z",
  ios: {
    appId: 22399,
    last24h: { proceeds: 131.49,  newUsers: 31,   conversions: 9,   paywallRate: 83.87, convRate: 25.81 },
    last7d:  { proceeds: 1149.33, newUsers: 281,  conversions: 77,  paywallRate: 0,     convRate: 19.93 },
    last30d: { proceeds: 4391.37, newUsers: 2358, conversions: 326, paywallRate: 76.97, convRate: 12.72 },
    last90d: { proceeds: 7635.92, newUsers: 4712, conversions: 592, paywallRate: 0,     convRate: 11.67 },
  },
  android: { appId: null, last7d: { proceeds: 120, newUsers: 0, conversions: 0, paywallRate: 0, convRate: 0 } },
  campaigns: [
    { id: "43913", name: "Example Campaign",        users: 1978, convs: 184, convRate: 9.3,  proceeds: 2277.75 },
    { id: "49473", name: "Transaction Abandoned",   users: 1329, convs: 142, convRate: 10.68, proceeds: 2177.87 },
  ],
  recentTransactions: [
    { userId: "69cad3f4", product: "annual discount", proceeds: 26.35,  type: "Direct Sub Start", time: "2026-03-30T12:49:00", campaign: "paywall_decline" },
    { userId: "69cab4f4", product: "annual",          proceeds: 39.99,  type: "Direct Sub Start", time: "2026-03-30T10:34:00", campaign: "campaign_trigger" },
    { userId: "6977a772", product: "weekly",          proceeds: 2.99,   type: "Renewal",          time: "2026-03-30T09:44:00", campaign: "campaign_trigger" },
    { userId: "69ca9df4", product: "annual discount", proceeds: 12.50,  type: "Direct Sub Start", time: "2026-03-30T09:04:00", campaign: "paywall_decline" },
    { userId: "694429f2", product: "monthly",         proceeds: 9.99,   type: "Direct Sub Start", time: "2026-03-30T07:20:00", campaign: "campaign_trigger" },
    { userId: "69ca61f2", product: "annual discount", proceeds: 24.99,  type: "Direct Sub Start", time: "2026-03-30T04:42:00", campaign: "paywall_decline" },
    { userId: "69ca34f2", product: "monthly",         proceeds: 6.03,   type: "Direct Sub Start", time: "2026-03-30T01:32:00", campaign: "campaign_trigger" },
    { userId: "69c8b557", product: "monthly",         proceeds: 0,      type: "Sub Cancel",       time: "2026-03-29T15:00:00", campaign: "campaign_trigger" },
    { userId: "69c9c6f1", product: "annual discount", proceeds: 24.99,  type: "Direct Sub Start", time: "2026-03-29T19:00:00", campaign: "paywall_decline" },
    { userId: "69c9b8ee", product: "annual discount", proceeds: 24.99,  type: "Direct Sub Start", time: "2026-03-29T20:00:00", campaign: "paywall_decline" },
  ],
};

// In-memory override (lasts until next cold start)
let liveOverride: any = null;
let liveUpdatedAt: string | null = null;

function extract(arr: any[]) {
  if (!Array.isArray(arr)) return {};
  const m: Record<string, number> = {};
  arr.forEach((i: any) => { if (i?.key) m[i.key] = i.value?.value ?? i.value; });
  return m;
}
function period(m: Record<string, number>) {
  return {
    proceeds:     Math.round((m.grossProceeds      ?? 0) * 100) / 100,
    newUsers:     m.newUsers           ?? 0,
    conversions:  m.transactionCompletes ?? 0,
    paywallRate:  Math.round((m.paywallRate     ?? 0) * 10000) / 100,
    convRate:     Math.round((m.initialConvRate ?? 0) * 10000) / 100,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — return live override if available, else snapshot
  if (req.method === 'GET') {
    const data = liveOverride || SNAPSHOT;
    const updatedAt = liveUpdatedAt || SNAPSHOT.fetchedAt;
    return res.status(200).json({ connected: true, live: !!liveOverride, updatedAt, ...data });
  }

  // POST — receive fresh data from browser and update in-memory cache
  if (req.method === 'POST') {
    const { secret, data, fetchedAt } = req.body;
    if (secret !== 'cmr_sw_2026') return res.status(401).json({ error: 'unauthorized' });
    if (!data || !Array.isArray(data)) return res.status(400).json({ error: 'invalid data' });

    const m1d  = extract(data[0]?.result?.data ?? []);
    const m7d  = extract(data[1]?.result?.data ?? []);
    const m30d = extract(data[2]?.result?.data ?? []);
    const m90d = extract(data[3]?.result?.data ?? []);

    const campData = data[4]?.result?.data ?? {};
    const campNames: Record<string,string> = { '43913':'Example Campaign','49473':'Transaction Abandoned','63927':'Discount Offer' };
    const campaigns = Object.entries(campData).map(([id, c]: [string, any]) => ({
      id, name: campNames[id] || id,
      users:    c.paywallUsers?.value ?? 0,
      convs:    c.transactionCompletes?.value ?? 0,
      convRate: Math.round((c.paywallConvRate?.value ?? 0) * 10000) / 100,
      proceeds: Math.round((c.totalProceeds?.value ?? 0) * 100) / 100,
    }));

    const txns = (data[5]?.result?.transactions ?? []).slice(0, 15).map((t: any) => ({
      userId:   String(t.userId || t.appUserId || '').substring(0, 8),
      product:  String(t.productId || '').replace('cheer_my_run_','').replace(/_plan.*/,'').replace(/_/g,' '),
      proceeds: t.proceeds ?? 0,
      type:     t.type,
      time:     t.eventTime,
      campaign: t.placementIdentifier,
    }));

    liveOverride = {
      ios: { appId: 22399, last24h: period(m1d), last7d: period(m7d), last30d: period(m30d), last90d: period(m90d) },
      campaigns,
      recentTransactions: txns,
    };
    liveUpdatedAt = fetchedAt || new Date().toISOString();

    return res.status(200).json({ ok: true, live: true, updatedAt: liveUpdatedAt, proceeds30d: liveOverride.ios.last30d.proceeds });
  }

  return res.status(405).end();
}
