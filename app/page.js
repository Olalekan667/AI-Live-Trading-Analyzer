"use client";
import { useState, useEffect, useRef } from "react";

const SYMBOLS = ["R_100","R_75","R_50","R_10","BOOM1000","BOOM500","CRASH1000","CRASH500","1HZ100V","1HZ75V","frxEURUSD","frxGBPUSD","frxUSDJPY","frxXAUUSD","frxXAGUSD","frxBTCUSD"];

export default function Page(){
  const [symbol,setSymbol]=useState("R_100");
  const [price,setPrice]=useState(0);
  const [ticks,setTicks]=useState([]);
  const [signal,setSignal]=useState("WAITING SMC...");
  const [mode,setMode]=useState("DERIV");
  const [autoTrade,setAutoTrade]=useState(false);
  const [derivToken,setDerivToken]=useState("");
  const [metaToken,setMetaToken]=useState("");
  const [metaAccountId,setMetaAccountId]=useState("");
  const [logs,setLogs]=useState([]);
  const wsRef=useRef(null);
  const lastTradeRef=useRef(0);

  useEffect(()=>{
    setTicks([]); setSignal("LOADING "+symbol);
    if(wsRef.current) wsRef.current.close();
    const ws=new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");
    wsRef.current=ws;
    ws.onopen=()=>ws.send(JSON.stringify({ticks:symbol,subscribe:1}));
    ws.onmessage=(e)=>{
      const d=JSON.parse(e.data);
      if(!d.tick) return;
      const p=d.tick.quote; setPrice(p);
      setTicks(prev=>{
        const updated=[...prev.slice(-99),p];
        if(updated.length>25){
          const recent=updated.slice(-25,-5);
          const h=Math.max(...recent);
          const l=Math.min(...recent);
          let s="HOLD";
          if(p>h*1.0002) s="BUY CHOCH";
          else if(p<l*0.9998) s="SELL CHOCH";
          setSignal(s);
          const now=Date.now();
          if(autoTrade && (s.includes("BUY")||s.includes("SELL")) && now-lastTradeRef.current>30000){
            lastTradeRef.current=now;
            executeTrade(s,p);
          }
        }
        return updated;
      });
    };
    return()=>ws.close();
  },[symbol,autoTrade,mode,derivToken,metaToken,metaAccountId]);

  async function executeTrade(sig,currentPrice){
    const isBuy=sig.includes("BUY");
    const type=isBuy?"CALL":"PUT";
    const time=new Date().toLocaleTimeString();
    const addLog=(m)=>setLogs(l=>[m,...l].slice(0,6));

    if(mode==="DERIV"){
      if(!derivToken){addLog("Paste Deriv Token first!"); return;}
      addLog(time+" "+type+" "+symbol+" at "+currentPrice+" TO DERIV MT5...");
      const ws=new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");
      ws.onopen=()=>ws.send(JSON.stringify({authorize:derivToken}));
      ws.onmessage=(e)=>{
        const d=JSON.parse(e.data);
        if(d.msg_type==="authorize"){
          ws.send(JSON.stringify({proposal:1,amount:1,basis:"stake",contract_type:type,currency:"USD",symbol:symbol,duration:5,duration_unit:"m"}));
        }
        if(d.msg_type==="proposal"){
          ws.send(JSON.stringify({buy:d.proposal.id,price:1}));
        }
        if(d.msg_type==="buy"){
          addLog("DERIV MT5 TRADE PLACED! Check MT5 App");
          ws.close();
        }
      };
    }

    if(mode==="META"){
      if(!metaToken||!metaAccountId){addLog("Paste MetaAPI Token and ID!"); return;}
      addLog(time+" "+type+" "+symbol+" at "+currentPrice+" TO EXNESS MT5...");
      try{
        await fetch("https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/users/current/mt-accounts/"+metaAccountId+"/trade",{
          method:"POST",
          headers:{"auth-token":metaToken,"Content-Type":"application/json"},
          body:JSON.stringify({symbol:symbol.replace("frx",""),action:isBuy?"buy":"sell",volume:0.01})
        });
        addLog(symbol.replace("frx","")+" META MT5 PLACED! Check MT5 Mobile");
      }catch(err){
        addLog("METAAPI Error - Check Token ID");
      }
    }
  }

  return(
    <div style={{background:"#000",color:"#fff",minHeight:"100vh",padding:"12px",fontFamily:"monospace"}}>
      <h2 style={{textAlign:"center",color:"#0f0"}}>LEXXYPRO DUAL MT5 FINAL</h2>
      <div style={{display:"flex",gap:"8px",justifyContent:"center",margin:"10px 0"}}>
        <button onClick={()=>setMode("DERIV")} style={{flex:1,padding:"12px",background:mode==="DERIV"?"#0f0":"#222",color:mode==="DERIV"?"#000":"#fff",border:"none",borderRadius:"10px",fontWeight:"bold"}}>DERIV MT5</button>
        <button onClick={()=>setMode("META")} style={{flex:1,padding:"12px",background:mode==="META"?"#0f0":"#222",color:mode==="META"?"#000":"#fff",border:"none",borderRadius:"10px",fontWeight:"bold"}}>EXNESS ANY MT5</button>
      </div>
      <select value={symbol} onChange={e=>setSymbol(e.target.value)} style={{width:"100%",padding:"12px",background:"#111",color:"#0f0",border:"1px solid #0f0",borderRadius:"10px"}}>
        {SYMBOLS.map(s=><option key={s} value={s}>{s}</option>)}
      </select>
      <div style={{textAlign:"center",border:"1px solid #333",borderRadius:"15px",padding:"15px",margin:"12px 0",background:"#0a0a0a"}}>
        <div style={{fontSize:"12px",color:"#888"}}>{symbol} - Mode {mode}</div>
        <div style={{fontSize:"28px",margin:"10px 0"}}>{price.toFixed(2)}</div>
        <div style={{fontSize:"22px",fontWeight:"bold",color:signal.includes("BUY")?"#0f0":signal.includes("SELL")?"#f00":"yellow"}}>{signal}</div>
        <button onClick={()=>setAutoTrade(!autoTrade)} style={{marginTop:"12px",padding:"10px 20px",background:autoTrade?"#f00":"#0f0",color:"#000",border:"none",borderRadius:"20px",fontWeight:"bold"}}>
          {autoTrade?"STOP AUTO TRADE":"START AUTO TRADE"}
        </button>
        <div style={{fontSize:"10px",color:"#666",marginTop:"5px"}}>Trades show in MT5 Mobile Balance</div>
      </div>
      <div style={{background:"#111",padding:"12px",borderRadius:"12px",maxWidth:"500px",margin:"0 auto"}}>
        {mode==="DERIV"?(
          <div>
            <b style={{fontSize:"12px"}}>DERIV MT5 Phone setup:</b>
            <input value={derivToken} onChange={e=>setDerivToken(e.target.value)} placeholder="Paste Deriv API Token" style={{width:"100%",padding:"10px",marginTop:"6px",background:"#000",color:"#fff",border:"1px solid #333",borderRadius:"8px"}}/>
            <div style={{fontSize:"10px",color:"#0f0",marginTop:"5px"}}>Deriv App - Settings - API Token - Create token - Paste here - Then login MT5 app with Deriv MT5 account</div>
          </div>
        ):(
          <div>
            <b style={{fontSize:"12px"}}>ANY BROKER MT5 Exness No PC:</b>
            <input value={metaToken} onChange={e=>setMetaToken(e.target.value)} placeholder="MetaAPI Token" style={{width:"100%",padding:"10px",marginTop:"6px",background:"#000",color:"#fff",border:"1px solid #333",borderRadius:"8px"}}/>
            <input value={metaAccountId} onChange={e=>setMetaAccountId(e.target.value)} placeholder="MetaAPI Account ID" style={{width:"100%",padding:"10px",marginTop:"6px",background:"#000",color:"#fff",border:"1px solid #333",borderRadius:"8px"}}/>
            <div style={{fontSize:"10px",color:"#ff0",marginTop:"5px"}}>Phone Chrome open metaapi.cloud - Sign Up - New Account MT5 - Enter Exness login - Copy Token and ID - Paste here</div>
          </div>
        )}
      </div>
      <div style={{maxWidth:"500px",margin:"10px auto"}}>
        {logs.map((l,i)=><div key={i} style={{background:"#111",padding:"8px",margin:"4px 0",borderRadius:"8px",fontSize:"11px",borderLeft:"3px solid #0f0"}}>{l}</div>)}
      </div>
    </div>
  );
}
