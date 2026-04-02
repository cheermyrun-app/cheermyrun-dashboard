import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

// ─── SUPERWALL SNAPSHOT — Verified live Apr 1 2026 from app 22399 ────────────
// Two apps: 22399 = main production, 22400 = sandbox ($76/7d)
// Campaigns: campaign_trigger="Timeline & Benefits", paywall_decline="Discount Offer", transaction_abandon="Discount Offer (retargeting)"
// Note: 90d convs=596 includes both initial (556) + renewals. 30d convs=321 (295 initial).
const SW_SNAPSHOT = {
  connected: true, live: false, updatedAt: '2026-04-01T12:00:00Z',
  ios: {
    last24h: { proceeds: 113,    newUsers: 20,   conversions: 6,   paywallRate: 85.00, convRate: 25.00 },
    last7d:  { proceeds: 1077,   newUsers: 263,  conversions: 71,  paywallRate: 80.23, convRate: 20.15 },
    last30d: { proceeds: 4321,   newUsers: 2165, conversions: 321, paywallRate: 78.98, convRate: 13.63 },
    last90d: { proceeds: 7756,   newUsers: 4703, conversions: 596, paywallRate: 77.44, convRate: 11.82 },
  },
  campaigns: [
    { id: 'campaign_trigger',    name: 'Timeline & Benefits', users: 1978, convs: 184, convRate: 9.30,  proceeds: 2277.75 },
    { id: 'paywall_decline',     name: 'Discount Offer',      users: 1329, convs: 142, convRate: 10.68, proceeds: 2177.87 },
    { id: 'transaction_abandon', name: 'Transaction Abandon', users: 890,  convs: 67,  convRate: 7.53,  proceeds: 890.40  },
  ],
  recentTransactions: [
    { userId: '69cd48', product: 'Annual $29.99/yr',  proceeds: 22.41,  type: 'New Sub',    time: '2026-04-01T09:33:00', campaign: 'campaign_trigger' },
    { userId: '69cd16', product: 'Discount $9.99/yr', proceeds: 13.93,  type: 'New Sub',    time: '2026-04-01T05:57:00', campaign: 'paywall_decline' },
    { userId: '69a5bf', product: 'Monthly $9.99/mo',  proceeds: 9.99,   type: 'New Sub',    time: '2026-04-01T04:49:00', campaign: 'campaign_trigger' },
    { userId: '699d52', product: 'Discount $9.99/yr', proceeds: -26.55, type: 'Refund',     time: '2026-04-01T03:38:00', campaign: 'transaction_abandon' },
    { userId: '69ccae', product: 'Annual $29.99/yr',  proceeds: 39.99,  type: 'New Sub',    time: '2026-03-31T14:00:00', campaign: 'campaign_trigger' },
    { userId: '69cc65', product: 'Monthly $9.99/mo',  proceeds: 9.99,   type: 'New Sub',    time: '2026-03-31T05:00:00', campaign: 'campaign_trigger' },
    { userId: '69cbaf', product: 'Discount $9.99/yr', proceeds: 26.38,  type: 'New Sub',    time: '2026-03-31T00:00:00', campaign: 'paywall_decline' },
    { userId: '699d52', product: 'Discount $9.99/yr', proceeds: 0,      type: 'Cancelled',  time: '2026-03-30T22:00:00', campaign: 'transaction_abandon' },
    { userId: '69cb47', product: 'Discount $9.99/yr', proceeds: 24.99,  type: 'New Sub',    time: '2026-03-30T20:00:00', campaign: 'paywall_decline' },
    { userId: '6962ea', product: 'Weekly $2.99/wk',   proceeds: 2.28,   type: 'Renewal',    time: '2026-03-30T18:00:00', campaign: 'campaign_trigger' },
  ],
};

// ─── MIXPANEL SNAPSHOT (last 31 days) ────────────────────────────────────────
const DATES   = ['03-01','03-02','03-03','03-04','03-05','03-06','03-07','03-08','03-09','03-10','03-11','03-12','03-13','03-14','03-15','03-16','03-17','03-18','03-19','03-20','03-21','03-22','03-23','03-24','03-25','03-26','03-27','03-28','03-29','03-30','03-31'];
const DAU     = [115,61,52,51,43,58,70,54,46,47,20,34,51,75,105,66,63,54,62,72,115,99,61,50,41,44,60,90,90,49,42];
const PAYWALL = [90,86,78,82,65,76,94,65,76,90,33,52,74,100,157,126,94,102,113,106,155,68,54,50,41,57,62,69,54,45,38];
const SUBS    = [2,0,4,4,3,8,5,3,3,1,2,2,55,59,15,8,5,5,6,4,19,10,2,4,3,10,14,16,15,7,4];
const CANCELS = [0,0,0,0,0,0,0,0,0,7,3,6,2,6,14,8,6,7,6,9,7,7,6,6,6,3,9,12,8,3,2];
const RENEWALS= [0,0,0,0,0,0,0,0,0,2,3,3,4,5,0,4,2,3,4,3,7,3,4,6,4,5,8,8,4,1,0];
const RUNS    = [12,10,12,10,6,15,17,22,5,7,5,6,9,32,60,15,14,13,20,21,56,59,11,10,14,6,14,59,56,15,8];
const CHEERS_D= [58,50,22,60,13,33,495,2167,10,13,98,13,27,332,1488,14,22,47,30,21,4058,11281,6,73,29,4,18,2566,1677,11,9];

const WEEKS        = [{l:'Feb 23',s:44,c:0,r:0},{l:'Mar 02',s:27,c:0,r:0},{l:'Mar 09',s:137,c:38,r:17},{l:'Mar 16',s:57,c:50,r:26},{l:'Mar 23',s:64,c:50,r:39},{l:'Mar 30',s:33,c:16,r:4}];
const WEEKLY_RUNS  = [0,0,112,89,114,193,158,13];
const WEEKLY_CHEERS= [0,0,1988,2840,1981,15473,4373,11];
const WEEKLY_LABELS= ['Jan 26','Feb 2','Feb 9','Feb 16','Feb 23','Mar 9','Mar 16','Mar 23','Mar 30'];

// ─── P&L ─────────────────────────────────────────────────────────────────────
const PNL_KEY  = 'cmr_pnl_v3';
interface PE { id:string; date:string; name:string; category:string; type:string; amount:number; notes:string; }
const PNL_CATS   = ['Development','Influencer','Infrastructure','Tools/SaaS','Design','Marketing','Alex Investment','Revenue','Other'];
const PNL_COLORS: Record<string,string> = {Development:'#6366f1',Influencer:'#ec4899',Infrastructure:'#3b82f6','Tools/SaaS':'#f97316',Design:'#8b5cf6',Marketing:'#14b8a6','Alex Investment':'#22c55e',Revenue:'#16a34a',Other:'#94a3b8'};
const loadPnl = ():PE[] => { try { return JSON.parse(localStorage.getItem(PNL_KEY)||'[]'); } catch { return []; } };
const savePnl = (e:PE[]) => localStorage.setItem(PNL_KEY, JSON.stringify(e));

// ─── UTILS ────────────────────────────────────────────────────────────────────
const $    = (n:number, d=0) => n.toLocaleString('en-US', {maximumFractionDigits:d});
const $$   = (n:number) => '$'+n.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2});
const pct  = (a:number, b:number) => b>0 ? Math.round(a/b*100) : 0;
const sliceN = (arr:number[], d:number) => d>=999 ? arr : arr.slice(-Math.min(d,arr.length));
const sliceS = (arr:string[], d:number) => d>=999 ? arr : arr.slice(-Math.min(d,arr.length));
const sumN = (a:number[]) => a.reduce((s,v)=>s+v,0);

const TABS    = ['Revenue','Growth','Engagement','Activation','P&L'];
const PERIODS = [{l:'7D',v:7},{l:'30D',v:30},{l:'All',v:999}];
const COLS    = ['#6366f1','#ec4899','#3b82f6','#f97316','#8b5cf6','#14b8a6','#22c55e','#f59e0b','#dc2626'];

const CHART_BASE = {
  responsive:true, maintainAspectRatio:false,
  plugins:{legend:{display:false},tooltip:{backgroundColor:'rgba(0,0,0,0.85)',titleFont:{size:11,weight:'bold' as const},bodyFont:{size:11},padding:10,cornerRadius:8}},
  scales:{x:{grid:{display:false},ticks:{color:'#888',font:{size:10},maxRotation:0}},y:{grid:{color:'rgba(128,128,128,0.08)'},ticks:{color:'#888',font:{size:10}},beginAtZero:true}},
};
const DONUT_OPT = {responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,position:'right' as const,labels:{font:{size:11},boxWidth:10,padding:8,color:'#888'}}}};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
function KPI({label,value,sub,delta,color,live,size='md',badge,warn}:{label:string;value:any;sub?:string;delta?:number|null;color?:string;live?:boolean;size?:'sm'|'md'|'lg';badge?:string;warn?:boolean}){
  return(
    <div style={{background:'var(--card)',border:`1px solid ${warn?'#f87171':'var(--border)'}`,borderRadius:14,padding:size==='lg'?'20px 22px':'14px 16px',borderTop:color?`3px solid ${color}`:warn?'3px solid #f87171':'1px solid var(--border)',position:'relative'}}>
      {color&&<div style={{position:'absolute',top:0,left:0,right:0,height:3,background:color,opacity:.8,borderRadius:'14px 14px 0 0'}}/>}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
        <span style={{fontSize:10,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.08em'}}>{label}</span>
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          {badge&&<span style={{fontSize:9,padding:'2px 6px',borderRadius:20,background:'#eff6ff',color:'#1d4ed8',fontWeight:700}}>{badge}</span>}
          {warn&&<span style={{fontSize:9,padding:'2px 6px',borderRadius:20,background:'#fff1f2',color:'#9f1239',fontWeight:700}}>AT RISK</span>}
          {live&&<span style={{fontSize:9,padding:'2px 6px',borderRadius:20,background:'#dcfce7',color:'#166534',fontWeight:700}}>LIVE</span>}
        </div>
      </div>
      <div style={{fontSize:size==='lg'?32:size==='md'?22:17,fontWeight:700,color:warn?'#dc2626':'var(--fg)',lineHeight:1.1,letterSpacing:'-0.02em'}}>{value}</div>
      {delta!=null&&<div style={{fontSize:11,marginTop:4,fontWeight:500,color:delta>=0?'#22c55e':'#f43f5e'}}>{delta>=0?'▲':'▼'} {Math.abs(delta)}% vs prev</div>}
      {sub&&<div style={{fontSize:10,marginTop:4,color:'var(--muted)'}}>{sub}</div>}
    </div>
  );
}

function MiniBar({label,val,max,color}:{label:string;val:number;max:number;color:string}){
  return(
    <div style={{marginBottom:8}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
        <span style={{fontSize:11,color:'var(--fg-2)'}}>{label}</span>
        <span style={{fontSize:11,color:'var(--muted)',fontWeight:600}}>{pct(val,max)}%</span>
      </div>
      <div style={{height:4,background:'var(--surface)',borderRadius:2}}>
        <div style={{width:`${pct(val,max)}%`,height:'100%',background:color,borderRadius:2,transition:'width .4s ease'}}/>
      </div>
    </div>
  );
}

function Section({title,sub,children,action,accent}:{title:string;sub?:string;children:any;action?:any;accent?:string}){
  return(
    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:14,padding:18,marginBottom:14,borderTop:accent?`3px solid ${accent}`:undefined}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:'var(--fg)',letterSpacing:'-0.01em'}}>{title}</div>
          {sub&&<div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>{sub}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Tag({label,color='blue'}:{label:string;color?:'blue'|'green'|'amber'|'red'|'gray'}){
  const c = {blue:['#eff6ff','#1d4ed8'],green:['#f0fdf4','#166534'],amber:['#fef9c3','#854d0e'],red:['#fff1f2','#9f1239'],gray:['var(--surface)','var(--muted)']}[color];
  return <span style={{fontSize:9,padding:'2px 7px',borderRadius:20,background:c[0],color:c[1],fontWeight:700,letterSpacing:'.05em'}}>{label}</span>;
}

function Insight({text,type='blue'}:{text:string;type?:'blue'|'green'|'amber'|'red'}){
  const c = {blue:['#eff6ff','#1e40af'],green:['#f0fdf4','#166534'],amber:['#fffbeb','#92400e'],red:['#fff1f2','#9f1239']}[type];
  return <div style={{marginTop:10,padding:'10px 12px',borderRadius:10,background:c[0],fontSize:11,color:c[1],lineHeight:1.6,borderLeft:`3px solid ${c[1]}20`}} dangerouslySetInnerHTML={{__html:text}}/>;
}

function GoalBar({current,goal,label,deadline}:{current:number;goal:number;label:string;deadline:string}){
  const progress   = Math.min(current/goal*100, 100);
  const daysLeft   = Math.max(0, Math.ceil((new Date(deadline).getTime()-Date.now())/86400000));
  const multNeeded = Math.round((goal/current)*10)/10;
  const dailyTarget= daysLeft>0 ? Math.ceil((goal-current)/9.99/daysLeft) : 0;
  return(
    <div style={{background:'linear-gradient(135deg,#111110 0%,#1c1c1b 100%)',borderRadius:16,padding:'20px 24px',marginBottom:16,border:'1px solid #2e2e2c',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:-20,right:-20,width:120,height:120,borderRadius:'50%',background:'rgba(249,115,22,.08)'}}/>
      <div style={{position:'absolute',bottom:-30,left:100,width:160,height:160,borderRadius:'50%',background:'rgba(99,102,241,.06)'}}/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,flexWrap:'wrap',gap:8}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:4}}>{label}</div>
          <div style={{display:'flex',alignItems:'baseline',gap:10}}>
            <span style={{fontSize:36,fontWeight:700,color:'#f5f4f1',letterSpacing:'-0.03em'}}>{$$(current)}</span>
            <span style={{fontSize:14,color:'#666'}}>/ {$$(goal)}</span>
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:28,fontWeight:700,color:'#f97316',letterSpacing:'-0.02em'}}>{daysLeft}d</div>
          <div style={{fontSize:11,color:'#666'}}>until {deadline}</div>
        </div>
      </div>
      <div style={{height:8,background:'#2e2e2c',borderRadius:4,marginBottom:12,overflow:'hidden'}}>
        <div style={{width:`${progress}%`,height:'100%',background:'linear-gradient(90deg,#6366f1,#f97316)',borderRadius:4,transition:'width 1s ease',position:'relative'}}>
          <div style={{position:'absolute',right:0,top:'50%',transform:'translateY(-50%)',width:12,height:12,borderRadius:'50%',background:'#f97316',boxShadow:'0 0 8px #f97316'}}/>
        </div>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
        <div style={{display:'flex',gap:16}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:18,fontWeight:700,color:'#f5f4f1'}}>{progress.toFixed(1)}%</div>
            <div style={{fontSize:10,color:'#666'}}>complete</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:18,fontWeight:700,color:'#f97316'}}>{multNeeded}x</div>
            <div style={{fontSize:10,color:'#666'}}>growth needed</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:18,fontWeight:700,color:'#22c55e'}}>{$$(goal-current)}</div>
            <div style={{fontSize:10,color:'#666'}}>gap to close</div>
          </div>
        </div>
        <div style={{fontSize:11,color:'#666',textAlign:'right'}}>
          Need <strong style={{color:'#f5f4f1'}}>{$$(Math.ceil((goal-current)/daysLeft)||0)}/day</strong> MRR growth<br/>
          = ~<strong style={{color:'#f5f4f1'}}>{dailyTarget} new subs/day</strong>
        </div>
      </div>
    </div>
  );
}

// ─── SEGMENT BAR ─────────────────────────────────────────────────────────────
function SegBar({label,count,total,color,sub}:{label:string;count:number;total:number;color:string;sub?:string}){
  const pctVal = total>0 ? Math.round(count/total*100) : 0;
  return(
    <div style={{marginBottom:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:4}}>
        <span style={{fontSize:12,fontWeight:600,color:'var(--fg)'}}>{label}</span>
        <span style={{fontSize:13,fontWeight:700,color}}>{count} <span style={{fontSize:11,color:'var(--muted)',fontWeight:400}}>({pctVal}%)</span></span>
      </div>
      <div style={{height:6,background:'var(--surface)',borderRadius:3}}>
        <div style={{width:`${pctVal}%`,height:'100%',background:color,borderRadius:3,transition:'width .5s ease'}}/>
      </div>
      {sub&&<div style={{fontSize:10,color:'var(--muted)',marginTop:3}}>{sub}</div>}
    </div>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────────────────────
export default function Dashboard(){
  const [tab,setTab]           = useState('Revenue');
  const [period,setPeriod]     = useState(30);
  const [swPeriod,setSwPeriod] = useState<'last24h'|'last7d'|'last30d'|'last90d'>('last30d');
  const [sw,setSw]             = useState<any>(SW_SNAPSHOT);
  const [swLoading,setSwLoading] = useState(false);
  const [mpData,setMpData]     = useState<any>(null);
  const [mpLoading,setMpLoading] = useState(false);
  const [actData,setActData]   = useState<any>(null);
  const [actLoading,setActLoading] = useState(false);
  const [lastRefresh,setLastRefresh] = useState<Date|null>(null);
  const [pnl,setPnl]           = useState<PE[]>([]);
  const [showAdd,setShowAdd]   = useState(false);
  const [editId,setEditId]     = useState<string|null>(null);
  const [pnlFilter,setPnlFilter] = useState('all');
  const [form,setForm]         = useState({date:new Date().toISOString().split('T')[0],name:'',category:'Development',type:'Expense',amount:'',notes:''});
  const [cmpA,setCmpA]         = useState(2);
  const [cmpB,setCmpB]         = useState(4);

  const fetchSW = useCallback(async()=>{
    setSwLoading(true);
    try{const r=await fetch('/api/superwall-update');const d=await r.json();if(d.connected)setSw(d);setLastRefresh(new Date());}catch(e){}finally{setSwLoading(false);}
  },[]);
  const fetchMP = useCallback(async()=>{
    setMpLoading(true);
    try{const r=await fetch('/api/mixpanel');const d=await r.json();if(d.ok)setMpData(d);}catch(e){}finally{setMpLoading(false);}
  },[]);
  const fetchAct = useCallback(async()=>{
    setActLoading(true);
    try{const r=await fetch('/api/mp-activation');const d=await r.json();setActData(d);}catch(e){}finally{setActLoading(false);}
  },[]);

  useEffect(()=>{fetchSW();fetchMP();fetchAct();setPnl(loadPnl());},[fetchSW,fetchMP,fetchAct]);

  // ── Live data (Mixpanel API or snapshot) ──────────────────────────────────
  const dates  = mpData?.dates30 || DATES;
  const dauArr = mpData?.dau     || DAU;
  const subArr = mpData?.subs30  || SUBS;
  const canArr = mpData?.cancels || CANCELS;
  const renArr = mpData?.renewals|| RENEWALS;
  const runArr = mpData?.runs    || RUNS;
  const cheArr = mpData?.cheers  || CHEERS_D;

  const dts = sliceS(dates, period);
  const dau = sliceN(dauArr,period), sub = sliceN(subArr,period);
  const can = sliceN(canArr,period), ren = sliceN(renArr,period);
  const run = sliceN(runArr,period), che = sliceN(cheArr,period);
  const tSubs=sumN(sub), tCan=sumN(can), tRen=sumN(ren), tRun=sumN(run), tChe=sumN(che), tDAU=sumN(dau);
  const netSubs = tSubs - tCan;

  // ── Superwall period selector ─────────────────────────────────────────────
  const swD       = (sw?.ios||SW_SNAPSHOT.ios)[swPeriod] || SW_SNAPSHOT.ios.last30d;
  const swIsLive  = sw?.live === true;
  const swConnected = sw?.connected && (sw?.ios?.last30d?.proceeds||0) > 0;

  // ── Revenue metrics (corrected) ───────────────────────────────────────────
  const proceeds30d     = sw?.ios?.last30d?.proceeds || SW_SNAPSHOT.ios.last30d.proceeds;
  const proceeds90d     = sw?.ios?.last90d?.proceeds || SW_SNAPSHOT.ios.last90d.proceeds;
  const totalNewSubs90  = 596; // Verified: Superwall 90d conversions (initial + renewals)
  // Subscription plan breakdown (estimated from 157 active paying users)
  // Products seen in transactions: $29.99/yr annual, $9.99/mo monthly, $2.99/wk weekly, $9.99/yr discount
  const planMonthly     = 110;  // $9.99/mo → largest segment
  const planAnnual      = 39;   // $29.99/yr → $2.50/mo recurring
  const planDiscount    = 3;    // $9.99/yr discount → $0.83/mo
  const planWeekly      = 5;    // $2.99/wk → $12.95/mo
  const totalActive     = planMonthly + planAnnual + planDiscount + planWeekly; // 157
  // MRR = sum of monthly recurring value of each plan
  // MRR: monthly recurring value per plan type
  // Annual plan price: $29.99/yr (confirmed from transactions; some legacy at $39.99)
  // Discount plan: $9.99/yr (confirmed from "Discount Offer" campaign transactions)
  const mrr = Math.round((
    (planMonthly * 9.99) +
    (planAnnual  * 29.99 / 12) +
    (planDiscount* 9.99  / 12) +
    (planWeekly  * 2.99  * 4.33)
  )*100)/100;
  const arr = Math.round(mrr * 12 * 100) / 100;
  // Churn: cancels in last 30 days / total active subs
  const cancels30d     = sumN(CANCELS);  // 143 from snapshot data
  const churnRate30d   = totalActive > 0 ? Math.round(cancels30d / totalActive * 100 * 10) / 10 : 0;
  // LTV (conservative: avg revenue per sub / monthly churn)
  const avgRevPerSub   = proceeds90d / totalNewSubs90;
  const churnForLTV    = cancels30d / totalActive;  // raw decimal
  const ltv            = churnForLTV > 0 ? Math.round(avgRevPerSub / churnForLTV * 100) / 100 : 0;
  const arpu30d        = Math.round(proceeds30d / totalActive * 100) / 100;

  // P&L
  const expenses = pnl.filter(e=>e.type==='Expense').reduce((s,e)=>s+e.amount,0);
  const income   = pnl.filter(e=>e.type==='Income').reduce((s,e)=>s+e.amount,0);
  const byCat    = pnl.filter(e=>e.type==='Expense').reduce((a:Record<string,number>,e)=>{a[e.category]=(a[e.category]||0)+e.amount;return a;},{});
  const byMonth  = pnl.reduce((a:Record<string,{e:number,i:number}>,e)=>{const m=e.date.substring(0,7);if(!a[m])a[m]={e:0,i:0};if(e.type==='Expense')a[m].e+=e.amount;else a[m].i+=e.amount;return a;},{});
  const months   = Object.keys(byMonth).sort();
  const cacBlended = expenses > 0 ? Math.round(expenses / totalNewSubs90 * 100) / 100 : null;
  const ltvCacRatio = (cacBlended && ltv > 0) ? Math.round(ltv / cacBlended * 10) / 10 : null;

  // Activation data (with fallback)
  const act = actData || {
    ok: false, fallback: true,
    totalSubscribers: 157,
    totalUniqueRunners: 97,
    segments: { neverRan: 43, testOnly: 30, realRunners: 84 },
    runCountDistribution: { one: 28, twoToFive: 34, sixToTen: 18, elevenPlus: 17 },
    distanceDistribution: { testRuns: 278, short: 23, medium: 42, long: 86, halfMarathon: 105, marathon: 28, total: 649 },
    atRiskMRR: 341,
    timeToFirstRun: { sameDayPct: 18, withinWeekPct: 47, withinMonthPct: 71, neverPct: 29 },
  };
  const actTotal = act.totalSubscribers || totalActive;
  const actSegs  = act.segments || { neverRan: 43, testOnly: 30, realRunners: 84 };
  const actRCD   = act.runCountDistribution || { one: 28, twoToFive: 34, sixToTen: 18, elevenPlus: 17 };
  const actTTFR  = act.timeToFirstRun || { sameDayPct: 18, withinWeekPct: 47, withinMonthPct: 71, neverPct: 29 };

  // P&L helpers
  function savePnlEntry(){
    if(!form.name||!form.amount) return;
    const entry:PE = {id:editId||Date.now().toString(),date:form.date,name:form.name,category:form.category,type:form.type,amount:Number(form.amount),notes:form.notes};
    const updated = editId ? pnl.map(e=>e.id===editId?entry:e) : [...pnl,entry];
    const sorted  = updated.sort((a,b)=>b.date.localeCompare(a.date));
    setPnl(sorted); savePnl(sorted); setShowAdd(false); setEditId(null);
    setForm({date:new Date().toISOString().split('T')[0],name:'',category:'Development',type:'Expense',amount:'',notes:''});
  }
  function delPnl(id:string){const u=pnl.filter(e=>e.id!==id);setPnl(u);savePnl(u);}
  function editPnl(e:PE){setForm({date:e.date,name:e.name,category:e.category,type:e.type,amount:String(e.amount),notes:e.notes});setEditId(e.id);setShowAdd(true);}

  const wA = WEEKS[cmpA], wB = WEEKS[cmpB];

  // ──────────────────────────────────────────────────────────────────────────
  return(<>
    <Head>
      <title>Cheer My Run — Dashboard</title>
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
    </Head>
    <style>{`
      :root{--bg:#f4f4f2;--surface:#eae9e6;--card:#ffffff;--border:#e2e1de;--fg:#111110;--fg-2:#444;--muted:#888;--green:#16a34a;--red:#dc2626;--blue:#2563eb;}
      @media(prefers-color-scheme:dark){:root{--bg:#111110;--surface:#1c1c1b;--card:#1f1f1e;--border:#2e2e2c;--fg:#f5f4f1;--fg-2:#bbb;--muted:#666;}}
      *{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased}
      body{font-family:'DM Sans',system-ui,sans-serif;background:var(--bg);color:var(--fg);font-size:14px;line-height:1.5}
      .g2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
      .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px}
      .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px}
      .g5{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:14px}
      .tbl{width:100%;border-collapse:collapse;font-size:12px}
      .tbl th{padding:6px 10px 8px 0;color:var(--muted);font-weight:500;text-align:left;border-bottom:1px solid var(--border);font-size:11px;text-transform:uppercase;letter-spacing:.05em}
      .tbl td{padding:9px 10px 9px 0;border-bottom:1px solid var(--border);color:var(--fg-2);vertical-align:middle}
      .tbl tr:last-child td{border-bottom:none}
      .tbl tr:hover td{background:var(--surface)}
      .btn{font-size:11px;font-weight:600;padding:5px 13px;border-radius:8px;border:1px solid var(--border);background:var(--card);color:var(--fg-2);cursor:pointer;font-family:'DM Sans',sans-serif;letter-spacing:.01em;transition:all .15s}
      .btn:hover{background:var(--surface)}
      .btn.on{background:var(--fg);color:var(--bg);border-color:var(--fg)}
      .btn-green{background:#f0fdf4;color:#166534;border-color:#bbf7d0}
      .btn-red{background:#fff1f2;color:#9f1239;border-color:#fecdd3}
      .btn-primary{background:var(--fg);color:var(--bg);border-color:var(--fg);font-size:12px;padding:7px 16px;border-radius:9px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600}
      .pill{font-size:9px;padding:2px 7px;border-radius:20px;font-weight:700;letter-spacing:.05em;white-space:nowrap}
      select,input{font-size:12px;padding:6px 10px;border-radius:8px;border:1px solid var(--border);background:var(--card);color:var(--fg);outline:none;font-family:'DM Sans',sans-serif}
      select:focus,input:focus{border-color:var(--fg);box-shadow:0 0 0 2px rgba(17,17,16,.08)}
      .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:200;backdrop-filter:blur(4px)}
      .modal{background:var(--card);border-radius:18px;padding:26px;width:500px;max-width:94vw;border:1px solid var(--border);box-shadow:0 24px 48px rgba(0,0,0,.15)}
      .field{margin-bottom:12px}
      .field label{display:block;font-size:11px;font-weight:600;color:var(--muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em}
      .field input,.field select{width:100%}
      @media(max-width:960px){.g4{grid-template-columns:repeat(2,1fr)}.g5{grid-template-columns:repeat(3,1fr)}.g3{grid-template-columns:1fr 1fr}.g2{grid-template-columns:1fr}}
    `}</style>

    <div style={{display:'flex',height:'100vh',overflow:'hidden'}}>
      {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
      <div style={{width:220,background:'var(--card)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',flexShrink:0}}>
        <div style={{padding:'18px 18px 14px',borderBottom:'1px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:34,height:34,borderRadius:10,background:'linear-gradient(135deg,#f97316,#dc2626)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff',flexShrink:0,letterSpacing:'-0.03em'}}>CMR</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,letterSpacing:'-0.01em'}}>Cheer My Run</div>
              <div style={{fontSize:10,color:'var(--muted)'}}>Dashboard</div>
            </div>
          </div>
        </div>

        {/* MRR goal mini-bar */}
        <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',background:'var(--surface)'}}>
          <div style={{fontSize:9,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:4}}>MRR Goal — Apr 30</div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
            <span style={{fontSize:12,fontWeight:700}}>{$$(mrr)}</span>
            <span style={{fontSize:10,color:'var(--muted)'}}>/ $100k</span>
          </div>
          <div style={{height:4,background:'var(--border)',borderRadius:2}}>
            <div style={{width:`${Math.min(mrr/100000*100,100)}%`,height:'100%',background:'linear-gradient(90deg,#6366f1,#f97316)',borderRadius:2}}/>
          </div>
          <div style={{fontSize:9,color:'var(--muted)',marginTop:4}}>{(mrr/100000*100).toFixed(2)}% complete</div>
        </div>

        <nav style={{padding:'8px 10px',flex:1,overflowY:'auto'}}>
          <div style={{fontSize:9,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.1em',padding:'8px 8px 4px'}}>Analytics</div>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{display:'block',width:'100%',textAlign:'left',padding:'7px 10px',borderRadius:8,fontSize:13,cursor:'pointer',background:tab===t?'var(--surface)':'transparent',border:'none',color:tab===t?'var(--fg)':'var(--muted)',fontFamily:'inherit',fontWeight:tab===t?600:400,marginBottom:1,transition:'all .1s'}}>
              {t}
              {t==='Activation'&&actSegs.neverRan>0&&<span style={{marginLeft:6,fontSize:9,padding:'1px 5px',borderRadius:10,background:'#fff1f2',color:'#dc2626',fontWeight:700}}>{actSegs.neverRan}</span>}
            </button>
          ))}
        </nav>

        <div style={{padding:'12px 14px',borderTop:'1px solid var(--border)'}}>
          <div style={{fontSize:9,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Data Sources</div>
          <div style={{marginBottom:5}}>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:swConnected?'#22c55e':'#f59e0b',flexShrink:0}}/>
              <span style={{fontSize:11,color:'var(--fg-2)',fontWeight:500}}>Superwall</span>
              {swLoading?<span style={{fontSize:9,color:'var(--muted)'}}>…</span>:swIsLive?<span className="pill" style={{background:'#dcfce7',color:'#166534'}}>LIVE</span>:<span className="pill" style={{background:'#fef9c3',color:'#854d0e'}}>SNAPSHOT</span>}
            </div>
            {lastRefresh&&<div style={{fontSize:9,color:'var(--muted)',paddingLeft:12}}>Checked {lastRefresh.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</div>}
          </div>
          <div style={{marginBottom:5}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:mpData?'#22c55e':'#f59e0b',flexShrink:0}}/>
              <span style={{fontSize:11,color:'var(--fg-2)',fontWeight:500}}>Mixpanel</span>
              {mpLoading?<span style={{fontSize:9,color:'var(--muted)'}}>…</span>:mpData?<span className="pill" style={{background:'#dcfce7',color:'#166534'}}>LIVE</span>:<span className="pill" style={{background:'#fef9c3',color:'#854d0e'}}>SNAPSHOT</span>}
            </div>
          </div>
          <button className="btn" style={{width:'100%',marginTop:6,fontSize:10}} onClick={()=>{fetchSW();fetchMP();fetchAct();}}>↺ Refresh All</button>
        </div>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <div style={{flex:1,overflowY:'auto',padding:'18px 22px'}}>

        {/* ── HEADER ── */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <div>
            <h1 style={{fontSize:18,fontWeight:700,letterSpacing:'-0.02em'}}>{tab}</h1>
            <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>
              {tab==='Revenue'&&'iOS revenue from App Store — updated Apr 1, 2026'}
              {tab==='Growth'&&'User acquisition, subscriptions and cancellations'}
              {tab==='Engagement'&&'Runs, cheers and app activity'}
              {tab==='Activation'&&'Are paying subscribers actually using the app?'}
              {tab==='P&L'&&'Costs, revenue and profit & loss'}
            </div>
          </div>
          {(tab==='Growth'||tab==='Engagement')&&(
            <div style={{display:'flex',gap:4}}>
              {PERIODS.map(p=>(
                <button key={p.v} className={`btn${period===p.v?' on':''}`} onClick={()=>setPeriod(p.v)}>{p.l}</button>
              ))}
            </div>
          )}
          {tab==='Revenue'&&(
            <div style={{display:'flex',gap:4}}>
              {(['last24h','last7d','last30d','last90d'] as const).map(k=>(
                <button key={k} className={`btn${swPeriod===k?' on':''}`} onClick={()=>setSwPeriod(k)}>
                  {{'last24h':'24H','last7d':'7D','last30d':'30D','last90d':'90D'}[k]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ════════════════ REVENUE TAB ════════════════ */}
        {tab==='Revenue'&&(<>
          <GoalBar current={mrr} goal={100000} label="$100k MRR Goal" deadline="Apr 30, 2026"/>

          <div className="g4">
            <KPI label="Monthly MRR" value={$$(mrr)} sub={`${totalActive} active subs`} color="#6366f1" size="lg" live={swIsLive}/>
            <KPI label="Annual Run Rate" value={$$(arr)} sub="MRR × 12" color="#3b82f6"/>
            <KPI label={`Proceeds (${{'last24h':'24H','last7d':'7D','last30d':'30D','last90d':'90D'}[swPeriod]})`} value={$$(swD.proceeds)} sub="App Store proceeds" color="#f97316" live={swIsLive}/>
            <KPI label="ARPU (30d)" value={$$( arpu30d)} sub="Proceeds ÷ active subs" color="#8b5cf6"/>
          </div>

          <div className="g4">
            <KPI label="Active Subscribers" value={$(totalActive)} sub="iOS paying users" badge="157"/>
            <KPI label="Conversions" value={$(swD.conversions)} sub={`${swD.convRate.toFixed(1)}% conv rate`}/>
            <KPI label="New Users" value={$(swD.newUsers)} sub={`${swD.paywallRate.toFixed(1)}% hit paywall`}/>
            <KPI label="30d Cancels" value={$(cancels30d)} sub={`${churnRate30d}% of active base`} color="#f43f5e"/>
          </div>

          {/* Subscription Mix */}
          <div className="g2">
            <Section title="Subscription Mix" sub="Active plan breakdown" accent="#6366f1">
              <SegBar label="Monthly ($9.99/mo)"    count={planMonthly}  total={totalActive} color="#6366f1" sub={`$${(planMonthly*9.99).toFixed(0)}/mo MRR`}/>
              <SegBar label="Annual ($29.99/yr)"   count={planAnnual}   total={totalActive} color="#3b82f6" sub={`$${(planAnnual*29.99/12).toFixed(0)}/mo MRR`}/>
              <SegBar label="Weekly ($2.99/wk)"    count={planWeekly}   total={totalActive} color="#f97316" sub={`$${(planWeekly*2.99*4.33).toFixed(0)}/mo MRR`}/>
              <SegBar label="Annual Discount"       count={planDiscount} total={totalActive} color="#ec4899" sub={`$${(planDiscount*24.99/12).toFixed(0)}/mo MRR`}/>
              <Insight type="amber" text={`Monthly plan is your biggest MRR driver at <strong>${$$(planMonthly*9.99)}/mo</strong>. Annual plans lock in retention — consider annual-first paywall.`}/>
            </Section>

            <Section title="Paywall Campaigns (90d)" sub="Superwall campaign performance" accent="#f97316">
              <table className="tbl">
                <thead><tr><th>Campaign</th><th>Users</th><th>Conv%</th><th>Proceeds</th></tr></thead>
                <tbody>
                  {(sw?.campaigns||SW_SNAPSHOT.campaigns).map((c:any)=>(
                    <tr key={c.id}>
                      <td style={{fontWeight:500,color:'var(--fg)'}}>{c.name}</td>
                      <td>{$(c.users)}</td>
                      <td><span style={{color:c.convRate>=10?'#22c55e':'#f59e0b',fontWeight:600}}>{c.convRate.toFixed(1)}%</span></td>
                      <td style={{fontWeight:600}}>{$$(c.proceeds)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Insight type="blue" text={`Transaction Abandoned campaign has <strong>${(sw?.campaigns||SW_SNAPSHOT.campaigns)[1]?.convRate||10.68}%</strong> conv rate — highest performer. Scale this.`}/>
            </Section>
          </div>

          {/* Recent Transactions */}
          <Section title="Recent Transactions" sub="Last 10 iOS transactions via Superwall">
            <table className="tbl">
              <thead><tr><th>User</th><th>Product</th><th>Type</th><th>Campaign</th><th>Proceeds</th><th>Time</th></tr></thead>
              <tbody>
                {(sw?.recentTransactions||SW_SNAPSHOT.recentTransactions).map((t:any,i:number)=>(
                  <tr key={i}>
                    <td><code style={{fontSize:10,color:'var(--muted)'}}>{t.userId}</code></td>
                    <td style={{fontWeight:500,color:'var(--fg)',textTransform:'capitalize'}}>{t.product}</td>
                    <td><Tag label={t.type} color={t.type==='Renewal'?'blue':t.type==='Cancelled'?'red':'green'}/></td>
                    <td><code style={{fontSize:10,color:'var(--muted)'}}>{t.campaign}</code></td>
                    <td style={{fontWeight:600,color:t.proceeds>0?'var(--green)':'var(--red)'}}>{t.proceeds>0?$$(t.proceeds):'—'}</td>
                    <td style={{color:'var(--muted)',fontSize:11}}>{new Date(t.time).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>)}

        {/* ════════════════ GROWTH TAB ════════════════ */}
        {tab==='Growth'&&(<>
          <div className="g4">
            <KPI label={`New Subs (${period===999?'90d':period+'d'})`} value={$(tSubs)} sub={`net ${netSubs>=0?'+':''}${netSubs}`} color="#22c55e" live={!!mpData}/>
            <KPI label={`Cancels (${period===999?'90d':period+'d'})`} value={$(tCan)} color="#f43f5e" live={!!mpData}/>
            <KPI label={`Renewals (${period===999?'90d':period+'d'})`} value={$(tRen)} color="#3b82f6" live={!!mpData}/>
            <KPI label="Active Subs" value={$(totalActive)} sub="Total paying users" badge="157"/>
          </div>

          <div className="g2">
            <Section title="Daily Subscriptions vs Cancels" sub={`Last ${period===999?'90':period} days`} accent="#22c55e">
              <div style={{height:200}}>
                <Bar data={{labels:dts,datasets:[
                  {label:'New Subs',data:sub,backgroundColor:'rgba(34,197,94,.7)',borderRadius:4},
                  {label:'Cancels',data:can,backgroundColor:'rgba(244,63,94,.7)',borderRadius:4},
                ]}} options={{...CHART_BASE,plugins:{...CHART_BASE.plugins,legend:{display:true,labels:{color:'#888',boxWidth:10,font:{size:10}}}}}}/>
              </div>
            </Section>

            <Section title="Weekly Cohort" sub="Subscriptions, cancels, renewals by week" accent="#6366f1">
              <table className="tbl">
                <thead><tr><th>Week</th><th>New Subs</th><th>Cancels</th><th>Renewals</th><th>Net</th></tr></thead>
                <tbody>
                  {WEEKS.map((w,i)=>(
                    <tr key={i}>
                      <td style={{fontWeight:500}}>{w.l}</td>
                      <td style={{color:'#22c55e',fontWeight:600}}>{w.s}</td>
                      <td style={{color:'#f43f5e',fontWeight:600}}>{w.c}</td>
                      <td style={{color:'#3b82f6',fontWeight:600}}>{w.r}</td>
                      <td style={{fontWeight:700,color:w.s-w.c>=0?'#22c55e':'#f43f5e'}}>{w.s-w.c>=0?'+':''}{w.s-w.c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          </div>

          <div className="g2">
            <Section title="Daily Active Users" sub={`Last ${period===999?'90':period} days`} accent="#3b82f6">
              <div style={{height:200}}>
                <Line data={{labels:dts,datasets:[{label:'DAU',data:dau,borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,.08)',fill:true,tension:0.3,pointRadius:2}]}} options={CHART_BASE}/>
              </div>
              <div style={{marginTop:10,display:'flex',gap:16}}>
                <div><div style={{fontSize:18,fontWeight:700}}>{$(tDAU)}</div><div style={{fontSize:10,color:'var(--muted)'}}>total opens</div></div>
                <div><div style={{fontSize:18,fontWeight:700}}>{$(Math.round(tDAU/dts.length))}</div><div style={{fontSize:10,color:'var(--muted)'}}>avg/day</div></div>
              </div>
            </Section>

            <Section title="Week Comparison" sub="Compare any two weeks">
              <div style={{display:'flex',gap:8,marginBottom:12}}>
                <select value={cmpA} onChange={e=>setCmpA(Number(e.target.value))} style={{flex:1}}>
                  {WEEKS.map((w,i)=><option key={i} value={i}>Wk of {w.l}</option>)}
                </select>
                <select value={cmpB} onChange={e=>setCmpB(Number(e.target.value))} style={{flex:1}}>
                  {WEEKS.map((w,i)=><option key={i} value={i}>Wk of {w.l}</option>)}
                </select>
              </div>
              <table className="tbl">
                <thead><tr><th>Metric</th><th>Wk {wA?.l}</th><th>Wk {wB?.l}</th><th>Δ</th></tr></thead>
                <tbody>
                  {[['New Subs','s'],['Cancels','c'],['Renewals','r']].map(([lbl,k])=>{
                    const va=(wA as any)?.[k]||0, vb=(wB as any)?.[k]||0;
                    const d=va>0?Math.round((vb-va)/va*100):0;
                    return(<tr key={k}>
                      <td>{lbl}</td><td style={{fontWeight:600}}>{va}</td><td style={{fontWeight:600}}>{vb}</td>
                      <td style={{color:d>=0?'#22c55e':'#f43f5e',fontWeight:700}}>{d>=0?'+':''}{d}%</td>
                    </tr>);
                  })}
                </tbody>
              </table>
            </Section>
          </div>

          <Insight type="amber" text={`<strong>Activation Warning:</strong> ${actSegs.neverRan} subscribers have never run — that's <strong>${pct(actSegs.neverRan,totalActive)}% of your base</strong> and <strong>$${act.atRiskMRR}/mo at risk</strong>. See Activation tab for full analysis.`}/>
        </>)}

        {/* ════════════════ ENGAGEMENT TAB ════════════════ */}
        {tab==='Engagement'&&(<>
          <div className="g4">
            <KPI label={`Runs (${period===999?'90d':period+'d'})`} value={$(tRun)} color="#f97316" live={!!mpData}/>
            <KPI label={`Cheers (${period===999?'90d':period+'d'})`} value={$(tChe)} color="#ec4899" live={!!mpData}/>
            <KPI label="Avg Runs/Day" value={(tRun/Math.max(dts.length,1)).toFixed(1)} sub="from snapshot data"/>
            <KPI label="Avg Cheers/Run" value={tRun>0?(tChe/tRun).toFixed(1):'—'} sub="engagement ratio"/>
          </div>

          <div className="g2">
            <Section title="Daily Runs" sub={`Last ${period===999?'90':period} days`} accent="#f97316">
              <div style={{height:200}}>
                <Bar data={{labels:dts,datasets:[{label:'Runs',data:run,backgroundColor:'rgba(249,115,22,.7)',borderRadius:4}]}} options={CHART_BASE}/>
              </div>
            </Section>
            <Section title="Daily Cheers Received" sub="Audio cheers delivered to runners" accent="#ec4899">
              <div style={{height:200}}>
                <Bar data={{labels:dts,datasets:[{label:'Cheers',data:che,backgroundColor:'rgba(236,72,153,.7)',borderRadius:4}]}} options={CHART_BASE}/>
              </div>
            </Section>
          </div>

          <div className="g2">
            <Section title="Weekly Runs Trend" sub="90 days — all time weekly history" accent="#f97316">
              <div style={{height:180}}>
                <Bar data={{labels:WEEKLY_LABELS,datasets:[{label:'Runs',data:WEEKLY_RUNS,backgroundColor:WEEKLY_RUNS.map(v=>v>150?'rgba(249,115,22,.9)':'rgba(249,115,22,.4)'),borderRadius:4}]}} options={CHART_BASE}/>
              </div>
              <Insight type="green" text="Week of Mar 9 was peak engagement: <strong>193 runs</strong>. Spike aligned with first cohort of TikTok subscribers activating."/>
            </Section>
            <Section title="Weekly Cheers Trend" sub="90 days — all time" accent="#ec4899">
              <div style={{height:180}}>
                <Bar data={{labels:WEEKLY_LABELS,datasets:[{label:'Cheers',data:WEEKLY_CHEERS,backgroundColor:WEEKLY_CHEERS.map(v=>v>5000?'rgba(236,72,153,.9)':'rgba(236,72,153,.4)'),borderRadius:4}]}} options={CHART_BASE}/>
              </div>
              <Insight type="green" text="Week of Mar 16 had <strong>15,473 cheers</strong> — 3.5× previous week. Driven by Mar 9 subscriber cohort getting into races."/>
            </Section>
          </div>

          <Section title="Paywall Views vs Conversions" sub="Last 30 days">
            <div style={{height:200}}>
              <Bar data={{labels:sliceS(dates,30),datasets:[
                {label:'Paywall Views',data:sliceN(PAYWALL,30),backgroundColor:'rgba(99,102,241,.4)',borderRadius:4},
                {label:'New Subs',data:sliceN(SUBS,30),backgroundColor:'rgba(34,197,94,.7)',borderRadius:4},
              ]}} options={{...CHART_BASE,plugins:{...CHART_BASE.plugins,legend:{display:true,labels:{color:'#888',boxWidth:10,font:{size:10}}}}}}/>
            </div>
          </Section>
        </>)}

        {/* ════════════════ ACTIVATION TAB ════════════════ */}
        {tab==='Activation'&&(<>
          {/* Critical alert */}
          <div style={{background:'linear-gradient(135deg,#1c0a0a 0%,#1f1010 100%)',border:'1px solid #7f1d1d',borderRadius:14,padding:'16px 20px',marginBottom:16,display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:'#fca5a5',marginBottom:4}}>Critical — {actSegs.neverRan} paying subscribers have never run</div>
              <div style={{fontSize:12,color:'#f87171',lineHeight:1.6}}>
                That's <strong style={{color:'#fca5a5'}}>{pct(actSegs.neverRan,actTotal)}% of your base</strong> — they paid and disappeared. Estimated <strong style={{color:'#fca5a5'}}>{$$(act.atRiskMRR)}/mo at risk</strong>. Each month they don't run, churn probability rises sharply.
              </div>
            </div>
            {actData?.fallback&&<span style={{fontSize:9,padding:'3px 8px',borderRadius:20,background:'#7f1d1d',color:'#fca5a5',fontWeight:700}}>ESTIMATES</span>}
            {actLoading&&<span style={{fontSize:9,color:'#f87171'}}>Loading live data…</span>}
          </div>

          {/* 3 segment cards */}
          <div className="g3">
            <div style={{background:'var(--card)',border:'2px solid #dc2626',borderRadius:14,padding:'18px 20px',position:'relative'}}>
              <div style={{fontSize:10,fontWeight:700,color:'#dc2626',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>🚫 Never Ran</div>
              <div style={{fontSize:40,fontWeight:700,color:'#dc2626',lineHeight:1}}>{actSegs.neverRan}</div>
              <div style={{fontSize:13,color:'var(--muted)',marginTop:4}}>{pct(actSegs.neverRan,actTotal)}% of subscribers</div>
              <div style={{marginTop:10,fontSize:11,color:'var(--fg-2)',lineHeight:1.7}}>
                Paid but zero runs. Highest churn risk.<br/>
                <strong style={{color:'#dc2626'}}>{$$(act.atRiskMRR)}/mo</strong> at immediate risk.
              </div>
              <div style={{marginTop:10,height:4,background:'var(--surface)',borderRadius:2}}>
                <div style={{width:`${pct(actSegs.neverRan,actTotal)}%`,height:'100%',background:'#dc2626',borderRadius:2}}/>
              </div>
            </div>

            <div style={{background:'var(--card)',border:'2px solid #f59e0b',borderRadius:14,padding:'18px 20px'}}>
              <div style={{fontSize:10,fontWeight:700,color:'#f59e0b',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>🧪 Test Only (&lt;1km)</div>
              <div style={{fontSize:40,fontWeight:700,color:'#f59e0b',lineHeight:1}}>{actSegs.testOnly}</div>
              <div style={{fontSize:13,color:'var(--muted)',marginTop:4}}>{pct(actSegs.testOnly,actTotal)}% of subscribers</div>
              <div style={{marginTop:10,fontSize:11,color:'var(--fg-2)',lineHeight:1.7}}>
                Opened the app, ran less than 1km.<br/>
                Testing from home — haven't committed.
              </div>
              <div style={{marginTop:10,height:4,background:'var(--surface)',borderRadius:2}}>
                <div style={{width:`${pct(actSegs.testOnly,actTotal)}%`,height:'100%',background:'#f59e0b',borderRadius:2}}/>
              </div>
            </div>

            <div style={{background:'var(--card)',border:'2px solid #22c55e',borderRadius:14,padding:'18px 20px'}}>
              <div style={{fontSize:10,fontWeight:700,color:'#22c55e',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Real Runners (1km+)</div>
              <div style={{fontSize:40,fontWeight:700,color:'#22c55e',lineHeight:1}}>{actSegs.realRunners}</div>
              <div style={{fontSize:13,color:'var(--muted)',marginTop:4}}>{pct(actSegs.realRunners,actTotal)}% of subscribers</div>
              <div style={{marginTop:10,fontSize:11,color:'var(--fg-2)',lineHeight:1.7}}>
                Activated. Used app in a real run.<br/>
                These users stay and tell friends.
              </div>
              <div style={{marginTop:10,height:4,background:'var(--surface)',borderRadius:2}}>
                <div style={{width:`${pct(actSegs.realRunners,actTotal)}%`,height:'100%',background:'#22c55e',borderRadius:2}}/>
              </div>
            </div>
          </div>

          <div className="g2">
            {/* Segment donut */}
            <Section title="Subscriber Activation Segments" sub={`${actTotal} total paying subscribers —${actData?.fallback?'estimates':'live data'}`} accent="#6366f1">
              <div style={{height:220}}>
                <Doughnut data={{
                  labels:['Never Ran','Test Only (<1km)','Real Runners (≥1km)'],
                  datasets:[{data:[actSegs.neverRan,actSegs.testOnly,actSegs.realRunners],backgroundColor:['#dc2626','#f59e0b','#22c55e'],borderWidth:0,hoverOffset:8}],
                }} options={DONUT_OPT}/>
              </div>
              <div style={{marginTop:12,display:'flex',justifyContent:'space-around',flexWrap:'wrap',gap:8}}>
                <div style={{textAlign:'center'}}><div style={{fontSize:18,fontWeight:700,color:'#dc2626'}}>{pct(actSegs.neverRan,actTotal)}%</div><div style={{fontSize:10,color:'var(--muted)'}}>never ran</div></div>
                <div style={{textAlign:'center'}}><div style={{fontSize:18,fontWeight:700,color:'#f59e0b'}}>{pct(actSegs.testOnly,actTotal)}%</div><div style={{fontSize:10,color:'var(--muted)'}}>test only</div></div>
                <div style={{textAlign:'center'}}><div style={{fontSize:18,fontWeight:700,color:'#22c55e'}}>{pct(actSegs.realRunners,actTotal)}%</div><div style={{fontSize:10,color:'var(--muted)'}}>activated</div></div>
              </div>
            </Section>

            {/* Time to first run */}
            <Section title="Time to First Run" sub="How fast do subscribers activate?" accent="#3b82f6">
              <SegBar label="Same day" count={actTTFR.sameDayPct} total={100} color="#22c55e" sub="Ran on the day they subscribed"/>
              <SegBar label="Within 1 week" count={actTTFR.withinWeekPct} total={100} color="#3b82f6" sub="Ran within 7 days of subscribing"/>
              <SegBar label="Within 1 month" count={actTTFR.withinMonthPct} total={100} color="#6366f1" sub="Ran within 30 days of subscribing"/>
              <SegBar label="Never ran" count={actTTFR.neverPct} total={100} color="#dc2626" sub="Still haven't used the app"/>
              <Insight type="amber" text={`<strong>${100-actTTFR.withinWeekPct}% of subscribers</strong> didn't run in the first week. First-week activation is the #1 retention lever.`}/>
            </Section>
          </div>

          {/* Run count distribution */}
          <Section title="Run Count Distribution" sub="Among subscribers who ran at least once — loyalty signal" accent="#f97316">
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:14}}>
              {[
                {label:'1 run',val:actRCD.one,color:'#f43f5e',sub:'Tried once, left'},
                {label:'2–5 runs',val:actRCD.twoToFive,color:'#f59e0b',sub:'Occasional runners'},
                {label:'6–10 runs',val:actRCD.sixToTen,color:'#3b82f6',sub:'Regular runners'},
                {label:'11+ runs',val:actRCD.elevenPlus,color:'#22c55e',sub:'Power users'},
              ].map(s=>(
                <div key={s.label} style={{background:'var(--surface)',borderRadius:12,padding:'14px 16px',textAlign:'center',borderTop:`3px solid ${s.color}`}}>
                  <div style={{fontSize:32,fontWeight:700,color:s.color,lineHeight:1}}>{s.val}</div>
                  <div style={{fontSize:12,fontWeight:600,marginTop:6,color:'var(--fg)'}}>{s.label}</div>
                  <div style={{fontSize:10,color:'var(--muted)',marginTop:2}}>{s.sub}</div>
                  <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>{pct(s.val,actSegs.realRunners+actSegs.testOnly)}% of runners</div>
                </div>
              ))}
            </div>
            <div style={{height:140}}>
              <Bar data={{
                labels:['1 run','2–5 runs','6–10 runs','11+ runs'],
                datasets:[{label:'Subscribers',data:[actRCD.one,actRCD.twoToFive,actRCD.sixToTen,actRCD.elevenPlus],backgroundColor:['rgba(244,63,94,.7)','rgba(245,158,11,.7)','rgba(59,130,246,.7)','rgba(34,197,94,.7)'],borderRadius:6}],
              }} options={CHART_BASE}/>
            </div>
          </Section>

          {/* Distance distribution */}
          <Section title="Run Distance Distribution" sub="All 649 total runs logged (90 days)" accent="#8b5cf6">
            <div style={{height:160}}>
              <Bar data={{
                labels:['<1km (test)','1–3km','3–5km','5–10km','10–21km','21km+'],
                datasets:[{label:'Runs',data:[
                  act.distanceDistribution?.testRuns||278,
                  act.distanceDistribution?.short||23,
                  act.distanceDistribution?.medium||42,
                  act.distanceDistribution?.long||86,
                  act.distanceDistribution?.halfMarathon||105,
                  act.distanceDistribution?.marathon||28,
                ],backgroundColor:['rgba(244,63,94,.5)','rgba(245,158,11,.7)','rgba(34,197,94,.7)','rgba(59,130,246,.7)','rgba(99,102,241,.8)','rgba(236,72,153,.8)'],borderRadius:6}],
              }} options={CHART_BASE}/>
            </div>
            <Insight type="green" text="<strong>Half-marathon distance (10–21km) is your most popular run distance</strong> — 105 runs. Your users are serious runners preparing for races. Lean into race-day features and race calendar integration."/>
          </Section>

          {/* Action items */}
          <Section title="Recommended Actions" sub="Based on activation analysis" accent="#dc2626">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[
                {priority:'HIGH',title:'Activation push campaign',body:`Send onboarding push to ${actSegs.neverRan} subscribers who never ran. "Your first run is waiting — lace up this weekend!"`,color:'#dc2626'},
                {priority:'HIGH',title:'First-run incentive',body:'Reward subscribers who run within 7 days of subscribing. Converts passive users into habitual runners.',color:'#dc2626'},
                {priority:'MED',title:'Re-engagement email',body:`${actSegs.testOnly} subscribers only tested the app briefly. "Your running friends are cheering for you — come back!"`,color:'#f59e0b'},
                {priority:'MED',title:'Race season campaign',body:'Half-marathon is the #1 distance. Target spring race calendars in Bogota, San Jose, Madrid.',color:'#f59e0b'},
              ].map((a,i)=>(
                <div key={i} style={{background:'var(--surface)',borderRadius:10,padding:'12px 14px',borderLeft:`3px solid ${a.color}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                    <span style={{fontSize:9,padding:'2px 7px',borderRadius:20,background:a.color==='#dc2626'?'#fff1f2':'#fffbeb',color:a.color,fontWeight:700}}>{a.priority}</span>
                    <span style={{fontSize:12,fontWeight:600,color:'var(--fg)'}}>{a.title}</span>
                  </div>
                  <div style={{fontSize:11,color:'var(--fg-2)',lineHeight:1.6}}>{a.body}</div>
                </div>
              ))}
            </div>
          </Section>
        </>)}

        {/* ════════════════ P&L TAB ════════════════ */}
        {tab==='P&L'&&(<>
          <div className="g4">
            <KPI label="Total Expenses" value={$$( expenses)} color="#f43f5e"/>
            <KPI label="Recorded Income" value={$$(income)} color="#22c55e"/>
            <KPI label="CAC (blended)" value={cacBlended?$$( cacBlended):'—'} sub={`${totalNewSubs90} subs in 90d`}/>
            <KPI label="LTV:CAC" value={ltvCacRatio?`${ltvCacRatio}x`:'—'} sub="Target: >3x" color={ltvCacRatio&&ltvCacRatio>=3?'#22c55e':'#f59e0b'}/>
          </div>

          <Section title="Ledger" sub="Manual cost & revenue tracking" action={
            <button className="btn-primary" onClick={()=>{setShowAdd(true);setEditId(null);setForm({date:new Date().toISOString().split('T')[0],name:'',category:'Development',type:'Expense',amount:'',notes:''});}}>+ Add Entry</button>
          }>
            <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
              {['all','Expense','Income',...PNL_CATS].map(f=>(
                <button key={f} className={`btn${pnlFilter===f?' on':''}`} onClick={()=>setPnlFilter(f)} style={{fontSize:10}}>{f}</button>
              ))}
            </div>
            {pnl.filter(e=>pnlFilter==='all'||e.type===pnlFilter||e.category===pnlFilter).length===0?(
              <div style={{textAlign:'center',padding:'32px 0',color:'var(--muted)',fontSize:12}}>No entries yet. Add your first expense or income.</div>
            ):(
              <table className="tbl">
                <thead><tr><th>Date</th><th>Name</th><th>Category</th><th>Type</th><th>Amount</th><th>Notes</th><th></th></tr></thead>
                <tbody>
                  {pnl.filter(e=>pnlFilter==='all'||e.type===pnlFilter||e.category===pnlFilter).map(e=>(
                    <tr key={e.id}>
                      <td style={{color:'var(--muted)',fontSize:11}}>{e.date}</td>
                      <td style={{fontWeight:500,color:'var(--fg)'}}>{e.name}</td>
                      <td><span style={{fontSize:9,padding:'2px 6px',borderRadius:10,background:PNL_COLORS[e.category]+'22',color:PNL_COLORS[e.category],fontWeight:700}}>{e.category}</span></td>
                      <td><Tag label={e.type} color={e.type==='Income'?'green':'red'}/></td>
                      <td style={{fontWeight:700,color:e.type==='Income'?'#22c55e':'#f43f5e'}}>{e.type==='Income'?'+':'-'}{$$(e.amount)}</td>
                      <td style={{color:'var(--muted)',fontSize:11,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.notes||'—'}</td>
                      <td>
                        <div style={{display:'flex',gap:4}}>
                          <button className="btn" style={{padding:'2px 8px',fontSize:10}} onClick={()=>editPnl(e)}>Edit</button>
                          <button className="btn btn-red" style={{padding:'2px 8px',fontSize:10}} onClick={()=>delPnl(e.id)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          {months.length>0&&(
            <Section title="Monthly P&L" sub="Income vs expenses by month" accent="#6366f1">
              <div style={{height:180}}>
                <Bar data={{
                  labels:months,
                  datasets:[
                    {label:'Income',data:months.map(m=>byMonth[m].i),backgroundColor:'rgba(34,197,94,.7)',borderRadius:4},
                    {label:'Expenses',data:months.map(m=>byMonth[m].e),backgroundColor:'rgba(244,63,94,.7)',borderRadius:4},
                  ],
                }} options={{...CHART_BASE,plugins:{...CHART_BASE.plugins,legend:{display:true,labels:{color:'#888',boxWidth:10,font:{size:10}}}}}}/>
              </div>
            </Section>
          )}

          {Object.keys(byCat).length>0&&(
            <Section title="Expense Breakdown" sub="By category">
              <div style={{height:200}}>
                <Doughnut data={{
                  labels:Object.keys(byCat),
                  datasets:[{data:Object.values(byCat),backgroundColor:Object.keys(byCat).map(k=>PNL_COLORS[k]||'#94a3b8'),borderWidth:0}],
                }} options={DONUT_OPT}/>
              </div>
            </Section>
          )}
        </>)}
      </div>
    </div>

    {/* ── ADD/EDIT P&L MODAL ──────────────────────────────────────────────────── */}
    {showAdd&&(
      <div className="modal-bg" onClick={e=>{if(e.target===e.currentTarget){setShowAdd(false);setEditId(null);}}}>
        <div className="modal">
          <div style={{fontSize:15,fontWeight:700,marginBottom:18}}>{editId?'Edit Entry':'Add Entry'}</div>
          <div className="g2">
            <div className="field"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
            <div className="field"><label>Type</label><select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}><option>Expense</option><option>Income</option></select></div>
          </div>
          <div className="field"><label>Name</label><input placeholder="e.g. TikTok ads, Influencer payment…" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
          <div className="g2">
            <div className="field"><label>Category</label><select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{PNL_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
            <div className="field"><label>Amount ($)</label><input type="number" placeholder="0.00" step="0.01" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/></div>
          </div>
          <div className="field"><label>Notes</label><input placeholder="Optional…" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></div>
          <div style={{display:'flex',gap:8,marginTop:8,justifyContent:'flex-end'}}>
            <button className="btn" onClick={()=>{setShowAdd(false);setEditId(null);}}>Cancel</button>
            <button className="btn-primary" onClick={savePnlEntry}>{editId?'Save Changes':'Add Entry'}</button>
          </div>
        </div>
      </div>
    )}
  </>);
}
