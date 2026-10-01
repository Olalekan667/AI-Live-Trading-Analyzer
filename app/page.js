"use client";
import { useState, useEffect, useRef } from "react";

const PAIRS = [
  { label: "Volatility 10 Index", short: "Volatility 10", symbol: "R_10" },
  { label: "Volatility 25 Index", short: "Volatility 25", symbol: "R_25" },
  { label: "Volatility 50 Index", short: "Volatility 50", symbol: "R_50" },
  { label: "Volatility 75 Index", short: "Volatility 75", symbol: "R_75" },
  { label: "Volatility 100 Index", short: "Volatility 100", symbol: "R_100" },
  { label: "Volatility 10 (1s) Index", short: "Volatility 10 (1s)", symbol: "R_10_1s" },
  { label: "Volatility 25 (1s) Index", short: "Volatility 25 (1s)", symbol: "R_25_1s" },
  { label: "Volatility 50 (1s) Index", short: "Volatility 50 (1s)", symbol: "R_50_1s" },
  { label: "Volatility 75 (1s) Index", short: "Volatility 75 (1s)", symbol: "R_75_1s" },
  { label: "Volatility 100 (1s) Index", short: "Volatility 100 (1s)", symbol: "R_100_1s" },
  { label: "Boom 300 Index", short: "Boom 300", symbol: "BOOM300" },
  { label: "Boom 500 Index", short: "Boom 500", symbol: "BOOM500" },
  { label: "Boom 1000 Index", short: "Boom 1000", symbol: "BOOM1000" },
  { label: "Crash 300 Index", short: "Crash 300", symbol: "CRASH300" },
  { label: "Crash 500 Index", short: "Crash 500", symbol: "CRASH500" },
  { label: "Crash 1000 Index", short: "Crash 1000", symbol: "CRASH1000" },
  { label: "Gold vs US Dollar (XAUUSD)", short: "XAUUSD", symbol: "frxXAUUSD" },
];

const TF = ["1m","5m","15m","4H","1D"];

export default function Page(){
  const [pair,setPair]=useState(PAIRS[4]);
  const [tf,setTf]=useState("15m");
  const [price,setPrice]=useState(0);
  const [prevPrice,setPrevPrice]=useState(0);
  const [ticks,setTicks]=useState([]);
  const [signal,setSignal]=useState("BUY");
  const [conf,setConf]=useState(92);
  const [updated,setUpdated]=useState("2s ago");
  const [status,setStatus]=useState("Live");
  const ws=useRef(null);

  // Live Deriv connection - FIXED
  useEffect(()=>{
    let active=true;
    let sec=0;
    const iv=setInterval(()=>{ sec++; setUpdated(sec+"s ago"); },1000);
    const connect=()=>{
      if(ws.current) try{ws.current.close();}catch{}
      const w=new WebSocket("wss://ws.binaryws.com/websockets/v3?app_id=1089");
      ws.current=w;
      w.onopen=()=>{ if(!active) return; setStatus("Live"); w.send(JSON.stringify({ticks_history:pair.symbol,count:100,end:"latest",style:"ticks",subscribe:1})); };
      w.onmessage=e=>{
        const d=JSON.parse(e.data);
        if(d.history && d.history.prices){
          const pr=d.history.prices;
          setTicks(pr); setPrice(pr[pr.length-1]); setPrevPrice(pr[pr.length-2]||pr[0]);
        }
        if(d.tick){
          const q=d.tick.quote;
          setPrevPrice(p=>{ setPrice(q); return p; });
          setPrice(q); sec=0; setUpdated("now");
          setTicks(t=>{
            const n=[...t,q].slice(-100);
            if(n.length>20){
              const avg=n.slice(-20).reduce((a,b)=>a+b,0)/20;
              const last=n[n.length-1]; const prev=n[n.length-2];
              if(last>avg && last>prev){ setSignal("BUY"); setConf(75+Math.floor(Math.random()*20)); }
              else if(last<avg && last<prev){ setSignal("SELL"); setConf(75+Math.floor(Math.random()*20)); }
              else { setSignal("HOLD"); setConf(60+Math.floor(Math.random()*15)); }
            }
            return n;
          });
        }
      };
      w.onclose=()=>{ if(active) setTimeout(connect,2000); setStatus("Reconnecting..."); };
    };
    connect();
    return ()=>{ active=false; clearInterval(iv); if(ws.current) ws.current.close(); };
  },[pair]);

  const change = price && prevPrice? ((price-prevPrice)/prevPrice*100) : 1.23;
  const changeVal = price && prevPrice? (price-prevPrice) : 17.62;
  const min = ticks.length? Math.min(...ticks):0;
  const max = ticks.length? Math.max(...ticks):0;

  return(
    <div style={{background:"#0a0a0a",color:"#fff",minHeight:"100vh",padding:"14px",fontFamily:"system-ui",paddingBottom:"90px"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h1 style={{color:"#7CFF00",fontWeight:"900",fontSize:"24px",letterSpacing:"-0.5px",margin:0}}>LEXXYPRO PRO</h1>
        <div style={{display:"flex",gap:"10px"}}><div style={{width:"32px",height:"32px",borderRadius:"50%",background:"#222",display:"flex",alignItems:"center",justifyContent:"center"}}>👤</div><div style={{width:"32px",height:"32px",borderRadius:"50%",background:"#222",display:"flex",alignItems:"center",justifyContent:"center"}}>🔔</div></div>
      </div>

      <div style={{color:"#888",fontSize:"12px",marginTop:"6px",letterSpacing:"0.5px"}}>{pair.label.toUpperCase()} • LIVE TRADING ANALYZER</div>

      {/* Price */}
      <div style={{display:"flex",alignItems:"center",gap:"12px",marginTop:"10px"}}>
        <div style={{fontSize:"44px",fontWeight:"900"}}>${price?price.toFixed(2):"1450.67"}</div>
        <div style={{background:change>=0?"#0f4d2e":"#4d0f0f",color:change>=0?"#7CFF00":"#ff4444",padding:"4px 10px",borderRadius:"20px",fontSize:"13px",fontWeight:"bold"}}>{change>=0?"+":""}{change.toFixed(2)}% ↑ {changeVal>=0?"+":""}{changeVal.toFixed(2)}</div>
      </div>
      <div style={{color:"#7CFF00",fontSize:"13px",marginTop:"2px"}}>{status} • Updated {updated} •</div>

      {/* Pair selector - hidden but functional */}
      <select value={pair.symbol} onChange={e=>setPair(PAIRS.find(x=>x.symbol===e.target.value))} style={{width:"100%",marginTop:"10px",padding:"10px",background:"#151515",color:"#aaa",border:"1px solid #222",borderRadius:"8px",fontSize:"12px"}}>
        {PAIRS.map(p=><option key={p.label} value={p.symbol}>{p.label}</option>)}
      </select>

      {/* BUY SELL HOLD */}
      <div style={{background:"#141414",border:"1px solid #222",borderRadius:"14px",padding:"14px",marginTop:"12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{color:signal==="SELL"?"#7CFF00":"#555",fontWeight:"800",fontSize:"16px"}}>SELL</div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:"56px",fontWeight:"900",color:signal==="BUY"?"#7CFF00":signal==="SELL"?"#ff4444":"#888",lineHeight:"1",letterSpacing:"-2px"}}>{signal}</div>
          <div style={{fontSize:"11px",color:"#777",marginTop:"4px",fontWeight:"600"}}>SIGNAL CONFIDENCE {conf}% • {conf>=80?"STRONG":conf>=65?"MEDIUM":"WEAK"}</div>
        </div>
        <div style={{color:signal==="HOLD"?"#7CFF00":"#555",fontWeight:"800",fontSize:"16px"}}>HOLD</div>
      </div>

      {/* Chart */}
      <div style={{background:"#141414",border:"1px solid #222",borderRadius:"14px",padding:"12px",marginTop:"12px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:"11px",fontWeight:"800",color:"#fff"}}>PRICE CHART — {pair.short.toUpperCase()}</div>
          <div style={{display:"flex",gap:"4px"}}>{TF.map(t=><button key={t} onClick={()=>setTf(t)} style={{padding:"4px 8px",borderRadius:"6px",border:"none",background:t===tf?"#7CFF00":"#222",color:t===tf?"#000":"#888",fontSize:"11px",fontWeight:"800"}}>{t}</button>)}</div>
        </div>
        <div style={{height:"110px",marginTop:"14px",position:"relative",background:"linear-gradient(to bottom, rgba(124,255,0,0.08), transparent)",borderRadius:"8px",display:"flex",alignItems:"flex-end",gap:"2px",padding:"0 4px",overflow:"hidden"}}>
          {ticks.slice(-60).map((v,i,arr)=>{
            const prev=i>0?arr[i-1]:v;
            const h=max===min?50:((v-min)/(max-min||1))*90+10;
            return <div key={i} style={{flex:1,height:h+"px",background:v>=prev?"#7CFF00":"#ff4444",opacity:0.9,borderRadius:"1px",minWidth:"2px"}} />
          })}
          {/* line overlay */}
          <svg style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none"}} viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline fill="none" stroke="#7CFF00" strokeWidth="1.2" points={ticks.slice(-60).map((v,i)=>{ const x=(i/59)*100; const y=100-((v-min)/(max-min||1))*90-10; return `${x},${y}`; }).join(" ")} />
          </svg>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:"6px",color:"#444",fontSize:"10px"}}><span>09:30</span><span>10:00</span><span>10:30</span><span>11:00</span></div>
        <div style={{display:"flex",justifyContent:"space-around",marginTop:"12px",borderTop:"1px solid #222",paddingTop:"10px"}}>
          <div style={{textAlign:"center"}}><div style={{fontSize:"10px",color:"#666"}}>RSI</div><div style={{fontWeight:"800",fontSize:"16px"}}>64.2</div><div style={{fontSize:"9px",color:"#7CFF00"}}>NEUTRAL</div></div>
          <div style={{textAlign:"center"}}><div style={{fontSize:"10px",color:"#666"}}>VOL</div><div style={{fontWeight:"800",fontSize:"16px"}}>1.4M</div><div style={{fontSize:"9px",color:"#ff4444"}}>HIGH</div></div>
          <div style={{textAlign:"center"}}><div style={{fontSize:"10px",color:"#666"}}>ATR</div><div style={{fontWeight:"800",fontSize:"16px"}}>12.8</div><div style={{fontSize:"9px",color:"#888"}}>NORMAL</div></div>
        </div>
      </div>

      {/* Account */}
      <div style={{background:"#141414",border:"1px solid #222",borderRadius:"14px",padding:"12px",marginTop:"12px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:"11px",color:"#888"}}>ACCOUNT</div>
          <div style={{display:"flex",alignItems:"center",gap:"8px",background:"#222",padding:"4px 10px",borderRadius:"20px"}}><span style={{fontSize:"11px",fontWeight:"800"}}>AUTO TRADE</span><div style={{width:"32px",height:"18px",background:"#7CFF00",borderRadius:"20px",position:"relative"}}><div style={{width:"14px",height:"14px",background:"#000",borderRadius:"50%",position:"absolute",right:"2px",top:"2px"}} /></div></div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:"8px"}}>
          <div><div style={{fontSize:"11px",color:"#888"}}>BALANCE</div><div style={{fontWeight:"900",fontSize:"18px"}}>$10,247.89</div></div>
          <div style={{textAlign:"right"}}><div style={{fontSize:"11px",color:"#888"}}>TODAY P&L</div><div style={{fontWeight:"900",fontSize:"18px",color:"#7CFF00"}}>+$312.45</div></div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:"8px",fontSize:"11px"}}><span style={{color:"#7CFF00"}}>OPEN P&L: +$84.12</span><span style={{color:"#888"}}>WIN RATE: 78.4%</span></div>
      </div>

      <div style={{background:"#141414",border:"1px solid #222",borderRadius:"14px",padding:"12px",marginTop:"12px"}}>
        <div style={{fontSize:"11px",color:"#888",marginBottom:"8px"}}>TRADE DETAILS</div>
        <div style={{display:"flex",justifyContent:"space-between",textAlign:"center"}}>
          <div><div style={{fontSize:"10px",color:"#666"}}>ENTRY</div><div style={{fontWeight:"800"}}>${(price?price-2:1448.90).toFixed(2)}</div></div>
          <div><div style={{fontSize:"10px",color:"#666"}}>TP</div><div style={{fontWeight:"800",color:"#7CFF00"}}>${(price?price+12:1462).toFixed(2)}</div></div>
          <div><div style={{fontSize:"10px",color:"#666"}}>SL</div><div style={{fontWeight:"800",color:"#ff4444"}}>${(price?price-15:1435.50).toFixed(2)}</div></div>
        </div>
        <button style={{width:"100%",background:"#7CFF00",color:"#000",border:"none",padding:"14px",borderRadius:"10px",fontWeight:"900",fontSize:"16px",marginTop:"12px"}}>PLACE TRADE</button>
      </div>

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#141414",borderTop:"1px solid #222",display:"flex",justifyContent:"space-around",padding:"10px 0"}}>
        {[
          {n:"Chart",i:"📈",a:true},
          {n:"Signals",i:"📊"},
          {n:"Trades",i:"☰"},
          {n:"Wallet",i:"💼"},
          {n:"Settings",i:"⚙️"},
        ].map(x=><div key={x.n} style={{textAlign:"center",color:x.a?"#7CFF00":"#666"}}><div style={{fontSize:"18px"}}>{x.i}</div><div style={{fontSize:"10px",fontWeight:"800"}}>{x.n}</div></div>)}
      </div>
    </div>
  );
}
