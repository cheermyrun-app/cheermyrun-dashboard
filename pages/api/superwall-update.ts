import type { NextApiRequest, NextApiResponse } from 'next';

// This endpoint receives fresh Superwall data posted from the user's browser
// The browser has the session cookie, so it can call Superwall RPC directly
// Then POSTs the results here to be cached and served to the dashboard

// In-memory cache (persists for the lifetime of the serverless function)
// For production, this should use KV storage, but this works for now
let cache: any = null;
let lastUpdate: string | null = null;

function extract(arr: any[]) {
  if (!Array.isArray(arr)) return {};
  const m: Record<string, number> = {};
  arr.forEach(i => { if (i?.key) m[i.key] = i.value?.value ?? i.value; });
  return m;
}

function period(m: Record<string, number>) {
  return {
    proceeds:     Math.round((m.grossProceeds     ?? 0) * 100) / 100,
    newUsers:     m.newUsers          ?? 0,
    conversions:  m.transactionCompletes ?? 0,
    initialConvs: m.initialConversions  ?? 0,
    paywallRate:  Math.round((m.paywallRate    ?? 0) * 10000) / 100,
    convRate:     Math.round((m.initialConvRate ?? 0) * 10000) / 100,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — return cached data
  if (req.method === 'GET') {
    if (!cache) {
      return res.status(200).json({ connected: false, lastUpdate: null, hint: 'Open superwall.com in Chrome — the dashboard will auto-fetch fresh data.' });
    }
    return res.status(200).json({ connected: true, lastUpdate, ...cache });
  }

  // POST — receive fresh data from browser
  if (req.method === 'POST') {
    const { secret, data, fetchedAt } = req.body;
    if (secret !== 'cmr_sw_2026') return res.status(401).json({ error: 'unauthorized' });
    if (!data || !Array.isArray(data)) return res.status(400).json({ error: 'invalid data' });

    const [r7d, r30d, r90d, rCamp, rTxn] = data;

    const m7  = extract(r7d?.result?.data  ?? []);
    const m30 = extract(r30d?.result?.data ?? []);
    const m90 = extract(r90d?.result?.data ?? []);

    // Campaigns
    const campData = rCamp?.result?.data ?? {};
    const campNames: Record<string,string> = {
      '43913': 'Example Campaign',
      '49473': 'Transaction Abandoned',
      '63927': 'Discount Offer',
    };
    const campaigns = Object.entries(campData).map(([id, c]: [string, any]) => ({
      id, name: campNames[id] || id,
      users:    c.paywallUsers?.value    ?? 0,
      convs:    c.transactionCompletes?.value ?? 0,
      convRate: Math.round((c.paywallConvRate?.value ?? 0) * 10000) / 100,
      proceeds: Math.round((c.totalProceeds?.value ?? c.grossProceeds?.value ?? 0) * 100) / 100,
    }));

    // Transactions
    const txns = (rTxn?.result?.transactions ?? []).slice(0, 20).map((t: any) => ({
      userId:   String(t.userId || t.appUserId || '').substring(0, 8),
      product:  String(t.productId || '').replace('cheer_my_run_', '').replace(/_plan$/, '').replace(/_discount$/, ' desc.'),
      proceeds: t.proceeds ?? 0,
      type:     t.type,
      time:     t.eventTime,
      campaign: t.placementIdentifier,
    }));

    cache = {
      ios: {
        appId: 22399,
        last7d:  period(m7),
        last30d: period(m30),
        last90d: period(m90),
      },
      campaigns,
      recentTransactions: txns,
    };
    lastUpdate = fetchedAt || new Date().toISOString();

    return res.status(200).json({ ok: true, lastUpdate, proceeds30d: cache.ios.last30d.proceeds });
  }

  return res.status(405).end();
}
