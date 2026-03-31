import type { NextApiRequest, NextApiResponse } from 'next';

// Superwall PUBLIC REST API — api.superwall.com/v1
// API Key scope: projects:read, charts:read, users:read, campaigns:read, paywalls:read, etc.
const SW_KEY  = process.env.SUPERWALL_API_KEY ?? '';
const IOS_APP = 22399;

async function swGet(path: string) {
  if (!SW_KEY) return { _error: 'no key' };
  const r = await fetch(`https://api.superwall.com/v1${path}`, {
    headers: { 'Authorization': `Bearer ${SW_KEY}`, 'Accept': 'application/json' },
  }).catch((e: any) => ({ ok: false, status: 0, text: async () => e.message }));
  const text = await (r as any).text();
  try {
    const j = JSON.parse(text);
    if (!(r as any).ok) return { _error: (r as any).status, _body: text.substring(0,300), ...j };
    return j;
  } catch { return { _error: 'parse', _body: text.substring(0,300) }; }
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString().split('T')[0];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');

  const today = new Date().toISOString().split('T')[0];

  // Try multiple endpoints to find what works with this API key
  const [
    apps, revenue7d, revenue30d, subscribers,
    campaigns, transactions, overview
  ] = await Promise.all([
    swGet('/apps'),
    swGet(`/apps/${IOS_APP}/revenue?start_date=${daysAgo(7)}&end_date=${today}`),
    swGet(`/apps/${IOS_APP}/revenue?start_date=${daysAgo(30)}&end_date=${today}`),
    swGet(`/apps/${IOS_APP}/subscribers?limit=1`),
    swGet(`/apps/${IOS_APP}/campaigns`),
    swGet(`/apps/${IOS_APP}/transactions?start_date=${daysAgo(7)}&end_date=${today}&limit=20`),
    swGet(`/apps/${IOS_APP}/overview`),
  ]);

  // Find what actually returned data
  const working = { apps: !apps._error, revenue30d: !revenue30d._error, subscribers: !subscribers._error, campaigns: !campaigns._error, transactions: !transactions._error, overview: !overview._error };
  const connected = Object.values(working).some(v => v);

  res.status(200).json({
    connected,
    updatedAt: new Date().toISOString(),
    working,
    _raw: {
      apps: JSON.stringify(apps).substring(0,300),
      revenue30d: JSON.stringify(revenue30d).substring(0,400),
      subscribers: JSON.stringify(subscribers).substring(0,200),
      campaigns: JSON.stringify(campaigns).substring(0,300),
      transactions: JSON.stringify(transactions).substring(0,300),
      overview: JSON.stringify(overview).substring(0,300),
    }
  });
}
