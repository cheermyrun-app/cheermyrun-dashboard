import type { NextApiRequest, NextApiResponse } from 'next';

// Superwall REST API — https://superwall.com/docs/api
// Key is in SUPERWALL_API_KEY env var
const SW_KEY = process.env.SUPERWALL_API_KEY ?? '';
const SW_BASE = 'https://superwall.com/api/v1';

async function sw(path: string) {
  const r = await fetch(`${SW_BASE}${path}`, {
    headers: { 'Authorization': `Bearer ${SW_KEY}`, 'Accept': 'application/json' },
    cache: 'no-store',
  });
  if (!r.ok) return { _error: r.status, _text: await r.text().then(t => t.substring(0, 300)) };
  return r.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  
  if (!SW_KEY) {
    return res.status(200).json({ _error: 'SUPERWALL_API_KEY not set', connected: false });
  }

  // Parallel fetch of Superwall endpoints
  const [revenue, subs, overview] = await Promise.allSettled([
    sw('/revenue'),
    sw('/subscriptions?limit=100'),
    sw('/overview'),
  ]);

  res.status(200).json({
    connected: true,
    key_length: SW_KEY.length,
    key_preview: SW_KEY.substring(0, 8) + '...',
    revenue: revenue.status === 'fulfilled' ? revenue.value : { _error: revenue.reason?.message },
    subscriptions: subs.status === 'fulfilled' ? subs.value : { _error: subs.reason?.message },
    overview: overview.status === 'fulfilled' ? overview.value : { _error: overview.reason?.message },
  });
}
