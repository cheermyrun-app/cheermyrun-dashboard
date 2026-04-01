import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

// ‚îÄ‚îÄ‚îÄ SUPERWALL SNAPSHOT ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
const SW_SNAPSHOT = {
  connected: true, live: false, updatedAt: '2026-03-31T01:04:31Z',
  ios: {
    last24h: { proceeds: 131.49,  newUsers: 31,   conversions: 9,   paywallRate: 83.87, convRate: 25.81 },
    last7d:  { proceeds: 1149.33, newUsers: 281,  conversions: 77,  paywallRate: 77.2,  convRate: 19.93 },
    last30d: { proceeds: 4391.37, newUsers: 2358, conversions: 326, paywallRate: 76.97, convRate: 12.72 },
    last90d: { proceeds: 7635.92, newUsers: 4712, conversions: 592, paywallRate: 75.1,  convRate: 11.67 },
  },
  campaigns: [
    { id:'43913', name:'Example Campaign',      users:1978, convs:184, convRate:9.3,   proceeds:2277.75 },
    { id:'49473', name:'Transaction Abandoned', users:1329, convs:142, convRate:10.68, proceeds:2177.87 },
  ],
  recentTransactions: [
    { userId:'69cad3f4', product:'Annual Discount', proceeds:26.35, type:'New Sub',      time:'2026-03-30T12:49:00', campaign:'paywall_decline' },
    { userId:'69cab4f4', product:'Annual',          proceeds:39.99, type:'New Sub',      time:'2026-03-30T10:34:00', campaign:'campaign_trigger' },
    { userId:'6977a772', product:'Weekly',          proceeds:2.99,  type:'Renewal',      time:'2026-03-30T09:44:00', campaign:'campaign_trigger' },
    { userId:'69ca9df4', product:'Annual Discount', proceeds:12.50, type:'New Sub',      time:'2026-03-30T09:04:00', campaign:'paywall_decline' },
    { userId:'694429f2', product:'Monthly',         proceeds:9.99,  type:'New Sub',      time:'2026-03-30T07:20:00', campaign:'campaign_trigger' },
    { userId:'69ca61f2', product:'Annual Discount', proceeds:24.99, type:'New Sub',      time:'2026-03-30T04:42:00', campaign:'paywall_decline' },
    { userId:'69ca34f2', product:'Monthly',         proceeds:6.03,  type:'New Sub',      time:'2026-03-30T01:32:00', campaign:'campaign_trigger' },
    { userId:'69c8b557', product:'Monthly',         proceeds:0,     type:'Cancellation', time:'2026-03-29T15:00:00', campaign:'campaign_trigger' },
    { userId:'69c9c6f1', product:'Annual Discount', proceeds:24.99, type:'New Sub',      time:'2026-03-29T19:00:00', campaign:'paywall_decline' },
    { userId:'69c9b8ee', product:'Annual Discount', proceeds:24.99, type:'New Sub',      time:'2026-03-29T20:00:00', campaign:'paywall_decline' },
  ],
};

// ‚îÄ‚îÄ‚îÄ MIXPANEL SNAPSHOT (30 days) ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
const DATES = ['03-01','03-02','03-03','03-04','03-05','03-06','03-07','03-08','03-09','03-10','03-11','03-12','03-13','03-14','03-15','03-16','03-17','03-18','03-19','03-20','03-21','03-22','03-23','03-24','03-25','03-26','03-27','03-28','03-29','03-30','03-31'];
const DAU    = [115,61,52,51,43,58,70,54,46,47,20,34,51,75,105,66,63,54,62,72,115,99,61,50,41,44,60,90,90,49,42];
const OBC    = [94,57,54,58,38,42,62,51,56,63,27,35,54,73,125,111,83,92,105,89,140,54,42,29,28,37,49,66,49,33,28];
const PAYWALL= [90,86,78,82,65,76,94,65,76,90,33,52,74,100,157,126,94,102,113,106,155,68,54,50,41,57,62,69,54,45,38];
const SUBS   = [2,0,4,4,3,8,5,3,3,1,2,2,55,59,15,8,5,5,6,4,19,10,2,4,3,10,14,16,15,7,4];
const CANCELS= [0,0,0,0,0,0,0,0,0,7,3,6,2,6,14,8,6,7,6,9,7,7,6,6,6,3,9,12,8,3,2];
const RENEWALS=[0,0,0,0,0,0,0,0,0,2,3,3,4,5,0,4,2,3,4,3,7,3,4,6,4,5,8,8,4,1,0];
const RUNS   = [12,10,12,10,6,15,17,22,5,7,5,6,9,32,60,15,14,13,20,21,56,59,11,10,14,6,14,59,56,15,8];
const CHEERS_D=[58,50,22,60,13,33,495,2167,10,13,98,13,27,332,1488,14,22,47,30,21,4058,11281,6,73,29,4,18,2566,1677,11,9];

// Weekly history
const WEEKS  = [{l:'Feb 23',s:44,c:0,r:0},{l:'Mar 02',s:27,c:0,r:0},{l:'Mar 09',s:137,c:38,r:17},{l:'Mar 16',s:57,c:50,r:26},{l:'Mar 23',s:64,c:50,r:39},{l:'Mar 30',s:33,c:16,r:4}];
// Weekly estimated proceeds (iOS, from Superwall conversion data)
const WEEKLY_PROCEEDS_LABELS = ['Feb 16','Feb 23','Mar 02','Mar 09','Mar 16','Mar 23','Mar 30'];
const WEEKLY_PROCEEDS        = [180, 320, 480, 1840, 1020, 1140, 590];

// ICP Data (161 paying subscribers with complete data)
const ICP = {
  gender:  [['Female',110],['Male',37],['Other',2]],
  age:     [['25‚Äì34',89],['18‚Äì24',27],['35‚Äì44',26],['45‚Äì54',7]],
  level:   [['Intermediate',84],['Beginner',56],['Advanced',8]],
  watch:   [['Apple Watch',60],['Garmin',59],['Fitbit',14],['Samsung',11],['Other',5]],
  source:  [['TikTok',84],['Instagram',36],['Friends',16],['Facebook',3]],
  phone:   [['Always',144],['Sometimes',13]],
  audio:   [['Always',131],['Sometimes',23],['Rarely',3]],
  listen:  [['Music',120],['Mix',31],['Podcasts',4],['Silence',2]],
  units:   [['Kilometers',110],['Miles',50]],
  races:   [['Half Marathon',686],['10K',427],['5K',324],['Marathon',185]],
  cheer:   [['TTS',13820],['Voice Note',12794]],
  cities:  [['Bogot√°, CO',39],['San Jos√©, CR',28],['Madrid, ES',21],['Iztapalapa, MX',20],['Melbourne, AU',18],['Sydney, AU',18],['Mexico City, MX',18],['Barranquilla, CO',17],['San Juan, PR',17],['Los Angeles, US',17]],
};

const FUNNEL = { steps:['App Opened','Onboarding','Paywall Seen','Subscribed'], values:[1230,115,76,5] };
const WEEKLY_CHEERS = [0,0,1988,2840,1981,15473,4373,11];
const WEEKLY_RUNS   = [0,0,112,89,114,193,158,13];
const WEEKLY_LABELS = ['Jan 26','Feb 2','Feb 9','Feb 16','Feb 23','Mar 9','Mar 16','Mar 23','Mar 30'];

// ‚îÄ‚îÄ‚îÄ P&L ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
const PNL_KEY='cmr_pnl_v3';
interface PE{id:string;date:string;name:string;category:string;type:string;amount:number;notes:string;}
const PNL_CATS=['Development','Influencer','Infrastructure','Tools/SaaS','Design','Marketing','Alex Investment','Revenue','Other'];
const PNL_COLORS:Record<string,string>={'Development':'#6366f1','Influencer':'#ec4899','Infrastructure':'#3b82f6','Tools/SaaS':'#f97316','Design':'#8b5cf6','Marketing':'#14b8a6','Alex Investment':'#22c55e','Revenue':'#16a34a','Other':'#94a3b8'};
const loadPnl=():PE[]=>{try{return JSON.parse(localStorage.getItem(PNL_KEY)||'[]');}catch{return[];}};
const savePnl=(e:PE[])=>localStorage.setItem(PNL_KEY,JSON.stringify(e));

// ‚îÄ‚îÄ‚îÄ UTILS ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
const $=(n:number,d=0)=>n.toLocaleString('en-US',{maximumFractionDigits:d});
const $$=(n:number)=>'$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const pct=(a:number,b:number)=>b>0?Math.round(a/b*100):0;
const sliceN=(arr:number[],d:number)=>d>=999?arr:arr.slice(-Math.min(d,arr.length));
const sliceS=(arr:string[],d:number)=>d>=999?arr:arr.slice(-Math.min(d,arr.length));
const sumN=(a:number[])=>a.reduce((s,v)=>s+v,0);

const TABS=['Revenue','Growth','Engagement','Users','P&L'];
const PERIODS=[{l:'7D',v:7},{l:'30D',v:30},{l:'All',v:999}];
const COLS=['#6366f1','#ec4899','#3b82f6','#f97316','#8b5cf6','#14b8a6','#22c55e','#f59e0b','#dc2626'];

const CHART_BASE = {
  responsive:true, maintainAspectRatio:false,
  plugins:{legend:{display:false},tooltip:{backgroundColor:'rgba(0,0,0,0.85)',titleFont:{size:11,weight:'bold' as const},bodyFont:{size:11},padding:10,cornerRadius:8}},
  scales:{x:{grid:{display:false},ticks:{color:'#888',font:{size:10},maxRotation:0}},y:{grid:{color:'rgba(128,128,128,0.08)'},ticks:{color:'#888',font:{size:10}},beginAtZero:true}}
};
const DONUT_OPT={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,position:'right' as const,labels:{font:{size:11},boxWidth:10,padding:8,color:'#888'}}}};

// ‚îÄ‚îÄ‚îÄ COMPONENTS ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
function KPI({label,value,sub,delta,color,live,size='md',badge}:{label:string;value:any;sub?:string;delta?:number|null;color?:string;live?:boolean;size?:'sm'|'md'|'lg';badge?:string}){
  return(
    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:14,padding:size==='lg'?'20px 22px':'14px 16px',borderTop:color?`3px solid ${color}`:'1px solid var(--border)',position:'relative'}}>
      {color&&<div style={{position:'absolute',top:0,left:0,right:0,height:3,background:color,opacity:.8,borderRadius:'14px 14px 0 0'}}/>}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
        <span style={{fontSize:10,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.08em'}}>{label}</span>
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          {badge&&<span style={{fontSize:9,padding:'2px 6px',borderRadius:20,background:'#eff6ff',color:'#1d4ed8',fontWeight:700}}>{badge}</span>}
          {live&&<span style={{fontSize:9,padding:'2px 6px',borderRadius:20,background:'#dcfce7',color:'#166534',fontWeight:700}}>LIVE</span>}
        </div>
      </div>
      <div style={{fontSize:size==='lg'?32:size==='md'?22:17,fontWeight:700,color:'var(--fg)',lineHeight:1.1,letterSpacing:'-0.02em'}}>{value}</div>
      {delta!=null&&<div style={{fontSize:11,marginTop:4,fontWeight:500,color:delta>=0?'#22c55e':'#f43f5e'}}>{delta>=0?'‚ñ≤':'‚ñº'} {Math.abs(delta)}% vs prev</div>}
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
  const c={blue:['#eff6ff','#1d4ed8'],green:['#f0fdf4','#166534'],amber:['#fef9c3','#854d0e'],red:['#fff1f2','#9f1239'],gray:['var(--surface)','var(--muted)']}[color];
  return <span style={{fontSize:9,padding:'2px 7px',borderRadius:20,background:c[0],color:c[1],fontWeight:700,letterSpacing:'.05em'}}>{label}</span>;
}

function Insight({text,type='blue'}:{text:string;type?:'blue'|'green'|'amber'|'red'}){
  const c={blue:['#eff6ff','#1e40af'],green:['#f0fdf4','#166534'],amber:['#fffbeb','#92400e'],red:['#fff1f2','#9f1239']}[type];
  const icon={blue:'üí°',green:'‚úÖ',amber:'‚ö†Ô∏è',red:'üî¥'}[type];
  return <div style={{marginTop:10,padding:'10px 12px',borderRadius:10,background:c[0],fontSize:11,color:c[1],lineHeight:1.6}} dangerouslySetInnerHTML={{__html:`${icon} ${text}`}}/>;
}

function GoalBar({current,goal,label,deadline}:{current:number;goal:number;label:string;deadline:string}){
  const progress=Math.min(current/goal*100,100);
  const daysLeft=Math.max(0,Math.ceil((new Date(deadline).getTime()-Date.now())/86400000));
  const multNeeded=Math.round((goal/current)*10)/10;
  return(
    <div style={{background:'linear-gradient(135deg,#111110 0%,#1c1c1b 100%)',borderRadius:16,padding:'20px 24px',marginBottom:16,border:'1px solid #2e2e2c',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:-20,right:-20,width:120,height:120,borderRadius:'50%',background:'rgba(249,115,22,.08)'}}/>
      <div style={{position:'absolute',bottom:-30,left:100,width:160,height:160,borderRadius:'50%',background:'rgba(99,102,241,.06)'}}/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,flexWrap:'wrap',gap:8}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:4}}>üéØ {label}</div>
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
          Need <strong style={{color:'#f5f4f1'}}>{Math.ceil((goal-current)/daysLeft)}/day</strong> MRR growth<br/>
          = ~<strong style={{color:'#f5f4f1'}}>{Math.ceil((goal-current)/9.99/daysLeft)} new subs/day</strong>
        </div>
      </div>
    </div>
  );
}

// ‚îÄ‚îÄ‚îÄ MAIN DASHBOARD ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
export default function Dashboard(){
  const [tab,setTab]=useState('Revenue');
  const [period,setPeriod]=useState(30);
  const [swPeriod,setSwPeriod]=useState<'last24h'|'last7d'|'last30d'|'last90d'>('last30d');
  const [sw,setSw]=useState<any>(SW_SNAPSHOT);
  const [swLoading,setSwLoading]=useState(false);
  const [mpData,setMpData]=useState<any>(null);
  const [mpLoading,setMpLoading]=useState(false);
  const [lastRefresh,setLastRefresh]=useState<Date|null>(null);
  const [pnl,setPnl]=useState<PE[]>([]);
  const [showAdd,setShowAdd]=useState(false);
  const [editId,setEditId]=useState<string|null>(null);
  const [pnlFilter,setPnlFilter]=useState('all');
  const [form,setForm]=useState({date:new Date().toISOString().split('T')[0],name:'',category:'Development',type:'Expense',amount:'',notes:''});
  const [cmpA,setCmpA]=useState(2);
  const [cmpB,setCmpB]=useState(4);

  const fetchSW=useCallback(async()=>{
    setSwLoading(true);
    try{const r=await fetch('/api/superwall-update');const d=await r.json();if(d.connected)setSw(d);setLastRefresh(new Date());}catch(e){}finally{setSwLoading(false);}
  },[]);

  const fetchMP=useCallback(async()=>{
    setMpLoading(true);
    try{const r=await fetch('/api/mixpanel');const d=await r.json();if(d.ok)setMpData(d);}catch(e){}finally{setMpLoading(false);}
  },[]);

  useEffect(()=>{fetchSW();fetchMP();setPnl(loadPnl());},[fetchSW,fetchMP]);

  // Live data overrides (Mixpanel if available, else snapshot)
  const dates   = mpData?.dates30 || DATES;
  const dauArr  = mpData?.dau     || DAU;
  const subArr  = mpData?.subs30  || SUBS;
  const canArr  = mpData?.cancels || CANCELS;
  const renArr  = mpData?.renewals|| RENEWALS;
  const runArr  = mpData?.runs    || RUNS;
  const cheArr  = mpData?.cheers  || CHEERS_D;

  const dts=sliceS(dates,period);
  const dau=sliceN(dauArr,period),sub=sliceN(subArr,period);
  const can=sliceN(canArr,period),ren=sliceN(renArr,period);
  const run=sliceN(runArr,period),che=sliceN(cheArr,period);
  const tSubs=sumN(sub),tCan=sumN(can),tRen=sumN(ren),tRun=sumN(run),tChe=sumN(che),tDAU=sumN(dau);
  const netSubs=tSubs-tCan;

  // Superwall
  const swD=(sw?.ios||SW_SNAPSHOT.ios)[swPeriod]||(SW_SNAPSHOT.ios.last30d);
  const swConnected=sw?.connected&&(sw?.ios?.last30d?.proceeds||0)>0;
  const swPeriodLabel={last24h:'24H',last7d:'7D',last30d:'30D',last90d:'90D'}[swPeriod];

  // P&L
  const expenses=pnl.filter(e=>e.type==='Expense').reduce((s,e)=>s+e.amount,0);
  const income  =pnl.filter(e=>e.type==='Income').reduce((s,e)=>s+e.amount,0);
  const byCat   =pnl.filter(e=>e.type==='Expense').reduce((a:Record<string,number>,e)=>{a[e.category]=(a[e.category]||0)+e.amount;return a;},{});
  const byMonth =pnl.reduce((a:Record<string,{e:number,i:number}>,e)=>{const m=e.date.substring(0,7);if(!a[m])a[m]={e:0,i:0};if(e.type==='Expense')a[m].e+=e.amount;else a[m].i+=e.amount;return a;},{});
  const months  =Object.keys(byMonth).sort();

  function savePnlEntry(){
    if(!form.name||!form.amount)return;
    const entry:PE={id:editId||Date.now().toString(),date:form.date,name:form.name,category:form.category,type:form.type,amount:Number(form.amount),notes:form.notes};
    const updated=editId?pnl.map(e=>e.id===editId?entry:e):[...pnl,entry];
    const sorted=updated.sort((a,b)=>b.date.localeCompare(a.date));
    setPnl(sorted);savePnl(sorted);setShowAdd(false);setEditId(null);
    setForm({date:new Date().toISOString().split('T')[0],name:'',category:'Development',type:'Expense',amount:'',notes:''});
  }
  function delPnl(id:string){const u=pnl.filter(e=>e.id!==id);setPnl(u);savePnl(u);}
  function editPnl(e:PE){setForm({date:e.date,name:e.name,category:e.category,type:e.type,amount:String(e.amount),notes:e.notes});setEditId(e.id);setShowAdd(true);}

  // ‚îÄ‚îÄ‚îÄ Revenue Metrics ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
  const proceeds30d = sw?.ios?.last30d?.proceeds || SW_SNAPSHOT.ios.last30d.proceeds;
  const proceeds90d = sw?.ios?.last90d?.proceeds || SW_SNAPSHOT.ios.last90d.proceeds;
  const totalNewSubs90 = 336;
  const planMonthly=110, planAnnual=39, planDiscount=3, planWeekly=5;
  const totalActive = planMonthly+planAnnual+planDiscount+planWeekly; // 157
  const weeklyChurnArr=[38,50,50,9];
  const avgWeeklyCancels=weeklyChurnArr.reduce((a,b)=>a+b,0)/weeklyChurnArr.length;
  const monthlyChurnRate=avgWeeklyCancels*4.33/totalActive;
  const monthlyChurnPct=Math.round(monthlyChurnRate*100*10)/10;
  const annualSubsCount=planAnnual+planDiscount;
  const renewalForecast30d=Math.round(((planMonthly*9.99)+(planWeekly*2.99*4.33)+(annualSubsCount*(29.99/12)))*100)/100;
  const mrr=Math.round(((planMonthly*9.99)+(planAnnual*29.99/12)+(planDiscount*9.99/12)+(planWeekly*2.99*4.33))*100)/100;
  const arr=Math.round(mrr*12*100)/100;
  const avgRevPerUser=proceeds90d/totalNewSubs90;
  const monthlyChurnForLTV=monthlyChurnRate>0?monthlyChurnRate:0.35;
  const ltv=Math.round((avgRevPerUser/monthlyChurnForLTV)*100)/100;
  const cacBlended=expenses>0?Math.round(expenses/totalNewSubs90*100)/100:null;
  const ltvCacRatio=(cacBlended&&ltv>0)?Math.round(ltv/cacBlended*10)/10:null;
  const arpu30d=Math.round(proceeds30d/totalActive*100)/100;
  const churnWeeks=['Mar 9','Mar 16','Mar 23','Mar 30'];
  const churnData=[Math.round(38/137*100),Math.round(50/57*100),Math.round(50/64*100),Math.round(9/33*100)];
  const renewalData=[17,26,39,3];

  const wA=WEEKS[cmpA],wB=WEEKS[cmpB];

  return(<>
    <Head>
      <title>Cheer My Run ‚Äî Investor Dashboard</title>
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
    </Head>
    <style>{`
      :root{
        --bg:#f4f4f2;--surface:#eae9e6;--card:#ffffff;--border:#e2e1de;
        --fg:#111110;--fg-2:#444;--muted:#888;
        --green:#16a34a;--red:#dc2626;--blue:#2563eb;
      }
      @media(prefers-color-scheme:dark){:root{
        --bg:#111110;--surface:#1c1c1b;--card:#1f1f1e;--border:#2e2e2c;
        --fg:#f5f4f1;--fg-2:#bbb;--muted:#666;
      }}
      *{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased}
      body{font-family:'DM Sans',system-ui,sans-serif;background:var(--bg);color:var(--fg);font-size:14px;line-height:1.5}
      code,pre{font-family:'DM Mono',monospace}
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
      {/* ‚îÄ‚îÄ SIDEBAR ‚îÄ‚îÄ */}
      <div style={{width:220,background:'var(--card)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',flexShrink:0}}>
        <div style={{padding:'18px 18px 14px',borderBottom:'1px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:34,height:34,borderRadius:10,background:'linear-gradient(135deg,#f97316,#dc2626)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>üèÉ</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,letterSpacing:'-0.01em'}}>Cheer My Run</div>
              <div style={{fontSize:10,color:'var(--muted)'}}>Investor Dashboard</div>
            </div>
          </div>
        </div>

        {/* MRR mini-bar in sidebar */}
        <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',background:'var(--surface)'}}>
          <div style={{fontSize:9,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:4}}>üéØ MRR Goal ¬∑ Apr 30</div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
            <span style={{fontSize:12,fontWeight:700}}>{$$(mrr)}</span>
            <span style={{fontSize:10,color:'var(--muted)'}}>/ $100k</span>
          </div>
          <div style={{height:4,background:'var(--border)',borderRadius:2}}>
            <div style={{width:`${Math.min(mrr/1000*100,100)}%`,height:'100%',background:'linear-gradient(90deg,#6366f1,#f97316)',borderRadius:2}}/>
          </div>
          <div style={{fontSize:9,color:'var(--muted)',marginTop:4}}>{(mrr/1000).toFixed(1)}% complete</div>
        </div>

        <nav style={{padding:'8px 10px',flex:1,overflowY:'auto'}}>
          <div style={{fontSize:9,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.1em',padding:'8px 8px 4px'}}>Analytics</div>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{display:'block',width:'100%',textAlign:'left',padding:'7px 10px',borderRadius:8,fontSize:13,cursor:'pointer',background:tab===t?'var(--surface)':'transparent',border:'none',color:tab===t?'var(--fg)':'var(--muted)',fontFamily:'inherit',fontWeight:tab===t?600:400,marginBottom:1,transition:'all .1s'}}>
              {{'Revenue':'üí∞ Revenue','Growth':'üìà Growth','Engagement':'üèÉ Engagement','Users':'üë• Users','P&L':'üìã P&L'}[t]||t}
            </button>
          ))}
        </nav>

        <div style={{padding:'12px 14px',borderTop:'1px solid var(--border)'}}>
          <div style={{fontSize:9,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Data Sources</div>
          <div style={{marginBottom:5}}>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:swConnected?'#22c55e':'#f59e0b',flexShrink:0}}/>
              <span style={{fontSize:11,color:'var(--fg-2)',fontWeight:500}}>Superwall</span>
              {swLoading?<span style={{fontSize:9,color:'var(--muted)'}}>‚Ä¶</span>:swConnected?<span className="pill" style={{background:'#dcfce7',color:'#166534'}}>LIVE</span>:<span className="pill" style={{background:'#fef9c3',color:'#854d0e'}}>CACHED</span>}
            </div>
            {lastRefresh&&<div style={{fontSize:9,color:'var(--muted)',paddingLeft:12}}>Updated {lastRefresh.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</div>}
          </div>
          <div style={{marginBottom:5}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:mpData?'#22c55e':'#f59e0b',flexShrink:0}}/>
              <span style={{fontSize:11,color:'var(--fg-2)',fontWeight:500}}>Mixpanel</span>
              {mpLoading?<span style={{fontSize:9,color:'var(--muted)'}}>‚Ä¶</span>:mpData?<span className="pill" style={{background:'#dcfce7',color:'#166534'}}>LIVE</span>:<span className="pill" style={{background:'#fef9c3',color:'#854d0e'}}>CACHED</span>}
            </div>
          </div>
          <button onClick={()=>{fetchSW();fetchMP();}} style={{width:'100%',fontSize:10,padding:'5px',borderRadius:7,border:'1px solid var(--border)',background:'var(--surface)',cursor:'pointer',color:'var(--muted)',fontFamily:'inherit'}}>‚Üª Refresh All</button>
        </div>
      </div>

      {/* ‚îÄ‚îÄ MAIN ‚îÄ‚îÄ */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        {/* Header */}
        <div style={{background:'var(--card)',borderBottom:'1px solid var(--border)',padding:'10px 22px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,flexWrap:'wrap',gap:8}}>
          <div>
            <div style={{fontSize:16,fontWeight:700,letterSpacing:'-0.02em'}}>{{'Revenue':'üí∞ Revenue','Growth':'üìà Growth','Engagement':'üèÉ Runs & Engagement','Users':'üë• User Profile','P&L':'üìã P&L'}[tab]||tab}</div>
            <div style={{fontSize:10,color:'var(--muted)'}}>CheerMyRun ¬∑ {new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>
          </div>
          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
            {tab!=='Users'&&tab!=='P&L'&&(
              <>{PERIODS.map(p=><button key={p.v} className={`btn${period===p.v?' on':''}`} onClick={()=>setPeriod(p.v)}>{p.l}</button>)}</>
            )}
            {tab==='Revenue'&&(
              <div style={{display:'flex',gap:3,paddingLeft:8,borderLeft:'1px solid var(--border)',marginLeft:4}}>
                {(['last24h','last7d','last30d','last90d'] as const).map(p=>(
                  <button key={p} className={`btn${swPeriod===p?' on':''}`} onClick={()=>setSwPeriod(p)}>
                    {{last24h:'24H',last7d:'7D',last30d:'30D',last90d:'90D'}[p]}
                  </button>
                ))}
              </div>
            )}
            {tab==='P&L'&&<button className="btn-primary" onClick={()=>{setShowAdd(true);setEditId(null);}}>+ Add Entry</button>}
          </div>
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:'auto',padding:'20px 22px'}}>

{/* ‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê REVENUE ‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê */}
{tab==='Revenue'&&(<>
  {/* Goal tracker */}
  <GoalBar current={mrr} goal={100000} label="MRR Goal ‚Äî April 30, 2026" deadline="2026-04-30"/>

  {/* Superwall status */}
  <div style={{background:swConnected?'#f0fdf4':'#fffbeb',border:`1px solid ${swConnected?'#86efac':'#fde68a'}`,borderRadius:12,padding:'8px 14px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
    <div style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:swConnected?'#166534':'#92400e'}}>
      <span style={{fontSize:14}}>{swConnected?'‚úÖ':'‚è≥'}</span>
      <strong>Superwall {swConnected?'LIVE ¬∑ iOS only':'snapshot (cached)'}</strong>
      {sw?.updatedAt&&<span style={{opacity:.7}}>¬∑ {new Date(sw.updatedAt).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>}
    </div>
    <button className="btn" onClick={fetchSW} style={{fontSize:10}}>‚Üª Refresh</button>
  </div>

  {/* Revenue KPIs */}
  <div style={{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Proceeds ¬∑ iOS ¬∑ {swPeriodLabel}</div>
  <div className="g4" style={{marginBottom:0}}>
    <KPI label="Proceeds" value={$$(swD.proceeds)} color="#16a34a" live={swConnected} size="lg" sub={`${swPeriodLabel} net (App Store)`}/>
    <KPI label="New Users" value={$(swD.newUsers)} color="#6366f1" live={swConnected} sub="unique installs"/>
    <KPI label="Conversions" value={$(swD.conversions)} color="#f97316" live={swConnected} sub="paid subscriptions"/>
    <KPI label="Conv. Rate" value={swD.convRate.toFixed(1)+'%'} color="#ec4899" live={swConnected} sub="paywall ‚Üí paid"/>
  </div>

  {/* MRR / ARR / ARR rate */}
  <div style={{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,marginTop:16}}>Recurring Revenue</div>
  <div className="g4" style={{marginBottom:20}}>
    <KPI label="MRR" value={$$(mrr)} color="#22c55e" sub="monthly recurring revenue" size="lg"/>
    <KPI label="ARR" value={$$(arr)} color="#22c55e" sub="annualized run rate"/>
    <KPI label="Paywall Rate" value={swD.paywallRate>0?swD.paywallRate.toFixed(1)+'%':'76.97%'} live={swConnected} sub="% users hitting paywall" color="#3b82f6"/>
    <KPI label="ARPU (30d)" value={$$(arpu30d)} color="#8b5cf6" sub="avg revenue per active user"/>
  </div>

  {/* Weekly Revenue Trend */}
  <div className="g2">
    <Section title="Weekly Proceeds Trend ¬∑ iOS" sub="Estimated from Superwall conversion data ¬∑ 7 weeks">
      <div style={{height:200}}>
        <Bar data={{
          labels:WEEKLY_PROCEEDS_LABELS,
          datasets:[{
            label:'Weekly Proceeds',
            data:WEEKLY_PROCEEDS,
            backgroundColor:WEEKLY_PROCEEDS.map((_,i)=>i===WEEKLY_PROCEEDS.length-1?'#22c55e':'#6366f1'),
            borderRadius:5
          }]
        }} options={{...CHART_BASE,plugins:{...CHART_BASE.plugins,tooltip:{...CHART_BASE.plugins.tooltip,callbacks:{label:(c:any)=>'$'+c.raw.toLocaleString()}}}} as any}/>
      </div>
      <Insight text="Revenue growing week-over-week. <strong>Mar 9 spike: $1,840 in one week</strong> from viral TikTok content. Mar 30 week trending toward $1,149 (7d actual from Superwall)." type="green"/>
    </Section>

    <Section title="Churn vs Renewals ¬∑ Weekly" sub="Last 4 weeks ‚Äî retention health">
      <div style={{height:200}}>
        <Bar data={{
          labels:churnWeeks,
          datasets:[
            {label:'Cancels',data:weeklyChurnArr,backgroundColor:'#f43f5e',borderRadius:4},
            {label:'Renewals',data:renewalData,backgroundColor:'#22c55e',borderRadius:4}
          ]
        }} options={{...CHART_BASE,plugins:{...CHART_BASE.plugins,legend:{display:true,labels:{font:{size:10},boxWidth:8,color:'#888'}}}} as any}/>
      </div>
      <Insight text="Renewals trending <strong>17 ‚Üí 26 ‚Üí 39</strong> over 3 weeks. Churn peaked Mar 16 (early cohort drop-off). Week of Mar 30 looking much healthier." type="amber"/>
    </Section>
  </div>

  {/* Subscriber Health */}
  <div style={{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Subscriber Health</div>
  <div className="g4" style={{marginBottom:20}}>
    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderTop:'3px solid #22c55e',borderRadius:14,padding:'14px 16px'}}>
      <div style={{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:4}}>Active Paying</div>
      <div style={{fontSize:28,fontWeight:700,color:'#16a34a',letterSpacing:'-0.03em'}}>{totalActive}</div>
      <div style={{fontSize:10,color:'var(--muted)',marginTop:4}}>confirmed subscribers</div>
      <div style={{marginTop:10}}>
        <MiniBar label={`Monthly ¬∑ ${planMonthly}`} val={planMonthly} max={totalActive} color="#6366f1"/>
        <MiniBar label={`Annual ¬∑ ${planAnnual}`} val={planAnnual} max={totalActive} color="#3b82f6"/>
        <MiniBar label={`Annual Disc ¬∑ ${planDiscount}`} val={planDiscount} max={totalActive} color="#0891b2"/>
        <MiniBar label={`Weekly ¬∑ ${planWeekly}`} val={planWeekly} max={totalActive} color="#f97316"/>
      </div>
    </div>
    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderTop:'3px solid #f43f5e',borderRadius:14,padding:'14px 16px'}}>
      <div style={{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:4}}>Monthly Churn</div>
      <div style={{fontSize:28,fontWeight:700,color:monthlyChurnPct>50?'#dc2626':monthlyChurnPct>25?'#f59e0b':'#16a34a',letterSpacing:'-0.03em'}}>{monthlyChurnPct}%</div>
      <div style={{fontSize:10,color:'var(--muted)',marginTop:4}}>avg cancels / active base</div>
      <div style={{marginTop:8,padding:'8px 10px',background:'#fff1f2',borderRadius:8,fontSize:11,color:'#9f1239'}}>
        <strong>Weekly cancels:</strong> {weeklyChurnArr.join(' ¬∑ ')} users<br/>
        <strong>Avg/week:</strong> {avgWeeklyCancels.toFixed(0)} cancels
      </div>
      <div style={{marginTop:6,fontSize:10,color:'var(--muted)'}}>‚ö†Ô∏è High churn = early-cohort drop-off. Day 7-14 activation is critical lever.</div>
    </div>
    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderTop:'3px solid #6366f1',borderRadius:14,padding:'14px 16px'}}>
      <div style={{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:4}}>Renewal Forecast</div>
      <div style={{fontSize:28,fontWeight:700,color:'#6366f1',letterSpacing:'-0.03em'}}>{$$(renewalForecast30d)}</div>
      <div style={{fontSize:10,color:'var(--muted)',marginTop:4}}>expected next 30 days</div>
      <div style={{marginTop:8,fontSize:11,color:'var(--fg-2)',lineHeight:1.7}}>
        {planMonthly} monthly √ó $9.99 = ${(planMonthly*9.99).toFixed(0)}<br/>
        {annualSubsCount} annual (monthly portion) = ${(annualSubsCount*29.99/12).toFixed(0)}<br/>
        {planWeekly} weekly √ó $2.99 √ó 4.33 = ${(planWeekly*2.99*4.33).toFixed(0)}
      </div>
    </div>
    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderTop:'3px solid #f97316',borderRadius:14,padding:'14px 16px'}}>
      <div style={{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:4}}>Renewals 90d Actual</div>
      <div style={{fontSize:28,fontWeight:700,color:'#f97316',letterSpacing:'-0.03em'}}>85</div>
      <div style={{fontSize:10,color:'var(--muted)',marginTop:4}}>successful renewals (Mixpanel)</div>
      <div style={{marginTop:8}}>
        {[{l:'Mar 9',v:17,g:'#bbf7d0'},{l:'Mar 16',v:26,g:'#86efac'},{l:'Mar 23',v:39,g:'#22c55e'},{l:'Mar 30',v:3,g:'#d1fae5'}].map(r=>(
          <div key={r.l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:11,marginBottom:4}}>
            <span style={{color:'var(--muted)'}}>{r.l}</span>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:30,height:4,background:'var(--surface)',borderRadius:2}}><div style={{width:`${r.v/39*100}%`,height:'100%',background:r.g,borderRadius:2}}/></div>
              <span style={{fontWeight:600,color:'var(--fg)',fontSize:12}}>{r.v}</span>
            </div>
          </div>
        ))}
        <div style={{marginTop:4,fontSize:10,color:'#22c55e',fontWeight:600}}>‚Üó Trending up 17‚Üí26‚Üí39</div>
      </div>
    </div>
  </div>

  {/* Unit Economics */}
  <div style={{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Unit Economics</div>
  <div className="g4" style={{marginBottom:20}}>
    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderTop:'3px solid #8b5cf6',borderRadius:14,padding:'14px 16px'}}>
      <div style={{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:4}}>LTV (estimated)</div>
      <div style={{fontSize:28,fontWeight:700,color:'#8b5cf6',letterSpacing:'-0.03em'}}>{$$(ltv)}</div>
      <div style={{fontSize:10,color:'var(--muted)',marginTop:4}}>avg revenue / monthly churn</div>
      <div style={{marginTop:6,fontSize:10,color:'var(--fg-2)',lineHeight:1.5}}>
        Rev/user: {$$(avgRevPerUser)}<br/>
        Monthly churn: {monthlyChurnPct}%<br/>
        <span style={{color:'var(--muted)'}}>Formula: ARPC √∑ churn rate</span>
      </div>
    </div>
    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderTop:'3px solid #0891b2',borderRadius:14,padding:'14px 16px'}}>
      <div style={{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:4}}>CAC (blended)</div>
      <div style={{fontSize:28,fontWeight:700,color:cacBlended?'#0891b2':'var(--muted)',letterSpacing:'-0.03em'}}>{cacBlended?$$(cacBlended):'‚Äî'}</div>
      <div style={{fontSize:10,color:'var(--muted)',marginTop:4}}>{cacBlended?'total spend / new subs (90d)':'Add expenses in P&L tab'}</div>
      {!cacBlended&&<div style={{marginTop:8,padding:'8px 10px',background:'#fffbeb',borderRadius:8,fontSize:10,color:'#92400e'}}>‚û° Go to P&L tab and add your marketing spend to unlock CAC & LTV:CAC ratio</div>}
      {cacBlended&&<div style={{marginTop:6,fontSize:10,color:'var(--fg-2)'}}>Total spend: ${expenses.toLocaleString()}<br/>{totalNewSubs90} conversions (90d)</div>}
    </div>
    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderTop:'3px solid #14b8a6',borderRadius:14,padding:'14px 16px'}}>
      <div style={{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:4}}>LTV : CAC Ratio</div>
      <div style={{fontSize:28,fontWeight:700,color:ltvCacRatio&&ltvCacRatio>=3?'#16a34a':ltvCacRatio?'#f59e0b':'var(--muted)',letterSpacing:'-0.03em'}}>{ltvCacRatio?ltvCacRatio+'x':'‚Äî'}</div>
      <div style={{fontSize:10,color:'var(--muted)',marginTop:4}}>target: {'>'} 3x is healthy</div>
      {ltvCacRatio&&<div style={{marginTop:6,padding:'6px 8px',background:ltvCacRatio>=3?'#f0fdf4':'#fffbeb',borderRadius:7,fontSize:10,color:ltvCacRatio>=3?'#166534':'#92400e'}}>{ltvCacRatio>=3?'‚úÖ Healthy ratio':'‚ö†Ô∏è Improve retention or reduce CAC'}</div>}
      {!ltvCacRatio&&<div style={{marginTop:6,fontSize:10,color:'var(--muted)'}}>Unlocks when you add expenses in P&L</div>}
    </div>
    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderTop:'3px solid #22c55e',borderRadius:14,padding:'14px 16px'}}>
      <div style={{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:4}}>ARPU (30d)</div>
      <div style={{fontSize:28,fontWeight:700,color:'#22c55e',letterSpacing:'-0.03em'}}>{$$(arpu30d)}</div>
      <div style={{fontSize:10,color:'var(--muted)',marginTop:4}}>avg revenue per active user</div>
      <div style={{marginTop:6,fontSize:10,color:'var(--fg-2)',lineHeight:1.5}}>
        ${(proceeds30d/swD.newUsers).toFixed(2)} per new install<br/>
        ${mrr.toFixed(2)} total MRR<br/>
        To $100k MRR: need ~{Math.ceil(100000/9.99)} monthly subs
      </div>
    </div>
  </div>

  {/* Plan Mix + Transactions */}
  <div className="g2">
    <Section title="Subscription Plan Mix" sub="157 active confirmed subscribers">
      <div style={{height:160}}><Doughnut data={{labels:['Monthly $9.99','Annual $29.99','Annual Disc $9.99/yr','Weekly $2.99'],datasets:[{data:[planMonthly,planAnnual,planDiscount,planWeekly],backgroundColor:['#6366f1','#3b82f6','#0891b2','#f97316'],borderWidth:0}]}} options={DONUT_OPT}/></div>
      <div style={{marginTop:10}}>
        <MiniBar label={`Monthly ‚Äî ${planMonthly} users ($${(planMonthly*9.99).toFixed(0)}/mo MRR)`} val={planMonthly} max={totalActive} color="#6366f1"/>
        <MiniBar label={`Annual ‚Äî ${planAnnual} users ($${(planAnnual*29.99/12).toFixed(0)}/mo MRR)`} val={planAnnual} max={totalActive} color="#3b82f6"/>
        <MiniBar label={`Weekly ‚Äî ${planWeekly} users ($${(planWeekly*2.99*4.33).toFixed(0)}/mo MRR)`} val={planWeekly} max={totalActive} color="#f97316"/>
      </div>
      <Insight text={`Push annual plan ‚Äî ${Math.round(planAnnual/totalActive*100)}% of users but higher LTV. Annual converts at $29.99 vs $9.99/mo = <strong>2.5x better revenue per user</strong> when annualized.`} type="blue"/>
    </Section>
    <Section title="Recent Transactions" sub="Superwall ¬∑ iOS" action={swConnected&&<Tag label="LIVE" color="green"/>}>
      <div style={{maxHeight:290,overflowY:'auto'}}>
        <table className="tbl">
          <thead><tr><th>User</th><th>Product</th><th>Type</th><th style={{textAlign:'right'}}>$</th><th>When</th></tr></thead>
          <tbody>
            {(sw?.recentTransactions||SW_SNAPSHOT.recentTransactions).slice(0,10).map((t:any,i:number)=>(
              <tr key={i}>
                <td><code style={{fontSize:10,color:'var(--muted)'}}>{t.userId}</code></td>
                <td style={{fontWeight:500,color:'var(--fg)',fontSize:11,textTransform:'capitalize'}}>{t.product}</td>
                <td><span className="pill" style={{background:t.type.includes('Cancel')||t.type==='Cancellation'?'#fff1f2':t.type==='Renewal'?'#eff6ff':'#f0fdf4',color:t.type.includes('Cancel')||t.type==='Cancellation'?'#9f1239':t.type==='Renewal'?'#1d4ed8':'#166534'}}>{t.type.replace('Direct Sub Start','New Sub')}</span></td>
                <td style={{textAlign:'right',fontWeight:600,color:t.proceeds>0?'#16a34a':'var(--muted)',fontSize:12}}>{t.proceeds>0?$$(t.proceeds):'‚Äî'}</td>
                <td style={{fontSize:10,color:'var(--muted)',whiteSpace:'nowrap'}}>{new Date(t.time).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  </div>

  {/* Conversion speed */}
  <Section title="Conversion Speed" sub="From install to first payment ‚Äî Superwall data">
    <div className="g3">
      {[
        {v:'~11 min',l:'Same-day converters avg time',sub:'6% convert same day',c:'#22c55e'},
        {v:'~5.9 hrs',l:'First-7-day converters avg time',sub:'7% convert within first week',c:'#f97316'},
        {v:'86%',l:'Conversions in first 6 hours',sub:'Act fast or don\'t ‚Äî urgency is real',c:'#6366f1'},
      ].map(x=>(
        <div key={x.v} style={{display:'flex',gap:12,padding:'12px 14px',background:'var(--surface)',borderRadius:10,alignItems:'center'}}>
          <div style={{fontSize:22,fontWeight:700,color:x.c,minWidth:70,letterSpacing:'-0.03em'}}>{x.v}</div>
          <div><div style={{fontSize:12,color:'var(--fg)',fontWeight:500,lineHeight:1.3}}>{x.l}</div><div style={{fontSize:10,color:'var(--muted)',marginTop:1}}>{x.sub}</div></div>
        </div>
      ))}
    </div>
    <Insight text="<strong>86% of conversions happen in first 6 hours.</strong> Optimize the paywall for immediate action. Re-engagement after 6h drops conversion probability dramatically." type="blue"/>
  </Section>
</>)}

{/* ‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê GROWTH ‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê */}
{tab==='Growth'&&(<>
  <div style={{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Acquisition & Growth ¬∑ {period>=999?'All Time':`Last ${period} Days`}</div>

  {/* KPIs */}
  <div className="g4">
    <KPI label="Daily Active Users" value={$(tDAU)} sub="app_opened (Mixpanel)" color="#6366f1" live={!!mpData}/>
    <KPI label="New Subscribers" value={$(tSubs)} color="#22c55e" sub="subscription_started" live={!!mpData}/>
    <KPI label="Paywall Views" value={period===30?$(sumN(sliceN(PAYWALL,30))):$(sumN(PAYWALL))} color="#f97316" sub="unique paywall sessions"/>
    <KPI label="Onboardings" value={period===30?$(sumN(sliceN(OBC,30))):$(sumN(OBC))} color="#8b5cf6" sub="onboarding completed"/>
  </div>
  <div className="g4">
    <KPI label="Cancellations" value={$(tCan)} color="#dc2626" live={!!mpData}/>
    <KPI label="Net Subscribers" value={(netSubs>=0?'+':'')+$(netSubs)} color={netSubs>=0?'#22c55e':'#dc2626'} sub="new minus cancelled" live={!!mpData}/>
    <KPI label="Renewals" value={$(tRen)} color="#3b82f6" live={!!mpData}/>
    <KPI label="Conv. Rate" value={swD.convRate.toFixed(1)+'%'} color="#ec4899" sub="paywall ‚Üí paid (Superwall)" live={swConnected}/>
  </div>

  {/* Funnel */}
  <Section title="Acquisition Funnel" sub="App Open ‚Üí Paid ‚Äî Last 30 days (Mixpanel)" accent="#6366f1">
    <div style={{display:'flex',gap:0,overflowX:'auto',paddingBottom:4,marginBottom:12}}>
      {FUNNEL.steps.map((s,i)=>{
        const pct_val=i===0?100:Math.round(FUNNEL.values[i]/FUNNEL.values[0]*100);
        const step_pct=i===0?100:Math.round(FUNNEL.values[i]/FUNNEL.values[i-1]*100);
        const colors=['#6366f1','#3b82f6','#f97316','#22c55e'];
        return(
          <div key={s} style={{flex:1,minWidth:130,padding:'0 14px',borderLeft:i>0?'1px solid var(--border)':'none',paddingLeft:i>0?16:0}}>
            <div style={{fontSize:9,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>{i+1}. {s}</div>
            <div style={{fontSize:30,fontWeight:700,letterSpacing:'-0.03em',color:'var(--fg)'}}>{$(FUNNEL.values[i])}</div>
            <div style={{fontSize:11,color:'var(--muted)',marginTop:3}}>{pct_val}% of installs</div>
            {i>0&&<div style={{fontSize:12,color:step_pct>50?'#22c55e':'#f43f5e',fontWeight:700,marginTop:2}}>{step_pct}% step rate</div>}
            <div style={{marginTop:10,height:5,background:'var(--surface)',borderRadius:3}}>
              <div style={{width:`${pct_val}%`,height:'100%',borderRadius:3,background:colors[i]}}/>
            </div>
          </div>
        );
      })}
    </div>
    <div className="g3">
      <div style={{padding:'10px 12px',background:'#fff1f2',borderRadius:10,textAlign:'center'}}>
        <div style={{fontSize:22,fontWeight:700,color:'#dc2626'}}>9%</div>
        <div style={{fontSize:11,color:'#9f1239',marginTop:2}}>App ‚Üí Onboarding</div>
        <div style={{fontSize:10,color:'var(--muted)',marginTop:1}}>Primary growth lever to fix</div>
      </div>
      <div style={{padding:'10px 12px',background:'#f0fdf4',borderRadius:10,textAlign:'center'}}>
        <div style={{fontSize:22,fontWeight:700,color:'#16a34a'}}>66%</div>
        <div style={{fontSize:11,color:'#166534',marginTop:2}}>Onboarding ‚Üí Paywall</div>
        <div style={{fontSize:10,color:'var(--muted)',marginTop:1}}>Strong ‚Äî users reach paywall</div>
      </div>
      <div style={{padding:'10px 12px',background:'#fffbeb',borderRadius:10,textAlign:'center'}}>
        <div style={{fontSize:22,fontWeight:700,color:'#d97706'}}>7%</div>
        <div style={{fontSize:11,color:'#92400e',marginTop:2}}>Paywall ‚Üí Subscribed</div>
        <div style={{fontSize:10,color:'var(--muted)',marginTop:1}}>Industry avg: 3-5% ‚Äî above avg!</div>
      </div>
    </div>
    <Insight text="<strong>Biggest opportunity: onboarding completion at 9%.</strong> If you get this to 20%, you'd 2x subscribers without changing acquisition. Fix the onboarding flow first." type="red"/>
  </Section>

  {/* Daily charts */}
  <div className="g2">
    <Section title="Daily New Subscribers" sub={`Last ${period} days ¬∑ Mixpanel`} action={mpData&&<Tag label="LIVE" color="green"/>}>
      <div style={{height:200}}>
        <Bar data={{labels:dts,datasets:[{label:'New Subs',data:sub,backgroundColor:'#22c55e',borderRadius:3},{label:'Cancels',data:can,backgroundColor:'#f43f5e',borderRadius:3},{label:'Renewals',data:ren,backgroundColor:'#6366f1',borderRadius:3}]}} options={{...CHART_BASE,plugins:{...CHART_BASE.plugins,legend:{display:true,labels:{font:{size:10},boxWidth:8,color:'#888'}}}} as any}/>
      </div>
      <Insight text="<strong>Mar 13-14 spike: 55+59 subs</strong> in 2 days from viral content. Building consistency to this level is the key to $100k MRR." type="green"/>
    </Section>
    <Section title="Daily Active Users" sub={`Last ${period} days`} action={mpData&&<Tag label="LIVE" color="green"/>}>
      <div style={{height:200}}>
        <Line data={{labels:dts,datasets:[{data:dau,borderColor:'#6366f1',backgroundColor:'rgba(99,102,241,.08)',tension:.4,fill:true,pointRadius:0,borderWidth:2}]}} options={CHART_BASE as any}/>
      </div>
    </Section>
  </div>

  {/* Paywall campaigns */}
  <Section title="Paywall Campaigns" sub={`Superwall ¬∑ 30d ¬∑ ${swConnected?'Live':'Snapshot'}`} action={swConnected?<Tag label="LIVE" color="green"/>:undefined}>
    <table className="tbl">
      <thead><tr><th>Campaign</th><th style={{textAlign:'right'}}>Users</th><th style={{textAlign:'right'}}>Conv.</th><th style={{textAlign:'right'}}>Rate</th><th style={{textAlign:'right'}}>Proceeds</th><th style={{textAlign:'right'}}>$/Conv</th></tr></thead>
      <tbody>
        {(sw?.campaigns||SW_SNAPSHOT.campaigns).map((c:any)=>(
          <tr key={c.id}>
            <td style={{fontWeight:500,color:'var(--fg)',fontSize:12}}>{c.name}</td>
            <td style={{textAlign:'right'}}>{$(c.users)}</td>
            <td style={{textAlign:'right'}}>{$(c.convs)}</td>
            <td style={{textAlign:'right'}}><span style={{color:'#16a34a',fontWeight:600}}>{c.convRate.toFixed(1)}%</span></td>
            <td style={{textAlign:'right',fontWeight:700,color:'#16a34a'}}>{$$(c.proceeds)}</td>
            <td style={{textAlign:'right',color:'var(--muted)'}}>${(c.proceeds/c.convs).toFixed(2)}</td>
          </tr>
        ))}
        <tr style={{borderTop:'2px solid var(--border)',fontWeight:700}}>
          <td>TOTAL</td>
          <td style={{textAlign:'right'}}>{$((sw?.campaigns||SW_SNAPSHOT.campaigns).reduce((s:number,c:any)=>s+c.users,0))}</td>
          <td style={{textAlign:'right'}}>{$((sw?.campaigns||SW_SNAPSHOT.campaigns).reduce((s:number,c:any)=>s+c.convs,0))}</td>
          <td style={{textAlign:'right',color:'#16a34a'}}>{(((sw?.campaigns||SW_SNAPSHOT.campaigns).reduce((s:number,c:any)=>s+c.convs,0))/((sw?.campaigns||SW_SNAPSHOT.campaigns).reduce((s:number,c:any)=>s+c.users,0))*100).toFixed(1)}%</td>
          <td style={{textAlign:'right',color:'#16a34a'}}>{$$((sw?.campaigns||SW_SNAPSHOT.campaigns).reduce((s:number,c:any)=>s+c.proceeds,0))}</td>
          <td/>
        </tr>
      </tbody>
    </table>
    <Insight text="<strong>Transaction Abandoned</strong> converts at 10.7% vs 9.3%. Abandonment paywall = highest intent users. Both generating ~$2.2K ‚Äî scale both campaigns." type="green"/>
  </Section>

  {/* Discovery + Conversion speed */}
  <div className="g2">
    <Section title="Discovery Channel" sub="How paying users found CheerMyRun ¬∑ 161 subscribers">
      <div style={{height:150}}><Doughnut data={{labels:['TikTok','Instagram','Friends','Facebook'],datasets:[{data:[84,36,16,3],backgroundColor:['#111110','#e1306c','#1877f2','#94a3b8'],borderWidth:0}]}} options={DONUT_OPT}/></div>
      <div style={{marginTop:8}}>
        <MiniBar label="TikTok ‚Äî 84 subscribers (60%)" val={84} max={139} color="#111110"/>
        <MiniBar label="Instagram ‚Äî 36 subscribers (26%)" val={36} max={139} color="#e1306c"/>
        <MiniBar label="Friends (word of mouth) ‚Äî 16 (12%)" val={16} max={139} color="#1877f2"/>
      </div>
      <Insight text="<strong>TikTok = 60% of all subscribers.</strong> This is your #1 acquisition channel. Double down on TikTok content ‚Äî every viral post generates $1K+ in revenue." type="green"/>
    </Section>
    <Section title="Top Cities by Subscribers" sub="Onboarding location data ¬∑ Mixpanel">
      <table className="tbl">
        <thead><tr><th>#</th><th>City</th><th style={{textAlign:'right'}}>Users</th><th style={{textAlign:'right'}}>Share</th></tr></thead>
        <tbody>{ICP.cities.slice(0,8).map((r,i)=>(
          <tr key={r[0] as string}><td style={{color:'var(--muted)',fontSize:11,width:24}}>{i+1}</td><td style={{fontWeight:500}}>{r[0]}</td><td style={{textAlign:'right',fontWeight:600}}>{r[1]}</td><td style={{textAlign:'right',minWidth:60}}><div style={{height:4,background:'var(--surface)',borderRadius:2,width:60,display:'inline-block'}}><div style={{width:`${Number(r[1])/39*100}%`,height:'100%',background:COLS[i%COLS.length],borderRadius:2}}/></div></td></tr>
        ))}</tbody>
      </table>
      <Insight text="<strong>Latin America dominates</strong> ‚Äî Bogot√°, San Jos√©, Iztapalapa, Mexico City. LATAM is underserved by running apps but highly engaged. Geo-target content here." type="blue"/>
    </Section>
  </div>

  {/* Weekly history */}
  <Section title="Weekly Subscriber History" sub="All weeks since launch ‚Äî full cohort view">
    <div style={{overflowX:'auto'}}>
      <table className="tbl">
        <thead><tr><th>Week</th><th style={{textAlign:'right'}}>New</th><th style={{textAlign:'right'}}>Cancel</th><th style={{textAlign:'right'}}>Renew</th><th style={{textAlign:'right'}}>Net</th><th style={{textAlign:'right'}}>Churn Rate</th><th style={{textAlign:'right'}}>Est. Proceeds</th></tr></thead>
        <tbody>{WEEKS.map((w,i)=>{
          const net=w.s-w.c;
          const churn=w.s>0?Math.round(w.c/w.s*100):0;
          const est=WEEKLY_PROCEEDS[i+1]||0;
          return(
            <tr key={i}>
              <td style={{fontWeight:600}}>Week of {w.l}</td>
              <td style={{textAlign:'right',color:'#22c55e',fontWeight:600}}>{w.s}</td>
              <td style={{textAlign:'right',color:'#f43f5e'}}>{w.c}</td>
              <td style={{textAlign:'right',color:'#6366f1'}}>{w.r}</td>
              <td style={{textAlign:'right',fontWeight:700,color:net>=0?'#22c55e':'#f43f5e'}}>{net>=0?'+':''}{net}</td>
              <td style={{textAlign:'right',color:churn>50?'#f43f5e':churn>25?'#f59e0b':'var(--muted)'}}>{w.s>0?churn+'%':'‚Äî'}</td>
              <td style={{textAlign:'right',color:'#16a34a',fontWeight:600}}>{est?$$(est):'‚Äî'}</td>
            </tr>
          );
        })}
        <tr style={{borderTop:'2px solid var(--border)',fontWeight:700}}>
          <td>TOTAL</td>
          <td style={{textAlign:'right',color:'#22c55e'}}>{WEEKS.reduce((s,w)=>s+w.s,0)}</td>
          <td style={{textAlign:'right',color:'#f43f5e'}}>{WEEKS.reduce((s,w)=>s+w.c,0)}</td>
          <td style={{textAlign:'right',color:'#6366f1'}}>{WEEKS.reduce((s,w)=>s+w.r,0)}</td>
          <td style={{textAlign:'right',color:'#22c55e'}}>+{WEEKS.reduce((s,w)=>s+w.s-w.c,0)}</td>
          <td/>
          <td style={{textAlign:'right',color:'#16a34a'}}>{$$(WEEKLY_PROCEEDS.slice(1).reduce((a,b)=>a+b,0))}</td>
        </tr>
        </tbody>
      </table>
    </div>
  </Section>
</>)}

{/* ‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê ENGAGEMENT ‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê */}
{tab==='Engagement'&&(<>
  <div style={{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Runs & Cheers ¬∑ Mixpanel ¬∑ {period>=999?'All Time':`Last ${period} Days`}</div>

  <div className="g4">
    <KPI label="Runs Started" value={$(tRun)} color="#f97316" live={!!mpData}/>
    <KPI label="Real Runs" value="387" color="#22c55e" sub=">5 min AND >1 km (58%)"/>
    <KPI label="Test Runs" value="281" color="#f59e0b" sub="<5 min or <1 km (42%)"/>
    <KPI label="Completion Rate" value="96%" color="#16a34a" sub="621 / 649 completed"/>
  </div>
  <div className="g4">
    <KPI label="Cheers Sent" value={$(tChe)} color="#ec4899" sub="cheer_received" live={!!mpData}/>
    <KPI label="Cheers / Run" value={tRun>0?Math.round(tChe/tRun).toString():'‚Äî'} color="#8b5cf6" sub="engagement depth"/>
    <KPI label="Peak Day Cheers" value="11,281" color="#f97316" sub="Mar 22, 2026"/>
    <KPI label="Avg Distance" value="9.4 km" color="#3b82f6" sub="completed real runs"/>
  </div>
  <div className="g4">
    <KPI label="DAU" value={$(tDAU)} color="#6366f1" sub="app_opened total" live={!!mpData}/>
    <KPI label="Median Duration" value="37 min" sub="run_completed"/>
    <KPI label="Run Start Hour" value="6‚Äì10 AM" color="#3b82f6" sub="54% of all runs"/>
    <KPI label="Total Cheers (90d)" value="26,614" color="#ec4899" sub="all time engagement"/>
  </div>

  <div className="g2">
    <Section title="Daily Runs & Cheers" sub={`Last ${period} days`} action={mpData&&<Tag label="LIVE" color="green"/>}>
      <div style={{height:200}}>
        <Bar data={{labels:dts,datasets:[{label:'Runs',data:run,backgroundColor:'#111110',borderRadius:2},{label:'Cheers (√∑10)',data:che.map(v=>Math.round(v/10)),backgroundColor:'#f97316',borderRadius:2}]}} options={{...CHART_BASE,plugins:{...CHART_BASE.plugins,legend:{display:true,labels:{font:{size:10},boxWidth:8,color:'#888'}}}} as any}/>
      </div>
      <Insight text="Cheers spike on big run days ‚Äî confirming the social engagement loop. <strong>Mar 21-22: 115 runs ‚Üí 15,000+ cheers.</strong> Cheers are leading indicator of retention." type="green"/>
    </Section>
    <Section title="Daily Active Users" sub={`Last ${period} days`} action={mpData&&<Tag label="LIVE" color="green"/>}>
      <div style={{height:200}}>
        <Line data={{labels:dts,datasets:[{data:dau,borderColor:'#6366f1',backgroundColor:'rgba(99,102,241,.08)',tension:.4,fill:true,pointRadius:0,borderWidth:2}]}} options={CHART_BASE as any}/>
      </div>
    </Section>
  </div>

  <Section title="Weekly Cheers Volume" sub="90 days ‚Äî emotional engagement depth">
    <div style={{height:200}}>
      <Bar data={{labels:WEEKLY_LABELS.slice(-8),datasets:[{label:'Cheers',data:WEEKLY_CHEERS.slice(-8),backgroundColor:'#f97316',borderRadius:3},{label:'Runs (√ó10)',data:WEEKLY_RUNS.slice(-8).map(v=>v*10),backgroundColor:'#6366f1',borderRadius:3}]}} options={{...CHART_BASE,plugins:{...CHART_BASE.plugins,legend:{display:true,labels:{font:{size:10},boxWidth:8,color:'#888'}}}} as any}/>
    </div>
    <Insight text="<strong>Week of Mar 9: 15,473 cheers</strong> ‚Äî peak engagement correlated with 193 runs. This week = viral TikTok content ‚Üí runs ‚Üí massive cheer volume. Replicate this flywheel." type="green"/>
  </Section>

  <div className="g2">
    <Section title="Distance Distribution" sub="run_completed ‚Äî 668 runs, 90 days">
      <div style={{height:200}}>
        <Bar data={{labels:['<1km','1‚Äì3km','3‚Äì5km','5‚Äì10km','10‚Äì21km','Half M.','Marathon+'],datasets:[{data:[278,23,42,86,106,105,28],backgroundColor:['#fecdd3','#bfdbfe','#bfdbfe','#bbf7d0','#86efac','#22c55e','#15803d'],borderRadius:4}]}} options={CHART_BASE as any}/>
      </div>
      <Insight text="<strong>278 runs under 1km = test runs.</strong> Remove these, avg real distance = 15.2km. <strong>34% are half/full marathons</strong> ‚Äî serious runners." type="blue"/>
    </Section>
    <Section title="Run Start Time (Local Hour)" sub="User behavior pattern">
      <div style={{height:200}}>
        <Bar data={{labels:['4‚Äì6am','6‚Äì8am','8‚Äì10am','10‚Äì12pm','12‚Äì2pm','2‚Äì4pm','4‚Äì6pm','6pm+'],datasets:[{data:[30,134,144,80,32,34,56,134],backgroundColor:['#bfdbfe','#f97316','#f97316','#bfdbfe','#bfdbfe','#bfdbfe','#bfdbfe','#94a3b8'],borderRadius:4}]}} options={CHART_BASE as any}/>
      </div>
      <Insight text="<strong>54% of runs start between 6‚Äì10am.</strong> Morning runner persona confirmed. Push notifications before 7am. Evening runners (6pm+) are 2nd largest segment." type="amber"/>
    </Section>
  </div>

  {/* Subs + cancels daily */}
  <Section title="Daily Subscriptions, Cancellations & Renewals" sub={`Last ${period} days ¬∑ Mixpanel`} action={mpData&&<Tag label="LIVE" color="green"/>}>
    <div style={{height:200}}>
      <Bar data={{labels:dts,datasets:[{label:'New Subs',data:sub,backgroundColor:'#22c55e',borderRadius:2},{label:'Cancels',data:can,backgroundColor:'#f43f5e',borderRadius:2},{label:'Renewals',data:ren,backgroundColor:'#6366f1',borderRadius:2}]}} options={{...CHART_BASE,plugins:{...CHART_BASE.plugins,legend:{display:true,labels:{font:{size:10},boxWidth:8,color:'#888'}}}} as any}/>
    </div>
  </Section>

  {/* Cheer type */}
  <div className="g2">
    <Section title="Cheer Type Preference" sub="TTS vs Voice Notes ¬∑ 26,614 total cheers">
      <div style={{height:140}}><Doughnut data={{labels:['TTS (Text-to-Speech)','Voice Notes'],datasets:[{data:[13820,12794],backgroundColor:['#6366f1','#f97316'],borderWidth:0}]}} options={DONUT_OPT}/></div>
      <div style={{marginTop:8}}>
        <MiniBar label="TTS ‚Äî 13,820 cheers (52%)" val={13820} max={26614} color="#6366f1"/>
        <MiniBar label="Voice Notes ‚Äî 12,794 cheers (48%)" val={12794} max={26614} color="#f97316"/>
      </div>
      <Insight text="<strong>52%/48% split</strong> ‚Äî nearly even. Voice Notes feel personal, TTS is frictionless. Both are loved. This is a product moat." type="blue"/>
    </Section>
    <Section title="Weekly Churn Rate" sub="Cancellations as % of that week's new subs">
      <div style={{height:180}}>
        <Bar data={{labels:churnWeeks,datasets:[{label:'Churn %',data:churnData,backgroundColor:churnData.map(v=>v>70?'#f43f5e':v>40?'#f59e0b':'#22c55e'),borderRadius:4}]}} options={CHART_BASE as any}/>
      </div>
      <Insight text={`Week Mar 16 churn spike: <strong>${churnData[1]}%</strong> ‚Äî early users from the Mar 13-14 spike not retaining past day 7. Focus on Day-7 activation sequence.`} type="amber"/>
    </Section>
  </div>
</>)}

{/* ‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê USERS ‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê */}
{tab==='Users'&&(<>
  <div style={{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Ideal Customer Profile ¬∑ 161 paying subscribers with complete data</div>

  {/* ICP Summary */}
  <div style={{background:'var(--card)',border:'1px solid var(--border)',borderTop:'3px solid #6366f1',borderRadius:14,padding:'16px 18px',marginBottom:14}}>
    <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>ICP Summary ‚Äî Your core paying user</div>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      {['üë© Female, 25‚Äì34','üèÉ Intermediate runner','‚åö Apple Watch or Garmin','üì± TikTok discovered','üéß Always wears headphones','üì≤ Always carries phone','‚è∞ Runs 6‚Äì10am','üéµ Listens to music while running','üèÖ Half marathon runner','üìè Kilometer-based (LatAm dominant)'].map(t=>(
        <span key={t} style={{fontSize:11,padding:'5px 11px',borderRadius:20,background:'var(--surface)',color:'var(--fg-2)',fontWeight:500}}>{t}</span>
      ))}
    </div>
  </div>

  <div className="g3">
    <Section title="Gender" sub="Who are your paying users?">
      <div style={{height:140}}><Doughnut data={{labels:['Female','Male','Other'],datasets:[{data:[110,37,2],backgroundColor:['#ec4899','#3b82f6','#94a3b8'],borderWidth:0}]}} options={DONUT_OPT}/></div>
      <div style={{marginTop:8}}>{([['Female',110],['Male',37],['Other',2]] as [string,number][]).map((r,i)=><MiniBar key={r[0]} label={`${r[0]} ‚Äî ${r[1]}`} val={r[1]} max={149} color={['#ec4899','#3b82f6','#94a3b8'][i]}/>)}</div>
      <Insight text="<strong>74% female.</strong> Core persona: woman runner seeking emotional support & connection during runs." type="green"/>
    </Section>
    <Section title="Age Range" sub="Paying subscribers">
      <div style={{height:140}}><Bar data={{labels:['25‚Äì34','18‚Äì24','35‚Äì44','45‚Äì54'],datasets:[{data:[89,27,26,7],backgroundColor:['#6366f1','#8b5cf6','#a78bfa','#c4b5fd'],borderRadius:4}]}} options={CHART_BASE as any}/></div>
      <div style={{marginTop:8}}>{([['25‚Äì34',89],['18‚Äì24',27],['35‚Äì44',26],['45‚Äì54',7]] as [string,number][]).map((r,i)=><MiniBar key={r[0]} label={`${r[0]} ‚Äî ${r[1]}`} val={r[1]} max={149} color={COLS[i]}/>)}</div>
      <Insight text="<strong>60% aged 25‚Äì34.</strong> Millennial female runner is your core. TikTok native, aspirational, community-driven." type="blue"/>
    </Section>
    <Section title="Running Level" sub="Self-reported experience">
      <div style={{height:140}}><Doughnut data={{labels:['Intermediate','Beginner','Advanced'],datasets:[{data:[84,56,8],backgroundColor:['#f97316','#3b82f6','#22c55e'],borderWidth:0}]}} options={DONUT_OPT}/></div>
      <div style={{marginTop:8}}>{([['Intermediate',84],['Beginner',56],['Advanced',8]] as [string,number][]).map((r,i)=><MiniBar key={r[0]} label={`${r[0]} ‚Äî ${r[1]}`} val={r[1]} max={148} color={['#f97316','#3b82f6','#22c55e'][i]}/>)}</div>
      <Insight text="95% beginners + intermediates. <strong>Advanced runners don't need emotional support.</strong> Don't try to win them." type="blue"/>
    </Section>
  </div>

  <div className="g3">
    <Section title="Wearable Device" sub="What watch do they use?">
      <div style={{height:140}}><Doughnut data={{labels:['Apple Watch','Garmin','Fitbit','Samsung','Other'],datasets:[{data:[60,59,14,11,5],backgroundColor:['#111110','#16a34a','#3b82f6','#f59e0b','#94a3b8'],borderWidth:0}]}} options={DONUT_OPT}/></div>
      <div style={{marginTop:8}}>{([['Apple Watch',60],['Garmin',59],['Fitbit',14],['Samsung',11]] as [string,number][]).map((r,i)=><MiniBar key={r[0]} label={`${r[0]} ‚Äî ${r[1]}`} val={r[1]} max={149} color={['#111110','#16a34a','#3b82f6','#f59e0b'][i]}/>)}</div>
      <Insight text="<strong>Premium hardware = premium willingness to pay.</strong> Apple Watch + Garmin = 80%. These users pay for quality." type="green"/>
    </Section>
    <Section title="Discovery Channel" sub="How they found CheerMyRun">
      <div style={{height:140}}><Doughnut data={{labels:['TikTok','Instagram','Friends','Facebook'],datasets:[{data:[84,36,16,3],backgroundColor:['#111110','#e1306c','#1877f2','#94a3b8'],borderWidth:0}]}} options={DONUT_OPT}/></div>
      <div style={{marginTop:8}}>{([['TikTok',84],['Instagram',36],['Friends',16],['Facebook',3]] as [string,number][]).map((r,i)=><MiniBar key={r[0]} label={`${r[0]} ‚Äî ${r[1]}`} val={r[1]} max={139} color={['#111110','#e1306c','#1877f2','#94a3b8'][i]}/>)}</div>
      <Insight text="<strong>TikTok = 60% of subscribers.</strong> Every TikTok video has $1,000+ revenue potential. Double down here." type="green"/>
    </Section>
    <Section title="Races Completed" sub="Running experience profile">
      <div style={{height:140}}><Bar data={{labels:['Half M.','10K','5K','Marathon'],datasets:[{data:[686,427,324,185],backgroundColor:['#6366f1','#3b82f6','#0891b2','#f97316'],borderRadius:4}]}} options={CHART_BASE as any}/></div>
      <div style={{marginTop:8}}>{([['Half Marathon',686],['10K',427],['5K',324],['Marathon',185]] as [string,number][]).map((r,i)=><MiniBar key={r[0]} label={`${r[0]} ‚Äî ${r[1]}`} val={r[1]} max={686} color={COLS[i]}/>)}</div>
    </Section>
  </div>

  <div className="g3">
    <Section title="Headphone Usage">
      <div style={{height:120}}><Doughnut data={{labels:['Always','Sometimes','Rarely'],datasets:[{data:[131,23,3],backgroundColor:['#6366f1','#f97316','#94a3b8'],borderWidth:0}]}} options={DONUT_OPT}/></div>
      <Insight text="<strong>83% always</strong> use headphones during runs. Audio cheers are a perfect fit." type="green"/>
    </Section>
    <Section title="Phone During Run">
      <div style={{height:120}}><Doughnut data={{labels:['Always','Sometimes'],datasets:[{data:[144,13],backgroundColor:['#22c55e','#f59e0b'],borderWidth:0}]}} options={DONUT_OPT}/></div>
      <Insight text="<strong>92% always carry phone.</strong> Perfect product-market fit for audio cheers." type="green"/>
    </Section>
    <Section title="Music Preference">
      <div style={{height:120}}><Doughnut data={{labels:['Music','Mix','Podcasts','Silence'],datasets:[{data:[120,31,4,2],backgroundColor:['#f97316','#6366f1','#3b82f6','#94a3b8'],borderWidth:0}]}} options={DONUT_OPT}/></div>
      <Insight text="<strong>77% listen to music.</strong> TTS cheers layered over music is the primary use case." type="blue"/>
    </Section>
  </div>

  <div className="g2">
    <Section title="Top Cities by User Base" sub="Onboarding location data ¬∑ Mixpanel">
      <table className="tbl">
        <thead><tr><th>#</th><th>City</th><th style={{textAlign:'right'}}>Users</th><th>Volume</th></tr></thead>
        <tbody>{ICP.cities.map((r,i)=>(
          <tr key={r[0] as string}>
            <td style={{color:'var(--muted)',fontSize:11,width:24}}>{i+1}</td>
            <td style={{fontWeight:500}}>{r[0]}</td>
            <td style={{textAlign:'right',fontWeight:600}}>{r[1]}</td>
            <td style={{minWidth:80}}><div style={{height:5,background:'var(--surface)',borderRadius:3}}><div style={{width:`${Number(r[1])/39*100}%`,height:'100%',background:COLS[i%COLS.length],borderRadius:3}}/></div></td>
          </tr>
        ))}</tbody>
      </table>
    </Section>
    <Section title="Data Quality Issues" sub="Tracking bugs to fix">
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {[
          {issue:'usage_intent is undefined for 100% of users',impact:'Cannot segment by use case (motivation)',fix:'Save value in onboarding V2 before screen exits'},
          {issue:'$country_code undefined for all users',impact:'Cannot do country revenue attribution or geo-targeting',fix:'Pass device locale to Mixpanel SDK on init'},
          {issue:'run_club_member is 100% false',impact:'Cannot identify community runners',fix:'Verify SDK sends updated value after onboarding step'},
        ].map((b,i)=>(
          <div key={i} style={{display:'flex',gap:12,padding:'10px 12px',background:'#fff1f2',borderRadius:10,border:'1px solid #fecdd3'}}>
            <span style={{fontSize:14,flexShrink:0}}>üî¥</span>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:'#9f1239'}}>{b.issue}</div>
              <div style={{fontSize:11,color:'#be123c',marginTop:2}}><strong>Impact:</strong> {b.impact}</div>
              <div style={{fontSize:11,color:'#9f1239',marginTop:1}}><strong>Fix:</strong> {b.fix}</div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  </div>
</>)}

{/* ‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê P&L ‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê‚ïê */}
{tab==='P&L'&&(<>
  <div className="g3">
    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderTop:'3px solid #f43f5e',borderRadius:14,padding:'16px 18px'}}>
      <div style={{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>Total Expenses</div>
      <div style={{fontSize:30,fontWeight:700,color:'#dc2626',letterSpacing:'-0.03em'}}>${expenses.toLocaleString()}</div>
      <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>{pnl.filter(e=>e.type==='Expense').length} entries</div>
    </div>
    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderTop:'3px solid #22c55e',borderRadius:14,padding:'16px 18px'}}>
      <div style={{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>Total Income</div>
      <div style={{fontSize:30,fontWeight:700,color:'#16a34a',letterSpacing:'-0.03em'}}>${income.toLocaleString()}</div>
      <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>{pnl.filter(e=>e.type==='Income').length} entries</div>
    </div>
    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderTop:`3px solid ${income-expenses>=0?'#22c55e':'#f43f5e'}`,borderRadius:14,padding:'16px 18px'}}>
      <div style={{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>Net Cash Flow</div>
      <div style={{fontSize:30,fontWeight:700,color:income-expenses>=0?'#16a34a':'#dc2626',letterSpacing:'-0.03em'}}>{income-expenses>=0?'+':''}${Math.abs(income-expenses).toLocaleString()}</div>
      {expenses>0&&<div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>CAC unlocked: ${cacBlended} per conversion</div>}
    </div>
  </div>

  {expenses>0&&<div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:12,padding:'10px 14px',marginBottom:14,fontSize:12,color:'#166534'}}>
    ‚úÖ <strong>CAC Unlocked:</strong> ${cacBlended} blended CAC ¬∑ LTV:CAC = {ltvCacRatio?ltvCacRatio+'x':'calculating‚Ä¶'} ¬∑ Revenue tab now shows full unit economics.
  </div>}

  {months.length>0&&<div className="g2">
    <Section title="Monthly Burn vs Income">
      <div style={{height:200}}><Bar data={{labels:months,datasets:[{label:'Expenses',data:months.map(m=>byMonth[m]?.e||0),backgroundColor:'#f43f5e',borderRadius:3},{label:'Income',data:months.map(m=>byMonth[m]?.i||0),backgroundColor:'#22c55e',borderRadius:3}]}} options={{...CHART_BASE,plugins:{...CHART_BASE.plugins,legend:{display:true,labels:{font:{size:10},boxWidth:8,color:'#888'}}}} as any}/></div>
    </Section>
    <Section title="Expenses by Category">
      {Object.keys(byCat).length>0?<div style={{height:200}}><Doughnut data={{labels:Object.keys(byCat),datasets:[{data:Object.values(byCat),backgroundColor:Object.keys(byCat).map(k=>PNL_COLORS[k]||'#94a3b8'),borderWidth:0}]}} options={DONUT_OPT}/></div>:<div style={{fontSize:12,color:'var(--muted)',textAlign:'center',padding:'60px 0'}}>Add expense entries to see breakdown</div>}
    </Section>
  </div>}

  <Section title="Entries" sub="Income & expenses log" action={
    <div style={{display:'flex',gap:5}}>
      {['all','Expense','Income'].map(f=><button key={f} className={`btn${pnlFilter===f?' on':''}`} onClick={()=>setPnlFilter(f)}>{f==='all'?'All':f+'s'}</button>)}
    </div>
  }>
    {pnl.filter(e=>pnlFilter==='all'||e.type===pnlFilter).length===0?(
      <div style={{textAlign:'center',padding:'32px 0',color:'var(--muted)',fontSize:13}}>
        <div style={{fontSize:24,marginBottom:8}}>üìã</div>
        No entries yet. Click <strong>+ Add Entry</strong> to start tracking.<br/>
        <span style={{fontSize:11,marginTop:4,display:'block'}}>Adding expenses unlocks CAC & LTV:CAC in the Revenue tab.</span>
      </div>
    ):(
      <div style={{overflowX:'auto'}}><table className="tbl" style={{minWidth:500}}>
        <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th style={{textAlign:'right'}}>Amount</th><th/></tr></thead>
        <tbody>{pnl.filter(e=>pnlFilter==='all'||e.type===pnlFilter).map(e=>(
          <tr key={e.id}>
            <td style={{color:'var(--muted)',fontSize:11,whiteSpace:'nowrap'}}>{e.date}</td>
            <td><span style={{fontWeight:500,color:'var(--fg)'}}>{e.name}</span>{e.notes&&<div style={{fontSize:10,color:'var(--muted)'}}>{e.notes}</div>}</td>
            <td><span className="pill" style={{background:(PNL_COLORS[e.category]||'#94a3b8')+'22',color:PNL_COLORS[e.category]||'#666'}}>{e.category}</span></td>
            <td><span className="pill" style={{background:e.type==='Expense'?'#fff1f2':'#f0fdf4',color:e.type==='Expense'?'#9f1239':'#166534'}}>{e.type}</span></td>
            <td style={{textAlign:'right',fontWeight:700,color:e.type==='Expense'?'#dc2626':'#16a34a',whiteSpace:'nowrap'}}>{e.type==='Expense'?'-':'+'}${e.amount.toLocaleString()}</td>
            <td style={{whiteSpace:'nowrap'}}>
              <button className="btn" style={{marginRight:4,fontSize:10}} onClick={()=>editPnl(e)}>Edit</button>
              <button className="btn btn-red" style={{fontSize:10}} onClick={()=>delPnl(e.id)}>Delete</button>
            </td>
          </tr>
        ))}</tbody>
      </table></div>
    )}
  </Section>
</>)}

        </div>
      </div>
    </div>

    {/* P&L Modal */}
    {showAdd&&(
      <div className="modal-bg" onClick={()=>setShowAdd(false)}>
        <div className="modal" onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:16,fontWeight:700,marginBottom:20,letterSpacing:'-0.01em'}}>{editId?'Edit Entry':'New P&L Entry'}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div className="field"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
            <div className="field"><label>Type</label><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option>Expense</option><option>Income</option></select></div>
          </div>
          <div className="field"><label>Description</label><input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Influencer partnership"/></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div className="field"><label>Category</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{PNL_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
            <div className="field"><label>Amount (USD)</label><input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0.00"/></div>
          </div>
          <div className="field"><label>Notes (optional)</label><input type="text" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Additional context"/></div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:8}}>
            <button className="btn" onClick={()=>setShowAdd(false)}>Cancel</button>
            <button className="btn-primary" onClick={savePnlEntry}>{editId?'Save Changes':'Add Entry'}</button>
          </div>
        </div>
      </div>
    )}
  </>);
}
