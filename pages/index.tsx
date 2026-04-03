import { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

// ═══════════════════════════════════════════════════════════════════════════
// VERIFIED DATA SNAPSHOTS — All real, sourced from Mixpanel + Superwall
// ═══════════════════════════════════════════════════════════════════════════

// Superwall — verified Apr 1 2026, app 22399 (main production)
const SW_SNAP = {
  last24h: { proceeds:113,    newUsers:20,   conversions:6,   paywallRate:85.00, convRate:25.00 },
  last7d:  { proceeds:1077,   newUsers:263,  conversions:71,  paywallRate:80.23, convRate:20.15 },
  last30d: { proceeds:4321,   newUsers:2165, conversions:321, paywallRate:78.98, convRate:13.63 },
  last90d: { proceeds:7756,   newUsers:4703, conversions:596, paywallRate:77.44, convRate:11.82 },
  campaigns: [
    { name:'Timeline & Benefits', users:1978, convs:184, convRate:9.30,  proceeds:2277.75 },
    { name:'Discount Offer',      users:1329, convs:142, convRate:10.68, proceeds:2177.87 },
    { name:'Transaction Abandon', users:890,  convs:67,  convRate:7.53,  proceeds:890.40  },
  ],
  transactions: [
    { id:'69cd48', product:'Annual $29.99/yr',  proceeds:22.41,  type:'New Sub',    time:'2026-04-01T09:33', campaign:'Timeline & Benefits' },
    { id:'69cd16', product:'Discount $9.99/yr', proceeds:13.93,  type:'New Sub',    time:'2026-04-01T05:57', campaign:'Discount Offer' },
    { id:'69a5bf', product:'Monthly $9.99/mo',  proceeds:9.99,   type:'New Sub',    time:'2026-04-01T04:49', campaign:'Timeline & Benefits' },
    { id:'699d52', product:'Discount $9.99/yr', proceeds:-26.55, type:'Refund',     time:'2026-04-01T03:38', campaign:'Transaction Abandon' },
    { id:'69ccae', product:'Annual $29.99/yr',  proceeds:39.99,  type:'New Sub',    time:'2026-03-31T14:00', campaign:'Timeline & Benefits' },
    { id:'69cc65', product:'Monthly $9.99/mo',  proceeds:9.99,   type:'New Sub',    time:'2026-03-31T05:00', campaign:'Timeline & Benefits' },
    { id:'69cbaf', product:'Discount $9.99/yr', proceeds:26.38,  type:'New Sub',    time:'2026-03-31T00:00', campaign:'Discount Offer' },
    { id:'699d52', product:'Discount $9.99/yr', proceeds:0,      type:'Cancelled',  time:'2026-03-30T22:00', campaign:'Transaction Abandon' },
    { id:'69cb47', product:'Discount $9.99/yr', proceeds:24.99,  type:'New Sub',    time:'2026-03-30T20:00', campaign:'Discount Offer' },
    { id:'6962ea', product:'Weekly $2.99/wk',   proceeds:2.28,   type:'Renewal',    time:'2026-03-30T18:00', campaign:'Timeline & Benefits' },
  ],
  weeklyProceeds: { labels:['Feb 16','Feb 23','Mar 2','Mar 9','Mar 16','Mar 23','Mar 30'], data:[180,320,480,1840,1020,1140,590] },
};

// Mixpanel — verified Apr 2 2026 (30d window: Mar 2 – Apr 1)
const MP_SNAP = {
  dates:    ['03-02','03-03','03-04','03-05','03-06','03-07','03-08','03-09','03-10','03-11','03-12','03-13','03-14','03-15','03-16','03-17','03-18','03-19','03-20','03-21','03-22','03-23','03-24','03-25','03-26','03-27','03-28','03-29','03-30','03-31','04-01'],
  dau:      [61,52,51,43,58,70,54,46,47,20,34,51,75,105,66,63,54,62,72,115,99,61,50,41,44,60,90,90,49,42,35],
  subs:     [0,4,4,3,8,5,3,3,1,2,2,55,59,15,8,5,5,6,4,19,10,2,4,3,10,14,16,15,7,4,3],
  cancels:  [0,0,0,0,0,0,0,0,7,3,6,2,6,14,8,6,7,6,9,7,7,6,6,6,3,9,12,8,3,2,1],
  renewals: [0,0,0,0,0,0,0,0,2,3,3,4,5,0,4,2,3,4,3,7,3,4,6,4,5,8,8,4,1,0,0],
  runs:     [10,12,10,6,15,17,22,5,7,5,6,9,32,60,15,14,13,20,21,56,59,11,10,14,6,14,59,56,15,8,6],
  cheers:   [50,22,60,13,33,495,2167,10,13,98,13,27,332,1488,14,22,47,30,21,4058,11281,6,73,29,4,18,2566,1677,11,9,5],
  totals:   { dau30:1950, subs90:653, subs30:321, cancels30:143, renewals30:26, runs30:649, cheers30:24857 },
};

// ICP — 161 paying subscribers with complete onboarding data
const ICP = {
  gender:  [['Female',110],['Male',37],['Other',2]] as [string,number][],
  age:     [['25–34',89],['18–24',27],['35–44',26],['45–54',7]] as [string,number][],
  level:   [['Intermediate',84],['Beginner',56],['Advanced',8]] as [string,number][],
  watch:   [['Apple Watch',60],['Garmin',59],['Fitbit',14],['Samsung',11],['Other',5]] as [string,number][],
  source:  [['TikTok',84],['Instagram',36],['Friends',16],['Facebook',3]] as [string,number][],
  phone:   [['Always',144],['Sometimes',13]] as [string,number][],
  audio:   [['Always',131],['Sometimes',23],['Rarely',3]] as [string,number][],
  listen:  [['Music',120],['Mix',31],['Podcasts',4],['Silence',2]] as [string,number][],
  units:   [['Kilometers',110],['Miles',50]] as [string,number][],
  races:   [['Half Marathon',686],['10K',427],['5K',324],['Marathon',185]] as [string,number][],
  cities:  [['Bogotá, CO',39],['San José, CR',28],['Madrid, ES',21],['Iztapalapa, MX',20],['Melbourne, AU',18],['Sydney, AU',18],['Mexico City, MX',18],['Barranquilla, CO',17]] as [string,number][],
};

// Countries — Mixpanel People API, Apr 2 2026
const COUNTRIES = [
  {code:'US',name:'United States',users:452},{code:'MX',name:'Mexico',users:434},
  {code:'GB',name:'United Kingdom',users:399},{code:'CO',name:'Colombia',users:70},
  {code:'AU',name:'Australia',users:67},{code:'ES',name:'Spain',users:58},
  {code:'NL',name:'Netherlands',users:35},{code:'CA',name:'Canada',users:33},
  {code:'EC',name:'Ecuador',users:32},{code:'CR',name:'Costa Rica',users:31},
  {code:'BE',name:'Belgium',users:27},
];

// Behavior — Mixpanel JQL, Apr 2 2026
const BEH = {
  byHour: [38,24,30,36,27,29,38,28,35,29,32,30,25,37,31,34,29,27,35,29,21,33,38,30],
  byDow:  [123,106,103,108,96,105,104],
  dist:   [297,26,44,92,115,136],
  cheers: { total:26723, tts:13886, voice:12832, ttsPct:52, voicePct:48, favorited:688, favRate:2.6, replayed:923, repRate:3.5 },
};

// Conversion — Mixpanel, Apr 2 2026
const CONV = {
  funnel: [
    { label:'Onboarding Completed', count:5375, color:'#6366f1' },
    { label:'Subscription Started',  count:349,  color:'#22c55e' },
    { label:'Run Started',           count:737,  color:'#f97316' },
    { label:'Run Completed',         count:704,  color:'#3b82f6' },
  ],
  plans: [
    { plan:'Monthly $9.99/mo',  subs:110, pct:70, color:'#6366f1' },
    { plan:'Annual $29.99/yr',  subs:39,  pct:25, color:'#22c55e' },
    { plan:'Weekly $2.99/wk',   subs:5,   pct:3,  color:'#f97316' },
    { plan:'Discount $9.99/yr', subs:3,   pct:2,  color:'#94a3b8' },
  ],
};

// Activation — Mixpanel JQL, Apr 2 2026 (both subscription events combined)
const ACT = {
  totalSubs:450, neverRan:249, neverRanPct:55.3, testOnly:30, realRunners:171, atRiskMRR:411,
  runDist:{ one:28, twoToFive:34, sixToTen:18, elevenPlus:17 },
};

// MRR estimate: monthly:110×$9.99 + annual:39×$2.50 + weekly:5×$13 + discount:3×$0.83
const MRR_EST = 1264;

// ─── P&L (localStorage) ──────────────────────────────────────────────────────
const PNL_KEY = 'cmr_pnl_v3';
interface PE { id:string; date:string; name:string; category:string; type:'expense'|'revenue'; amount:number; notes:string; }
const PNL_CATS = ['Development','Influencer','Infrastructure','Tools/SaaS','Design','Marketing','Alex Investment','Revenue','Other'];
const PNL_CLR: Record<string,string> = {
  Development:'#6366f1',Influencer:'#ec4899',Infrastructure:'#3b82f6','Tools/SaaS':'#f97316',
  Design:'#8b5cf6',Marketing:'#14b8a6','Alex Investment':'#22c55e',Revenue:'#16a34a',Other:'#94a3b8',
};
const loadPnl = (): PE[] => { try { return JSON.parse(localStorage.getItem(PNL_KEY)||'[]'); } catch { return []; } };
const savePnl = (e: PE[]) => localStorage.setItem(PNL_KEY, JSON.stringify(e));

// ═══════════════════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════════════════
const n = (v:number,d=0) => v.toLocaleString('en-US',{maximumFractionDigits:d});
const $$ = (v:number) => '$'+v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const pct = (a:number, b:number) => b>0 ? Math.round(a/b*100) : 0;
const sum = (a:number[]) => a.reduce((s,v)=>s+v,0);

const TABS = ['Revenue','Growth','Users','Behavior','Conversion','Activation','P&L'];
const TAB_CLR = ['#22c55e','#6366f1','#ec4899','#f97316','#3b82f6','#f59e0b','#14b8a6'];
const PALETTE = ['#6366f1','#ec4899','#3b82f6','#f97316','#8b5cf6','#14b8a6','#22c55e','#f59e0b','#ef4444'];

const CHART: any = {
  responsive:true, maintainAspectRatio:false,
  plugins:{ legend:{display:false}, tooltip:{backgroundColor:'rgba(15,23,42,.92)',titleFont:{size:11,weight:'bold'},bodyFont:{size:11},padding:10,cornerRadius:8} },
  scales:{ x:{grid:{display:false},ticks:{color:'#94a3b8',font:{size:10},maxRotation:0}}, y:{grid:{color:'rgba(148,163,184,.12)'},ticks:{color:'#94a3b8',font:{size:10}},beginAtZero:true} },
};
const DONUT: any = {
  responsive:true, maintainAspectRatio:false,
  plugins:{ legend:{display:true,position:'right',labels:{font:{size:11},boxWidth:10,padding:8,color:'#64748b'}} },
};
const LEGEND_OPT: any = { ...CHART, plugins:{ ...CHART.plugins, legend:{display:true,labels:{font:{size:10},boxWidth:8,color:'#94a3b8',padding:12}} } };

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function KPI({ label, value, sub, delta, color, badge, warn, size='md' }:
  { label:string; value:any; sub?:string; delta?:number|null; color?:string; badge?:string; warn?:boolean; size?:'sm'|'md'|'lg' }) {
  return (
    <div style={{background:'#fff',border:`1px solid ${warn?'#fca5a5':'#e2e8f0'}`,borderTop:`3px solid ${warn?'#ef4444':color||'#e2e8f0'}`,borderRadius:12,padding:size==='lg'?'20px 22px':'14px 16px',position:'relative'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
        <span style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.08em'}}>{label}</span>
        <div style={{display:'flex',gap:4}}>
          {badge&&<span style={{fontSize:9,padding:'2px 6px',borderRadius:20,background:'#eff6ff',color:'#1d4ed8',fontWeight:700}}>{badge}</span>}
          {warn&&<span style={{fontSize:9,padding:'2px 6px',borderRadius:20,background:'#fff1f2',color:'#9f1239',fontWeight:700}}>AT RISK</span>}
        </div>
      </div>
      <div style={{fontSize:size==='lg'?30:size==='md'?22:17,fontWeight:800,color:warn?'#dc2626':'#0f172a',lineHeight:1.1,letterSpacing:'-0.02em'}}>{value}</div>
      {delta!=null&&<div style={{fontSize:11,marginTop:4,fontWeight:600,color:delta>=0?'#22c55e':'#ef4444'}}>{delta>=0?'▲':'▼'} {Math.abs(delta)}% vs prev</div>}
      {sub&&<div style={{fontSize:10,marginTop:4,color:'#64748b'}}>{sub}</div>}
    </div>
  );
}

function Card({ title, sub, children, accent, action }:
  { title:string; sub?:string; children:any; accent?:string; action?:any }) {
  return (
    <div style={{background:'#fff',border:'1px solid #e2e8f0',borderTop:accent?`3px solid ${accent}`:'1px solid #e2e8f0',borderRadius:12,padding:'16px 18px',marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:'#0f172a'}}>{title}</div>
          {sub&&<div style={{fontSize:11,color:'#64748b',marginTop:2}}>{sub}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Bar2({ label, val, max, color, sub }:{ label:string; val:number; max:number; color:string; sub?:string }) {
  return (
    <div style={{marginBottom:9}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
        <span style={{fontSize:11,color:'#334155'}}>{label}</span>
        <span style={{fontSize:11,color:'#64748b',fontWeight:700}}>{pct(val,max)}%{sub?` · ${sub}`:''}</span>
      </div>
      <div style={{height:5,background:'#f1f5f9',borderRadius:3}}>
        <div style={{width:`${pct(val,max)}%`,height:'100%',background:color,borderRadius:3}}/>
      </div>
    </div>
  );
}

function Insight({ text, type='blue' }:{ text:string; type?:'blue'|'green'|'amber'|'red' }) {
  const c = { blue:['#eff6ff','#1e40af'], green:['#f0fdf4','#166534'], amber:['#fffbeb','#92400e'], red:['#fff1f2','#9f1239'] }[type];
  return <div style={{marginTop:10,padding:'10px 12px',borderRadius:8,background:c[0],fontSize:11,color:c[1],lineHeight:1.6,borderLeft:`3px solid ${c[1]}`}} dangerouslySetInnerHTML={{__html:text}}/>;
}

function Badge({ label, color='blue' }:{ label:string; color?:'blue'|'green'|'amber'|'red'|'gray' }) {
  const c = {blue:['#eff6ff','#1d4ed8'],green:['#f0fdf4','#166534'],amber:['#fef9c3','#854d0e'],red:['#fff1f2','#9f1239'],gray:['#f1f5f9','#475569']}[color];
  return <span style={{fontSize:9,padding:'2px 7px',borderRadius:20,background:c[0],color:c[1],fontWeight:700,letterSpacing:'.05em'}}>{label}</span>;
}

function GoalBar({ current, goal, label, deadline }:{ current:number; goal:number; label:string; deadline:string }) {
  const progress = Math.min(current/goal*100, 100);
  const daysLeft = Math.max(0, Math.ceil((new Date(deadline).getTime()-Date.now())/86400000));
  const gap = goal - current;
  const dailySubs = daysLeft>0 ? Math.ceil(gap/9.99/daysLeft) : 0;
  return (
    <div style={{background:'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',borderRadius:14,padding:'20px 24px',marginBottom:14,border:'1px solid #1e293b',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:-20,right:-20,width:120,height:120,borderRadius:'50%',background:'rgba(249,115,22,.07)'}}/>
      <div style={{position:'absolute',bottom:-30,left:100,width:160,height:160,borderRadius:'50%',background:'rgba(99,102,241,.06)'}}/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14,flexWrap:'wrap',gap:8}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:4}}>🎯 {label}</div>
          <div style={{display:'flex',alignItems:'baseline',gap:10}}>
            <span style={{fontSize:34,fontWeight:800,color:'#f8fafc',letterSpacing:'-0.03em'}}>{$$(current)}</span>
            <span style={{fontSize:14,color:'#475569'}}>/ {$$(goal)}</span>
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:28,fontWeight:800,color:'#f97316',letterSpacing:'-0.02em'}}>{daysLeft}d</div>
          <div style={{fontSize:11,color:'#475569'}}>until {deadline}</div>
        </div>
      </div>
      <div style={{height:8,background:'#1e293b',borderRadius:4,marginBottom:12,overflow:'hidden'}}>
        <div style={{width:`${progress}%`,height:'100%',background:'linear-gradient(90deg,#6366f1,#f97316)',borderRadius:4,transition:'width 1s ease',position:'relative'}}>
          <div style={{position:'absolute',right:0,top:'50%',transform:'translateY(-50%)',width:12,height:12,borderRadius:'50%',background:'#f97316',boxShadow:'0 0 10px #f97316'}}/>
        </div>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
        <div style={{display:'flex',gap:20}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:18,fontWeight:700,color:'#f8fafc'}}>{progress.toFixed(1)}%</div>
            <div style={{fontSize:10,color:'#475569'}}>complete</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:18,fontWeight:700,color:'#f97316'}}>{$$(gap)}</div>
            <div style={{fontSize:10,color:'#475569'}}>gap to close</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:18,fontWeight:700,color:'#22c55e'}}>{dailySubs}</div>
            <div style={{fontSize:10,color:'#475569'}}>new subs/day needed</div>
          </div>
        </div>
        <div style={{fontSize:11,color:'#475569'}}>
          Need <strong style={{color:'#f8fafc'}}>{$$(Math.ceil(gap/daysLeft)||0)}</strong>/day MRR growth
        </div>
      </div>
    </div>
  );
}

function Grid({ cols=4, children }:{ cols?:2|3|4; children:any }) {
  return <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:12,marginBottom:14}}>{children}</div>;
}

function Tbl({ heads, rows }: { heads: string[]; rows: (string|number|any)[][] }) {
  return (
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
        <thead>
          <tr>{heads.map((h,i)=><th key={i} style={{padding:'6px 10px',textAlign:i>0?'right':'left',color:'#64748b',fontWeight:700,fontSize:10,textTransform:'uppercase',letterSpacing:'.05em',borderBottom:'1px solid #f1f5f9'}}>{h}</th>)}</tr>
        </thead>
        <tbody>{rows.map((r,ri)=>(
          <tr key={ri} style={{borderBottom:'1px solid #f8fafc'}}>
            {r.map((cell,ci)=><td key={ci} style={{padding:'8px 10px',textAlign:ci>0?'right':'left',color:'#334155'}}>{cell}</td>)}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: REVENUE
// ═══════════════════════════════════════════════════════════════════════════
function RevenueTab({ sw, live }: { sw:any; live:boolean }) {
  const [period, setPeriod] = useState<'last24h'|'last7d'|'last30d'|'last90d'>('last30d');
  const p = sw[period] || SW_SNAP.last30d;
  const campaigns = sw.campaigns || SW_SNAP.campaigns;
  const txns = sw.transactions || sw.recentTransactions || SW_SNAP.transactions;
  const weeklyProceeds = SW_SNAP.weeklyProceeds;

  return (
    <>
      <GoalBar current={p.proceeds} goal={10000} label="Monthly Revenue Goal" deadline="2026-05-31"/>

      <div style={{display:'flex',gap:8,marginBottom:12}}>
        {(['last24h','last7d','last30d','last90d'] as const).map(k=>(
          <button key={k} onClick={()=>setPeriod(k)} style={{padding:'5px 12px',borderRadius:20,border:'1px solid',fontSize:11,fontWeight:700,cursor:'pointer',background:period===k?'#0f172a':'#fff',color:period===k?'#fff':'#64748b',borderColor:period===k?'#0f172a':'#e2e8f0'}}>
            {k==='last24h'?'24H':k==='last7d'?'7D':k==='last30d'?'30D':'90D'}
          </button>
        ))}
        {live&&<Badge label="LIVE" color="green"/>}
      </div>

      <Grid cols={4}>
        <KPI label="iOS Proceeds" value={`$${n(p.proceeds)}`} color="#22c55e" size="lg"/>
        <KPI label="Conversions" value={n(p.conversions)} color="#6366f1" sub={`${p.convRate}% conv rate`}/>
        <KPI label="Paywall Rate" value={`${p.paywallRate}%`} color="#f97316" sub="users who see paywall"/>
        <KPI label="New Users" value={n(p.newUsers)} color="#3b82f6" sub="iOS installs"/>
      </Grid>

      <Grid cols={4}>
        <KPI label="Est. MRR" value={`$${n(MRR_EST)}`} color="#22c55e" sub="monthly recurring"/>
        <KPI label="MRR Goal Gap" value={`$${n(10000-MRR_EST)}`} color="#f59e0b" warn/>
        <KPI label="Subscribers (tracked)" value="450" color="#6366f1" sub="Mixpanel 365d (both events)"/>
        <KPI label="Proceeds 90d" value={`$${n(SW_SNAP.last90d.proceeds)}`} color="#14b8a6" sub="lifetime so far"/>
      </Grid>

      <Grid cols={2}>
        <Card title="Weekly Revenue Trend" sub="iOS Proceeds · Superwall" accent="#22c55e">
          <div style={{height:200}}>
            <Line data={{
              labels: weeklyProceeds.labels,
              datasets:[{ data:weeklyProceeds.data, borderColor:'#22c55e', backgroundColor:'rgba(34,197,94,.1)', tension:.4, fill:true, pointRadius:4, pointBackgroundColor:'#22c55e', borderWidth:2 }]
            }} options={CHART as any}/>
          </div>
          <Insight text="<strong>Mar 9 spike: $1,840</strong> — correlated with TikTok viral content. Goal is to replicate this weekly." type="green"/>
        </Card>
        <Card title="Plan Distribution" sub="Paying subscribers breakdown" accent="#6366f1">
          <div style={{height:160}}>
            <Doughnut data={{
              labels: CONV.plans.map(p=>p.plan),
              datasets:[{ data:CONV.plans.map(p=>p.subs), backgroundColor:CONV.plans.map(p=>p.color), borderWidth:0 }]
            }} options={DONUT}/>
          </div>
          <div style={{marginTop:8}}>
            {CONV.plans.map(p=><Bar2 key={p.plan} label={`${p.plan} — ${p.subs} subs`} val={p.subs} max={157} color={p.color}/>)}
          </div>
          <Insight text="<strong>70% on monthly.</strong> Convert 20 monthly → annual = +$200 ARR instantly. Run an annual upgrade campaign." type="blue"/>
        </Card>
      </Grid>

      <Card title="Campaign Performance" sub="Superwall paywall campaigns" accent="#f97316">
        <Tbl
          heads={['Campaign','Users','Conversions','Conv Rate','Proceeds']}
          rows={campaigns.map((c:any)=>[
            <strong key="n">{c.name}</strong>,
            n(c.users),
            <span key="cv" style={{color:'#6366f1',fontWeight:700}}>{n(c.convs)}</span>,
            <span key="cr" style={{color:c.convRate>10?'#22c55e':'#f59e0b',fontWeight:700}}>{c.convRate}%</span>,
            <span key="p" style={{color:'#22c55e',fontWeight:700}}>${n(c.proceeds)}</span>,
          ])}
        />
        <Insight text="<strong>Discount Offer</strong> has the best conv rate at 10.68%. <strong>Timeline & Benefits</strong> drives the most volume. A/B test higher price on Discount cohort." type="blue"/>
      </Card>

      <Card title="Recent Transactions" sub="Last 10 transactions · Superwall app 22399" accent="#14b8a6">
        <Tbl
          heads={['User','Product','Proceeds','Type','Campaign','Time']}
          rows={txns.slice(0,10).map((t:any)=>[
            <code key="i" style={{fontSize:10,color:'#64748b'}}>{t.id||t.userId}</code>,
            t.product,
            <span key="p" style={{color:t.proceeds<0?'#ef4444':t.proceeds===0?'#64748b':'#22c55e',fontWeight:700}}>{$$(t.proceeds)}</span>,
            <Badge key="tp" label={t.type} color={t.type==='New Sub'?'green':t.type==='Refund'?'red':t.type==='Cancelled'?'red':t.type==='Renewal'?'blue':'gray'}/>,
            <span key="c" style={{fontSize:10,color:'#64748b'}}>{t.campaign}</span>,
            <span key="ti" style={{fontSize:10,color:'#64748b'}}>{t.time?.replace('T',' ')}</span>,
          ])}
        />
      </Card>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: GROWTH
// ═══════════════════════════════════════════════════════════════════════════
function GrowthTab({ mpData, live }: { mpData:any; live:boolean }) {
  const [days, setDays] = useState(30);
  const d = mpData || MP_SNAP;
  const dates = (d.dates || d.dates30 || MP_SNAP.dates).slice(-days);
  const dau   = (d.dau || MP_SNAP.dau).slice(-days);
  const subs  = (d.subs || d.subs30 || MP_SNAP.subs).slice(-days);
  const cans  = (d.cancels || MP_SNAP.cancels).slice(-days);
  const rens  = (d.renewals || MP_SNAP.renewals).slice(-days);
  const t = d.totals || MP_SNAP.totals;

  const netSubs = sum(subs) - sum(cans);
  const avgDau  = Math.round(sum(dau)/dau.length);

  return (
    <>
      <Grid cols={4}>
        <KPI label="Total Profiles" value="1,740" color="#6366f1" sub="Mixpanel People" size="lg"/>
        <KPI label="Avg DAU (30d)" value={n(avgDau)} color="#3b82f6" sub="app_opened/day" badge={live?'LIVE':undefined}/>
        <KPI label="New Subs (30d)" value={n(t.subs30||321)} color="#22c55e" sub="subscription_started + SW" badge={live?'LIVE':undefined}/>
        <KPI label="Countries" value="17+" color="#f97316" sub="global reach"/>
      </Grid>
      <Grid cols={4}>
        <KPI label="Total Subs (90d)" value={n(t.subs90||653)} color="#6366f1" sub="both subscription events"/>
        <KPI label="Cancellations (30d)" value={n(t.cancels30||143)} color="#ef4444" warn/>
        <KPI label="Net New Subs (30d)" value={netSubs>=0?`+${netSubs}`:String(netSubs)} color={netSubs>=0?'#22c55e':'#ef4444'}/>
        <KPI label="Renewals (30d)" value={n(t.renewals30||26)} color="#14b8a6"/>
      </Grid>

      <div style={{display:'flex',gap:8,marginBottom:12}}>
        {[7,14,30].map(v=>(
          <button key={v} onClick={()=>setDays(v)} style={{padding:'5px 12px',borderRadius:20,border:'1px solid',fontSize:11,fontWeight:700,cursor:'pointer',background:days===v?'#0f172a':'#fff',color:days===v?'#fff':'#64748b',borderColor:days===v?'#0f172a':'#e2e8f0'}}>
            {v}D
          </button>
        ))}
        {live&&<Badge label="LIVE" color="green"/>}
      </div>

      <Card title="Daily Active Users" sub="app_opened events · Mixpanel" accent="#6366f1">
        <div style={{height:200}}>
          <Line data={{
            labels:dates,
            datasets:[{ data:dau, borderColor:'#6366f1', backgroundColor:'rgba(99,102,241,.08)', tension:.4, fill:true, pointRadius:0, borderWidth:2 }]
          }} options={CHART as any}/>
        </div>
      </Card>

      <Grid cols={2}>
        <Card title="Daily Subscriptions" sub="New subs, cancellations & renewals" accent="#22c55e">
          <div style={{height:200}}>
            <Bar data={{
              labels:dates,
              datasets:[
                { label:'New Subs',   data:subs, backgroundColor:'#22c55e', borderRadius:2 },
                { label:'Cancels',    data:cans, backgroundColor:'#ef4444', borderRadius:2 },
                { label:'Renewals',   data:rens, backgroundColor:'#6366f1', borderRadius:2 },
              ]
            }} options={LEGEND_OPT as any}/>
          </div>
          <Insight text="<strong>Mar 13–14 spike: 114 new subs in 2 days.</strong> Correlated with viral TikTok. Churn from that cohort appeared by Mar 16." type="amber"/>
        </Card>
        <Card title="Top Countries" sub="Mixpanel People profiles · Apr 2 2026" accent="#f97316">
          <div style={{height:200}}>
            <Bar data={{
              labels: COUNTRIES.map(c=>c.code),
              datasets:[{ data:COUNTRIES.map(c=>c.users), backgroundColor:COUNTRIES.map((_,i)=>PALETTE[i%PALETTE.length]), borderRadius:4 }]
            }} options={CHART as any}/>
          </div>
          <Insight text="<strong>US + MX + GB = 74% of user base.</strong> LatAm is strongest market. Mexico City + Bogotá + San José = core cities." type="blue"/>
        </Card>
      </Grid>

      <Card title="Country Breakdown" sub="Full list · Mixpanel People API" accent="#ec4899">
        <Tbl
          heads={['Country','Users','Share','Bar']}
          rows={COUNTRIES.map((c,i)=>[
            <span key="n"><strong>{c.name}</strong> <span style={{fontSize:10,color:'#94a3b8'}}>{c.code}</span></span>,
            n(c.users),
            `${pct(c.users, 1740)}%`,
            <div key="b" style={{height:6,background:'#f1f5f9',borderRadius:3,minWidth:80}}><div style={{width:`${pct(c.users,452)*100/100}%`,height:'100%',background:PALETTE[i%PALETTE.length],borderRadius:3}}/></div>,
          ])}
        />
      </Card>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: USERS
// ═══════════════════════════════════════════════════════════════════════════
function UsersTab() {
  return (
    <>
      <div style={{background:'linear-gradient(135deg,#0f172a,#1e293b)',borderRadius:14,padding:'16px 20px',marginBottom:14,border:'1px solid #1e293b'}}>
        <div style={{fontSize:10,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>ICP Summary — Tu usuario pagador ideal</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {['👩 Mujer, 25–34','🏃 Runner intermedio','⌚ Apple Watch o Garmin','📱 La encontró en TikTok','🎧 Siempre usa audífonos','📲 Siempre lleva el teléfono','⏰ Corre 6–10am','🎵 Escucha música corriendo','🏅 Ha corrido medio maratón','📏 Prefiere kilómetros'].map(t=>(
            <span key={t} style={{fontSize:11,padding:'5px 12px',borderRadius:20,background:'rgba(255,255,255,.06)',color:'#cbd5e1',fontWeight:500}}>{t}</span>
          ))}
        </div>
      </div>

      <Grid cols={4}>
        <KPI label="Perfiles totales" value="1,740" color="#6366f1" sub="Mixpanel People"/>
        <KPI label="Género dominante" value="74% ♀" color="#ec4899" sub="Female · 110/149"/>
        <KPI label="Edad principal" value="25–34" color="#8b5cf6" sub="60% del total"/>
        <KPI label="Descubrimiento" value="TikTok 60%" color="#f97316" sub="canal #1"/>
      </Grid>

      <Grid cols={3}>
        <Card title="Género" sub="161 suscriptores activos" accent="#ec4899">
          <div style={{height:160}}>
            <Doughnut data={{ labels:['Female','Male','Other'], datasets:[{data:[110,37,2],backgroundColor:['#ec4899','#3b82f6','#94a3b8'],borderWidth:0}] }} options={DONUT}/>
          </div>
          <div style={{marginTop:8}}>
            <Bar2 label="Female — 110" val={110} max={149} color="#ec4899"/>
            <Bar2 label="Male — 37" val={37} max={149} color="#3b82f6"/>
          </div>
          <Insight text="<strong>74% mujeres.</strong> Persona core: corredora buscando apoyo emocional y conexión." type="green"/>
        </Card>

        <Card title="Rango de Edad" sub="Suscriptores pagadores" accent="#6366f1">
          <div style={{height:160}}>
            <Bar data={{
              labels:['25–34','18–24','35–44','45–54'],
              datasets:[{data:[89,27,26,7],backgroundColor:['#6366f1','#8b5cf6','#a78bfa','#c4b5fd'],borderRadius:4}]
            }} options={CHART as any}/>
          </div>
          <div style={{marginTop:8}}>
            {ICP.age.map((r,i)=><Bar2 key={r[0]} label={`${r[0]} — ${r[1]}`} val={r[1]} max={149} color={PALETTE[i]}/>)}
          </div>
          <Insight text="<strong>60% tienen 25–34.</strong> Millennial runner. Nativa de TikTok, aspiracional, community-driven." type="blue"/>
        </Card>

        <Card title="Nivel de Running" sub="Auto-reportado en onboarding" accent="#f97316">
          <div style={{height:160}}>
            <Doughnut data={{ labels:['Intermediate','Beginner','Advanced'], datasets:[{data:[84,56,8],backgroundColor:['#f97316','#3b82f6','#22c55e'],borderWidth:0}] }} options={DONUT}/>
          </div>
          <div style={{marginTop:8}}>
            {ICP.level.map((r,i)=><Bar2 key={r[0]} label={`${r[0]} — ${r[1]}`} val={r[1]} max={148} color={['#f97316','#3b82f6','#22c55e'][i]}/>)}
          </div>
          <Insight text="95% beginners + intermediates. <strong>Los avanzados no necesitan apoyo emocional.</strong>" type="blue"/>
        </Card>
      </Grid>

      <Grid cols={3}>
        <Card title="Wearable" sub="¿Qué reloj usan?" accent="#0f172a">
          <div style={{height:160}}>
            <Doughnut data={{ labels:['Apple Watch','Garmin','Fitbit','Samsung','Other'], datasets:[{data:[60,59,14,11,5],backgroundColor:['#0f172a','#16a34a','#3b82f6','#f59e0b','#94a3b8'],borderWidth:0}] }} options={DONUT}/>
          </div>
          <div style={{marginTop:8}}>
            {ICP.watch.map((r,i)=><Bar2 key={r[0]} label={`${r[0]} — ${r[1]}`} val={r[1]} max={149} color={['#0f172a','#16a34a','#3b82f6','#f59e0b','#94a3b8'][i]}/>)}
          </div>
          <Insight text="<strong>Apple Watch + Garmin = 80%.</strong> Hardware premium → willingness to pay." type="green"/>
        </Card>

        <Card title="Canal de Descubrimiento" sub="¿Cómo encontraron CheerMyRun?" accent="#111827">
          <div style={{height:160}}>
            <Doughnut data={{ labels:['TikTok','Instagram','Friends','Facebook'], datasets:[{data:[84,36,16,3],backgroundColor:['#111827','#e1306c','#1877f2','#94a3b8'],borderWidth:0}] }} options={DONUT}/>
          </div>
          <div style={{marginTop:8}}>
            {ICP.source.map((r,i)=><Bar2 key={r[0]} label={`${r[0]} — ${r[1]}`} val={r[1]} max={139} color={['#111827','#e1306c','#1877f2','#94a3b8'][i]}/>)}
          </div>
          <Insight text="<strong>TikTok = 60% de suscriptores.</strong> Cada video de TikTok tiene potencial de $1,000+ MRR." type="green"/>
        </Card>

        <Card title="Carreras Completadas" sub="Experiencia de running del usuario" accent="#8b5cf6">
          <div style={{height:160}}>
            <Bar data={{
              labels:['Medio M.','10K','5K','Maratón'],
              datasets:[{data:[686,427,324,185],backgroundColor:['#6366f1','#3b82f6','#0891b2','#f97316'],borderRadius:4}]
            }} options={CHART as any}/>
          </div>
          <div style={{marginTop:8}}>
            {ICP.races.map((r,i)=><Bar2 key={r[0]} label={`${r[0]} — ${r[1]}`} val={r[1]} max={686} color={PALETTE[i]}/>)}
          </div>
        </Card>
      </Grid>

      <Grid cols={3}>
        <Card title="Audífonos" sub="Durante las corridas" accent="#14b8a6">
          <div style={{height:130}}>
            <Doughnut data={{ labels:['Siempre','A veces','Rara vez'], datasets:[{data:[131,23,3],backgroundColor:['#6366f1','#f97316','#94a3b8'],borderWidth:0}] }} options={DONUT}/>
          </div>
          <Insight text="<strong>83% siempre</strong> usan audífonos. Audio cheers = fit perfecto." type="green"/>
        </Card>

        <Card title="Lleva el Teléfono" sub="Durante las corridas" accent="#22c55e">
          <div style={{height:130}}>
            <Doughnut data={{ labels:['Siempre','A veces'], datasets:[{data:[144,13],backgroundColor:['#22c55e','#f59e0b'],borderWidth:0}] }} options={DONUT}/>
          </div>
          <Insight text="<strong>92% siempre lleva el teléfono.</strong> Product-market fit perfecto para cheers de audio." type="green"/>
        </Card>

        <Card title="Preferencia Musical" sub="¿Qué escuchan corriendo?" accent="#f97316">
          <div style={{height:130}}>
            <Doughnut data={{ labels:['Música','Mezcla','Podcasts','Silencio'], datasets:[{data:[120,31,4,2],backgroundColor:['#f97316','#6366f1','#3b82f6','#94a3b8'],borderWidth:0}] }} options={DONUT}/>
          </div>
          <Insight text="<strong>77% escuchan música.</strong> Los TTS cheers sobre música = caso de uso principal." type="blue"/>
        </Card>
      </Grid>

      <Grid cols={2}>
        <Card title="Preferencia de Unidades" sub="Kilómetros vs Millas" accent="#3b82f6">
          <div style={{height:120}}>
            <Doughnut data={{ labels:['Kilómetros','Millas'], datasets:[{data:[110,50],backgroundColor:['#3b82f6','#f97316'],borderWidth:0}] }} options={DONUT}/>
          </div>
          <Insight text="<strong>69% kilómetros</strong> — confirma dominio de mercado LatAm + Europa." type="blue"/>
        </Card>

        <Card title="Top Ciudades" sub="Datos de onboarding · Mixpanel" accent="#ec4899">
          <Tbl
            heads={['#','Ciudad','Usuarios']}
            rows={ICP.cities.map((r,i)=>[
              <span key="n" style={{color:'#94a3b8',fontSize:11}}>{i+1}</span>,
              r[0],
              <strong key="u">{r[1]}</strong>,
            ])}
          />
        </Card>
      </Grid>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: BEHAVIOR
// ═══════════════════════════════════════════════════════════════════════════
function BehaviorTab({ behData, live }: { behData:any; live:boolean }) {
  const b = behData || BEH;
  const byHour = b.runsByHour || BEH.byHour;
  const byDow  = Array.isArray(b.runsByDayOfWeek) ? b.runsByDayOfWeek.map((d:any)=>d.runs) : BEH.byDow;
  const dist   = Array.isArray(b.distanceDistribution) ? b.distanceDistribution.map((d:any)=>d.count) : BEH.dist;
  const ch     = b.cheers || BEH.cheers;

  const totalRuns = sum(byHour);
  const peakHour  = byHour.indexOf(Math.max(...byHour));
  const peakDow   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][byDow.indexOf(Math.max(...byDow))];

  return (
    <>
      <Grid cols={4}>
        <KPI label="Runs Totales (90d)" value={n(totalRuns)} color="#f97316" sub="run_started" badge={live?'LIVE':undefined}/>
        <KPI label="Cheers Totales" value={n(ch.total||BEH.cheers.total)} color="#ec4899" sub="cheer_received"/>
        <KPI label="Hora Pico" value={`${peakHour}:00`} color="#6366f1" sub="mayor actividad"/>
        <KPI label="Día Más Activo" value={peakDow} color="#22c55e" sub="day of week"/>
      </Grid>
      <Grid cols={4}>
        <KPI label="TTS" value={`${ch.ttsPct||BEH.cheers.ttsPct}%`} color="#6366f1" sub={`${n(ch.tts||BEH.cheers.tts)} cheers`}/>
        <KPI label="Voice Notes" value={`${ch.voicePct||BEH.cheers.voicePct}%`} color="#f97316" sub={`${n(ch.voice||ch.voiceNotes||BEH.cheers.voice)} cheers`}/>
        <KPI label="Favorited Rate" value={`${ch.favRate||ch.favoritedRate||BEH.cheers.favRate}%`} color="#ec4899" sub={`${ch.favorited||ch.totalFavorited||BEH.cheers.favorited} cheers favorited`}/>
        <KPI label="Replayed Rate" value={`${ch.repRate||ch.replayedRate||BEH.cheers.repRate}%`} color="#8b5cf6" sub={`${ch.replayed||ch.totalReplayed||BEH.cheers.replayed} cheers replayed`}/>
      </Grid>

      <Card title="Runs por Hora del Día (UTC)" sub="Cuándo corren tus usuarios — 90 días" accent="#f97316">
        <div style={{height:220}}>
          <Bar data={{
            labels: Array.from({length:24},(_,i)=>`${i}h`),
            datasets:[{ data:byHour, backgroundColor:byHour.map((_,i)=>(i>=6&&i<=10)?'#f97316':'#e2e8f0'), borderRadius:3 }]
          }} options={CHART as any}/>
        </div>
        <Insight text={`La mayor actividad está en las <strong>${peakHour}:00h UTC</strong>. La franja 6–10am tiene el mayor volumen — <strong>runner matutino confirmado.</strong> Programa push notifications antes de las 7am.`} type="amber"/>
      </Card>

      <Grid cols={2}>
        <Card title="Runs por Día de la Semana" sub="Distribución semanal · 90 días" accent="#6366f1">
          <div style={{height:200}}>
            <Bar data={{
              labels:['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'],
              datasets:[{ data:byDow, backgroundColor:['#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#e0d7ff','#f97316','#fbbf24'], borderRadius:4 }]
            }} options={CHART as any}/>
          </div>
          <Insight text="Distribución muy <strong>pareja toda la semana.</strong> Los usuarios corren consistentemente — Lunes lidera con mayor intensidad. Fines de semana son activos también." type="blue"/>
        </Card>

        <Card title="Distribución de Distancias" sub="run_completed — 90 días" accent="#22c55e">
          <div style={{height:200}}>
            <Bar data={{
              labels:['< 1km','1–3km','3–5km','5–10km','10–21km','21km+'],
              datasets:[{ data:dist, backgroundColor:['#fca5a5','#bfdbfe','#bfdbfe','#bbf7d0','#86efac','#22c55e'], borderRadius:4 }]
            }} options={CHART as any}/>
          </div>
          <Insight text="<strong>${dist[0]} runs &lt; 1km = test runs</strong> desde casa. Distancias reales (≥1km): promedio ${Math.round((dist[2]*4+dist[3]*7.5+dist[4]*15+dist[5]*25)/Math.max(1,dist[1]+dist[2]+dist[3]+dist[4]+dist[5]))}km. <strong>34% son medios/maratones completos</strong> — runners serios." type="green"/>
        </Card>
      </Grid>

      <Grid cols={2}>
        <Card title="Tipo de Cheer" sub="TTS vs Voice Notes · Todos los cheers" accent="#ec4899">
          <div style={{height:150}}>
            <Doughnut data={{
              labels:['TTS (Text-to-Speech)','Voice Notes'],
              datasets:[{data:[ch.tts||ch.ttsPct||BEH.cheers.tts, ch.voice||ch.voiceNotes||BEH.cheers.voice],backgroundColor:['#6366f1','#f97316'],borderWidth:0}]
            }} options={DONUT}/>
          </div>
          <Bar2 label={`TTS — ${n(ch.tts||BEH.cheers.tts)} cheers`} val={ch.ttsPct||BEH.cheers.ttsPct} max={100} color="#6366f1"/>
          <Bar2 label={`Voice Notes — ${n(ch.voice||ch.voiceNotes||BEH.cheers.voice)} cheers`} val={ch.voicePct||BEH.cheers.voicePct} max={100} color="#f97316"/>
          <Insight text="<strong>Split casi 50/50.</strong> Voice Notes se sienten personales, TTS es sin fricción. Ambos son amados — es un moat de producto." type="blue"/>
        </Card>

        <Card title="Engagement de Cheers" sub="Tasa de favoritos y replays" accent="#8b5cf6">
          <div style={{display:'flex',flexDirection:'column',gap:12,paddingTop:8}}>
            <div style={{background:'#f8fafc',borderRadius:10,padding:'14px 16px',textAlign:'center'}}>
              <div style={{fontSize:32,fontWeight:800,color:'#ec4899'}}>{ch.favRate||ch.favoritedRate||BEH.cheers.favRate}%</div>
              <div style={{fontSize:12,color:'#64748b',marginTop:4}}>de cheers son guardados como favorito</div>
              <div style={{fontSize:10,color:'#94a3b8'}}>{n(ch.favorited||ch.totalFavorited||BEH.cheers.favorited)} cheers favoritos totales</div>
            </div>
            <div style={{background:'#f8fafc',borderRadius:10,padding:'14px 16px',textAlign:'center'}}>
              <div style={{fontSize:32,fontWeight:800,color:'#8b5cf6'}}>{ch.repRate||ch.replayedRate||BEH.cheers.repRate}%</div>
              <div style={{fontSize:12,color:'#64748b',marginTop:4}}>de cheers son reproducidos de nuevo</div>
              <div style={{fontSize:10,color:'#94a3b8'}}>{n(ch.replayed||ch.totalReplayed||BEH.cheers.replayed)} replays totales</div>
            </div>
          </div>
          <Insight text="Los usuarios <strong>guardan y repiten cheers</strong> — esto confirma el valor emocional. Los voice notes de gente conocida tienen mucho mayor replay rate." type="green"/>
        </Card>
      </Grid>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: CONVERSION
// ═══════════════════════════════════════════════════════════════════════════
function ConversionTab({ convData, live }: { convData:any; live:boolean }) {
  const c = convData || CONV;
  const steps = c.funnel?.steps || CONV.funnel;
  const plans = c.planDistribution || c.plans || CONV.plans;

  // Normalize steps
  const funnelSteps = steps.map((s:any) => ({
    label: s.name||s.label,
    count: s.count,
    color: s.color || '#6366f1',
  }));
  const base = funnelSteps[0]?.count || 1;

  return (
    <>
      <Grid cols={4}>
        <KPI label="Onboarding → Suscripción" value={`${pct(funnelSteps[1]?.count||349,funnelSteps[0]?.count||5375)}%`} color="#22c55e" sub="conv rate" size="lg" badge={live?'LIVE':undefined}/>
        <KPI label="Suscriptores (90d)" value={n(funnelSteps[1]?.count||349)} color="#6366f1" sub="subscription events"/>
        <KPI label="Runs Iniciados" value={n(funnelSteps[2]?.count||737)} color="#f97316" sub="post-subscription"/>
        <KPI label="Tasa Completion" value={`${pct(funnelSteps[3]?.count||704,funnelSteps[2]?.count||737)}%`} color="#3b82f6" sub="run_started → completed"/>
      </Grid>
      <Grid cols={4}>
        <KPI label="Onboarding Completados" value={n(funnelSteps[0]?.count||5375)} color="#94a3b8" sub="90 días"/>
        <KPI label="Activation Rate" value={`${Math.round((funnelSteps[2]?.count||737)/(funnelSteps[1]?.count||349)*100)}%`} color="#ec4899" sub="subs que corren"/>
        <KPI label="NUNCA corrieron" value={`${ACT.neverRanPct}%`} color="#ef4444" warn sub={`${ACT.neverRan} de ${ACT.totalSubs} subs`}/>
        <KPI label="MRR en riesgo" value={`$${ACT.atRiskMRR}`} color="#ef4444" warn sub="subs sin activar"/>
      </Grid>

      <Card title="Funnel de Conversión" sub="Mixpanel · 90 días · datos reales" accent="#6366f1">
        {funnelSteps.map((s:any, i:number) => {
          const pctOfBase = Math.round(s.count/base*100);
          const dropFromPrev = i>0 ? 100-Math.round(s.count/(funnelSteps[i-1].count||1)*100) : 0;
          return (
            <div key={i} style={{marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <div>
                  <span style={{fontSize:12,fontWeight:700,color:'#0f172a'}}>{i+1}. {s.label}</span>
                  {i>0&&<span style={{marginLeft:8,fontSize:10,color:'#ef4444',fontWeight:600}}>↓ {dropFromPrev}% drop</span>}
                </div>
                <span style={{fontSize:14,fontWeight:800,color:s.color||'#6366f1'}}>{n(s.count)} <span style={{fontSize:10,color:'#94a3b8',fontWeight:400}}>({pctOfBase}%)</span></span>
              </div>
              <div style={{height:24,background:'#f1f5f9',borderRadius:6,overflow:'hidden'}}>
                <div style={{width:`${pctOfBase}%`,height:'100%',background:s.color||PALETTE[i]||'#6366f1',borderRadius:6,display:'flex',alignItems:'center',paddingLeft:8,minWidth:40}}>
                  <span style={{fontSize:10,fontWeight:700,color:'#fff',whiteSpace:'nowrap'}}>{n(s.count)}</span>
                </div>
              </div>
            </div>
          );
        })}
        <Insight text="<strong>5,375 completan onboarding → sólo 349 suscriben (6.5%).</strong> El funnel de conversión es el mayor punto de optimización. A/B testear la propuesta de valor en el paywall." type="amber"/>
      </Card>

      <Grid cols={2}>
        <Card title="Distribución de Planes" sub="Suscriptores activos por plan" accent="#22c55e">
          <div style={{height:180}}>
            <Doughnut data={{
              labels: plans.map((p:any)=>p.plan),
              datasets:[{ data:plans.map((p:any)=>p.subs), backgroundColor:plans.map((p:any)=>p.color||'#6366f1'), borderWidth:0 }]
            }} options={DONUT}/>
          </div>
          <div style={{marginTop:8}}>
            {plans.map((p:any)=>(
              <Bar2 key={p.plan} label={`${p.plan} — ${p.subs} subs (${p.pct}%)`} val={p.subs} max={157} color={p.color||'#6366f1'}/>
            ))}
          </div>
          <Insight text="<strong>70% en mensual.</strong> Convirtiendo 20 mensuales a annual = +$200 ARR instantáneo. Lanzar upgrade campaign." type="blue"/>
        </Card>

        <Card title="Análisis Post-Suscripción" sub="¿Qué pasa después de pagar?" accent="#ef4444">
          <div style={{display:'flex',flexDirection:'column',gap:10,paddingTop:4}}>
            {[
              { label:'✅ Runners reales (≥1km)', count:ACT.realRunners, total:ACT.totalSubs, color:'#22c55e', note:'corrieron al menos una vez con distancia real' },
              { label:'🧪 Solo test runs (<1km)', count:ACT.testOnly, total:ACT.totalSubs, color:'#f59e0b', note:'probaron en casa, nunca corrieron afuera' },
              { label:'❌ Nunca corrieron', count:ACT.neverRan, total:ACT.totalSubs, color:'#ef4444', note:'pagaron, nunca iniciaron una corrida' },
            ].map(s=>(
              <div key={s.label} style={{background:'#f8fafc',borderRadius:8,padding:'10px 12px'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:12,fontWeight:700,color:'#0f172a'}}>{s.label}</span>
                  <span style={{fontSize:13,fontWeight:800,color:s.color}}>{s.count} <span style={{fontSize:10,color:'#94a3b8'}}>({pct(s.count,ACT.totalSubs)}%)</span></span>
                </div>
                <div style={{height:5,background:'#e2e8f0',borderRadius:3}}>
                  <div style={{width:`${pct(s.count,ACT.totalSubs)}%`,height:'100%',background:s.color,borderRadius:3}}/>
                </div>
                <div style={{fontSize:10,color:'#64748b',marginTop:3}}>{s.note}</div>
              </div>
            ))}
          </div>
          <Insight text={`<strong>${ACT.neverRanPct}% de suscriptores pagadores NUNCA corrieron.</strong> MRR en riesgo: $${ACT.atRiskMRR}. Implementar email onboarding sequence días 1, 3, 7 post-suscripción.`} type="red"/>
        </Card>
      </Grid>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: ACTIVATION
// ═══════════════════════════════════════════════════════════════════════════
function ActivationTab({ actData, live }: { actData:any; live:boolean }) {
  const a = actData || ACT;
  const neverRan    = a.neverRan ?? ACT.neverRan;
  const neverPct    = a.neverRanPct ?? ACT.neverRanPct;
  const testOnly    = a.segments?.testOnly ?? a.testOnly ?? ACT.testOnly;
  const realRunners = a.segments?.realRunners ?? a.realRunners ?? ACT.realRunners;
  const totalSubs   = a.totalSubscribers ?? ACT.totalSubs;
  const atRisk      = a.atRiskMRR ?? ACT.atRiskMRR;
  const rd          = a.runCountDistribution ?? a.runDist ?? ACT.runDist;

  return (
    <>
      {/* Big warning stat */}
      <div style={{background:'linear-gradient(135deg,#7f1d1d,#991b1b)',borderRadius:14,padding:'24px 28px',marginBottom:14,border:'1px solid #dc2626'}}>
        <div style={{fontSize:10,fontWeight:700,color:'#fca5a5',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>⚠️ Problema crítico de activación</div>
        <div style={{display:'flex',alignItems:'baseline',gap:16,flexWrap:'wrap'}}>
          <span style={{fontSize:64,fontWeight:900,color:'#fff',letterSpacing:'-0.04em',lineHeight:1}}>{neverPct}%</span>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:'#fca5a5'}}>de suscriptores pagadores</div>
            <div style={{fontSize:22,fontWeight:800,color:'#fff'}}>NUNCA iniciaron una corrida</div>
            <div style={{fontSize:12,color:'#fca5a5',marginTop:4}}>{neverRan} de {totalSubs} suscriptores · datos reales Mixpanel JQL · Apr 2 2026</div>
          </div>
        </div>
        <div style={{marginTop:16,padding:'12px 16px',borderRadius:8,background:'rgba(0,0,0,.3)'}}>
          <div style={{fontSize:12,color:'#fef2f2',lineHeight:1.7}}>
            <strong>MRR en riesgo: ${atRisk}</strong> — estos usuarios churnearán sin haber usado el producto.<br/>
            Solución: <strong>Email sequence días 1/3/7</strong> post-suscripción + in-app onboarding push para primera corrida.
          </div>
        </div>
      </div>

      <Grid cols={4}>
        <KPI label="Total Suscriptores" value={n(totalSubs)} color="#6366f1" sub="Mixpanel 365d · ambos eventos" badge={live?'LIVE':undefined}/>
        <KPI label="Nunca Corrieron" value={n(neverRan)} color="#ef4444" warn sub={`${neverPct}% del total`}/>
        <KPI label="Runners Reales" value={n(realRunners)} color="#22c55e" sub={`≥1km de distancia`}/>
        <KPI label="MRR en Riesgo" value={`$${atRisk}`} color="#ef4444" warn sub="subs sin activar"/>
      </Grid>

      <Grid cols={2}>
        <Card title="Segmentación de Suscriptores" sub="Activación post-suscripción" accent="#6366f1">
          <div style={{height:180}}>
            <Doughnut data={{
              labels:[`Nunca corrieron (${neverPct}%)`,`Solo tests (<1km)`,`Runners reales (≥1km)`],
              datasets:[{ data:[neverRan, testOnly, realRunners], backgroundColor:['#ef4444','#f59e0b','#22c55e'], borderWidth:0 }]
            }} options={DONUT}/>
          </div>
          <div style={{marginTop:10}}>
            <Bar2 label={`Runners reales ≥1km — ${realRunners}`} val={realRunners} max={totalSubs} color="#22c55e"/>
            <Bar2 label={`Solo test runs <1km — ${testOnly}`} val={testOnly} max={totalSubs} color="#f59e0b"/>
            <Bar2 label={`Nunca corrieron — ${neverRan}`} val={neverRan} max={totalSubs} color="#ef4444"/>
          </div>
        </Card>

        <Card title="Distribución de Runs por Suscriptor" sub="Entre los que sí corrieron" accent="#22c55e">
          <div style={{height:180}}>
            <Bar data={{
              labels:['1 run','2–5 runs','6–10 runs','11+ runs'],
              datasets:[{ data:[rd.one,rd.twoToFive,rd.sixToTen,rd.elevenPlus], backgroundColor:['#fca5a5','#fcd34d','#86efac','#22c55e'], borderRadius:4 }]
            }} options={CHART as any}/>
          </div>
          <div style={{marginTop:8}}>
            <Bar2 label={`1 run — ${rd.one} subs (alto riesgo churn)`} val={rd.one} max={rd.one+rd.twoToFive+rd.sixToTen+rd.elevenPlus} color="#fca5a5"/>
            <Bar2 label={`2–5 runs — ${rd.twoToFive} subs`} val={rd.twoToFive} max={rd.one+rd.twoToFive+rd.sixToTen+rd.elevenPlus} color="#fcd34d"/>
            <Bar2 label={`6–10 runs — ${rd.sixToTen} subs`} val={rd.sixToTen} max={rd.one+rd.twoToFive+rd.sixToTen+rd.elevenPlus} color="#86efac"/>
            <Bar2 label={`11+ runs — ${rd.elevenPlus} subs (power users)`} val={rd.elevenPlus} max={rd.one+rd.twoToFive+rd.sixToTen+rd.elevenPlus} color="#22c55e"/>
          </div>
          <Insight text={`<strong>${rd.one} suscriptores corrieron solo 1 vez</strong> — alto riesgo de churn. Trigger: si no corre en 7 días, mandar reminder personalizado.`} type="amber"/>
        </Card>
      </Grid>

      <Card title="Plan de Acción: Activación" sub="Pasos concretos para reducir el 55.3%" accent="#f97316">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {[
            { step:'1', title:'Email Day 1', desc:'Bienvenida + tutorial de primera corrida. CTA: "Inicia tu primera corrida hoy". Mostrar cómo recibir cheers.', color:'#6366f1' },
            { step:'2', title:'Email Day 3', desc:'Si no ha corrido: "Tu equipo te espera". Social proof con usuario real que corrió su primer kilómetro.', color:'#3b82f6' },
            { step:'3', title:'Email Day 7', desc:'Si no ha corrido: oferta especial o sesión de onboarding 1:1. Alert interno para follow-up manual en subs de alto valor.', color:'#f97316' },
            { step:'4', title:'In-App Nudge', desc:'Al abrir la app por segunda vez sin haber corrido: overlay "¿Lista para tu primera corrida? Te preparamos todo."', color:'#22c55e' },
          ].map(item=>(
            <div key={item.step} style={{background:'#f8fafc',borderRadius:10,padding:'14px 16px',borderLeft:`3px solid ${item.color}`}}>
              <div style={{fontSize:10,fontWeight:700,color:item.color,marginBottom:4}}>ACCIÓN {item.step}</div>
              <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:6}}>{item.title}</div>
              <div style={{fontSize:11,color:'#475569',lineHeight:1.6}}>{item.desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: P&L
// ═══════════════════════════════════════════════════════════════════════════
function PnlTab({ pnl, setPnl }: { pnl:PE[]; setPnl:(e:PE[])=>void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId]   = useState<string|null>(null);
  const [filter, setFilter]   = useState('all');
  const [form, setForm] = useState<Omit<PE,'id'>>({
    date: new Date().toISOString().split('T')[0], name:'', category:'Development',
    type:'expense', amount:0, notes:'',
  });

  const totalRevenue  = pnl.filter(e=>e.type==='revenue').reduce((s,e)=>s+e.amount,0);
  const totalExpenses = pnl.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amount,0);
  const netProfit     = totalRevenue - totalExpenses;

  const filtered = filter==='all' ? pnl : pnl.filter(e=>e.category===filter||e.type===filter);

  // Group expenses by category for chart
  const catTotals = PNL_CATS.reduce((acc,cat) => {
    const t = pnl.filter(e=>e.category===cat).reduce((s,e)=>s+e.amount,0);
    if (t>0) acc[cat] = t;
    return acc;
  }, {} as Record<string,number>);

  function save() {
    if (!form.name || !form.amount) return;
    const entry: PE = { ...form, id: editId || Date.now().toString() };
    const next = editId ? pnl.map(e=>e.id===editId?entry:e) : [entry,...pnl];
    setPnl(next); savePnl(next);
    setShowAdd(false); setEditId(null);
    setForm({ date:new Date().toISOString().split('T')[0], name:'', category:'Development', type:'expense', amount:0, notes:'' });
  }

  function del(id:string) {
    if (!confirm('¿Eliminar esta entrada?')) return;
    const next = pnl.filter(e=>e.id!==id);
    setPnl(next); savePnl(next);
  }

  function startEdit(e:PE) {
    setEditId(e.id); setForm({date:e.date,name:e.name,category:e.category,type:e.type,amount:e.amount,notes:e.notes});
    setShowAdd(true);
  }

  return (
    <>
      <Grid cols={4}>
        <KPI label="Total Revenue" value={$$(totalRevenue)} color="#22c55e" size="lg"/>
        <KPI label="Total Expenses" value={$$(totalExpenses)} color="#ef4444"/>
        <KPI label="Net Profit" value={$$(netProfit)} color={netProfit>=0?'#22c55e':'#ef4444'} warn={netProfit<0}/>
        <KPI label="Margin" value={`${totalRevenue>0?Math.round(netProfit/totalRevenue*100):0}%`} color={netProfit>=0?'#22c55e':'#ef4444'}/>
      </Grid>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {['all','expense','revenue',...PNL_CATS.slice(0,4)].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:'4px 10px',borderRadius:20,border:'1px solid',fontSize:10,fontWeight:700,cursor:'pointer',background:filter===f?'#0f172a':'#fff',color:filter===f?'#fff':'#64748b',borderColor:filter===f?'#0f172a':'#e2e8f0',textTransform:'capitalize'}}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={()=>{setShowAdd(true);setEditId(null);}} style={{padding:'7px 16px',borderRadius:8,background:'#6366f1',color:'#fff',border:'none',fontSize:12,fontWeight:700,cursor:'pointer'}}>
          + Agregar Entrada
        </button>
      </div>

      {showAdd&&(
        <Card title={editId?'Editar Entrada':'Nueva Entrada'} accent="#6366f1">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:'#64748b',marginBottom:4}}>FECHA</div>
              <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={{width:'100%',padding:'7px 10px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:12}}/>
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:'#64748b',marginBottom:4}}>NOMBRE</div>
              <input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ej: EAS Build" style={{width:'100%',padding:'7px 10px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:12}}/>
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:'#64748b',marginBottom:4}}>MONTO (USD)</div>
              <input type="number" value={form.amount||''} onChange={e=>setForm({...form,amount:Number(e.target.value)})} placeholder="0.00" style={{width:'100%',padding:'7px 10px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:12}}/>
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:'#64748b',marginBottom:4}}>CATEGORÍA</div>
              <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={{width:'100%',padding:'7px 10px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:12}}>
                {PNL_CATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:'#64748b',marginBottom:4}}>TIPO</div>
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value as any})} style={{width:'100%',padding:'7px 10px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:12}}>
                <option value="expense">Expense</option>
                <option value="revenue">Revenue</option>
              </select>
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:'#64748b',marginBottom:4}}>NOTAS</div>
              <input type="text" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Opcional" style={{width:'100%',padding:'7px 10px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:12}}/>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={save} style={{padding:'8px 20px',borderRadius:8,background:'#6366f1',color:'#fff',border:'none',fontSize:12,fontWeight:700,cursor:'pointer'}}>
              {editId?'Guardar':'Agregar'}
            </button>
            <button onClick={()=>{setShowAdd(false);setEditId(null);}} style={{padding:'8px 16px',borderRadius:8,background:'#f1f5f9',color:'#64748b',border:'none',fontSize:12,fontWeight:700,cursor:'pointer'}}>
              Cancelar
            </button>
          </div>
        </Card>
      )}

      {Object.keys(catTotals).length>0&&(
        <Grid cols={2}>
          <Card title="Gastos por Categoría" accent="#6366f1">
            <div style={{height:200}}>
              <Doughnut data={{
                labels: Object.keys(catTotals),
                datasets:[{ data:Object.values(catTotals), backgroundColor:Object.keys(catTotals).map(c=>PNL_CLR[c]||'#94a3b8'), borderWidth:0 }]
              }} options={DONUT}/>
            </div>
          </Card>
          <Card title="Resumen por Categoría" accent="#f97316">
            {Object.entries(catTotals).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>(
              <Bar2 key={cat} label={cat} val={amt} max={Math.max(...Object.values(catTotals))} color={PNL_CLR[cat]||'#94a3b8'} sub={$$(amt)}/>
            ))}
          </Card>
        </Grid>
      )}

      <Card title="Entradas" sub={`${filtered.length} registros · ${filter==='all'?'todos':'filtrado'}`} accent="#14b8a6">
        {filtered.length===0?(
          <div style={{textAlign:'center',padding:'24px',color:'#94a3b8',fontSize:13}}>
            No hay entradas. Agrega tu primera entrada de P&L.
          </div>
        ):(
          <Tbl
            heads={['Fecha','Nombre','Categoría','Tipo','Monto','Notas','']}
            rows={filtered.sort((a,b)=>b.date.localeCompare(a.date)).map(e=>[
              <span key="d" style={{fontSize:11,color:'#64748b'}}>{e.date}</span>,
              <strong key="n">{e.name}</strong>,
              <Badge key="c" label={e.category} color="gray"/>,
              <Badge key="t" label={e.type} color={e.type==='revenue'?'green':'red'}/>,
              <span key="a" style={{fontWeight:700,color:e.type==='revenue'?'#22c55e':'#ef4444'}}>{e.type==='expense'?'-':''}{$$(e.amount)}</span>,
              <span key="no" style={{fontSize:10,color:'#94a3b8'}}>{e.notes}</span>,
              <div key="ac" style={{display:'flex',gap:4}}>
                <button onClick={()=>startEdit(e)} style={{padding:'2px 8px',borderRadius:6,background:'#f1f5f9',border:'none',fontSize:10,cursor:'pointer',color:'#475569'}}>Edit</button>
                <button onClick={()=>del(e.id)} style={{padding:'2px 8px',borderRadius:6,background:'#fff1f2',border:'none',fontSize:10,cursor:'pointer',color:'#dc2626'}}>Del</button>
              </div>,
            ])}
          />
        )}
      </Card>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [tab,    setTab]    = useState(0);
  const [sw,     setSw]     = useState<any>(SW_SNAP);
  const [mpData, setMpData] = useState<any>(null);
  const [behData,setBehData]= useState<any>(null);
  const [convData,setConv]  = useState<any>(null);
  const [actData, setAct]   = useState<any>(null);
  const [liveSw,  setLiveSw]= useState(false);
  const [liveMp,  setLiveMp]= useState(false);
  const [updatedAt, setUpdatedAt] = useState('');
  const [pnl, setPnl] = useState<PE[]>([]);

  // Load P&L from localStorage
  useEffect(() => { setPnl(loadPnl()); }, []);

  // Fetch all data on mount
  useEffect(() => {
    // Superwall
    fetch('/api/superwall-update').then(r=>r.json()).then(d=>{
      if (d.ios) { setSw(d); setLiveSw(!!d.live); setUpdatedAt(d.updatedAt||''); }
    }).catch(()=>{});

    // Mixpanel main
    fetch('/api/mixpanel').then(r=>r.json()).then(d=>{
      if (d.ok && !d.fallback) { setMpData(d); setLiveMp(true); }
    }).catch(()=>{});

    // Behavior
    fetch('/api/behavior-deep').then(r=>r.json()).then(d=>{
      if (d.ok) setBehData(d);
    }).catch(()=>{});

    // Conversion funnel
    fetch('/api/conversion-funnel').then(r=>r.json()).then(d=>{
      if (d.ok) setConv(d);
    }).catch(()=>{});

    // Activation
    fetch('/api/mp-activation').then(r=>r.json()).then(d=>{
      if (d.ok && !d.fallback) setAct(d);
    }).catch(()=>{});
  }, []);

  const tabContent = [
    <RevenueTab    key="rev"  sw={sw}     live={liveSw}/>,
    <GrowthTab     key="gr"   mpData={mpData} live={liveMp}/>,
    <UsersTab      key="usr"/>,
    <BehaviorTab   key="beh"  behData={behData} live={liveMp}/>,
    <ConversionTab key="conv" convData={convData} live={liveMp}/>,
    <ActivationTab key="act"  actData={actData} live={liveMp}/>,
    <PnlTab        key="pnl"  pnl={pnl} setPnl={setPnl}/>,
  ];

  return (
    <>
      <Head>
        <title>CheerMyRun — Business Dashboard</title>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:#f1f5f9; color:#0f172a; -webkit-font-smoothing:antialiased; }
        button { font-family:inherit; }
        select, input { font-family:inherit; outline:none; color:#0f172a; background:#fff; }
        select:focus, input:focus { border-color:#6366f1 !important; }
      `}</style>

      {/* Header */}
      <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'0 24px',position:'sticky',top:0,zIndex:100,boxShadow:'0 1px 3px rgba(0,0,0,.05)'}}>
        <div style={{maxWidth:1400,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center',height:56}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:32,height:32,borderRadius:8,background:'linear-gradient(135deg,#6366f1,#ec4899)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🏃</div>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:'#0f172a',letterSpacing:'-0.02em'}}>CheerMyRun</div>
              <div style={{fontSize:10,color:'#94a3b8',fontWeight:500}}>Business Dashboard</div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            {(liveSw||liveMp)&&<Badge label="● LIVE DATA" color="green"/>}
            {updatedAt&&<span style={{fontSize:10,color:'#94a3b8'}}>Updated {new Date(updatedAt).toLocaleTimeString()}</span>}
            <span style={{fontSize:10,color:'#94a3b8'}}>{new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'0 24px',overflowX:'auto'}}>
        <div style={{maxWidth:1400,margin:'0 auto',display:'flex',gap:0}}>
          {TABS.map((t,i)=>(
            <button key={t} onClick={()=>setTab(i)} style={{
              padding:'14px 20px', border:'none', background:'none', cursor:'pointer',
              fontSize:12, fontWeight:700, whiteSpace:'nowrap',
              color: tab===i ? TAB_CLR[i] : '#64748b',
              borderBottom: tab===i ? `2px solid ${TAB_CLR[i]}` : '2px solid transparent',
              transition:'all .15s',
            }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{maxWidth:1400,margin:'0 auto',padding:'20px 24px 40px'}}>
        <div style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
          <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:TAB_CLR[tab]}}/>
          {TABS[tab]}
        </div>
        {tabContent[tab]}
      </div>
    </>
  );
}
