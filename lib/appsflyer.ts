const AF_TOKEN = process.env.APPSFLYER_API_TOKEN;
export async function getAppsFlyerInstalls(appId: string, fromDate: string, toDate: string) {
  if (!AF_TOKEN) return null;
  const res = await fetch(`https://hq1.appsflyer.com/api/raw-data/export/app/${appId}/installs_report/v5?from=${fromDate}&to=${toDate}&timezone=UTC`, { headers: { Authorization: `Bearer ${AF_TOKEN}` }, next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json();
}
export async function getAppsFlyerCampaigns(appId: string, fromDate: string, toDate: string) {
  if (!AF_TOKEN) return null;
  const res = await fetch(`https://hq1.appsflyer.com/api/agg-data/export/app/${appId}/campaigns_report/v5?from=${fromDate}&to=${toDate}`, { headers: { Authorization: `Bearer ${AF_TOKEN}` }, next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json();
}