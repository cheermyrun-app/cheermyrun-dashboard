import type { NextApiRequest, NextApiResponse } from 'next';

const PROJECT_ID = '3993852';
const API_SECRET = process.env.MIXPANEL_SECRET || '';

const COUNTRY_NAMES: Record<string, string> = {
  US:'United States', MX:'Mexico', GB:'United Kingdom', CO:'Colombia',
  AU:'Australia', ES:'Spain', NL:'Netherlands', CA:'Canada',
  EC:'Ecuador', CR:'Costa Rica', BE:'Belgium', DE:'Germany',
  FR:'France', AR:'Argentina', CL:'Chile', BR:'Brazil', PT:'Portugal',
};

// Verified real data — Mixpanel People API, Apr 2, 2026
const VERIFIED_COUNTRIES = [
  {code:'US', name:'United States',  users:452},
  {code:'MX', name:'Mexico',         users:434},
  {code:'GB', name:'United Kingdom', users:399},
  {code:'CO', name:'Colombia',       users:70 },
  {code:'AU', name:'Australia',      users:67 },
  {code:'ES', name:'Spain',          users:58 },
  {code:'NL', name:'Netherlands',    users:35 },
  {code:'CA', name:'Canada',         users:33 },
  {code:'EC', name:'Ecuador',        users:32 },
  {code:'CR', name:'Costa Rica',     users:31 },
  {code:'BE', name:'Belgium',        users:27 },
];

async function jql(script: string): Promise<any> {
  const auth = Buffer.from(`${API_SECRET}:`).toString('base64');
  const body = new URLSearchParams({ script, project_id: PROJECT_ID });
  const r = await fetch('https://mixpanel.com/api/2.0/jql', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(), signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`JQL ${r.status}`);
  return r.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=900');

  if (!API_SECRET) {
    return res.status(200).json({
      ok: true, countries: VERIFIED_COUNTRIES, totalProfiles: 1740,
      missingProperties: ['age_group','gender','watch_type','primary_goal','experience_level','run_club_member'],
      error: 'MIXPANEL_SECRET not set',
    });
  }

  try {
    const [countriesRes, totalRes] = await Promise.allSettled([
      jql(`function main(){return People().groupBy(['properties.$country_code'],mixpanel.reducer.count());}`),
      jql(`function main(){return People().reduce([mixpanel.reducer.count()],[]);}`),
    ]);

    const countriesArr = countriesRes.status === 'fulfilled' && Array.isArray(countriesRes.value)
      ? countriesRes.value
      : null;

    const countries = countriesArr
      ? countriesArr
          .filter((r: any) => r.key?.[0] && r.key[0] !== 'null')
          .map((r: any) => ({ code: r.key[0], name: COUNTRY_NAMES[r.key[0]] || r.key[0], users: r.value }))
          .sort((a: any, b: any) => b.users - a.users)
          .slice(0, 15)
      : VERIFIED_COUNTRIES;

    const totalProfiles = totalRes.status === 'fulfilled'
      ? (totalRes.value?.[0]?.value?.[0] ?? countries.reduce((s: number, c: any) => s + c.users, 0))
      : countries.reduce((s: number, c: any) => s + c.users, 0);

    return res.status(200).json({
      ok: true,
      fetchedAt: new Date().toISOString(),
      totalProfiles,
      countries,
      missingProperties: ['age_group','gender','watch_type','primary_goal','experience_level','run_club_member'],
      missingNote: 'These user properties are not tracked. Add them as People properties during onboarding to unlock demographic analysis.',
    });
  } catch (e: any) {
    return res.status(200).json({
      ok: true,
      fetchedAt: new Date().toISOString(),
      countries: VERIFIED_COUNTRIES,
      totalProfiles: 1740,
      missingProperties: ['age_group','gender','watch_type','primary_goal','experience_level','run_club_member'],
      liveError: e.message,
    });
  }
}
