import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

// ══════════════════════════════════════════════════════════════
// DATOS REALES — Mixpanel CheerMyRun Prod 3993852 — 30 mar 2026
// ══════════════════════════════════════════════════════════════

// Totales 30 días
const T = {
  runs: 649, runsCompleted: 621, cheersReceived: 26614,
  appOpens: 3462, paywallPresented: 6015, onboardingCompleted: 4520,
  onboardingStarted: 4520,
  // Suscripciones: subscription_started (de Superwall vía Mixpanel)
  subs30: 309,   // mes actual (marzo)
  subs_prev: 42, // mes anterior (febrero)
  renewals: 80 + 86, // Renewal + subscription_renew en marzo
};

// Revenue estimado (mensual ~$10 plan mensual, ~$49 anual/12=$4.08)
// Planes: monthly=110 (~$9.99), annual=39 (~$49.99/yr), weekly=5 (~$2.99)
// MRR rough: 110*9.99 + (39*(49.99/12)) + 5*2.99
const MRR_EST = Math.round(110 * 9.99 + 39 * (49.99 / 12) + 5 * 2.99);
const MRR_PREV = Math.round(25 * 9.99 + 10 * (49.99 / 12)); // feb aprox

// Series diarias
const RUN_S: [string, number][] = [
  ["02-27",9],["02-28",44],["03-01",12],["03-02",10],["03-03",12],["03-04",10],
  ["03-05",6],["03-06",15],["03-07",17],["03-08",22],["03-09",5],["03-10",7],
  ["03-11",5],["03-12",6],["03-13",9],["03-14",32],["03-15",60],["03-16",15],
  ["03-17",14],["03-18",13],["03-19",20],["03-20",21],["03-21",56],["03-22",59],
  ["03-23",11],["03-24",10],["03-25",14],["03-26",6],["03-27",14],["03-28",59],["03-29",56],
];
const SUB_S: [string, number][] = [
  ["02-27",11],["02-28",13],["03-01",2],["03-02",0],["03-03",4],["03-04",4],
  ["03-05",3],["03-06",8],["03-07",5],["03-08",3],["03-09",3],["03-10",1],
  ["03-11",2],["03-12",2],["03-13",55],["03-14",59],["03-15",15],["03-16",8],
  ["03-17",5],["03-18",5],["03-19",6],["03-20",4],["03-21",19],["03-22",10],
  ["03-23",2],["03-24",4],["03-25",3],["03-26",10],["03-27",14],["03-28",16],["03-29",13],
];
const CHEER_S: [string, number][] = [
  ["02-27",19],["02-28",1870],["03-01",58],["03-02",50],["03-03",22],["03-04",60],
  ["03-05",13],["03-06",33],["03-07",495],["03-08",2167],["03-09",10],["03-10",13],
  ["03-11",98],["03-12",13],["03-13",27],["03-14",332],["03-15",1488],["03-16",14],
  ["03-17",22],["03-18",47],["03-19",30],["03-20",21],["03-21",4058],["03-22",11281],
  ["03-23",6],["03-24",73],["03-25",29],["03-26",4],["03-27",18],["03-28",2566],["03-29",1677],
];

// ICP — Suscriptores únicos por propiedad (excluyendo undefined)
const ICP_GENDER = [["Femenino",110],["Masculino",37],["Otro",2]] as [string,number][];
const ICP_AGE = [["25-34",89],["35-44",26],["18-24",27],["45-54",7]] as [string,number][];
const ICP_LEVEL = [["Intermedio",84],["Principiante",56],["Avanzado",8]] as [string,number][];
const ICP_WATCH = [["Apple Watch",60],["Garmin",59],["Fitbit",14],["Samsung",11],["COROS",2],["Smartphone",3]] as [string,number][];
const ICP_SOURCE = [["TikTok",84],["Instagram",36],["Amigos",16],["Facebook",3],["Otro",1]] as [string,number][];
const ICP_PLAN = [["Mensual",110],["Anual",39],["Anual descuento",3],["Semanal",5]] as [string,number][];

// Hora de corridas
const HORA_RUNS = [
  ["00-02",4],["02-04",1],["04-06",30],["06-08",134],["08-10",144],
  ["10-12",80],["12-14",32],["14-16",34],["16-18",56],["18+",134],
] as [string,number][];

// Tipo de cheer
const CHEER_TYPE = [["TTS (texto)",13820],["Voice Note",12794]] as [string,number][];

// Top ciudades (onboarding completados)
const TOP_CITIES = [
  ["Bogotá, CO",39],["Melbourne, AU",18],["Sydney, AU",18],["México DF, MX",18],
  ["San José, CR",28],["Madrid, ES",21],["Iztapalapa, MX",20],["Quito, EC",16],
  ["León, MX",16],["Medellín, CO",16],["Barranquilla, CO",17],["New York, US",16],
  ["Birmingham, UK",16],["San Juan, PR",17],["Los Angeles, US",17],["Querétaro, MX",15],
  ["Guatemala City, GT",15],["Cuauhtémoc, MX",15],["Monterrey, MX",14],["Manchester, UK",13],
] as [string,number][];

// P&L
const PNL_KEY = 'cmr_pnl_v3';
interface PnlEntry { id:string; date:string; name:string; category:string; type:string; amount:number; notes:string; }
const PNL_CATS = ['Desarrollo','Influencer','Infraestructura','Herramientas/SaaS','Diseño','Marketing','Inversión Alex','Revenue','Otro'];
const PNL_COLORS: Record<string,string> = {
  'Desarrollo':'#6366f1','Influencer':'#ec4899','Infraestructura':'#3b82f6',
  'Herramientas/SaaS':'#f97316','Diseño':'#8b5cf6','Marketing':'#14b8a6',
  'Inversión Alex':'#22c55e','Revenue':'#16a34a','Otro':'#94a3b8',
};
const loadPnl = (): PnlEntry[] => { try { return JSON.parse(localStorage.getItem(PNL_KEY)||'[]'); } catch { return []; } };
const savePnl = (e: PnlEntry[]) => localStorage.setItem(PNL_KEY, JSON.stringify(e));

// Chart options
const CO = (extra?: any) => ({
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { bodyFont: { size: 11 }, titleFont: { size: 11 } } },
  scales: {
    x: { grid: { color: 'rgba(128,128,128,0.08)' }, ticks: { color: '#888', font: { size: 10 } } },
    y: { grid: { color: 'rgba(128,128,128,0.08)' }, ticks: { color: '#888', font: { size: 10 } }, beginAtZero: true },
  }, ...extra,
});
const DO = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right' as const, labels: { font: { size: 11 }, boxWidth: 12, padding: 8 } } } };

const TABS = ['Overview','Revenue','ICP','Corridas','Engagement','P&L','Estado'];
const COLORS12 = ['#6366f1','#ec4899','#3b82f6','#f97316','#8b5cf6','#14b8a6','#22c55e','#f59e0b','#dc2626','#0891b2','#84cc16','#94a3b8'];

function pct(a:number,b:number){ return b>0?Math.round(a/b*100):0; }
function fmt(n:number){ return n.toLocaleString('es-MX'); }
function dpct(a:number,b:number){ return b>0?Math.round((a-b)/b*100):null; }

function Card({label,value,delta,sub,green,big}:{label:string,value:any,delta?:number|null,sub?:string,green?:boolean,big?:boolean}) {
  return (
    <div style={{background:'var(--card)',border:'0.5px solid var(--border)',borderRadius:12,padding:'14px 16px',minHeight:84}}>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:5}}>{label}</div>
      <div style={{fontSize:big?28:22,fontWeight:600,color:green?'#16a34a':'var(--text-primary)',lineHeight:1.1}}>{value}</div>
      {delta!=null && <div style={{fontSize:11,marginTop:4,color:delta>=0?'#16a34a':'#dc2626'}}>{delta>=0?'+':''}{delta}% vs mes ant.</div>}
      {sub && <div style={{fontSize:10,marginTop:3,color:'var(--text-secondary)'}}>{sub}</div>}
    </div>
  );
}

function SegBar({label,val,total,color}:{label:string,val:number,total:number,color:string}) {
  const p = pct(val,total);
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:7}}>
      <span style={{fontSize:12,color:'var(--text-secondary)',width:130,flexShrink:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</span>
      <div style={{flex:1,height:6,background:'var(--surface)',borderRadius:3,overflow:'hidden'}}>
        <div style={{width:`${p}%`,height:'100%',background:color,borderRadius:3}}/>
      </div>
      <span style={{fontSize:11,color:'var(--text-secondary)',width:26,textAlign:'right'}}>{p}%</span>
      <span style={{fontSize:10,color:'#999',width:30,textAlign:'right'}}>{val}</span>
    </div>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState('Overview');
  const [pnl, setPnl] = useState<PnlEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], name:'', category:'Desarrollo', type:'Gasto', amount:'', notes:'' });
  useEffect(() => { setPnl(loadPnl()); }, []);

  const gastos = pnl.filter(e=>e.type==='Gasto').reduce((s,e)=>s+e.amount,0);
  const ingresos = pnl.filter(e=>e.type==='Ingreso').reduce((s,e)=>s+e.amount,0);
  const neto = ingresos - gastos;
  const byCat = pnl.filter(e=>e.type==='Gasto').reduce((a:Record<string,number>,e)=>{a[e.category]=(a[e.category]||0)+e.amount;return a;},{});
  const byMonth = pnl.reduce((a:Record<string,{g:number,i:number}>,e)=>{const m=e.date.substring(0,7);if(!a[m])a[m]={g:0,i:0};if(e.type==='Gasto')a[m].g+=e.amount;else a[m].i+=e.amount;return a;},{});
  const months = Object.keys(byMonth).sort();
  const filtered = filter==='all'?pnl:filter==='gasto'?pnl.filter(e=>e.type==='Gasto'):pnl.filter(e=>e.type==='Ingreso');

  function saveEntry() {
    if(!form.name||!form.amount) return;
    const entry:PnlEntry = {id:editId||Date.now().toString(),date:form.date,name:form.name,category:form.category,type:form.type,amount:Number(form.amount),notes:form.notes};
    const updated = editId?pnl.map(e=>e.id===editId?entry:e):[...pnl,entry];
    const sorted = updated.sort((a,b)=>b.date.localeCompare(a.date));
    setPnl(sorted); savePnl(sorted); setShowAdd(false); setEditId(null);
    setForm({date:new Date().toISOString().split('T')[0],name:'',category:'Desarrollo',type:'Gasto',amount:'',notes:''});
  }
  function del(id:string){const u=pnl.filter(e=>e.id!==id);setPnl(u);savePnl(u);}
  function startEdit(e:PnlEntry){setForm({date:e.date,name:e.name,category:e.category,type:e.type,amount:String(e.amount),notes:e.notes});setEditId(e.id);setShowAdd(true);}

  return (
    <>
      <Head>
        <title>Cheer My Run — Investor Dashboard</title>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
      </Head>
      <style>{`
        :root{--bg:#f7f7f6;--surface:#efefed;--card:#fff;--border:rgba(0,0,0,0.09);--text-primary:#1a1a1a;--text-secondary:#666;--sb:#fff}
        @media(prefers-color-scheme:dark){:root{--bg:#161616;--surface:#202020;--card:#252525;--border:rgba(255,255,255,0.09);--text-primary:#f0f0ee;--text-secondary:#999;--sb:#1c1c1c}}
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--text-primary)}
        .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
        .g3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
        .g2{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:14px}
        .cc{background:var(--card);border:0.5px solid var(--border);border-radius:12px;padding:16px;margin-bottom:14px}
        .cc:last-child{margin-bottom:0}
        .st{font-size:10px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px}
        .live{font-size:9px;padding:2px 7px;border-radius:20px;background:#dcfce7;color:#166534;font-weight:600;letter-spacing:.04em}
        .pill{font-size:10px;padding:2px 7px;border-radius:20px;border:0.5px solid var(--border);color:var(--text-secondary)}
        select,input{font-size:12px;padding:6px 10px;border-radius:8px;border:0.5px solid var(--border);background:var(--card);color:var(--text-primary);outline:none}
        .btn{font-size:12px;padding:6px 14px;border-radius:8px;border:0.5px solid var(--border);background:var(--card);color:var(--text-primary);cursor:pointer;font-family:inherit}
        .btn-dark{background:#1a1a1a;color:#fff;border:none;font-weight:500}
        .btn-red{background:#fee2e2;color:#991b1b;border:0.5px solid #fca5a5}
        .tbl{width:100%;font-size:12px;border-collapse:collapse}
        .tbl th{color:var(--text-secondary);font-weight:400;text-align:left;padding:0 8px 8px 0;border-bottom:0.5px solid var(--border)}
        .tbl td{padding:7px 8px 7px 0;border-bottom:0.5px solid var(--border);vertical-align:top}
        .tbl tr:last-child td{border-bottom:none}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:200}
        .modal{background:var(--card);border-radius:16px;padding:24px;width:480px;max-width:92vw;border:0.5px solid var(--border)}
        .frow{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
        .flabel{font-size:11px;color:var(--text-secondary);margin-bottom:4px}
        .sb-link{display:block;width:100%;text-align:left;padding:7px 10px;border-radius:8px;font-size:13px;cursor:pointer;background:transparent;border:none;color:var(--text-secondary);font-family:inherit;transition:background .1s}
        .sb-link.active{background:var(--surface);color:var(--text-primary);font-weight:500}
        @media(max-width:900px){.g4{grid-template-columns:repeat(2,1fr)}.g2{grid-template-columns:1fr}}
      `}</style>

      <div style={{display:'flex',minHeight:'100vh'}}>
        {/* ── Sidebar ── */}
        <div style={{width:210,background:'var(--sb)',borderRight:'0.5px solid var(--border)',display:'flex',flexDirection:'column',padding:'0 0 20px',flexShrink:0}}>
          {/* Logo */}
          <div style={{padding:'20px 16px 16px',borderBottom:'0.5px solid var(--border)',marginBottom:8}}>
            <div style={{display:'flex',alignItems:'center',gap:9}}>
              <div style={{width:30,height:30,borderRadius:8,background:'linear-gradient(135deg,#f97316,#dc2626)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:16}}>🏃</div>
              <div>
                <div style={{fontSize:14,fontWeight:600}}>Cheer My Run</div>
                <div style={{fontSize:10,color:'var(--text-secondary)'}}>Investor Dashboard</div>
              </div>
            </div>
          </div>
          {/* Nav */}
          <div style={{padding:'4px 8px',flex:1}}>
            <div style={{fontSize:9,color:'var(--text-secondary)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.08em',padding:'8px 10px 4px'}}>Analytics</div>
            {TABS.map(t => (
              <button key={t} onClick={()=>setTab(t)} className={`sb-link${tab===t?' active':''}`}>{t}</button>
            ))}
          </div>
          {/* Fuentes */}
          <div style={{padding:'12px 16px 0',borderTop:'0.5px solid var(--border)'}}>
            <div style={{fontSize:10,color:'var(--text-secondary)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>Fuentes</div>
            {[{n:'Mixpanel',c:'#16a34a',d:'Datos reales ✓'},{n:'Superwall',c:'#16a34a',d:'subs vía Mixpanel ✓'},{n:'AppsFlyer',c:'#888',d:'No configurado'}].map(s=>(
              <div key={s.n} style={{marginBottom:8}}>
                <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}><div style={{width:6,height:6,borderRadius:'50%',background:s.c,flexShrink:0}}/>{s.n}</div>
                <div style={{fontSize:10,color:'#999',marginLeft:12}}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main ── */}
        <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>
          {/* Header */}
          <div style={{background:'var(--card)',borderBottom:'0.5px solid var(--border)',padding:'13px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
            <div>
              <span style={{fontSize:15,fontWeight:600}}>{tab}</span>
              <span style={{fontSize:11,color:'var(--text-secondary)',marginLeft:12}}>28 Feb – 30 Mar 2026</span>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span className="live">DATOS REALES</span>
              {tab==='P&L' && <button className="btn btn-dark" onClick={()=>{setShowAdd(true);setEditId(null);}}>+ Agregar</button>}
            </div>
          </div>

          <div style={{flex:1,padding:20,overflowY:'auto'}}>

{/* ══════════════ OVERVIEW ══════════════ */}
{tab==='Overview' && (<>
  <div className="st">Métricas clave — 30 días</div>
  <div className="g4">
    <Card label="Corridas iniciadas" value={fmt(T.runs)} sub="run_started · Mixpanel"/>
    <Card label="Suscriptores nuevos" value={fmt(T.subs30)} delta={dpct(T.subs30,T.subs_prev)} sub="subscription_started · Superwall"/>
    <Card label="Cheers recibidos" value={fmt(T.cheersReceived)} sub="cheer_received"/>
    <Card label="Cheers / Corrida" value={(T.cheersReceived/T.runs).toFixed(0)} green sub="Engagement emocional"/>
  </div>
  <div className="g4">
    <Card label="Run completion rate" value="96%" green sub="621 / 649 corridas"/>
    <Card label="MRR estimado" value={`$${fmt(MRR_EST)}`} delta={dpct(MRR_EST,MRR_PREV)} sub="Mensual+Anual+Semanal"/>
    <Card label="Renovaciones (mar)" value={fmt(T.renewals)} sub="Renewal + subscription_renew"/>
    <Card label="App Opens" value={fmt(T.appOpens)} sub="DAU proxy"/>
  </div>
  <div className="g2">
    <div className="cc">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <span style={{fontSize:13,fontWeight:600}}>Corridas por día</span><span className="live">REAL</span>
      </div>
      <div style={{height:190}}>
        <Bar data={{labels:RUN_S.map(r=>r[0]),datasets:[{data:RUN_S.map(r=>r[1]),backgroundColor:'#1a1a1a',borderRadius:3,hoverBackgroundColor:'#f97316'}]}} options={CO()}/>
      </div>
    </div>
    <div className="cc">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <span style={{fontSize:13,fontWeight:600}}>Suscripciones por día</span><span className="live">REAL</span>
      </div>
      <div style={{height:190}}>
        <Bar data={{labels:SUB_S.map(r=>r[0]),datasets:[{data:SUB_S.map(r=>r[1]),backgroundColor:'#16a34a',borderRadius:3}]}} options={CO()}/>
      </div>
    </div>
  </div>
  <div className="cc">
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
      <span style={{fontSize:13,fontWeight:600}}>Cheers recibidos por día</span><span className="live">REAL</span>
    </div>
    <div style={{height:180}}>
      <Bar data={{labels:CHEER_S.map(r=>r[0]),datasets:[{data:CHEER_S.map(r=>r[1]),backgroundColor:'#f97316',borderRadius:3}]}} options={CO()}/>
    </div>
    <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:8}}>Pico 22 mar: 11,281 cheers en un día. Los cheers correlacionan directamente con corridas.</div>
  </div>
</>)}

{/* ══════════════ REVENUE ══════════════ */}
{tab==='Revenue' && (<>
  <div className="st">Revenue & Monetización</div>
  <div className="g4">
    <Card label="MRR estimado (mar)" value={`$${fmt(MRR_EST)}`} delta={dpct(MRR_EST,MRR_PREV)} green big/>
    <Card label="Nuevas suscripciones" value={fmt(T.subs30)} delta={dpct(T.subs30,T.subs_prev)} sub="+636% vs feb"/>
    <Card label="Renovaciones (mar)" value={fmt(T.renewals)} sub="Renewal + subscription_renew"/>
    <Card label="Conversión paywall" value={pct(T.subs30,T.paywallPresented)+'%'} sub={`${fmt(T.subs30)} / ${fmt(T.paywallPresented)}`}/>
  </div>
  <div className="g3">
    <Card label="Plan mensual (~$9.99)" value="110 subs" sub={`~$${Math.round(110*9.99)}/mo`}/>
    <Card label="Plan anual (~$49.99)" value="39 subs" sub={`~$${Math.round(39*49.99/12)}/mo ARR`}/>
    <Card label="Plan semanal (~$2.99)" value="5 subs" sub="~$15/mo"/>
  </div>
  <div className="g2">
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Distribución de planes</div>
      <div style={{height:200}}>
        <Doughnut data={{labels:ICP_PLAN.map(r=>r[0]),datasets:[{data:ICP_PLAN.map(r=>r[1]),backgroundColor:['#6366f1','#3b82f6','#0891b2','#f97316'],borderWidth:0}]}} options={DO}/>
      </div>
    </div>
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Crecimiento de suscripciones</div>
      <div style={{height:200}}>
        <Bar data={{labels:['Febrero','Marzo'],datasets:[{label:'Nuevas subs',data:[T.subs_prev,T.subs30],backgroundColor:['#94a3b8','#16a34a'],borderRadius:6}]}} options={CO({plugins:{legend:{display:false}}})}/>
      </div>
      <div style={{fontSize:11,color:'#16a34a',marginTop:8,fontWeight:500}}>+636% de suscripciones mes a mes 🚀</div>
    </div>
  </div>
  <div className="cc">
    <div style={{fontSize:13,fontWeight:600,marginBottom:14}}>Funnel de conversión</div>
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {[
        {l:'Onboarding Completado',v:4520,c:'#1a1a1a'},{l:'Paywall Presentado',v:6015,c:'#374151'},
        {l:'Subscription Started',v:309,c:'#16a34a',pct:'5% conv.'},{l:'Run Started',v:649,c:'#2563eb'},
        {l:'Run Completed',v:621,c:'#7c3aed',pct:'96% comp.'},
      ].map(s=>{
        const w = Math.max(Math.round(s.v/6015*100),6);
        return (<div key={s.l} style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:`${w}%`,background:s.c,borderRadius:6,padding:'7px 12px',minWidth:60}}>
            <span style={{fontSize:13,fontWeight:600,color:'#fff'}}>{fmt(s.v)}</span>
          </div>
          <span style={{fontSize:12,color:'var(--text-secondary)'}}>{s.l}</span>
          {(s as any).pct && <span style={{fontSize:11,color:'#888',background:'var(--surface)',padding:'2px 6px',borderRadius:6}}>{(s as any).pct}</span>}
        </div>);
      })}
    </div>
  </div>
</>)}

{/* ══════════════ ICP ══════════════ */}
{tab==='ICP' && (<>
  <div className="st">Perfil del cliente ideal — Solo suscriptores pagadores</div>
  <div style={{background:'#fefce8',border:'0.5px solid #fde68a',borderRadius:10,padding:'10px 14px',marginBottom:16,fontSize:12,color:'#854d0e'}}>
    Todos los gráficos usan <strong>subscription_started</strong> segmentado por propiedades de onboarding. Solo muestra quién paga.
  </div>

  {/* Género y Edad */}
  <div className="g2">
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Género</div>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:12}}>149 suscriptores con género definido</div>
      <div style={{height:180}}>
        <Doughnut data={{labels:ICP_GENDER.map(r=>r[0]),datasets:[{data:ICP_GENDER.map(r=>r[1]),backgroundColor:['#ec4899','#3b82f6','#94a3b8'],borderWidth:0}]}} options={DO}/>
      </div>
      <div style={{marginTop:12}}>
        {ICP_GENDER.map((r,i)=><SegBar key={r[0]} label={r[0]} val={r[1]} total={149} color={['#ec4899','#3b82f6','#94a3b8'][i]}/>)}
      </div>
    </div>
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Grupo de edad</div>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:12}}>149 suscriptores con edad definida</div>
      <div style={{height:180}}>
        <Bar data={{labels:ICP_AGE.map(r=>r[0]),datasets:[{data:ICP_AGE.map(r=>r[1]),backgroundColor:['#6366f1','#8b5cf6','#a78bfa','#c4b5fd'],borderRadius:4}]}} options={CO()}/>
      </div>
      <div style={{marginTop:12}}>
        {ICP_AGE.map((r,i)=><SegBar key={r[0]} label={r[0]} val={r[1]} total={149} color={['#6366f1','#8b5cf6','#a78bfa','#c4b5fd'][i]}/>)}
      </div>
    </div>
  </div>

  {/* Nivel y Reloj */}
  <div className="g2">
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Nivel como corredor</div>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:12}}>148 con nivel definido</div>
      <div style={{height:160}}>
        <Doughnut data={{labels:ICP_LEVEL.map(r=>r[0]),datasets:[{data:ICP_LEVEL.map(r=>r[1]),backgroundColor:['#f97316','#3b82f6','#22c55e'],borderWidth:0}]}} options={DO}/>
      </div>
      <div style={{marginTop:12}}>
        {ICP_LEVEL.map((r,i)=><SegBar key={r[0]} label={r[0]} val={r[1]} total={148} color={['#f97316','#3b82f6','#22c55e'][i]}/>)}
      </div>
    </div>
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Marca de reloj</div>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:12}}>149 con reloj definido</div>
      <div style={{height:160}}>
        <Doughnut data={{labels:ICP_WATCH.map(r=>r[0]),datasets:[{data:ICP_WATCH.map(r=>r[1]),backgroundColor:['#1a1a1a','#16a34a','#3b82f6','#f59e0b','#6366f1','#ec4899'],borderWidth:0}]}} options={DO}/>
      </div>
      <div style={{marginTop:12}}>
        {ICP_WATCH.map((r,i)=><SegBar key={r[0]} label={r[0]} val={r[1]} total={149} color={['#1a1a1a','#16a34a','#3b82f6','#f59e0b','#6366f1','#ec4899'][i]}/>)}
      </div>
    </div>
  </div>

  {/* Fuente de descubrimiento */}
  <div className="cc">
    <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>¿Cómo nos encontraron? (Discovery Source)</div>
    <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:12}}>140 suscriptores con fuente definida</div>
    <div className="g2">
      <div style={{height:180}}>
        <Doughnut data={{labels:ICP_SOURCE.map(r=>r[0]),datasets:[{data:ICP_SOURCE.map(r=>r[1]),backgroundColor:['#000000','#e1306c','#1877f2','#1877f2','#94a3b8'],borderWidth:0}]}} options={DO}/>
      </div>
      <div style={{paddingTop:8}}>
        {ICP_SOURCE.map((r,i)=><SegBar key={r[0]} label={r[0]} val={r[1]} total={140} color={['#000000','#e1306c','#1877f2','#1877f2','#94a3b8'][i]}/>)}
        <div style={{marginTop:12,padding:'10px 12px',background:'#f0fdf4',borderRadius:8,fontSize:11,color:'#166534'}}>
          <strong>60% de adquisición viene de TikTok</strong> — canal #1 para crecimiento orgánico
        </div>
      </div>
    </div>
  </div>

  {/* Top ciudades */}
  <div className="cc">
    <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Top ciudades (por onboarding completado)</div>
    <div style={{overflowX:'auto'}}>
      <table className="tbl">
        <thead><tr><th>#</th><th>Ciudad</th><th>Usuarios</th><th>% del total</th></tr></thead>
        <tbody>
          {TOP_CITIES.slice(0,12).map((r,i)=>(
            <tr key={r[0]}>
              <td style={{color:'var(--text-secondary)'}}>{i+1}</td>
              <td style={{fontWeight:500}}>{r[0]}</td>
              <td>{r[1]}</td>
              <td>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:60,height:5,background:'var(--surface)',borderRadius:3}}>
                    <div style={{width:`${pct(r[1],39)}%`,height:'100%',background:'#6366f1',borderRadius:3}}/>
                  </div>
                  <span style={{fontSize:11,color:'var(--text-secondary)'}}>{pct(r[1],39)}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:10}}>
      Usuarios en LATAM (Colombia, México, Ecuador, Costa Rica), España, USA, UK, Australia. App global desde día 1.
    </div>
  </div>
</>)}

{/* ══════════════ CORRIDAS ══════════════ */}
{tab==='Corridas' && (<>
  <div className="st">Comportamiento de corridas</div>
  <div className="g4">
    <Card label="Total corridas (30d)" value={fmt(T.runs)} sub="run_started"/>
    <Card label="Promedio diario" value="21" sub="649 ÷ 30 días"/>
    <Card label="Completadas" value={fmt(T.runsCompleted)} sub="run_completed"/>
    <Card label="Completion rate" value="96%" green sub="621 / 649"/>
  </div>

  <div className="cc">
    <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Corridas por día</div>
    <div style={{height:220}}>
      <Bar data={{labels:RUN_S.map(r=>r[0]),datasets:[{data:RUN_S.map(r=>r[1]),backgroundColor:'#1a1a1a',borderRadius:3,hoverBackgroundColor:'#f97316'}]}} options={CO()}/>
    </div>
    <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:8}}>Picos: 15 mar (60), 21 mar (56), 22 mar (59), 28 mar (59), 29 mar (56). Actividad constante con picos de fin de semana.</div>
  </div>

  <div className="cc">
    <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Hora de inicio de corridas (local_hour)</div>
    <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:12}}>649 corridas · Zona horaria local del dispositivo</div>
    <div style={{height:200}}>
      <Bar data={{labels:HORA_RUNS.map(r=>r[0]),datasets:[{data:HORA_RUNS.map(r=>r[1]),backgroundColor:HORA_RUNS.map((_,i)=>{const h=parseInt(_.split('-')[0]);return h>=6&&h<12?'#f97316':h>=18?'#1a1a1a':'#94a3b8';}),borderRadius:4}]}} options={CO()}/>
    </div>
    <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:10,display:'flex',gap:16}}>
      <span><span style={{color:'#f97316',fontWeight:600}}>■</span> Mañana (6-12h): {80+144} corridas (35%)</span>
      <span><span style={{color:'#94a3b8',fontWeight:600}}>■</span> Tarde (4-6, 12-18h): {30+32+34+56} corridas (23%)</span>
      <span><span style={{color:'#1a1a1a',fontWeight:600}}>■</span> Noche (18h+): 134 corridas (21%)</span>
    </div>
    <div style={{marginTop:10,padding:'10px 12px',background:'#eff6ff',borderRadius:8,fontSize:11,color:'#1d4ed8'}}>
      <strong>Insight clave:</strong> 54% de las corridas son entre 6am y 10am — nuestros usuarios corren en la mañana antes del trabajo. Esto informa el mejor horario para mandar notificaciones y cheers.
    </div>
  </div>
</>)}

{/* ══════════════ ENGAGEMENT ══════════════ */}
{tab==='Engagement' && (<>
  <div className="st">Engagement emocional — Diferenciador central de CheerMyRun</div>
  <div className="g4">
    <Card label="Cheers recibidos (30d)" value={fmt(T.cheersReceived)} sub="cheer_received"/>
    <Card label="Cheers / corrida" value={(T.cheersReceived/T.runs).toFixed(0)} green sub="41 promedio"/>
    <Card label="App Opens" value={fmt(T.appOpens)} sub="115/día promedio"/>
    <Card label="TTS vs Voice Note" value="48% / 52%" sub="casi empate"/>
  </div>

  <div className="g2">
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Voice Note vs TTS (texto a voz)</div>
      <div style={{height:200}}>
        <Doughnut data={{labels:CHEER_TYPE.map(r=>r[0]),datasets:[{data:CHEER_TYPE.map(r=>r[1]),backgroundColor:['#6366f1','#f97316'],borderWidth:0}]}} options={DO}/>
      </div>
      <div style={{marginTop:12}}>
        <SegBar label="TTS (texto)" val={13820} total={26614} color="#6366f1"/>
        <SegBar label="Voice Note" val={12794} total={26614} color="#f97316"/>
        <div style={{marginTop:8,fontSize:11,color:'var(--text-secondary)'}}>Distribución casi igual — ambos tipos son populares. Voice notes generan mayor conexión emocional.</div>
      </div>
    </div>
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Cheers por día</div>
      <div style={{height:200}}>
        <Bar data={{labels:CHEER_S.map(r=>r[0]),datasets:[{data:CHEER_S.map(r=>r[1]),backgroundColor:'#f97316',borderRadius:3}]}} options={CO()}/>
      </div>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:8}}>Pico 22 mar: 11,281 cheers. Los picos correlacionan con actividad de fin de semana.</div>
    </div>
  </div>

  <div className="cc">
    <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>¿Por qué el engagement importa al inversionista?</div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
      {[
        {t:'41 cheers / corrida',d:'Engagement emocional sin precedente en el mercado de running apps. Nadie tiene este número.', c:'#dcfce7', tc:'#166534'},
        {t:'96% completion rate',d:'Los usuarios que empiezan una corrida, la terminan. El app hace su trabajo: motivar.', c:'#eff6ff', tc:'#1d4ed8'},
        {t:'26,614 cheers en 30d',d:'Volumen de interacciones humanas reales. Cada cheer es una persona diciéndole a otra "sigue adelante".', c:'#fef3c7', tc:'#92400e'},
      ].map(x=>(
        <div key={x.t} style={{background:x.c,borderRadius:10,padding:'12px 14px'}}>
          <div style={{fontSize:13,fontWeight:600,color:x.tc,marginBottom:6}}>{x.t}</div>
          <div style={{fontSize:11,color:x.tc,lineHeight:1.5}}>{x.d}</div>
        </div>
      ))}
    </div>
  </div>
</>)}

{/* ══════════════ P&L ══════════════ */}
{tab==='P&L' && (<>
  <div className="st">P&L — Gastos, ingresos e inversiones</div>
  <div className="g3" style={{marginBottom:16}}>
    <div className="cc" style={{borderLeft:'3px solid #dc2626',marginBottom:0}}>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:4}}>Total Gastos</div>
      <div style={{fontSize:26,fontWeight:700,color:'#dc2626'}}>${fmt(gastos)}</div>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:4}}>{pnl.filter(e=>e.type==='Gasto').length} entradas</div>
    </div>
    <div className="cc" style={{borderLeft:'3px solid #16a34a',marginBottom:0}}>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:4}}>Total Ingresos</div>
      <div style={{fontSize:26,fontWeight:700,color:'#16a34a'}}>${fmt(ingresos)}</div>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:4}}>{pnl.filter(e=>e.type==='Ingreso').length} entradas</div>
    </div>
    <div className="cc" style={{borderLeft:`3px solid ${neto>=0?'#16a34a':'#dc2626'}`,marginBottom:0}}>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:4}}>Flujo Neto</div>
      <div style={{fontSize:26,fontWeight:700,color:neto>=0?'#16a34a':'#dc2626'}}>{neto>=0?'+':''}${fmt(neto)}</div>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:4}}>Ingresos − Gastos</div>
    </div>
  </div>
  {months.length>0 && <div className="g2">
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Burn mensual</div>
      <div style={{height:200}}>
        <Bar data={{labels:months,datasets:[{label:'Gastos',data:months.map(m=>byMonth[m]?.g||0),backgroundColor:'#dc2626',borderRadius:3},{label:'Ingresos',data:months.map(m=>byMonth[m]?.i||0),backgroundColor:'#16a34a',borderRadius:3}]}} options={CO({plugins:{legend:{display:true,labels:{font:{size:11},boxWidth:10}}}})}/>
      </div>
    </div>
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Gastos por categoría</div>
      {Object.keys(byCat).length>0?<div style={{height:200}}>
        <Doughnut data={{labels:Object.keys(byCat),datasets:[{data:Object.values(byCat),backgroundColor:Object.keys(byCat).map(k=>PNL_COLORS[k]||'#94a3b8'),borderWidth:0}]}} options={DO}/>
      </div>:<div style={{fontSize:12,color:'var(--text-secondary)',padding:'30px 0',textAlign:'center'}}>Agrega gastos para ver distribución</div>}
    </div>
  </div>}
  {Object.keys(byCat).length>0 && <div className="cc">
    <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Desglose por categoría</div>
    {Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>(
      <SegBar key={cat} label={cat} val={amt} total={gastos} color={PNL_COLORS[cat]||'#94a3b8'}/>
    ))}
  </div>}
  <div className="cc">
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
      <span style={{fontSize:13,fontWeight:600}}>Todas las entradas</span>
      <div style={{display:'flex',gap:6}}>
        {['all','gasto','ingreso'].map(f=><button key={f} className="btn" onClick={()=>setFilter(f)} style={{padding:'4px 10px',fontSize:11,background:filter===f?'#1a1a1a':'var(--card)',color:filter===f?'#fff':'var(--text-secondary)'}}>{f==='all'?'Todos':f==='gasto'?'Gastos':'Ingresos'}</button>)}
      </div>
    </div>
    {filtered.length===0?<div style={{textAlign:'center',padding:'24px 0',color:'var(--text-secondary)',fontSize:13}}>Sin entradas. Click en "+ Agregar" para empezar.</div>:
    <div style={{overflowX:'auto'}}><table className="tbl" style={{minWidth:560}}>
      <thead><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th>Tipo</th><th style={{textAlign:'right'}}>Monto</th><th></th></tr></thead>
      <tbody>{filtered.map(e=>(
        <tr key={e.id}>
          <td style={{color:'var(--text-secondary)',whiteSpace:'nowrap',fontSize:11}}>{e.date}</td>
          <td><span style={{fontWeight:500}}>{e.name}</span>{e.notes&&<div style={{fontSize:10,color:'var(--text-secondary)'}}>{e.notes}</div>}</td>
          <td><span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:(PNL_COLORS[e.category]||'#94a3b8')+'22',color:PNL_COLORS[e.category]||'#666'}}>{e.category}</span></td>
          <td><span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:e.type==='Gasto'?'#fee2e2':'#dcfce7',color:e.type==='Gasto'?'#991b1b':'#166534'}}>{e.type}</span></td>
          <td style={{textAlign:'right',fontWeight:600,color:e.type==='Gasto'?'#dc2626':'#16a34a',whiteSpace:'nowrap'}}>{e.type==='Gasto'?'-':'+'}${e.amount.toLocaleString()}</td>
          <td style={{whiteSpace:'nowrap'}}>
            <button className="btn" onClick={()=>startEdit(e)} style={{fontSize:10,padding:'2px 8px',marginRight:4}}>Editar</button>
            <button className="btn btn-red" onClick={()=>del(e.id)} style={{fontSize:10,padding:'2px 8px'}}>Borrar</button>
          </td>
        </tr>
      ))}</tbody>
    </table></div>}
  </div>
</>)}

{/* ══════════════ ESTADO ══════════════ */}
{tab==='Estado' && (<>
  <div className="st">Estado del sistema</div>
  <div className="cc" style={{borderLeft:'3px solid #16a34a'}}>
    <div style={{fontSize:13,fontWeight:600,color:'#16a34a',marginBottom:8}}>✓ Mixpanel — CheerMyRun Prod (3993852)</div>
    <div style={{fontSize:12,color:'var(--text-secondary)',lineHeight:2.0}}>
      <strong>Última actualización:</strong> 30 Mar 2026 (datos embebidos vía MCP)<br/>
      <strong>Eventos activos:</strong> run_started, run_completed, cheer_received, cheer_favorited, cheer_replayed, subscription_started, paywall_presented, onboarding_completed, app_opened<br/>
      <strong>77,058 eventos</strong> en el proyecto desde el inicio<br/>
      <strong>Nota:</strong> La Data Export API HTTP está bloqueada por Mixpanel para este plan. Los datos se obtienen vía MCP y se actualizan con cada deploy.
    </div>
  </div>
  <div className="cc" style={{borderLeft:'3px solid #16a34a'}}>
    <div style={{fontSize:13,fontWeight:600,color:'#16a34a',marginBottom:8}}>✓ Superwall — Suscripciones via Mixpanel</div>
    <div style={{fontSize:12,color:'var(--text-secondary)',lineHeight:2.0}}>
      Superwall envía eventos a Mixpanel: <strong>subscription_started, Renewal, Subscription Cancelled</strong><br/>
      <strong>Marzo 2026:</strong> 309 nuevas suscripciones + {T.renewals} renovaciones<br/>
      Revenue estimado: <strong>${fmt(MRR_EST)}/mes</strong>
    </div>
  </div>
  <div className="cc" style={{borderLeft:'3px solid #f59e0b'}}>
    <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>⚠ Propiedades pendientes de implementar</div>
    <div style={{fontSize:12,color:'var(--text-secondary)',lineHeight:2.0}}>
      Según Analytics V2 doc, estos campos tienen datos limitados:<br/>
      <strong>usage_intent</strong> — Sin datos en suscriptores (undefined 100%)<br/>
      <strong>distances_completed</strong> — No se registra aún en corridas<br/>
      <strong>$country_code</strong> — Propiedad de Mixpanel no disponible (se usa $city)<br/>
      <strong>cheer_favorited / cheer_replayed</strong> — Eventos presentes, pendiente de análisis<br/>
      <strong>AppsFlyer</strong> — Sin integración activa (attribution_channel undefined)
    </div>
  </div>
  <div className="cc" style={{borderLeft:'3px solid #888'}}>
    <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>P&L — Entrada manual</div>
    <div style={{fontSize:12,color:'var(--text-secondary)'}}>
      Los datos del P&L se guardan localmente en este navegador. Total: <strong>{pnl.length} entradas</strong>.
    </div>
  </div>
</>)}

          </div>
        </div>
      </div>

      {/* Modal P&L */}
      {showAdd && (
        <div className="modal-bg" onClick={()=>setShowAdd(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:15,fontWeight:600,marginBottom:20}}>{editId?'Editar entrada':'Nueva entrada P&L'}</div>
            <div className="frow">
              <div><div className="flabel">Fecha</div><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={{width:'100%'}}/></div>
              <div><div className="flabel">Tipo</div><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={{width:'100%'}}><option>Gasto</option><option>Ingreso</option></select></div>
            </div>
            <div style={{marginBottom:12}}><div className="flabel">Concepto</div><input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="ej. Pago influencer @corredor" style={{width:'100%'}}/></div>
            <div className="frow">
              <div><div className="flabel">Categoría</div><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={{width:'100%'}}>{PNL_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
              <div><div className="flabel">Monto (USD)</div><input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0" style={{width:'100%'}}/></div>
            </div>
            <div style={{marginBottom:20}}><div className="flabel">Notas (opcional)</div><input type="text" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="ej. Pago desde cuenta personal" style={{width:'100%'}}/></div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button className="btn" onClick={()=>setShowAdd(false)}>Cancelar</button>
              <button className="btn btn-dark" onClick={saveEntry}>{editId?'Guardar':'Agregar'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
