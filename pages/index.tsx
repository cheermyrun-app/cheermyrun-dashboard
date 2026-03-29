import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'funnel', label: 'Funnel' },
  { id: 'runs', label: 'Corridas' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'icp', label: 'Perfil ICP' },
  { id: 'setup', label: 'Estado / Config' },
];

const PERIODS = [
  { value: 7, label: 'Ultimos 7 dias' },
  { value: 30, label: 'Ultimos 30 dias' },
  { value: 90, label: 'Ultimos 90 dias' },
];

// ---- helpers ----
function nd(v: any) { return v === null || v === undefined; }

function Metric({ label, value, delta, sub, warn }: any) {
  const hasData = !nd(value) && value !== 0 || typeof value === 'string';
  return (
    <div style={{ background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '14px 16px', minHeight: 80 }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</div>
      {hasData ? (
        <>
          <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value}</div>
          {delta != null && <div style={{ fontSize: 11, marginTop: 4, color: delta >= 0 ? '#16a34a' : '#dc2626' }}>{delta >= 0 ? '+' : ''}{delta}% vs periodo anterior</div>}
          {sub && <div style={{ fontSize: 10, marginTop: 3, color: 'var(--text-secondary)' }}>{sub}</div>}
        </>
      ) : (
        <>
          <div style={{ fontSize: 15, fontWeight: 400, color: '#999' }}>Sin datos aun</div>
          {warn && <div style={{ fontSize: 10, marginTop: 3, color: '#f59e0b' }}>{warn}</div>}
        </>
      )}
    </div>
  );
}

function SegBar({ label, count, total, color }: any) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 120, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color || '#1a1a1a', borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 28, textAlign: 'right' }}>{pct}%</span>
      <span style={{ fontSize: 11, color: '#aaa', width: 36, textAlign: 'right' }}>{count}</span>
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

function dailyChart(series: Record<string, number> | null | undefined) {
  if (!series) return null;
  const dates = Object.keys(series).sort();
  if (dates.length === 0) return null;
  return { labels: dates.map(d => d.slice(5)), values: dates.map(d => series[d] || 0) };
}

function segToSorted(seg: Record<string, number> | undefined): [string, number][] {
  if (!seg || Object.keys(seg).length === 0) return [];
  return Object.entries(seg).sort((a, b) => b[1] - a[1]);
}

function segTotal(seg: Record<string, number> | undefined): number {
  if (!seg) return 0;
  return Object.values(seg).reduce((s, v) => s + v, 0);
}

function pct(a: number, b: number) {
  if (!b) return null;
  return Math.round((a / b) * 100);
}

export default function Dashboard() {
  const [tab, setTab] = useState('overview');
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
  const cheerChart = dailyChart(s.cheers);
  const appOpenChart = dailyChart(s.appOpens);

  const dot = (st: string) => st === 'connected' ? '#16a34a' : st === 'error' ? '#dc2626' : '#888';
  const lbl = (st: string) => st === 'connected' ? 'Conectado' : st === 'error' ? 'Error de API' : 'No configurado';

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
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--text-primary)}
        .mg4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:18px}
        .mg3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:18px}
        .mg2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:18px}
        .cr{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-bottom:16px}
        .cc{background:var(--card);border:0.5px solid var(--border);border-radius:12px;padding:16px}
        .st{font-size:11px;font-weight:500;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.07em;margin-bottom:12px}
        .pill{font-size:10px;padding:2px 7px;border-radius:20px;border:0.5px solid var(--border);color:var(--text-secondary)}
        .pill-real{font-size:10px;padding:2px 7px;border-radius:20px;background:#dcfce7;color:#166534}
        select{font-size:12px;padding:5px 10px;border-radius:8px;border:0.5px solid var(--border);background:var(--card);color:var(--text-primary);cursor:pointer}
        .note{font-size:11px;color:var(--text-secondary);margin-top:8px;line-height:1.6}
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
              <button key={tb.id} onClick={() => setTab(tb.id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 8px', borderRadius: 8, fontSize: 13, border: 'none', background: tab === tb.id ? 'var(--surface)' : 'transparent', color: tab === tb.id ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: tab === tb.id ? 500 : 400, marginBottom: 1, cursor: 'pointer' }}>{tb.label}</button>
            ))}
          </div>
          <div style={{ padding: '16px 20px 0', borderTop: '0.5px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>Fuentes</div>
            {[{ n: 'Mixpanel', s: data?.sources?.mixpanel }, { n: 'Superwall', s: 'not_used' }, { n: 'AppsFlyer', s: data?.sources?.appsflyer }].map(x => (
              <div key={x.n} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: dot(x.s ?? ''), flexShrink: 0 }} />
                  <span>{x.n}</span>
                </div>
                <div style={{ fontSize: 10, color: '#999', marginLeft: 12 }}>{x.n === 'Superwall' ? 'Suscripciones via Mixpanel' : lbl(x.s ?? 'not_configured')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Header */}
          <div style={{ background: 'var(--card)', borderBottom: '0.5px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{TABS.find(tb => tb.id === tab)?.label}</div>
              {loading && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Cargando datos reales de Mixpanel...</div>}
              {data && !loading && <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>{data.period?.from} al {data.period?.to}</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill-real">100% datos reales</span>
              <select value={period} onChange={e => setPeriod(Number(e.target.value))}>
                {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

            {/* ===== OVERVIEW ===== */}
            {tab === 'overview' && (<>
              <div className="st">Metricas principales — Mixpanel Analytics V2</div>
              <div className="mg4">
                <Metric label="Corridas iniciadas" value={t.runs ? t.runs.toLocaleString() : null} delta={d.runs} sub="run_started" warn="Evento run_started" />
                <Metric label="Suscripciones" value={t.subscriptions ? t.subscriptions.toLocaleString() : null} delta={d.subscriptions} sub="subscription_started" warn="Verificar evento" />
                <Metric label="Cheers recibidos" value={t.cheersReceived ? t.cheersReceived.toLocaleString() : null} delta={d.cheers} sub="cheer_received" warn="Verificar evento" />
                <Metric label="App Opens (DAU proxy)" value={t.appOpens ? t.appOpens.toLocaleString() : null} sub="app_opened" warn="Verificar evento" />
              </div>

              <div className="mg4">
                <Metric label="Corridas completadas" value={t.runsCompleted ? t.runsCompleted.toLocaleString() : null} sub="run_completed" warn="Verificar evento" />
                <Metric label="Cheers favoriteados" value={t.cheersFavorited ? t.cheersFavorited.toLocaleString() : null} sub="cheer_favorited" warn="Verificar evento" />
                <Metric label="Cheers reproducidos" value={t.cheersReplayed ? t.cheersReplayed.toLocaleString() : null} sub="cheer_replayed" warn="Verificar evento" />
                <Metric label="Onboarding completados" value={t.onboardingCompleted ? t.onboardingCompleted.toLocaleString() : null} sub="onboarding_completed" warn="Verificar evento" />
              </div>

              {/* Run chart — confirmed real data */}
              {runChart && (<div className="cc" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Corridas por dia</span>
                    <span className="pill-real" style={{ marginLeft: 8 }}>REAL</span>
                  </div>
                  <span className="pill">run_started — Mixpanel</span>
                </div>
                <div style={{ position: 'relative', height: 200 }}>
                  <Bar data={{ labels: runChart.labels, datasets: [{ data: runChart.values, backgroundColor: '#1a1a1a', borderRadius: 3 }] }} options={CO()} />
                </div>
                <div className="note">Total: {t.runs?.toLocaleString()} corridas en {period} dias</div>
              </div>)}

              {/* Subscriptions chart */}
              {subChart && subChart.values.some((v: number) => v > 0) && (<div className="cc" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div><span style={{ fontSize: 13, fontWeight: 500 }}>Suscripciones por dia</span><span className="pill-real" style={{ marginLeft: 8 }}>REAL</span></div>
                  <span className="pill">subscription_started — Mixpanel</span>
                </div>
                <div style={{ position: 'relative', height: 160 }}>
                  <Bar data={{ labels: subChart.labels, datasets: [{ data: subChart.values, backgroundColor: '#16a34a', borderRadius: 3 }] }} options={CO()} />
                </div>
                <div className="note">Total suscripciones nuevas: {t.subscriptions?.toLocaleString()}</div>
              </div>)}

              {(!runChart && !loading) && (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--card)', borderRadius: 12, border: '0.5px solid var(--border)' }}>
                  <div style={{ fontSize: 15, marginBottom: 8 }}>Cargando datos...</div>
                  <div style={{ fontSize: 12 }}>Si los datos no aparecen, revisa la tab "Estado / Config"</div>
                </div>
              )}
            </>)}

            {/* ===== FUNNEL ===== */}
            {tab === 'funnel' && (<>
              <div className="st">Funnel de conversion — Mixpanel V2</div>

              <div className="mg3">
                <Metric label="Onboarding iniciados" value={t.onboardingStarted ? t.onboardingStarted.toLocaleString() : null} sub="onboarding_started" warn="Verificar evento" />
                <Metric label="Onboarding completados" value={t.onboardingCompleted ? t.onboardingCompleted.toLocaleString() : null} sub="onboarding_completed" warn="Verificar evento" />
                <Metric label="Tasa onboarding" value={f.onboardingCompletionRate != null ? f.onboardingCompletionRate + '%' : null} sub="completados / iniciados" warn="Necesita ambos eventos" />
              </div>

              <div className="mg3">
                <Metric label="Paywall presentado" value={t.paywallPresented ? t.paywallPresented.toLocaleString() : null} sub="paywall_presented" warn="Verificar evento" />
                <Metric label="Suscripciones" value={t.subscriptions ? t.subscriptions.toLocaleString() : null} sub="subscription_started" warn="Verificar evento" />
                <Metric label="Conversion paywall" value={f.paywallConversionRate != null ? f.paywallConversionRate + '%' : null} sub="subscription / paywall" warn="Necesita ambos eventos" />
              </div>

              <div className="mg3">
                <Metric label="Corridas iniciadas" value={t.runs ? t.runs.toLocaleString() : null} sub="run_started" />
                <Metric label="Corridas completadas" value={t.runsCompleted ? t.runsCompleted.toLocaleString() : null} sub="run_completed" warn="Verificar evento" />
                <Metric label="Run completion rate" value={f.runCompletionRate != null ? f.runCompletionRate + '%' : null} sub="completadas / iniciadas" warn="Necesita ambos eventos" />
              </div>

              {/* Visual funnel */}
              {(t.onboardingStarted || t.runs || t.subscriptions) && (<div className="cc">
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Funnel visual</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Onboarding Started', val: t.onboardingStarted, color: '#1a1a1a' },
                    { label: 'Onboarding Completed', val: t.onboardingCompleted, color: '#333' },
                    { label: 'Paywall Presented', val: t.paywallPresented, color: '#555' },
                    { label: 'Subscription Started', val: t.subscriptions, color: '#16a34a' },
                    { label: 'Run Started', val: t.runs, color: '#2563eb' },
                    { label: 'Run Completed', val: t.runsCompleted, color: '#7c3aed' },
                  ].filter(step => step.val > 0).map((step, i, arr) => {
                    const top = arr[0]?.val || 1;
                    const widthPct = Math.max(Math.round((step.val / top) * 100), 8);
                    return (
                      <div key={step.label}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 2 }}>
                          <div style={{ width: `${widthPct}%`, background: step.color, borderRadius: 4, padding: '8px 12px', minWidth: 120 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{step.val?.toLocaleString()}</span>
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{step.label}</span>
                          {i > 0 && arr[i-1]?.val > 0 && <span style={{ fontSize: 11, color: '#888' }}>{pct(step.val, arr[i-1].val)}% del anterior</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {t.onboardingStarted === 0 && t.runs === 0 && <div className="note" style={{ color: '#f59e0b' }}>Los eventos de funnel aun no tienen datos. Verifica los nombres en Mixpanel Live View.</div>}
              </div>)}
            </>)}

            {/* ===== CORRIDAS ===== */}
            {tab === 'runs' && (<>
              <div className="st">Corridas — run_started confirmado en Mixpanel</div>

              <div className="mg4">
                <Metric label={`Total corridas (${period}d)`} value={t.runs ? t.runs.toLocaleString() : null} delta={d.runs} sub="run_started — REAL" />
                <Metric label="Promedio diario" value={t.runs ? Math.round(t.runs / period).toLocaleString() : null} sub={`sobre ${period} dias`} />
                <Metric label="Corridas completadas" value={t.runsCompleted ? t.runsCompleted.toLocaleString() : null} sub="run_completed" warn="Verificar nombre de evento" />
                <Metric label="Completion rate" value={f.runCompletionRate != null ? f.runCompletionRate + '%' : null} sub="completadas / iniciadas" warn="Necesita run_completed" />
              </div>

              {runChart && (<div className="cc" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div><span style={{ fontSize: 13, fontWeight: 500 }}>Corridas diarias</span><span className="pill-real" style={{ marginLeft: 8 }}>DATO REAL</span></div>
                  <span className="pill">run_started</span>
                </div>
                <div style={{ position: 'relative', height: 220 }}>
                  <Bar data={{ labels: runChart.labels, datasets: [{ data: runChart.values, backgroundColor: '#1a1a1a', borderRadius: 3 }] }} options={CO()} />
                </div>
              </div>)}

              <div className="cc">
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Propiedades pendientes de verificar</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 2 }}>
                  Segun el doc Analytics V2, cada <strong>run_completed</strong> incluye:<br/>
                  <code style={{ background: 'var(--surface)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>distance_km, duration_seconds, average_pace, cheers_received_count, favorites_count, is_first_run, run_number_total, local_hour, local_day_of_week</code><br/><br/>
                  Y cada <strong>run_started</strong> incluye:<br/>
                  <code style={{ background: 'var(--surface)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>run_id, run_type, local_hour, local_day_of_week, local_timezone, local_date</code><br/><br/>
                  Una vez que confirmes que run_completed esta disparando, podremos agregar: distribucion de distancias, duracion promedio, hora del dia, dia de la semana.
                </div>
              </div>
            </>)}

            {/* ===== ENGAGEMENT ===== */}
            {tab === 'engagement' && (<>
              <div className="st">Engagement emocional — cheer_received, cheer_favorited, cheer_replayed</div>

              <div className="mg4">
                <Metric label="Cheers recibidos" value={t.cheersReceived ? t.cheersReceived.toLocaleString() : null} delta={d.cheers} sub="cheer_received" warn="Verificar evento en Mixpanel" />
                <Metric label="Cheers favoriteados" value={t.cheersFavorited ? t.cheersFavorited.toLocaleString() : null} sub="cheer_favorited" warn="Verificar evento en Mixpanel" />
                <Metric label="Cheers reproducidos" value={t.cheersReplayed ? t.cheersReplayed.toLocaleString() : null} sub="cheer_replayed" warn="Verificar evento en Mixpanel" />
                <Metric label="App Opens" value={t.appOpens ? t.appOpens.toLocaleString() : null} sub="app_opened (DAU proxy)" warn="Verificar evento" />
              </div>

              {f.cheerFavoriteRate != null || f.cheerReplayRate != null ? (
                <div className="mg2">
                  {f.cheerFavoriteRate != null && <Metric label="Favorite rate" value={f.cheerFavoriteRate + '%'} sub="favoriteados / recibidos" />}
                  {f.cheerReplayRate != null && <Metric label="Replay rate" value={f.cheerReplayRate + '%'} sub="reproducidos / recibidos" />}
                </div>
              ) : null}

              {cheerChart && cheerChart.values.some((v: number) => v > 0) ? (
                <div className="cc" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div><span style={{ fontSize: 13, fontWeight: 500 }}>Cheers recibidos por dia</span><span className="pill-real" style={{ marginLeft: 8 }}>REAL</span></div>
                    <span className="pill">cheer_received</span>
                  </div>
                  <div style={{ position: 'relative', height: 200 }}>
                    <Bar data={{ labels: cheerChart.labels, datasets: [{ data: cheerChart.values, backgroundColor: '#f97316', borderRadius: 3 }] }} options={CO()} />
                  </div>
                </div>
              ) : (
                <div className="cc" style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Cheers recibidos</div>
                  <div style={{ fontSize: 12, color: '#f59e0b', lineHeight: 1.7 }}>
                    El evento <strong>cheer_received</strong> aun retorna 0. Segun el doc V2, este evento se dispara cuando un runner recibe un cheer durante su corrida.<br/><br/>
                    Propiedades que deberiamos ver: <code style={{ background: 'var(--surface)', padding: '1px 5px', borderRadius: 4 }}>cheer_type (voice/text), run_id, local_hour</code>
                  </div>
                </div>
              )}

              <div className="cc">
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Por que este tab es critico</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  Segun el doc Analytics V2: el engagement emocional es la diferenciacion central del producto.<br/><br/>
                  Con <strong>cheer_received</strong>, <strong>cheer_favorited</strong> y <strong>cheer_replayed</strong> podremos responder:<br/>
                  ¿Los usuarios que reciben mas cheers retienen mejor?<br/>
                  ¿Los voice notes tienen mayor favorite rate que los TTS?<br/>
                  ¿El replay rate correlaciona con conversion a pago?
                </div>
              </div>
            </>)}

            {/* ===== ICP ===== */}
            {tab === 'icp' && (<>
              <div className="st">Perfil ICP — propiedades de onboarding, solo usuarios que pagaron (subscription_started)</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, padding: '10px 14px', background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 10 }}>
                Todos los graficos de este tab usan <strong>subscription_started</strong> segmentado por propiedades de onboarding. Solo muestra usuarios que pagaron. Si aparece "Sin datos", el evento subscription_started no esta teniendo datos aun en V2.
              </div>

              <div className="cr">
                {/* Gender */}
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Genero</span>
                    <span className="pill">subscription_started · gender</span>
                  </div>
                  {segToSorted(icp.byGender).length > 0 ? (
                    <>
                      {segToSorted(icp.byGender).map(([k, v]) => <SegBar key={k} label={k} count={v} total={segTotal(icp.byGender)} color="#1a1a1a" />)}
                      <div className="note">Total pagadores con dato: {segTotal(icp.byGender)}</div>
                    </>
                  ) : <div style={{ fontSize: 12, color: '#f59e0b' }}>Sin datos — subscription_started no tiene datos aun en V2</div>}
                </div>

                {/* Age group */}
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Grupo de edad</span>
                    <span className="pill">subscription_started · age_group</span>
                  </div>
                  {segToSorted(icp.byAgeGroup).length > 0 ? (
                    <>
                      {segToSorted(icp.byAgeGroup).map(([k, v]) => <SegBar key={k} label={k} count={v} total={segTotal(icp.byAgeGroup)} color="#2563eb" />)}
                    </>
                  ) : <div style={{ fontSize: 12, color: '#f59e0b' }}>Sin datos aun</div>}
                </div>
              </div>

              <div className="cr">
                {/* Running level */}
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Nivel de corredor</span>
                    <span className="pill">subscription_started · running_level</span>
                  </div>
                  {segToSorted(icp.byRunningLevel).length > 0 ? (
                    segToSorted(icp.byRunningLevel).map(([k, v]) => <SegBar key={k} label={k} count={v} total={segTotal(icp.byRunningLevel)} color="#7c3aed" />)
                  ) : <div style={{ fontSize: 12, color: '#f59e0b' }}>Sin datos aun</div>}
                </div>

                {/* Watch brand */}
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Marca de reloj</span>
                    <span className="pill">subscription_started · watch_brand</span>
                  </div>
                  {segToSorted(icp.byWatchBrand).length > 0 ? (
                    segToSorted(icp.byWatchBrand).map(([k, v]) => <SegBar key={k} label={k} count={v} total={segTotal(icp.byWatchBrand)} color="#f97316" />)
                  ) : <div style={{ fontSize: 12, color: '#f59e0b' }}>Sin datos aun</div>}
                </div>
              </div>

              <div className="cr">
                {/* Usage intent */}
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Intencion de uso</span>
                    <span className="pill">subscription_started · usage_intent</span>
                  </div>
                  {segToSorted(icp.byUsageIntent).length > 0 ? (
                    segToSorted(icp.byUsageIntent).map(([k, v]) => <SegBar key={k} label={k} count={v} total={segTotal(icp.byUsageIntent)} color="#0891b2" />)
                  ) : <div style={{ fontSize: 12, color: '#f59e0b' }}>Sin datos aun</div>}
                </div>

                {/* Plan type */}
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Plan elegido</span>
                    <span className="pill">subscription_started · plan_type</span>
                  </div>
                  {segToSorted(icp.byPlanType).length > 0 ? (
                    segToSorted(icp.byPlanType).map(([k, v]) => <SegBar key={k} label={k} count={v} total={segTotal(icp.byPlanType)} color="#16a34a" />)
                  ) : <div style={{ fontSize: 12, color: '#f59e0b' }}>Sin datos aun</div>}
                </div>
              </div>

              <div className="cr">
                {/* Discovery source */}
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Como nos encontraron</span>
                    <span className="pill">subscription_started · discovery_source</span>
                  </div>
                  {segToSorted(icp.byDiscovery).length > 0 ? (
                    segToSorted(icp.byDiscovery).map(([k, v]) => <SegBar key={k} label={k} count={v} total={segTotal(icp.byDiscovery)} color="#1a1a1a" />)
                  ) : <div style={{ fontSize: 12, color: '#f59e0b' }}>Sin datos aun</div>}
                </div>

                {/* Run club */}
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Miembro de club</span>
                    <span className="pill">subscription_started · run_club_member</span>
                  </div>
                  {segToSorted(icp.byRunClub).length > 0 ? (
                    segToSorted(icp.byRunClub).map(([k, v]) => <SegBar key={k} label={String(k)} count={v} total={segTotal(icp.byRunClub)} color="#555" />)
                  ) : <div style={{ fontSize: 12, color: '#f59e0b' }}>Sin datos aun</div>}
                </div>
              </div>
            </>)}

            {/* ===== SETUP ===== */}
            {tab === 'setup' && (<>
              <div className="st">Estado de datos y proximos pasos</div>

              <div style={{ display: 'grid', gap: 12 }}>
                <div className="cc" style={{ borderLeft: '3px solid #16a34a' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: '#16a34a' }}>✓ Confirmado — funcionando</div>
                  <div style={{ fontSize: 12, lineHeight: 2 }}>
                    <div><strong>run_started</strong> — {t.runs > 0 ? t.runs + ' eventos en ' + period + ' dias' : 'conectado, sin datos en este periodo'}</div>
                    <div><strong>Mixpanel</strong> — API conectada correctamente</div>
                    <div><strong>subscription_started en Mixpanel</strong> — confirmado segun el equipo (puede tener datos)</div>
                  </div>
                </div>

                <div className="cc" style={{ borderLeft: '3px solid #f59e0b' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: '#b45309' }}>⚠ Por verificar — eventos retornando 0</div>
                  <div style={{ fontSize: 12, lineHeight: 2, color: 'var(--text-secondary)' }}>
                    <div>Estos eventos existen en el doc V2 pero retornan 0. Puede ser que sean del proyecto V2 nuevo y aun no tengan suficiente volumen, o que el nombre sea ligeramente distinto:</div>
                    <div style={{ marginTop: 8 }}>
                      {['cheer_received', 'cheer_favorited', 'cheer_replayed', 'app_opened', 'onboarding_started', 'onboarding_completed', 'paywall_presented', 'run_completed'].map(ev => (
                        <div key={ev} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                          <code style={{ background: 'var(--surface)', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>{ev}</code>
                          <span style={{ fontSize: 11, color: '#888' }}>— retornando 0 actualmente</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginTop: 12, padding: '10px 12px', background: '#fef9c3', borderRadius: 8, fontSize: 11, color: '#854d0e' }}>
                    Accion: Ve a Mixpanel → Live View y ejecuta un evento en la app para ver el nombre exacto como aparece.
                  </div>
                </div>

                <div className="cc" style={{ borderLeft: '3px solid #dc2626' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: '#dc2626' }}>✗ No configurado</div>
                  <div style={{ fontSize: 12, lineHeight: 2, color: 'var(--text-secondary)' }}>
                    <div><strong>Superwall API</strong> — key expirada o invalida. Los datos de suscripciones se toman de Mixpanel (subscription_started) en su lugar.</div>
                    <div><strong>AppsFlyer</strong> — APPSFLYER_API_TOKEN no configurado en Vercel. Agregar cuando se reactiven ads.</div>
                  </div>
                </div>

                <div className="cc" style={{ background: '#1a1a1a', border: 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12, color: '#fff' }}>Que pasara cuando los eventos funcionen</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 2 }}>
                    <div>• <strong style={{ color: '#fff' }}>ICP tab</strong>: se llenara automaticamente con genero, edad, nivel, reloj, intento de uso, fuente de descubrimiento</div>
                    <div>• <strong style={{ color: '#fff' }}>Funnel tab</strong>: mostrara drop-off real por paso</div>
                    <div>• <strong style={{ color: '#fff' }}>Engagement tab</strong>: distribucion voice vs TTS, favorite rate, replay rate</div>
                    <div>• <strong style={{ color: '#fff' }}>Corridas tab</strong>: distancia promedio, hora del dia, dias de la semana</div>
                  </div>
                </div>
              </div>
            </>)}

          </div>
        </div>
      </div>
    </>
  );
}
