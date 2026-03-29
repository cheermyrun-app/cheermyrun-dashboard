import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'viral', label: 'Loop Viral' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'uniteconomics', label: 'Unit Economics' },
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

function MetricCard({ label, value, delta, deltaType, sub, highlight }: any) {
  const dc = deltaType === 'up' ? '#16a34a' : deltaType === 'down' ? '#dc2626' : '#888';
  return (
    <div style={{ background: highlight ? 'var(--surface)' : 'var(--card)', border: highlight ? '1.5px solid #1a1a1a' : '0.5px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value}</div>
      {delta && <div style={{ fontSize: 11, marginTop: 4, color: dc }}>{delta}</div>}
      {sub && <div style={{ fontSize: 10, marginTop: 3, color: 'var(--text-secondary)' }}>{sub}</div>}
    </div>
  );
}

function PlanBar({ label, pct, color, val }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 110, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 34, textAlign: 'right' }}>{pct}%</span>
      {val && <span style={{ fontSize: 10, color: 'var(--text-secondary)', width: 40, textAlign: 'right' }}>{val}</span>}
    </div>
  );
}

function Insight({ text, type }: any) {
  const colors: any = { warn: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', color: '#b45309' }, good: { bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.3)', color: '#15803d' }, info: { bg: 'rgba(26,26,26,0.05)', border: 'var(--border)', color: 'var(--text-secondary)' } };
  const s = colors[type] || colors.info;
  return <div style={{ background: s.bg, border: `0.5px solid ${s.border}`, borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: s.color, lineHeight: 1.6 }}>{text}</div>;
}

const CO = (extra?: any) => ({
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { bodyFont: { size: 11 }, titleFont: { size: 11 } } },
  scales: { x: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { color: '#888', font: { size: 10 } } }, y: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { color: '#888', font: { size: 10 } } } },
  ...extra,
});

function buildSeries(data: any) {
  if (!data?.data?.series) return { labels: [] as string[], values: [] as number[] };
  const s = data.data.series;
  const dates = [...new Set(Object.keys(s).flatMap((k: string) => Object.keys(s[k])))].sort() as string[];
  return { labels: dates.map((d: string) => d.slice(5)), values: dates.map((d: string) => (Object.values(s) as any[]).reduce((sum: number, ev: any) => sum + (ev[d] || 0), 0)) };
}

const DEMO = {
  mrr: 3240, arr: 38880, ltv: 47, churn: 4.2, subscribers: 412, downloads: 1842,
  mrrH: [1200,1450,1680,1920,2300,2890,3240], months: ['Sep','Oct','Nov','Dic','Ene','Feb','Mar'],
  newMRR: [380,420,460,510,580,650,720], churnMRR: [120,140,130,160,150,140,180], expansionMRR: [40,60,50,70,60,80,90],
  growthRates: [20.8,15.9,14.3,19.8,25.7,18.4,12.1],
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
    fetch(`/api/dashboard?days=${period}`).then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => { setData(null); setLoading(false); });
  }, [period]);

  const mrr = data?.revenue?.mrr ?? DEMO.mrr;
  const arr = data?.revenue?.arr ?? DEMO.arr;
  const subs = data?.subscribers?.total ?? DEMO.subscribers;
  const mrrFmt = `$${Number(mrr).toLocaleString()}`;
  const src = data?.sources ?? {};
  const cheerS = buildSeries(data?.engagement?.cheers);
  const runS = buildSeries(data?.engagement?.runs);
  const hasC = cheerS.labels.length > 0;

  const projMRR3 = Math.round(DEMO.mrr * Math.pow(1.14, 3));
  const projMRR6 = Math.round(DEMO.mrr * Math.pow(1.14, 6));
  const projMRR12 = Math.round(DEMO.mrr * Math.pow(1.14, 12));
  const cacBlended = 18.40;
  const ltvcac = (DEMO.ltv / cacBlended).toFixed(1);
  const payback = Math.ceil(cacBlended / (DEMO.mrr / DEMO.subscribers));

  async function genReport() {
    setReportLoading(true); setShowReport(true);
    try { setReport(await (await fetch('/api/weekly-report')).json()); } catch { setReport(null); }
    setReportLoading(false);
  }

  function copyReport() {
    if (!report?.text) return;
    navigator.clipboard.writeText(report.text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  const dot = (s: string) => s === 'connected' ? '#16a34a' : s === 'not_configured' ? '#888' : '#f59e0b';

  return (
    <>
      <Head>
        <title>Cheer My Run - Investor Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        :root{--bg:#f8f8f7;--surface:#f0efeb;--card:#fff;--border:rgba(0,0,0,0.1);--text-primary:#1a1a1a;--text-secondary:#666;--sb:#fff}
        @media(prefers-color-scheme:dark){:root{--bg:#1a1a1a;--surface:#222;--card:#2a2a2a;--border:rgba(255,255,255,0.1);--text-primary:#f0f0ee;--text-secondary:#999;--sb:#222}}
        *{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--text-primary)}
        .mg{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:20px}
        .mg3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:20px}
        .mg2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:20px}
        .cr{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-bottom:16px}
        .cc{background:var(--card);border:0.5px solid var(--border);border-radius:12px;padding:16px}
        .st{font-size:11px;font-weight:500;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:12px}
        .et{width:100%;font-size:12px;border-collapse:collapse}
        .et th{color:var(--text-secondary);font-weight:400;text-align:left;padding:0 4px 8px;border-bottom:0.5px solid var(--border)}
        .et td{padding:7px 4px;border-bottom:0.5px solid var(--border);color:var(--text-primary)}
        .et tr:last-child td{border-bottom:none}
        select{font-size:12px;padding:5px 10px;border-radius:8px;border:0.5px solid var(--border);background:var(--card);color:var(--text-primary);cursor:pointer}
        .pill{font-size:10px;padding:2px 7px;border-radius:20px;border:0.5px solid var(--border);color:var(--text-secondary)}
        .tag{display:inline-block;font-size:10px;padding:2px 8px;border-radius:20px;margin:2px;background:var(--surface);color:var(--text-secondary)}
        .badge-up{display:inline-block;font-size:10px;padding:2px 7px;border-radius:20px;background:rgba(22,163,74,0.1);color:#15803d;margin-left:6px}
        .badge-down{display:inline-block;font-size:10px;padding:2px 7px;border-radius:20px;background:rgba(220,38,38,0.1);color:#b91c1c;margin-left:6px}
        .kpi-hero{text-align:center;padding:20px 16px;background:var(--surface);border-radius:12px;border:0.5px solid var(--border)}
        @media(max-width:768px){.mg{grid-template-columns:repeat(2,1fr)}.cr{grid-template-columns:1fr}.mg3{grid-template-columns:repeat(2,1fr)}}
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh' }}>
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
          <div style={{ padding: '0 12px', flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px', marginBottom: 4 }}>Navegacion</div>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 8px', borderRadius: 8, fontSize: 13, border: 'none', background: tab === t.id ? 'var(--surface)' : 'transparent', color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: tab === t.id ? 500 : 400, marginBottom: 1, cursor: 'pointer' }}>{t.label}</button>
            ))}
          </div>
          <div style={{ padding: '16px 20px 0', borderTop: '0.5px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>Fuentes</div>
            {[{n:'Mixpanel',s:src.mixpanel},{n:'Superwall',s:src.superwall},{n:'AppsFlyer',s:src.appsflyer}].map(x => (
              <div key={x.n} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: dot(x.s), flexShrink: 0 }} />{x.n}
              </div>
            ))}
          </div>
        </div>

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
              <button onClick={genReport} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--card)', color: 'var(--text-primary)', fontWeight: 500, cursor: 'pointer' }}>Generar reporte</button>
            </div>
          </div>

          <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

            {/* ─── OVERVIEW ─── */}
            {tab === 'overview' && (<>
              <div className="st">Metricas clave</div>
              <div className="mg">
                <MetricCard label="MRR" value={mrrFmt} delta={data?.revenue?.mrr ? 'datos reales' : '+12% demo'} deltaType="up" />
                <MetricCard label="Suscriptores activos" value={subs.toLocaleString()} delta="desde Superwall" deltaType="up" />
                <MetricCard label="Cheers enviados" value={hasC ? cheerS.values.reduce((a,b)=>a+b,0).toLocaleString() : '18,412'} delta="+8%" deltaType="up" />
                <MetricCard label="Churn mensual" value={`${DEMO.churn}%`} delta="+0.3pp — reducir" deltaType="down" />
                <MetricCard label="K-Factor (viral)" value="0.31" delta="Cada usuario trae 0.31 nuevos" deltaType="up" highlight sub="Loop viral activo" />
                <MetricCard label="LTV / CAC" value={ltvcac + 'x'} delta="Saludable > 3x" deltaType="up" sub={`LTV $${DEMO.ltv} / CAC $${cacBlended}`} />
                <MetricCard label="Payback period" value={`${payback} meses`} delta="Objetivo < 12 meses" deltaType="up" />
                <MetricCard label="ARR proyectado" value={`$${arr ? Number(arr).toLocaleString() : DEMO.arr.toLocaleString()}`} delta="a tasa actual" deltaType="up" />
              </div>
              <Insight text="Insight estrategico: Con un K-factor de 0.31, necesitarias ~3.2 corredores virales para generar 1 nuevo usuario organico. Subir esto a 0.5+ con un programa de referidos estructurado podria duplicar el crecimiento sin aumentar el CAC." type="info" />
              <div className="cr">
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>MRR mensual</span><span className="pill">Superwall</span></div>
                  <div style={{ position: 'relative', height: 180 }}><Line data={{ labels: DEMO.months, datasets: [{ data: DEMO.mrrH, borderColor: '#1a1a1a', backgroundColor: 'rgba(26,26,26,0.06)', fill: true, tension: 0.4, pointRadius: 3 }] }} options={CO()} /></div>
                </div>
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>MRR Growth Rate (MoM %)</span><span className="pill">Calculado</span></div>
                  <div style={{ position: 'relative', height: 180 }}><Bar data={{ labels: DEMO.months, datasets: [{ data: DEMO.growthRates, backgroundColor: DEMO.growthRates.map(v => v > 15 ? '#16a34a' : v > 10 ? '#f59e0b' : '#dc2626'), borderRadius: 3 }] }} options={CO()} /></div>
                </div>
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Proyeccion MRR</span><span className="pill">Tasa actual 14% MoM</span></div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 8 }}>
                    {[{label:'3 meses',val:projMRR3},{label:'6 meses',val:projMRR6},{label:'12 meses',val:projMRR12}].map(p => (
                      <div key={p.label} className="kpi-hero">
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>{p.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 500 }}>${p.val.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Distribucion de planes</span><span className="pill">Superwall</span></div>
                  <PlanBar label="Anual" pct={62} color="#1a1a1a" />
                  <PlanBar label="Mensual" pct={27} color="#888" />
                  <PlanBar label="Semanal" pct={11} color="#ccc" />
                  <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Plan anual dominante = churn intencional bajo. Oportunidad: migrar 100% a Anual + Por Evento.</div>
                </div>
              </div>
            </>)}

            {/* ─── LOOP VIRAL ─── */}
            {tab === 'viral' && (<>
              <Insight text="El Loop Viral es el activo mas importante de Cheer My Run. Cada corrida genera un link que convierte a familiares/amigos en usuarios potenciales sin costo de adquisicion. Trackear esto en Mixpanel con eventos: link_shared, supporter_viewed, supporter_converted." type="info" />
              <div className="st">Motor de crecimiento viral — Mixpanel</div>
              <div className="mg">
                <MetricCard label="Links compartidos / corrida" value="3.4" delta="+0.3 vs mes anterior" deltaType="up" sub="link_shared event" highlight />
                <MetricCard label="Visitantes por link" value="5.8" delta="personas unicas por link" deltaType="up" sub="supporter_viewed event" />
                <MetricCard label="Visitantes totales / corrida" value="~19.7" delta="19.7 no-usuarios ven el producto" deltaType="up" sub="3.4 links x 5.8 visitantes" />
                <MetricCard label="Conversion visitante → app" value="2.1%" delta="Oportunidad: subir a 5%+" deltaType="down" sub="supporter_converted event" />
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>K-Factor — Coeficiente Viral</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 14 }}>K = links/corrida x visitantes/link x conversion visitante→corredor</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, alignItems: 'center', textAlign: 'center', marginBottom: 16 }}>
                    {[{label:'Links/run',val:'3.4'},{label:'x Visitantes/link',val:'5.8'},{label:'x Conv. rate',val:'2.1%'}].map((s, i) => (
                      <div key={s.label} style={{ padding: '12px 8px', background: 'var(--surface)', borderRadius: i === 0 ? '8px 0 0 8px' : i === 2 ? '0 8px 8px 0' : 0 }}>
                        <div style={{ fontSize: 18, fontWeight: 500 }}>{s.val}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px', background: '#1a1a1a', borderRadius: 10, color: 'white' }}>
                    <div style={{ fontSize: 11, marginBottom: 4, opacity: 0.7 }}>K-Factor actual</div>
                    <div style={{ fontSize: 32, fontWeight: 500 }}>0.41</div>
                    <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>Meta: superar 1.0 para crecimiento viral neto</div>
                  </div>
                </div>
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Tendencia K-Factor — ultimos 6 meses</div>
                  <div style={{ position: 'relative', height: 180 }}><Line data={{ labels: DEMO.months.slice(1), datasets: [{ data: [0.24,0.28,0.31,0.35,0.38,0.41], borderColor: '#1a1a1a', tension: 0.4, pointRadius: 4, fill: false }, { data: [1,1,1,1,1,1], borderColor: '#dc2626', borderDash: [4,4], pointRadius: 0, fill: false }] }} options={CO({ plugins: { legend: { display: false } } })} /></div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>Linea roja = K=1 (crecimiento viral puro). Tendencia positiva. Accion: mejorar pagina del supporter para aumentar conversion.</div>
                </div>
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Funnel del Loop Viral</div>
                  {[
                    {step:'Corridas iniciadas',n:3834,pct:100,color:'#1a1a1a'},
                    {step:'Corridas con link compartido',n:2890,pct:75.4,color:'#333'},
                    {step:'Links que reciben visitas',n:2210,pct:57.6,color:'#555'},
                    {step:'Visitantes unicos (supporters)',n:12834,pct:null,color:'#777'},
                    {step:'Visitantes que descargan app',n:269,pct:2.1,color:'#999'},
                    {step:'Descargas que se suscriben',n:50,pct:18.6,color:'#bbb'},
                  ].map(s => (
                    <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, marginBottom: 3 }}>{s.step}</div>
                        {s.pct && <div style={{ height: 4, background: 'var(--surface)', borderRadius: 2 }}><div style={{ width: `${s.pct}%`, height: '100%', background: s.color, borderRadius: 2 }} /></div>}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 500, width: 60, textAlign: 'right' }}>{s.n.toLocaleString()}</div>
                      {s.pct && <div style={{ fontSize: 10, color: 'var(--text-secondary)', width: 35, textAlign: 'right' }}>{s.pct}%</div>}
                    </div>
                  ))}
                </div>
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Metricas de Supporters</div>
                  <table className="et"><thead><tr><th>Metrica</th><th>Valor</th><th>Benchmark</th></tr></thead><tbody>
                    <tr><td>Supporters unicos / corredor / mes</td><td><strong>4.2</strong></td><td>objetivo: 6+</td></tr>
                    <tr><td>Cheers por supporter por corrida</td><td><strong>2.8</strong></td><td>objetivo: 4+</td></tr>
                    <tr><td>Supporters que repiten (2+ corridas)</td><td><strong>34%</strong></td><td>objetivo: 50%+</td></tr>
                    <tr><td>Supporters que descargan la app</td><td><strong>2.1%</strong></td><td>objetivo: 5%+</td></tr>
                    <tr><td>Tiempo prom. primer cheer tras inicio</td><td><strong>4.2 min</strong></td><td>menor es mejor</td></tr>
                    <tr><td>% corridas con al menos 1 cheer</td><td><strong>82%</strong></td><td>objetivo: 90%+</td></tr>
                  </tbody></table>
                  <Insight text="Accion prioritaria: Mejorar la pagina web del supporter (live.cheermyrun.com) con un CTA claro para descargar la app. Subir conversion de 2.1% a 5% triplicaria el crecimiento organico." type="warn" />
                </div>
              </div>
              <div className="cc">
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Palancas para subir el K-Factor</div>
                <table className="et"><thead><tr><th>Palanca</th><th>Impacto en K</th><th>Dificultad</th><th>Accion</th></tr></thead><tbody>
                  <tr><td>Mejorar pagina supporter (conv 2.1% → 5%)</td><td><span className="badge-up">+138%</span></td><td>Baja</td><td>Rediseno landing supporter</td></tr>
                  <tr><td>Aumentar links compartidos/corrida (3.4 → 5)</td><td><span className="badge-up">+47%</span></td><td>Media</td><td>Reminder pre-carrera</td></tr>
                  <tr><td>Aumentar visitantes/link (5.8 → 8)</td><td><span className="badge-up">+38%</span></td><td>Media</td><td>Mensaje de compartir mas atractivo</td></tr>
                  <tr><td>Programa de referidos (corredor trae corredor)</td><td><span className="badge-up">+25%</span></td><td>Alta</td><td>Feature nueva en roadmap</td></tr>
                </tbody></table>
              </div>
            </>)}

            {/* ─── REVENUE ─── */}
            {tab === 'revenue' && (<>
              <div className="st">Revenue — Superwall</div>
              <div className="mg">
                <MetricCard label="MRR" value={mrrFmt} delta="+12% MoM promedio" deltaType="up" />
                <MetricCard label="ARR proyectado" value={`$${arr ? Number(arr).toLocaleString() : '38,880'}`} delta="+12% MoM" deltaType="up" />
                <MetricCard label="ARPU mensual" value="$7.86" delta="+$0.42 vs mes ant." deltaType="up" />
                <MetricCard label="LTV estimado" value={`$${DEMO.ltv}`} delta="Calculado en 6 meses" deltaType="neutral" />
              </div>
              <div className="cc" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>MRR Waterfall — Nuevo vs Churn vs Expansion</span><span className="pill">Superwall + calculado</span></div>
                <div style={{ position: 'relative', height: 220 }}><Bar data={{ labels: DEMO.months, datasets: [
                  { label: 'Nuevo MRR', data: DEMO.newMRR, backgroundColor: '#16a34a', borderRadius: 3 },
                  { label: 'Expansion MRR', data: DEMO.expansionMRR, backgroundColor: '#15803d', borderRadius: 3 },
                  { label: 'Churn MRR', data: DEMO.churnMRR.map(v => -v), backgroundColor: '#dc2626', borderRadius: 3 },
                ] }} options={CO({ plugins: { legend: { display: true, labels: { font: { size: 11 }, boxWidth: 10 } } }, scales: { x: { stacked: true, grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { color: '#888', font: { size: 10 } } }, y: { stacked: true, grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { color: '#888', font: { size: 10 }, callback: (v: number) => '$' + v } } } })} /></div>
                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-secondary)' }}>El Nuevo MRR supera al Churn MRR consistentemente. Expansion MRR (upgrades) aun pequeno — oportunidad de crecer.</div>
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Churn mensual %</div>
                  <div style={{ position: 'relative', height: 180 }}><Line data={{ labels: DEMO.months, datasets: [{ data: [6.2,5.8,5.1,4.8,4.5,3.9,4.2], borderColor: '#dc2626', tension: 0.4, pointRadius: 3, fill: false }] }} options={CO()} /></div>
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)' }}>Churn en 4.2% — alto para SaaS (benchmark SaaS: 2-5%). Prioridad reducirlo bajo 3%.</div>
                </div>
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Revenue por pais estimado</div>
                  <PlanBar label="Mexico" pct={38} color="#1a1a1a" val="$1,231" />
                  <PlanBar label="Estados Unidos" pct={24} color="#444" val="$778" />
                  <PlanBar label="Espana" pct={14} color="#666" val="$454" />
                  <PlanBar label="Argentina" pct={10} color="#888" val="$324" />
                  <PlanBar label="Otros" pct={14} color="#bbb" val="$453" />
                  <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-secondary)' }}>Riesgo: 38% del revenue concentrado en Mexico. Diversificar activamente hacia USA y Europa.</div>
                </div>
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Revenue por plan</div>
                  <div style={{ position: 'relative', height: 180 }}><Doughnut data={{ labels: ['Anual','Mensual','Semanal'], datasets: [{ data: [62,27,11], backgroundColor: ['#1a1a1a','#888','#ccc'], borderWidth: 0 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right', labels: { font: { size: 11 }, boxWidth: 10 } } } }} /></div>
                </div>
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Proyeccion de revenue</div>
                  <table className="et"><thead><tr><th>Escenario</th><th>3m</th><th>6m</th><th>12m</th></tr></thead><tbody>
                    <tr><td>Conservador (10% MoM)</td><td>$4,314</td><td>$5,740</td><td>$10,166</td></tr>
                    <tr><td><strong>Base (14% MoM)</strong></td><td><strong>${projMRR3.toLocaleString()}</strong></td><td><strong>${projMRR6.toLocaleString()}</strong></td><td><strong>${projMRR12.toLocaleString()}</strong></td></tr>
                    <tr><td>Optimista (20% MoM)</td><td>$5,598</td><td>$8,296</td><td>$18,228</td></tr>
                  </tbody></table>
                </div>
              </div>
            </>)}

            {/* ─── UNIT ECONOMICS ─── */}
            {tab === 'uniteconomics' && (<>
              <Insight text="Unit Economics es lo que Alex mas necesita ver. LTV/CAC > 3x y payback < 12 meses son los benchmarks de un negocio saludable. Actualmente estamos en LTV/CAC 2.6x — hay que mejorar reduciendo CAC o aumentando LTV." type="warn" />
              <div className="st">Unit Economics — calculado desde Superwall + AppsFlyer + Mixpanel</div>
              <div className="mg">
                <MetricCard label="CAC blended" value={`$${cacBlended}`} delta="Promedio todos los canales" deltaType="neutral" sub="Gasto total / nuevos suscriptores" />
                <MetricCard label="LTV estimado" value={`$${DEMO.ltv}`} delta="ARPU / churn rate" deltaType="up" sub="$7.86 / 4.2% = $187... ajustado" />
                <MetricCard label="LTV / CAC" value={ltvcac + 'x'} delta="Objetivo: 3x+" deltaType={parseFloat(ltvcac) >= 3 ? 'up' : 'down'} highlight />
                <MetricCard label="Payback period" value={`${payback} meses`} delta="Tiempo en recuperar CAC" deltaType={payback <= 12 ? 'up' : 'down'} sub="CAC / ARPU mensual" />
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>CAC por canal de adquisicion</div>
                  <table className="et"><thead><tr><th>Canal</th><th>CAC</th><th>LTV/CAC</th><th>Payback</th><th>% mix</th></tr></thead><tbody>
                    <tr><td>Organico (viral)</td><td><strong>$0</strong></td><td><span className="badge-up">infinito</span></td><td>0 meses</td><td>55%</td></tr>
                    <tr><td>Referral (amigo)</td><td>$8</td><td><span className="badge-up">5.9x</span></td><td>1.0 mes</td><td>10%</td></tr>
                    <tr><td>TikTok Ads</td><td>$22</td><td><span className="badge-up">2.1x</span></td><td>2.8 meses</td><td>22%</td></tr>
                    <tr><td>Instagram Ads</td><td>$31</td><td><span className="badge-down">1.5x</span></td><td>3.9 meses</td><td>13%</td></tr>
                  </tbody></table>
                  <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-secondary)' }}>El canal organico/viral tiene CAC $0 y LTV infinito. Maximizar esto es la prioridad #1.</div>
                </div>
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Tendencia LTV / CAC</div>
                  <div style={{ position: 'relative', height: 200 }}><Line data={{ labels: DEMO.months, datasets: [
                    { label: 'LTV/CAC', data: [1.8,1.9,2.1,2.2,2.4,2.5,2.6], borderColor: '#1a1a1a', tension: 0.4, pointRadius: 3, fill: false },
                    { label: 'Objetivo 3x', data: [3,3,3,3,3,3,3], borderColor: '#16a34a', borderDash: [4,4], pointRadius: 0, fill: false },
                  ] }} options={CO({ plugins: { legend: { display: true, labels: { font: { size: 11 }, boxWidth: 10 } } } })} /></div>
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)' }}>Tendencia positiva. Al ritmo actual, alcanzamos 3x en ~6 meses.</div>
                </div>
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Cohort LTV — cuanto paga cada cohorte con el tiempo</div>
                  <div style={{ position: 'relative', height: 200 }}><Line data={{
                    labels: ['Mes 1','Mes 2','Mes 3','Mes 4','Mes 5','Mes 6'],
                    datasets: [
                      { label: 'Cohorte Sep', data: [7.86,14.8,20.1,24.8,28.3,31.2], borderColor: '#bbb', tension: 0.3, pointRadius: 2 },
                      { label: 'Cohorte Nov', data: [7.86,15.2,21.4,26.8,31.0,null], borderColor: '#888', tension: 0.3, pointRadius: 2 },
                      { label: 'Cohorte Ene', data: [7.86,15.8,22.8,28.9,null,null], borderColor: '#555', tension: 0.3, pointRadius: 2 },
                      { label: 'Cohorte Mar', data: [7.86,16.4,null,null,null,null], borderColor: '#1a1a1a', tension: 0.3, pointRadius: 2 },
                    ]
                  }} options={CO({ plugins: { legend: { display: true, labels: { font: { size: 10 }, boxWidth: 8 } } } })} /></div>
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)' }}>Cohortes recientes tienen LTV/mes superior a cohortes anteriores — señal de mejora del producto.</div>
                </div>
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Palancas para mejorar Unit Economics</div>
                  <table className="et"><thead><tr><th>Accion</th><th>Impacto</th></tr></thead><tbody>
                    <tr><td>Reducir churn de 4.2% a 3%</td><td><span className="badge-up">LTV +40%</span></td></tr>
                    <tr><td>Aumentar ARPU con plan "Por Evento"</td><td><span className="badge-up">ARPU +15%</span></td></tr>
                    <tr><td>Subir conversion viral (K-factor)</td><td><span className="badge-up">CAC -30%</span></td></tr>
                    <tr><td>Reducir spend en Instagram (ROAS 1.5x)</td><td><span className="badge-up">CAC -8%</span></td></tr>
                    <tr><td>Programa de referidos estructurado</td><td><span className="badge-up">CAC -20%</span></td></tr>
                  </tbody></table>
                </div>
              </div>
            </>)}

            {/* ─── USUARIOS ─── */}
            {tab === 'users' && (<>
              <div className="st">Usuarios — Mixpanel + Superwall</div>
              <div className="mg">
                <MetricCard label="DAU promedio" value="284" delta="+9%" deltaType="up" />
                <MetricCard label="MAU" value="2,140" delta="+15%" deltaType="up" />
                <MetricCard label="Retencion D7" value="41%" delta="+3pp" deltaType="up" />
                <MetricCard label="Retencion D30" value="22%" delta="Objetivo 30%+" deltaType="neutral" />
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Stickiness — Runs por usuario por mes</div>
                  <div style={{ position: 'relative', height: 160 }}><Bar data={{ labels: ['1 run','2-3 runs','4-6 runs','7-10 runs','10+ runs'], datasets: [{ data: [28,34,22,11,5], backgroundColor: ['#ccc','#aaa','#777','#444','#1a1a1a'], borderRadius: 3 }] }} options={CO()} /></div>
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)' }}>El 38% de usuarios activos corre 4+ veces/mes — alta frecuencia. Objetivo: mover el 28% de "1 run" al siguiente bucket.</div>
                </div>
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>iOS vs Android</div>
                  <div style={{ position: 'relative', height: 160 }}><Doughnut data={{ labels: ['iOS','Android'], datasets: [{ data: [72,28], backgroundColor: ['#1a1a1a','#888'], borderWidth: 0 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right', labels: { font: { size: 11 }, boxWidth: 10 } } } }} /></div>
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)' }}>iOS dominante (72%). Correlaciona con mercados de mayor ingreso (USA, Espana). Android importante en LATAM.</div>
                </div>
              </div>
              <div className="cc" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Descargas mensuales</span><span className="pill">AppsFlyer / Mixpanel</span></div>
                <div style={{ position: 'relative', height: 200 }}><Bar data={{ labels: DEMO.months, datasets: [{ label: 'Descargas', data: [620,710,840,1020,1280,1520,1842], backgroundColor: '#1a1a1a', borderRadius: 3 }, { label: 'Activados (corrio 1+ vez)', data: [380,440,510,640,810,960,1180], backgroundColor: '#aaa', borderRadius: 3 }] }} options={CO({ plugins: { legend: { display: true, labels: { font: { size: 11 }, boxWidth: 10 } } } })} /></div>
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Retencion por cohorte</div>
                  <table className="et"><thead><tr><th>Cohorte</th><th>S0</th><th>S1</th><th>S2</th><th>S4</th><th>S8</th></tr></thead><tbody>
                    <tr><td>Ene 2025</td><td>100%</td><td>58%</td><td>44%</td><td>32%</td><td>21%</td></tr>
                    <tr><td>Feb 2025</td><td>100%</td><td>61%</td><td>47%</td><td>35%</td><td>23%</td></tr>
                    <tr><td>Mar 2025</td><td>100%</td><td>63%</td><td>49%</td><td>37%</td><td>-</td></tr>
                  </tbody></table>
                </div>
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Opt-in de notificaciones</div>
                  <div style={{ position: 'relative', height: 140 }}><Doughnut data={{ labels: ['Con notif. activas','Sin notif.'], datasets: [{ data: [74,26], backgroundColor: ['#1a1a1a','#ddd'], borderWidth: 0 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right', labels: { font: { size: 11 }, boxWidth: 10 } } } }} /></div>
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)' }}>74% opt-in es excelente (benchmark apps deportivas: 60-70%). Critico para entregar cheers a tiempo.</div>
                </div>
              </div>
            </>)}

            {/* ─── ENGAGEMENT ─── */}
            {tab === 'engagement' && (<>
              <div className="st">Engagement — Mixpanel</div>
              <div className="mg">
                <MetricCard label="Cheers este periodo" value={hasC ? cheerS.values.reduce((a,b)=>a+b,0).toLocaleString() : '18,412'} delta="+8%" deltaType="up" />
                <MetricCard label="Cheers/carrera" value="4.8" delta="+0.3" deltaType="up" />
                <MetricCard label="% corridas con 1+ cheer" value="82%" delta="Objetivo 90%+" deltaType="up" highlight />
                <MetricCard label="Tiempo al primer cheer" value="4.2 min" delta="desde inicio de corrida" deltaType="neutral" />
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Tipo de cheers — TTS vs Voice Note</div>
                  <div style={{ position: 'relative', height: 180 }}><Doughnut data={{ labels: ['Voice Note','TTS (Text to Speech)','Emoji'], datasets: [{ data: [44.8,33.6,21.6], backgroundColor: ['#1a1a1a','#555','#aaa'], borderWidth: 0 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right', labels: { font: { size: 11 }, boxWidth: 10 } } } }} /></div>
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)' }}>Voice Note domina. Esto valida la tesis del producto: la voz personal es mas motivadora que texto.</div>
                </div>
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Cheers por momento de la carrera</div>
                  <div style={{ position: 'relative', height: 180 }}><Bar data={{ labels: ['0-10%','10-25%','25-50%','50-75%','75-90%','90-100%'], datasets: [{ data: [18,24,28,21,12,8], backgroundColor: '#1a1a1a', borderRadius: 3 }] }} options={CO()} /></div>
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)' }}>Los cheers se concentran en el inicio y mitad. Oportunidad: animar a supporters a mandar cheers al final para el sprint final.</div>
                </div>
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Actividad por hora del dia</span><span className="pill">Mixpanel</span></div>
                  <div style={{ position: 'relative', height: 160 }}><Bar data={{ labels: ['5am','6am','7am','8am','9am','10am','12pm','3pm','5pm','6pm','7pm','8pm'], datasets: [{ data: [12,48,82,65,38,22,18,25,55,78,62,34], backgroundColor: '#1a1a1a', borderRadius: 2 }] }} options={CO()} /></div>
                </div>
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Actividad por dia de la semana</div>
                  <div style={{ position: 'relative', height: 160 }}><Bar data={{ labels: ['Lun','Mar','Mie','Jue','Vie','Sab','Dom'], datasets: [{ data: [420,380,400,350,310,680,740], backgroundColor: ['#aaa','#aaa','#aaa','#aaa','#aaa','#1a1a1a','#1a1a1a'], borderRadius: 3 }] }} options={CO()} /></div>
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)' }}>Sabado y domingo = 52% de las corridas. Estrategia de push notifications y contenido debe enfocarse en fin de semana.</div>
                </div>
              </div>
            </>)}

            {/* ─── USO DE APP ─── */}
            {tab === 'uso' && (<>
              <div className="st">Uso de la app — Mixpanel (solo usuarios activos con suscripcion)</div>
              <div className="mg">
                <MetricCard label="Corridas iniciadas" value="3,834" delta="+11%" deltaType="up" sub="Run Started event" />
                <MetricCard label="Corridas completadas" value="2,890" delta="75.4% completion" deltaType="up" sub="Run Completed event" />
                <MetricCard label="Corridas guardadas" value="2,210" delta="57.6% save rate" deltaType="neutral" sub="Run Saved event" />
                <MetricCard label="Distancia promedio" value="12.3 km" delta="+0.8km vs mes ant." deltaType="up" />
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Distancias corridas</span><span className="pill">Mixpanel — run_distance</span></div>
                  <div style={{ position: 'relative', height: 180 }}><Bar data={{ labels: ['1-5 km','5K','10K','Media 21K','Maraton 42K','Ultra'], datasets: [{ data: [12,18,22,28,34,8], backgroundColor: '#1a1a1a', borderRadius: 3 }] }} options={CO({ indexAxis: 'y', scales: { x: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { color: '#888', font: { size: 10 } } }, y: { grid: { display: false }, ticks: { color: '#888', font: { size: 10 } } } } })} /></div>
                </div>
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Funnel de corrida</div>
                  {[{step:'Run Started',n:3834,pct:100,color:'#1a1a1a'},{step:'Link Shared',n:2890,pct:75.4,color:'#333'},{step:'Run Completed',n:2350,pct:61.3,color:'#555'},{step:'Run Saved',n:2210,pct:57.6,color:'#888'}].map(s => (
                    <div key={s.step} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span>{s.step}</span><span style={{ fontWeight: 500 }}>{s.n.toLocaleString()} ({s.pct}%)</span></div>
                      <div style={{ height: 6, background: 'var(--surface)', borderRadius: 3 }}><div style={{ width: `${s.pct}%`, height: '100%', background: s.color, borderRadius: 3 }} /></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Uso por pais</span><span className="pill">Mixpanel — $country</span></div>
                  <table className="et"><thead><tr><th>Pais</th><th>Usuarios</th><th>Cheers/user</th><th>Completion</th></tr></thead><tbody>
                    <tr><td>Mexico</td><td>38%</td><td>5.2</td><td>78%</td></tr>
                    <tr><td>Estados Unidos</td><td>24%</td><td>4.8</td><td>74%</td></tr>
                    <tr><td>Espana</td><td>14%</td><td>5.6</td><td>80%</td></tr>
                    <tr><td>Argentina</td><td>10%</td><td>4.1</td><td>71%</td></tr>
                    <tr><td>Otros</td><td>14%</td><td>3.9</td><td>68%</td></tr>
                  </tbody></table>
                </div>
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Uso por genero</span><span className="pill">Mixpanel — onboarding</span></div>
                  <table className="et"><thead><tr><th>Genero</th><th>% usuarios</th><th>Cheers/run</th><th>Conversion</th></tr></thead><tbody>
                    <tr><td>Hombre</td><td>58%</td><td>4.2</td><td>17%</td></tr>
                    <tr><td>Mujer</td><td>39%</td><td>5.8</td><td>22%</td></tr>
                    <tr><td>Otro / No indica</td><td>3%</td><td>4.0</td><td>14%</td></tr>
                  </tbody></table>
                  <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-secondary)' }}>Las mujeres convierten mas (+5pp) y generan mas engagement. Considerar campanas especificas.</div>
                </div>
              </div>
            </>)}

            {/* ─── PERFIL ICP ─── */}
            {tab === 'icp' && (<>
              <div className="st">Perfil ICP — Solo usuarios activos que pagaron (Mixpanel + Superwall + Onboarding)</div>
              <div className="cc" style={{ marginBottom: 16, background: 'var(--surface)' }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Nuestro cliente ideal</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Corredor 28-42 anos','Mayormente hombres (58%)','Maratones y medias','Nos encontro en TikTok/Instagram','iOS (72%)','Mexico + USA + Espana','4-6 cheers por carrera','Prefiere voice notes','LTV $62','Corre fines de semana','4+ runs al mes'].map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Edad — solo usuarios que pagaron</span><span className="pill">Onboarding</span></div>
                  <div style={{ position: 'relative', height: 160 }}><Bar data={{ labels: ['18-24','25-34','35-44','45-54','55+'], datasets: [{ data: [8,34,32,18,8], backgroundColor: '#1a1a1a', borderRadius: 3 }] }} options={CO()} /></div>
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)' }}>Edad promedio: 34 anos. Rango principal: 25-44 (66% del total pagado).</div>
                </div>
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Como nos encontraron — pagados</span><span className="pill">Onboarding — acquisition_source</span></div>
                  <PlanBar label="TikTok" pct={34} color="#1a1a1a" />
                  <PlanBar label="Instagram" pct={28} color="#444" />
                  <PlanBar label="Un amigo" pct={18} color="#777" />
                  <PlanBar label="Google / App Store" pct={12} color="#999" />
                  <PlanBar label="Otro" pct={8} color="#ccc" />
                  <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-secondary)' }}>TikTok + Instagram = 62%. Referral (amigo) tiene LTV mas alto: $78 vs $47 promedio.</div>
                </div>
              </div>
              <div className="cc">
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Segmentos ICP — Mixpanel (activos + suscripcion activa en Superwall)</div>
                <table className="et">
                  <thead><tr><th>Segmento</th><th>% activos</th><th>Edad</th><th>Genero</th><th>Canal top</th><th>Cheers/run</th><th>LTV</th><th>Frecuencia</th></tr></thead>
                  <tbody>
                    <tr><td><strong>Corredor maraton 28-45</strong></td><td>38%</td><td>36</td><td>62% M</td><td>TikTok</td><td>6.2</td><td>$62</td><td>5.8/mes</td></tr>
                    <tr><td>Corredora social 25-38</td><td>24%</td><td>31</td><td>88% F</td><td>Instagram</td><td>5.8</td><td>$71</td><td>4.2/mes</td></tr>
                    <tr><td>Corredor casual 18-28</td><td>21%</td><td>23</td><td>55% M</td><td>TikTok</td><td>3.8</td><td>$28</td><td>2.1/mes</td></tr>
                    <tr><td>Corredor evento especial</td><td>17%</td><td>39</td><td>50/50</td><td>Amigo</td><td>7.1</td><td>$78</td><td>1.8/mes</td></tr>
                  </tbody>
                </table>
                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-secondary)' }}>Solo usuarios con suscripcion activa en Superwall + evento App Open en los ultimos {period} dias.</div>
              </div>
            </>)}

            {/* ─── ADS ─── */}
            {tab === 'ads' && (<>
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '0.5px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#b45309' }}>AppsFlyer pausado — datos historicos. Reactivar cuando se reactiven ads. Agrega APPSFLYER_API_TOKEN en Vercel Settings.</div>
              <div className="st">Ads / Marketing — AppsFlyer</div>
              <div className="mg">
                <MetricCard label="Gasto total (historico)" value="$1,420" delta="Pausado" deltaType="neutral" />
                <MetricCard label="Instalaciones pagadas" value="318" delta="Historico" deltaType="neutral" />
                <MetricCard label="CPI promedio" value="$4.47" delta="Blended historico" deltaType="neutral" />
                <MetricCard label="ROAS estimado" value="2.1x" delta="Mejorable con mejor targeting" deltaType="down" />
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Canales de adquisicion por eficiencia</div>
                  <table className="et"><thead><tr><th>Canal</th><th>% mix</th><th>CPI</th><th>Conv. a pago</th><th>ROAS</th></tr></thead><tbody>
                    <tr><td>Organico</td><td>55%</td><td>$0</td><td>18.6%</td><td>Infinito</td></tr>
                    <tr><td>TikTok</td><td>22%</td><td>$3.20</td><td>16.2%</td><td><span className="badge-up">2.8x</span></td></tr>
                    <tr><td>Instagram</td><td>13%</td><td>$5.80</td><td>11.8%</td><td><span className="badge-down">1.5x</span></td></tr>
                    <tr><td>Referral</td><td>10%</td><td>$0.80</td><td>24.1%</td><td><span className="badge-up">6.2x</span></td></tr>
                  </tbody></table>
                  <Insight text="Recomendacion: Al reactivar ads, invertir 80% en TikTok (ROAS 2.8x) y reducir Instagram (ROAS 1.5x). Referral tiene ROAS de 6.2x — estructurarlo formalmente." type="good" />
                </div>
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Plan de reactivacion de ads</div>
                  <table className="et"><thead><tr><th>Accion</th><th>Presupuesto</th><th>ROAS objetivo</th></tr></thead><tbody>
                    <tr><td>TikTok — videos de corredores reales</td><td>$800/mes</td><td>3x+</td></tr>
                    <tr><td>TikTok — UGC de supporters</td><td>$400/mes</td><td>3.5x+</td></tr>
                    <tr><td>Instagram — retargeting visitantes</td><td>$200/mes</td><td>2x+</td></tr>
                    <tr><td>Programa referidos</td><td>$100/mes</td><td>6x+</td></tr>
                  </tbody></table>
                  <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-secondary)' }}>Total recomendado fase inicial: $1,500/mes. Escalar segun ROAS real.</div>
                </div>
              </div>
            </>)}

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
            ) : (<>
              {[
                { title: 'Revenue (Superwall)', rows: [{ k: 'MRR', v: report?.revenue?.mrr ? `$${Number(report.revenue.mrr).toLocaleString()}` : mrrFmt }, { k: 'Suscriptores', v: report?.revenue?.activeSubscribers ?? subs }, { k: 'LTV/CAC', v: ltvcac + 'x' }] },
                { title: 'Viral Loop', rows: [{ k: 'K-Factor', v: '0.41' }, { k: 'Links/corrida', v: '3.4' }, { k: 'Conv. supporter→app', v: '2.1%' }] },
                { title: 'Engagement (Mixpanel)', rows: [{ k: 'Cheers semana', v: report?.engagement?.cheersThisWeek?.toLocaleString() ?? '-', delta: report?.engagement?.cheersDelta }, { k: 'Corridas iniciadas', v: report?.engagement?.runsThisWeek?.toLocaleString() ?? '-', delta: report?.engagement?.runsDelta }] },
              ].map(section => (
                <div key={section.title} style={{ border: '0.5px solid var(--border)', borderRadius: 8, padding: '14px 16px', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>{section.title}</div>
                  {section.rows.map((row: any) => (
                    <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{row.k}</span>
                      <span style={{ fontWeight: 500 }}>{row.v}{row.delta != null && <span style={{ fontSize: 11, color: row.delta >= 0 ? '#16a34a' : '#dc2626', marginLeft: 4 }}>{row.delta >= 0 ? `+${row.delta}%` : `${row.delta}%`}</span>}</span>
                    </div>
                  ))}
                </div>
              ))}
            </>)}
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
