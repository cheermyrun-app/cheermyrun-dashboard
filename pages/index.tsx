import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'runs', label: 'Corridas (Mixpanel)' },
  { id: 'revenue', label: 'Revenue (Superwall)' },
  { id: 'setup', label: 'Configuracion' },
];

const PERIODS = [
  { value: 7, label: 'Ultimos 7 dias' },
  { value: 30, label: 'Ultimos 30 dias' },
  { value: 90, label: 'Ultimos 90 dias' },
];

function NoData({ label, reason }: { label: string; reason: string }) {
  return (
    <div style={{ background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 500, color: '#888' }}>Sin datos</div>
      <div style={{ fontSize: 10, marginTop: 4, color: '#f59e0b' }}>{reason}</div>
    </div>
  );
}

function MC({ label, value, sub, color }: any) {
  return (
    <div style={{ background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, color: color ?? 'var(--text-primary)', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, marginTop: 4, color: 'var(--text-secondary)' }}>{sub}</div>}
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

function buildRunSeries(data: any): { labels: string[]; values: number[]; total: number } {
  const series = data?.engagement?.runs?.values?.run_started;
  if (!series) return { labels: [], values: [], total: 0 };
  const dates = Object.keys(series).sort();
  const values = dates.map((d: string) => series[d] || 0);
  const total = values.reduce((a: number, b: number) => a + b, 0);
  return { labels: dates.map((d: string) => d.slice(5)), values, total };
}

export default function Dashboard() {
  const [tab, setTab] = useState('overview');
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/dashboard?days=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [period]);

  const runSeries = buildRunSeries(data);
  const mixpanelOk = data?.sources?.mixpanel === 'connected';
  const superwallOk = data?.sources?.superwall === 'connected';
  const mrr = data?.revenue?.mrr;
  const subs = data?.subscribers?.total ?? data?.subscribers?.active;

  const dot = (s: string) => s === 'connected' ? '#16a34a' : s === 'error' ? '#dc2626' : '#888';
  const label = (s: string) => s === 'connected' ? 'Conectado' : s === 'error' ? 'Error de API' : 'No configurado';

  return (
    <>
      <Head>
        <title>Cheer My Run - Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        :root{--bg:#f8f8f7;--surface:#f0efeb;--card:#fff;--border:rgba(0,0,0,0.1);--text-primary:#1a1a1a;--text-secondary:#666;--sb:#fff}
        @media(prefers-color-scheme:dark){:root{--bg:#1a1a1a;--surface:#222;--card:#2a2a2a;--border:rgba(255,255,255,0.1);--text-primary:#f0f0ee;--text-secondary:#999;--sb:#222}}
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--text-primary)}
        .mg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:20px}
        .cr{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-bottom:16px}
        .cc{background:var(--card);border:0.5px solid var(--border);border-radius:12px;padding:16px}
        .st{font-size:11px;font-weight:500;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:12px}
        select{font-size:12px;padding:5px 10px;border-radius:8px;border:0.5px solid var(--border);background:var(--card);color:var(--text-primary);cursor:pointer}
        .pill{font-size:10px;padding:2px 7px;border-radius:20px;border:0.5px solid var(--border);color:var(--text-secondary)}
        @media(max-width:768px){.mg{grid-template-columns:repeat(2,1fr)}.cr{grid-template-columns:1fr}}
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <div style={{ width: 220, background: 'var(--sb)', borderRight: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '20px 0', flexShrink: 0, minHeight: '100vh' }}>
          <div style={{ padding: '0 20px 18px', borderBottom: '0.5px solid var(--border)', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#f97316,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 600 }}>C</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Cheer My Run</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Dashboard</div>
              </div>
            </div>
          </div>
          <div style={{ padding: '0 12px', marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px', marginBottom: 4 }}>Navegacion</div>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 8px', borderRadius: 8, fontSize: 13, border: 'none', background: tab === t.id ? 'var(--surface)' : 'transparent', color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: tab === t.id ? 500 : 400, marginBottom: 1, cursor: 'pointer' }}>{t.label}</button>
            ))}
          </div>
          <div style={{ marginTop: 'auto', padding: '16px 20px 0', borderTop: '0.5px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>Estado de fuentes</div>
            {[
              { n: 'Mixpanel', s: data?.sources?.mixpanel },
              { n: 'Superwall', s: data?.sources?.superwall },
              { n: 'AppsFlyer', s: data?.sources?.appsflyer },
            ].map(x => (
              <div key={x.n} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: dot(x.s ?? ''), flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-primary)' }}>{x.n}</span>
                </div>
                <div style={{ fontSize: 10, color: '#888', marginLeft: 12 }}>{label(x.s ?? 'not_configured')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ background: 'var(--card)', borderBottom: '0.5px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{TABS.find(t => t.id === tab)?.label}</div>
              {loading && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Cargando...</div>}
              {error && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>Error: {error}</div>}
            </div>
            <select value={period} onChange={e => setPeriod(Number(e.target.value))}>
              {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

            {/* OVERVIEW */}
            {tab === 'overview' && (<>
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '0.5px solid rgba(245,158,11,0.4)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: '#92400e' }}>
                <strong>Solo se muestran datos reales.</strong> Los campos que digan "Sin datos" necesitan configuracion adicional (ver tab Configuracion).
              </div>

              <div className="st">Mixpanel — datos reales disponibles</div>
              <div className="mg" style={{ marginBottom: 20 }}>
                {mixpanelOk && runSeries.total > 0
                  ? <MC label={`Corridas iniciadas (ultimos ${period} dias)`} value={runSeries.total.toLocaleString()} sub="Evento: run_started — Mixpanel" color="#1a1a1a" />
                  : <NoData label="Corridas iniciadas" reason="Mixpanel conectado pero sin eventos run_started" />
                }
                <NoData label="Cheers enviados" reason="Evento no encontrado en Mixpanel (verificar nombre exacto del evento)" />
                <NoData label="App Opens" reason="Evento no encontrado en Mixpanel (verificar nombre exacto del evento)" />
              </div>

              <div className="st">Superwall — datos reales disponibles</div>
              <div className="mg">
                {superwallOk && mrr != null
                  ? <MC label="MRR" value={`$${Number(mrr).toLocaleString()}`} sub="Superwall API" />
                  : <NoData label="MRR" reason={superwallOk ? 'Superwall conectado pero sin datos de revenue' : 'Superwall API con error — verificar API key'} />
                }
                {superwallOk && subs != null
                  ? <MC label="Suscriptores activos" value={subs.toLocaleString()} sub="Superwall API" />
                  : <NoData label="Suscriptores activos" reason={superwallOk ? 'Sin datos' : 'Superwall API con error — verificar API key'} />
                }
                <NoData label="Churn, LTV, ARPU" reason="Requiere datos historicos de Superwall funcionando" />
              </div>
            </>)}

            {/* CORRIDAS - UNICO DATO REAL */}
            {tab === 'runs' && (<>
              {mixpanelOk && runSeries.total > 0 ? (<>
                <div className="st">Corridas iniciadas — Mixpanel (evento: run_started)</div>
                <div className="mg" style={{ marginBottom: 24 }}>
                  <MC label={`Total corridas (ultimos ${period} dias)`} value={runSeries.total.toLocaleString()} sub="run_started — dato real" color="#1a1a1a" />
                  <MC label="Promedio diario" value={Math.round(runSeries.total / period).toLocaleString()} sub={`sobre ${period} dias`} />
                  <MC label="Dia con mas corridas" value={(() => { const max = Math.max(...runSeries.values); const idx = runSeries.values.indexOf(max); return runSeries.labels[idx] + ': ' + max; })()} sub="pico en el periodo" />
                </div>

                <div className="cc" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Corridas por dia</span>
                    <span className="pill">Mixpanel — run_started — REAL</span>
                  </div>
                  <div style={{ position: 'relative', height: 240 }}>
                    <Bar data={{ labels: runSeries.labels, datasets: [{ data: runSeries.values, backgroundColor: '#1a1a1a', borderRadius: 3 }] }} options={CO()} />
                  </div>
                </div>

                <div className="cc">
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Datos raw disponibles</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    <div>Evento confirmado: <strong>run_started</strong></div>
                    <div>Periodo: {data?.period?.from} al {data?.period?.to}</div>
                    <div>Total: {runSeries.total} corridas en {period} dias</div>
                  </div>
                </div>

                <div style={{ marginTop: 20, background: 'rgba(245,158,11,0.08)', border: '0.5px solid rgba(245,158,11,0.4)', borderRadius: 10, padding: '14px 16px', fontSize: 12, color: '#92400e' }}>
                  <strong>Para tener mas datos de corridas necesitamos:</strong>
                  <ul style={{ marginTop: 8, paddingLeft: 16, lineHeight: 2 }}>
                    <li>Verificar el nombre exacto del evento "corrida completada" en Mixpanel (puede ser: run_completed, race_completed, run_finished)</li>
                    <li>Verificar el nombre exacto del evento "corrida guardada" en Mixpanel</li>
                    <li>Verificar el nombre exacto del evento "cheer enviado" en Mixpanel</li>
                    <li>Confirmar si se registran propiedades como distancia, genero, pais en los eventos</li>
                  </ul>
                </div>
              </>) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: 16, marginBottom: 8 }}>Sin datos de Mixpanel</div>
                  <div style={{ fontSize: 12 }}>
                    {mixpanelOk ? 'Mixpanel conectado pero ningun evento run_started encontrado en este periodo.' : 'Mixpanel no esta conectado correctamente.'}
                  </div>
                </div>
              )}
            </>)}

            {/* REVENUE */}
            {tab === 'revenue' && (<>
              <div style={{ background: 'rgba(220,38,38,0.06)', border: '0.5px solid rgba(220,38,38,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: '#991b1b' }}>
                <strong>Superwall API tiene un error.</strong> No se pueden mostrar datos de revenue hasta que se corrija.
              </div>

              <div className="st">Estado actual de Superwall</div>
              <div style={{ background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Diagnostico</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 2 }}>
                  <div>Estado de conexion: <strong style={{ color: '#dc2626' }}>Error</strong></div>
                  <div>API Key configurada en Vercel: <strong>Si (SUPERWALL_API_KEY)</strong></div>
                  <div>MRR retornado: <strong>{String(data?.revenue?.mrr ?? 'null (error)')}</strong></div>
                  <div>Suscriptores retornados: <strong>{String(data?.subscribers?.total ?? 'null (error)')}</strong></div>
                </div>
              </div>

              <div style={{ background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Posibles causas del error</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 2 }}>
                  <div>1. La API key de Superwall puede haber expirado o ser invalida</div>
                  <div>2. El endpoint de la API puede haber cambiado</div>
                  <div>3. Las credenciales necesitan regenerarse desde el dashboard de Superwall</div>
                </div>
                <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                  Para ver en Superwall cuantos suscriptores tienes realmente, ve directamente a:{' '}
                  <a href="https://superwall.com" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>superwall.com/dashboard</a>
                </div>
              </div>
            </>)}

            {/* CONFIGURACION */}
            {tab === 'setup' && (<>
              <div className="st">Que datos tenemos vs que necesitamos</div>

              <div style={{ display: 'grid', gap: 12 }}>

                {/* Mixpanel */}
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Mixpanel</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#dcfce7', color: '#166534' }}>Conectado</span>
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 2 }}>
                    <div style={{ color: '#166534' }}>✓ <strong>run_started</strong> — {runSeries.total > 0 ? runSeries.total + ' eventos en los ultimos 30 dias' : 'sin datos'}</div>
                    <div style={{ color: '#dc2626' }}>✗ <strong>Cheer Sent / cheer_sent / send_cheer</strong> — todos retornan 0. Necesitamos el nombre exacto del evento en tu Mixpanel.</div>
                    <div style={{ color: '#dc2626' }}>✗ <strong>App Open</strong> — retorna 0. Necesitamos el nombre exacto del evento.</div>
                    <div style={{ color: '#dc2626' }}>✗ <strong>Run Completed / run_completed</strong> — no probado aun. Necesitamos el nombre exacto.</div>
                    <div style={{ color: '#dc2626' }}>✗ <strong>Run Saved / run_saved</strong> — no probado aun. Necesitamos el nombre exacto.</div>
                    <div style={{ color: '#f59e0b' }}>⚠ <strong>Propiedades de usuario</strong> — para datos de genero, pais, edad: necesitamos saber los nombres de las propiedades en tus eventos de Mixpanel.</div>
                  </div>
                  <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--surface)', borderRadius: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
                    Accion: Ve a Mixpanel → Events y dinos los nombres exactos de tus eventos. Con eso activamos todos los datos de engagement.
                  </div>
                </div>

                {/* Superwall */}
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Superwall</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#fee2e2', color: '#991b1b' }}>Error de API</span>
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 2 }}>
                    <div style={{ color: '#dc2626' }}>✗ <strong>MRR</strong> — null (API error)</div>
                    <div style={{ color: '#dc2626' }}>✗ <strong>Suscriptores activos</strong> — null (API error)</div>
                    <div style={{ color: '#dc2626' }}>✗ <strong>Revenue por plan</strong> — no disponible</div>
                    <div style={{ color: '#dc2626' }}>✗ <strong>Churn rate</strong> — no disponible</div>
                  </div>
                  <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--surface)', borderRadius: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
                    Accion: Regenerar la API key en Superwall y actualizar SUPERWALL_API_KEY en Vercel → Settings → Environment Variables.
                  </div>
                </div>

                {/* AppsFlyer */}
                <div className="cc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>AppsFlyer</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280' }}>No configurado</span>
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 2, color: '#888' }}>
                    <div>✗ Descargas por canal</div>
                    <div>✗ CPI por canal</div>
                    <div>✗ ROAS</div>
                    <div>✗ Instalaciones organicas vs pagadas</div>
                  </div>
                  <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--surface)', borderRadius: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
                    Accion: Agregar APPSFLYER_API_TOKEN en Vercel → Settings → Environment Variables cuando quieras reactivar ads.
                  </div>
                </div>

                {/* Resumen */}
                <div style={{ background: 'linear-gradient(135deg,#1a1a1a,#333)', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', marginBottom: 12 }}>Resumen: que necesitamos para tener el dashboard completo</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 2 }}>
                    <div>1. <strong style={{ color: '#fff' }}>Nombres exactos de eventos en Mixpanel</strong> — cheers, app open, corrida completada, corrida guardada</div>
                    <div>2. <strong style={{ color: '#fff' }}>Nueva API key de Superwall</strong> — para MRR, suscriptores, churn</div>
                    <div>3. <strong style={{ color: '#fff' }}>Propiedades de usuario en Mixpanel</strong> — para datos de genero, pais, edad (onboarding)</div>
                    <div>4. <strong style={{ color: '#fff' }}>API key de AppsFlyer</strong> (opcional) — para datos de ads y canales</div>
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
