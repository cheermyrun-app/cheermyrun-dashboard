import type { NextApiRequest, NextApiResponse } from 'next';

// Proxy to superwall-update cache
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  const r = await fetch('https://cheermyrun-dashboard.vercel.app/api/superwall-update');
  const d = await r.json();
  res.status(200).json(d);
}
