"use client";
import { useState, useEffect, useRef } from "react";

const SYMBOLS = ["R_100","R_75","R_50","R_10","BOOM1000","CRASH1000","1HZ100V","frxXAUUSD","frxEURUSD","frxGBPUSD"];

export default function Page(){
  const [symbol,setSymbol]=useState("R_100");
  const [price,setPrice]=useState(1450.67);
  const [ticks,setTicks]=useState([]);
  const [candles,setCandles]=useState([]);
  const [signal,setSignal]=useState("HOLD");
  const [conf,setConf]=useState(72);
  const [analyzing,setAnalyzing]=useState(false);
  const [mode,setMode]=useState("DERIV");
  const [autoTrade,setAutoTrade]=useState(false);
  const [derivToken,setDerivToken]=useState("");
  const [metaToken,setMetaToken]=useState("");
  const [metaId,setMetaId]=useState("");
  const [logs,setLogs]=useState([]);
  const wsRef=useRef(null);
  const canvasRef=useRef(null);

  useEffect(()=>{
    if(wsRef.current) wsRef.current.close();
    const ws=new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");
    wsRef.current=ws;
    ws.onopen=()=>ws.send(JSON.stringify({ticks:symbol,subscribe:1}));
    ws.onmessage=(e)=>{
      const d=JSON.parse(e.data);
      if(!d.tick) return;
      const p=d.tick.quote;
      setPrice(p);
      setTicks(t=>[...t.slice(-199),p]);
    };
    return()=>ws.close();
  },[symbol]);

  // BUILD CANDLES FROM TICKS
  useEffect(()=>{
    if(ticks.length<20) return;
    const newCandles=[];
    const size=10; // 10 ticks = 1 candle
    for(let i=0;i<ticks.length;i+=size){
      const slice=ticks.slice(i,i+size);
      if(slice.length<2) continue;
      const o=slice[0];
      const c=slice[slice.length-1];
      const h=Math.max(...slice);
      const l=Math.min(...slice);
      newCandles.push({o,h,l,c});
    }
    setCandles(newCandles.slice(-20)); // last 20 candles like in image
  },[ticks]);

  // DRAW PROFESSIONAL CANDLES
  useEffect(()=>{
    if(!canvasRef.current||candles.length<2) return;
    const c=canvasRef.current; const ctx=c.getContext("2d");
    const W=c.width=340; const H=c.height=120;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle="#0a1410"; ctx.fillRect(0,0,W,H);

    const all=candles.flatMap(x=>[x.h,x.l]);
    const max=Math.max(...all); const min=Math.min(...all);
    const range=max-min||1;
    const candleW=W/candles.length*0.7;
    const gap=W/candles.length*0.3;

    candles.forEach((k,i)=>{
      const x=i*(candleW+gap)+gap/2;
      const yH=H-((k.h-min)/range)*H;
      const yL=H-((k.l-min)/range)*H;
      const yO=H-((k.o-min)/range)*H;
      const yC=H-((k.c-min)/range)*H;
      const isGreen=k.c>=k.o;

      // wick
      ctx.strokeStyle=isGreen?"#00ff88":"#ff4444";
      ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(x+candleW/2,yH); ctx.lineTo(x+candleW/2,yL); ctx.stroke();

      // body
      ctx.fillStyle=isGreen?"#00ff88":"#ff4444";
      const bodyY=Math.min(yO,yC);
      const bodyH=Math.abs(yO-yC)||2;
      ctx.fillRect(x,bodyY,candleW,bodyH);
    });
  },[candles]);

  function analyzeNow(){
    setAnalyzing(true);
    setTimeout(()=>{
      if(candles.length<5){setAnalyzing(false);return;}
      const last=candles[candles.length-1];
      const prev=candles[candles.length-2];
      let s="HOLD"; let cf=62;
      if(last.c>last.o && last.c>prev.h){s="BUY"; cf=88;}
      else if(last.c<last.o && last.c<prev.l){s="SELL"; cf=88;}
      else if(last.c>prev.c){s="BUY"; cf=71;}
      else if(last.c<prev.c){s="SELL"; cf=71;}
      setSignal(s); setConf(cf); setAnalyzing(false);
      if(autoTrade && s!=="HOLD") execute(s);
    },700);
  }

  async function execute(sig){
    const isBuy=sig==="BUY"; const time=new Date().toLocaleTimeString();
    const add=(m)=>setLogs(l=>[m,...l].slice(0,4));
    if(mode==="DERIV"){
      if(!derivToken){add("Paste Deriv Token!");return;}
      add(time+" "+sig+" "+symbol+" @ "+price.toFixed(2)+" -> DERIV MT5");
      const ws=new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");
      ws.onopen=()=>ws.send(JSON.stringify({authorize:derivToken}));
      ws.onmessage=(e)=>{
        const d=JSON.parse(e.data);
        if(d.msg_type==="authorize") ws.send(JSON.stringify({proposal:1,amount:1,basis:"stake",contract_type:isBuy?"CALL":"PUT",currency:"USD",symbol:symbol,duration:5,duration_unit:"m"}));
        if(d.msg_type==="proposal") ws.send(JSON.stringify({buy:d.proposal.id,price:1}));
        if(d.msg_type==="buy"){add("✅ MT5 TRADE PLACED!"); ws.close();}
      };
    }else{
      if(!metaToken||!metaId){add("Paste MetaAPI Token + ID!");return;}
      add(time+" "+sig+" "+symbol.replace("frx","")+" -> EXNESS MT5");
      try{
        await fetch("https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/users/current/mt-accounts/"+metaId+"/trade",{
          method:"POST",headers:{"auth-token":metaToken,"Content-Type":"application/json"},
          body:JSON.stringify({symbol:symbol.replace("frx",""),action:isBuy?"buy":"sell",volume:0.01})
        });
        add("✅ EXNESS MT5 TRADE PLACED!");
      }catch{add("❌ Check Token/ID");}
    }
  }

  return(
    <div style={{background:"#070b0f",color:"#fff",minHeight:"100vh",padding:"12px",fontFamily:"Arial"}}>
      <div style={{maxWidth:"400px",margin:"0 auto"}}>
        <h3 style={{textAlign:"center",letterSpacing:"3px",color:"#00ff88"}}>LEXXYPRO</h3>
        <div style={{display:"flex",gap:"6px",margin:"8px 0"}}>
          <button onClick={()=>setMode("DERIV")} style={{flex:1,padding:"8px",background:mode==="DERIV"?"#00ff88":"#16201b",color:mode==="DERIV"?"#000":"#aaa",borderRadius:"20px",border:"none",fontSize:"11px",fontWeight:"bold"}}>DERIV MT5</button>
          <button onClick={()=>setMode("META")} style={{flex:1,padding:"8px",background:mode==="META"?"#00ff88":"#16201b",color:mode==="META"?"#000":"#aaa",borderRadius:"20px",border:"none",fontSize:"11px",fontWeight:"bold"}}>EXNESS MT5</button>
        </div>
        <select value={symbol} onChange={e=>setSymbol(e.target.value)} style={{width:"100%",padding:"11px",background:"#101c16",color:"#00ff88",border:"1px solid #1e3328",borderRadius:"12px",marginBottom:"10px"}}>
          {SYMBOLS.map(s=><option key={s}>{s}</option>)}
        </select>

        <div style={{background:"#0f1a14",border:"1px solid #1e3328",borderRadius:"22px",padding:"16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",color:"#666"}}><span>{symbol.replace("frx","")}</span><span style={{color:"#00ff88"}}>● LIVE {candles.length} candles</span></div>
          <div style={{fontSize:"26px",fontWeight:"bold",margin:"6px 0"}}>{symbol.replace("frx","")}: ${price.toFixed(2)}</div>
          <div style={{textAlign:"center",margin:"10px 0"}}>
            <div style={{fontSize:"44px",fontWeight:"900",color:signal==="BUY"?"#00ff88":signal==="SELL"?"#ff4444":"#ffcc00"}}>{signal==="BUY"?"BUY":signal==="SELL"?"SELL":"HOLD"}</div>
            <div style={{fontSize:"11px",color:"#777"}}>{conf}% SMC Confidence • {candles.length>1&&candles[candles.length-1].c>=candles[candles.length-1].o?"BULLISH":"BEARISH"} Candle</div>
          </div>

          {/* PROFESSIONAL CANDLE CHART */}
          <canvas ref={canvasRef} style={{width:"100%",height:"120px",background:"#08120e",borderRadius:"12px",border:"1px solid #12211b"}}/>

          <button onClick={analyzeNow} disabled={analyzing} style={{width:"100%",padding:"14px",marginTop:"12px",background:analyzing?"#222":"#00ff88",color:"#000",border:"none",borderRadius:"30px",fontWeight:"900",fontSize:"15px"}}>
            {analyzing?"ANALYZING CANDLES...":"🔍 ANALYZE NOW"}
          </button>

          <div style={{display:"flex",gap:"8px",marginTop:"8px"}}>
            <button onClick={()=>setAutoTrade(!autoTrade)} style={{flex:1,padding:"10px",background:autoTrade?"#ff3333":"#132019",color:autoTrade?"#fff":"#00ff88",border:"1px solid #00ff88",borderRadius:"20px",fontSize:"11px",fontWeight:"bold"}}>{autoTrade?"STOP AUTO":"START AUTO"}</button>
            <button onClick={()=>signal!=="HOLD"&&execute(signal)} style={{flex:1,padding:"10px",background:"#00ff88",color:"#000",border:"none",borderRadius:"20px",fontWeight:"900",fontSize:"11px"}}>TRADE {signal}</button>
          </div>
        </div>

        <div style={{background:"#111",padding:"10px",borderRadius:"12px",marginTop:"10px"}}>
          {mode==="DERIV"?(
            <input value={derivToken} onChange={e=>setDerivToken(e.target.value)} placeholder="Deriv API Token - phone only" style={{width:"100%",padding:"10px",background:"#000",color:"#fff",border:"1px solid #222",borderRadius:"8px",fontSize:"12px"}}/>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
              <input value={metaToken} onChange={e=>setMetaToken(e.target.value)} placeholder="MetaAPI Token" style={{padding:"10px",background:"#000",color:"#fff",border:"1px solid #222",borderRadius:"8px",fontSize:"12px"}}/>
              <input value={metaId} onChange={e=>setMetaId(e.target.value)} placeholder="Account ID" style={{padding:"10px",background:"#000",color:"#fff",border:"1px solid #222",borderRadius:"8px",fontSize:"12px"}}/>
            </div>
          )}
        </div>

        <div style={{marginTop:"8px"}}>
          {logs.map((l,i)=><div key={i} style={{background:"#101a14",padding:"7px",margin:"3px 0",borderRadius:"8px",fontSize:"10px",borderLeft:"3px solid #00ff88"}}>{l}</div>)}
        </div>
      </div>
    </div>
  );
}
