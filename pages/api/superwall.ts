import type { NextApiRequest, NextApiResponse } from 'next';

// ─── Superwall RPC API ──────────────────────────────────────────────────────
// Discovered endpoints: POST https://superwall.com/api/rpc/{method}
// Auth: session cookies (HttpOnly) + anti-csrf header
// Cookies stored as env vars: SUPERWALL_SESSION + SUPERWALL_CSRF
// App IDs: iOS=22399, Android=22400 (from dashboard), Org=11388

const IOS_APP_ID   = 22399;
const ANDROID_APP_ID = parseInt(process.env.SUPERWALL_ANDROID_APP_ID || '0');
const ORG_ID       = 11388;
const SESSION      = process.env.SUPERWALL_SESSION || '';
const CSRF_TOKEN   = process.env.SUPERWALL_CSRF || '';

function dateRange(days: number) {
  const to   = new Date();
  const from = new Date(Date.now() - days * 86400000);
  const fmt  = (d: Date) => d.toISOString().replace('Z', '').split('.')[0];
  return { from: fmt(from), to: fmt(to) };
}

async function rpc(method: string, params: object) {
  if (!SESSION || !CSRF_TOKEN) {
    return { _error: 'SUPERWALL_SESSION or SUPERWALL_CSRF not set in env vars' };
  }
  try {
    const r = await fetch(`https://superwall.com/api/rpc/${method}`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'anti-csrf':    CSRF_TOKEN,
        'Cookie':       `next-auth.session-token=${SESSION}`,
      },
      body: JSON.stringify({ params, meta: {} }),
    });
    const json = await r.json();
    if (!r.ok) return { _error: r.status, _body: JSON.stringify(json).substring(0, 300) };
    return json?.result?.data ?? json;
  } catch (e: any) {
    return { _error: e.message };
  }
}

async function getOverview(appId: number, days: number) {
  const { from, to } = dateRange(days);
  return rpc('getDashboardOverviewData', {
    environment: ['PRODUCTION'],
    applicationId: [appId],
    organizationId: ORG_ID,
    from, to,
  });
}

async function getCampaigns(appId: number, days: number) {
  const { from, to } = dateRange(days);
  return rpc('getCampaignOverviewData', {
    environment: ['PRODUCTION'],
    applicationId: appId,
    organizationId: ORG_ID,
    from, to,
    campaignIdInfo: [], // returns all campaigns
  });
}

async function getTransactions(appId: number) {
  return rpc('getRecentTransactionData', {
    environment: ['PRODUCTION'],
    applicationId: appId,
    organizationId: ORG_ID,
    limit: 50,
  });
}

function extractMetrics(data: any[]) {
  if (!Array.isArray(data)) return {};
  const m: Record<string, any> = {};
  for (const item of data) {
    if (item?.key) m[item.key] = item.value?.value ?? item.value;
  }
  return m;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const days = parseInt(String(req.query.days || '30'));

  // Parallel fetch for iOS app across multiple periods + Android
  const [
    ios24h, ios7d, ios30d, ios90d, iosAll,
    androidOverview,
    iosCampaigns,
    iosTransactions,
  ] = await Promise.all([
    getOverview(IOS_APP_ID, 1),
    getOverview(IOS_APP_ID, 7),
    getOverview(IOS_APP_ID, 30),
    getOverview(IOS_APP_ID, 90),
    getOverview(IOS_APP_ID, 999),
    ANDROID_APP_ID ? getOverview(ANDROID_APP_ID, days) : Promise.resolve(null),
    getCampaigns(IOS_APP_ID, days),
    getTransactions(IOS_APP_ID),
  ]);

  const connected = !ios30d?._error;

  const m24h = extractMetrics(ios24h);
  const m7d  = extractMetrics(ios7d);
  const m30d = extractMetrics(ios30d);
  const m90d = extractMetrics(ios90d);
  const mAll = extractMetrics(iosAll);
  const mDroid = androidOverview ? extractMetrics(androidOverview) : {};

  res.status(200).json({
    connected,
    updatedAt: new Date().toISOString(),
    _debug: connected ? null : { error: ios30d?._error, hint: 'Add SUPERWALL_SESSION and SUPERWALL_CSRF to Vercel env vars' },

    ios: {
      appId: IOS_APP_ID,
      last24h: {
        proceeds:       m24h.grossProceeds ?? 0,
        newUsers:       m24h.newUsers ?? 0,
        conversions:    m24h.transactionCompletes ?? 0,
        initialConvs:   m24h.initialConversions ?? 0,
        paywallRate:    m24h.paywallRate ?? 0,
        convRate:       m24h.initialConvRate ?? 0,
      },
      last7d: {
        proceeds:       m7d.grossProceeds ?? 0,
        newUsers:       m7d.newUsers ?? 0,
        conversions:    m7d.transactionCompletes ?? 0,
        initialConvs:   m7d.initialConversions ?? 0,
        paywallRate:    m7d.paywallRate ?? 0,
        convRate:       m7d.initialConvRate ?? 0,
      },
      last30d: {
        proceeds:       m30d.grossProceeds ?? 0,
        newUsers:       m30d.newUsers ?? 0,
        conversions:    m30d.transactionCompletes ?? 0,
        initialConvs:   m30d.initialConversions ?? 0,
        paywallRate:    m30d.paywallRate ?? 0,
        convRate:       m30d.initialConvRate ?? 0,
      },
      last90d: {
        proceeds:       m90d.grossProceeds ?? 0,
        newUsers:       m90d.newUsers ?? 0,
        conversions:    m90d.transactionCompletes ?? 0,
        paywallRate:    m90d.paywallRate ?? 0,
        convRate:       m90d.initialConvRate ?? 0,
      },
      allTime: {
        proceeds:       mAll.grossProceeds ?? 0,
        newUsers:       mAll.newUsers ?? 0,
        conversions:    mAll.transactionCompletes ?? 0,
      },
    },

    android: ANDROID_APP_ID ? {
      appId: ANDROID_APP_ID,
      proceeds:     mDroid.grossProceeds ?? 0,
      newUsers:     mDroid.newUsers ?? 0,
      conversions:  mDroid.transactionCompletes ?? 0,
      paywallRate:  mDroid.paywallRate ?? 0,
      convRate:     mDroid.initialConvRate ?? 0,
    } : null,

    combined: {
      proceeds30d: (m30d.grossProceeds ?? 0) + (mDroid.grossProceeds ?? 0),
      mrr: Math.round(((m30d.grossProceeds ?? 0) + (mDroid.grossProceeds ?? 0)) / 30 * 30),
    },

    campaigns: Array.isArray(iosCampaigns) ? iosCampaigns.map((c: any) => ({
      name:        c.name || c.campaignName,
      users:       c.users ?? 0,
      conversions: c.conversions ?? 0,
      convRate:    c.conversionRate ?? 0,
      proceeds:    c.proceeds ?? 0,
    })) : [],

    recentTransactions: Array.isArray(iosTransactions) ? iosTransactions.slice(0, 20).map((t: any) => ({
      userId:    t.appUserId?.substring(0, 8),
      product:   t.productId,
      revenue:   t.revenue,
      proceeds:  t.proceeds,
      type:      t.type,
      time:      t.eventTime,
      campaign:  t.placementIdentifier,
    })) : [],
  });
}
