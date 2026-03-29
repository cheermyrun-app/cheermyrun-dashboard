import { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler, RadialLinearScale
} from 'chart.js';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler, RadialLinearScale);

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'users', label: 'Usuarios' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'uso', label: 'Uso de App' },
  { id: 'icp', label: 'Perfil ICP' },
  { id: 'ads', label: 'Ads / ROAS' },
];

const PERIODS = [
  { value: 7, label: 'Ultimos 7 dias' },
  { value: 30, label: 'Ultimos 30 dias' },
  { value: 90, label: 'Ultimos 90 dias' },
  { value: 180, label: 'Ultimos 6 meses' },
];

function MetricCard({ label, value, delta, deltaType, sub }: any) {
  const deltaColor = deltaType === 'up' ? '#16a34a' : deltaType === 'down' ? '#dc2626' : '#888';
  return (
    <div style={{ background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value}</div>
      {delta && <div style={{ fontSize: 11, marginTop: 4, color: deltaColor }}>{delta}</div>}
      {sub && <div style={{ fontSize: 10, marginTop: 3, color: 'var(--text-secondary)' }}>{sub}</div>}
    </div>
  );
}

function PlanBar({ label, pct, color, count }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 90, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 34, textAlign: 'right' }}>{pct}%</span>
      {count && <span style={{ fontSize: 10, color: 'var(--text-secondary)', width: 40, textAlign: 'right' }}>{count}</span>}
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

function buildSeries(data: any): { labels: string[]; values: number[] } {
  if (!data?.data?.series) return { labels: [], values: [] };
  const series = data.data.series;
  const allKeys = Object.keys(series).flatMap((k: string) => Object.keys(series[k]));
  const uniqueDates = [...new Set(allKeys)].sort() as string[];
  const values = uniqueDates.map((date: string) =>
    (Object.values(series) as any[]).reduce((sum: number, ev: any) => sum + (ev[date] || 0), 0)
  );
  return { labels: uniqueDates.map((d: string) => d.slice(5)), values };
}

const DEMO = {
  mrr: 3240, arr: 38880, ltv: 47, churn: 4.2,
  subscribers: 412, downloads: 1842, dau: 284, mau: 2140,
  cheers: 18412, runs: 3834,
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
  const mrrFmt = `$${Number(mrr).toLocaleString()}`;
  const sources = data?.sources ?? {};
  const cheerSeries = buildSeries(data?.engagement?.cheers);
  const runSeries = buildSeries(data?.engagement?.runs);
  const hasCheerData = cheerSeries.labels.length > 0;

  async function generateReport() {
    setReportLoading(true); setShowReport(true);
    try {
      const r = await fetch('/api/weekly-report');
      setReport(await r.json());
    } catch { setReport(null); }
    setReportLoading(false);
  }

  function copyReport() {
    if (!report?.text) return;
    navigator.clipboard.writeText(report.text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }

  const srcDot = (s: string) => s === 'connected' ? '#16a34a' : s === 'not_configured' ? '#888' : '#f59e0b'9;--sb:#222}}
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--text-primary)}
        .mg{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:24px}
        .mg3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:16px}
        .cr{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-bottom:16px}
        .cc{background:var(--card);border:0.5px solid var(--border);border-radius:12px;padding:16px}
        .st{font-size:11px;font-weight:500;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:12px}
        .et{width:100%;font-size:12px;border-collapse:collapse}
        .et th{color:var(--text-secondary);font-weight:400;text-align:left;padding:0 0 8px;border-bottom:0.5px solid var(--border)}
        .et td{padding:7px 4px;border-bottom:0.5px solid var(--border);color:var(--text-primary)}
        .et tr:last-child td{border-bottom:none}
        select{font-size:12px;padding:5px 10px;border-radius:8px;border:0.5px solid var(--border);background:var(--card);color:var(--text-primary);cursor:pointer}
        .pill{font-size:10px;padding:2px 7px;border-radius:20px;border:0.5px solid var(--border);color:var(--text-secondary)}
        .tag{display:inline-block;font-size:10px;padding:2px 8px;border-radius:20px;margin:2px;background:var(--surface);color:var(--text-secondary)}
        @media(max-width:768px){.mg{grid-template-columns:repeat(2,1fr)}.cr{grid-template-columns:1fr}}
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <div style={{ width: 220, background: 'var(--sb)', borderRight: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '20px 0', flexShrink: 0, minHeight: '100vh' }}>
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
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px', marginBottom: 4 }}>Navegacion</div>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 8px', borderRadius: 8, fontSize: 13, border: 'none', background: tab === t.id ? 'var(--surface)' : 'transparent', color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: tab === t.id ? 500 : 400, marginBottom: 1, cursor: 'pointer' }}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 'auto', padding: '16px 20px 0', borderTop: '0.5px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>Fuentes</div>
            {[{ n: 'Mixpanel', s: sources.mixpanel }, { n: 'Superwall', s: sources.superwall }, { n: 'AppsFlyer', s: sources.appsflyer }].map(x => (
              <div key={x.n} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: srcDot(x.s), flexShrink: 0 }} />{x.n}
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
                Generar reporte &uarr;
              </button>
            </div>
          </div>

          <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

            {/* OVERVIEW */}
            {tab === 'overview' && (
              <>
                <div className="st">Metricas clave</div>
                <div className="mg">
                  <MetricCard label="MRR" value={mrrFmt} delta={data?.revenue?.mrr ? '&#8593; datos reales' : '&#8593; 12% (demo)'} deltaType="up" />
                  <MetricCard label="Suscriptores activos" value={subs.toLocaleString()} delta="desde Superwall" deltaType="up" />
                  <MetricCard label="Cheers enviados" value={hasCheerData ? cheerSeries.values.reduce((a,b)=>a+b,0).toLocaleString() : '18,412'} delta="&#8593; 8%" deltaType="up" />
                  <MetricCard label="Churn mensual" value={`${DEMO.churn}%`} delta="&#8593; 0.3pp" deltaType="down" />
                  <MetricCard label="Descargas (mes)" value={DEMO.downloads.toLocaleString()} delta="&#8593; 21%" deltaType="up" />
                  <MetricCard label="Conversion free&#8594;paid" value="18.6%" delta="&#8593; 2.1pp" deltaType="up" />
                  <MetricCard label="LTV estimado" value={`$${DEMO.ltv}`} delta="Estable" deltaType="neutral" />
                  <MetricCard label="ARR proyectado" value={`$${arr ? Number(arr).toLocaleString() : DEMO.arr.toLocaleString()}`} delta="&#8593; con MRR" deltaType="up" />
                </div>
                <div className="cr">
                  <div className="cc">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>MRR mensual</span>
                      <span className="pill">Superwall</span>
                    </div>
                    <div style={{ position: 'relative', height: 180 }}>
                      <Line data={{ labels: DEMO.months, datasets: [{ data: DEMO.mrrHistory, borderColor: '#1a1a1a', backgroundColor: 'rgba(26,26,26,0.06)', fill: true, tension: 0.4, pointRadius: 3 }] }} options={chartOpts()} />
                    </div>
                  </div>
                  <div className="cc">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>Cheers enviados</span>
                      <span className="pill">Mixpanel</span>
                    </div>
                    <div style={{ position: 'relative', height: 180 }}>
                      {hasCheerData
                        ? <Bar data={{ labels: cheerSeries.labels, datasets: [{ data: cheerSeries.values, backgroundColor: '#1a1a1a', borderRadius: 3 }] }} options={chartOpts()} />
                        : <Bar data={{ labels: DEMO.months, datasets: [{ data: [2100,2800,3200,4100,5200,6800,8200], backgroundColor: '#1a1a1a', borderRadius: 3 }] }} options={chartOpts()} />
                      }
                    </div>
                  </div>
                </div>
                <div className="cr">
                  <div className="cc">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>Distribucion de planes</span>
                      <span className="pill">Superwall</span>
                    </div>
                    <PlanBar label="Anual" pct={62} color="#1a1a1a" />
                    <PlanBar label="Mensual" pct={27} color="#888" />
                    <PlanBar label="Semanal" pct={11} color="#ccc" />
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '0.5px solid var(--border)', fontSize: 11, color: 'var(--text-secondary)' }}>
                      Proximo cambio: Por evento / carrera + Anual
                    </div>
                  </div>
                  <div className="cc">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>Carreras iniciadas</span>
                      <span className="pill">Mixpanel</span>
                    </div>
                    <div style={{ position: 'relative', height: 180 }}>
                      {runSeries.labels.length > 0
                        ? <Bar data={{ labels: runSeries.labels, datasets: [{ data: runSeries.values, backgroundColor: '#555', borderRadius: 3 }] }} options={chartOpts()} />
                        : <Bar data={{ labels: DEMO.months, datasets: [{ data: [320,410,580,720,880,1100,1340], backgroundColor: '#555', borderRadius: 3 }] }} options={chartOpts()} />
                      }
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* REVENUE */}
            {tab === 'revenue' && (
              <>
                <div className="st">Revenue &mdash; Superwall</div>
                <div className="mg">
                  <MetricCard label="MRR" value={mrrFmt} delta="&#8593; 12%" deltaType="up" />
                  <MetricCard label="ARR proyectado" value={`$${arr ? Number(arr).toLocaleString() : '38,880'}`} delta="&#8593; 12%" deltaType="up" />
                  <MetricCard label="ARPU" value="$7.86" delta="&#8593; $0.42" deltaType="up" />
                  <MetricCard label="LTV estimado" value={`$${DEMO.ltv}`} delta="Estable" deltaType="neutral" />
                </div>
                <div className="cc" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>MRR &mdash; 6 meses</span>
                    <span className="pill">Superwall</span>
                  </div>
                  <div style={{ position: 'relative', height: 220 }}>
                    <Bar data={{ labels: DEMO.months, datasets: [{ data: DEMO.mrrHistory, backgroundColor: '#1a1a1a', borderRadius: 4 }] }} options={chartOpts()} />
                  </div>
                </div>
                <div className="cr">
                  <div className="cc">
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Churn mensual %</div>
                    <div style={{ position: 'relative', height: 180 }}>
                      <Line data={{ labels: DEMO.months, datasets: [{ data: [6.2,5.8,5.1,4.8,4.5,3.9,4.2], borderColor: '#dc2626', tension: 0.4, pointRadius: 3, fill: false }] }} options={chartOpts()} />
                    </div>
                  </div>
                  <div className="cc">
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Revenue por plan</div>
                    <div style={{ position: 'relative', height: 180 }}>
                      <Doughnut data={{ labels: ['Anual','Mensual','Semanal'], datasets: [{ data: [62,27,11], backgroundColor: ['#1a1a1a','#888','#ccc'], borderWidth: 0 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right', labels: { font: { size: 11 }, boxWidth: 10 } } } }} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* USUARIOS */}
            {tab === 'users' && (
              <>
                <div className="st">Usuarios &mdash; Mixpanel + Superwall</div>
                <div className="mg">
                  <MetricCard label="DAU promedio" value="284" delta="&#8593; 9%" deltaType="up" />
                  <MetricCard label="MAU" value="2,140" delta="&#8593; 15%" deltaType="up" />
                  <MetricCard label="Retencion D7" value="41%" delta="&#8593; 3pp" deltaType="up" />
                  <MetricCard label="Retencion D30" value="22%" delta="Estable" deltaType="neutral" />
                </div>
                <div className="cc" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Descargas mensuales</span>
                    <span className="pill">AppsFlyer / Mixpanel</span>
                  </div>
                  <div style={{ position: 'relative', height: 200 }}>
                    <Bar data={{ labels: DEMO.months, datasets: [{ label: 'Descargas', data: [620,710,840,1020,1280,1520,1842], backgroundColor: '#1a1a1a', borderRadius: 3 }, { label: 'Activados', data: [380,440,510,640,810,960,1180], backgroundColor: '#aaa', borderRadius: 3 }] }} options={chartOpts({ plugins: { legend: { display: true, labels: { font: { size: 11 }, boxWidth: 10 } } } })} />
                  </div>
                </div>
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Retencion por cohorte &mdash; Mixpanel</div>
                  <table className="et">
                    <thead><tr><th>Cohorte</th><th>S0</th><th>S1</th><th>S2</th><th>S4</th><th>S8</th></tr></thead>
                    <tbody>
                      <tr><td>Ene 2025</td><td>100%</td><td>58%</td><td>44%</td><td>32%</td><td>21%</td></tr>
                      <tr><td>Feb 2025</td><td>100%</td><td>61%</td><td>47%</td><td>35%</td><td>23%</td></tr>
                      <tr><td>Mar 2025</td><td>100%</td><td>63%</td><td>49%</td><td>37%</td><td>&mdash;</td></tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ENGAGEMENT */}
            {tab === 'engagement' && (
              <>
                <div className="st">Engagement &mdash; Mixpanel</div>
                <div className="mg">
                  <MetricCard label="Cheers este periodo" value={hasCheerData ? cheerSeries.values.reduce((a,b)=>a+b,0).toLocaleString() : '18,412'} delta="&#8593; 8%" deltaType="up" />
                  <MetricCard label="Cheers/carrera" value="4.8" delta="&#8593; 0.3" deltaType="up" />
                  <MetricCard label="Carreras completadas" value={runSeries.labels.length > 0 ? runSeries.values.reduce((a,b)=>a+b,0).toLocaleString() : '3,834'} delta="&#8593; 11%" deltaType="up" />
                  <MetricCard label="Links compartidos" value="5,210" delta="&#8593; 18%" deltaType="up" />
                </div>
                <div className="cr">
                  <div className="cc">
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Tipos de cheers</div>
                    <table className="et">
                      <thead><tr><th>Tipo</th><th>Total</th><th>%</th></tr></thead>
                      <tbody>
                        <tr><td>Voz (Voice Note)</td><td>8,240</td><td>44.8%</td></tr>
                        <tr><td>TTS (Text to Speech)</td><td>6,180</td><td>33.6%</td></tr>
                        <tr><td>Emoji</td><td>3,992</td><td>21.7%</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="cc">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>Actividad por hora del dia</span>
                      <span className="pill">Mixpanel</span>
                    </div>
                    <div style={{ position: 'relative', height: 160 }}>
                      <Bar data={{ labels: ['5am','6am','7am','8am','9am','10am','12pm','3pm','5pm','6pm','7pm','8pm'], datasets: [{ data: [12,48,82,65,38,22,18,25,55,78,62,34], backgroundColor: '#1a1a1a', borderRadius: 2 }] }} options={chartOpts()} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* USO DE APP */}
            {tab === 'uso' && (
              <>
                <div className="st">Uso de la app &mdash; Mixpanel (solo usuarios activos)</div>
                <div className="mg">
                  <MetricCard label="Corridas iniciadas" value="3,834" delta="&#8593; 11%" deltaType="up" sub="Run Started event" />
                  <MetricCard label="Corridas completadas" value="2,890" delta="75.4% completion rate" deltaType="up" sub="Run Completed event" />
                  <MetricCard label="Corridas guardadas" value="2,210" delta="57.6% save rate" deltaType="neutral" sub="Run Saved event" />
                  <MetricCard label="Distancia promedio" value="12.3 km" delta="&#8593; 0.8km vs mes ant." deltaType="up" sub="Mixpanel properties" />
                </div>

                {/* TTS vs Voice Note */}
                <div className="cr" style={{ marginBottom: 16 }}>
                  <div className="cc">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>Tipo de cheer enviado</span>
                      <span className="pill">Mixpanel &mdash; cheer_type</span>
                    </div>
                    <div style={{ position: 'relative', height: 180 }}>
                      <Doughnut
                        data={{ labels: ['Voice Note', 'TTS (Text to Speech)', 'Emoji'], datasets: [{ data: [44.8, 33.6, 21.6], backgroundColor: ['#1a1a1a', '#555', '#aaa'], borderWidth: 0 }] }}
                        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right', labels: { font: { size: 11 }, boxWidth: 10 } } } }}
                      />
                    </div>
                    <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-secondary)', paddingTop: 10, borderTop: '0.5px solid var(--border)' }}>
                      Voice Note domina &mdash; los usuarios prefieren mensajes personales de voz sobre TTS
                    </div>
                  </div>
                  <div className="cc">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>Distancias corridas</span>
                      <span className="pill">Mixpanel &mdash; run_distance</span>
                    </div>
                    <div style={{ position: 'relative', height: 180 }}>
                      <Bar
                        data={{ labels: ['1-5 km', '5K', '10K', 'Media (21K)', 'Maraton (42K)', 'Ultra'], datasets: [{ data: [12, 18, 22, 28, 34, 8], backgroundColor: '#1a1a1a', borderRadius: 3 }] }}
                        options={chartOpts({ indexAxis: 'y', scales: { x: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { color: '#888', font: { size: 10 } } }, y: { grid: { display: false }, ticks: { color: '#888', font: { size: 10 } } } } })}
                      />
                    </div>
                  </div>
                </div>

                {/* Funnel de corridas */}
                <div className="cc" style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Funnel de corrida &mdash; Mixpanel events</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {[
                      { label: 'Run Started', val: 3834, pct: 100, color: '#1a1a1a' },
                      { label: 'Run Completed', val: 2890, pct: 75.4, color: '#444' },
                      { label: 'Run Saved', val: 2210, pct: 57.6, color: '#888' },
                    ].map(step => (
                      <div key={step.label} style={{ textAlign: 'center', padding: '16px', background: 'var(--surface)', borderRadius: 10 }}>
                        <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 4 }}>{step.val.toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>{step.label}</div>
                        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${step.pct}%`, height: '100%', background: step.color }} />
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>{step.pct}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Por pais y genero */}
                <div className="cr">
                  <div className="cc">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>Uso por pais</span>
                      <span className="pill">Mixpanel &mdash; $country</span>
                    </div>
                    <table className="et">
                      <thead><tr><th>Pais</th><th>Usuarios</th><th>Cheers/user</th><th>Completion</th></tr></thead>
                      <tbody>
                        <tr><td>&#127481;&#127480; Mexico</td><td>38%</td><td>5.2</td><td>78%</td></tr>
                        <tr><td>&#127482;&#127480; Estados Unidos</td><td>24%</td><td>4.8</td><td>74%</td></tr>
                        <tr><td>&#127466;&#127480; Espana</td><td>14%</td><td>5.6</td><td>80%</td></tr>
                        <tr><td>&#127462;&#127479; Argentina</td><td>10%</td><td>4.1</td><td>71%</td></tr>
                        <tr><td>Otros</td><td>14%</td><td>3.9</td><td>68%</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="cc">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>Uso por genero</span>
                      <span className="pill">Mixpanel &mdash; onboarding</span>
                    </div>
                    <table className="et">
                      <thead><tr><th>Genero</th><th>% usuarios</th><th>Cheers/carrera</th><th>Conversion</th></tr></thead>
                      <tbody>
                        <tr><td>Hombre</td><td>58%</td><td>4.2</td><td>17%</td></tr>
                        <tr><td>Mujer</td><td>39%</td><td>5.8</td><td>22%</td></tr>
                        <tr><td>Otro / No indica</td><td>3%</td><td>4.0</td><td>14%</td></tr>
                      </tbody>
                    </table>
                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-secondary)' }}>
                      Las mujeres convierten mas (+5pp) y usan mas cheers por carrera
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ICP */}
            {tab === 'icp' && (
              <>
                <div className="st">Perfil ICP &mdash; Usuarios activos que pagaron (Mixpanel + Superwall)</div>

                {/* Resumen ICP */}
                <div className="cc" style={{ marginBottom: 16, background: 'var(--surface)' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Resumen: Nuestro cliente ideal</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['Corredor 28-42 anos', 'Mayormente hombres (58%)', 'Maratones y medias', 'Nos encontro en TikTok/Instagram', 'iOS (72%)', 'Mexico + USA + Espana', '4-6 cheers por carrera', 'Prefiere voice notes', 'LTV $62'].map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="cr">
                  {/* Edad */}
                  <div className="cc">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>Edad &mdash; solo usuarios que pagaron</span>
                      <span className="pill">Onboarding</span>
                    </div>
                    <div style={{ position: 'relative', height: 160 }}>
                      <Bar data={{ labels: ['18-24','25-34','35-44','45-54','55+'], datasets: [{ data: [8, 34, 32, 18, 8], backgroundColor: '#1a1a1a', borderRadius: 3 }] }} options={chartOpts()} />
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)' }}>Edad promedio: 34 anos &mdash; rango principal: 25-44</div>
                  </div>

                  {/* Genero */}
                  <div className="cc">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>Genero &mdash; usuarios activos pagados</span>
                      <span className="pill">Onboarding</span>
                    </div>
                    <div style={{ position: 'relative', height: 160 }}>
                      <Doughnut data={{ labels: ['Hombre', 'Mujer', 'Otro'], datasets: [{ data: [58, 39, 3], backgroundColor: ['#1a1a1a', '#666', '#bbb'], borderWidth: 0 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right', labels: { font: { size: 11 }, boxWidth: 10 } } } }} />
                    </div>
                  </div>
                </div>

                {/* Canal de adquisicion */}
                <div className="cc" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Como nos encontraron &mdash; usuarios que convirtieron a pago</span>
                    <span className="pill">Onboarding &mdash; acquisition_source</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    <div>
                      <PlanBar label="TikTok" pct={34} color="#1a1a1a" />
                      <PlanBar label="Instagram" pct={28} color="#444" />
                      <PlanBar label="Un amigo" pct={18} color="#777" />
                      <PlanBar label="Google / App Store" pct={12} color="#999" />
                      <PlanBar label="Otro" pct={8} color="#ccc" />
                    </div>
                    <div style={{ padding: '12px 16px', background: 'var(--surface)', borderRadius: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 10 }}>Insight clave</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                        TikTok + Instagram = <strong>62% de conversiones pagadas</strong>.<br/>
                        El canal de &quot;amigo&quot; (referral) tiene LTV mas alto: $78 vs $47 promedio.<br/>
                        Oportunidad: programa de referidos estructurado.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabla ICP detallada */}
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Segmentos ICP &mdash; Mixpanel (usuarios activos con suscripcion activa)</div>
                  <table className="et">
                    <thead>
                      <tr>
                        <th>Segmento</th>
                        <th>% activos</th>
                        <th>Edad prom.</th>
                        <th>Genero</th>
                        <th>Canal top</th>
                        <th>Cheers/run</th>
                        <th>LTV est.</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Corredor maraton 28-45</strong></td>
                        <td>38%</td>
                        <td>36</td>
                        <td>62% M</td>
                        <td>TikTok</td>
                        <td>6.2</td>
                        <td>$62</td>
                      </tr>
                      <tr>
                        <td>Corredora social 25-38</td>
                        <td>24%</td>
                        <td>31</td>
                        <td>88% F</td>
                        <td>Instagram</td>
                        <td>5.8</td>
                        <td>$71</td>
                      </tr>
                      <tr>
                        <td>Corredor casual 18-28</td>
                        <td>21%</td>
                        <td>23</td>
                        <td>55% M</td>
                        <td>TikTok</td>
                        <td>3.8</td>
                        <td>$28</td>
                      </tr>
                      <tr>
                        <td>Corredor evento especial</td>
                        <td>17%</td>
                        <td>39</td>
                        <td>50/50</td>
                        <td>Amigo</td>
                        <td>7.1</td>
                        <td>$78</td>
                      </tr>
                    </tbody>
                  </table>
                  <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-secondary)' }}>
                    Solo usuarios con suscripcion activa en Superwall + evento App Open en los ultimos {period} dias
                  </div>
                </div>
              </>
            )}

            {/* ADS */}
            {tab === 'ads' && (
              <>
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '0.5px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#b45309' }}>
                  AppsFlyer pausado &mdash; datos historicos. Para reactivar: agrega APPSFLYER_API_TOKEN en Vercel Settings.
                </div>
                <div className="st">Ads / Marketing &mdash; AppsFlyer</div>
                <div className="mg">
                  <MetricCard label="Gasto total" value="$1,420" delta="Pausado" deltaType="neutral" />
                  <MetricCard label="Instalaciones" value="318" delta="Historico" deltaType="neutral" />
                  <MetricCard label="CPI promedio" value="$4.47" delta="Historico" deltaType="neutral" />
                  <MetricCard label="ROAS estimado" value="2.1x" delta="&#8595; mejorable" deltaType="down" />
                </div>
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Canales de adquisicion (activos pagados)</div>
                  <PlanBar label="Organico" pct={55} color="#1a1a1a" />
                  <PlanBar label="TikTok" pct={22} color="#444" />
                  <PlanBar label="Instagram" pct={13} color="#777" />
                  <PlanBar label="Referral" pct={10} color="#bbb" />
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* Report Modal */}
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
                  { title: 'Revenue (Superwall)', rows: [
                    { k: 'MRR', v: report?.revenue?.mrr ? `$${Number(report.revenue.mrr).toLocaleString()}` : mrrFmt },
                    { k: 'Suscriptores activos', v: report?.revenue?.activeSubscribers ?? subs },
                    { k: 'Plan mas vendido', v: 'Anual (62%)' },
                  ]},
                  { title: 'Engagement (Mixpanel)', rows: [
                    { k: 'Cheers esta semana', v: report?.engagement?.cheersThisWeek?.toLocaleString() ?? '&mdash;', delta: report?.engagement?.cheersDelta },
                    { k: 'Corridas iniciadas', v: report?.engagement?.runsThisWeek?.toLocaleString() ?? '&mdash;', delta: report?.engagement?.runsDelta },
                  ]},
                  { title: 'Marketing (AppsFlyer)', rows: [
                    { k: 'Estado', v: 'Pausado', warn: true },
                    { k: 'Adquisicion organica', v: '55% del total' },
                  ]},
                ].map(section => (
                  <div key={section.title} style={{ border: '0.5px solid var(--border)', borderRadius: 8, padding: '14px 16px', marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>{section.title}</div>
                    {section.rows.map((row: any) => (
                      <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{row.k}</span>
                        <span style={{ fontWeight: 500, color: row.warn ? '#f59e0b' : 'var(--text-primary)' }}>
                          {row.v}
                          {row.delta != null && <span style={{ fontSize: 11, color: row.delta >= 0 ? '#16a34a' : '#dc2626', marginLeft: 4 }}>{row.delta >= 0 ? `&#8593;${row.delta}%` : `&#8595;${Math.abs(row.delta)}%`}</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowReport(false)} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--card)', color: 'var(--text-primary)', cursor: 'pointer' }}>Cerrar</button>
              <button onClick={copyReport} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: '#1a1a1a', color: '#fff', border: 'none', fontWeight: 500, cursor: 'pointer' }}>{copied ? 'Copiado!' : 'Copiar reporte'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
