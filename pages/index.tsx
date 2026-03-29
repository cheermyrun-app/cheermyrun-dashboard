import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'pnl', label: 'P&L' },
  { id: 'funnel', label: 'Funnel' },
  { id: 'runs', label: 'Corridas' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'icp', label: 'Perfil ICP' },
  { id: 'setup', label: 'Estado' },
];

const PERIODS = [
  { value: 7, label: 'Ultimos 7 dias' },
  { value: 30, label: 'Ultimos 30 dias' },
  { value: 90, label: 'Ultimos 90 dias' },
];

const PNL_CATS = ['Desarrollo', 'Influencer', 'Infraestructura', 'Herramientas / SaaS', 'Diseno', 'Marketing', 'Inversion Alex', 'Revenue', 'Otro'];
const PNL_TYPES = ['Gasto', 'Ingreso'];
const PNL_COLORS: Record<string, string> = {
  'Desarrollo': '#6366f1', 'Influencer': '#ec4899', 'Infraestructura': '#3b82f6',
  'Herramientas / SaaS': '#f97316', 'Diseno': '#8b5cf6', 'Marketing': '#14b8a6',
  'Inversion Alex': '#22c55e', 'Revenue': '#16a34a', 'Otro': '#94a3b8',
};

function Metric({ label, value, delta, sub, warn, green }: any) {
  const hasData = value !== null && value !== undefined && value !== '';
  return (
    <div style={{ background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '14px 16px', minHeight: 84 }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</div>
      {hasData ? <>
        <div style={{ fontSize: 22, fontWeight: 500, color: green ? '#16a34a' : 'var(--text-primary)', lineHeight: 1.1 }}>{value}</div>
        {delta != null && <div style={{ fontSize: 11, marginTop: 4, color: delta >= 0 ? '#16a34a' : '#dc2626' }}>{delta >= 0 ? '+' : ''}{delta}% vs periodo ant.</div>}
        {sub && <div style={{ fontSize: 10, marginTop: 3, color: 'var(--text-secondary)' }}>{sub}</div>}
      </> : <>
        <div style={{ fontSize: 15, color: '#aaa' }}>Sin datos</div>
        {warn && <div style={{ fontSize: 10, marginTop: 3, color: '#f59e0b' }}>{warn}</div>}
      </>}
    </div>
  );
}

function SegBar({ label, count, total, color }: any) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 130, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color || '#1a1a1a', borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-secondary)', width: 28, textAlign: 'right' }}>{pct}%</span>
      <span style={{ fontSize: 10, color: '#aaa', width: 32, textAlign: 'right' }}>{count}</span>
    </div>
  );
}

const CO = (extra?: any) => ({
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { bodyFont: { size: 11 }, titleFont: { size: 11 } } },
  scales: {
    x: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { color: '#888', font: { size: 10 } } },
    y: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { color: '#888', font: { size: 10 } }, beginAtZero: true },
  }, ...extra,
});

function dailyChart(s: Record<string, number> | undefined) {
  if (!s) return null;
  const dates = Object.keys(s).sort();
  if (!dates.length) return null;
  return { labels: dates.map(d => d.slice(5)), values: dates.map(d => s[d] || 0) };
}

function segSorted(s: Record<string, number> | undefined): [string, number][] {
  if (!s) return [];
  return Object.entries(s).sort((a, b) => b[1] - a[1]);
}

function segTotal(s: Record<string, number> | undefined) {
  if (!s) return 0;
  return Object.values(s).reduce((a, b) => a + b, 0);
}

// ---- P&L localStorage helpers ----
const PNL_KEY = 'cmr_pnl_entries_v1';
interface PnlEntry { id: string; date: string; name: string; category: string; type: string; amount: number; notes: string; }
function loadPnl(): PnlEntry[] {
  try { return JSON.parse(localStorage.getItem(PNL_KEY) || '[]'); } catch { return []; }
}
function savePnl(entries: PnlEntry[]) {
  localStorage.setItem(PNL_KEY, JSON.stringify(entries));
}

export default function Dashboard() {
  const [tab, setTab] = useState('overview');
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // P&L state
  const [pnlEntries, setPnlEntries] = useState<PnlEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ date: new Date().toISOString().split('T')[0], name: '', category: 'Desarrollo', type: 'Gasto', amount: '', notes: '' });
  const [pnlFilter, setPnlFilter] = useState('all');
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    setPnlEntries(loadPnl());
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard?days=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const t = data?.totals ?? {};
  const d = data?.deltas ?? {};
  const f = data?.funnel ?? {};
  const icp = data?.icp ?? {};
  const s = data?.series ?? {};

  const runChart = dailyChart(s.runs);
  const subChart = dailyChart(s.subscriptions);

  // P&L calculations
  const filteredPnl = pnlFilter === 'all' ? pnlEntries
    : pnlFilter === 'gasto' ? pnlEntries.filter(e => e.type === 'Gasto')
    : pnlEntries.filter(e => e.type === 'Ingreso');

  const totalGastos = pnlEntries.filter(e => e.type === 'Gasto').reduce((s, e) => s + e.amount, 0);
  const totalIngresos = pnlEntries.filter(e => e.type === 'Ingreso').reduce((s, e) => s + e.amount, 0);
  const netCash = totalIngresos - totalGastos;

  const byCategory = pnlEntries.filter(e => e.type === 'Gasto').reduce((acc: Record<string, number>, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const byMonth = pnlEntries.reduce((acc: Record<string, { g: number, i: number }>, e) => {
    const m = e.date.substring(0, 7);
    if (!acc[m]) acc[m] = { g: 0, i: 0 };
    if (e.type === 'Gasto') acc[m].g += e.amount;
    else acc[m].i += e.amount;
    return acc;
  }, {});

  const months = Object.keys(byMonth).sort();

  function addOrUpdateEntry() {
    if (!newEntry.name || !newEntry.amount) return;
    const entry: PnlEntry = { id: editId || Date.now().toString(), date: newEntry.date, name: newEntry.name, category: newEntry.category, type: newEntry.type, amount: Number(newEntry.amount), notes: newEntry.notes };
    const updated = editId ? pnlEntries.map(e => e.id === editId ? entry : e) : [...pnlEntries, entry];
    const sorted = updated.sort((a, b) => b.date.localeCompare(a.date));
    setPnlEntries(sorted);
    savePnl(sorted);
    setShowAdd(false);
    setEditId(null);
    setNewEntry({ date: new Date().toISOString().split('T')[0], name: '', category: 'Desarrollo', type: 'Gasto', amount: '', notes: '' });
  }

  function deleteEntry(id: string) {
    const updated = pnlEntries.filter(e => e.id !== id);
    setPnlEntries(updated);
    savePnl(updated);
  }

  function startEdit(e: PnlEntry) {
    setNewEntry({ date: e.date, name: e.name, category: e.category, type: e.type, amount: String(e.amount), notes: e.notes });
    setEditId(e.id);
    setShowAdd(true);
  }

  const dot = (st: string) => st === 'connected' ? '#16a34a' : st === 'error' ? '#dc2626' : '#888';
  const lbl = (st: string) => st === 'connected' ? 'Conectado' : st === 'error' ? 'Error API' : 'No configurado';

  return (
    <>
      <Head>
        <title>Cheer My Run — Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        :root{--bg:#f8f8f7;--surface:#f0efeb;--card:#fff;--border:rgba(0,0,0,0.1);--text-primary:#1a1a1a;--text-secondary:#666;--sb:#fff}
        @media(prefers-color-scheme:dark){:root{--bg:#1a1a1a;--surface:#222;--card:#2a2a2a;--border:rgba(255,255,255,0.1);--text-primary:#f0f0ee;--text-secondary:#999;--sb:#222}}
        *{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--text-primary)}
        .mg4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:18px}
        .mg3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:18px}
        .mg2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:18px}
        .cr{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-bottom:16px}
        .cc{background:var(--card);border:0.5px solid var(--border);border-radius:12px;padding:16px}
        .st{font-size:11px;font-weight:500;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.07em;margin-bottom:12px}
        .pill{font-size:10px;padding:2px 7px;border-radius:20px;border:0.5px solid var(--border);color:var(--text-secondary)}
        .pill-real{font-size:10px;padding:2px 8px;border-radius:20px;background:#dcfce7;color:#166534}
        select,input,textarea{font-size:12px;padding:6px 10px;border-radius:8px;border:0.5px solid var(--border);background:var(--card);color:var(--text-primary)}
        select{cursor:pointer}
        input[type="number"]{-moz-appearance:textfield}
        .btn{font-size:12px;padding:6px 14px;border-radius:8px;border:0.5px solid var(--border);background:var(--card);color:var(--text-primary);cursor:pointer;font-family:inherit}
        .btn-dark{background:#1a1a1a;color:#fff;border:none;font-weight:500}
        .btn-red{background:#fee2e2;color:#991b1b;border:0.5px solid #fca5a5}
        .et{width:100%;font-size:12px;border-collapse:collapse}
        .et th{color:var(--text-secondary);font-weight:400;text-align:left;padding:0 0 8px;border-bottom:0.5px solid var(--border)}
        .et td{padding:7px 4px;border-bottom:0.5px solid var(--border)}
        .et tr:last-child td{border-bottom:none}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:200}
        .modal{background:var(--card);border-radius:16px;padding:24px;width:460px;max-width:90vw;border:0.5px solid var(--border)}
        .badge{display:inline-block;font-size:10px;padding:2px 7px;border-radius:20px;margin:0}
        @media(max-width:900px){.mg4{grid-template-columns:repeat(2,1fr)}.cr{grid-template-columns:1fr}}
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <div style={{ width: 220, background: 'var(--sb)', borderRight: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '20px 0', flexShrink: 0 }}>
          <div style={{ padding: '0 20px 18px', borderBottom: '0.5px solid var(--border)', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#f97316,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 600 }}>C</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Cheer My Run</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Analytics V2</div>
              </div>
            </div>
          </div>
          <div style={{ padding: '0 12px', flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.08em', padding: '0 8px', marginBottom: 4 }}>Vistas</div>
            {TABS.map(tb => (
              <button key={tb.id} onClick={() => setTab(tb.id)} className="btn" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 8px', marginBottom: 1, background: tab === tb.id ? 'var(--surface)' : 'transparent', color: tab === tb.id ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: tab === tb.id ? 500 : 400, border: 'none' }}>{tb.label}</button>
            ))}
          </div>
          <div style={{ padding: '16px 20px 0', borderTop: '0.5px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>Fuentes</div>
            {[{ n: 'Mixpanel', s: data?.sources?.mixpanel }, { n: 'Superwall', s: 'manual' }, { n: 'AppsFlyer', s: 'not_configured' }].map(x => (
              <div key={x.n} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: x.n === 'Superwall' ? '#888' : dot(x.s ?? ''), flexShrink: 0 }} />
                  <span>{x.n}</span>
                </div>
                <div style={{ fontSize: 10, color: '#999', marginLeft: 12 }}>{x.n === 'Superwall' ? 'Entrada manual' : lbl(x.s ?? 'not_configured')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ background: 'var(--card)', borderBottom: '0.5px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{TABS.find(tb => tb.id === tab)?.label}</div>
              {loading && tab !== 'pnl' && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Cargando...</div>}
              {data && !loading && tab !== 'pnl' && <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>{data.period?.from} → {data.period?.to}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {tab !== 'pnl' && <span className="pill-real">100% datos reales</span>}
              {tab !== 'pnl' && <select value={period} onChange={e => setPeriod(Number(e.target.value))}>
                {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>}
              {tab === 'pnl' && <button className="btn btn-dark" onClick={() => { setShowAdd(true); setEditId(null); }}>+ Agregar entrada</button>}
            </div>
          </div>

          <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

            {/* ========== OVERVIEW ========== */}
            {tab === 'overview' && (<>
              {data?.mixpanel_error && (
                <div style={{ background: '#fef2f2', border: '0.5px solid #fca5a5', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#991b1b' }}>
                  <strong>Mixpanel error {data.mixpanel_error}:</strong> {data.mixpanel_error_body?.substring(0, 150)}
                </div>
              )}
              <div className="st">Metricas principales</div>
              <div className="mg4">
                <Metric label={`Corridas (${period}d)`} value={t.runs > 0 ? t.runs.toLocaleString() : null} delta={d.runs} sub="run_started" warn="Verificar Mixpanel" />
                <Metric label="Suscripciones nuevas" value={t.subscriptions > 0 ? t.subscriptions.toLocaleString() : null} delta={d.subscriptions} sub="subscription_started" warn="Verificar evento" />
                <Metric label="Cheers recibidos" value={t.cheersReceived > 0 ? t.cheersReceived.toLocaleString() : null} delta={d.cheers} sub="cheer_received" warn="Verificar evento" />
                <Metric label="App Opens" value={t.appOpens > 0 ? t.appOpens.toLocaleString() : null} sub="app_opened" warn="Verificar evento" />
              </div>
              <div className="mg4">
                <Metric label="Corridas completadas" value={t.runsCompleted > 0 ? t.runsCompleted.toLocaleString() : null} sub="run_completed" warn="Verificar evento" />
                <Metric label="Cheers favoriteados" value={t.cheersFavorited > 0 ? t.cheersFavorited.toLocaleString() : null} sub="cheer_favorited" warn="Verificar evento" />
                <Metric label="Cheers reproducidos" value={t.cheersReplayed > 0 ? t.cheersReplayed.toLocaleString() : null} sub="cheer_replayed" warn="Verificar evento" />
                <Metric label="Onboarding completados" value={t.onboardingCompleted > 0 ? t.onboardingCompleted.toLocaleString() : null} sub="onboarding_completed" warn="Verificar evento" />
              </div>
              {runChart && (<div className="cc" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div><span style={{ fontSize: 13, fontWeight: 500 }}>Corridas por dia</span><span className="pill-real" style={{ marginLeft: 8 }}>REAL</span></div>
                  <span className="pill">run_started</span>
                </div>
                <div style={{ position: 'relative', height: 200 }}>
                  <Bar data={{ labels: runChart.labels, datasets: [{ data: runChart.values, backgroundColor: '#1a1a1a', borderRadius: 3 }] }} options={CO()} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>Total: {t.runs?.toLocaleString()} corridas en {period} dias</div>
              </div>)}
              {subChart && subChart.values.some(v => v > 0) && (<div className="cc">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div><span style={{ fontSize: 13, fontWeight: 500 }}>Suscripciones por dia</span><span className="pill-real" style={{ marginLeft: 8 }}>REAL</span></div>
                  <span className="pill">subscription_started</span>
                </div>
                <div style={{ position: 'relative', height: 160 }}>
                  <Bar data={{ labels: subChart.labels, datasets: [{ data: subChart.values, backgroundColor: '#16a34a', borderRadius: 3 }] }} options={CO()} />
                </div>
              </div>)}
            </>)}

            {/* ========== P&L ========== */}
            {tab === 'pnl' && (<>
              <div className="st">P&L — Gastos, ingresos e inversiones</div>

              {/* Summary cards */}
              <div className="mg3" style={{ marginBottom: 20 }}>
                <div className="cc" style={{ borderLeft: '3px solid #dc2626' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>Total Gastos</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#dc2626' }}>${totalGastos.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{pnlEntries.filter(e => e.type === 'Gasto').length} entradas</div>
                </div>
                <div className="cc" style={{ borderLeft: '3px solid #16a34a' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>Total Ingresos</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#16a34a' }}>${totalIngresos.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{pnlEntries.filter(e => e.type === 'Ingreso').length} entradas</div>
                </div>
                <div className="cc" style={{ borderLeft: `3px solid ${netCash >= 0 ? '#16a34a' : '#dc2626'}` }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>Flujo Neto</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: netCash >= 0 ? '#16a34a' : '#dc2626' }}>{netCash >= 0 ? '+' : ''}${netCash.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Ingresos - Gastos</div>
                </div>
              </div>

              {pnlEntries.length > 0 && months.length > 0 && (
                <div className="cr" style={{ marginBottom: 16 }}>
                  <div className="cc">
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Burn mensual</div>
                    <div style={{ position: 'relative', height: 200 }}>
                      <Bar data={{ labels: months.map(m => m.slice(0, 7)), datasets: [
                        { label: 'Gastos', data: months.map(m => byMonth[m]?.g || 0), backgroundColor: '#dc2626', borderRadius: 3 },
                        { label: 'Ingresos', data: months.map(m => byMonth[m]?.i || 0), backgroundColor: '#16a34a', borderRadius: 3 },
                      ]}} options={CO({ plugins: { legend: { display: true, labels: { font: { size: 11 }, boxWidth: 10 } } } })} />
                    </div>
                  </div>
                  <div className="cc">
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Gastos por categoria</div>
                    {Object.keys(byCategory).length > 0 ? (
                      <div style={{ position: 'relative', height: 200 }}>
                        <Doughnut data={{ labels: Object.keys(byCategory), datasets: [{ data: Object.values(byCategory), backgroundColor: Object.keys(byCategory).map(k => PNL_COLORS[k] || '#94a3b8'), borderWidth: 0 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right', labels: { font: { size: 10 }, boxWidth: 10 } } } }} />
                      </div>
                    ) : <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '20px 0' }}>Agrega gastos para ver la distribucion</div>}
                  </div>
                </div>
              )}

              {/* Category breakdown */}
              {Object.keys(byCategory).length > 0 && (
                <div className="cc" style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Desglose por categoria</div>
                  {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                    <SegBar key={cat} label={cat} count={`$${amt.toLocaleString()}`} total={totalGastos} color={PNL_COLORS[cat]} />
                  ))}
                </div>
              )}

              {/* Table */}
              <div className="cc">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Todas las entradas</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['all', 'gasto', 'ingreso'].map(f => (
                      <button key={f} className="btn" onClick={() => setPnlFilter(f)} style={{ background: pnlFilter === f ? '#1a1a1a' : 'var(--card)', color: pnlFilter === f ? '#fff' : 'var(--text-secondary)', border: '0.5px solid var(--border)', padding: '4px 10px', fontSize: 11 }}>
                        {f === 'all' ? 'Todos' : f === 'gasto' ? 'Gastos' : 'Ingresos'}
                      </button>
                    ))}
                  </div>
                </div>
                {filteredPnl.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                    No hay entradas aun. Click en "+ Agregar entrada" para empezar.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="et" style={{ minWidth: 600 }}>
                      <thead><tr><th>Fecha</th><th>Concepto</th><th>Categoria</th><th>Tipo</th><th style={{ textAlign: 'right' }}>Monto</th><th></th></tr></thead>
                      <tbody>
                        {filteredPnl.map(e => (
                          <tr key={e.id}>
                            <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{e.date}</td>
                            <td><span style={{ fontWeight: 500 }}>{e.name}</span>{e.notes && <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{e.notes}</div>}</td>
                            <td><span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: PNL_COLORS[e.category] + '22', color: PNL_COLORS[e.category] || '#666', border: `0.5px solid ${PNL_COLORS[e.category]}44` }}>{e.category}</span></td>
                            <td><span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: e.type === 'Gasto' ? '#fee2e2' : '#dcfce7', color: e.type === 'Gasto' ? '#991b1b' : '#166534' }}>{e.type}</span></td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: e.type === 'Gasto' ? '#dc2626' : '#16a34a' }}>{e.type === 'Gasto' ? '-' : '+'}${e.amount.toLocaleString()}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <button className="btn" onClick={() => startEdit(e)} style={{ fontSize: 10, padding: '2px 8px', marginRight: 4 }}>Editar</button>
                              <button className="btn btn-red" onClick={() => deleteEntry(e.id)} style={{ fontSize: 10, padding: '2px 8px' }}>Borrar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>)}

            {/* ========== FUNNEL ========== */}
            {tab === 'funnel' && (<>
              <div className="st">Funnel de activacion</div>
              <div className="mg3">
                <Metric label="Onboarding iniciados" value={t.onboardingStarted > 0 ? t.onboardingStarted.toLocaleString() : null} sub="onboarding_started" warn="Verificar" />
                <Metric label="Onboarding completados" value={t.onboardingCompleted > 0 ? t.onboardingCompleted.toLocaleString() : null} sub="onboarding_completed" warn="Verificar" />
                <Metric label="Tasa onboarding" value={f.onboardingCompletionRate != null ? f.onboardingCompletionRate + '%' : null} warn="Necesita ambos eventos" />
              </div>
              <div className="mg3">
                <Metric label="Paywall presentado" value={t.paywallPresented > 0 ? t.paywallPresented.toLocaleString() : null} sub="paywall_presented" warn="Verificar" />
                <Metric label="Suscripciones" value={t.subscriptions > 0 ? t.subscriptions.toLocaleString() : null} sub="subscription_started" warn="Verificar" />
                <Metric label="Conversion paywall" value={f.paywallConversionRate != null ? f.paywallConversionRate + '%' : null} warn="Necesita ambos eventos" />
              </div>
              <div className="mg3">
                <Metric label="Corridas iniciadas" value={t.runs > 0 ? t.runs.toLocaleString() : null} sub="run_started" />
                <Metric label="Corridas completadas" value={t.runsCompleted > 0 ? t.runsCompleted.toLocaleString() : null} sub="run_completed" warn="Verificar" />
                <Metric label="Run completion rate" value={f.runCompletionRate != null ? f.runCompletionRate + '%' : null} warn="Necesita ambos eventos" />
              </div>
              {(t.runs > 0 || t.subscriptions > 0 || t.onboardingStarted > 0) && (
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Funnel visual</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: 'Onboarding Started', val: t.onboardingStarted, color: '#1a1a1a' },
                      { label: 'Onboarding Completed', val: t.onboardingCompleted, color: '#374151' },
                      { label: 'Paywall Presented', val: t.paywallPresented, color: '#4b5563' },
                      { label: 'Subscription Started', val: t.subscriptions, color: '#16a34a' },
                      { label: 'Run Started', val: t.runs, color: '#2563eb' },
                      { label: 'Run Completed', val: t.runsCompleted, color: '#7c3aed' },
                    ].filter(st => st.val > 0).map((st, i, arr) => {
                      const w = Math.max(Math.round((st.val / (arr[0]?.val || 1)) * 100), 8);
                      return (
                        <div key={st.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: `${w}%`, background: st.color, borderRadius: 6, padding: '8px 12px', minWidth: 100 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{st.val.toLocaleString()}</span>
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{st.label}</span>
                          {i > 0 && arr[i-1]?.val > 0 && <span style={{ fontSize: 11, color: '#888' }}>{Math.round(st.val/arr[i-1].val*100)}%</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>)}

            {/* ========== CORRIDAS ========== */}
            {tab === 'runs' && (<>
              <div className="st">Corridas — run_started confirmado en Mixpanel</div>
              <div className="mg4">
                <Metric label={`Total corridas (${period}d)`} value={t.runs > 0 ? t.runs.toLocaleString() : null} delta={d.runs} sub="DATO REAL" />
                <Metric label="Promedio diario" value={t.runs > 0 ? Math.round(t.runs / period).toLocaleString() : null} />
                <Metric label="Corridas completadas" value={t.runsCompleted > 0 ? t.runsCompleted.toLocaleString() : null} sub="run_completed" warn="Verificar evento" />
                <Metric label="Completion rate" value={f.runCompletionRate != null ? f.runCompletionRate + '%' : null} warn="Necesita run_completed" />
              </div>
              {runChart ? (<div className="cc">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div><span style={{ fontSize: 13, fontWeight: 500 }}>Corridas diarias</span><span className="pill-real" style={{ marginLeft: 8 }}>DATO REAL</span></div>
                  <span className="pill">run_started</span>
                </div>
                <div style={{ position: 'relative', height: 240 }}>
                  <Bar data={{ labels: runChart.labels, datasets: [{ data: runChart.values, backgroundColor: '#1a1a1a', borderRadius: 3 }] }} options={CO()} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>Segun doc V2, run_completed incluye: distance_km, duration_seconds, cheers_received_count, is_first_run, local_hour</div>
              </div>) : (
                <div className="cc"><div style={{ fontSize: 12, color: '#f59e0b' }}>Sin datos de corridas en este periodo. Verifica en Mixpanel Live View que run_started se este disparando.</div></div>
              )}
            </>)}

            {/* ========== ENGAGEMENT ========== */}
            {tab === 'engagement' && (<>
              <div className="st">Engagement emocional — cheer_received, favorited, replayed</div>
              <div className="mg4">
                <Metric label="Cheers recibidos" value={t.cheersReceived > 0 ? t.cheersReceived.toLocaleString() : null} delta={d.cheers} sub="cheer_received" warn="Verificar evento" />
                <Metric label="Cheers favoriteados" value={t.cheersFavorited > 0 ? t.cheersFavorited.toLocaleString() : null} sub="cheer_favorited" warn="Verificar evento" />
                <Metric label="Cheers reproducidos" value={t.cheersReplayed > 0 ? t.cheersReplayed.toLocaleString() : null} sub="cheer_replayed" warn="Verificar evento" />
                <Metric label="App Opens" value={t.appOpens > 0 ? t.appOpens.toLocaleString() : null} sub="app_opened" warn="Verificar evento" />
              </div>
              {(f.cheerFavoriteRate != null || f.cheerReplayRate != null) && (
                <div className="mg2">
                  {f.cheerFavoriteRate != null && <Metric label="Favorite rate" value={f.cheerFavoriteRate + '%'} sub="favoriteados / recibidos" green />}
                  {f.cheerReplayRate != null && <Metric label="Replay rate" value={f.cheerReplayRate + '%'} sub="reproducidos / recibidos" green />}
                </div>
              )}
              <div className="cc">
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Por que este tab importa</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  Segun Analytics V2: el engagement emocional es la diferenciacion central.<br />
                  Con cheer_received, cheer_favorited y cheer_replayed podremos responder:<br />
                  • Los usuarios que reciben mas cheers, retienen mejor?<br />
                  • Voice notes tienen mayor favorite rate que TTS?<br />
                  • El replay rate correlaciona con conversion a pago?
                </div>
              </div>
            </>)}

            {/* ========== ICP ========== */}
            {tab === 'icp' && (<>
              <div className="st">Perfil ICP — Solo usuarios que pagaron (subscription_started + propiedades de onboarding)</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, padding: '10px 14px', background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 10 }}>
                Todos los graficos usan <strong>subscription_started</strong> segmentado por propiedades del onboarding. Solo muestra pagadores reales.
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Genero</span><span className="pill">gender</span></div>
                  {segSorted(icp.byGender).length > 0 ? segSorted(icp.byGender).map(([k, v]) => <SegBar key={k} label={k} count={v} total={segTotal(icp.byGender)} color="#1a1a1a" />) : <div style={{ fontSize: 12, color: '#f59e0b' }}>Sin datos aun</div>}
                </div>
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Grupo de edad</span><span className="pill">age_group</span></div>
                  {segSorted(icp.byAgeGroup).length > 0 ? segSorted(icp.byAgeGroup).map(([k, v]) => <SegBar key={k} label={k} count={v} total={segTotal(icp.byAgeGroup)} color="#2563eb" />) : <div style={{ fontSize: 12, color: '#f59e0b' }}>Sin datos aun</div>}
                </div>
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Nivel corredor</span><span className="pill">running_level</span></div>
                  {segSorted(icp.byRunningLevel).length > 0 ? segSorted(icp.byRunningLevel).map(([k, v]) => <SegBar key={k} label={k} count={v} total={segTotal(icp.byRunningLevel)} color="#7c3aed" />) : <div style={{ fontSize: 12, color: '#f59e0b' }}>Sin datos aun</div>}
                </div>
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Marca de reloj</span><span className="pill">watch_brand</span></div>
                  {segSorted(icp.byWatchBrand).length > 0 ? segSorted(icp.byWatchBrand).map(([k, v]) => <SegBar key={k} label={k} count={v} total={segTotal(icp.byWatchBrand)} color="#f97316" />) : <div style={{ fontSize: 12, color: '#f59e0b' }}>Sin datos aun</div>}
                </div>
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Intencion de uso</span><span className="pill">usage_intent</span></div>
                  {segSorted(icp.byUsageIntent).length > 0 ? segSorted(icp.byUsageIntent).map(([k, v]) => <SegBar key={k} label={k} count={v} total={segTotal(icp.byUsageIntent)} color="#0891b2" />) : <div style={{ fontSize: 12, color: '#f59e0b' }}>Sin datos aun</div>}
                </div>
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Como nos encontraron</span><span className="pill">discovery_source</span></div>
                  {segSorted(icp.byDiscovery).length > 0 ? segSorted(icp.byDiscovery).map(([k, v]) => <SegBar key={k} label={k} count={v} total={segTotal(icp.byDiscovery)} color="#1a1a1a" />) : <div style={{ fontSize: 12, color: '#f59e0b' }}>Sin datos aun</div>}
                </div>
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Plan elegido</span><span className="pill">plan_type</span></div>
                  {segSorted(icp.byPlanType).length > 0 ? segSorted(icp.byPlanType).map(([k, v]) => <SegBar key={k} label={k} count={v} total={segTotal(icp.byPlanType)} color="#16a34a" />) : <div style={{ fontSize: 12, color: '#f59e0b' }}>Sin datos aun</div>}
                </div>
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Miembro de club</span><span className="pill">run_club_member</span></div>
                  {segSorted(icp.byRunClub).length > 0 ? segSorted(icp.byRunClub).map(([k, v]) => <SegBar key={k} label={String(k)} count={v} total={segTotal(icp.byRunClub)} color="#555" />) : <div style={{ fontSize: 12, color: '#f59e0b' }}>Sin datos aun</div>}
                </div>
              </div>
            </>)}

            {/* ========== SETUP ========== */}
            {tab === 'setup' && (<>
              <div className="st">Estado de conexiones</div>
              <div style={{ display: 'grid', gap: 12 }}>
                <div className="cc" style={{ borderLeft: data?.sources?.mixpanel === 'connected' ? '3px solid #16a34a' : '3px solid #dc2626' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: data?.sources?.mixpanel === 'connected' ? '#16a34a' : '#dc2626' }}>
                    {data?.sources?.mixpanel === 'connected' ? '✓ Mixpanel — Conectado' : '✗ Mixpanel — Error de autenticacion'}
                  </div>
                  {data?.mixpanel_error && <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 8 }}>Error {data.mixpanel_error}: {data.mixpanel_error_body?.substring(0, 200)}</div>}
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 2 }}>
                    <div>Evento confirmado: <strong>run_started</strong> — {t.runs > 0 ? `${t.runs} eventos en ${period} dias` : 'sin datos en este periodo'}</div>
                    {['cheer_received','cheer_favorited','cheer_replayed','app_opened','onboarding_started','onboarding_completed','paywall_presented','run_completed','subscription_started'].map(ev => (
                      <div key={ev} style={{ color: '#888' }}>{ev} — por verificar</div>
                    ))}
                  </div>
                  {data?.sources?.mixpanel !== 'connected' && (
                    <div style={{ marginTop: 12, padding: '10px 12px', background: '#fef9c3', borderRadius: 8, fontSize: 11, color: '#854d0e' }}>
                      Si el proyecto Mixpanel es nuevo (post-Feb 2026), puede requerir Service Account en lugar de API Secret. Ir a Mixpanel Settings → Service Accounts para crear uno nuevo.
                    </div>
                  )}
                </div>
                <div className="cc" style={{ borderLeft: '3px solid #888' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>P&L — Entrada manual</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 2 }}>
                    <div>Los datos del P&L se guardan localmente en este navegador.</div>
                    <div>Puedes agregar: influencers pagados, software, inversiones de Alex, revenue.</div>
                    <div>Total entradas registradas: <strong>{pnlEntries.length}</strong></div>
                  </div>
                </div>
                <div className="cc" style={{ borderLeft: '3px solid #888' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>AppsFlyer — No configurado</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Agrega APPSFLYER_API_TOKEN en Vercel cuando reactives ads.</div>
                </div>
              </div>
            </>)}

          </div>
        </div>
      </div>

      {/* ========== P&L ADD/EDIT MODAL ========== */}
      {showAdd && (
        <div className="modal-bg" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 20 }}>{editId ? 'Editar entrada' : 'Nueva entrada P&L'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Fecha</div>
                <input type="date" value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} style={{ width: '100%' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Tipo</div>
                <select value={newEntry.type} onChange={e => setNewEntry({...newEntry, type: e.target.value})} style={{ width: '100%' }}>
                  {PNL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Concepto</div>
              <input type="text" value={newEntry.name} onChange={e => setNewEntry({...newEntry, name: e.target.value})} placeholder="ej. Pago influencer @corredor" style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Categoria</div>
                <select value={newEntry.category} onChange={e => setNewEntry({...newEntry, category: e.target.value})} style={{ width: '100%' }}>
                  {PNL_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Monto (USD)</div>
                <input type="number" value={newEntry.amount} onChange={e => setNewEntry({...newEntry, amount: e.target.value})} placeholder="0.00" style={{ width: '100%' }} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Notas (opcional)</div>
              <input type="text" value={newEntry.notes} onChange={e => setNewEntry({...newEntry, notes: e.target.value})} placeholder="ej. Pago desde cuenta personal" style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setShowAdd(false)}>Cancelar</button>
              <button className="btn btn-dark" onClick={addOrUpdateEntry}>{editId ? 'Guardar cambios' : 'Agregar'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
