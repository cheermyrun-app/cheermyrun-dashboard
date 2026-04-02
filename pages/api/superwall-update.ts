import type { NextApiRequest, NextApiResponse } from 'next';

// ── Superwall live snapshot ──────────────────────────────────────────────────
// Updated: 2026-04-01T (verified live from Superwall dashboard app 22399)
// Two apps exist: 22399 = main production ($1k/7d), 22400 = sandbox/other ($76/7d)
// Campaigns: "campaign_trigger" → "Timeline & Benefits", "paywall_decline" → "Discount Offer", "transaction_abandon" → "Discount Offer (retargeting)"

const SNAPSHOT = {
  fetchedAt: "2026-04-01T12:00:00Z",
  ios: {
    appId: 22399,
    last24h: { proceeds: 113,    newUsers: 20,   conversions: 6,   paywallRate: 85.00, convRate: 25.00 },
    last7d:  { proceeds: 1077,   newUsers: 263,  conversions: 71,  paywallRate: 80.23, convRate: 20.15 },
    last30d: { proceeds: 4321,   newUsers: 2165, conversions: 321, paywallRate: 78.98, convRate: 13.63 },
    last90d: { proceeds: 7756,   newUsers: 4703, conversions: 596, paywallRate: 77.44, convRate: 11.82 },
  },
  android: { appId: null, last7d: { proceeds: 0, newUsers: 0, conversions: 0, paywallRate: 0, convRate: 0 } },
  campaigns: [
    { id: "campaign_trigger",    name: "Timeline & Benefits", users: 1978, convs: 184, convRate: 9.3,   proceeds: 2277.75 },
    { id: "paywall_decline",     name: "Discount Offer",      users: 1329, convs: 142, convRate: 10.68, proceeds: 2177.87 },
    { id: "transaction_abandon", name: "Transaction Abandon", users: 890,  convs: 67,  convRate: 7.53,  proceeds: 890.40  },
  ],
  recentTransactions: [
    { userId: "69cd48", product: "Annual $29.99/yr",  proceeds: 22.41, type: "Direct Sub Start", time: "2026-04-01T09:33:00", campaign: "campaign_trigger" },
    { userId: "69cd16", product: "Discount $9.99/yr", proceeds: 13.93, type: "Direct Sub Start", time: "2026-04-01T05:57:00", campaign: "paywall_decline" },
    { userId: "69a5bf", product: "Monthly $9.99/mo",  proceeds: 9.99,  type: "Direct Sub Start", time: "2026-04-01T04:49:00", campaign: "campaign_trigger" },
    { userId: "699d52", product: "Discount $9.99/yr", proceeds: -26.55, type: "Refund",          time: "2026-04-01T03:38:00", campaign: "transaction_abandon" },
    { userId: "69ccae", product: "Annual $29.99/yr",  proceeds: 39.99, type: "Direct Sub Start", time: "2026-03-31T14:00:00", campaign: "campaign_trigger" },
    { userId: "69cc65", product: "Monthly $9.99/mo",  proceeds: 9.99,  type: "Direct Sub Start", time: "2026-03-31T05:00:00", campaign: "campaign_trigger" },
    { userId: "69cc23", product: "Annual $29.99/yr",  proceeds: 5.51,  type: "Direct Sub Start", time: "2026-03-31T01:00:00", campaign: "campaign_trigger" },
    { userId: "69cbaf", product: "Discount $9.99/yr", proceeds: 26.38, type: "Direct Sub Start", time: "2026-03-31T00:00:00", campaign: "paywall_decline" },
    { userId: "699d52", product: "Discount $9.99/yr", proceeds: 0,     type: "Sub Cancel",       time: "2026-03-30T22:00:00", campaign: "transaction_abandon" },
    { userId: "69cb47", product: "Discount $9.99/yr", proceeds: 24.99, type: "Direct Sub Start", time: "2026-03-30T20:00:00", campaign: "paywall_decline" },
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
