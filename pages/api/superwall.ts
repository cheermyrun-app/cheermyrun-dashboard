import type { NextApiRequest, NextApiResponse } from 'next';

// ─── Superwall Live Data ────────────────────────────────────────────────────
// Architecture: 
//   1. Fresh data comes from Superwall RPC (superwall.com/api/rpc/*)
//   2. Auth uses session cookies (HttpOnly) + anti-CSRF token
//   3. The dashboard frontend passes the anti-CSRF token on each request
//   4. Vercel proxies the call with stored session cookie
//   5. Session cookie stored as SUPERWALL_SESSION env var

const CSRF   = process.env.SUPERWALL_CSRF_TOKEN || 'pxg2aqntp1XwWvgx3K5bXzHBs8p7vyO1';
const SESSION = process.env.SUPERWALL_SESSION || '';
const IOS_APP = 22399;
const ORG_ID  = 11388;

async function rpc(method: string, params: object) {
  const headers: Record<string,string> = {
    'Content-Type': 'application/json',
    'anti-csrf': CSRF,
  };
  // If we have a session cookie, use it
  if (SESSION) headers['Cookie'] = `next-auth.session-token=${SESSION}`;
  
  try {
    const r = await fetch(`https://superwall.com/api/rpc/${method}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ params, meta: {} }),
    });
    const json = await r.json();
    return json;
  } catch(e: any) { return { _error: e.message }; }
}

function ex(data: any[]) {
  if (!Array.isArray(data)) return {};
  const m: Record<string,number> = {};
  data.forEach((i: any) => { if (i?.key) m[i.key] = i.value?.value ?? i.value; });
  return m;
}

function range(daysAgo: number) {
  const to   = new Date();
  const from = new Date(Date.now() - daysAgo * 86400000);
  const fmt  = (d: Date) => d.toISOString().split('.')[0];
  return { from: fmt(from), to: fmt(to) };
}

function base(daysAgo: number) {
  return { environment: ['PRODUCTION'], applicationId: [IOS_APP], organizationId: ORG_ID, ...range(daysAgo) };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const [r7d, r30d, r90d, rCamp, rTxn] = await Promise.all([
    rpc('getDashboardOverviewData', base(7)),
    rpc('getDashboardOverviewData', base(30)),
    rpc('getDashboardOverviewData', base(90)),
    rpc('getCampaignOverviewData', {
      environment: ['PRODUCTION'], applicationId: IOS_APP, organizationId: ORG_ID,
      ...range(30),
      campaignIdInfo: [
        { experimentId: '74524', campaignId: '43913' },
        { experimentId: '83475', campaignId: '49473' },
        { experimentId: '83477', campaignId: '49473' },
        { experimentId: '107144', campaignId: '63927' },
      ],
    }),
    rpc('getRecentTransactionData', {
      environment: ['PRODUCTION'], applicationId: IOS_APP, organizationId: ORG_ID,
      ...range(7), eventType: 'all',
    }),
  ]);

  const m7  = ex(r7d?.result?.data  ?? []);
  const m30 = ex(r30d?.result?.data ?? []);
  const m90 = ex(r90d?.result?.data ?? []);

  const connected = (m30.grossProceeds ?? 0) > 0;

  const period = (m: Record<string,number>) => ({
    proceeds:     Math.round((m.grossProceeds ?? 0) * 100) / 100,
    newUsers:     m.newUsers ?? 0,
    conversions:  m.transactionCompletes ?? 0,
    initialConvs: m.initialConversions ?? 0,
    paywallRate:  Math.round((m.paywallRate ?? 0) * 10000) / 100,
    convRate:     Math.round((m.initialConvRate ?? 0) * 10000) / 100,
  });

  // Campaigns
  const campData = rCamp?.result?.data ?? {};
  const campaigns = Object.entries(campData).map(([id, c]: [string, any]) => ({
    id,
    users:    c.paywallUsers?.value ?? 0,
    convs:    c.transactionCompletes?.value ?? 0,
    convRate: Math.round((c.paywallConvRate?.value ?? 0) * 10000) / 100,
    proceeds: Math.round((c.totalProceeds?.value ?? c.grossProceeds?.value ?? 0) * 100) / 100,
  }));

  // Campaign names from known IDs
  const campNames: Record<string,string> = {
    '43913': 'Example Campaign (campaign_trigger)',
    '49473': 'Transaction Abandoned (paywall_decline)',
    '63927': 'Discount Offer',
  };
  campaigns.forEach((c: any) => { c.name = campNames[c.id] || c.id; });

  // Transactions
  const txns = (rTxn?.result?.transactions ?? []).slice(0, 20).map((t: any) => ({
    userId:   String(t.userId || t.appUserId || '').substring(0, 8),
    product:  t.productId?.replace('cheer_my_run_', '').replace('_plan', '').replace('_discount', ' disc.'),
    proceeds: t.proceeds ?? 0,
    type:     t.type,
    time:     t.eventTime,
    campaign: t.placementIdentifier,
  }));

  res.status(200).json({
    connected,
    sessionSet: !!SESSION,
    updatedAt: new Date().toISOString(),
    _debug: connected ? null : {
      hint: SESSION
        ? 'Session cookie set but data not returned. Cookie may have expired.'
        : 'No SUPERWALL_SESSION set. Add the next-auth.session-token cookie value to Vercel env vars.',
      r30d_sample: JSON.stringify(r30d).substring(0, 200),
    },
    ios: {
      appId: IOS_APP,
      last7d:  period(m7),
      last30d: period(m30),
      last90d: period(m90),
    },
    campaigns,
    recentTransactions: txns,
  });
}
