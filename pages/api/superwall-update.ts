import type { NextApiRequest, NextApiResponse } from 'next';

let cache: any = null;
let lastUpdate: string | null = null;

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
    initialConvs: m.initialConversions  ?? 0,
    paywallRate:  Math.round((m.paywallRate     ?? 0) * 10000) / 100,
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
    if (!cache) return res.status(200).json({ connected: false, lastUpdate: null });
    return res.status(200).json({ connected: true, lastUpdate, ...cache });
  }

  // POST — receive fresh data from browser
  if (req.method === 'POST') {
    const { secret, data, fetchedAt } = req.body;
    if (secret !== 'cmr_sw_2026') return res.status(401).json({ error: 'unauthorized' });
    if (!data || !Array.isArray(data)) return res.status(400).json({ error: 'invalid data' });

    // Index: 0=1d, 1=7d, 2=30d, 3=90d, 4=campaigns, 5=transactions
    const m1d  = extract(data[0]?.result?.data ?? []);
    const m7d  = extract(data[1]?.result?.data ?? []);
    const m30d = extract(data[2]?.result?.data ?? []);
    const m90d = extract(data[3]?.result?.data ?? []);

    const campData = data[4]?.result?.data ?? {};
    const campNames: Record<string,string> = {
      '43913': 'Example Campaign',
      '49473': 'Transaction Abandoned',
      '63927': 'Discount Offer',
    };
    const campaigns = Object.entries(campData).map(([id, c]: [string, any]) => ({
      id, name: campNames[id] || id,
      users:    c.paywallUsers?.value ?? 0,
      convs:    c.transactionCompletes?.value ?? 0,
      convRate: Math.round((c.paywallConvRate?.value ?? 0) * 10000) / 100,
      proceeds: Math.round((c.totalProceeds?.value ?? c.grossProceeds?.value ?? 0) * 100) / 100,
    }));

    const txns = (data[5]?.result?.transactions ?? []).slice(0, 20).map((t: any) => ({
      userId:   String(t.userId || t.appUserId || '').substring(0, 8),
      product:  String(t.productId || '').replace('cheer_my_run_', '').replace(/_plan.*/, '').replace(/_/g, ' '),
      proceeds: t.proceeds ?? 0,
      type:     t.type,
      time:     t.eventTime,
      campaign: t.placementIdentifier,
    }));

    cache = {
      ios: {
        appId: 22399,
        last24h: period(m1d),
        last7d:  period(m7d),
        last30d: period(m30d),
        last90d: period(m90d),
      },
      campaigns,
      recentTransactions: txns,
    };
    lastUpdate = fetchedAt || new Date().toISOString();
    return res.status(200).json({ ok: true, lastUpdate, proceeds30d: cache.ios.last30d.proceeds });
  }

  return res.status(405).end();
}
