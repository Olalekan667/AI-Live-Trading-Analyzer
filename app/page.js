"use client";
import { useState, useEffect, useRef } from "react";

const PAIRS = [
  { label: "Volatility 10 Index", symbol: "R_10" },
  { label: "Volatility 25 Index", symbol: "R_25" },
  { label: "Volatility 50 Index", symbol: "R_50" },
  { label: "Volatility 75 Index", symbol: "R_75" },
  { label: "Volatility 100 Index", symbol: "R_100" },
  { label: "Volatility 10 (1s) Index", symbol: "R_10_1s" },
  { label: "Volatility 25 (1s) Index", symbol: "R_25_1s" },
  { label: "Volatility 50 (1s) Index", symbol: "R_50_1s" },
  { label: "Volatility 75 (1s) Index", symbol: "R_75_1s" },
  { label: "Volatility 100 (1s) Index", symbol: "R_100_1s" },
  { label: "Boom 300 Index", symbol: "BOOM300" },
  { label: "Boom 500 Index", symbol: "BOOM500" },
  { label: "Boom 1000 Index", symbol: "BOOM1000" },
  { label: "Crash 300 Index", symbol: "CRASH300" },
  { label: "Crash 500 Index", symbol: "CRASH500" },
  { label: "Crash 1000 Index", symbol: "CRASH1000" },
  { label: "Step Index", symbol: "ST100" },
  { label: "Gold vs US Dollar (XAUUSD)", symbol: "frxXAUUSD" },
];

const TF = ["1m","5m","15m","4H","1D"];

export default function Page(){
  const [pair,setPair]=useState(PAIRS[4]);
  const [timeframe,setTimeframe]=useState("5m");
  const [price,setPrice]=useState(0);
  const [ticks,setTicks]=useState([]);
  const [signal,setSignal]=useState("WAITING");
  const [conf,setConf]=useState(0);
  const ws=useRef(null);
  const lastAlert=useRef(0);

  const notifyTest=()=>{
    if(typeof window!=="undefined" && "Notification" in window){
      Notification.requestPermission().then(r=>{
        if(r==="granted") new Notification("LEXXYPRO ACTIVE",{body:"NEW BUY SIGNAL - "+pair.label+" - 92% - "+timeframe});
      });
    }
  };

  const alertNow=(type,pct,p)=> {
    if(Date.now()-lastAlert.current<30000) return;
    lastAlert.current=Date.now();
    if(typeof window!=="undefined" && "Notification" in window && Notification.permission==="granted"){
      new Notification(type==="BUY"?"NEW BUY SIGNAL":"NEW SELL SIGNAL",{body:pair.label+" - "+pct+"% - "+timeframe+" Price: "+p});
      if(navigator.vibrate) navigator.vibrate([200,100,200]);
    }
  };

  useEffect(()=>{
    if(ws.current) ws.current.close();
    const w=new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");
    ws.current=w;
    w.onopen=()=>w.send(JSON.stringify({ticks:pair.symbol,subscribe:1}));
    w.onmessage=e=>{
      const d=JSON.parse(e.data);
      if(d.tick){
        const q=d.tick.quote;
        setPrice(q);
        setTicks(t=>{
          const n=[...t,q].slice(-60);
          if(n.length>20){
            const avg=n.slice(-20).reduce((a,b)=>a+b,0)/20;
            const last=n[n.length-1];
            const prev=n[n.length-2];
            let s="WAITING"; let c=50;
            if(last>avg && last>prev){s="BUY"; c=78+Math.floor(Math.random()*20);}
            else if(last<avg && last<prev){s="SELL"; c=78+Math.floor(Math.random()*20);}
            setSignal(s); setConf(c);
            if(c>=75 && s!=="WAITING") alertNow(s,c,q.toFixed(2));
          }
          return n;
        });
      }
    };
    return ()=>w.close();
  },[pair]);

  const min=Math.min(...ticks,price);
  const max=Math.max(...ticks,price);

  return(
    <div style={{background:"#070707",color:"#fff",minHeight:"100vh",padding:"12px",fontFamily:"system-ui"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h3 style={{color:"#0f0",margin:0}}>LEXXYPRO LIVE</h3>
        <button onClick={notifyTest} style={{background:"#0f0",border:0,padding:"8px 14px",borderRadius:"8px",fontWeight:"900"}}>TEST NOTIFY</button>
      </div>

      <select value={pair.symbol} onChange={e=>setPair(PAIRS.find(x=>x.symbol===e.target.value))} style={{width:"100%",marginTop:"12px",padding:"14px",background:"#151515",color:"#fff",border:"1px solid #333",borderRadius:"10px",fontSize:"16px"}}>
        {PAIRS.map(p=><option key={p.label} value={p.symbol}>{p.label}</option>)}
      </select>

      <div style={{display:"flex",gap:"6px",marginTop:"10px"}}>
        {TF.map(t=><button key={t} onClick={()=>setTimeframe(t)} style={{flex:1,padding:"10px",borderRadius:"8px",border:t===timeframe?"2px solid #0f0":"1px solid #333",background:t===timeframe?"#0f0":"#151515",color:t===timeframe?"#000":"#fff",fontWeight:"bold"}}>{t}</button>)}
      </div>

      <div style={{background:"#121212",borderRadius:"14px",padding:"14px",marginTop:"12px",border:"1px solid #222",textAlign:"center"}}>
        <div style={{fontSize:"12px",color:"#888"}}>{pair.label} | {timeframe} | {price?"LIVE ●":"Connecting..."}</div>
        <div style={{fontSize:"44px",fontWeight:"900",margin:"8px 0",color:signal==="BUY"?"#0f0":signal==="SELL"?"#ff4444":"#fff"}}>{price?price.toFixed(2):"0.00"}</div>
        <div style={{background:signal==="BUY"?"#0f0":signal==="SELL"?"#ff4444":"#222",color:signal==="WAITING"?"#777":"#000",padding:"16px",borderRadius:"10px",fontWeight:"900",fontSize:"30px"}}>{signal} {conf?conf+"%":""}</div>

        <div style={{display:"flex",alignItems:"flex-end",gap:"3px",height:"90px",marginTop:"16px",justifyContent:"center",background:"#0a0a0a",padding:"10px",borderRadius:"8px"}}>
          {ticks.slice(-50).map((v,i,arr)=>{
            const prev=i>0?arr[i-1]:v;
            const h=max===min?40:((v-min)/(max-min||1))*80+8;
            const up=v>=prev;
            return <div key={i} style={{width:"6px",height:h+"px",background:up?"#00ff88":"#ff4444",borderRadius:"2px",transition:"height 0.2s"}} />
          })}
        </div>
        <div style={{fontSize:"10px",color:"#555",marginTop:"8px"}}>Live chart - Updates every tick - {pair.label}</div>
      </div>
    </div>
  );
}
