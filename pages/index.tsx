import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

// ═══════════════════════════════════════════════════════════════
// DATOS REALES — Mixpanel+Superwall CheerMyRun Prod — 2026-03-30
// ═══════════════════════════════════════════════════════════════

// Weekly history (all weeks since launch)
const WEEKS = [
  { label: 'Sem 23 Feb', subs: 44, cancels: 0, renewals: 0, runs: 53, cheers: 1889 },
  { label: 'Sem 02 Mar', subs: 27, cancels: 0, renewals: 0, runs: 79, cheers: 591 },
  { label: 'Sem 09 Mar', subs: 137, cancels: 38, renewals: 17, runs: 67, cheers: 3723 },
  { label: 'Sem 16 Mar', subs: 57, cancels: 50, renewals: 26, runs: 83, cheers: 152 },
  { label: 'Sem 23 Mar', subs: 64, cancels: 50, renewals: 39, runs: 94, cheers: 4391 },
  { label: 'Sem 30 Mar', subs: 2, cancels: 3, renewals: 1, runs: 56, cheers: 3243 },
];

// Daily series
const DAILY_SUBS: [string,number][] = [["02-28",13],["03-01",2],["03-02",0],["03-03",4],["03-04",4],["03-05",3],["03-06",8],["03-07",5],["03-08",3],["03-09",3],["03-10",1],["03-11",2],["03-12",2],["03-13",55],["03-14",59],["03-15",15],["03-16",8],["03-17",5],["03-18",5],["03-19",6],["03-20",4],["03-21",19],["03-22",10],["03-23",2],["03-24",4],["03-25",3],["03-26",10],["03-27",14],["03-28",16],["03-29",15],["03-30",1]];
const DAILY_CANCELS: [string,number][] = [["02-28",0],["03-01",0],["03-02",0],["03-03",0],["03-04",0],["03-05",0],["03-06",0],["03-07",0],["03-08",0],["03-09",0],["03-10",7],["03-11",3],["03-12",6],["03-13",2],["03-14",6],["03-15",14],["03-16",8],["03-17",6],["03-18",7],["03-19",6],["03-20",9],["03-21",7],["03-22",7],["03-23",6],["03-24",6],["03-25",6],["03-26",3],["03-27",9],["03-28",12],["03-29",8],["03-30",3]];
const DAILY_RENEWALS: [string,number][] = [["02-28",0],["03-01",0],["03-02",0],["03-03",0],["03-04",0],["03-05",0],["03-06",0],["03-07",0],["03-08",0],["03-09",0],["03-10",2],["03-11",3],["03-12",3],["03-13",4],["03-14",5],["03-15",0],["03-16",4],["03-17",2],["03-18",3],["03-19",4],["03-20",3],["03-21",7],["03-22",3],["03-23",4],["03-24",6],["03-25",4],["03-26",5],["03-27",8],["03-28",8],["03-29",4],["03-30",1]];
const DAILY_RUNS: [string,number][] = [["02-27",9],["02-28",44],["03-01",12],["03-02",10],["03-03",12],["03-04",10],["03-05",6],["03-06",15],["03-07",17],["03-08",22],["03-09",5],["03-10",7],["03-11",5],["03-12",6],["03-13",9],["03-14",32],["03-15",60],["03-16",15],["03-17",14],["03-18",13],["03-19",20],["03-20",21],["03-21",56],["03-22",59],["03-23",11],["03-24",10],["03-25",14],["03-26",6],["03-27",14],["03-28",59],["03-29",56]];
const DAILY_CHEERS: [string,number][] = [["02-27",19],["02-28",1870],["03-01",58],["03-02",50],["03-03",22],["03-04",60],["03-05",13],["03-06",33],["03-07",495],["03-08",2167],["03-09",10],["03-10",13],["03-11",98],["03-12",13],["03-13",27],["03-14",332],["03-15",1488],["03-16",14],["03-17",22],["03-18",47],["03-19",30],["03-20",21],["03-21",4058],["03-22",11281],["03-23",6],["03-24",73],["03-25",29],["03-26",4],["03-27",18],["03-28",2566],["03-29",1677]];

// ═══ ICP DATA — Todos los datos del onboarding ═══
// Base suscriptores con V2 completo: 161

// Screen 7 — Género
const ICP_GENDER = [["Femenino",110],["Masculino",37],["Otro",2]] as [string,number][];
// Screen 6 — Edad
const ICP_AGE = [["25-34",89],["18-24",27],["35-44",26],["45-54",7]] as [string,number][];
// Screen 8 — Unidades
const ICP_UNITS = [["Kilómetros",110],["Millas",50]] as [string,number][];
// Screen 9 — Nivel corredor
const ICP_LEVEL_SUBS = [["Intermedio",84],["Principiante",56],["Avanzado",8]] as [string,number][];
const ICP_LEVEL_ALL  = [["Intermedio",960],["Principiante",733],["Avanzado",70]] as [string,number][];
// Screen 10 — Distancias completadas (multi-select, todos usuarios)
const ICP_DISTANCES = [["Media maratón",686],["10K",427],["5K",324],["Maratón",185],["Ninguna aún",141]] as [string,number][];
// Screen 11 — Cómo va a usar la app (usage_intent — NO DISPONIBLE, bug en tracking)
const ICP_USAGE_INTENT_NOTE = "⚠ usage_intent: 100% undefined — prop no se guarda correctamente en onboarding V2. Los pasos SÍ se completan (2,554 veces) pero el valor de la respuesta no se captura.";
// Screen 12 — Lleva teléfono
const ICP_PHONE = [["Siempre",144],["A veces",13]] as [string,number][];
// Screen 13 — Audífonos
const ICP_HEADPHONES = [["Siempre",131],["A veces",23],["Raramente",3]] as [string,number][];
// Screen 14 — Qué escucha
const ICP_LISTEN = [["Música",120],["Mix de todo",31],["Podcasts",4],["Silencio",2]] as [string,number][];
// Screen 15 — Reloj (suscriptores)
const ICP_WATCH_SUBS = [["Apple Watch",60],["Garmin",59],["Fitbit",14],["Samsung",11],["COROS",2],["Smartphone",3]] as [string,number][];
// Screen 15 — Reloj (todos usuarios)
const ICP_WATCH_ALL = [["Garmin",720],["Apple Watch",683],["Fitbit",266],["Samsung",51],["Smartphone",47],["COROS",26]] as [string,number][];
// Screen 16 — Run club
const ICP_CLUB = [["No es miembro",161],["Sí es miembro",0]] as [string,number][];
// Screen 17 — Discovery (suscriptores)
const ICP_SOURCE_SUBS = [["TikTok",84],["Instagram",36],["Amigos",16],["Facebook",3]] as [string,number][];
// Screen 17 — Discovery (todos usuarios)
const ICP_SOURCE_ALL  = [["TikTok",1268],["Instagram",315],["Amigos",114],["Facebook",24],["YouTube",7],["Cheered Someone",8],["Podcast",2]] as [string,number][];
// Planes de suscripción
const ICP_PLAN = [["Mensual",110],["Anual",39],["Anual desc.",3],["Semanal",5]] as [string,number][];
// Hora de corridas (local_hour)
const HORA_RUNS = [["04-06",30],["06-08",134],["08-10",144],["10-12",80],["12-14",32],["14-16",34],["16-18",56],["18+",134]] as [string,number][];
// Tipo cheer
const CHEER_TYPE = [["TTS",13820],["Voice Note",12794]] as [string,number][];
// Corridas por distancia
const DIST_RUNS = [
  {l:"<1km (prueba)",v:278,real:false},{l:"1-3km",v:23,real:true},{l:"3-5km",v:42,real:true},
  {l:"5-10km",v:86,real:true},{l:"10-21km",v:106,real:true},{l:"Media maratón",v:105,real:true},{l:"Maratón+",v:28,real:true},
];
const DUR_RUNS = [
  {l:"<5min (prueba)",v:251,real:false},{l:"5-10min",v:16,real:true},{l:"10-20min",v:17,real:true},
  {l:"20-30min",v:25,real:true},{l:"30-60min",v:93,real:true},{l:"1-2h",v:112,real:true},{l:"2h+",v:154,real:true},
];
const TOP_CITIES = [["San José, CR",28],["Bogotá, CO",39],["Madrid, ES",21],["Iztapalapa, MX",20],["Melbourne, AU",18],["México DF, MX",18],["Sydney, AU",18],["Barranquilla, CO",17],["San Juan, PR",17],["Los Angeles, US",17],["Quito, EC",16],["León, MX",16],["Medellín, CO",16],["New York, US",16],["Birmingham, UK",16]] as [string,number][];

// Revenue
const MRR = Math.round(110*9.99+39*(49.99/12)+5*2.99);

// P&L
const PNL_KEY = 'cmr_pnl_v3';
interface PE{id:string;date:string;name:string;category:string;type:string;amount:number;notes:string;}
const PNL_CATS=['Desarrollo','Influencer','Infraestructura','Herramientas/SaaS','Diseño','Marketing','Inversión Alex','Revenue','Otro'];
const PNL_C:Record<string,string>={'Desarrollo':'#6366f1','Influencer':'#ec4899','Infraestructura':'#3b82f6','Herramientas/SaaS':'#f97316','Diseño':'#8b5cf6','Marketing':'#14b8a6','Inversión Alex':'#22c55e','Revenue':'#16a34a','Otro':'#94a3b8'};
const loadPnl=():PE[]=>{try{return JSON.parse(localStorage.getItem(PNL_KEY)||'[]');}catch{return[];}};
const savePnl=(e:PE[])=>localStorage.setItem(PNL_KEY,JSON.stringify(e));

// ═══ HELPER FUNCTIONS ═══
const fmt=(n:number)=>Math.round(n).toLocaleString('es-MX');
const pct=(a:number,b:number)=>b>0?Math.round(a/b*100):0;
const dpct=(a:number,b:number)=>b>0?Math.round((a-b)/b*100):null;
const sum=(arr:[string,number][])=>arr.reduce((s,r)=>s+r[1],0);
const sliceD=(arr:[string,number][],days:number)=>days>=999?arr:arr.slice(-Math.min(days,arr.length));

// Chart configs
const CO=(extra?:any)=>({responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{bodyFont:{size:11},titleFont:{size:11}}},scales:{x:{grid:{color:'rgba(128,128,128,0.07)'},ticks:{color:'#888',font:{size:10}}},y:{grid:{color:'rgba(128,128,128,0.07)'},ticks:{color:'#888',font:{size:10}},beginAtZero:true}},...extra});
const DO={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,position:'right' as const,labels:{font:{size:11},boxWidth:11,padding:7}}}};
const COLS=['#6366f1','#ec4899','#3b82f6','#f97316','#8b5cf6','#14b8a6','#22c55e','#f59e0b','#dc2626','#0891b2','#84cc16','#94a3b8'];

const TABS=['Overview','Revenue','Corridas','ICP','Comparar','P&L','Estado'];
const PERIODS=[{l:'7d',v:7},{l:'14d',v:14},{l:'30d',v:30},{l:'2 meses',v:60},{l:'Todo',v:999}];

function Card({label,value,delta,sub,green,color}:{label:string,value:any,delta?:number|null,sub?:string,green?:boolean,color?:string}){
  return(<div style={{background:'var(--card)',border:'0.5px solid var(--border)',borderRadius:12,padding:'13px 15px',borderLeft:color?`3px solid ${color}`:undefined}}>
    <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:4}}>{label}</div>
    <div style={{fontSize:21,fontWeight:600,color:green?'#16a34a':'var(--text-primary)',lineHeight:1.1}}>{value}</div>
    {delta!=null&&<div style={{fontSize:11,marginTop:3,color:delta>=0?'#16a34a':'#dc2626'}}>{delta>=0?'+':''}{delta}% vs ant.</div>}
    {sub&&<div style={{fontSize:10,marginTop:3,color:'var(--text-secondary)'}}>{sub}</div>}
  </div>);
}
function SBar({label,val,total,color,dim}:{label:string,val:number,total:number,color:string,dim?:boolean}){
  const p=pct(val,total);
  return(<div style={{display:'flex',alignItems:'center',gap:7,marginBottom:6,opacity:dim?.4:1}}>
    <span style={{fontSize:12,color:'var(--text-secondary)',width:128,flexShrink:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</span>
    <div style={{flex:1,height:5,background:'var(--surface)',borderRadius:3,overflow:'hidden'}}><div style={{width:`${p}%`,height:'100%',background:color,borderRadius:3}}/></div>
    <span style={{fontSize:11,color:'var(--text-secondary)',width:26,textAlign:'right'}}>{p}%</span>
    <span style={{fontSize:10,color:'#999',width:32,textAlign:'right'}}>{fmt(val)}</span>
  </div>);
}
function IBox({title,children,note}:{title:string,children:React.ReactNode,note?:string}){
  return(<div className="cc">
    <div style={{fontSize:13,fontWeight:600,marginBottom:note?4:10}}>{title}</div>
    {note&&<div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:10}}>{note}</div>}
    {children}
  </div>);
}
function Insight({text,type='blue'}:{text:string,type?:'blue'|'green'|'amber'|'red'}){
  const c={blue:['#eff6ff','#1d4ed8'],green:['#f0fdf4','#166534'],amber:['#fef9c3','#854d0e'],red:['#fef2f2','#991b1b']}[type];
  return <div style={{background:c[0],borderRadius:8,padding:'9px 12px',fontSize:11,color:c[1],marginTop:10,lineHeight:1.5}} dangerouslySetInnerHTML={{__html:text}}/>;
}

export default function Dashboard(){
  const [tab,setTab]=useState('Overview');
  const [period,setPeriod]=useState(30);
  const [cmpA,setCmpA]=useState(0); // compare: week index A
  const [cmpB,setCmpB]=useState(1); // compare: week index B
  const [cmpMode,setCmpMode]=useState<'week'|'month'>('week');
  const [pnl,setPnl]=useState<PE[]>([]);
  const [showAdd,setShowAdd]=useState(false);
  const [editId,setEditId]=useState<string|null>(null);
  const [filter,setFilter]=useState('all');
  const [form,setForm]=useState({date:new Date().toISOString().split('T')[0],name:'',category:'Desarrollo',type:'Gasto',amount:'',notes:''});
  const [icpView,setIcpView]=useState<'subs'|'all'>('subs');
  useEffect(()=>{setPnl(loadPnl());},[]);

  const fSubs=sliceD(DAILY_SUBS,period), fCanc=sliceD(DAILY_CANCELS,period);
  const fRenew=sliceD(DAILY_RENEWALS,period), fRuns=sliceD(DAILY_RUNS,period);
  const fCheers=sliceD(DAILY_CHEERS,period);
  const tSubs=sum(fSubs),tCanc=sum(fCanc),tRenew=sum(fRenew),tRuns=sum(fRuns),tCheers=sum(fCheers);
  const netSubs=tSubs-tCanc, churnRate=pct(tCanc,tSubs+tRenew);

  // P&L calcs
  const gastos=pnl.filter(e=>e.type==='Gasto').reduce((s,e)=>s+e.amount,0);
  const ingresos=pnl.filter(e=>e.type==='Ingreso').reduce((s,e)=>s+e.amount,0);
  const neto=ingresos-gastos;
  const byCat=pnl.filter(e=>e.type==='Gasto').reduce((a:Record<string,number>,e)=>{a[e.category]=(a[e.category]||0)+e.amount;return a;},{});
  const byMonth=pnl.reduce((a:Record<string,{g:number,i:number}>,e)=>{const m=e.date.substring(0,7);if(!a[m])a[m]={g:0,i:0};if(e.type==='Gasto')a[m].g+=e.amount;else a[m].i+=e.amount;return a;},{});
  const months=Object.keys(byMonth).sort();
  const filtered=filter==='all'?pnl:filter==='gasto'?pnl.filter(e=>e.type==='Gasto'):pnl.filter(e=>e.type==='Ingreso');

  function saveEntry(){
    if(!form.name||!form.amount)return;
    const entry:PE={id:editId||Date.now().toString(),date:form.date,name:form.name,category:form.category,type:form.type,amount:Number(form.amount),notes:form.notes};
    const updated=editId?pnl.map(e=>e.id===editId?entry:e):[...pnl,entry];
    const sorted=updated.sort((a,b)=>b.date.localeCompare(a.date));
    setPnl(sorted);savePnl(sorted);setShowAdd(false);setEditId(null);
    setForm({date:new Date().toISOString().split('T')[0],name:'',category:'Desarrollo',type:'Gasto',amount:'',notes:''});
  }
  function del(id:string){const u=pnl.filter(e=>e.id!==id);setPnl(u);savePnl(u);}
  function startEdit(e:PE){setForm({date:e.date,name:e.name,category:e.category,type:e.type,amount:String(e.amount),notes:e.notes});setEditId(e.id);setShowAdd(true);}

  // Comparison data
  const wA=WEEKS[cmpA], wB=WEEKS[cmpB];

  return(<>
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
      .g2{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:12px}
      .cc{background:var(--card);border:0.5px solid var(--border);border-radius:12px;padding:15px;margin-bottom:12px}
      .cc:last-child{margin-bottom:0}
      .st{font-size:10px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px}
      .live{font-size:9px;padding:2px 7px;border-radius:20px;background:#dcfce7;color:#166534;font-weight:600}
      .warn{font-size:9px;padding:2px 7px;border-radius:20px;background:#fef9c3;color:#854d0e;font-weight:600}
      select,input{font-size:12px;padding:5px 9px;border-radius:7px;border:0.5px solid var(--border);background:var(--card);color:var(--text-primary);outline:none}
      .btn{font-size:11px;padding:5px 12px;border-radius:7px;border:0.5px solid var(--border);background:var(--card);color:var(--text-primary);cursor:pointer;font-family:inherit}
      .btn.active,.btn-dark{background:#1a1a1a;color:#fff;border-color:#1a1a1a;font-weight:500}
      .btn-red{background:#fee2e2;color:#991b1b;border:0.5px solid #fca5a5}
      .btn-sm{font-size:10px;padding:3px 8px;border-radius:6px}
      .tbl{width:100%;font-size:12px;border-collapse:collapse}
      .tbl th{color:var(--text-secondary);font-weight:400;text-align:left;padding:0 8px 7px 0;border-bottom:0.5px solid var(--border)}
      .tbl td{padding:6px 8px 6px 0;border-bottom:0.5px solid var(--border);vertical-align:top}
      .tbl tr:last-child td{border-bottom:none}
      .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:200}
      .modal{background:var(--card);border-radius:14px;padding:22px;width:470px;max-width:92vw;border:0.5px solid var(--border)}
      .frow{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
      .flabel{font-size:11px;color:var(--text-secondary);margin-bottom:3px}
      .sb-link{display:block;width:100%;text-align:left;padding:6px 10px;border-radius:8px;font-size:13px;cursor:pointer;background:transparent;border:none;color:var(--text-secondary);font-family:inherit}
      .sb-link.active{background:var(--surface);color:var(--text-primary);font-weight:500}
      .cmp-card{background:var(--card);border:0.5px solid var(--border);border-radius:12px;padding:14px;flex:1}
      @media(max-width:900px){.g4{grid-template-columns:repeat(2,1fr)}.g2{grid-template-columns:1fr}}
    `}</style>

    <div style={{display:'flex',minHeight:'100vh'}}>
      {/* ── Sidebar ── */}
      <div style={{width:208,background:'var(--sb)',borderRight:'0.5px solid var(--border)',display:'flex',flexDirection:'column',padding:'0 0 16px',flexShrink:0}}>
        <div style={{padding:'16px 15px 13px',borderBottom:'0.5px solid var(--border)',marginBottom:6}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:30,height:30,borderRadius:8,background:'linear-gradient(135deg,#f97316,#dc2626)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🏃</div>
            <div><div style={{fontSize:14,fontWeight:600}}>Cheer My Run</div><div style={{fontSize:10,color:'var(--text-secondary)'}}>Investor Dashboard</div></div>
          </div>
        </div>
        <div style={{padding:'2px 6px',flex:1}}>
          <div style={{fontSize:9,color:'var(--text-secondary)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.08em',padding:'8px 10px 3px'}}>Vistas</div>
          {TABS.map(t=><button key={t} onClick={()=>setTab(t)} className={`sb-link${tab===t?' active':''}`}>{t}</button>)}
        </div>
        <div style={{padding:'10px 15px 0',borderTop:'0.5px solid var(--border)'}}>
          <div style={{fontSize:9,color:'var(--text-secondary)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>Fuentes</div>
          {[{n:'Mixpanel',c:'#16a34a',d:'Datos reales ✓'},{n:'Superwall',c:'#16a34a',d:'vía Mixpanel ✓'},{n:'AppsFlyer',c:'#888',d:'Pendiente'}].map(s=>(
            <div key={s.n} style={{marginBottom:6}}>
              <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}><div style={{width:5,height:5,borderRadius:'50%',background:s.c}}/>{s.n}</div>
              <div style={{fontSize:9,color:'#999',marginLeft:11}}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>
        {/* Header */}
        <div style={{background:'var(--card)',borderBottom:'0.5px solid var(--border)',padding:'11px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,gap:8,flexWrap:'wrap'}}>
          <div>
            <span style={{fontSize:15,fontWeight:600}}>{tab}</span>
            <span style={{fontSize:11,color:'var(--text-secondary)',marginLeft:10}}>CheerMyRun Prod · 77,058 eventos</span>
          </div>
          <div style={{display:'flex',gap:5,alignItems:'center',flexWrap:'wrap'}}>
            {tab!=='ICP'&&tab!=='Estado'&&tab!=='Comparar'&&PERIODS.map(p=>(
              <button key={p.v} className={`btn btn-sm${period===p.v?' active':''}`} onClick={()=>setPeriod(p.v)}>{p.l}</button>
            ))}
            <span className="live">DATOS REALES</span>
            {tab==='ICP'&&(
              <div style={{display:'flex',gap:4}}>
                <button className={`btn btn-sm${icpView==='subs'?' active':''}`} onClick={()=>setIcpView('subs')}>Solo suscriptores</button>
                <button className={`btn btn-sm${icpView==='all'?' active':''}`} onClick={()=>setIcpView('all')}>Todos los usuarios</button>
              </div>
            )}
            {tab==='P&L'&&<button className="btn btn-sm btn-dark" onClick={()=>{setShowAdd(true);setEditId(null);}}>+ Agregar</button>}
          </div>
        </div>

        <div style={{flex:1,padding:18,overflowY:'auto'}}>

{/* ═══════════════ OVERVIEW ═══════════════ */}
{tab==='Overview'&&(<>
  <div className="st">Métricas clave</div>
  <div className="g4">
    <Card label="Corridas" value={fmt(tRuns)} sub="run_started"/>
    <Card label="Suscripciones nuevas" value={fmt(tSubs)} sub="Superwall → Mixpanel"/>
    <Card label="Cancelaciones" value={fmt(tCanc)} color="#dc2626" sub={`Churn: ${churnRate}%`}/>
    <Card label="Cheers recibidos" value={fmt(tCheers)} green sub={tRuns>0?(tCheers/tRuns).toFixed(0)+' por corrida':undefined}/>
  </div>
  <div className="g4">
    <Card label="Neto subs" value={(netSubs>=0?'+':'')+fmt(netSubs)} color={netSubs>=0?'#16a34a':'#dc2626'} sub="nuevas − canceladas"/>
    <Card label="Renovaciones" value={fmt(tRenew)} green sub="retención probada"/>
    <Card label="MRR estimado" value={`$${fmt(MRR)}`} sub="mar 2026"/>
    <Card label="Corridas reales" value="58%" green sub=">5min y >1km"/>
  </div>
  <div className="g2">
    <div className="cc">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <span style={{fontSize:13,fontWeight:600}}>Subs · Cancelaciones · Renovaciones</span><span className="live">SUPERWALL</span>
      </div>
      <div style={{height:195}}>
        <Bar data={{labels:fSubs.map(r=>r[0]),datasets:[{label:'Nuevas',data:fSubs.map(r=>r[1]),backgroundColor:'#16a34a',borderRadius:2},{label:'Cancelaciones',data:fCanc.map(r=>r[1]),backgroundColor:'#dc2626',borderRadius:2},{label:'Renovaciones',data:fRenew.map(r=>r[1]),backgroundColor:'#6366f1',borderRadius:2}]}} options={CO({plugins:{legend:{display:true,labels:{font:{size:10},boxWidth:9}}}})}/>
      </div>
      <Insight text="<strong>Insight:</strong> Cancelaciones empiezan 7 días después del pico de suscripciones — son las pruebas gratuitas/weekly que no convierten a largo plazo."/>
    </div>
    <div className="cc">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <span style={{fontSize:13,fontWeight:600}}>Corridas por día</span><span className="live">MIXPANEL</span>
      </div>
      <div style={{height:195}}>
        <Bar data={{labels:fRuns.map(r=>r[0]),datasets:[{data:fRuns.map(r=>r[1]),backgroundColor:'#1a1a1a',borderRadius:2}]}} options={CO()}/>
      </div>
    </div>
  </div>
</>)}

{/* ═══════════════ REVENUE ═══════════════ */}
{tab==='Revenue'&&(<>
  <div className="st">Revenue — Superwall vía Mixpanel</div>
  <div className="g4">
    <Card label="MRR estimado" value={`$${fmt(MRR)}`} big green/>
    <Card label="Subs nuevas" value={fmt(tSubs)} delta={dpct(tSubs,44)} sub="vs sem. 23 feb"/>
    <Card label="Cancelaciones" value={fmt(tCanc)} color="#dc2626" sub={`${churnRate}% churn`}/>
    <Card label="Renovaciones" value={fmt(tRenew)} green/>
  </div>
  <div className="g3">
    <Card label="Plan mensual (~$9.99)" value="110" sub={`~$${fmt(110*9.99)}/mo`} color="#6366f1"/>
    <Card label="Plan anual (~$49.99/yr)" value="39" sub={`~$${fmt(39*49.99/12)}/mo`} color="#3b82f6"/>
    <Card label="Plan semanal (~$2.99)" value="5" sub="~$15/mo" color="#94a3b8"/>
  </div>
  <div className="cc">
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
      <span style={{fontSize:13,fontWeight:600}}>Subs / Cancelaciones / Renovaciones diarias</span><span className="live">SUPERWALL</span>
    </div>
    <div style={{height:210}}>
      <Bar data={{labels:fSubs.map(r=>r[0]),datasets:[{label:'Nuevas',data:fSubs.map(r=>r[1]),backgroundColor:'#16a34a',borderRadius:2},{label:'Cancelaciones',data:fCanc.map(r=>r[1]),backgroundColor:'#dc2626',borderRadius:2},{label:'Renovaciones',data:fRenew.map(r=>r[1]),backgroundColor:'#6366f1',borderRadius:2}]}} options={CO({plugins:{legend:{display:true,labels:{font:{size:10},boxWidth:9}}}})}/>
    </div>
  </div>
  <div className="g2">
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>Distribución de planes</div>
      <div style={{height:190}}><Doughnut data={{labels:ICP_PLAN.map(r=>r[0]),datasets:[{data:ICP_PLAN.map(r=>r[1]),backgroundColor:['#6366f1','#3b82f6','#0891b2','#f97316'],borderWidth:0}]}} options={DO}/></div>
    </div>
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>⏱ Tiempo de conversión</div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {[
          {t:'~11 minutos',d:'Tiempo promedio el mismo día (6% convierte día 1)',c:'#16a34a'},
          {t:'~5.9 horas',d:'Tiempo promedio en 7 días (7% convierte en 7d)',c:'#f97316'},
          {t:'86%',d:'De las conversiones ocurren en las primeras 6 horas del día de descarga',c:'#6366f1'},
        ].map(x=>(
          <div key={x.t} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'9px',background:'var(--surface)',borderRadius:8}}>
            <div style={{fontSize:18,fontWeight:700,color:x.c,width:70,flexShrink:0}}>{x.t}</div>
            <div style={{fontSize:11,color:'var(--text-secondary)',lineHeight:1.4,paddingTop:2}}>{x.d}</div>
          </div>
        ))}
      </div>
      <Insight text="<strong>Insight:</strong> El paywall funciona en el momento. Quien no paga el día 1 raramente paga después. Optimizar Day 0 es la prioridad de monetización." type="amber"/>
    </div>
  </div>
  <div className="cc">
    <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Funnel de conversión</div>
    <div style={{display:'flex',flexDirection:'column',gap:7}}>
      {[{l:'Onboarding Completado',v:4520,c:'#1a1a1a'},{l:'Paywall Presentado',v:6015,c:'#374151'},{l:'Subscription Started',v:309,c:'#16a34a',p:'5%'},{l:'Run Started',v:649,c:'#2563eb'},{l:'Run Completed',v:621,c:'#7c3aed',p:'96%'}].map(s=>{
        const w=Math.max(Math.round(s.v/6015*100),6);
        return(<div key={s.l} style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:`${w}%`,background:s.c,borderRadius:5,padding:'6px 10px',minWidth:55}}>
            <span style={{fontSize:13,fontWeight:600,color:'#fff'}}>{fmt(s.v)}</span>
          </div>
          <span style={{fontSize:11,color:'var(--text-secondary)'}}>{s.l}</span>
          {(s as any).p&&<span style={{fontSize:10,color:'#888',background:'var(--surface)',padding:'2px 5px',borderRadius:5}}>{(s as any).p}</span>}
        </div>);
      })}
    </div>
  </div>
</>)}

{/* ═══════════════ CORRIDAS ═══════════════ */}
{tab==='Corridas'&&(<>
  <div className="st">Comportamiento de corridas</div>
  <div className="g4">
    <Card label="Total corridas" value={fmt(tRuns)} sub="run_started"/>
    <Card label="Corridas reales" value="387" green sub=">5min y >1km (90d)"/>
    <Card label="Corridas de prueba" value="281" color="#f59e0b" sub="42% — explorando app"/>
    <Card label="Distancia promedio" value="9.4km" green sub="corridas completadas"/>
  </div>
  <div className="g2">
    <div className="cc">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <span style={{fontSize:13,fontWeight:600}}>Distribución por distancia</span>
        <span className="warn">42% pruebas</span>
      </div>
      <div style={{height:190}}>
        <Bar data={{labels:DIST_RUNS.map(b=>b.l),datasets:[{data:DIST_RUNS.map(b=>b.v),backgroundColor:DIST_RUNS.map(b=>b.real?'#6366f1':'#f59e0b'),borderRadius:3}]}} options={CO()}/>
      </div>
      <div style={{display:'flex',gap:10,marginTop:6,fontSize:10}}>
        <span><span style={{color:'#f59e0b',fontWeight:600}}>■</span> Prueba (naranja)</span>
        <span><span style={{color:'#6366f1',fontWeight:600}}>■</span> Corrida real (azul)</span>
      </div>
      <Insight text="<strong>Definición:</strong> Corrida real = >5 min Y >1km. 387 de 668 son corridas reales (58%). El 34% son medias maratones o maratones completas." type="blue"/>
    </div>
    <div className="cc">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <span style={{fontSize:13,fontWeight:600}}>Distribución por duración</span>
        <span className="live">run_completed</span>
      </div>
      <div style={{height:190}}>
        <Bar data={{labels:DUR_RUNS.map(b=>b.l),datasets:[{data:DUR_RUNS.map(b=>b.v),backgroundColor:DUR_RUNS.map(b=>b.real?'#3b82f6':'#f59e0b'),borderRadius:3}]}} options={CO()}/>
      </div>
      <Insight text="<strong>55% de corridas reales son +1 hora.</strong> Usuario típico: runner serio de media maratón o maratón. Mediana: 37min, máximo: 23h." type="green"/>
    </div>
  </div>
  <div className="g2">
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Hora de inicio (local_hour)</div>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:10}}>¿A qué hora corren nuestros usuarios?</div>
      <div style={{height:180}}>
        <Bar data={{labels:HORA_RUNS.map(r=>r[0]),datasets:[{data:HORA_RUNS.map(r=>r[1]),backgroundColor:HORA_RUNS.map(r=>{const h=parseInt(r[0]);return h>=6&&h<12?'#f97316':h>=18?'#1a1a1a':'#94a3b8';}),borderRadius:3}]}} options={CO()}/>
      </div>
      <Insight text="<strong>54% de corridas entre 6-10am.</strong> Madrugadores. Notificaciones y cheers deben enviarse antes de las 7am." type="amber"/>
    </div>
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>Corridas reales vs prueba</div>
      <div style={{height:180}}>
        <Doughnut data={{labels:['Corridas reales (>5min, >1km)','Pruebas (<5min o <1km)'],datasets:[{data:[387,281],backgroundColor:['#6366f1','#f59e0b'],borderWidth:0}]}} options={DO}/>
      </div>
      <div style={{marginTop:8,fontSize:11,color:'var(--text-secondary)',lineHeight:1.7}}>
        <span style={{color:'#6366f1',fontWeight:600}}>387</span> corridas reales · <span style={{color:'#f59e0b',fontWeight:600}}>281</span> pruebas de app<br/>
        Mediana: <strong>37min</strong> · Promedio: <strong>72min</strong> · Máx: <strong>23h 21min</strong>
      </div>
    </div>
  </div>
  <div className="cc">
    <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>Corridas por día</div>
    <div style={{height:200}}><Bar data={{labels:fRuns.map(r=>r[0]),datasets:[{data:fRuns.map(r=>r[1]),backgroundColor:'#1a1a1a',borderRadius:2}]}} options={CO()}/></div>
  </div>
</>)}

{/* ═══════════════ ICP ═══════════════ */}
{tab==='ICP'&&(<>
  <div className="st">
    Perfil del cliente — {icpView==='subs'?'Solo suscriptores pagadores (161 con datos completos)':'Todos los usuarios (onboarding completado)'}
  </div>
  <div style={{background:'var(--surface)',borderRadius:10,padding:'10px 14px',marginBottom:14,fontSize:11,color:'var(--text-secondary)',lineHeight:1.6}}>
    Onboarding V2: <strong>2,554–2,634 usuarios completaron cada pantalla</strong>. Las propiedades de usuario se guardan en Mixpanel People con <code>mixpanel.people.set()</code>. Los 161 suscriptores con datos completos son los que usaron la versión V2.
  </div>

  {/* Screens 7 + 6: Género y Edad */}
  <div className="g2">
    <IBox title="Pantalla 7 — Género" note={icpView==='subs'?'161 suscriptores con dato':'Solo suscriptores tienen este dato'}>
      <div style={{height:155}}><Doughnut data={{labels:ICP_GENDER.map(r=>r[0]),datasets:[{data:ICP_GENDER.map(r=>r[1]),backgroundColor:['#ec4899','#3b82f6','#94a3b8'],borderWidth:0}]}} options={DO}/></div>
      <div style={{marginTop:8}}>{ICP_GENDER.map((r,i)=><SBar key={r[0]} label={r[0]} val={r[1]} total={149} color={['#ec4899','#3b82f6','#94a3b8'][i]}/>)}</div>
      <Insight text="<strong>74% femenino.</strong> La ICP es mujer corredora que busca apoyo emocional mientras corre." type="green"/>
    </IBox>
    <IBox title="Pantalla 6 — Edad" note="161 suscriptores con dato">
      <div style={{height:155}}><Bar data={{labels:ICP_AGE.map(r=>r[0]),datasets:[{data:ICP_AGE.map(r=>r[1]),backgroundColor:['#6366f1','#8b5cf6','#a78bfa','#c4b5fd'],borderRadius:3}]}} options={CO()}/></div>
      <div style={{marginTop:8}}>{ICP_AGE.map((r,i)=><SBar key={r[0]} label={r[0]} val={r[1]} total={149} color={COLS[i]}/>)}</div>
      <Insight text="<strong>60% tiene 25-34 años.</strong> Millennials activos, con dinero para gastar en experiencias." type="blue"/>
    </IBox>
  </div>

  {/* Screen 8: Unidades */}
  <div className="g2">
    <IBox title="Pantalla 8 — Kilómetros o millas" note="161 suscriptores con dato">
      <div style={{height:145}}><Doughnut data={{labels:ICP_UNITS.map(r=>r[0]),datasets:[{data:ICP_UNITS.map(r=>r[1]),backgroundColor:['#6366f1','#f97316'],borderWidth:0}]}} options={DO}/></div>
      <div style={{marginTop:8}}>{ICP_UNITS.map((r,i)=><SBar key={r[0]} label={r[0]} val={r[1]} total={160} color={['#6366f1','#f97316'][i]}/>)}</div>
      <Insight text="<strong>69% km, 31% millas.</strong> Mayoría LATAM/Europa. USA es mercado secundario aún." type="blue"/>
    </IBox>
    <IBox title="Pantalla 9 — Nivel como corredor" note={icpView==='subs'?'Suscriptores':'Todos los usuarios onboarding'}>
      <div style={{height:145}}><Doughnut data={{labels:(icpView==='subs'?ICP_LEVEL_SUBS:ICP_LEVEL_ALL).map(r=>r[0]),datasets:[{data:(icpView==='subs'?ICP_LEVEL_SUBS:ICP_LEVEL_ALL).map(r=>r[1]),backgroundColor:['#f97316','#3b82f6','#22c55e'],borderWidth:0}]}} options={DO}/></div>
      <div style={{marginTop:8}}>{(icpView==='subs'?ICP_LEVEL_SUBS:ICP_LEVEL_ALL).map((r,i)=><SBar key={r[0]} label={r[0]} val={r[1]} total={(icpView==='subs'?ICP_LEVEL_SUBS:ICP_LEVEL_ALL).reduce((s,x)=>s+x[1],0)} color={['#f97316','#3b82f6','#22c55e'][i]}/>)}</div>
      <Insight text="Principiantes + intermedios = 95%. El runner avanzado no necesita apoyo emocional." type="blue"/>
    </IBox>
  </div>

  {/* Screen 10: Distancias completadas */}
  <IBox title="Pantalla 10 — ¿Qué distancias ya has conquistado? (multi-select)" note="1,763 usuarios con dato (todos los usuarios)">
    <div className="g2">
      <div style={{height:170}}><Bar data={{labels:ICP_DISTANCES.map(r=>r[0]),datasets:[{data:ICP_DISTANCES.map(r=>r[1]),backgroundColor:COLS,borderRadius:3}]}} options={CO()}/></div>
      <div style={{paddingTop:4}}>
        {ICP_DISTANCES.map((r,i)=><SBar key={r[0]} label={r[0]} val={r[1]} total={686} color={COLS[i]}/>)}
        <Insight text="<strong>Media maratón domina (686).</strong> Nuestro usuario ya corre distancias serias. No es novato experimentando." type="green"/>
      </div>
    </div>
  </IBox>

  {/* Screen 11: Usage intent */}
  <div className="cc" style={{borderLeft:'3px solid #f59e0b'}}>
    <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>Pantalla 11 — ¿Cómo planeas usar CheerMyRun?</div>
    <div style={{background:'#fef9c3',borderRadius:8,padding:'10px 12px',fontSize:12,color:'#854d0e',lineHeight:1.6}}>
      ⚠ <strong>usage_intent: Sin datos disponibles.</strong> La pantalla sí se completa (2,554 veces confirmado en onboarding_step_completed), pero la propiedad no se guarda correctamente en el perfil del usuario. Las opciones son: "Specific race", "Tough training days", "As my safety/support tool", "All of the above". <strong>Fix pendiente en el app.</strong>
    </div>
  </div>

  {/* Screens 12+13+14: Comportamiento */}
  <div className="g3">
    <IBox title="Pantalla 12 — ¿Llevas teléfono al correr?" note="161 suscriptores">
      <div style={{height:130}}><Doughnut data={{labels:ICP_PHONE.map(r=>r[0]),datasets:[{data:ICP_PHONE.map(r=>r[1]),backgroundColor:['#16a34a','#f59e0b'],borderWidth:0}]}} options={DO}/></div>
      <div style={{marginTop:6}}>{ICP_PHONE.map((r,i)=><SBar key={r[0]} label={r[0]} val={r[1]} total={157} color={['#16a34a','#f59e0b'][i]}/>)}</div>
      <Insight text="<strong>92% siempre.</strong> Producto diseñado exactamente para ellos." type="green"/>
    </IBox>
    <IBox title="Pantalla 13 — ¿Corres con audífonos?" note="161 suscriptores">
      <div style={{height:130}}><Doughnut data={{labels:ICP_HEADPHONES.map(r=>r[0]),datasets:[{data:ICP_HEADPHONES.map(r=>r[1]),backgroundColor:['#6366f1','#f97316','#94a3b8'],borderWidth:0}]}} options={DO}/></div>
      <div style={{marginTop:6}}>{ICP_HEADPHONES.map((r,i)=><SBar key={r[0]} label={r[0]} val={r[1]} total={157} color={['#6366f1','#f97316','#94a3b8'][i]}/>)}</div>
      <Insight text="<strong>83% siempre.</strong> Voice Notes son naturales para ellos." type="blue"/>
    </IBox>
    <IBox title="Pantalla 14 — ¿Qué escuchas al correr?" note="161 suscriptores">
      <div style={{height:130}}><Doughnut data={{labels:ICP_LISTEN.map(r=>r[0]),datasets:[{data:ICP_LISTEN.map(r=>r[1]),backgroundColor:['#f97316','#6366f1','#3b82f6','#94a3b8'],borderWidth:0}]}} options={DO}/></div>
      <div style={{marginTop:6}}>{ICP_LISTEN.map((r,i)=><SBar key={r[0]} label={r[0]} val={r[1]} total={157} color={['#f97316','#6366f1','#3b82f6','#94a3b8'][i]}/>)}</div>
    </IBox>
  </div>

  {/* Screen 15: Reloj */}
  <IBox title="Pantalla 15 — ¿Qué reloj usas?" note={icpView==='subs'?'161 suscriptores':'1,793 usuarios con dato'}>
    <div className="g2">
      <div style={{height:180}}><Doughnut data={{labels:(icpView==='subs'?ICP_WATCH_SUBS:ICP_WATCH_ALL).map(r=>r[0]),datasets:[{data:(icpView==='subs'?ICP_WATCH_SUBS:ICP_WATCH_ALL).map(r=>r[1]),backgroundColor:['#1a1a1a','#16a34a','#3b82f6','#f59e0b','#6366f1','#ec4899'],borderWidth:0}]}} options={DO}/></div>
      <div style={{paddingTop:4}}>
        {(icpView==='subs'?ICP_WATCH_SUBS:ICP_WATCH_ALL).map((r,i)=><SBar key={r[0]} label={r[0]} val={r[1]} total={(icpView==='subs'?ICP_WATCH_SUBS:ICP_WATCH_ALL).reduce((s,x)=>s+x[1],0)} color={['#1a1a1a','#16a34a','#3b82f6','#f59e0b','#6366f1','#ec4899'][i]}/>)}
        <Insight text={icpView==='subs'?"<strong>Apple Watch 40% + Garmin 40%</strong> — hardware premium. Alto poder adquisitivo.":"<strong>Garmin ligeramente arriba (40%) vs Apple Watch (38%)</strong> en toda la base. Runner serio con equipo de calidad."} type="green"/>
      </div>
    </div>
  </IBox>

  {/* Screen 16: Run club */}
  <div className="cc" style={{borderLeft:'3px solid #94a3b8'}}>
    <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>Pantalla 16 — ¿Eres parte de un run club?</div>
    <div style={{fontSize:12,color:'var(--text-secondary)',lineHeight:1.8}}>
      De los 161 suscriptores con datos: <strong>0 son miembros de un run club (0%)</strong>. Todos respondieron "No". Esto confirma que nuestro usuario es el corredor solitario que necesita apoyo — no tiene una comunidad física de corredores que lo acompañe.
    </div>
    <Insight text="Oportunidad: el run club virtual que CheerMyRun puede ser para este perfil de corredor solo." type="blue"/>
  </div>

  {/* Screen 17: Discovery */}
  <IBox title="Pantalla 17 — ¿Dónde nos encontraste?" note={icpView==='subs'?'139 suscriptores con dato':'1,738 usuarios con dato'}>
    <div className="g2">
      <div style={{height:190}}><Doughnut data={{labels:(icpView==='subs'?ICP_SOURCE_SUBS:ICP_SOURCE_ALL).map(r=>r[0]),datasets:[{data:(icpView==='subs'?ICP_SOURCE_SUBS:ICP_SOURCE_ALL).map(r=>r[1]),backgroundColor:['#000','#e1306c','#1877f2','#94a3b8','#ff0000','#f97316','#6366f1'],borderWidth:0}]}} options={DO}/></div>
      <div style={{paddingTop:4}}>
        {(icpView==='subs'?ICP_SOURCE_SUBS:ICP_SOURCE_ALL).map((r,i)=><SBar key={r[0]} label={r[0]} val={r[1]} total={(icpView==='subs'?ICP_SOURCE_SUBS:ICP_SOURCE_ALL).reduce((s,x)=>s+x[1],0)} color={['#000','#e1306c','#1877f2','#94a3b8','#ff0000','#f97316','#6366f1'][i]}/>)}
        <Insight text={icpView==='subs'?"<strong>TikTok 60%</strong> de suscriptores que pagan. Canal #1 claro.":"<strong>TikTok 73%</strong> de toda la base. El crecimiento orgánico en TikTok es el motor principal."} type="green"/>
      </div>
    </div>
  </IBox>

  {/* Voice Note vs TTS + Top Cities */}
  <div className="g2">
    <IBox title="Tipo de cheer recibido (26,614 cheers)">
      <div style={{height:160}}><Doughnut data={{labels:CHEER_TYPE.map(r=>r[0]),datasets:[{data:CHEER_TYPE.map(r=>r[1]),backgroundColor:['#6366f1','#f97316'],borderWidth:0}]}} options={DO}/></div>
      <div style={{marginTop:8}}>
        <SBar label="TTS (texto a voz)" val={13820} total={26614} color="#6366f1"/>
        <SBar label="Voice Note" val={12794} total={26614} color="#f97316"/>
      </div>
      <Insight text="52%/48% — casi empate. Voice Notes = más personales. TTS = más accesible." type="blue"/>
    </IBox>
    <IBox title="Top ciudades" note="Por onboarding completado">
      <div style={{overflowY:'auto',maxHeight:240}}>
        <table className="tbl">
          <thead><tr><th>#</th><th>Ciudad</th><th>Usuarios</th></tr></thead>
          <tbody>{TOP_CITIES.map((r,i)=><tr key={r[0]}><td style={{color:'var(--text-secondary)',width:24}}>{i+1}</td><td style={{fontWeight:500}}>{r[0]}</td><td>{r[1]}</td></tr>)}</tbody>
        </table>
      </div>
      <Insight text="LATAM domina. España, USA, UK, Australia y NZ también presentes — app global desde día 1." type="green"/>
    </IBox>
  </div>
</>)}

{/* ═══════════════ COMPARAR ═══════════════ */}
{tab==='Comparar'&&(<>
  <div className="st">Comparación de períodos</div>

  {/* Mode selector */}
  <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center'}}>
    <span style={{fontSize:12,color:'var(--text-secondary)'}}>Comparar por:</span>
    <button className={`btn${cmpMode==='week'?' active':''}`} onClick={()=>setCmpMode('week')}>Semanas</button>
    <button className={`btn${cmpMode==='month'?' active':''}`} onClick={()=>setCmpMode('month')}>Meses</button>
  </div>

  {cmpMode==='week'&&(<>
    <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
      <div style={{flex:1,minWidth:200}}>
        <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:4}}>Período A</div>
        <select value={cmpA} onChange={e=>setCmpA(Number(e.target.value))} style={{width:'100%'}}>
          {WEEKS.map((w,i)=><option key={i} value={i}>{w.label}</option>)}
        </select>
      </div>
      <div style={{flex:1,minWidth:200}}>
        <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:4}}>Período B</div>
        <select value={cmpB} onChange={e=>setCmpB(Number(e.target.value))} style={{width:'100%'}}>
          {WEEKS.map((w,i)=><option key={i} value={i}>{w.label}</option>)}
        </select>
      </div>
    </div>

    {/* Comparison cards */}
    <div className="g4">
      {[
        {label:'Subs nuevas',a:wA.subs,b:wB.subs},
        {label:'Cancelaciones',a:wA.cancels,b:wB.cancels},
        {label:'Renovaciones',a:wA.renewals,b:wB.renewals},
        {label:'Corridas',a:wA.runs,b:wB.runs},
      ].map(m=>{
        const d=dpct(m.b,m.a);
        return(<div key={m.label} style={{background:'var(--card)',border:'0.5px solid var(--border)',borderRadius:12,padding:'13px 14px'}}>
          <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:5}}>{m.label}</div>
          <div style={{display:'flex',gap:10,alignItems:'flex-end'}}>
            <div><div style={{fontSize:10,color:'#888',marginBottom:2}}>{wA.label}</div><div style={{fontSize:20,fontWeight:600}}>{fmt(m.a)}</div></div>
            <div style={{fontSize:18,color:'var(--text-secondary)',paddingBottom:2}}>→</div>
            <div><div style={{fontSize:10,color:'#888',marginBottom:2}}>{wB.label}</div><div style={{fontSize:20,fontWeight:600,color:m.label==='Cancelaciones'?(d&&d>0?'#dc2626':'#16a34a'):(d&&d>0?'#16a34a':'#dc2626')}}>{fmt(m.b)}</div></div>
          </div>
          {d!=null&&<div style={{fontSize:11,marginTop:4,color:m.label==='Cancelaciones'?(d>0?'#dc2626':'#16a34a'):(d>0?'#16a34a':'#dc2626')}}>{d>=0?'+':''}{d}%</div>}
        </div>);
      })}
    </div>

    {/* Visual comparison bars */}
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Comparación visual — {wA.label} vs {wB.label}</div>
      <div style={{height:220}}>
        <Bar data={{
          labels:['Subs nuevas','Cancelaciones','Renovaciones','Corridas','Cheers (/100)'],
          datasets:[
            {label:wA.label,data:[wA.subs,wA.cancels,wA.renewals,wA.runs,Math.round(wA.cheers/100)],backgroundColor:'#6366f1',borderRadius:4},
            {label:wB.label,data:[wB.subs,wB.cancels,wB.renewals,wB.runs,Math.round(wB.cheers/100)],backgroundColor:'#f97316',borderRadius:4},
          ]
        }} options={CO({plugins:{legend:{display:true,labels:{font:{size:11},boxWidth:10}}}})}/>
      </div>
    </div>

    {/* All weeks table */}
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Histórico por semana — desde el lanzamiento</div>
      <div style={{overflowX:'auto'}}>
        <table className="tbl">
          <thead><tr><th>Semana</th><th style={{textAlign:'right'}}>Subs nuevas</th><th style={{textAlign:'right'}}>Cancelaciones</th><th style={{textAlign:'right'}}>Renovaciones</th><th style={{textAlign:'right'}}>Neto</th><th style={{textAlign:'right'}}>Corridas</th><th style={{textAlign:'right'}}>Cheers</th></tr></thead>
          <tbody>
            {WEEKS.map((w,i)=>{
              const net=w.subs-w.cancels;
              const isA=i===cmpA,isB=i===cmpB;
              return(<tr key={i} style={{background:isA?'#eff6ff':isB?'#fef3c7':undefined}}>
                <td style={{fontWeight:500}}>{w.label}{isA&&<span style={{fontSize:9,marginLeft:4,background:'#6366f1',color:'#fff',padding:'1px 5px',borderRadius:3}}>A</span>}{isB&&<span style={{fontSize:9,marginLeft:4,background:'#f97316',color:'#fff',padding:'1px 5px',borderRadius:3}}>B</span>}</td>
                <td style={{textAlign:'right',color:'#16a34a',fontWeight:500}}>{w.subs}</td>
                <td style={{textAlign:'right',color:'#dc2626'}}>{w.cancels}</td>
                <td style={{textAlign:'right',color:'#6366f1'}}>{w.renewals}</td>
                <td style={{textAlign:'right',color:net>=0?'#16a34a':'#dc2626',fontWeight:600}}>{net>=0?'+':''}{net}</td>
                <td style={{textAlign:'right'}}>{w.runs}</td>
                <td style={{textAlign:'right'}}>{fmt(w.cheers)}</td>
              </tr>);
            })}
            <tr style={{borderTop:'1.5px solid var(--border)',fontWeight:600}}>
              <td>TOTAL</td>
              <td style={{textAlign:'right',color:'#16a34a'}}>{WEEKS.reduce((s,w)=>s+w.subs,0)}</td>
              <td style={{textAlign:'right',color:'#dc2626'}}>{WEEKS.reduce((s,w)=>s+w.cancels,0)}</td>
              <td style={{textAlign:'right',color:'#6366f1'}}>{WEEKS.reduce((s,w)=>s+w.renewals,0)}</td>
              <td style={{textAlign:'right',color:'#16a34a'}}>{WEEKS.reduce((s,w)=>s+w.subs-w.cancels,0)}</td>
              <td style={{textAlign:'right'}}>{WEEKS.reduce((s,w)=>s+w.runs,0)}</td>
              <td style={{textAlign:'right'}}>{fmt(WEEKS.reduce((s,w)=>s+w.cheers,0))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    {/* Growth chart */}
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Crecimiento acumulado de suscripciones</div>
      <div style={{height:200}}>
        <Bar data={{
          labels:WEEKS.map(w=>w.label),
          datasets:[
            {label:'Nuevas',data:WEEKS.map(w=>w.subs),backgroundColor:'#16a34a',borderRadius:3},
            {label:'Cancelaciones',data:WEEKS.map(w=>w.cancels),backgroundColor:'#dc2626',borderRadius:3},
            {label:'Renovaciones',data:WEEKS.map(w=>w.renewals),backgroundColor:'#6366f1',borderRadius:3},
          ]
        }} options={CO({plugins:{legend:{display:true,labels:{font:{size:10},boxWidth:9}}}})}/>
      </div>
      <Insight text="<strong>Semana 09 Mar: pico histórico de 137 nuevas suscripciones.</strong> Las cancelaciones llegaron 7 días después (semana 09 Mar = primeras pruebas gratuitas expirando). El neto acumulado es positivo: más subs nuevas que cancelaciones." type="green"/>
    </div>
  </>)}

  {cmpMode==='month'&&(<>
    <div style={{display:'flex',gap:10,marginBottom:16}}>
      {[['Febrero 2026','Feb',42,0,0,132,1889],['Marzo 2026','Mar',290,141,80,520,14000]].map(([name,short,subs,cancels,renewals,runs,cheers])=>(
        <div className="cmp-card" key={String(name)}>
          <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>{String(name)}</div>
          <div className="g2">
            {[{l:'Subs nuevas',v:subs,c:'#16a34a'},{l:'Cancelaciones',v:cancels,c:'#dc2626'},{l:'Renovaciones',v:renewals,c:'#6366f1'},{l:'Corridas',v:runs,c:'#1a1a1a'}].map(m=>(
              <div key={m.l} style={{padding:'8px',background:'var(--surface)',borderRadius:8}}>
                <div style={{fontSize:10,color:'var(--text-secondary)',marginBottom:2}}>{m.l}</div>
                <div style={{fontSize:18,fontWeight:700,color:m.c}}>{fmt(Number(m.v))}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:8,padding:'8px',background:'var(--surface)',borderRadius:8}}>
            <div style={{fontSize:10,color:'var(--text-secondary)',marginBottom:2}}>Neto subs</div>
            <div style={{fontSize:18,fontWeight:700,color:Number(subs)-Number(cancels)>=0?'#16a34a':'#dc2626'}}>
              {Number(subs)-Number(cancels)>=0?'+':''}{Number(subs)-Number(cancels)}
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Febrero vs Marzo — comparación visual</div>
      <div style={{height:220}}>
        <Bar data={{
          labels:['Subs nuevas','Cancelaciones','Renovaciones','Corridas'],
          datasets:[
            {label:'Febrero 2026',data:[42,0,0,132],backgroundColor:'#6366f1',borderRadius:4},
            {label:'Marzo 2026',data:[290,141,80,520],backgroundColor:'#f97316',borderRadius:4},
          ]
        }} options={CO({plugins:{legend:{display:true,labels:{font:{size:11},boxWidth:10}}}})}/>
      </div>
      <Insight text="<strong>+590% suscripciones MoM</strong> (42 → 290). Primer mes de cancelaciones en marzo (producto llegando a la madurez). 80 renovaciones confirman retención real." type="green"/>
    </div>
  </>)}
</>)}

{/* ═══════════════ P&L ═══════════════ */}
{tab==='P&L'&&(<>
  <div className="st">P&L — Gastos, ingresos e inversiones</div>
  <div className="g3" style={{marginBottom:14}}>
    <div className="cc" style={{borderLeft:'3px solid #dc2626',marginBottom:0}}>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:4}}>Total Gastos</div>
      <div style={{fontSize:26,fontWeight:700,color:'#dc2626'}}>${gastos.toLocaleString()}</div>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:4}}>{pnl.filter(e=>e.type==='Gasto').length} entradas</div>
    </div>
    <div className="cc" style={{borderLeft:'3px solid #16a34a',marginBottom:0}}>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:4}}>Total Ingresos</div>
      <div style={{fontSize:26,fontWeight:700,color:'#16a34a'}}>${ingresos.toLocaleString()}</div>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:4}}>{pnl.filter(e=>e.type==='Ingreso').length} entradas</div>
    </div>
    <div className="cc" style={{borderLeft:`3px solid ${neto>=0?'#16a34a':'#dc2626'}`,marginBottom:0}}>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:4}}>Flujo Neto</div>
      <div style={{fontSize:26,fontWeight:700,color:neto>=0?'#16a34a':'#dc2626'}}>{neto>=0?'+':''}${neto.toLocaleString()}</div>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:4}}>Ingresos − Gastos</div>
    </div>
  </div>
  {months.length>0&&<div className="g2">
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>Burn mensual</div>
      <div style={{height:200}}><Bar data={{labels:months,datasets:[{label:'Gastos',data:months.map(m=>byMonth[m]?.g||0),backgroundColor:'#dc2626',borderRadius:3},{label:'Ingresos',data:months.map(m=>byMonth[m]?.i||0),backgroundColor:'#16a34a',borderRadius:3}]}} options={CO({plugins:{legend:{display:true,labels:{font:{size:11},boxWidth:9}}}})}/></div>
    </div>
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>Por categoría</div>
      {Object.keys(byCat).length>0?<div style={{height:200}}><Doughnut data={{labels:Object.keys(byCat),datasets:[{data:Object.values(byCat),backgroundColor:Object.keys(byCat).map(k=>PNL_C[k]||'#94a3b8'),borderWidth:0}]}} options={DO}/></div>:<div style={{fontSize:12,color:'var(--text-secondary)',padding:'40px 0',textAlign:'center'}}>Agrega gastos para ver distribución</div>}
    </div>
  </div>}
  {Object.keys(byCat).length>0&&<div className="cc">
    <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>Desglose por categoría</div>
    {Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=><SBar key={cat} label={cat} val={amt} total={gastos} color={PNL_C[cat]||'#94a3b8'}/>)}
  </div>}
  <div className="cc">
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
      <span style={{fontSize:13,fontWeight:600}}>Entradas</span>
      <div style={{display:'flex',gap:5}}>
        {['all','gasto','ingreso'].map(f=><button key={f} className={`btn btn-sm${filter===f?' active':''}`} onClick={()=>setFilter(f)}>{f==='all'?'Todos':f==='gasto'?'Gastos':'Ingresos'}</button>)}
      </div>
    </div>
    {filtered.length===0?<div style={{textAlign:'center',padding:'24px 0',color:'var(--text-secondary)',fontSize:13}}>Sin entradas. Click en "+ Agregar" para empezar.</div>:
    <div style={{overflowX:'auto'}}><table className="tbl" style={{minWidth:520}}>
      <thead><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th>Tipo</th><th style={{textAlign:'right'}}>Monto</th><th></th></tr></thead>
      <tbody>{filtered.map(e=>(
        <tr key={e.id}>
          <td style={{color:'var(--text-secondary)',whiteSpace:'nowrap',fontSize:11}}>{e.date}</td>
          <td><span style={{fontWeight:500}}>{e.name}</span>{e.notes&&<div style={{fontSize:10,color:'var(--text-secondary)'}}>{e.notes}</div>}</td>
          <td><span style={{fontSize:10,padding:'2px 6px',borderRadius:20,background:(PNL_C[e.category]||'#94a3b8')+'22',color:PNL_C[e.category]||'#666'}}>{e.category}</span></td>
          <td><span style={{fontSize:10,padding:'2px 6px',borderRadius:20,background:e.type==='Gasto'?'#fee2e2':'#dcfce7',color:e.type==='Gasto'?'#991b1b':'#166534'}}>{e.type}</span></td>
          <td style={{textAlign:'right',fontWeight:600,color:e.type==='Gasto'?'#dc2626':'#16a34a',whiteSpace:'nowrap'}}>{e.type==='Gasto'?'-':'+'}${e.amount.toLocaleString()}</td>
          <td style={{whiteSpace:'nowrap'}}>
            <button className="btn btn-sm" onClick={()=>startEdit(e)} style={{marginRight:3}}>Editar</button>
            <button className="btn btn-sm btn-red" onClick={()=>del(e.id)}>Borrar</button>
          </td>
        </tr>
      ))}</tbody>
    </table></div>}
  </div>
</>)}

{/* ═══════════════ ESTADO ═══════════════ */}
{tab==='Estado'&&(<>
  <div className="st">Estado del sistema</div>
  <div className="cc" style={{borderLeft:'3px solid #16a34a'}}>
    <div style={{fontSize:13,fontWeight:600,color:'#16a34a',marginBottom:8}}>✓ Mixpanel — CheerMyRun Prod (3993852)</div>
    <div style={{fontSize:12,color:'var(--text-secondary)',lineHeight:2.0}}>
      <strong>Última actualización:</strong> 30 Mar 2026 · Datos obtenidos vía MCP<br/>
      <strong>Total eventos:</strong> 77,058 desde el 22 feb 2026<br/>
      <strong>Superwall integrado:</strong> subscription_started, Renewal, Subscription Cancelled, Billing Issue, Product Change, Refund<br/>
      <strong>run_completed (90d):</strong> 668 total · 387 reales (&gt;5min, &gt;1km) · 281 pruebas
    </div>
  </div>
  <div className="cc" style={{borderLeft:'3px solid #f59e0b'}}>
    <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>⚠ Propiedades con datos limitados</div>
    <div style={{fontSize:12,color:'var(--text-secondary)',lineHeight:2.0}}>
      <strong>usage_intent:</strong> 0% de datos — no se está guardando correctamente en el onboarding V2<br/>
      <strong>run_club_member:</strong> 100% false — no se registraron miembros de club aún<br/>
      <strong>distances_completed:</strong> Solo 34% de usuarios con dato (propiedad funcionando pero tardía)<br/>
      <strong>AppsFlyer:</strong> Sin integración — acquisition_channel undefined en todos los usuarios<br/>
      <strong>$country_code:</strong> No disponible vía MCP — se usa $city como proxy
    </div>
  </div>
  <div className="cc" style={{borderLeft:'3px solid #6366f1'}}>
    <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>📊 Definiciones</div>
    <div style={{fontSize:12,color:'var(--text-secondary)',lineHeight:2.0}}>
      <strong>Corrida real:</strong> duration_seconds &gt; 300 Y distance_km &gt; 1<br/>
      <strong>MRR estimado:</strong> 110 × $9.99 + 39 × ($49.99/12) + 5 × $2.99 = ${fmt(MRR)}/mes<br/>
      <strong>Churn rate:</strong> Cancelaciones / (Nuevas + Renovaciones) en el período<br/>
      <strong>Tiempo de conversión:</strong> Calculado via funnel onboarding_completed → subscription_started
    </div>
  </div>
</>)}

        </div>
      </div>
    </div>

    {/* ═══ Modal P&L ═══ */}
    {showAdd&&(<div className="modal-bg" onClick={()=>setShowAdd(false)}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:15,fontWeight:600,marginBottom:18}}>{editId?'Editar':'Nueva entrada P&L'}</div>
        <div className="frow">
          <div><div className="flabel">Fecha</div><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={{width:'100%'}}/></div>
          <div><div className="flabel">Tipo</div><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={{width:'100%'}}><option>Gasto</option><option>Ingreso</option></select></div>
        </div>
        <div style={{marginBottom:10}}><div className="flabel">Concepto</div><input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{width:'100%'}}/></div>
        <div className="frow">
          <div><div className="flabel">Categoría</div><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={{width:'100%'}}>{PNL_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
          <div><div className="flabel">Monto (USD)</div><input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} style={{width:'100%'}}/></div>
        </div>
        <div style={{marginBottom:18}}><div className="flabel">Notas</div><input type="text" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{width:'100%'}}/></div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button className="btn" onClick={()=>setShowAdd(false)}>Cancelar</button>
          <button className="btn btn-dark" onClick={saveEntry}>{editId?'Guardar':'Agregar'}</button>
        </div>
      </div>
    </div>)}
  </>);
}
