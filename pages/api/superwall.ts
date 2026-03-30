import type { NextApiRequest, NextApiResponse } from 'next';

const SW_KEY = process.env.SUPERWALL_API_KEY ?? '';

async function probe(url: string) {
  try {
    const r = await fetch(url, {
      headers: { 'Authorization': `Bearer ${SW_KEY}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      cache: 'no-store',
    });
    const text = await r.text();
    return { status: r.status, body: text.substring(0, 300) };
  } catch (e: any) {
    return { status: 0, error: e.message };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (!SW_KEY) return res.status(200).json({ error: 'no key' });

  const endpoints = [
    'https://superwall.com/api/v1/dashboard/apps',
    'https://superwall.com/api/v1/apps',  
    'https://superwall.com/api/v1/me',
    'https://superwall.com/api/v1/user',
    'https://superwall.com/api/v1/analytics',
    'https://superwall.com/api/v1/campaigns',
    'https://api.superwall.me/v1/apps',
    'https://api.superwall.me/v1/analytics',
  ];

  const results = await Promise.all(endpoints.map(async e => ({ url: e, ...await probe(e) })));

  res.status(200).json({
    key_length: SW_KEY.length,
    key_preview: SW_KEY.substring(0, 12),
    results,
  });
}
