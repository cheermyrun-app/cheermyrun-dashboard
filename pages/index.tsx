import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'users', label: 'Usuarios' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'ads', label: 'Ads / ROAS' },
  { id: 'icp', label: 'ICP / Audiencia' },
];

const PERIODS = [
  { value: 7, label: 'Ãltimos 7 dÃ­as' },
  { value: 30, label: 'Ãltimos 30 dÃ­as' },
  { value: 90, label: 'Ãltimos 90 dÃ­as' },
  { value: 180, label: 'Ãltimos 6 meses' },
];

function MetricCard({ label, value, delta, deltaType }: any) {
  const deltaColor = deltaType === 'up' ? '#16a34a' : deltaType === 'down' ? '#dc2626' : '#888';
  return (
    <div style={{ background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value}</div>
      {delta && <div style={{ fontSize: 11, marginTop: 4, color: deltaColor }}>{delta}</div>}
    </div>
  );
}

function PlanBar({ label, pct, color }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 70, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 30, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

const chartOpts = (extra?: any) => ({
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { bodyFont: { size: 11 }, titleFont: { size: 11 } } },
  scales: {
    x: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { color: '#888', font: { size: 10 } } },
    y: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { color: '#888', font: { size: 10 } } },
  },
  ...extra,
});

function buildTimeSeriesFromMixpanel(data: any): { labels: string[]; values: number[] } {
  if (!data?.data?.series) return { labels: [], values: [] };
  const series = data.data.series;
  const allKeys = Object.keys(series).flatMap(k => Object.keys(series[k]));
  const uniqueDates = Array.from(new Set(allKeys)).sort();
  const values = uniqueDates.map(date =>
    Object.values(series).reduce((sum: number, eventData: any) => sum + (eventData[date] || 0), 0)
  );
  return { labels: uniqueDates.map(d => d.slice(5)), values };
}

const DEMO = {
  mrr: 3240, arr: 38880, arpu: 7.86, ltv: 47, churn: 4.2,
  subscribers: 412, downloads: 1842, dau: 284, mau: 2140,
  d7: 41, d30: 22, cheers: 18412, cheersPerRun: 4.8,
  runs: 3834, links: 5210, cpi: 4.47, roas: 2.1,
  mrrHistory: [1200, 1450, 1680, 1920, 2300, 2890, 3240],
  months: ['Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'],
};

export default function Dashboard() {
  const [tab, setTab] = useState('overview');
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard?days=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setData(null); setLoading(false); });
  }, [period]);

  const mrr = data?.revenue?.mrr ?? DEMO.mrr;
  const arr = data?.revenue?.arr ?? DEMO.arr;
  const subs = data?.subscribers?.total ?? DEMO.subscribers;
  const mrrFmt = mrr ? `$${Number(mrr).toLocaleString()}` : `$${DEMO.mrr.toLocaleString()}`;
  const sources = data?.sources ?? {};
  const cheerSeries = buildTimeSeriesFromMixpanel(data?.engagement?.cheers);
  const runSeries = buildTimeSeriesFromMixpanel(data?.engagement?.runs);
  const hasCheerData = cheerSeries.labels.length > 0;

  async function generateReport() {
    setReportLoading(true);
    setShowReport(true);
    try {
      const r = await fetch('/api/weekly-report');
      const d = await r.json();
      setReport(d);
    } catch { setReport(null); }
    setReportLoading(false);
  }

  function copyReport() {
    if (!report?.text) return;
    navigator.clipboard.writeText(report.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      <Head>
        <title>Cheer My Run â Investor Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        :root { --bg: #f8f8f7; --surface: #f0efeb; --card: #fff; --border: rgba(0,0,0,0.1); --text-primary: #1a1a1a; --text-secondary: #666; --sidebar-bg: #fff; }
        @media (prefers-color-scheme: dark) { :root { --bg: #1a1a1a; --surface: #222; --card: #2a2a2a; --border: rgba(255,255,255,0.1); --text-primary: #f0f0ee; --text-secondary: #999; --sidebar-bg: #222; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', system-ui, sans-serif; background: var(--bg); color: var(--text-primary); }
        .metrics-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-bottom: 24px; }
        .charts-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 16px; }
        .chart-card { background: var(--card); border: 0.5px solid var(--border); border-radius: 12px; padding: 16px; }
        .section-title { font-size: 11px; font-weight: 500; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 12px; }
        .eng-table { width: 100%; font-size: 12px; border-collapse: collapse; }
        .eng-table th { color: var(--text-secondary); font-weight: 400; text-align: left; padding: 0 0 8px; border-bottom: 0.5px solid var(--border); }
        .eng-table td { padding: 7px 0; border-bottom: 0.5px solid var(--border); }
        .eng-table tr:last-child td { border-bottom: none; }
        select { font-size: 12px; padding: 5px 10px; border-radius: 8px; border: 0.5px solid var(--border); background: var(--card); color: var(--text-primary); cursor: pointer; }
        @media (max-width: 768px) { .metrics-grid { grid-template-columns: repeat(2,1fr); } .charts-row { grid-template-columns: 1fr; } }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <div style={{ width: 220, background: 'var(--sidebar-bg)', borderRight: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '20px 0', flexShrink: 0, minHeight: '100vh' }}>
          <div style={{ padding: '0 20px 20px', borderBottom: '0.5px solid var(--border)', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#f97316,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 600 }}>C</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Cheer My Run</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Investor Dashboard</div>
              </div>
            </div>
          </div>
          <div style={{ padding: '0 12px', marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px', marginBottom: 4 }}>NavegaciÃ³n</div>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 8px', borderRadius: 8, fontSize: 13, border: 'none', background: tab === t.id ? 'var(--surface)' : 'transparent', color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: tab === t.id ? 500 : 400, marginBottom: 1, cursor: 'pointer' }}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 'auto', padding: '16px 20px 0', borderTop: '0.5px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>Fuentes</div>
            {[{ name: 'Mixpanel', status: sources.mixpanel }, { name: 'Superwall', status: sources.superwall }, { name: 'AppsFlyer', status: sources.appsflyer }].map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.status === 'connected' ? '#16a34a' : s.status === 'not_configured' ? '#888' : '#f59e0b', flexShrink: 0 }} />
                {s.name}
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ background: 'var(--card)', borderBottom: '0.5px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{TABS.find(t => t.id === tab)?.label ?? 'Overview'}</div>
              {loading && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Cargando datos...</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <select value={period} onChange={e => setPeriod(Number(e.target.value))}>
                {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <button onClick={generateReport} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--card)', color: 'var(--text-primary)', fontWeight: 500, cursor: 'pointer' }}>
                Generar reporte â
              </button>
            </div>
          </div>

          <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
            {tab === 'overview' && (
              <>
                <div className="section-title">MÃ©tricas clave</div>
                <div className="metrics-grid">
                  <MetricCard label="MRR" value={mrrFmt} delta={data?.revenue?.mrr ? 'â datos reales' : 'â 12% (demo)'} deltaType="up" />
                  <MetricCard label="Suscriptores" value={subs.toLocaleString()} delta="activos" deltaType="up" />
                  <MetricCard label="Cheers enviados" value={hasCheerData ? cheerSeries.values.reduce((a,b)=>a+b,0).toLocaleString() : '18,412'} delta="â 8%" deltaType="up" />
                  <MetricCard label="Churn mensual" value={`${DEMO.churn}%`} delta="â 0.3pp" deltaType="down" />
                  <MetricCard label="Descargas (mes)" value={DEMO.downloads.toLocaleString()} delta="â 21%" deltaType="up" />
                  <MetricCard label="ConversiÃ³n freeâpaid" value="18.6%" delta="â 2.1pp" deltaType="up" />
                  <MetricCard label="LTV estimado" value={`$${DEMO.ltv}`} delta="Estable" deltaType="neutral" />
                  <MetricCard label="ARR proyectado" value={`$${arr ? Number(arr).toLocaleString() : DEMO.arr.toLocaleString()}`} delta="â con MRR" deltaType="up" />
                </div>
                <div className="charts-row">
                  <div className="chart-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>MRR mensual</span><span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }}>Superwall</span></div>
                    <div style={{ position: 'relative', height: 180 }}><Line data={{ labels: DEMO.months, datasets: [{ data: DEMO.mrrHistory, borderColor: '#1a1a1a', backgroundColor: 'rgba(26,26,26,0.06)', fill: true, tension: 0.4, pointRadius: 3 }] }} options={chartOpts()} /></div>
                  </div>
                  <div className="chart-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Cheers enviados</span><span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }}>Mixpanel</span></div>
                    <div style={{ position: 'relative', height: 180 }}>
                      {hasCheerData ? <Bar data={{ labels: cheerSeries.labels, datasets: [{ data: cheerSeries.values, backgroundColor: '#1a1a1a', borderRadius: 3 }] }} options={chartOpts()} /> : <Bar data={{ labels: DEMO.months, datasets: [{ data: [2100,2800,3200,4100,5200,6800,8200], backgroundColor: '#1a1a1a', borderRadius: 3 }] }} options={chartOpts()} />}
                    </div>
                  </div>
                </div>
                <div className="charts-row">
                  <div className="chart-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>DistribuciÃ³n de planes</span><span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }}>Superwall</span></div>
                    <PlanBar label="Anual" pct={62} color="#1a1a1a" />
                    <PlanBar label="Mensual" pct={27} color="#888" />
                    <PlanBar label="Semanal" pct={11} color="#ccc" />
                    <div style={{ marginTop: 16, paddingTop: 12, borderTop: '0.5px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>PrÃ³ximo cambio</div>
                      <div style={{ fontSize: 12 }}>Por evento / carrera â¢ Anual</div>
                    </div>
                  </div>
                  <div className="chart-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Carreras iniciadas</span><span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }}>Mixpanel</span></div>
                    <div style={{ position: 'relative', height: 180 }}>
                      {runSeries.labels.length > 0 ? <Bar data={{ labels: runSeries.labels, datasets: [{ data: runSeries.values, backgroundColor: '#555', borderRadius: 3 }] }} options={chartOpts()} /> : <Bar data={{ labels: DEMO.months, datasets: [{ data: [320,410,580,720,880,1100,1340], backgroundColor: '#555', borderRadius: 3 }] }} options={chartOpts()} />}
                    </div>
                  </div>
                </div>
              </>
            )}
            {tab === 'revenue' && (
              <>
                <div className="section-title">Revenue â Superwall</div>
                <div className="metrics-grid">
                  <MetricCard label="MRR" value={mrrFmt} delta="â 12%" deltaType="up" />
                  <MetricCard label="ARR proyectado" value={`$${arr ? Number(arr).toLocaleString() : '38,880'}`} delta="â 12%" deltaType="up" />
                  <MetricCard label="ARPU" value="$7.86" delta="â $0.42" deltaType="up" />
                  <MetricCard label="LTV estimado" value={`$${DEMO.ltv}`} delta="Estable" deltaType="neutral" />
                </div>
                <div className="chart-card" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>MRR â 6 meses</span><span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }}>Superwall</span></div>
                  <div style={{ position: 'relative', height: 220 }}><Bar data={{ labels: DEMO.months, datasets: [{ data: DEMO.mrrHistory, backgroundColor: '#1a1a1a', borderRadius: 4 }] }} options={chartOpts()} /></div>
                </div>
                <div className="charts-row">
                  <div className="chart-card">
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Churn mensual %</div>
                    <div style={{ position: 'relative', height: 180 }}><Line data={{ labels: DEMO.months, datasets: [{ data: [6.2,5.8,5.1,4.8,4.5,3.9,4.2], borderColor: '#dc2626', tension: 0.4, pointRadius: 3, fill: false }] }} options={chartOpts()} /></div>
                  </div>
                  <div className="chart-card">
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Revenue por plan</div>
                    <div style={{ position: 'relative', height: 180 }}><Doughnut data={{ labels: ['Anual','Mensual','Semanal'], datasets: [{ data: [62,27,11], backgroundColor: ['#1a1a1a','#888','#ccc'], borderWidth: 0 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right', labels: { font: { size: 11 }, boxWidth: 10 } } } }} /></div>
                  </div>
                </div>
              </>
            )}
            {tab === 'users' && (
              <>
                <div className="section-title">Usuarios â Mixpanel</div>
                <div className="metrics-grid">
                  <MetricCard label="DAU (promedio)" value="284" delta="â 9%" deltaType="up" />
                  <MetricCard label="MAU" value="2,140" delta="â 15%" deltaType="up" />
                  <MetricCard label="RetenciÃ³n D7" value="41%" delta="â 3pp" deltaType="up" />
                  <MetricCard label="RetenciÃ³n D30" value="22%" delta="Estable" deltaType="neutral" />
                </div>
                <div className="chart-card" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Descargas mensuales</span><span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }}>AppsFlyer / Mixpanel</span></div>
                  <div style={{ position: 'relative', height: 200 }}><Bar data={{ labels: DEMO.months, datasets: [{ label: 'Descargas', data: [620,710,840,1020,1280,1520,1842], backgroundColor: '#1a1a1a', borderRadius: 3 }, { label: 'Activados', data: [380,440,510,640,810,960,1180], backgroundColor: '#aaa', borderRadius: 3 }] }} options={chartOpts({ plugins: { legend: { display: true, labels: { font: { size: 11 }, boxWidth: 10 } } } })} /></div>
                </div>
                <div className="chart-card">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>RetenciÃ³n por cohorte</div>
                  <table className="eng-table"><thead><tr><th>Cohorte</th><th>S0</th><th>S1</th><th>S2</th><th>S4</th><th>S8</th></tr></thead><tbody>
                    <tr><td>Ene 2025</td><td>100%</td><td>58%</td><td>44%</td><td>32%</td><td>21%</td></tr>
                    <tr><td>Feb 2025</td><td>100%</td><td>61%</td><td>47%</td><td>35%</td><td>23%</td></tr>
                    <tr><td>Mar 2025</td><td>100%</td><td>63%</td><td>49%</td><td>37%</td><td>â</td></tr>
                  </tbody></table>
                </div>
              </>
            )}
            {tab === 'engagement' && (
              <>
                <div className="section-title">Engagement â Mixpanel</div>
                <div className="metrics-grid">
                  <MetricCard label="Cheers este perÃ­odo" value={hasCheerData ? cheerSeries.values.reduce((a,b)=>a+b,0).toLocaleString() : '18,412'} delta="â 8%" deltaType="up" />
                  <MetricCard label="Cheers/carrera" value="4.8" delta="â 0.3" deltaType="up" />
                  <MetricCard label="Carreras completadas" value={runSeries.labels.length > 0 ? runSeries.values.reduce((a,b)=>a+b,0).toLocaleString() : '3,834'} delta="â 11%" deltaType="up" />
                  <MetricCard label="Links compartidos" value="5,210" delta="â 18%" deltaType="up" />
                </div>
                <div className="charts-row">
                  <div className="chart-card">
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Tipos de cheers</div>
                    <table className="eng-table"><thead><tr><th>Tipo</th><th>Total</th><th>%</th></tr></thead><tbody>
                      <tr><td>Voz</td><td>8,240</td><td>44.8%</td></tr>
                      <tr><td>Emoji</td><td>6,180</td><td>33.6%</td></tr>
                      <tr><td>Texto</td><td>3,992</td><td>21.7%</td></tr>
                    </tbody></table>
                  </div>
                  <div className="chart-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Actividad por hora</span><span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }}>Mixpanel</span></div>
                    <div style={{ position: 'relative', height: 160 }}><Bar data={{ labels: ['5am','6am','7am','8am','9am','10am','12pm','3pm','5pm','6pm','7pm','8pm'], datasets: [{ data: [12,48,82,65,38,22,18,25,55,78,62,34], backgroundColor: '#1a1a1a', borderRadius: 2 }] }} options={chartOpts()} /></div>
                  </div>
                </div>
              </>
            )}
            {tab === 'ads' && (
              <>
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '0.5px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#b45309' }}>AppsFlyer pausado â datos histÃ³ricos. Para reactivar aÃ±ade APPSFLYER_API_TOKEN en Vercel.</div>
                <div className="section-title">Ads / Marketing â AppsFlyer</div>
                <div className="metrics-grid">
                  <MetricCard label="Gasto total" value="$1,420" delta="Pausado" deltaType="neutral" />
                  <MetricCard label="Instalaciones" value="318" delta="HistÃ³rico" deltaType="neutral" />
                  <MetricCard label="CPI promedio" value="$4.47" delta="HistÃ³rico" deltaType="neutral" />
                  <MetricCard label="ROAS estimado" value="2.1x" delta="â mejorable" deltaType="down" />
                </div>
                <div className="chart-card">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Canales de adquisiciÃ³n</div>
                  <PlanBar label="OrgÃ¡nico" pct={55} color="#1a1a1a" />
                  <PlanBar label="Instagram" pct={22} color="#555" />
                  <PlanBar label="TikTok" pct={13} color="#888" />
                  <PlanBar label="Referral" pct={10} color="#bbb" />
                </div>
              </>
            )}
            {tab === 'icp' && (
              <>
                <div className="section-title">ICP y audiencia â Mixpanel</div>
                <div className="charts-row">
                  <div className="chart-card">
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Edad del corredor</div>
                    <div style={{ position: 'relative', height: 160 }}><Bar data={{ labels: ['18-24','25-34','35-44','45-54','55+'], datasets: [{ data: [18,34,28,14,6], backgroundColor: '#1a1a1a', borderRadius: 3 }] }} options={chartOpts()} /></div>
                  </div>
                  <div className="chart-card">
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Tipo de carrera</div>
                    <PlanBar label="MaratÃ³n" pct={34} color="#1a1a1a" />
                    <PlanBar label="Media" pct={28} color="#444" />
                    <PlanBar label="10K" pct={22} color="#777" />
                    <PlanBar label="Otro" pct={16} color="#bbb" />
                  </div>
                </div>
                <div className="chart-card">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Segmentos ICP</div>
                  <table className="eng-table"><thead><tr><th>Segmento</th><th>% usuarios</th><th>Cheers/sesiÃ³n</th><th>ConversiÃ³n</th><th>LTV</th></tr></thead><tbody>
                    <tr><td><strong>Corredor maratÃ³n 28-45</strong></td><td>38%</td><td>6.2</td><td>24%</td><td>$62</td></tr>
                    <tr><td>Corredor casual 18-28</td><td>31%</td><td>3.8</td><td>11%</td><td>$28</td></tr>
                    <tr><td>Evento especial</td><td>20%</td><td>7.1</td><td>31%</td><td>$71</td></tr>
                    <tr><td>Otros</td><td>11%</td><td>2.1</td><td>6%</td><td>$18</td></tr>
                  </tbody></table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowReport(false)}>
          <div style={{ background: 'var(--card)', borderRadius: 16, border: '0.5px solid var(--border)', padding: 24, width: 480, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>Reporte semanal para Alex</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>{report?.weekLabel ?? 'Generando...'}</div>
            {reportLoading ? (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '20px 0', textAlign: 'center' }}>Cargando datos reales...</div>
            ) : (
              <>
                {[
                  { title: 'Revenue (Superwall)', rows: [{ k: 'MRR', v: report?.revenue?.mrr ? `$${Number(report.revenue.mrr).toLocaleString()}` : mrrFmt }, { k: 'Suscriptores activos', v: report?.revenue?.activeSubscribers ?? subs }] },
                  { title: 'Engagement (Mixpanel)', rows: [{ k: 'Cheers esta semana', v: report?.engagement?.cheersThisWeek?.toLocaleString() ?? 'â', delta: report?.engagement?.cheersDelta }, { k: 'Carreras iniciadas', v: report?.engagement?.runsThisWeek?.toLocaleString() ?? 'â', delta: report?.engagement?.runsDelta }] },
                  { title: 'Marketing (AppsFlyer)', rows: [{ k: 'Estado', v: 'Pausado', warn: true }, { k: 'AdquisiciÃ³n orgÃ¡nica', v: '55% del total' }] },
                ].map(section => (
                  <div key={section.title} style={{ border: '0.5px solid var(--border)', borderRadius: 8, padding: '14px 16px', marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>{section.title}</div>
                    {section.rows.map((row: any) => (
                      <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{row.k}</span>
                        <span style={{ fontWeight: 500, color: row.warn ? '#f59e0b' : 'var(--text-primary)' }}>
                          {row.v}{row.delta != null && <span style={{ fontSize: 11, color: row.delta >= 0 ? '#16a34a' : '#dc2626', marginLeft: 4 }}>{row.delta >= 0 ? `â${row.delta}%` : `â${Math.abs(row.delta)}%`}</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowReport(false)} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--card)', color: 'var(--text-primary)', cursor: 'pointer' }}>Cerrar</button>
              <button onClick={copyReport} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: '#1a1a1a', color: '#fff', border: 'none', fontWeight: 500, cursor: 'pointer' }}>{copied ? 'Copiado â' : 'Copiar reporte'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
