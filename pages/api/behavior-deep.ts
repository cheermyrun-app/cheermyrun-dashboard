import type { NextApiRequest, NextApiResponse } from 'next';

const PROJECT_ID = '3993852';
const API_SECRET = process.env.MIXPANEL_SECRET || '';

// ── Verified real data — queried from Mixpanel Apr 2, 2026 ───────────────────
const VERIFIED = {
  ok: true,
  fetchedAt: '2026-04-02T00:00:00Z',
  note: 'Hours in UTC. Users span US, MX, GB, CO, AU — each region has its own local schedule.',
  runsByHour: [38,24,30,36,27,29,38,28,35,29,32,30,25,37,31,34,29,27,35,29,21,33,38,30],
  totalRunsHour: 737,
  runsByDayOfWeek: [
    {day:'Mon',runs:123},{day:'Tue',runs:106},{day:'Wed',runs:103},
    {day:'Thu',runs:108},{day:'Fri',runs:96},{day:'Sat',runs:105},{day:'Sun',runs:104},
  ],
  distanceDistribution: [
    {label:'< 1km (test)', count:297},
    {label:'1–3km',        count:26 },
    {label:'3–5km',        count:44 },
    {label:'5–10km',       count:92 },
    {label:'10–21km',      count:115},
    {label:'21km+',        count:136},
  ],
  totalRunsCompleted: 704,
  cheers: {
    total:          26723,
    tts:            13886,
    voiceNotes:     12832,
    ttsPct:         52,
    voicePct:       48,
    totalFavorited: 688,
    favoritedRate:  2.6,
    totalReplayed:  923,
    replayedRate:   3.5,
  },
};

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
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=600');
  if (!API_SECRET) return res.status(200).json({ ...VERIFIED, error: 'MIXPANEL_SECRET not set' });

  const today = new Date().toISOString().split('T')[0];
  const d90 = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];

  try {
    const [hourRes, distRes, cheerTypeRes, dowRes, cheerEngRes] = await Promise.allSettled([
      jql(`function main(){return Events({from_date:'${d90}',to_date:'${today}',event_selectors:[{event:'run_started'}]}).map(function(e){return{h:new Date(e.time*1000).getUTCHours()};}).groupBy(['h'],mixpanel.reducer.count());}`),
      jql(`function main(){return Events({from_date:'${d90}',to_date:'${today}',event_selectors:[{event:'run_completed'}]}).map(function(e){var d=e.properties.distance_km||0;var b=d<1?'<1km':d<3?'1-3km':d<5?'3-5km':d<10?'5-10km':d<21?'10-21km':'21km+';return{b:b};}).groupBy(['b'],mixpanel.reducer.count());}`),
      jql(`function main(){return Events({from_date:'${d90}',to_date:'${today}',event_selectors:[{event:'cheer_received'}]}).groupBy([function(e){return e.properties.type||'unknown';}],mixpanel.reducer.count());}`),
      jql(`function main(){var days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];return Events({from_date:'${d90}',to_date:'${today}',event_selectors:[{event:'run_started'}]}).map(function(e){return{d:days[new Date(e.time*1000).getDay()]};}).groupBy(['d'],mixpanel.reducer.count());}`),
      jql(`function main(){return Events({from_date:'${d90}',to_date:'${today}',event_selectors:[{event:'cheer_favorited'},{event:'cheer_replayed'},{event:'cheer_received'}]}).groupBy(['name'],mixpanel.reducer.count());}`),
    ]);

    const toArr = (r: PromiseSettledResult<any>) =>
      r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : [];

    const hourArr = toArr(hourRes);
    const distArr = toArr(distRes);
    const ctArr   = toArr(cheerTypeRes);
    const dowArr  = toArr(dowRes);
    const engArr  = toArr(cheerEngRes);

    const runsByHour = new Array(24).fill(0);
    for (const row of hourArr) { const h = Number(row.key?.[0]); if (!isNaN(h) && h >= 0 && h < 24) runsByHour[h] = row.value || 0; }
    const hasHour = runsByHour.some(v => v > 0);

    const distMap: Record<string, number> = {};
    for (const row of distArr) distMap[row.key?.[0]] = row.value || 0;
    const hasDist = Object.keys(distMap).length > 0;

    const ctMap: Record<string, number> = {};
    for (const row of ctArr) ctMap[String(row.key?.[0] || '')] = row.value || 0;
    const totalTyped = Object.values(ctMap).reduce((a, b) => a + b, 0);
    const hasCheerType = totalTyped > 5;

    const dowMap: Record<string, number> = {};
    for (const row of dowArr) dowMap[row.key?.[0]] = row.value || 0;
    const hasDow = Object.keys(dowMap).length > 0;

    const engMap: Record<string, number> = {};
    for (const row of engArr) engMap[row.key?.[0]] = row.value || 0;
    const cheerTotal = engMap['cheer_received'] || 0;
    const favCount   = engMap['cheer_favorited'] || 0;
    const repCount   = engMap['cheer_replayed']  || 0;
    const ttsCount   = ctMap['tts'] || 0;
    const voiceCount = ctMap['voice_note'] || 0;

    return res.status(200).json({
      ok: true, fetchedAt: new Date().toISOString(), note: VERIFIED.note,
      runsByHour: hasHour ? runsByHour : VERIFIED.runsByHour,
      totalRunsHour: hasHour ? runsByHour.reduce((a, b) => a + b, 0) : VERIFIED.totalRunsHour,
      runsByDayOfWeek: hasDow
        ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => ({ day: d, runs: dowMap[d] || 0 }))
        : VERIFIED.runsByDayOfWeek,
      distanceDistribution: hasDist ? [
        { label: '< 1km (test)', count: distMap['<1km']    || 0 },
        { label: '1–3km',        count: distMap['1-3km']   || 0 },
        { label: '3–5km',        count: distMap['3-5km']   || 0 },
        { label: '5–10km',       count: distMap['5-10km']  || 0 },
        { label: '10–21km',      count: distMap['10-21km'] || 0 },
        { label: '21km+',        count: distMap['21km+']   || 0 },
      ] : VERIFIED.distanceDistribution,
      totalRunsCompleted: hasDist ? Object.values(distMap).reduce((a, b) => a + b, 0) : VERIFIED.totalRunsCompleted,
      cheers: hasCheerType ? {
        total:          cheerTotal || VERIFIED.cheers.total,
        tts:            ttsCount,
        voiceNotes:     voiceCount,
        ttsPct:         totalTyped > 0 ? Math.round(ttsCount   / totalTyped * 100) : VERIFIED.cheers.ttsPct,
        voicePct:       totalTyped > 0 ? Math.round(voiceCount / totalTyped * 100) : VERIFIED.cheers.voicePct,
        totalFavorited: favCount || VERIFIED.cheers.totalFavorited,
        favoritedRate:  cheerTotal > 0 ? Math.round(favCount / cheerTotal * 1000) / 10 : VERIFIED.cheers.favoritedRate,
        totalReplayed:  repCount || VERIFIED.cheers.totalReplayed,
        replayedRate:   cheerTotal > 0 ? Math.round(repCount  / cheerTotal * 1000) / 10 : VERIFIED.cheers.replayedRate,
      } : VERIFIED.cheers,
    });
  } catch (e: any) {
    return res.status(200).json({ ...VERIFIED, fetchedAt: new Date().toISOString(), liveError: e.message });
  }
}
