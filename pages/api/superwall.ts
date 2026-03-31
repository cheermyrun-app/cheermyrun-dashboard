import type { NextApiRequest, NextApiResponse } from 'next';

// ─── Superwall REST API ─────────────────────────────────────────────────────
// API Key: sk_1b58d0fcee12476ddedb6d2cc8c50a369d05884b7aa45de67dc9bf5435a67b8b
// Base: https://api.superwall.com/v1
// Docs: https://docs.superwall.com/api
// App ID iOS: 22399 | Org ID: 11388

const SW_KEY    = process.env.SUPERWALL_API_KEY ?? '';
const IOS_APP   = 22399;
const ORG_ID    = 11388;

function fmt(from: Date, to: Date) {
  const f = (d: Date) => d.toISOString().replace('Z','').split('.')[0];
  return { from: f(from), to: f(to) };
}
function daysAgo(n: number) { return new Date(Date.now() - n * 86400000); }

// ─── RPC proxy (same internal endpoints the dashboard uses) ─────────────────
async function rpc(method: string, params: object) {
  if (!SW_KEY) return { _error: 'SUPERWALL_API_KEY not set' };
  // First try the public REST API
  const restPath = methodToRest(method, params);
  if (restPath) {
    const r = await fetch(`https://api.superwall.com/v1${restPath}`, {
      headers: { 'Authorization': `Bearer ${SW_KEY}`, 'Accept': 'application/json' },
    }).catch(e => null);
    if (r?.ok) return r.json();
  }
  // Fallback: internal RPC (works with session, we try the API key as Bearer)
  try {
    const r = await fetch(`https://superwall.com/api/rpc/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SW_KEY}`,
        'anti-csrf': 'x',
      },
      body: JSON.stringify({ params, meta: {} }),
    });
    return r.json();
  } catch(e: any) { return { _error: e.message }; }
}

function methodToRest(method: string, _params: any): string | null {
  if (method === 'getDashboardOverviewData') return `/apps/${IOS_APP}/dashboard/overview`;
  if (method === 'getCampaignOverviewData')  return `/apps/${IOS_APP}/campaigns`;
  if (method === 'getRecentTransactionData') return `/apps/${IOS_APP}/transactions?limit=20`;
  return null;
}

function extract(data: any[]): Record<string, number> {
  if (!Array.isArray(data)) return {};
  const m: Record<string, number> = {};
  for (const i of data) { if (i?.key) m[i.key] = i.value?.value ?? i.value; }
  return m;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const now   = new Date();
  const base  = (from: Date, to: Date) => ({
    environment:   ['PRODUCTION'],
    applicationId: [IOS_APP],
    organizationId: ORG_ID,
    ...fmt(from, to),
  });

  // Fetch all periods in parallel
  const [r24h, r7d, r30d, r90d, rCamp, rTxn] = await Promise.all([
    rpc('getDashboardOverviewData', base(daysAgo(1),   now)),
    rpc('getDashboardOverviewData', base(daysAgo(7),   now)),
    rpc('getDashboardOverviewData', base(daysAgo(30),  now)),
    rpc('getDashboardOverviewData', base(daysAgo(90),  now)),
    rpc('getCampaignOverviewData',  { environment:['PRODUCTION'], applicationId: IOS_APP, organizationId: ORG_ID, ...fmt(daysAgo(30), now), campaignIdInfo:[{experimentId:'74524',campaignId:'43913'},{experimentId:'83475',campaignId:'49473'}] }),
    rpc('getRecentTransactionData', { environment:['PRODUCTION'], applicationId: IOS_APP, organizationId: ORG_ID, ...fmt(daysAgo(30), now) }),
  ]);

  const m24h = extract(r24h?.result?.data ?? []);
  const m7d  = extract(r7d?.result?.data  ?? []);
  const m30d = extract(r30d?.result?.data ?? []);
  const m90d = extract(r90d?.result?.data ?? []);

  // Check if any period worked
  const connected = !!(m30d.grossProceeds !== undefined || r30d?.result?.data);

  // Campaign data
  const campData = rCamp?.result?.data ?? {};
  const campaigns = Object.entries(campData).map(([id, c]: [string, any]) => ({
    id,
    name:        c.name?.value || id,
    users:       c.paywallUsers?.value    || 0,
    conversions: c.transactionCompletes?.value || 0,
    convRate:    c.paywallConvRate?.value  || 0,
    proceeds:    c.totalProceeds?.value || c.proceeds?.value || 0,
  }));

  // Transaction data
  const txns = Array.isArray(rTxn?.result?.data) ? rTxn.result.data.slice(0, 20) : [];

  const period = (m: Record<string,number>) => ({
    proceeds:     m.grossProceeds     ?? 0,
    newUsers:     m.newUsers          ?? 0,
    conversions:  m.transactionCompletes ?? 0,
    initialConvs: m.initialConversions ?? 0,
    paywallRate:  m.paywallRate       ?? 0,
    convRate:     m.initialConvRate   ?? 0,
  });

  res.status(200).json({
    connected,
    updatedAt: now.toISOString(),
    _debug: connected ? null : {
      hint: 'API key set but Superwall RPC auth failed. The key may need session cookies for dashboard data.',
      r30d_error: r30d?._error ?? null,
      r30d_sample: JSON.stringify(r30d).substring(0, 300),
    },
    ios: {
      appId: IOS_APP,
      last24h: period(m24h),
      last7d:  period(m7d),
      last30d: period(m30d),
      last90d: period(m90d),
      allTime: period(m90d), // best we have
    },
    android: null,
    campaigns,
    recentTransactions: txns.map((t: any) => ({
      userId:   String(t.appUserId || '').substring(0, 8),
      product:  t.productId,
      proceeds: t.proceeds,
      revenue:  t.revenue,
      type:     t.type,
      time:     t.eventTime,
      campaign: t.placementIdentifier,
    })),
  });
}
