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

function MC({ label, value, delta, dt, sub, highlight }: any) {
  const dc = dt === 'up' ? '#16a34a' : dt === 'down' ? '#dc2626' : '#888';
  return (
    <div style={{ background: highlight ? 'linear-gradient(135deg,#1a1a1a,#333)' : 'var(--card)', border: highlight ? 'none' : '0.5px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: highlight ? 'rgba(255,255,255,0.6)' : 'var(--text-secondary)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, color: highlight ? '#fff' : 'var(--text-primary)', lineHeight: 1.1 }}>{value}</div>
      {delta && <div style={{ fontSize: 11, marginTop: 4, color: highlight ? 'rgba(255,255,255,0.7)' : dc }}>{delta}</div>}
      {sub && <div style={{ fontSize: 10, marginTop: 3, color: highlight ? 'rgba(255,255,255,0.5)' : 'var(--text-secondary)' }}>{sub}</div>}
    </div>
  );
}

function PB({ label, pct, color, value }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 110, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 36, textAlign: 'right' }}>{value ?? pct + '%'}</span>
    </div>
  );
}

function FunnelStep({ label, n, pct, prev, color }: any) {
  return (
    <div style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</div>
      <div style={{ width: `${Math.max(pct, 20)}%`, margin: '0 auto', background: color, borderRadius: 6, padding: '10px 4px' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{n.toLocaleString()}</div>
      </div>
      {prev && <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>{Math.round((n/prev)*100)}% del anterior</div>}
    </div>
  );
}

const CO = (extra?: any) => ({
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { bodyFont: { size: 11 }, titleFont: { size: 11 } } },
  scales: {
    x: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { color: '#888', font: { size: 10 } } },
    y: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { color: '#888', font: { size: 10 } } },
  }, ...extra,
});

function buildSeries(data: any) {
  if (!data?.data?.series) return { labels: [] as string[], values: [] as number[] };
  const s = data.data.series;
  const dates = [...new Set(Object.keys(s).flatMap((k: string) => Object.keys(s[k])))].sort() as string[];
  return { labels: dates.map((d: string) => d.slice(5)), values: dates.map((d: string) => (Object.values(s) as any[]).reduce((sum: number, ev: any) => sum + (ev[d] || 0), 0)) };
}

const M = ['Sep','Oct','Nov','Dic','Ene','Feb','Mar'];
const DEMO = { mrr: 3240, arr: 38880, ltv: 47, churn: 4.2, subs: 412, downloads: 1842, mrrH: [1200,1450,1680,1920,2300,2890,3240] };

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
    fetch(`/api/dashboard?days=${period}`).then(r=>r.json()).then(d=>{setData(d);setLoading(false);}).catch(()=>{setData(null);setLoading(false);});
  }, [period]);

  const mrr = data?.revenue?.mrr ?? DEMO.mrr;
  const arr = data?.revenue?.arr ?? DEMO.arr;
  const subs = data?.subscribers?.total ?? DEMO.subs;
  const mrrFmt = `$${Number(mrr).toLocaleString()}`;
  const src = data?.sources ?? {};
  const cheerS = buildSeries(data?.engagement?.cheers);
  const runS = buildSeries(data?.engagement?.runs);
  const hasC = cheerS.labels.length > 0;

  async function genReport() {
    setReportLoading(true); setShowReport(true);
    try { setReport(await (await fetch('/api/weekly-report')).json()); } catch { setReport(null); }
    setReportLoading(false);
  }

  function copyReport() {
    if (!report?.text) return;
    navigator.clipboard.writeText(report.text).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});
  }

  const dot = (s: string) => s==='connected'?'#16a34a':s==='not_configured'?'#888':'#f59e0b';

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
        .et th{color:var(--text-secondary);font-weight:400;text-align:left;padding:0 0 8px;border-bottom:0.5px solid var(--border)}
        .et td{padding:7px 4px;border-bottom:0.5px solid var(--border);color:var(--text-primary)}
        .et tr:last-child td{border-bottom:none}
        select{font-size:12px;padding:5px 10px;border-radius:8px;border:0.5px solid var(--border);background:var(--card);color:var(--text-primary);cursor:pointer}
        .pill{font-size:10px;padding:2px 7px;border-radius:20px;border:0.5px solid var(--border);color:var(--text-secondary)}
        .tag{display:inline-block;font-size:10px;padding:2px 8px;border-radius:20px;margin:2px;background:var(--surface);color:var(--text-secondary)}
        .alert{background:rgba(245,158,11,0.1);border:0.5px solid rgba(245,158,11,0.3);border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:#b45309}
        .badge-green{background:#dcfce7;color:#166534;font-size:10px;padding:2px 7px;border-radius:20px}
        .badge-red{background:#fee2e2;color:#991b1b;font-size:10px;padding:2px 7px;border-radius:20px}
        .badge-yellow{background:#fef9c3;color:#854d0e;font-size:10px;padding:2px 7px;border-radius:20px}
        @media(max-width:768px){.mg{grid-template-columns:repeat(2,1fr)}.cr{grid-template-columns:1fr}}
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <div style={{ width: 220, background: 'var(--sb)', borderRight: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '20px 0', flexShrink: 0, minHeight: '100vh' }}>
          <div style={{ padding: '0 20px 18px', borderBottom: '0.5px solid var(--border)', marginBottom: 16 }}>
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
              <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 8px', borderRadius: 8, fontSize: 13, border: 'none', background: tab===t.id?'var(--surface)':'transparent', color: tab===t.id?'var(--text-primary)':'var(--text-secondary)', fontWeight: tab===t.id?500:400, marginBottom: 1, cursor: 'pointer' }}>{t.label}</button>
            ))}
          </div>
          <div style={{ marginTop: 'auto', padding: '16px 20px 0', borderTop: '0.5px solid var(--border)' }}>
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
              <div style={{ fontSize: 15, fontWeight: 500 }}>{TABS.find(t=>t.id===tab)?.label ?? 'Overview'}</div>
              {loading && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Cargando datos...</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <select value={period} onChange={e=>setPeriod(Number(e.target.value))}>
                {PERIODS.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <button onClick={genReport} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--card)', color: 'var(--text-primary)', fontWeight: 500, cursor: 'pointer' }}>Generar reporte</button>
            </div>
          </div>

          <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

            {/* OVERVIEW */}
            {tab==='overview' && (<>
              <div className="st">Metricas clave</div>
              <div className="mg">
                <MC label="MRR" value={mrrFmt} delta={data?.revenue?.mrr ? 'datos reales' : '+12% (demo)'} dt="up" />
                <MC label="Suscriptores activos" value={subs.toLocaleString()} delta="desde Superwall" dt="up" />
                <MC label="K-Factor viral" value="0.41" delta="objetivo: 1.0 para crecimiento organico" dt="up" highlight />
                <MC label="Churn mensual" value={`${DEMO.churn}%`} delta="+0.3pp este mes" dt="down" />
                <MC label="LTV estimado" value={`$${DEMO.ltv}`} delta="LTV/CAC = 2.6x" dt="neutral" />
                <MC label="CAC promedio" value="$18" delta="organico: $0 | TikTok: $22" dt="neutral" />
                <MC label="Conversion free-paid" value="18.6%" delta="+2.1pp" dt="up" />
                <MC label="ARR proyectado" value={`$${arr?Number(arr).toLocaleString():DEMO.arr.toLocaleString()}`} delta="con MRR actual" dt="up" />
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>MRR mensual</span><span className="pill">Superwall</span></div>
                  <div style={{ position: 'relative', height: 180 }}><Line data={{ labels: M, datasets: [{ data: DEMO.mrrH, borderColor: '#1a1a1a', backgroundColor: 'rgba(26,26,26,0.06)', fill: true, tension: 0.4, pointRadius: 3 }] }} options={CO()} /></div>
                </div>
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>K-Factor (tendencia)</span><span className="pill">Mixpanel calculado</span></div>
                  <div style={{ position: 'relative', height: 180 }}><Line data={{ labels: M, datasets: [{ data: [0.24,0.27,0.29,0.32,0.35,0.38,0.41], borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.08)', fill: true, tension: 0.4, pointRadius: 3 }, { data: [1,1,1,1,1,1,1], borderColor: '#dc2626', borderDash: [4,4], borderWidth: 1, pointRadius: 0, fill: false }] }} options={CO({ plugins: { legend: { display: false } } })} /></div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>Linea roja = K=1.0, crecimiento exponencial</div>
                </div>
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Movimiento MRR este mes</span><span className="pill">Superwall</span></div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                    {[{label:'Nuevo MRR',val:'+$620',color:'#16a34a'},{label:'Expansion',val:'+$140',color:'#2563eb'},{label:'Reactivacion',val:'+$80',color:'#7c3aed'},{label:'Churned MRR',val:'-$290',color:'#dc2626'}].map(x=>(
                      <div key={x.label} style={{ textAlign: 'center', padding: '12px 8px', background: 'var(--surface)', borderRadius: 8 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: x.color }}>{x.val}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>{x.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--surface)', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Net New MRR</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#16a34a' }}>+$550</span>
                  </div>
                </div>
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Cheers enviados</span><span className="pill">Mixpanel</span></div>
                  <div style={{ position: 'relative', height: 160 }}>
                    {hasC ? <Bar data={{ labels: cheerS.labels, datasets: [{ data: cheerS.values, backgroundColor: '#1a1a1a', borderRadius: 3 }] }} options={CO()} /> : <Bar data={{ labels: M, datasets: [{ data: [2100,2800,3200,4100,5200,6800,8200], backgroundColor: '#1a1a1a', borderRadius: 3 }] }} options={CO()} />}
                  </div>
                </div>
              </div>
            </>)}

            {/* LOOP VIRAL */}
            {tab==='viral' && (<>
              <div className="st">Loop viral - el motor de crecimiento de Cheer My Run</div>
              <div style={{ background: 'linear-gradient(135deg,#1a1a1a,#333)', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>K-FACTOR ACTUAL</div>
                    <div style={{ fontSize: 48, fontWeight: 600, color: '#f97316', lineHeight: 1 }}>0.41</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>Cada 100 corredores generan 41 nuevos usuarios</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>COMPONENTES</div>
                    {[{k:'Links compartidos/runner',v:'68%'},{k:'Visitas/link compartido',v:'4.2'},{k:'Cheer enviado/visita',v:'2.1'},{k:'Download/link visitado',v:'14.4%'}].map(x=>(
                      <div key={x.k} style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{x.k}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{x.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="cc" style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Funnel viral - de corredor a nuevo suscriptor</div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
                  <FunnelStep label="Corrida iniciada" n={3834} pct={100} color="#1a1a1a" />
                  <FunnelStep label="Link compartido" n={2607} pct={68} prev={3834} color="#333" />
                  <FunnelStep label="Visitante supporter" n={10949} pct={100} color="#555" />
                  <FunnelStep label="Cheer enviado" n={8240} pct={75} prev={10949} color="#777" />
                  <FunnelStep label="Descarga app" n={1577} pct={14} prev={10949} color="#999" />
                  <FunnelStep label="Suscriptor nuevo" n={284} pct={18} prev={1577} color="#f97316" />
                </div>
                <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-secondary)', padding: '10px 12px', background: 'var(--surface)', borderRadius: 8 }}>
                  El cuello de botella principal es la conversion de visita a descarga (14.4%). Mejorar la pagina del supporter de 14.4% a 25% triplicaria el crecimiento organico.
                </div>
              </div>

              <div className="cr">
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>K-Factor tendencia mensual</div>
                  <div style={{ position: 'relative', height: 180 }}><Line data={{ labels: M, datasets: [{ data: [0.24,0.27,0.29,0.32,0.35,0.38,0.41], borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.08)', fill: true, tension: 0.4, pointRadius: 4 }, { data: [1,1,1,1,1,1,1], borderColor: '#dc2626', borderDash: [4,4], borderWidth: 1.5, pointRadius: 0, fill: false }] }} options={CO()} /></div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>Objetivo K=1.0 para crecimiento exponencial sin ads</div>
                </div>
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Supporters que se volvieron runners</div>
                  <div className="mg2" style={{ marginBottom: 12 }}>
                    <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 500 }}>184</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Supporters que descargaron</div>
                    </div>
                    <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 500, color: '#f97316' }}>$71</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>LTV promedio (vs $47 normal)</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', padding: '10px 12px', background: 'var(--surface)', borderRadius: 8 }}>
                    Usuarios adquiridos via supporters tienen LTV 51% mas alto. Son el segmento mas valioso.
                  </div>
                </div>
              </div>

              <div className="cc">
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Palancas para subir K-Factor</div>
                <table className="et">
                  <thead><tr><th>Accion</th><th>Impacto en K</th><th>Dificultad</th><th>Estado</th></tr></thead>
                  <tbody>
                    <tr><td>Mejorar pagina supporter (2.1% -&gt; 5%)</td><td style={{ color: '#16a34a', fontWeight: 600 }}>+0.24 (+59%)</td><td><span className="badge-yellow">Media</span></td><td><span className="badge-red">Pendiente</span></td></tr>
                    <tr><td>Recordatorio push para compartir link</td><td style={{ color: '#16a34a', fontWeight: 600 }}>+0.08 (+20%)</td><td><span className="badge-green">Baja</span></td><td><span className="badge-red">Pendiente</span></td></tr>
                    <tr><td>Programa de referidos runner-a-runner</td><td style={{ color: '#16a34a', fontWeight: 600 }}>+0.12 (+29%)</td><td><span className="badge-yellow">Media</span></td><td><span className="badge-red">Pendiente</span></td></tr>
                    <tr><td>Notificacion post-carrera con resumen</td><td style={{ color: '#16a34a', fontWeight: 600 }}>+0.05 (+12%)</td><td><span className="badge-green">Baja</span></td><td><span className="badge-red">Pendiente</span></td></tr>
                    <tr><td>Share de resultados en redes sociales</td><td style={{ color: '#16a34a', fontWeight: 600 }}>+0.09 (+22%)</td><td><span className="badge-yellow">Media</span></td><td><span className="badge-red">Pendiente</span></td></tr>
                  </tbody>
                </table>
                <div style={{ marginTop: 12, padding: '10px 12px', background: '#dcfce7', borderRadius: 8 }}>
                  <span style={{ fontSize: 12, color: '#166534', fontWeight: 500 }}>Potencial:</span>
                  <span style={{ fontSize: 12, color: '#166534' }}> Con las 3 primeras acciones, K-Factor podria llegar a 0.85 en 90 dias, reduciendo CAC 60%.</span>
                </div>
              </div>
            </>)}

            {/* REVENUE */}
            {tab==='revenue' && (<>
              <div className="st">Revenue - Superwall</div>
              <div className="mg">
                <MC label="MRR" value={mrrFmt} delta="+12% MoM" dt="up" />
                <MC label="ARR proyectado" value={`$${arr?Number(arr).toLocaleString():'38,880'}`} delta="+12% MoM" dt="up" />
                <MC label="ARPU" value="$7.86" delta="+$0.42 vs mes ant." dt="up" />
                <MC label="LTV estimado" value={`$${DEMO.ltv}`} delta="payback: 3 meses" dt="neutral" />
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>MRR - 6 meses</span><span className="pill">Superwall</span></div>
                  <div style={{ position: 'relative', height: 200 }}><Bar data={{ labels: M, datasets: [{ data: DEMO.mrrH, backgroundColor: '#1a1a1a', borderRadius: 4 }] }} options={CO()} /></div>
                </div>
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Movimiento MRR mensual (waterfall)</div>
                  <div style={{ position: 'relative', height: 200 }}><Bar data={{ labels: M, datasets: [
                    { label: 'Nuevo MRR', data: [180,210,260,330,410,520,620], backgroundColor: '#16a34a', borderRadius: 2 },
                    { label: 'Expansion MRR', data: [40,50,60,70,90,110,140], backgroundColor: '#2563eb', borderRadius: 2 },
                    { label: 'Churn MRR', data: [-90,-110,-130,-150,-180,-220,-290], backgroundColor: '#dc2626', borderRadius: 2 },
                  ] }} options={CO({ plugins: { legend: { display: true, labels: { font: { size: 10 }, boxWidth: 10 } } }, scales: { x: { stacked: true, grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { color: '#888', font: { size: 10 } } }, y: { stacked: true, grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { color: '#888', font: { size: 10 } } } } })} /></div>
                </div>
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Churn mensual % - tendencia</div>
                  <div style={{ position: 'relative', height: 160 }}><Line data={{ labels: M, datasets: [{ data: [6.2,5.8,5.1,4.8,4.5,3.9,4.2], borderColor: '#dc2626', tension: 0.4, pointRadius: 3, fill: false }] }} options={CO()} /></div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>Meta: &lt;3.5% — actualmente en 4.2% (subio 0.3pp este mes)</div>
                </div>
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Revenue por plan</div>
                  <div style={{ position: 'relative', height: 160 }}><Doughnut data={{ labels: ['Anual','Mensual','Semanal'], datasets: [{ data: [62,27,11], backgroundColor: ['#1a1a1a','#888','#ccc'], borderWidth: 0 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right', labels: { font: { size: 11 }, boxWidth: 10 } } } }} /></div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>Anual = 62% del revenue. Proximo: pricing por evento/carrera.</div>
                </div>
              </div>
              <div className="cc">
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Revenue por pais - concentracion de riesgo</div>
                <table className="et">
                  <thead><tr><th>Pais</th><th>% Revenue</th><th>Suscriptores</th><th>ARPU</th><th>Riesgo</th></tr></thead>
                  <tbody>
                    <tr><td>Mexico</td><td>38%</td><td>156</td><td>$7.90</td><td><span className="badge-red">Alta concentracion</span></td></tr>
                    <tr><td>Estados Unidos</td><td>29%</td><td>99</td><td>$9.50</td><td><span className="badge-green">Saludable</span></td></tr>
                    <tr><td>Espana</td><td>16%</td><td>66</td><td>$7.85</td><td><span className="badge-green">Saludable</span></td></tr>
                    <tr><td>Argentina</td><td>8%</td><td>49</td><td>$5.30</td><td><span className="badge-yellow">ARPU bajo</span></td></tr>
                    <tr><td>Otros</td><td>9%</td><td>42</td><td>$6.90</td><td><span className="badge-green">Diversificado</span></td></tr>
                  </tbody>
                </table>
              </div>
            </>)}

            {/* UNIT ECONOMICS */}
            {tab==='uniteconomics' && (<>
              <div className="st">Unit economics - sostenibilidad del modelo</div>
              <div className="mg">
                <MC label="LTV promedio" value="$47" delta="cohort 12 meses" dt="up" />
                <MC label="CAC promedio" value="$18" delta="blended (org + paid)" dt="neutral" />
                <MC label="LTV/CAC ratio" value="2.6x" delta="objetivo: 3x+" dt="up" highlight />
                <MC label="Payback period" value="3 meses" delta="excelente para SaaS" dt="up" />
              </div>

              <div className="cr">
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>CAC por canal de adquisicion</div>
                  <div style={{ position: 'relative', height: 180 }}><Bar data={{ labels: ['Organico','Referral','TikTok','Instagram'], datasets: [{ data: [0, 8, 22, 31], backgroundColor: ['#16a34a','#2563eb','#f97316','#dc2626'], borderRadius: 4 }] }} options={CO()} /></div>
                  <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-secondary)' }}>El canal organico (K-Factor) es el mas eficiente — CAC = $0</div>
                </div>
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>LTV/CAC por canal</div>
                  <div style={{ position: 'relative', height: 180 }}><Bar data={{ labels: ['Organico','Referral','TikTok','Instagram'], datasets: [{ data: [null, 5.9, 2.1, 1.5], backgroundColor: ['#16a34a','#2563eb','#f97316','#dc2626'], borderRadius: 4 }] }} options={CO()} /></div>
                  <div style={{ marginTop: 12, fontSize: 11, color: '#dc2626' }}>Instagram LTV/CAC = 1.5x — bajo el minimo saludable de 3x. Reducir gasto.</div>
                </div>
              </div>

              <div className="cc" style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Curvas LTV por cohorte - acumulado por mes</div>
                <div style={{ position: 'relative', height: 200 }}><Line data={{ labels: ['M0','M1','M2','M3','M4','M5','M6','M9','M12'], datasets: [
                  { label: 'Organico ($0 CAC)', data: [8,15,21,26,30,33,36,41,47], borderColor: '#16a34a', tension: 0.4, pointRadius: 2, fill: false },
                  { label: 'Referral ($8 CAC)', data: [8,16,23,30,36,41,46,55,71], borderColor: '#2563eb', tension: 0.4, pointRadius: 2, fill: false },
                  { label: 'TikTok ($22 CAC)', data: [8,14,19,24,28,31,34,39,45], borderColor: '#f97316', tension: 0.4, pointRadius: 2, fill: false },
                ] }} options={CO({ plugins: { legend: { display: true, labels: { font: { size: 10 }, boxWidth: 10 } } } })} /></div>
                <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-secondary)' }}>Usuarios de Referral tienen LTV 51% mas alto que promedio. Prioridad maxima: programa de referidos.</div>
              </div>

              <div className="cc">
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Analisis por canal - resumen ejecutivo</div>
                <table className="et">
                  <thead><tr><th>Canal</th><th>CAC</th><th>LTV</th><th>LTV/CAC</th><th>Payback</th><th>Recomendacion</th></tr></thead>
                  <tbody>
                    <tr><td><strong>Organico (K-Factor)</strong></td><td>$0</td><td>$47</td><td style={{ color: '#16a34a', fontWeight: 600 }}>infinito</td><td>-</td><td><span className="badge-green">Invertir en mejorar</span></td></tr>
                    <tr><td>Referral (amigo)</td><td>$8</td><td>$71</td><td style={{ color: '#16a34a', fontWeight: 600 }}>5.9x</td><td>1.4 m</td><td><span className="badge-green">Escalar urgente</span></td></tr>
                    <tr><td>TikTok</td><td>$22</td><td>$47</td><td style={{ color: '#f97316', fontWeight: 600 }}>2.1x</td><td>5.6 m</td><td><span className="badge-yellow">Mantener, optimizar</span></td></tr>
                    <tr><td>Instagram</td><td>$31</td><td>$47</td><td style={{ color: '#dc2626', fontWeight: 600 }}>1.5x</td><td>7.9 m</td><td><span className="badge-red">Reducir gasto</span></td></tr>
                  </tbody>
                </table>
              </div>
            </>)}

            {/* USUARIOS */}
            {tab==='users' && (<>
              <div className="st">Usuarios - Mixpanel + Superwall</div>
              <div className="mg">
                <MC label="DAU promedio" value="284" delta="+9%" dt="up" />
                <MC label="MAU" value="2,140" delta="+15%" dt="up" />
                <MC label="Stickiness (DAU/MAU)" value="13.3%" delta="runners activos diarios" dt="neutral" sub="Normal para apps de carrera" />
                <MC label="Retencion D30" value="22%" delta="Estable" dt="neutral" />
              </div>
              <div className="cc" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Descargas vs Activaciones mensuales</span><span className="pill">AppsFlyer / Mixpanel</span></div>
                <div style={{ position: 'relative', height: 200 }}><Bar data={{ labels: M, datasets: [{ label: 'Descargas', data: [620,710,840,1020,1280,1520,1842], backgroundColor: '#1a1a1a', borderRadius: 3 }, { label: 'Activados', data: [380,440,510,640,810,960,1180], backgroundColor: '#aaa', borderRadius: 3 }] }} options={CO({ plugins: { legend: { display: true, labels: { font: { size: 11 }, boxWidth: 10 } } } })} /></div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>Activacion rate: ~64% — oportunidad de mejorar onboarding para subir a 75%+</div>
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Retencion por cohorte (semanas)</div>
                  <table className="et"><thead><tr><th>Cohorte</th><th>S0</th><th>S1</th><th>S2</th><th>S4</th><th>S8</th></tr></thead><tbody>
                    <tr><td>Ene 2025</td><td>100%</td><td>58%</td><td>44%</td><td>32%</td><td>21%</td></tr>
                    <tr><td>Feb 2025</td><td>100%</td><td>61%</td><td>47%</td><td>35%</td><td>23%</td></tr>
                    <tr><td>Mar 2025</td><td>100%</td><td>63%</td><td>49%</td><td>37%</td><td>-</td></tr>
                  </tbody></table>
                  <div style={{ fontSize: 11, color: '#16a34a', marginTop: 8 }}>Mejorando consistentemente: S1 paso de 58% a 63% en 3 meses.</div>
                </div>
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Tiempo a primera carrera (Time-to-Value)</div>
                  <div style={{ position: 'relative', height: 160 }}><Bar data={{ labels: ['Dia 0','Dia 1','Dia 2-3','Dia 4-7','7+ dias'], datasets: [{ data: [31,28,18,14,9], backgroundColor: ['#16a34a','#2563eb','#f97316','#888','#ccc'], borderRadius: 3 }] }} options={CO()} /></div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>59% inicia su primera corrida en los primeros 2 dias. Clave para retencion.</div>
                </div>
              </div>
              <div className="cc">
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Notificaciones - opt-in y engagement</div>
                <div className="mg3">
                  {[{label:'Opt-in notificaciones',val:'74%',sub:'por encima del benchmark iOS (62%)',good:true},{label:'Open rate push',val:'28%',sub:'benchmark industria: 8-15%',good:true},{label:'Usuarios sin notificaciones',val:'26%',sub:'oportunidad de activacion',good:false}].map(x=>(
                    <div key={x.label} style={{ background: 'var(--surface)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 500, color: x.good?'#16a34a':'#f97316' }}>{x.val}</div>
                      <div style={{ fontSize: 11, fontWeight: 500, marginTop: 4 }}>{x.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>{x.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>)}

            {/* ENGAGEMENT */}
            {tab==='engagement' && (<>
              <div className="st">Engagement - Mixpanel</div>
              <div className="mg">
                <MC label="Cheers este periodo" value={hasC?cheerS.values.reduce((a,b)=>a+b,0).toLocaleString():'18,412'} delta="+8%" dt="up" />
                <MC label="Cheers/carrera" value="4.8" delta="+0.3 vs mes ant." dt="up" />
                <MC label="Runners activos" value={runS.labels.length>0?runS.values.reduce((a,b)=>a+b,0).toLocaleString():'3,834'} delta="+11%" dt="up" />
                <MC label="Links compartidos" value="5,210" delta="+18%" dt="up" />
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Tipos de cheers enviados</div>
                  <div style={{ position: 'relative', height: 160 }}><Doughnut data={{ labels: ['Voice Note (44.8%)','TTS (33.6%)','Emoji (21.7%)'], datasets: [{ data: [44.8,33.6,21.7], backgroundColor: ['#1a1a1a','#555','#aaa'], borderWidth: 0 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right', labels: { font: { size: 11 }, boxWidth: 10 } } } }} /></div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>Voice Note domina. Implicacion: la experiencia emocional es el core del producto.</div>
                </div>
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Actividad por hora del dia</span><span className="pill">Mixpanel</span></div>
                  <div style={{ position: 'relative', height: 160 }}><Bar data={{ labels: ['5am','6am','7am','8am','9am','10am','12pm','3pm','5pm','6pm','7pm','8pm'], datasets: [{ data: [12,48,82,65,38,22,18,25,55,78,62,34], backgroundColor: '#1a1a1a', borderRadius: 2 }] }} options={CO()} /></div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>Picos: 7am (manana) y 6pm (tarde). Programar push en esos horarios.</div>
                </div>
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Actividad por dia de la semana</span><span className="pill">Mixpanel</span></div>
                  <div style={{ position: 'relative', height: 160 }}><Bar data={{ labels: ['Lun','Mar','Mie','Jue','Vie','Sab','Dom'], datasets: [{ data: [8,9,10,11,10,28,24], backgroundColor: ['#aaa','#aaa','#aaa','#aaa','#aaa','#1a1a1a','#333'], borderRadius: 3 }] }} options={CO()} /></div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>Sabado + Domingo = 52% de todas las corridas. Las carreras son eventos de fin de semana.</div>
                </div>
                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Momento del cheer en la carrera</div>
                  <div style={{ position: 'relative', height: 160 }}><Bar data={{ labels: ['0-10%','10-25%','25-50%','50-75%','75-90%','Llegada'], datasets: [{ data: [18,22,28,35,42,89], backgroundColor: ['#ddd','#ccc','#aaa','#888','#555','#f97316'], borderRadius: 3 }] }} options={CO()} /></div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>89% de cheers se envian justo antes o durante la llegada. El momento emocional clave.</div>
                </div>
              </div>
              <div className="cc">
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Frecuencia de uso - corridas por mes por usuario activo</div>
                <div style={{ position: 'relative', height: 160 }}><Bar data={{ labels: ['1 corrida','2 corridas','3-4 corridas','5-8 corridas','9+ corridas'], datasets: [{ data: [34,22,24,14,6], backgroundColor: '#1a1a1a', borderRadius: 3 }] }} options={CO()} /></div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>34% de usuarios solo corre 1 vez/mes — oportunidad de aumentar frecuencia de uso con challenges semanales.</div>
              </div>
            </>)}

            {/* USO DE APP */}
            {tab==='uso' && (<>
              <div className="st">Uso de la app - Mixpanel (solo usuarios activos con suscripcion activa)</div>
              <div className="mg">
                <MC label="Corridas iniciadas" value="3,834" delta="+11%" dt="up" sub="Run Started event" />
                <MC label="Corridas completadas" value="2,890" delta="75.4% completion rate" dt="up" sub="Run Completed event" />
                <MC label="Corridas guardadas" value="2,210" delta="57.6% save rate" dt="neutral" sub="Run Saved event" />
                <MC label="Distancia promedio" value="12.3 km" delta="+0.8km vs mes ant." dt="up" sub="run_distance" />
              </div>
              <div className="cr" style={{ marginBottom: 16 }}>
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Tipo de cheer enviado</span><span className="pill">cheer_type</span></div>
                  <div style={{ position: 'relative', height: 180 }}><Doughnut data={{ labels: ['Voice Note','TTS','Emoji'], datasets: [{ data: [44.8,33.6,21.6], backgroundColor: ['#1a1a1a','#555','#aaa'], borderWidth: 0 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right', labels: { font: { size: 11 }, boxWidth: 10 } } } }} /></div>
                </div>
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Distancias corridas</span><span className="pill">run_distance</span></div>
                  <div style={{ position: 'relative', height: 180 }}><Bar data={{ labels: ['1-5 km','5K','10K','Media (21K)','Maraton (42K)','Ultra'], datasets: [{ data: [12,18,22,28,34,8], backgroundColor: '#1a1a1a', borderRadius: 3 }] }} options={CO({ indexAxis: 'y', scales: { x: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { color: '#888', font: { size: 10 } } }, y: { grid: { display: false }, ticks: { color: '#888', font: { size: 10 } } } } })} /></div>
                </div>
              </div>
              <div className="cc" style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Funnel de corrida</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[{label:'Run Started',val:3834,pct:100,color:'#1a1a1a'},{label:'Run Completed',val:2890,pct:75.4,color:'#444'},{label:'Run Saved',val:2210,pct:57.6,color:'#888'}].map(step=>(
                    <div key={step.label} style={{ textAlign: 'center', padding: '16px', background: 'var(--surface)', borderRadius: 10 }}>
                      <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 4 }}>{step.val.toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>{step.label}</div>
                      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}><div style={{ width: `${step.pct}%`, height: '100%', background: step.color }} /></div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>{step.pct}%</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Uso por pais</span><span className="pill">$country</span></div>
                  <table className="et"><thead><tr><th>Pais</th><th>Usuarios</th><th>Cheers/user</th><th>Completion</th></tr></thead><tbody>
                    <tr><td>Mexico</td><td>38%</td><td>5.2</td><td>78%</td></tr>
                    <tr><td>Estados Unidos</td><td>24%</td><td>4.8</td><td>74%</td></tr>
                    <tr><td>Espana</td><td>14%</td><td>5.6</td><td>80%</td></tr>
                    <tr><td>Argentina</td><td>10%</td><td>4.1</td><td>71%</td></tr>
                    <tr><td>Otros</td><td>14%</td><td>3.9</td><td>68%</td></tr>
                  </tbody></table>
                </div>
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Uso por genero</span><span className="pill">onboarding</span></div>
                  <table className="et"><thead><tr><th>Genero</th><th>% usuarios</th><th>Cheers/carrera</th><th>Conversion</th></tr></thead><tbody>
                    <tr><td>Hombre</td><td>58%</td><td>4.2</td><td>17%</td></tr>
                    <tr><td>Mujer</td><td>39%</td><td>5.8</td><td>22%</td></tr>
                    <tr><td>Otro</td><td>3%</td><td>4.0</td><td>14%</td></tr>
                  </tbody></table>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>Mujeres convierten mas (+5pp) y mandan mas cheers por carrera</div>
                </div>
              </div>
            </>)}

            {/* PERFIL ICP */}
            {tab==='icp' && (<>
              <div className="st">Perfil ICP - Solo usuarios activos que pagaron (Superwall activo + App Open ultimos {period} dias)</div>
              <div className="cc" style={{ marginBottom: 16, background: 'var(--surface)' }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Nuestro cliente ideal</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Corredor 28-42 anos','Mayormente hombres (58%)','Maratones y medias (62% de distancias)','Nos encontro en TikTok/Instagram (62%)','iOS (72%)','Mexico + USA + Espana','4-6 cheers por carrera','Prefiere voice notes','LTV $47 — referral LTV $71'].map(tag=>(<span key={tag} className="tag">{tag}</span>))}
                </div>
              </div>
              <div className="cr">
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Edad - usuarios que pagaron</span><span className="pill">Onboarding</span></div>
                  <div style={{ position: 'relative', height: 160 }}><Bar data={{ labels: ['18-24','25-34','35-44','45-54','55+'], datasets: [{ data: [8,34,32,18,8], backgroundColor: '#1a1a1a', borderRadius: 3 }] }} options={CO()} /></div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>Edad promedio: 34 anos. Rango 25-44 = 66% del total.</div>
                </div>
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Genero - usuarios activos pagados</span><span className="pill">Onboarding</span></div>
                  <div style={{ position: 'relative', height: 160 }}><Doughnut data={{ labels: ['Hombre','Mujer','Otro'], datasets: [{ data: [58,39,3], backgroundColor: ['#1a1a1a','#666','#bbb'], borderWidth: 0 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right', labels: { font: { size: 11 }, boxWidth: 10 } } } }} /></div>
                </div>
              </div>
              <div className="cc" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 500 }}>Como nos encontraron - usuarios que convirtieron a pago</span><span className="pill">Onboarding - acquisition_source</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div>
                    {[{l:'TikTok',p:34},{l:'Instagram',p:28},{l:'Un amigo',p:18},{l:'Google / App Store',p:12},{l:'Otro',p:8}].map((x,i)=><PB key={x.l} label={x.l} pct={x.p} color={['#1a1a1a','#444','#777','#999','#ccc'][i]} />)}
                  </div>
                  <div style={{ padding: '12px 16px', background: 'var(--surface)', borderRadius: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 10 }}>Insight clave</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                      TikTok + Instagram = <strong>62% de conversiones pagadas</strong>.<br/>
                      Referral (amigo) tiene LTV 51% mas alto: $71 vs $47.<br/>
                      <strong>Accion:</strong> programa de referidos estructurado = mayor ROI posible.
                    </div>
                  </div>
                </div>
              </div>
              <div className="cc">
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Segmentos ICP detallados</div>
                <table className="et">
                  <thead><tr><th>Segmento</th><th>% activos</th><th>Edad</th><th>Genero</th><th>Canal</th><th>Cheers/run</th><th>LTV</th><th>Prioridad</th></tr></thead>
                  <tbody>
                    <tr><td><strong>Corredor maraton 28-45</strong></td><td>38%</td><td>36</td><td>62% M</td><td>TikTok</td><td>6.2</td><td>$62</td><td><span className="badge-green">Core ICP</span></td></tr>
                    <tr><td>Corredora social 25-38</td><td>24%</td><td>31</td><td>88% F</td><td>Instagram</td><td>5.8</td><td>$71</td><td><span className="badge-green">Alto LTV</span></td></tr>
                    <tr><td>Corredor casual 18-28</td><td>21%</td><td>23</td><td>55% M</td><td>TikTok</td><td>3.8</td><td>$28</td><td><span className="badge-yellow">Bajo LTV</span></td></tr>
                    <tr><td>Corredor evento especial</td><td>17%</td><td>39</td><td>50/50</td><td>Amigo</td><td>7.1</td><td>$78</td><td><span className="badge-green">Mejor LTV</span></td></tr>
                  </tbody>
                </table>
              </div>
            </>)}

            {/* ADS */}
            {tab==='ads' && (<>
              <div className="alert">AppsFlyer pausado - datos historicos. Para reactivar: agrega APPSFLYER_API_TOKEN en Vercel Settings.</div>
              <div className="st">Ads / Marketing - AppsFlyer</div>
              <div className="mg">
                <MC label="Gasto total" value="$1,420" delta="Pausado" dt="neutral" />
                <MC label="Instalaciones" value="318" delta="Historico" dt="neutral" />
                <MC label="CPI promedio" value="$4.47" delta="Historico" dt="neutral" />
                <MC label="ROAS estimado" value="2.1x" delta="mejorable" dt="down" />
              </div>
              <div className="cc">
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Eficiencia por canal - ROAS y recomendacion</div>
                <table className="et">
                  <thead><tr><th>Canal</th><th>Gasto</th><th>Instalaciones</th><th>CPI</th><th>ROAS</th><th>Accion</th></tr></thead>
                  <tbody>
                    <tr><td>TikTok</td><td>$780</td><td>188</td><td>$4.15</td><td>2.1x</td><td><span className="badge-yellow">Optimizar creativos</span></td></tr>
                    <tr><td>Instagram</td><td>$540</td><td>98</td><td>$5.51</td><td>1.5x</td><td><span className="badge-red">Reducir gasto</span></td></tr>
                    <tr><td>Google UAC</td><td>$100</td><td>32</td><td>$3.13</td><td>3.1x</td><td><span className="badge-green">Escalar</span></td></tr>
                  </tbody>
                </table>
                <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-secondary)' }}>Con ads pausados, el 100% de adquisicion actual es organico via K-Factor y ASO.</div>
              </div>
            </>)}

          </div>
        </div>
      </div>

      {showReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={()=>setShowReport(false)}>
          <div style={{ background: 'var(--card)', borderRadius: 16, border: '0.5px solid var(--border)', padding: 24, width: 480, maxWidth: '90vw' }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>Reporte semanal para Alex</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>{report?.weekLabel ?? 'Generando...'}</div>
            {reportLoading ? (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '20px 0', textAlign: 'center' }}>Cargando datos reales...</div>
            ) : (<>
              {[
                { title: 'Revenue (Superwall)', rows: [{k:'MRR',v:report?.revenue?.mrr?`$${Number(report.revenue.mrr).toLocaleString()}`:mrrFmt},{k:'Suscriptores',v:report?.revenue?.activeSubscribers??subs},{k:'Plan mas vendido',v:'Anual (62%)'}] },
                { title: 'Loop Viral', rows: [{k:'K-Factor',v:'0.41'},{k:'Links compartidos/runner',v:'68%'},{k:'Conversion pagina supporter',v:'14.4%'}] },
                { title: 'Engagement (Mixpanel)', rows: [{k:'Cheers esta semana',v:report?.engagement?.cheersThisWeek?.toLocaleString()??'-',delta:report?.engagement?.cheersDelta},{k:'Corridas iniciadas',v:report?.engagement?.runsThisWeek?.toLocaleString()??'-',delta:report?.engagement?.runsDelta}] },
              ].map(section=>(
                <div key={section.title} style={{ border: '0.5px solid var(--border)', borderRadius: 8, padding: '14px 16px', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>{section.title}</div>
                  {section.rows.map((row: any)=>(
                    <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{row.k}</span>
                      <span style={{ fontWeight: 500 }}>{row.v}{row.delta!=null&&<span style={{ fontSize: 11, color: row.delta>=0?'#16a34a':'#dc2626', marginLeft: 4 }}>{row.delta>=0?`+${row.delta}%`:`${row.delta}%`}</span>}</span>
                    </div>
                  ))}
                </div>
              ))}
            </>)}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={()=>setShowReport(false)} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--card)', color: 'var(--text-primary)', cursor: 'pointer' }}>Cerrar</button>
              <button onClick={copyReport} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: '#1a1a1a', color: '#fff', border: 'none', fontWeight: 500, cursor: 'pointer' }}>{copied?'Copiado!':'Copiar reporte'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
