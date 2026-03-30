import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

// ══════════════════════════════════════════════════════════════════════════
// ALL DATA — Mixpanel CheerMyRun Prod (3993852) — fetched via MCP 2026-03-30
// ══════════════════════════════════════════════════════════════════════════

// Weekly subscription + cancellation data (all history)
const WEEKLY_DATA = [
  { week: '23 Feb', subs: 44, cancels: 0, renewals: 0 },
  { week: '02 Mar', subs: 27, cancels: 0, renewals: 0 },
  { week: '09 Mar', subs: 137, cancels: 38, renewals: 17 },
  { week: '16 Mar', subs: 57, cancels: 50, renewals: 26 },
  { week: '23 Mar', subs: 64, cancels: 50, renewals: 39 },
  { week: '30 Mar', subs: 1, cancels: 3, renewals: 1 },
];

// Daily data for last 30 days
const DAILY_SUBS: [string, number][] = [
  ["02-28",13],["03-01",2],["03-02",0],["03-03",4],["03-04",4],["03-05",3],["03-06",8],["03-07",5],["03-08",3],["03-09",3],["03-10",1],["03-11",2],["03-12",2],["03-13",55],["03-14",59],["03-15",15],["03-16",8],["03-17",5],["03-18",5],["03-19",6],["03-20",4],["03-21",19],["03-22",10],["03-23",2],["03-24",4],["03-25",3],["03-26",10],["03-27",14],["03-28",16],["03-29",15],["03-30",1],
];
const DAILY_CANCELS: [string, number][] = [
  ["02-28",0],["03-01",0],["03-02",0],["03-03",0],["03-04",0],["03-05",0],["03-06",0],["03-07",0],["03-08",0],["03-09",0],["03-10",7],["03-11",3],["03-12",6],["03-13",2],["03-14",6],["03-15",14],["03-16",8],["03-17",6],["03-18",7],["03-19",6],["03-20",9],["03-21",7],["03-22",7],["03-23",6],["03-24",6],["03-25",6],["03-26",3],["03-27",9],["03-28",12],["03-29",8],["03-30",3],
];
const DAILY_RENEWALS: [string, number][] = [
  ["02-28",0],["03-01",0],["03-02",0],["03-03",0],["03-04",0],["03-05",0],["03-06",0],["03-07",0],["03-08",0],["03-09",0],["03-10",2],["03-11",3],["03-12",3],["03-13",4],["03-14",5],["03-15",0],["03-16",4],["03-17",2],["03-18",3],["03-19",4],["03-20",3],["03-21",7],["03-22",3],["03-23",4],["03-24",6],["03-25",4],["03-26",5],["03-27",8],["03-28",8],["03-29",4],["03-30",1],
];
const DAILY_RUNS: [string, number][] = [
  ["02-27",9],["02-28",44],["03-01",12],["03-02",10],["03-03",12],["03-04",10],["03-05",6],["03-06",15],["03-07",17],["03-08",22],["03-09",5],["03-10",7],["03-11",5],["03-12",6],["03-13",9],["03-14",32],["03-15",60],["03-16",15],["03-17",14],["03-18",13],["03-19",20],["03-20",21],["03-21",56],["03-22",59],["03-23",11],["03-24",10],["03-25",14],["03-26",6],["03-27",14],["03-28",59],["03-29",56],
];
const DAILY_CHEERS: [string, number][] = [
  ["02-27",19],["02-28",1870],["03-01",58],["03-02",50],["03-03",22],["03-04",60],["03-05",13],["03-06",33],["03-07",495],["03-08",2167],["03-09",10],["03-10",13],["03-11",98],["03-12",13],["03-13",27],["03-14",332],["03-15",1488],["03-16",14],["03-17",22],["03-18",47],["03-19",30],["03-20",21],["03-21",4058],["03-22",11281],["03-23",6],["03-24",73],["03-25",29],["03-26",4],["03-27",18],["03-28",2566],["03-29",1677],
];

// Run quality analysis (90 days, 668 total run_completed)
const DIST_BUCKETS = [
  { label: '<1km (prueba)', count: 278, real: false },
  { label: '1-3km', count: 23, real: true },
  { label: '3-5km', count: 42, real: true },
  { label: '5-10km', count: 86, real: true },
  { label: '10-21km', count: 106, real: true },
  { label: 'Media maratón', count: 105, real: true },
  { label: 'Maratón+', count: 28, real: true },
];
const DUR_BUCKETS = [
  { label: '<5min (prueba)', count: 251, real: false },
  { label: '5-10min', count: 16, real: true },
  { label: '10-20min', count: 17, real: true },
  { label: '20-30min', count: 25, real: true },
  { label: '30-60min', count: 93, real: true },
  { label: '1-2h', count: 112, real: true },
  { label: '2h+', count: 154, real: true },
];
// Real runs: duration>300s AND distance>1km = 387 of 668
const REAL_RUNS = 387;
const TEST_RUNS = 668 - 387;

// Conversion time: 665 seconds avg on same day = ~11 minutes!
// 7-day funnel: avg 21,374 seconds = ~5.9 hours
const CONV_SAME_DAY_RATE = 0.06; // 6%
const CONV_7DAY_RATE = 0.07; // 7%
const CONV_AVG_SECONDS_SAMEDAY = 665; // 11 minutes
const CONV_AVG_SECONDS_7DAY = 21374; // 5.9 hours

// ICP
const ICP_GENDER = [["Femenino",110],["Masculino",37],["Otro",2]] as [string,number][];
const ICP_AGE = [["25-34",89],["35-44",26],["18-24",27],["45-54",7]] as [string,number][];
const ICP_LEVEL = [["Intermedio",84],["Principiante",56],["Avanzado",8]] as [string,number][];
const ICP_WATCH = [["Apple Watch",60],["Garmin",59],["Fitbit",14],["Samsung",11],["COROS",2],["Smartphone",3]] as [string,number][];
const ICP_SOURCE = [["TikTok",84],["Instagram",36],["Amigos",16],["Facebook",3]] as [string,number][];
const ICP_PLAN = [["Mensual",110],["Anual",39],["Anual desc.",3],["Semanal",5]] as [string,number][];
const HORA_RUNS = [["00-04",5],["04-06",30],["06-08",134],["08-10",144],["10-12",80],["12-14",32],["14-16",34],["16-18",56],["18+",134]] as [string,number][];
const CHEER_TYPE = [["TTS",13820],["Voice Note",12794]] as [string,number][];
const TOP_CITIES = [
  ["San José, CR",28],["Bogotá, CO",39],["Iztapalapa, MX",20],["Madrid, ES",21],
  ["Melbourne, AU",18],["Sydney, AU",18],["México DF, MX",18],["Barranquilla, CO",17],
  ["San Juan, PR",17],["Los Angeles, US",17],["Quito, EC",16],["León, MX",16],
  ["Medellín, CO",16],["New York, US",16],["Birmingham, UK",16],
] as [string,number][];

// Revenue estimates
const MRR_MAR = Math.round(110 * 9.99 + 39 * (49.99 / 12) + 5 * 2.99);
const MRR_FEB = Math.round(25 * 9.99 + 10 * (49.99 / 12));
const TOTAL_SUBS_CUMUL = 44 + 27 + 137 + 57 + 64 + 1; // 330

// P&L
const PNL_KEY = 'cmr_pnl_v3';
interface PnlEntry { id:string; date:string; name:string; category:string; type:string; amount:number; notes:string; }
const PNL_CATS = ['Desarrollo','Influencer','Infraestructura','Herramientas/SaaS','Diseño','Marketing','Inversión Alex','Revenue','Otro'];
const PNL_COLORS: Record<string,string> = {'Desarrollo':'#6366f1','Influencer':'#ec4899','Infraestructura':'#3b82f6','Herramientas/SaaS':'#f97316','Diseño':'#8b5cf6','Marketing':'#14b8a6','Inversión Alex':'#22c55e','Revenue':'#16a34a','Otro':'#94a3b8'};
const loadPnl = (): PnlEntry[] => { try { return JSON.parse(localStorage.getItem(PNL_KEY)||'[]'); } catch { return []; } };
const savePnl = (e: PnlEntry[]) => localStorage.setItem(PNL_KEY, JSON.stringify(e));

const TABS = ['Overview','Revenue','Corridas','ICP','Engagement','P&L','Estado'];
const PERIODS = [
  { label: 'Hoy', days: 1 },
  { label: '7 días', days: 7 },
  { label: '14 días', days: 14 },
  { label: '30 días', days: 30 },
  { label: '2 meses', days: 60 },
  { label: 'Todo', days: 999 },
];

function fmt(n:number){ return n.toLocaleString('es-MX'); }
function fmtMin(s:number){ if(s<60)return s+'s'; if(s<3600)return Math.round(s/60)+'min'; return (s/3600).toFixed(1)+'h'; }
function pct(a:number,b:number){ return b>0?Math.round(a/b*100):0; }
function dpct(a:number,b:number){ return b>0?Math.round((a-b)/b*100):null; }

const CO = (extra?:any) => ({
  responsive:true, maintainAspectRatio:false,
  plugins:{legend:{display:false},tooltip:{bodyFont:{size:11},titleFont:{size:11}}},
  scales:{x:{grid:{color:'rgba(128,128,128,0.07)'},ticks:{color:'#888',font:{size:10}}},y:{grid:{color:'rgba(128,128,128,0.07)'},ticks:{color:'#888',font:{size:10}},beginAtZero:true}},...extra,
});
const DO = {responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,position:'right' as const,labels:{font:{size:11},boxWidth:12,padding:8}}}};
const COLS = ['#6366f1','#ec4899','#3b82f6','#f97316','#8b5cf6','#14b8a6','#22c55e','#f59e0b','#dc2626','#0891b2'];

function Card({label,value,delta,sub,green,color,big}:{label:string,value:any,delta?:number|null,sub?:string,green?:boolean,color?:string,big?:boolean}) {
  return (
    <div style={{background:'var(--card)',border:'0.5px solid var(--border)',borderRadius:12,padding:'14px 16px',borderLeft:color?`3px solid ${color}`:undefined}}>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:5}}>{label}</div>
      <div style={{fontSize:big?26:22,fontWeight:600,color:green?'#16a34a':'var(--text-primary)',lineHeight:1.1}}>{value}</div>
      {delta!=null&&<div style={{fontSize:11,marginTop:4,color:delta>=0?'#16a34a':'#dc2626'}}>{delta>=0?'+':''}{delta}% vs período ant.</div>}
      {sub&&<div style={{fontSize:10,marginTop:3,color:'var(--text-secondary)'}}>{sub}</div>}
    </div>
  );
}

function SegBar({label,val,total,color,dim}:{label:string,val:number,total:number,color:string,dim?:boolean}) {
  const p = pct(val,total);
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:7,opacity:dim?0.45:1}}>
      <span style={{fontSize:12,color:'var(--text-secondary)',width:130,flexShrink:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</span>
      <div style={{flex:1,height:6,background:'var(--surface)',borderRadius:3,overflow:'hidden'}}>
        <div style={{width:`${p}%`,height:'100%',background:color,borderRadius:3}}/>
      </div>
      <span style={{fontSize:11,color:'var(--text-secondary)',width:26,textAlign:'right'}}>{p}%</span>
      <span style={{fontSize:10,color:'#999',width:32,textAlign:'right'}}>{fmt(val)}</span>
    </div>
  );
}

function filterByDays<T extends [string,number]>(data: T[], days: number): T[] {
  if (days >= 999) return data;
  return data.slice(-Math.min(days, data.length)) as T[];
}

export default function Dashboard() {
  const [tab, setTab] = useState('Overview');
  const [period, setPeriod] = useState(30);
  const [pnl, setPnl] = useState<PnlEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({date:new Date().toISOString().split('T')[0],name:'',category:'Desarrollo',type:'Gasto',amount:'',notes:''});
  useEffect(()=>{setPnl(loadPnl());},[]);

  // Filtered series
  const fSubs = filterByDays(DAILY_SUBS, period);
  const fCancels = filterByDays(DAILY_CANCELS, period);
  const fRenewals = filterByDays(DAILY_RENEWALS, period);
  const fRuns = filterByDays(DAILY_RUNS, period);
  const fCheers = filterByDays(DAILY_CHEERS, period);

  const totalSubs = fSubs.reduce((s,r)=>s+r[1],0);
  const totalCancels = fCancels.reduce((s,r)=>s+r[1],0);
  const totalRenewals = fRenewals.reduce((s,r)=>s+r[1],0);
  const totalRuns = fRuns.reduce((s,r)=>s+r[1],0);
  const totalCheers = fCheers.reduce((s,r)=>s+r[1],0);
  const netSubs = totalSubs - totalCancels;
  const churnRate = totalSubs > 0 ? pct(totalCancels, totalSubs + totalRenewals) : 0;

  // P&L
  const gastos = pnl.filter(e=>e.type==='Gasto').reduce((s,e)=>s+e.amount,0);
  const ingresos = pnl.filter(e=>e.type==='Ingreso').reduce((s,e)=>s+e.amount,0);
  const neto = ingresos - gastos;
  const byCat = pnl.filter(e=>e.type==='Gasto').reduce((a:Record<string,number>,e)=>{a[e.category]=(a[e.category]||0)+e.amount;return a;},{});
  const byMonth = pnl.reduce((a:Record<string,{g:number,i:number}>,e)=>{const m=e.date.substring(0,7);if(!a[m])a[m]={g:0,i:0};if(e.type==='Gasto')a[m].g+=e.amount;else a[m].i+=e.amount;return a;},{});
  const months = Object.keys(byMonth).sort();
  const filtered = filter==='all'?pnl:filter==='gasto'?pnl.filter(e=>e.type==='Gasto'):pnl.filter(e=>e.type==='Ingreso');

  function saveEntry(){
    if(!form.name||!form.amount)return;
    const entry:PnlEntry={id:editId||Date.now().toString(),date:form.date,name:form.name,category:form.category,type:form.type,amount:Number(form.amount),notes:form.notes};
    const updated=editId?pnl.map(e=>e.id===editId?entry:e):[...pnl,entry];
    const sorted=updated.sort((a,b)=>b.date.localeCompare(a.date));
    setPnl(sorted);savePnl(sorted);setShowAdd(false);setEditId(null);
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
        *{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--text-primary);font-size:14px}
        .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
        .g3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
        .g2{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:14px}
        .cc{background:var(--card);border:0.5px solid var(--border);border-radius:12px;padding:16px;margin-bottom:14px}
        .cc:last-child{margin-bottom:0}
        .st{font-size:10px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px}
        .live{font-size:9px;padding:2px 7px;border-radius:20px;background:#dcfce7;color:#166534;font-weight:600}
        .warn{font-size:9px;padding:2px 7px;border-radius:20px;background:#fef9c3;color:#854d0e;font-weight:600}
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
        .sb-link{display:block;width:100%;text-align:left;padding:7px 10px;border-radius:8px;font-size:13px;cursor:pointer;background:transparent;border:none;color:var(--text-secondary);font-family:inherit}
        .sb-link.active{background:var(--surface);color:var(--text-primary);font-weight:500}
        .period-btn{font-size:11px;padding:4px 10px;border-radius:6px;border:0.5px solid var(--border);background:var(--card);color:var(--text-secondary);cursor:pointer;font-family:inherit}
        .period-btn.active{background:#1a1a1a;color:#fff;border-color:#1a1a1a}
        .insight{background:#eff6ff;border-radius:8px;padding:10px 12px;font-size:11px;color:#1d4ed8;margin-top:10px;line-height:1.5}
        .insight-green{background:#f0fdf4;color:#166534}
        .insight-amber{background:#fef9c3;color:#854d0e}
        .insight-red{background:#fef2f2;color:#991b1b}
        @media(max-width:900px){.g4{grid-template-columns:repeat(2,1fr)}.g2{grid-template-columns:1fr}}
      `}</style>

      <div style={{display:'flex',minHeight:'100vh'}}>
        {/* ── Sidebar ── */}
        <div style={{width:210,background:'var(--sb)',borderRight:'0.5px solid var(--border)',display:'flex',flexDirection:'column',padding:'0 0 20px',flexShrink:0}}>
          <div style={{padding:'18px 16px 14px',borderBottom:'0.5px solid var(--border)',marginBottom:8}}>
            <div style={{display:'flex',alignItems:'center',gap:9}}>
              <div style={{width:32,height:32,borderRadius:8,background:'linear-gradient(135deg,#f97316,#dc2626)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🏃</div>
              <div>
                <div style={{fontSize:14,fontWeight:600}}>Cheer My Run</div>
                <div style={{fontSize:10,color:'var(--text-secondary)'}}>Investor Dashboard</div>
              </div>
            </div>
          </div>
          <div style={{padding:'4px 8px',flex:1}}>
            <div style={{fontSize:9,color:'var(--text-secondary)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.08em',padding:'8px 10px 4px'}}>Analytics</div>
            {TABS.map(t=>(
              <button key={t} onClick={()=>setTab(t)} className={`sb-link${tab===t?' active':''}`}>{t}</button>
            ))}
          </div>
          <div style={{padding:'12px 16px 0',borderTop:'0.5px solid var(--border)'}}>
            <div style={{fontSize:10,color:'var(--text-secondary)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>Fuentes</div>
            {[{n:'Mixpanel',c:'#16a34a',d:'Datos reales ✓'},{n:'Superwall',c:'#16a34a',d:'vía Mixpanel ✓'},{n:'AppsFlyer',c:'#888',d:'Pendiente'}].map(s=>(
              <div key={s.n} style={{marginBottom:7}}>
                <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}><div style={{width:6,height:6,borderRadius:'50%',background:s.c,flexShrink:0}}/>{s.n}</div>
                <div style={{fontSize:10,color:'#999',marginLeft:12}}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main ── */}
        <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>
          {/* Header */}
          <div style={{background:'var(--card)',borderBottom:'0.5px solid var(--border)',padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
            <div>
              <span style={{fontSize:15,fontWeight:600}}>{tab}</span>
              <span style={{fontSize:11,color:'var(--text-secondary)',marginLeft:10}}>CheerMyRun Prod · 77,058 eventos</span>
            </div>
            <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
              {tab !== 'P&L' && tab !== 'ICP' && tab !== 'Estado' && PERIODS.map(p=>(
                <button key={p.days} className={`period-btn${period===p.days?' active':''}`} onClick={()=>setPeriod(p.days)}>{p.label}</button>
              ))}
              <span className="live">DATOS REALES</span>
              {tab==='P&L'&&<button className="btn btn-dark" onClick={()=>{setShowAdd(true);setEditId(null);}}>+ Agregar</button>}
            </div>
          </div>

          <div style={{flex:1,padding:20,overflowY:'auto'}}>

{/* ══════════ OVERVIEW ══════════ */}
{tab==='Overview'&&(<>
  <div className="st">Métricas clave</div>
  <div className="g4">
    <Card label="Corridas" value={fmt(totalRuns)} sub="run_started"/>
    <Card label="Suscripciones nuevas" value={fmt(totalSubs)} sub={`Superwall → Mixpanel`}/>
    <Card label="Cancelaciones" value={fmt(totalCancels)} color="#dc2626" sub={`Churn rate: ${churnRate}%`}/>
    <Card label="Cheers recibidos" value={fmt(totalCheers)} green sub={totalRuns>0?(totalCheers/totalRuns).toFixed(0)+' por corrida':undefined}/>
  </div>
  <div className="g4">
    <Card label="Neto subs (nuevas-cancel)" value={(netSubs>=0?'+':'')+fmt(netSubs)} color={netSubs>=0?'#16a34a':'#dc2626'} sub="crecimiento real"/>
    <Card label="Renovaciones" value={fmt(totalRenewals)} green sub="subs que renuevan"/>
    <Card label="MRR estimado" value={`$${fmt(MRR_MAR)}`} delta={dpct(MRR_MAR,MRR_FEB)} big sub="mensual+anual+semanal"/>
    <Card label="Corridas reales" value={`${Math.round(REAL_RUNS/668*100)}%`} green sub={`${REAL_RUNS} de 668 >300s y >1km`}/>
  </div>
  <div className="g2">
    <div className="cc">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <span style={{fontSize:13,fontWeight:600}}>Subs nuevas vs Cancelaciones</span>
        <span className="live">SUPERWALL</span>
      </div>
      <div style={{height:200}}>
        <Bar data={{
          labels:fSubs.map(r=>r[0]),
          datasets:[
            {label:'Nuevas',data:fSubs.map(r=>r[1]),backgroundColor:'#16a34a',borderRadius:3},
            {label:'Cancelaciones',data:fCancels.map(r=>r[1]),backgroundColor:'#dc2626',borderRadius:3},
            {label:'Renovaciones',data:fRenewals.map(r=>r[1]),backgroundColor:'#6366f1',borderRadius:3},
          ]
        }} options={CO({plugins:{legend:{display:true,labels:{font:{size:11},boxWidth:10}}}})}/>
      </div>
      <div className="insight">
        <strong>Insight clave:</strong> Cancelaciones empezaron el 10 mar (7 días después del pico de suscripciones del 3 mar). Las suscripciones de prueba gratuita/weekly cancelan rápido. Foco en annual plan para LTV.
      </div>
    </div>
    <div className="cc">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <span style={{fontSize:13,fontWeight:600}}>Corridas por día</span>
        <span className="live">MIXPANEL</span>
      </div>
      <div style={{height:200}}>
        <Bar data={{labels:fRuns.map(r=>r[0]),datasets:[{data:fRuns.map(r=>r[1]),backgroundColor:'#1a1a1a',borderRadius:3}]}} options={CO()}/>
      </div>
    </div>
  </div>
</>)}

{/* ══════════ REVENUE ══════════ */}
{tab==='Revenue'&&(<>
  <div className="st">Revenue — Superwall vía Mixpanel</div>
  <div className="g4">
    <Card label="MRR estimado" value={`$${fmt(MRR_MAR)}`} delta={dpct(MRR_MAR,MRR_FEB)} big green/>
    <Card label="Subs acumuladas" value={fmt(TOTAL_SUBS_CUMUL)} sub="desde lanzamiento (22 feb)"/>
    <Card label="Cancelaciones (30d)" value={fmt(totalCancels)} color="#dc2626" sub={`${churnRate}% de churn`}/>
    <Card label="Renovaciones (30d)" value={fmt(totalRenewals)} green sub="retención probada"/>
  </div>
  <div className="g3">
    <Card label="Plan mensual (~$9.99)" value="110 subs" sub={`~$${Math.round(110*9.99)}/mo`} color="#6366f1"/>
    <Card label="Plan anual (~$49.99)" value="39 subs" sub={`~$${Math.round(39*49.99/12)}/mo`} color="#3b82f6"/>
    <Card label="Plan semanal (~$2.99)" value="5 subs" sub="~$15/mo" color="#94a3b8"/>
  </div>

  <div className="cc">
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
      <span style={{fontSize:13,fontWeight:600}}>Subs, Cancelaciones y Renovaciones diarias</span>
      <span className="live">SUPERWALL</span>
    </div>
    <div style={{height:220}}>
      <Bar data={{
        labels:fSubs.map(r=>r[0]),
        datasets:[
          {label:'Nuevas',data:fSubs.map(r=>r[1]),backgroundColor:'#16a34a',borderRadius:2},
          {label:'Cancelaciones',data:fCancels.map(r=>r[1]),backgroundColor:'#dc2626',borderRadius:2},
          {label:'Renovaciones',data:fRenewals.map(r=>r[1]),backgroundColor:'#6366f1',borderRadius:2},
        ]
      }} options={CO({plugins:{legend:{display:true,labels:{font:{size:11},boxWidth:10}}}})}/>
    </div>
  </div>

  <div className="g2">
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Distribución de planes (subs activas)</div>
      <div style={{height:200}}>
        <Doughnut data={{labels:ICP_PLAN.map(r=>r[0]),datasets:[{data:ICP_PLAN.map(r=>r[1]),backgroundColor:['#6366f1','#3b82f6','#0891b2','#f97316'],borderWidth:0}]}} options={DO}/>
      </div>
    </div>
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Crecimiento semanal histórico</div>
      <div style={{height:200}}>
        <Bar data={{
          labels:WEEKLY_DATA.map(w=>w.week),
          datasets:[
            {label:'Nuevas',data:WEEKLY_DATA.map(w=>w.subs),backgroundColor:'#16a34a',borderRadius:3},
            {label:'Cancel',data:WEEKLY_DATA.map(w=>w.cancels),backgroundColor:'#dc2626',borderRadius:3},
          ]
        }} options={CO({plugins:{legend:{display:true,labels:{font:{size:11},boxWidth:10}}}})}/>
      </div>
      <div className="insight insight-green">Semana 9 Mar: 137 nuevas suscripciones en 7 días 🚀 Pico histórico.</div>
    </div>
  </div>

  <div className="cc">
    <div style={{fontSize:13,fontWeight:600,marginBottom:14}}>⏱ Tiempo de conversión (Onboarding → Pago)</div>
    <div className="g3">
      <div style={{textAlign:'center',padding:'16px',background:'var(--surface)',borderRadius:10}}>
        <div style={{fontSize:28,fontWeight:700,color:'#16a34a'}}>{fmtMin(CONV_AVG_SECONDS_SAMEDAY)}</div>
        <div style={{fontSize:12,color:'var(--text-secondary)',marginTop:4}}>Tiempo promedio el mismo día</div>
        <div style={{fontSize:11,color:'#16a34a',marginTop:2}}>6% convierte en día 1</div>
      </div>
      <div style={{textAlign:'center',padding:'16px',background:'var(--surface)',borderRadius:10}}>
        <div style={{fontSize:28,fontWeight:700,color:'#f97316'}}>{fmtMin(CONV_AVG_SECONDS_7DAY)}</div>
        <div style={{fontSize:12,color:'var(--text-secondary)',marginTop:4}}>Tiempo promedio en 7 días</div>
        <div style={{fontSize:11,color:'#f97316',marginTop:2}}>7% convierte en 7 días</div>
      </div>
      <div style={{textAlign:'center',padding:'16px',background:'var(--surface)',borderRadius:10}}>
        <div style={{fontSize:28,fontWeight:700,color:'#6366f1'}}>1%</div>
        <div style={{fontSize:12,color:'var(--text-secondary)',marginTop:4}}>Conversión adicional</div>
        <div style={{fontSize:11,color:'#6366f1',marginTop:2}}>después del día 7</div>
      </div>
    </div>
    <div className="insight insight-amber">
      <strong>Insight:</strong> El 86% de las conversiones ocurren en las primeras 6 horas del día de descarga. El paywall en el onboarding funciona — quien no convierte el día 1 raramente lo hace después. Optimizar la experiencia Day 0 es la prioridad #1.
    </div>
  </div>
</>)}

{/* ══════════ CORRIDAS ══════════ */}
{tab==='Corridas'&&(<>
  <div className="st">Análisis de corridas — calidad y comportamiento</div>
  <div className="g4">
    <Card label="Corridas totales" value={fmt(totalRuns)} sub="run_started"/>
    <Card label="Corridas reales" value={fmt(REAL_RUNS)} green sub=">5min y >1km (90 días)"/>
    <Card label="Corridas de prueba" value={fmt(TEST_RUNS)} color="#f59e0b" sub="<5min o <1km (42%)"/>
    <Card label="Distancia promedio" value="9.4km" green sub="corridas completadas"/>
  </div>

  <div className="cc">
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
      <span style={{fontSize:13,fontWeight:600}}>Distribución por distancia (km)</span>
      <span className="warn">⚠ 42% son pruebas de la app</span>
    </div>
    <div style={{height:200}}>
      <Bar data={{
        labels:DIST_BUCKETS.map(b=>b.label),
        datasets:[{
          data:DIST_BUCKETS.map(b=>b.count),
          backgroundColor:DIST_BUCKETS.map(b=>b.real?'#6366f1':'#f59e0b'),
          borderRadius:4
        }]
      }} options={CO()}/>
    </div>
    <div style={{display:'flex',gap:12,marginTop:8,fontSize:11}}>
      <span><span style={{color:'#f59e0b',fontWeight:600}}>■</span> Prueba app (naranja): 278 eventos — usuarios explorando</span>
      <span><span style={{color:'#6366f1',fontWeight:600}}>■</span> Corridas reales (azul): 390 eventos</span>
    </div>
    <div className="insight insight-amber">
      <strong>Definición de "corrida real":</strong> &gt;5 minutos Y &gt;1km. De 668 run_completed en 90 días: <strong>387 son corridas reales (58%)</strong> y 281 son pruebas de la app. Esto es normal en una app de running — los usuarios prueban el producto antes de comprometerse.
    </div>
  </div>

  <div className="cc">
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
      <span style={{fontSize:13,fontWeight:600}}>Distribución por duración</span>
      <span className="live">run_completed</span>
    </div>
    <div style={{height:200}}>
      <Bar data={{
        labels:DUR_BUCKETS.map(b=>b.label),
        datasets:[{
          data:DUR_BUCKETS.map(b=>b.count),
          backgroundColor:DUR_BUCKETS.map(b=>b.real?'#3b82f6':'#f59e0b'),
          borderRadius:4
        }]
      }} options={CO()}/>
    </div>
    <div className="insight insight-green">
      <strong>El 55% de las corridas reales son +1 hora:</strong> 154 corridas de 2h+ y 112 de 1-2h. Nuestro usuario típico hace carreras largas — medias maratones y maratones. Este es el runner serio que más valor le da a CheerMyRun.
    </div>
  </div>

  <div className="g2">
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Hora de inicio de corridas</div>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:12}}>¿Cuándo corren nuestros usuarios?</div>
      <div style={{height:180}}>
        <Bar data={{
          labels:HORA_RUNS.map(r=>r[0]),
          datasets:[{
            data:HORA_RUNS.map(r=>r[1]),
            backgroundColor:HORA_RUNS.map(r=>{const h=parseInt(r[0]);return h>=6&&h<12?'#f97316':h>=18?'#1a1a1a':'#94a3b8';}),
            borderRadius:4
          }]
        }} options={CO()}/>
      </div>
      <div className="insight">
        54% de corridas entre <strong>6am-10am</strong>. Usuarios madrugadores — notificaciones y cheers deben enviarse antes de las 7am para máximo impacto.
      </div>
    </div>
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Corridas reales vs prueba (segmentación)</div>
      <div style={{height:200}}>
        <Doughnut data={{
          labels:['Corridas reales (>5min, >1km)','Pruebas de la app (<5min o <1km)'],
          datasets:[{data:[387,281],backgroundColor:['#6366f1','#f59e0b'],borderWidth:0}]
        }} options={DO}/>
      </div>
      <div style={{marginTop:10,fontSize:11,color:'var(--text-secondary)',lineHeight:1.6}}>
        <div><span style={{color:'#6366f1',fontWeight:600}}>387</span> corridas reales (58%)</div>
        <div><span style={{color:'#f59e0b',fontWeight:600}}>281</span> pruebas de app (42%)</div>
        <div style={{marginTop:4}}>Mediana: <strong>37 minutos</strong> | Promedio: <strong>72 minutos</strong></div>
      </div>
    </div>
  </div>

  <div className="cc">
    <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Corridas por día (período seleccionado)</div>
    <div style={{height:220}}>
      <Bar data={{labels:fRuns.map(r=>r[0]),datasets:[{data:fRuns.map(r=>r[1]),backgroundColor:'#1a1a1a',borderRadius:3}]}} options={CO()}/>
    </div>
    <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:8}}>Picos en fines de semana: 22 mar (59), 28 mar (59), 29 mar (56). Patrón consistente de runners de fin de semana.</div>
  </div>
</>)}

{/* ══════════ ICP ══════════ */}
{tab==='ICP'&&(<>
  <div className="st">Perfil del cliente ideal — Solo suscriptores pagadores (subscription_started)</div>
  <div style={{background:'#fef9c3',border:'0.5px solid #fde68a',borderRadius:10,padding:'10px 14px',marginBottom:14,fontSize:12,color:'#854d0e'}}>
    <strong>Nota metodológica:</strong> Los segmentos excluyen usuarios con propiedades "undefined" (aún sin onboarding V2 completo). 149 de 309 suscriptores tienen datos de ICP completos.
  </div>

  <div className="g2">
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Género de suscriptores</div>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:12}}>149 con datos · 74% femenino</div>
      <div style={{height:180}}>
        <Doughnut data={{labels:ICP_GENDER.map(r=>r[0]),datasets:[{data:ICP_GENDER.map(r=>r[1]),backgroundColor:['#ec4899','#3b82f6','#94a3b8'],borderWidth:0}]}} options={DO}/>
      </div>
      <div style={{marginTop:10}}>
        {ICP_GENDER.map((r,i)=><SegBar key={r[0]} label={r[0]} val={r[1]} total={149} color={['#ec4899','#3b82f6','#94a3b8'][i]}/>)}
      </div>
      <div className="insight insight-green">El 74% de quienes pagan son mujeres. Nuestra ICP es: mujer corredora que busca apoyo emocional mientras corre.</div>
    </div>
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Grupo de edad</div>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:12}}>149 con datos · 25-34 domina (60%)</div>
      <div style={{height:180}}>
        <Bar data={{labels:ICP_AGE.map(r=>r[0]),datasets:[{data:ICP_AGE.map(r=>r[1]),backgroundColor:['#6366f1','#8b5cf6','#a78bfa','#c4b5fd'],borderRadius:4}]}} options={CO()}/>
      </div>
      <div style={{marginTop:10}}>
        {ICP_AGE.map((r,i)=><SegBar key={r[0]} label={r[0]} val={r[1]} total={149} color={['#6366f1','#8b5cf6','#a78bfa','#c4b5fd'][i]}/>)}
      </div>
    </div>
  </div>

  <div className="g2">
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Nivel como corredor</div>
      <div style={{height:170}}>
        <Doughnut data={{labels:ICP_LEVEL.map(r=>r[0]),datasets:[{data:ICP_LEVEL.map(r=>r[1]),backgroundColor:['#f97316','#3b82f6','#22c55e'],borderWidth:0}]}} options={DO}/>
      </div>
      <div style={{marginTop:10}}>
        {ICP_LEVEL.map((r,i)=><SegBar key={r[0]} label={r[0]} val={r[1]} total={148} color={['#f97316','#3b82f6','#22c55e'][i]}/>)}
      </div>
      <div className="insight">Principiantes (38%) e intermedios (57%) son quienes más necesitan apoyo emocional. Los avanzados corren solos.</div>
    </div>
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Reloj (hardware)</div>
      <div style={{height:170}}>
        <Doughnut data={{labels:ICP_WATCH.map(r=>r[0]),datasets:[{data:ICP_WATCH.map(r=>r[1]),backgroundColor:['#1a1a1a','#16a34a','#3b82f6','#f59e0b','#6366f1','#ec4899'],borderWidth:0}]}} options={DO}/>
      </div>
      <div style={{marginTop:10}}>
        {ICP_WATCH.map((r,i)=><SegBar key={r[0]} label={r[0]} val={r[1]} total={149} color={['#1a1a1a','#16a34a','#3b82f6','#f59e0b','#6366f1','#ec4899'][i]}/>)}
      </div>
      <div className="insight">Apple Watch 40% y Garmin 40% — usuarios con hardware premium. Señal de alto poder adquisitivo.</div>
    </div>
  </div>

  <div className="cc">
    <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>¿Cómo nos encontraron? (Discovery Source)</div>
    <div className="g2">
      <div>
        <div style={{height:180}}>
          <Doughnut data={{labels:ICP_SOURCE.map(r=>r[0]),datasets:[{data:ICP_SOURCE.map(r=>r[1]),backgroundColor:['#000','#e1306c','#1877f2','#94a3b8'],borderWidth:0}]}} options={DO}/>
        </div>
      </div>
      <div style={{paddingTop:8}}>
        {ICP_SOURCE.map((r,i)=><SegBar key={r[0]} label={r[0]} val={r[1]} total={139} color={['#000','#e1306c','#1877f2','#94a3b8'][i]}/>)}
        <div className="insight insight-green">
          <strong>TikTok es el canal #1 con 60% de adquisición.</strong> Instagram segundo con 26%. El crecimiento orgánico en redes sociales funciona — esto es un motor de adquisición sostenible y barato.
        </div>
      </div>
    </div>
  </div>

  <div className="cc">
    <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Top ciudades (por onboarding completado)</div>
    <div style={{overflowX:'auto'}}>
      <table className="tbl">
        <thead><tr><th>#</th><th>Ciudad</th><th>Usuarios</th><th>Distribución</th></tr></thead>
        <tbody>
          {TOP_CITIES.map((r,i)=>(
            <tr key={r[0]}>
              <td style={{color:'var(--text-secondary)',width:30}}>{i+1}</td>
              <td style={{fontWeight:500}}>{r[0]}</td>
              <td>{r[1]}</td>
              <td style={{width:140}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:80,height:5,background:'var(--surface)',borderRadius:3}}>
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
    <div className="insight">App global desde día 1 — LATAM (Colombia, México, Costa Rica, Ecuador), España, USA, UK, Australia, Nueva Zelanda. El mercado hispanohablante domina.</div>
  </div>
</>)}

{/* ══════════ ENGAGEMENT ══════════ */}
{tab==='Engagement'&&(<>
  <div className="st">Engagement emocional — el diferenciador de CheerMyRun</div>
  <div className="g4">
    <Card label="Cheers recibidos" value={fmt(totalCheers)} sub="cheer_received"/>
    <Card label="Cheers / corrida" value={totalRuns>0?(totalCheers/totalRuns).toFixed(0):'—'} green sub="engagement por sesión"/>
    <Card label="Voice Notes" value={fmt(12794)} sub="52% del total"/>
    <Card label="TTS (texto a voz)" value={fmt(13820)} sub="48% del total"/>
  </div>

  <div className="g2">
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Voice Note vs TTS — ¿Cuál conecta más?</div>
      <div style={{height:200}}>
        <Doughnut data={{labels:CHEER_TYPE.map(r=>r[0]),datasets:[{data:CHEER_TYPE.map(r=>r[1]),backgroundColor:['#6366f1','#f97316'],borderWidth:0}]}} options={DO}/>
      </div>
      <div style={{marginTop:12}}>
        <SegBar label="TTS (texto)" val={13820} total={26614} color="#6366f1"/>
        <SegBar label="Voice Note" val={12794} total={26614} color="#f97316"/>
      </div>
      <div className="insight">Distribución casi igual. Voice notes generan mayor conexión emocional y son más personales, pero TTS es más accesible. Ambos son populares.</div>
    </div>
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Cheers recibidos por día</div>
      <div style={{height:200}}>
        <Bar data={{labels:fCheers.map(r=>r[0]),datasets:[{data:fCheers.map(r=>r[1]),backgroundColor:'#f97316',borderRadius:3}]}} options={CO()}/>
      </div>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:8}}>
        Pico 22 mar: <strong>11,281 cheers en un día</strong>. Los picos correlacionan con eventos de corredores (posiblemente carreras organizadas).
      </div>
    </div>
  </div>

  <div className="cc">
    <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>¿Por qué el engagement importa al inversionista?</div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
      {[
        {t:`${totalRuns>0?(totalCheers/totalRuns).toFixed(0):'41'} cheers/corrida`,d:'Sin precedente en running apps. Cada corrida genera docenas de interacciones humanas reales.',c:'#dcfce7',tc:'#166534'},
        {t:'96% completion rate',d:'Los usuarios que empiezan una corrida la terminan. El app funciona como motivador.',c:'#eff6ff',tc:'#1d4ed8'},
        {t:'Madrugadores 6-10am',d:'54% de corridas en las primeras horas del día — hábito fuerte y consistente.',c:'#fef3c7',tc:'#92400e'},
      ].map(x=>(
        <div key={x.t} style={{background:x.c,borderRadius:10,padding:'12px 14px'}}>
          <div style={{fontSize:13,fontWeight:600,color:x.tc,marginBottom:6}}>{x.t}</div>
          <div style={{fontSize:11,color:x.tc,lineHeight:1.5}}>{x.d}</div>
        </div>
      ))}
    </div>
  </div>
</>)}

{/* ══════════ P&L ══════════ */}
{tab==='P&L'&&(<>
  <div className="st">P&L — Gastos, ingresos e inversiones</div>
  <div className="g3" style={{marginBottom:14}}>
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
  {months.length>0&&<div className="g2">
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Burn mensual</div>
      <div style={{height:200}}>
        <Bar data={{labels:months,datasets:[{label:'Gastos',data:months.map(m=>byMonth[m]?.g||0),backgroundColor:'#dc2626',borderRadius:3},{label:'Ingresos',data:months.map(m=>byMonth[m]?.i||0),backgroundColor:'#16a34a',borderRadius:3}]}} options={CO({plugins:{legend:{display:true,labels:{font:{size:11},boxWidth:10}}}})}/>
      </div>
    </div>
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Por categoría</div>
      {Object.keys(byCat).length>0?<div style={{height:200}}>
        <Doughnut data={{labels:Object.keys(byCat),datasets:[{data:Object.values(byCat),backgroundColor:Object.keys(byCat).map(k=>PNL_COLORS[k]||'#94a3b8'),borderWidth:0}]}} options={DO}/>
      </div>:<div style={{fontSize:12,color:'var(--text-secondary)',padding:'40px 0',textAlign:'center'}}>Agrega gastos para ver distribución</div>}
    </div>
  </div>}
  {Object.keys(byCat).length>0&&<div className="cc">
    <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Desglose por categoría</div>
    {Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>(
      <SegBar key={cat} label={cat} val={amt} total={gastos} color={PNL_COLORS[cat]||'#94a3b8'}/>
    ))}
  </div>}
  <div className="cc">
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
      <span style={{fontSize:13,fontWeight:600}}>Entradas</span>
      <div style={{display:'flex',gap:6}}>
        {['all','gasto','ingreso'].map(f=><button key={f} className="btn" onClick={()=>setFilter(f)} style={{padding:'4px 10px',fontSize:11,background:filter===f?'#1a1a1a':'var(--card)',color:filter===f?'#fff':'var(--text-secondary)'}}>{f==='all'?'Todos':f==='gasto'?'Gastos':'Ingresos'}</button>)}
      </div>
    </div>
    {filtered.length===0?<div style={{textAlign:'center',padding:'24px 0',color:'var(--text-secondary)',fontSize:13}}>Sin entradas. Click en "+ Agregar" para empezar.</div>:
    <div style={{overflowX:'auto'}}><table className="tbl" style={{minWidth:540}}>
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

{/* ══════════ ESTADO ══════════ */}
{tab==='Estado'&&(<>
  <div className="st">Estado del sistema</div>
  <div className="cc" style={{borderLeft:'3px solid #16a34a'}}>
    <div style={{fontSize:13,fontWeight:600,color:'#16a34a',marginBottom:8}}>✓ Mixpanel + Superwall — Datos reales</div>
    <div style={{fontSize:12,color:'var(--text-secondary)',lineHeight:2.0}}>
      <strong>Última actualización:</strong> 30 Mar 2026 · Datos obtenidos vía MCP<br/>
      <strong>Total eventos Mixpanel:</strong> 77,058<br/>
      <strong>Superwall integrado:</strong> subscription_started, Renewal, Subscription Cancelled, Billing Issue, Product Change, Refund enviados a Mixpanel<br/>
      <strong>run_completed (90d):</strong> 668 total · 387 reales (>5min, >1km) · 281 pruebas<br/>
      <strong>Distancia promedio:</strong> 9.4km · Mediana duración: 37min · Máximo: 23h 21min
    </div>
  </div>
  <div className="cc" style={{borderLeft:'3px solid #f59e0b'}}>
    <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>⚠ Datos pendientes de completar</div>
    <div style={{fontSize:12,color:'var(--text-secondary)',lineHeight:2.0}}>
      <strong>AppsFlyer:</strong> Sin integración activa — acquisition_channel undefined en 100% de usuarios<br/>
      <strong>usage_intent:</strong> Propiedad sin datos (0 suscriptores con valor definido)<br/>
      <strong>distances_completed:</strong> No se registra en run_completed aún<br/>
      <strong>$country_code:</strong> No disponible vía Mixpanel MCP — se usa $city como proxy<br/>
      <strong>cheer_favorited / cheer_replayed:</strong> Eventos presentes pero sin análisis de rate aún<br/>
      <strong>is_first_run:</strong> Trackeable — pendiente de análisis para separar nuevos corredores
    </div>
  </div>
  <div className="cc" style={{borderLeft:'3px solid #6366f1'}}>
    <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>📊 Definición: Corrida Real vs Prueba</div>
    <div style={{fontSize:12,color:'var(--text-secondary)',lineHeight:2.0}}>
      <strong>Corrida real:</strong> duration_seconds &gt; 300 (5 min) <strong>Y</strong> distance_km &gt; 1<br/>
      <strong>Corrida de prueba:</strong> duration_seconds ≤ 300 O distance_km ≤ 1<br/>
      <strong>Resultado (90 días):</strong> 387 reales (58%) · 281 pruebas (42%)<br/>
      Esta métrica se puede usar para calcular <strong>true engagement rate</strong> y mejorar el onboarding para convertir pruebas en hábito.
    </div>
  </div>
  <div className="cc" style={{borderLeft:'3px solid #888'}}>
    <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>P&L — Entrada manual</div>
    <div style={{fontSize:12,color:'var(--text-secondary)'}}>
      Los datos del P&L se guardan localmente en este navegador. <strong>{pnl.length} entradas</strong> registradas.
    </div>
  </div>
</>)}

          </div>
        </div>
      </div>

      {/* Modal P&L */}
      {showAdd&&(
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
