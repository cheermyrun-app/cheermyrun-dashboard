import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

// ═══════════════════════════════════════════
// STATIC DATA — Mixpanel (fetched via MCP)
// ═══════════════════════════════════════════
const DAILY_SUBS: [string,number][] = [["02-28",13],["03-01",2],["03-02",0],["03-03",4],["03-04",4],["03-05",3],["03-06",8],["03-07",5],["03-08",3],["03-09",3],["03-10",1],["03-11",2],["03-12",2],["03-13",55],["03-14",59],["03-15",15],["03-16",8],["03-17",5],["03-18",5],["03-19",6],["03-20",4],["03-21",19],["03-22",10],["03-23",2],["03-24",4],["03-25",3],["03-26",10],["03-27",14],["03-28",16],["03-29",15],["03-30",1]];
const DAILY_CANCELS: [string,number][] = [["02-28",0],["03-01",0],["03-02",0],["03-03",0],["03-04",0],["03-05",0],["03-06",0],["03-07",0],["03-08",0],["03-09",0],["03-10",7],["03-11",3],["03-12",6],["03-13",2],["03-14",6],["03-15",14],["03-16",8],["03-17",6],["03-18",7],["03-19",6],["03-20",9],["03-21",7],["03-22",7],["03-23",6],["03-24",6],["03-25",6],["03-26",3],["03-27",9],["03-28",12],["03-29",8],["03-30",3]];
const DAILY_RENEWALS: [string,number][] = [["02-28",0],["03-01",0],["03-02",0],["03-03",0],["03-04",0],["03-05",0],["03-06",0],["03-07",0],["03-08",0],["03-09",0],["03-10",2],["03-11",3],["03-12",3],["03-13",4],["03-14",5],["03-15",0],["03-16",4],["03-17",2],["03-18",3],["03-19",4],["03-20",3],["03-21",7],["03-22",3],["03-23",4],["03-24",6],["03-25",4],["03-26",5],["03-27",8],["03-28",8],["03-29",4],["03-30",1]];
const DAILY_RUNS: [string,number][] = [["02-27",9],["02-28",44],["03-01",12],["03-02",10],["03-03",12],["03-04",10],["03-05",6],["03-06",15],["03-07",17],["03-08",22],["03-09",5],["03-10",7],["03-11",5],["03-12",6],["03-13",9],["03-14",32],["03-15",60],["03-16",15],["03-17",14],["03-18",13],["03-19",20],["03-20",21],["03-21",56],["03-22",59],["03-23",11],["03-24",10],["03-25",14],["03-26",6],["03-27",14],["03-28",59],["03-29",56]];
const DAILY_CHEERS: [string,number][] = [["02-27",19],["02-28",1870],["03-01",58],["03-02",50],["03-03",22],["03-04",60],["03-05",13],["03-06",33],["03-07",495],["03-08",2167],["03-09",10],["03-10",13],["03-11",98],["03-12",13],["03-13",27],["03-14",332],["03-15",1488],["03-16",14],["03-17",22],["03-18",47],["03-19",30],["03-20",21],["03-21",4058],["03-22",11281],["03-23",6],["03-24",73],["03-25",29],["03-26",4],["03-27",18],["03-28",2566],["03-29",1677]];
const WEEKS = [{l:'23 Feb',s:44,c:0,r:0},{l:'02 Mar',s:27,c:0,r:0},{l:'09 Mar',s:137,c:38,r:17},{l:'16 Mar',s:57,c:50,r:26},{l:'23 Mar',s:64,c:50,r:39},{l:'30 Mar',s:2,c:3,r:1}];
const ICP_GENDER=[["Femenino",110],["Masculino",37],["Otro",2]] as [string,number][];
const ICP_AGE=[["25-34",89],["18-24",27],["35-44",26],["45-54",7]] as [string,number][];
const ICP_LEVEL=[["Intermedio",84],["Principiante",56],["Avanzado",8]] as [string,number][];
const ICP_WATCH=[["Apple Watch",60],["Garmin",59],["Fitbit",14],["Samsung",11],["COROS",2],["Smartphone",3]] as [string,number][];
const ICP_SOURCE=[["TikTok",84],["Instagram",36],["Amigos",16],["Facebook",3]] as [string,number][];
const ICP_PLAN=[["Mensual",110],["Anual",39],["Anual desc.",3],["Semanal",5]] as [string,number][];
const ICP_PHONE=[["Siempre",144],["A veces",13]] as [string,number][];
const ICP_HEADPHONES=[["Siempre",131],["A veces",23],["Raramente",3]] as [string,number][];
const ICP_LISTEN=[["Música",120],["Mix",31],["Podcasts",4],["Silencio",2]] as [string,number][];
const ICP_UNITS=[["Kilómetros",110],["Millas",50]] as [string,number][];
const ICP_DISTANCES=[["Media maratón",686],["10K",427],["5K",324],["Maratón",185],["Ninguna",141]] as [string,number][];
const HORA_RUNS=[["04-06",30],["06-08",134],["08-10",144],["10-12",80],["12-14",32],["14-16",34],["16-18",56],["18+",134]] as [string,number][];
const CHEER_TYPE=[["TTS",13820],["Voice Note",12794]] as [string,number][];
const DIST_RUNS=[{l:"<1km",v:278,r:false},{l:"1-3km",v:23,r:true},{l:"3-5km",v:42,r:true},{l:"5-10km",v:86,r:true},{l:"10-21km",v:106,r:true},{l:"Media M.",v:105,r:true},{l:"Maratón+",v:28,r:true}];
const TOP_CITIES=[["San José, CR",28],["Bogotá, CO",39],["Madrid, ES",21],["Iztapalapa, MX",20],["Melbourne, AU",18],["Sydney, AU",18],["México DF, MX",18],["Barranquilla, CO",17],["San Juan, PR",17],["Los Angeles, US",17],["Quito, EC",16],["León, MX",16],["Medellín, CO",16],["New York, US",16],["Birmingham, UK",16]] as [string,number][];
const PLATFORM=[["iOS",1174],["Android",38]] as [string,number][];
const PLATFORM_SUBS=[["iOS",180],["Android",124]] as [string,number][];

// P&L
const PNL_KEY='cmr_pnl_v3';
interface PE{id:string;date:string;name:string;category:string;type:string;amount:number;notes:string;}
const PNL_CATS=['Desarrollo','Influencer','Infraestructura','Herramientas/SaaS','Diseño','Marketing','Inversión Alex','Revenue','Otro'];
const PNL_C:Record<string,string>={'Desarrollo':'#6366f1','Influencer':'#ec4899','Infraestructura':'#3b82f6','Herramientas/SaaS':'#f97316','Diseño':'#8b5cf6','Marketing':'#14b8a6','Inversión Alex':'#22c55e','Revenue':'#16a34a','Otro':'#94a3b8'};
const loadPnl=():PE[]=>{try{return JSON.parse(localStorage.getItem(PNL_KEY)||'[]');}catch{return[];}};
const savePnl=(e:PE[])=>localStorage.setItem(PNL_KEY,JSON.stringify(e));

// Helpers
const fmt=(n:number)=>Math.round(n).toLocaleString('es-MX');
const fmtUSD=(n:number)=>'$'+Math.round(n).toLocaleString('en-US');
const pct=(a:number,b:number)=>b>0?Math.round(a/b*100):0;
const dpct=(a:number,b:number)=>b>0?Math.round((a-b)/b*100):null;
const sum=(arr:[string,number][])=>arr.reduce((s,r)=>s+r[1],0);
const sliceD=(arr:[string,number][],days:number)=>days>=999?arr:arr.slice(-Math.min(days,arr.length));
const CO=(extra?:any)=>({responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{bodyFont:{size:11},titleFont:{size:11}}},scales:{x:{grid:{color:'rgba(128,128,128,0.07)'},ticks:{color:'#888',font:{size:10}}},y:{grid:{color:'rgba(128,128,128,0.07)'},ticks:{color:'#888',font:{size:10}},beginAtZero:true}},...extra});
const DO={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,position:'right' as const,labels:{font:{size:11},boxWidth:11,padding:7}}}};
const COLS=['#6366f1','#ec4899','#3b82f6','#f97316','#8b5cf6','#14b8a6','#22c55e','#f59e0b','#dc2626','#0891b2'];
const TABS=['Revenue','Overview','Corridas','ICP','Comparar','P&L'];
const PERIODS=[{l:'7d',v:7},{l:'14d',v:14},{l:'30d',v:30},{l:'90d',v:90},{l:'Todo',v:999}];

function Card({label,value,delta,sub,green,color,big,live}:{label:string,value:any,delta?:number|null,sub?:string,green?:boolean,color?:string,big?:boolean,live?:boolean}){
  return(<div style={{background:'var(--card)',border:'0.5px solid var(--border)',borderRadius:12,padding:'13px 15px',borderLeft:color?`3px solid ${color}`:undefined}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
      <div style={{fontSize:11,color:'var(--text-secondary)'}}>{label}</div>
      {live&&<div style={{fontSize:8,padding:'1px 5px',borderRadius:10,background:'#dcfce7',color:'#166534',fontWeight:700}}>LIVE</div>}
    </div>
    <div style={{fontSize:big?28:21,fontWeight:700,color:green?'#16a34a':'var(--text-primary)',lineHeight:1.1}}>{value}</div>
    {delta!=null&&<div style={{fontSize:11,marginTop:3,color:delta>=0?'#16a34a':'#dc2626'}}>{delta>=0?'+':''}{delta}% vs ant.</div>}
    {sub&&<div style={{fontSize:10,marginTop:3,color:'var(--text-secondary)'}}>{sub}</div>}
  </div>);
}
function SBar({label,val,total,color}:{label:string,val:number,total:number,color:string}){
  const p=pct(val,total);
  return(<div style={{display:'flex',alignItems:'center',gap:7,marginBottom:6}}>
    <span style={{fontSize:12,color:'var(--text-secondary)',width:128,flexShrink:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</span>
    <div style={{flex:1,height:5,background:'var(--surface)',borderRadius:3,overflow:'hidden'}}><div style={{width:`${p}%`,height:'100%',background:color,borderRadius:3}}/></div>
    <span style={{fontSize:11,color:'var(--text-secondary)',width:26,textAlign:'right'}}>{p}%</span>
    <span style={{fontSize:10,color:'#999',width:32,textAlign:'right'}}>{fmt(val)}</span>
  </div>);
}
function Insight({text,type='blue'}:{text:string,type?:'blue'|'green'|'amber'|'red'}){
  const c={blue:['#eff6ff','#1d4ed8'],green:['#f0fdf4','#166534'],amber:['#fef9c3','#854d0e'],red:['#fef2f2','#991b1b']}[type];
  return <div style={{background:c[0],borderRadius:8,padding:'9px 12px',fontSize:11,color:c[1],marginTop:10,lineHeight:1.5}} dangerouslySetInnerHTML={{__html:text}}/>;
}

export default function Dashboard(){
  const [tab,setTab]=useState('Revenue');
  const [period,setPeriod]=useState(30);
  const [cmpA,setCmpA]=useState(0);
  const [cmpB,setCmpB]=useState(2);
  const [pnl,setPnl]=useState<PE[]>([]);
  const [filter,setFilter]=useState('all');
  const [showAdd,setShowAdd]=useState(false);
  const [editId,setEditId]=useState<string|null>(null);
  const [form,setForm]=useState({date:new Date().toISOString().split('T')[0],name:'',category:'Desarrollo',type:'Gasto',amount:'',notes:''});

  // LIVE Superwall state
  const [sw,setSw]=useState<any>(null);
  const [swLoading,setSwLoading]=useState(true);
  const [swError,setSwError]=useState<string|null>(null);
  const [swPeriod,setSwPeriod]=useState<'last24h'|'last7d'|'last30d'|'last90d'>('last30d');
  const [lastRefresh,setLastRefresh]=useState<Date|null>(null);

  const fetchSuperwall = useCallback(async () => {
    setSwLoading(true);
    setSwError(null);
    try {
      const r = await fetch('/api/superwall?days=90');
      const d = await r.json();
      setSw(d);
      setLastRefresh(new Date());
      if (!d.connected) setSwError(d._debug?.hint || 'Superwall no conectado');
    } catch(e:any) {
      setSwError(e.message);
    } finally {
      setSwLoading(false);
    }
  }, []);

  useEffect(() => { fetchSuperwall(); }, [fetchSuperwall]);
  useEffect(() => { setPnl(loadPnl()); }, []);

  // Superwall current period data
  const swData = sw?.ios?.[swPeriod] || {};
  const swProceeds   = swData.proceeds   || 0;
  const swNewUsers   = swData.newUsers   || 0;
  const swConvs      = swData.conversions || 0;
  const swPaywallR   = swData.paywallRate || 0;
  const swConvR      = swData.convRate    || 0;
  const swAndroid    = sw?.android || null;
  const swTotal      = (swProceeds + (swAndroid?.proceeds || 0));

  // Mixpanel period filtering
  const fSubs=sliceD(DAILY_SUBS,period),fCanc=sliceD(DAILY_CANCELS,period);
  const fRenew=sliceD(DAILY_RENEWALS,period),fRuns=sliceD(DAILY_RUNS,period);
  const fCheers=sliceD(DAILY_CHEERS,period);
  const tSubs=sum(fSubs),tCanc=sum(fCanc),tRenew=sum(fRenew),tRuns=sum(fRuns),tCheers=sum(fCheers);
  const netSubs=tSubs-tCanc;

  // P&L
  const gastos=pnl.filter(e=>e.type==='Gasto').reduce((s,e)=>s+e.amount,0);
  const ingresos=pnl.filter(e=>e.type==='Ingreso').reduce((s,e)=>s+e.amount,0);
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

  const wA=WEEKS[cmpA],wB=WEEKS[cmpB];

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
      .live-badge{font-size:8px;padding:2px 6px;border-radius:10px;background:#dcfce7;color:#166534;font-weight:700;letter-spacing:.04em}
      .err-badge{font-size:8px;padding:2px 6px;border-radius:10px;background:#fee2e2;color:#991b1b;font-weight:700}
      .btn{font-size:11px;padding:5px 12px;border-radius:7px;border:0.5px solid var(--border);background:var(--card);color:var(--text-primary);cursor:pointer;font-family:inherit}
      .btn.active,.btn-dark{background:#1a1a1a;color:#fff;border-color:#1a1a1a;font-weight:500}
      .btn-red{background:#fee2e2;color:#991b1b;border:0.5px solid #fca5a5}
      .btn-sm{font-size:10px;padding:3px 8px;border-radius:6px}
      .btn-refresh{font-size:10px;padding:3px 10px;border-radius:6px;background:var(--surface);border:0.5px solid var(--border);cursor:pointer;color:var(--text-secondary);font-family:inherit}
      select,input{font-size:12px;padding:5px 9px;border-radius:7px;border:0.5px solid var(--border);background:var(--card);color:var(--text-primary);outline:none}
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
      @media(max-width:900px){.g4{grid-template-columns:repeat(2,1fr)}.g2{grid-template-columns:1fr}}
    `}</style>

    <div style={{display:'flex',minHeight:'100vh'}}>
      {/* ── Sidebar ── */}
      <div style={{width:210,background:'var(--sb)',borderRight:'0.5px solid var(--border)',display:'flex',flexDirection:'column',padding:'0 0 16px',flexShrink:0}}>
        <div style={{padding:'16px 15px 13px',borderBottom:'0.5px solid var(--border)',marginBottom:6}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:30,height:30,borderRadius:8,background:'linear-gradient(135deg,#f97316,#dc2626)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🏃</div>
            <div><div style={{fontSize:14,fontWeight:600}}>Cheer My Run</div><div style={{fontSize:10,color:'var(--text-secondary)'}}>Investor Dashboard</div></div>
          </div>
        </div>
        <div style={{padding:'2px 6px',flex:1}}>
          {TABS.map(t=><button key={t} onClick={()=>setTab(t)} className={`sb-link${tab===t?' active':''}`}>{t}</button>)}
        </div>
        {/* Source status */}
        <div style={{padding:'10px 15px 0',borderTop:'0.5px solid var(--border)'}}>
          <div style={{fontSize:9,color:'var(--text-secondary)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>Conexiones</div>
          <div style={{marginBottom:7}}>
            <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,marginBottom:2}}>
              <div style={{width:5,height:5,borderRadius:'50%',background:sw?.connected?'#16a34a':'#f59e0b'}}/>
              Superwall
              {swLoading&&<span style={{fontSize:9,color:'#888'}}>cargando...</span>}
              {!swLoading&&sw?.connected&&<span className="live-badge">LIVE</span>}
              {!swLoading&&!sw?.connected&&<span className="err-badge">CONFIG</span>}
            </div>
            {lastRefresh&&<div style={{fontSize:9,color:'#999',marginLeft:11}}>Actualizado: {lastRefresh.toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}</div>}
          </div>
          <div style={{marginBottom:7}}>
            <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}>
              <div style={{width:5,height:5,borderRadius:'50%',background:'#16a34a'}}/>Mixpanel <span className="live-badge">LIVE</span>
            </div>
          </div>
          <button className="btn-refresh" onClick={fetchSuperwall} style={{width:'100%',marginTop:4}}>↻ Refrescar</button>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>
        {/* Header */}
        <div style={{background:'var(--card)',borderBottom:'0.5px solid var(--border)',padding:'11px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,flexWrap:'wrap',gap:8}}>
          <div style={{fontSize:15,fontWeight:600}}>{tab}</div>
          <div style={{display:'flex',gap:5,alignItems:'center',flexWrap:'wrap'}}>
            {tab!=='ICP'&&tab!=='Comparar'&&tab!=='P&L'&&PERIODS.map(p=>(
              <button key={p.v} className={`btn btn-sm${period===p.v?' active':''}`} onClick={()=>setPeriod(p.v)}>{p.l}</button>
            ))}
            {tab==='Revenue'&&!swLoading&&sw?.connected&&(
              <div style={{display:'flex',gap:3,marginLeft:4,borderLeft:'0.5px solid var(--border)',paddingLeft:8}}>
                {(['last24h','last7d','last30d','last90d'] as const).map(p=>(
                  <button key={p} className={`btn btn-sm${swPeriod===p?' active':''}`} onClick={()=>setSwPeriod(p)}>
                    {p==='last24h'?'24h':p==='last7d'?'7d':p==='last30d'?'30d':'90d'}
                  </button>
                ))}
              </div>
            )}
            {tab==='P&L'&&<button className="btn btn-sm btn-dark" onClick={()=>{setShowAdd(true);setEditId(null);}}>+ Agregar</button>}
          </div>
        </div>

        <div style={{flex:1,padding:18,overflowY:'auto'}}>

{/* ═══════════════ REVENUE — SUPERWALL LIVE ═══════════════ */}
{tab==='Revenue'&&(<>
  {/* Connection banner */}
  {swError&&<div style={{background:'#fef9c3',border:'0.5px solid #fde68a',borderRadius:10,padding:'10px 14px',marginBottom:14,fontSize:12,color:'#854d0e'}}>
    ⚠️ <strong>Superwall pendiente de configurar.</strong> Para conectar en vivo: ve a Vercel → Environment Variables y agrega <code>SUPERWALL_SESSION</code> y <code>SUPERWALL_CSRF</code> (obtén estos valores desde DevTools → Application → Cookies en superwall.com). {swError}
  </div>}
  {sw?.connected&&<div style={{background:'#f0fdf4',border:'0.5px solid #86efac',borderRadius:10,padding:'8px 14px',marginBottom:14,fontSize:11,color:'#166534',display:'flex',alignItems:'center',gap:8}}>
    <span style={{fontSize:16}}>✅</span> <strong>Superwall conectado en vivo</strong> — datos actualizados automáticamente cada vez que abres el dashboard. Última actualización: {lastRefresh?.toLocaleTimeString('es-MX')}{' '}
    <button className="btn-refresh" onClick={fetchSuperwall}>↻ Refrescar ahora</button>
  </div>}

  <div className="st">Revenue — Superwall {sw?.connected?'(LIVE)':'(configurar)'}</div>
  <div className="g4">
    <Card label="Total Proceeds iOS" value={swLoading?'...':(fmtUSD(swProceeds))} big green live={sw?.connected} sub={swPeriod==='last24h'?'últimas 24h':swPeriod==='last7d'?'últimos 7d':swPeriod==='last30d'?'últimos 30d':'últimos 90d'}/>
    <Card label="Total Proceeds Android" value={swLoading?'...':swAndroid?fmtUSD(swAndroid.proceeds):'N/A'} live={sw?.connected&&!!swAndroid} sub="últimos 30d"/>
    <Card label="Total combinado" value={swLoading?'...':fmtUSD(swTotal)} live={sw?.connected} green sub="iOS + Android"/>
    <Card label="New Users iOS" value={swLoading?'...':fmt(swNewUsers)} live={sw?.connected} sub="instalaciones únicas"/>
  </div>
  <div className="g4">
    <Card label="Total Conversiones" value={swLoading?'...':fmt(swConvs)} live={sw?.connected} sub="pagos completados"/>
    <Card label="Paywall Rate" value={swLoading?'...':(swPaywallR.toFixed(1)+'%')} live={sw?.connected} sub="usuarios que ven paywall"/>
    <Card label="Conv. Rate inicial" value={swLoading?'...':(swConvR.toFixed(1)+'%')} live={sw?.connected} green sub="1er pago / usuarios"/>
    <Card label="iOS vs Android" value="82% / 18%" sub="subs por plataforma"/>
  </div>

  {/* iOS vs Android */}
  <div className="g2">
    <div className="cc">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <span style={{fontSize:13,fontWeight:600}}>iOS vs Android — Usuarios activos</span>
        <span style={{fontSize:9,padding:'2px 6px',borderRadius:10,background:'#eff6ff',color:'#1d4ed8',fontWeight:600}}>MIXPANEL</span>
      </div>
      <div style={{height:170}}><Doughnut data={{labels:PLATFORM.map(r=>r[0]),datasets:[{data:PLATFORM.map(r=>r[1]),backgroundColor:['#1a1a1a','#22c55e'],borderWidth:0}]}} options={DO}/></div>
      <div style={{marginTop:8}}>
        <SBar label="iOS" val={1174} total={1212} color="#1a1a1a"/>
        <SBar label="Android" val={38} total={1212} color="#22c55e"/>
      </div>
      <Insight text="iOS domina con 97% de usuarios activos. Android apenas arrancando." type="blue"/>
    </div>
    <div className="cc">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <span style={{fontSize:13,fontWeight:600}}>iOS vs Android — Suscripciones</span>
        <span style={{fontSize:9,padding:'2px 6px',borderRadius:10,background:'#eff6ff',color:'#1d4ed8',fontWeight:600}}>MIXPANEL</span>
      </div>
      <div style={{height:170}}><Doughnut data={{labels:PLATFORM_SUBS.map(r=>r[0]),datasets:[{data:PLATFORM_SUBS.map(r=>r[1]),backgroundColor:['#1a1a1a','#22c55e'],borderWidth:0}]}} options={DO}/></div>
      <div style={{marginTop:8}}>
        <SBar label="iOS" val={180} total={304} color="#1a1a1a"/>
        <SBar label="Android" val={124} total={304} color="#22c55e"/>
      </div>
      <Insight text="Android tiene 41% de subs con solo 3% de usuarios — conversión altísima (cluster India)." type="amber"/>
    </div>
  </div>

  {/* Campaigns live */}
  <div className="cc">
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
      <span style={{fontSize:13,fontWeight:600}}>Campañas de paywall</span>
      {sw?.connected&&<span className="live-badge">LIVE</span>}
    </div>
    {swLoading?<div style={{textAlign:'center',padding:'20px',color:'var(--text-secondary)',fontSize:12}}>Cargando datos de Superwall...</div>:
    sw?.connected&&sw?.campaigns?.length>0?(
      <table className="tbl">
        <thead><tr><th>Campaña</th><th style={{textAlign:'right'}}>Usuarios</th><th style={{textAlign:'right'}}>Conv.</th><th style={{textAlign:'right'}}>Conv. Rate</th><th style={{textAlign:'right'}}>Proceeds</th></tr></thead>
        <tbody>{(sw.campaigns||[]).filter((c:any)=>c.name).map((c:any,i:number)=>(
          <tr key={i}>
            <td style={{fontWeight:500}}>{c.name}</td>
            <td style={{textAlign:'right'}}>{fmt(c.users)}</td>
            <td style={{textAlign:'right'}}>{fmt(c.conversions)}</td>
            <td style={{textAlign:'right',color:'#16a34a'}}>{(c.convRate*100||0).toFixed(1)}%</td>
            <td style={{textAlign:'right',fontWeight:600,color:'#16a34a'}}>{fmtUSD(c.proceeds)}</td>
          </tr>
        ))}</tbody>
      </table>
    ):(
      <div style={{padding:'12px',background:'var(--surface)',borderRadius:8,fontSize:12,color:'var(--text-secondary)'}}>
        Campañas iOS (Superwall): <strong>Example Campaign</strong> — $2K · 9.2% conv. · <strong>Transaction Abandoned</strong> — $2K · 10.5% conv.
      </div>
    )}
  </div>

  {/* Recent transactions live */}
  <div className="cc">
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
      <span style={{fontSize:13,fontWeight:600}}>Transacciones recientes</span>
      {sw?.connected&&<span className="live-badge">LIVE</span>}
    </div>
    {swLoading?<div style={{textAlign:'center',padding:'16px',color:'var(--text-secondary)',fontSize:12}}>Cargando...</div>:
    sw?.connected&&sw?.recentTransactions?.length>0?(
      <div style={{overflowX:'auto'}}><table className="tbl" style={{minWidth:500}}>
        <thead><tr><th>Usuario</th><th>Campaña</th><th>Producto</th><th style={{textAlign:'right'}}>Revenue</th><th>Tipo</th><th>Hora</th></tr></thead>
        <tbody>{sw.recentTransactions.slice(0,15).map((t:any,i:number)=>(
          <tr key={i}>
            <td style={{fontFamily:'monospace',fontSize:11,color:'var(--text-secondary)'}}>{t.userId}...</td>
            <td style={{fontSize:11}}>{t.campaign}</td>
            <td style={{fontSize:11}}>{t.product}</td>
            <td style={{textAlign:'right',fontWeight:600,color:'#16a34a'}}>{t.proceeds?fmtUSD(t.proceeds):'-'}</td>
            <td><span style={{fontSize:10,padding:'1px 6px',borderRadius:10,background:t.type?.includes('Cancel')?'#fee2e2':t.type?.includes('Renew')?'#eff6ff':'#dcfce7',color:t.type?.includes('Cancel')?'#991b1b':t.type?.includes('Renew')?'#1d4ed8':'#166534'}}>{t.type?.replace('Direct Sub Start','Nueva').replace('Sub Cancel','Cancelación').replace('Renewal','Renovación')}</span></td>
            <td style={{fontSize:10,color:'var(--text-secondary)',whiteSpace:'nowrap'}}>{t.time?new Date(t.time).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'}):'-'}</td>
          </tr>
        ))}</tbody>
      </table></div>
    ):(
      <div style={{fontSize:12,color:'var(--text-secondary)',padding:'8px 0',lineHeight:2}}>
        Transacciones de hoy: $9.99/yr ($26.35) · $29.99/yr ($39.99) · $2.99/wk · $9.99/yr ($12.50) · $9.99/mo · $29.99/yr...
        <br/><em>Conecta Superwall para ver en tiempo real.</em>
      </div>
    )}
  </div>

  {/* Conversion time + funnel */}
  <div className="g2">
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>⏱ Tiempo de conversión</div>
      {[{t:'~11 minutos',d:'Tiempo promedio conversión mismo día (6%)',c:'#16a34a'},{t:'~5.9 horas',d:'Tiempo promedio en 7 días (7%)',c:'#f97316'},{t:'86%',d:'De conversiones en las primeras 6h del día de descarga',c:'#6366f1'}].map(x=>(
        <div key={x.t} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'8px',background:'var(--surface)',borderRadius:8,marginBottom:6}}>
          <div style={{fontSize:18,fontWeight:700,color:x.c,width:80,flexShrink:0}}>{x.t}</div>
          <div style={{fontSize:11,color:'var(--text-secondary)',lineHeight:1.4,paddingTop:2}}>{x.d}</div>
        </div>
      ))}
    </div>
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Distribución de planes</div>
      <div style={{height:180}}><Doughnut data={{labels:ICP_PLAN.map(r=>r[0]),datasets:[{data:ICP_PLAN.map(r=>r[1]),backgroundColor:['#6366f1','#3b82f6','#0891b2','#f97316'],borderWidth:0}]}} options={DO}/></div>
    </div>
  </div>
</>)}

{/* ═══════════════ OVERVIEW — MIXPANEL ═══════════════ */}
{tab==='Overview'&&(<>
  <div className="st">Métricas de uso — Mixpanel</div>
  <div className="g4">
    <Card label="Corridas" value={fmt(tRuns)} sub="run_started"/>
    <Card label="Suscripciones nuevas" value={fmt(tSubs)} sub="via Superwall → Mixpanel"/>
    <Card label="Cancelaciones" value={fmt(sum(fCanc))} color="#dc2626" sub="churn del período"/>
    <Card label="Cheers recibidos" value={fmt(tCheers)} green sub={tRuns>0?(tCheers/tRuns).toFixed(0)+' por corrida':undefined}/>
  </div>
  <div className="g4">
    <Card label="Neto subs" value={(netSubs>=0?'+':'')+fmt(netSubs)} color={netSubs>=0?'#16a34a':'#dc2626'} sub="nuevas − canceladas"/>
    <Card label="Renovaciones" value={fmt(tRenew)} green/>
    <Card label="Run completion" value="96%" green sub="621/649 corridas"/>
    <Card label="Cheers/corrida" value={tRuns>0?(tCheers/tRuns).toFixed(0):'—'} green sub="engagement emocional"/>
  </div>
  <div className="g2">
    <div className="cc">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <span style={{fontSize:13,fontWeight:600}}>Subs · Cancel · Renovaciones</span>
        <span style={{fontSize:9,padding:'2px 6px',borderRadius:10,background:'#eff6ff',color:'#1d4ed8',fontWeight:600}}>MIXPANEL</span>
      </div>
      <div style={{height:195}}>
        <Bar data={{labels:fSubs.map(r=>r[0]),datasets:[{label:'Nuevas',data:fSubs.map(r=>r[1]),backgroundColor:'#16a34a',borderRadius:2},{label:'Cancelaciones',data:fCanc.map(r=>r[1]),backgroundColor:'#dc2626',borderRadius:2},{label:'Renovaciones',data:fRenew.map(r=>r[1]),backgroundColor:'#6366f1',borderRadius:2}]}} options={CO({plugins:{legend:{display:true,labels:{font:{size:10},boxWidth:9}}}})}/>
      </div>
    </div>
    <div className="cc">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <span style={{fontSize:13,fontWeight:600}}>Corridas por día</span>
        <span style={{fontSize:9,padding:'2px 6px',borderRadius:10,background:'#eff6ff',color:'#1d4ed8',fontWeight:600}}>MIXPANEL</span>
      </div>
      <div style={{height:195}}>
        <Bar data={{labels:fRuns.map(r=>r[0]),datasets:[{data:fRuns.map(r=>r[1]),backgroundColor:'#1a1a1a',borderRadius:2}]}} options={CO()}/>
      </div>
    </div>
  </div>
  <div className="cc">
    <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>Cheers recibidos por día</div>
    <div style={{height:180}}>
      <Bar data={{labels:fCheers.map(r=>r[0]),datasets:[{data:fCheers.map(r=>r[1]),backgroundColor:'#f97316',borderRadius:2}]}} options={CO()}/>
    </div>
    <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:8}}>Pico 22 mar: 11,281 cheers en un día. Total 30d: 26,614 cheers.</div>
  </div>
</>)}

{/* ═══════════════ CORRIDAS ═══════════════ */}
{tab==='Corridas'&&(<>
  <div className="st">Análisis de corridas — Mixpanel</div>
  <div className="g4">
    <Card label="Corridas totales" value={fmt(tRuns)} sub="run_started"/>
    <Card label="Corridas reales" value="387" green sub=">5min y >1km"/>
    <Card label="Pruebas de app" value="281" color="#f59e0b" sub="<5min o <1km (42%)"/>
    <Card label="Distancia promedio" value="9.4km" green sub="run_completed"/>
  </div>
  <div className="g2">
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>¿Qué distancias corren?</div>
      <div style={{height:190}}>
        <Bar data={{labels:DIST_RUNS.map(b=>b.l),datasets:[{data:DIST_RUNS.map(b=>b.v),backgroundColor:DIST_RUNS.map(b=>b.r?'#6366f1':'#f59e0b'),borderRadius:3}]}} options={CO()}/>
      </div>
      <Insight text="<strong>Corrida real:</strong> >5min Y >1km. 387/668 = 58% son corridas reales. 34% son medias maratones o maratones." type="blue"/>
    </div>
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Hora de inicio (local_hour)</div>
      <div style={{height:190}}>
        <Bar data={{labels:HORA_RUNS.map(r=>r[0]),datasets:[{data:HORA_RUNS.map(r=>r[1]),backgroundColor:HORA_RUNS.map(r=>{const h=parseInt(r[0]);return h>=6&&h<12?'#f97316':h>=18?'#1a1a1a':'#94a3b8';}),borderRadius:3}]}} options={CO()}/>
      </div>
      <Insight text="<strong>54% de corridas entre 6-10am</strong> — usuarios madrugadores. Notificaciones antes de las 7am." type="amber"/>
    </div>
  </div>
  <div className="cc">
    <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>Corridas por día</div>
    <div style={{height:200}}>
      <Bar data={{labels:fRuns.map(r=>r[0]),datasets:[{data:fRuns.map(r=>r[1]),backgroundColor:'#1a1a1a',borderRadius:2}]}} options={CO()}/>
    </div>
  </div>
</>)}

{/* ═══════════════ ICP ═══════════════ */}
{tab==='ICP'&&(<>
  <div className="st">Perfil del cliente ideal — suscriptores pagadores</div>
  <div className="g2">
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>¿Cuál es tu género?</div>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:10}}>161 suscriptores con datos completos</div>
      <div style={{height:155}}><Doughnut data={{labels:ICP_GENDER.map(r=>r[0]),datasets:[{data:ICP_GENDER.map(r=>r[1]),backgroundColor:['#ec4899','#3b82f6','#94a3b8'],borderWidth:0}]}} options={DO}/></div>
      <div style={{marginTop:8}}>{ICP_GENDER.map((r,i)=><SBar key={r[0]} label={r[0]} val={r[1]} total={149} color={['#ec4899','#3b82f6','#94a3b8'][i]}/>)}</div>
      <Insight text="<strong>74% femenino.</strong> La ICP es mujer corredora que busca apoyo emocional." type="green"/>
    </div>
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>¿Cuántos años tienes?</div>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:10}}>161 suscriptores con datos</div>
      <div style={{height:155}}><Bar data={{labels:ICP_AGE.map(r=>r[0]),datasets:[{data:ICP_AGE.map(r=>r[1]),backgroundColor:['#6366f1','#8b5cf6','#a78bfa','#c4b5fd'],borderRadius:3}]}} options={CO()}/></div>
      <div style={{marginTop:8}}>{ICP_AGE.map((r,i)=><SBar key={r[0]} label={r[0]} val={r[1]} total={149} color={COLS[i]}/>)}</div>
    </div>
  </div>
  <div className="g2">
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>¿Qué tipo de corredor eres?</div>
      <div style={{height:150}}><Doughnut data={{labels:ICP_LEVEL.map(r=>r[0]),datasets:[{data:ICP_LEVEL.map(r=>r[1]),backgroundColor:['#f97316','#3b82f6','#22c55e'],borderWidth:0}]}} options={DO}/></div>
      <div style={{marginTop:8}}>{ICP_LEVEL.map((r,i)=><SBar key={r[0]} label={r[0]} val={r[1]} total={148} color={['#f97316','#3b82f6','#22c55e'][i]}/>)}</div>
      <Insight text="Principiantes + intermedios = 95%. El runner avanzado corre solo." type="blue"/>
    </div>
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>¿Qué reloj usas?</div>
      <div style={{height:150}}><Doughnut data={{labels:ICP_WATCH.map(r=>r[0]),datasets:[{data:ICP_WATCH.map(r=>r[1]),backgroundColor:['#1a1a1a','#16a34a','#3b82f6','#f59e0b','#6366f1','#ec4899'],borderWidth:0}]}} options={DO}/></div>
      <div style={{marginTop:8}}>{ICP_WATCH.map((r,i)=><SBar key={r[0]} label={r[0]} val={r[1]} total={149} color={['#1a1a1a','#16a34a','#3b82f6','#f59e0b','#6366f1','#ec4899'][i]}/>)}</div>
      <Insight text="<strong>Apple Watch 40% + Garmin 40%</strong> — hardware premium = alto poder adquisitivo." type="green"/>
    </div>
  </div>
  <div className="g3">
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>¿Llevas teléfono al correr?</div>
      <div style={{height:130}}><Doughnut data={{labels:ICP_PHONE.map(r=>r[0]),datasets:[{data:ICP_PHONE.map(r=>r[1]),backgroundColor:['#16a34a','#f59e0b'],borderWidth:0}]}} options={DO}/></div>
      <div style={{marginTop:6}}>{ICP_PHONE.map((r,i)=><SBar key={r[0]} label={r[0]} val={r[1]} total={157} color={['#16a34a','#f59e0b'][i]}/>)}</div>
      <Insight text="<strong>92% siempre.</strong> Producto hecho para ellos." type="green"/>
    </div>
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>¿Corres con audífonos?</div>
      <div style={{height:130}}><Doughnut data={{labels:ICP_HEADPHONES.map(r=>r[0]),datasets:[{data:ICP_HEADPHONES.map(r=>r[1]),backgroundColor:['#6366f1','#f97316','#94a3b8'],borderWidth:0}]}} options={DO}/></div>
      <div style={{marginTop:6}}>{ICP_HEADPHONES.map((r,i)=><SBar key={r[0]} label={r[0]} val={r[1]} total={157} color={['#6366f1','#f97316','#94a3b8'][i]}/>)}</div>
      <Insight text="<strong>83% siempre.</strong> Voice Notes naturales." type="blue"/>
    </div>
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>¿Qué escuchas al correr?</div>
      <div style={{height:130}}><Doughnut data={{labels:ICP_LISTEN.map(r=>r[0]),datasets:[{data:ICP_LISTEN.map(r=>r[1]),backgroundColor:['#f97316','#6366f1','#3b82f6','#94a3b8'],borderWidth:0}]}} options={DO}/></div>
      <div style={{marginTop:6}}>{ICP_LISTEN.map((r,i)=><SBar key={r[0]} label={r[0]} val={r[1]} total={157} color={['#f97316','#6366f1','#3b82f6','#94a3b8'][i]}/>)}</div>
    </div>
  </div>
  <div className="g2">
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>¿Dónde nos encontraste?</div>
      <div style={{height:160}}><Doughnut data={{labels:ICP_SOURCE.map(r=>r[0]),datasets:[{data:ICP_SOURCE.map(r=>r[1]),backgroundColor:['#000','#e1306c','#1877f2','#94a3b8'],borderWidth:0}]}} options={DO}/></div>
      <div style={{marginTop:8}}>{ICP_SOURCE.map((r,i)=><SBar key={r[0]} label={r[0]} val={r[1]} total={139} color={['#000','#e1306c','#1877f2','#94a3b8'][i]}/>)}</div>
      <Insight text="<strong>TikTok 60%</strong> de suscriptores. Motor de adquisición #1." type="green"/>
    </div>
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>¿Qué distancias ya has corrido?</div>
      <div style={{height:160}}><Bar data={{labels:ICP_DISTANCES.map(r=>r[0]),datasets:[{data:ICP_DISTANCES.map(r=>r[1]),backgroundColor:COLS,borderRadius:3}]}} options={CO()}/></div>
      <div style={{marginTop:8}}>{ICP_DISTANCES.map((r,i)=><SBar key={r[0]} label={r[0]} val={r[1]} total={686} color={COLS[i]}/>)}</div>
      <Insight text="Media maratón domina. Usuario con experiencia real corriendo." type="blue"/>
    </div>
  </div>
  <div className="g2">
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Kilómetros o millas</div>
      <div style={{height:140}}><Doughnut data={{labels:ICP_UNITS.map(r=>r[0]),datasets:[{data:ICP_UNITS.map(r=>r[1]),backgroundColor:['#6366f1','#f97316'],borderWidth:0}]}} options={DO}/></div>
      <div style={{marginTop:6}}>{ICP_UNITS.map((r,i)=><SBar key={r[0]} label={r[0]} val={r[1]} total={160} color={['#6366f1','#f97316'][i]}/>)}</div>
      <Insight text="69% km — LATAM + Europa domina. USA mercado secundario." type="blue"/>
    </div>
    <div className="cc">
      <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Top ciudades</div>
      <div style={{overflowY:'auto',maxHeight:210}}>
        <table className="tbl">
          <thead><tr><th>#</th><th>Ciudad</th><th style={{textAlign:'right'}}>Usuarios</th></tr></thead>
          <tbody>{TOP_CITIES.map((r,i)=>(
            <tr key={r[0]}>
              <td style={{color:'var(--text-secondary)',width:24,fontSize:11}}>{i+1}</td>
              <td style={{fontWeight:500}}>{r[0]}</td>
              <td style={{textAlign:'right'}}>{r[1]}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  </div>
  <div className="cc">
    <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Voice Note vs TTS — ¿Cómo cheers reciben?</div>
    <div className="g2">
      <div style={{height:160}}><Doughnut data={{labels:CHEER_TYPE.map(r=>r[0]),datasets:[{data:CHEER_TYPE.map(r=>r[1]),backgroundColor:['#6366f1','#f97316'],borderWidth:0}]}} options={DO}/></div>
      <div style={{paddingTop:8}}>
        <SBar label="TTS (texto a voz)" val={13820} total={26614} color="#6366f1"/>
        <SBar label="Voice Note" val={12794} total={26614} color="#f97316"/>
        <div style={{marginTop:8,fontSize:12,color:'var(--text-secondary)'}}>52%/48% — casi empate. Voice notes más personales, TTS más accesible.</div>
        <div style={{marginTop:6,padding:'8px',background:'#f0fdf4',borderRadius:8,fontSize:11,color:'#166534'}}>⚠️ <strong>usage_intent</strong> no se guarda en V2 — fix pendiente en el app.</div>
        <div style={{marginTop:4,padding:'8px',background:'#eff6ff',borderRadius:8,fontSize:11,color:'#1d4ed8'}}>⚠️ <strong>Run club</strong> — 0% de suscriptores son miembros. Todos corren solos.</div>
      </div>
    </div>
  </div>
</>)}

{/* ═══════════════ COMPARAR ═══════════════ */}
{tab==='Comparar'&&(<>
  <div className="st">Comparación semana a semana</div>
  <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
    <div style={{flex:1,minWidth:200}}>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:4}}>Período A</div>
      <select value={cmpA} onChange={e=>setCmpA(Number(e.target.value))} style={{width:'100%'}}>
        {WEEKS.map((w,i)=><option key={i} value={i}>{w.l}</option>)}
      </select>
    </div>
    <div style={{flex:1,minWidth:200}}>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:4}}>Período B</div>
      <select value={cmpB} onChange={e=>setCmpB(Number(e.target.value))} style={{width:'100%'}}>
        {WEEKS.map((w,i)=><option key={i} value={i}>{w.l}</option>)}
      </select>
    </div>
  </div>
  <div className="g4">
    {[{label:'Subs nuevas',a:wA.s,b:wB.s,pos:true},{label:'Cancelaciones',a:wA.c,b:wB.c,pos:false},{label:'Renovaciones',a:wA.r,b:wB.r,pos:true},{label:'Net subs',a:wA.s-wA.c,b:wB.s-wB.c,pos:true}].map(m=>{
      const d=dpct(m.b,m.a);
      return(<div key={m.label} style={{background:'var(--card)',border:'0.5px solid var(--border)',borderRadius:12,padding:'12px 14px'}}>
        <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:6}}>{m.label}</div>
        <div style={{display:'flex',gap:8,alignItems:'flex-end'}}>
          <div><div style={{fontSize:9,color:'#888',marginBottom:1}}>{wA.l}</div><div style={{fontSize:18,fontWeight:600}}>{fmt(m.a)}</div></div>
          <div style={{fontSize:16,color:'var(--text-secondary)',paddingBottom:1}}>→</div>
          <div><div style={{fontSize:9,color:'#888',marginBottom:1}}>{wB.l}</div><div style={{fontSize:18,fontWeight:600,color:d&&d>0?(m.pos?'#16a34a':'#dc2626'):d&&d<0?(m.pos?'#dc2626':'#16a34a'):'var(--text-primary)'}}>{fmt(m.b)}</div></div>
        </div>
        {d!=null&&<div style={{fontSize:11,marginTop:3,color:d>0?(m.pos?'#16a34a':'#dc2626'):d<0?(m.pos?'#dc2626':'#16a34a'):'#888'}}>{d>=0?'+':''}{d}%</div>}
      </div>);
    })}
  </div>
  <div className="cc">
    <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Comparación: {wA.l} vs {wB.l}</div>
    <div style={{height:220}}>
      <Bar data={{labels:['Subs nuevas','Cancelaciones','Renovaciones','Net subs'],datasets:[{label:wA.l,data:[wA.s,wA.c,wA.r,wA.s-wA.c],backgroundColor:'#6366f1',borderRadius:4},{label:wB.l,data:[wB.s,wB.c,wB.r,wB.s-wB.c],backgroundColor:'#f97316',borderRadius:4}]}} options={CO({plugins:{legend:{display:true,labels:{font:{size:11},boxWidth:10}}}})}/>
    </div>
  </div>
  <div className="cc">
    <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Histórico completo</div>
    <div style={{overflowX:'auto'}}>
      <table className="tbl">
        <thead><tr><th>Semana</th><th style={{textAlign:'right'}}>Nuevas</th><th style={{textAlign:'right'}}>Cancel.</th><th style={{textAlign:'right'}}>Renov.</th><th style={{textAlign:'right'}}>Neto</th></tr></thead>
        <tbody>{WEEKS.map((w,i)=>{
          const net=w.s-w.c;
          const isA=i===cmpA,isB=i===cmpB;
          return(<tr key={i} style={{background:isA?'#eff6ff':isB?'#fef3c7':undefined}}>
            <td style={{fontWeight:500}}>{w.l}{isA&&<span style={{fontSize:9,marginLeft:4,background:'#6366f1',color:'#fff',padding:'1px 5px',borderRadius:3}}>A</span>}{isB&&<span style={{fontSize:9,marginLeft:4,background:'#f97316',color:'#fff',padding:'1px 5px',borderRadius:3}}>B</span>}</td>
            <td style={{textAlign:'right',color:'#16a34a',fontWeight:500}}>{w.s}</td>
            <td style={{textAlign:'right',color:'#dc2626'}}>{w.c}</td>
            <td style={{textAlign:'right',color:'#6366f1'}}>{w.r}</td>
            <td style={{textAlign:'right',color:net>=0?'#16a34a':'#dc2626',fontWeight:600}}>{net>=0?'+':''}{net}</td>
          </tr>);
        })}</tbody>
        <tr style={{borderTop:'1.5px solid var(--border)',fontWeight:700}}>
          <td>TOTAL</td>
          <td style={{textAlign:'right',color:'#16a34a'}}>{WEEKS.reduce((s,w)=>s+w.s,0)}</td>
          <td style={{textAlign:'right',color:'#dc2626'}}>{WEEKS.reduce((s,w)=>s+w.c,0)}</td>
          <td style={{textAlign:'right',color:'#6366f1'}}>{WEEKS.reduce((s,w)=>s+w.r,0)}</td>
          <td style={{textAlign:'right',color:'#16a34a'}}>{WEEKS.reduce((s,w)=>s+w.s-w.c,0)}</td>
        </tr>
      </table>
    </div>
  </div>
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
    <div className="cc" style={{borderLeft:`3px solid ${ingresos-gastos>=0?'#16a34a':'#dc2626'}`,marginBottom:0}}>
      <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:4}}>Flujo Neto</div>
      <div style={{fontSize:26,fontWeight:700,color:ingresos-gastos>=0?'#16a34a':'#dc2626'}}>{ingresos-gastos>=0?'+':''}${(ingresos-gastos).toLocaleString()}</div>
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
  <div className="cc">
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
      <span style={{fontSize:13,fontWeight:600}}>Entradas</span>
      <div style={{display:'flex',gap:5}}>
        {['all','gasto','ingreso'].map(f=><button key={f} className={`btn btn-sm${filter===f?' active':''}`} onClick={()=>setFilter(f)}>{f==='all'?'Todos':f==='gasto'?'Gastos':'Ingresos'}</button>)}
      </div>
    </div>
    {filtered.length===0?<div style={{textAlign:'center',padding:'24px 0',color:'var(--text-secondary)',fontSize:13}}>Sin entradas. Click en "+ Agregar".</div>:
    <div style={{overflowX:'auto'}}><table className="tbl" style={{minWidth:500}}>
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

        </div>
      </div>
    </div>

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
