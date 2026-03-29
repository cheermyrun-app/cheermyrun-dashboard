const SUPERWALL_KEY = process.env.SUPERWALL_API_KEY;
const headers = { Authorization: `Bearer ${SUPERWALL_KEY}`, 'Content-Type': 'application/json' };
const BASE = 'https://superwall.com/api/v1';

export async function getSuperwallSubscribers() {
  const res = await fetch(`${BASE}/subscribers?limit=1000`, { headers, next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json();
}
export async function getSuperwallRevenue(startDate: string, endDate: string) {
  const res = await fetch(`${BASE}/analytics/revenue?start_date=${startDate}&end_date=${endDate}&granularity=day`, { headers, next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json();
}
export async function getSuperwallMRR() {
  const res = await fetch(`${BASE}/analytics/mrr`, { headers, next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json();
}
export async function getSuperwallChurn() {
  const res = await fetch(`${BASE}/analytics/churn`, { headers, next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json();
}
export async function getSuperwallTransactions(startDate: string, endDate: string) {
  const res = await fetch(`${BASE}/transactions?start_date=${startDate}&end_date=${endDate}&limit=500`, { headers, next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json();
}