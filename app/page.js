"use client";
import { useState, useEffect, useRef, useMemo } from "react";
const PAIRS = [
  { label: "Volatility 10 Index", short: "V10", symbol: "R_10" },
  { label: "Volatility 25 Index", short: "V25", symbol: "R_25" },
  { label: "Volatility 50 Index", short: "V50", symbol: "R_50" },
  { label: "Volatility 75 Index", short: "V75", symbol: "R_75" },
  { label: "Volatility 100 Index", short: "V100", symbol: "R_100" },
  { label: "Volatility 10 (1s) Index", short: "V10 1s", symbol: "R_10_1s" },
  { label: "Volatility 25 (1s) Index", short: "V25 1s", symbol: "R_25_1s" },
  { label: "Volatility 50 (1s) Index", short: "V50 1s", symbol: "R_50_1s" },
  { label: "Volatility 75 (1s) Index", short: "V75 1s", symbol: "R_75_1s" },
  { label: "Volatility 100 (1s) Index", short: "V100 1s", symbol: "R_100_1s" },
  { label: "Boom 300 Index", short: "BOOM300", symbol: "BOOM300" },
  { label: "Boom 500 Index", short: "BOOM500", symbol: "BOOM500" },
  { label: "Boom 1000 Index", short: "BOOM1000", symbol: "BOOM1000" },
  { label: "Crash 300 Index", short: "CRASH300", symbol: "CRASH300" },
  { label: "Crash 500 Index", short: "CRASH500", symbol: "CRASH500" },
  { label: "Crash 1000 Index", short: "CRASH1000", symbol: "CRASH1000" },
  { label: "Gold vs US Dollar (XAUUSD)", short: "XAUUSD", symbol: "frxXAUUSD" },
];
const TF = ["1m","5m","15m","4H","1D"];

export default function Page(){
  const [pair,setPair]=useState(PAIRS[4]);
  const [tf,setTf]=useState("15m");
  const [price,setPrice]=useState(0);
  const [ticks,setTicks]=useState([]);
  const [signal,setSignal]=useState("BUY");
  const [conf,setConf]=useState(92);
  const [smc,setSmc]=useState({bos:"BOS BULLISH", choch:"-", ob:"Bullish OB", fvg:"FVG Detected", liq:"No Grab", pa:"Bullish Engulfing"});
  const ws=useRef(null);

  // Build candles from ticks
  const candles = useMemo(()=>{
    if(ticks.length<20) return [];
    const size=5; const out=[];
    for(let i=0;i<ticks.length;i+=size){
      const slice=ticks.slice(i,i+size); if(slice.length<2) continue;
      out.push({ o:slice[0], h:Math.max(...slice), l:Math.min(...slice), c:slice[slice.length-1] });
    }
    return out.slice(-20);
  },[ticks]);

  useEffect(()=>{
    let active=true;
    const connect=()=>{
      if(ws.current) try{ws.current.close();}catch{}
      const w=new WebSocket("wss://ws.binaryws.com/websockets/v3?app_id=1089");
      ws.current=w;
      w.onopen=()=>w.send(JSON.stringify({ticks_history:pair.symbol,count:100,end:"latest",style:"ticks",subscribe:1}));
      w.onmessage=e=>{
        const d=JSON.parse(e.data);
        if(d.history?.prices){ setTicks(d.history.prices); setPrice(d.history.prices[d.history.prices.length-1]); }
        if(d.tick){
          const q=d.tick.quote; setPrice(q);
          setTicks(t=>[...t,q].slice(-100));
        }
      };
      w.onclose=()=>{ if(active) setTimeout(connect,1500); };
    };
    connect();
    return ()=>{ active=false; if(ws.current) ws.current.close(); };
  },[pair]);

  // SMC + Price Action Engine
  useEffect(()=>{
    if(candles.length<10) return;
    const last=candles[candles.length-1];
    const prev=candles[candles.length-2];
    const prev2=candles[candles.length-3];
    const highs=candles.map(c=>c.h); const lows=candles.map(c=>c.l);
    const recentHigh=Math.max(...highs.slice(-10,-1));
    const recentLow=Math.min(...lows.slice(-10,-1));

    // BOS / CHOCH
    let bos="No BOS"; let choch="-";
    if(last.c > recentHigh){ bos="BOS BULLISH ↑"; choch=prev.c < recentLow? "CHOCH BULLISH" : "-"; }
    else if(last.c < recentLow){ bos="BOS BEARISH ↓"; choch=prev.c > recentHigh? "CHOCH BEARISH" : "-"; }

    // Order Block
    let ob="No OB"; if(prev2.c < prev2.o && prev.c > prev.o && last.c > prev.c) ob="Bullish OB @ "+prev2.l.toFixed(2);
    if(prev2.c > prev2.o && prev.c < prev.o && last.c < prev.c) ob="Bearish OB @ "+prev2.h.toFixed(2);

    // FVG
    let fvg="No FVG"; if(candles.length>=3){ const c1=candles[candles.length-3], c3=last; if(c1.h < c3.l) fvg="Bull FVG "+c1.h.toFixed(2)+"-"+c3.l.toFixed(2); if(c1.l > c3.h) fvg="Bear FVG "+c3.h.toFixed(2)+"-"+c1.l.toFixed(2); }

    // Liquidity Grab
    let liq="No Grab"; if(last.h > recentHigh && last.c < recentHigh) liq="Sell Liquidity Grab"; if(last.l < recentLow && last.c > recentLow) liq="Buy Liquidity Grab";

    // Price Action
    let pa="Consolidation"; let sig="HOLD"; let cf=65;
    const bullishEngulf = last.c > last.o && prev.c < prev.o && last.c > prev.o && last.o < prev.c;
    const bearishEngulf = last.c < last.o && prev.c > prev.o && last.c < prev.o && last.o > prev.c;
    const pinBull = (last.h - Math.max(last.o,last.c)) < (last.c - last.l)*0.3 && (last.c > last.o);
    const pinBear = (Math.min(last.o,last.c) - last.l) < (last.h - last.c)*0.3 && (last.c < last.o);

    if(bullishEngulf){ pa="Bullish Engulfing"; sig="BUY"; cf=85; }
    else if(bearishEngulf){ pa="Bearish Engulfing"; sig="SELL"; cf=85; }
    else if(pinBull){ pa="Hammer Pin Bar"; sig="BUY"; cf=80; }
    else if(pinBear){ pa="Shooting Star"; sig="SELL"; cf=80; }
    else if(last.c > recentHigh){ pa="Breakout"; sig="BUY"; cf=82; }
    else if(last.c < recentLow){ pa="Breakdown"; sig="SELL"; cf=82; }

    // SMC confluence boost to 92%
    if((bos.includes("BULLISH") && ob.includes("Bullish")) || (bos.includes("BULLISH") && fvg.includes("Bull"))){ sig="BUY"; cf=92; }
    if((bos.includes("BEARISH") && ob.includes("Bearish")) || (bos.includes("BEARISH") && fvg.includes("Bear"))){ sig="SELL"; cf=92; }

    setSmc({bos, choch, ob, fvg, liq, pa}); setSignal(sig); setConf(cf);
  },[candles]);

  const min=ticks.length?Math.min(...ticks):0; const max=ticks.length?Math.max(...ticks):0;

  return(
    <div style={{background:"#0a0a0a",color:"#fff",minHeight:"100vh",padding:"14px",fontFamily:"system-ui",paddingBottom:"90px"}}>
      <h1 style={{color:"#7CFF00",fontWeight:"900",fontSize:"22px",margin:0}}>LEXXYPRO PRO • SMC+PA</h1>
      <div style={{color:"#888",fontSize:"11px",marginTop:"4px"}}>{pair.label.toUpperCase()} • {smc.bos} • {smc.pa.toUpperCase()} • LIVE</div>

      <select value={pair.symbol} onChange={e=>setPair(PAIRS.find(x=>x.symbol===e.target.value))} style={{width:"100%",marginTop:"10px",padding:"12px",background:"#151515",color:"#fff",border:"1px solid #333",borderRadius:"10px"}}>
        {PAIRS.map(p=><option key={p.label} value={p.symbol}>{p.label}</option>)}
      </select>

      <div style={{display:"flex",gap:"6px",marginTop:"8px"}}>{TF.map(t=><button key={t} onClick={()=>setTf(t)} style={{flex:1,padding:"8px",borderRadius:"8px",border:"none",background:t===tf?"#7CFF00":"#222",color:t===tf?"#000":"#888",fontWeight:"800",fontSize:"12px"}}>{t}</button>)}</div>

      <div style={{background:"#141414",border:"1px solid #222",borderRadius:"14px",padding:"14px",marginTop:"12px",textAlign:"center"}}>
        <div style={{fontSize:"40px",fontWeight:"900"}}>${price?price.toFixed(2):"0.00"}</div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:"8px"}}>
          <span style={{color:signal==="SELL"?"#7CFF00":"#555",fontWeight:"800"}}>SELL</span>
          <span style={{fontSize:"42px",fontWeight:"900",color:signal==="BUY"?"#7CFF00":signal==="SELL"?"#ff4444":"#888"}}>{signal} {conf}%</span>
          <span style={{color:signal==="HOLD"?"#7CFF00":"#555",fontWeight:"800"}}>HOLD</span>
        </div>
        <div style={{fontSize:"11px",color:"#7CFF00",marginTop:"4px"}}>{smc.pa} • {smc.bos} • {conf>=90?"STRONG CONFLUENCE":"WAITING"}</div>
      </div>

      <div style={{background:"#141414",border:"1px solid #222",borderRadius:"14px",padding:"12px",marginTop:"12px"}}>
        <div style={{fontSize:"11px",fontWeight:"800"}}>SMC INDICATORS</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginTop:"10px",fontSize:"11px"}}>
          <div style={{background:"#1a1a1a",padding:"8px",borderRadius:"8px",border:smc.bos.includes("BULLISH")||smc.bos.includes("BEARISH")?"1px solid #7CFF00":"1px solid #222"}}><div style={{color:"#888"}}>BOS</div><div style={{fontWeight:"800",color:smc.bos.includes("BULLISH")?"#7CFF00":smc.bos.includes("BEARISH")?"#ff4444":"#fff"}}>{smc.bos}</div></div>
          <div style={{background:"#1a1a1a",padding:"8px",borderRadius:"8px",border:smc.choch!=="-"?"1px solid #7CFF00":"1px solid #222"}}><div style={{color:"#888"}}>CHOCH</div><div style={{fontWeight:"800"}}>{smc.choch}</div></div>
          <div style={{background:"#1a1a1a",padding:"8px",borderRadius:"8px"}}><div style={{color:"#888"}}>ORDER BLOCK</div><div style={{fontWeight:"800",color:"#7CFF00"}}>{smc.ob}</div></div>
          <div style={{background:"#1a1a1a",padding:"8px",borderRadius:"8px"}}><div style={{color:"#888"}}>FVG</div><div style={{fontWeight:"800"}}>{smc.fvg}</div></div>
          <div style={{background:"#1a1a1a",padding:"8px",borderRadius:"8px"}}><div style={{color:"#888"}}>LIQUIDITY</div><div style={{fontWeight:"800",color:smc.liq!=="No Grab"?"#ff4444":"#fff"}}>{smc.liq}</div></div>
          <div style={{background:"#1a1a1a",padding:"8px",borderRadius:"8px"}}><div style={{color:"#888"}}>PRICE ACTION</div><div style={{fontWeight:"800",color:"#7CFF00"}}>{smc.pa}</div></div>
        </div>
      </div>

      <div style={{background:"#141414",border:"1px solid #222",borderRadius:"14px",padding:"12px",marginTop:"12px"}}>
        <div style={{fontSize:"11px",fontWeight:"800"}}>LIVE PRICE ACTION CHART</div>
        <div style={{height:"120px",marginTop:"10px",display:"flex",alignItems:"flex-end",gap:"2px",position:"relative",background:"#0a0a0a",padding:"6px",borderRadius:"8px"}}>
          {ticks.slice(-60).map((v,i,arr)=>{ const h=max===min?50:((v-min)/(max-min||1))*100+5; const prev=i>0?arr[i-1]:v; return <div key={i} style={{flex:1,height:h+"px",background:v>=prev?"#7CFF00":"#ff4444",minWidth:"2px"}}/>})}
          <svg style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none"}} viewBox="0 0 100 100" preserveAspectRatio="none"><polyline fill="none" stroke="#7CFF00" strokeWidth="1" points={ticks.slice(-60).map((v,i)=>`${(i/59)*100},${100-((v-min)/(max-min||1))*100}`).join(" ")} /></svg>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:"10px",color:"#555",marginTop:"6px"}}><span>Support: {min.toFixed(2)}</span><span>Resistance: {max.toFixed(2)}</span></div>
      </div>

      <button style={{width:"100%",background:"#7CFF00",color:"#000",border:"none",padding:"16px",borderRadius:"12px",fontWeight:"900",fontSize:"18px",marginTop:"12px"}}>PLACE {signal} TRADE - {conf}%</button>

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#141414",borderTop:"1px solid #222",display:"flex",justifyContent:"space-around",padding:"10px 0"}}>
        {["Chart","Signals","Trades","Wallet","Settings"].map(n=><div key={n} style={{textAlign:"center",color:n==="Chart"?"#7CFF00":"#666",fontSize:"11px",fontWeight:"800"}}>{n}</div>)}
      </div>
    </div>
  );
}
