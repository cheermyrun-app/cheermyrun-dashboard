const MIXPANEL_SECRET = process.env.MIXPANEL_SECRET;
const BASE64_AUTH = Buffer.from(`${MIXPANEL_SECRET}:`).toString('base64');

export async function getMixpanelEvents(fromDate: string, toDate: string, eventNames: string[]) {
  const params = new URLSearchParams({ from_date: fromDate, to_date: toDate, event: JSON.stringify(eventNames), type: 'general', unit: 'day', interval: '30', format: 'json' });
  const res = await fetch(`https://mixpanel.com/api/2.0/events?${params}`, { headers: { Authorization: `Basic ${BASE64_AUTH}` }, next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Mixpanel error: ${res.status}`);
  return res.json();
}

export async function getMixpanelRetention(fromDate: string, toDate: string) {
  const params = new URLSearchParams({ from_date: fromDate, to_date: toDate, retention_type: 'birth', born_event: 'App Open', event: 'App Open', unit: 'week', interval: '8' });
  const res = await fetch(`https://mixpanel.com/api/2.0/retention?${params}`, { headers: { Authorization: `Basic ${BASE64_AUTH}` }, next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json();
}

export async function getMixpanelSegmentation(fromDate: string, toDate: string, event: string, on?: string) {
  const params = new URLSearchParams({ from_date: fromDate, to_date: toDate, event: JSON.stringify(event), unit: 'day', type: 'general' });
  if (on) params.set('on', `properties["${on}"]`);
  const res = await fetch(`https://mixpanel.com/api/2.0/segmentation?${params}`, { headers: { Authorization: `Basic ${BASE64_AUTH}` }, next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json();
}