"use client";
import { useState, useEffect, useRef } from "react";

const ALL_MARKETS = [
  {id:"R_10", name:"Volatility 10 Index", full:"Volatility 10 (10) Index"},
  {id:"R_25", name:"Volatility 25 Index", full:"Volatility 25 (25) Index"},
  {id:"R_50", name:"Volatility 50 Index", full:"Volatility 50 (50) Index"},
  {id:"R_75", name:"Volatility 75 Index", full:"Volatility 75 (75) Index"},
  {id:"R_100", name:"Volatility 100 Index", full:"Volatility 100 (100) Index"},
  {id:"1HZ10V", name:"Volatility 10 (1s) Index", full:"Volatility 10 (1s) Index"},
  {id:"1HZ25V", name:"Volatility 25 (1s) Index", full:"Volatility 25 (1s) Index"},
  {id:"1HZ50V", name:"Volatility 50 (1s) Index", full:"Volatility 50 (1s) Index"},
  {id:"1HZ75V", name:"Volatility 75 (1s) Index", full:"Volatility 75 (1s) Index"},
  {id:"1HZ100V", name:"Volatility 100 (1s) Index", full:"Volatility 100 (1s) Index"},
  {id:"BOOM1000", name:"Boom 1000 Index", full:"Boom 1000 Index"},
  {id:"BOOM500", name:"Boom 500 Index", full:"Boom 500 Index"},
  {id:"BOOM300", name:"Boom 300 Index", full:"Boom 300 Index"},
  {id:"CRASH1000", name:"Crash 1000 Index", full:"Crash 1000 Index"},
  {id:"CRASH500", name:"Crash 500 Index", full:"Crash 500 Index"},
  {id:"CRASH300", name:"Crash 300 Index", full:"Crash 300 Index"},
  {id:"JD10", name:"Jump 10 Index", full:"Jump 10 Index"},
  {id:"JD25", name:"Jump 25 Index", full:"Jump 25 Index"},
  {id:"JD50", name:"Jump 50 Index", full:"Jump 50 Index"},
  {id:"JD75", name:"Jump 75 Index", full:"Jump 75 Index"},
  {id:"JD100", name:"Jump 100 Index", full:"Jump 100 Index"},
  {id:"ST10", name:"Step Index", full:"Step Index"},
  {id:"frxXAUUSD", name:"Gold (XAU/USD)", full:"Gold vs US Dollar (XAUUSD)"},
  {id:"frxXAGUSD", name:"Silver (XAG/USD)", full:"Silver vs US Dollar (XAGUSD)"},
  {id:"frxEURUSD", name:"EUR/USD", full:"Euro vs US Dollar"},
  {id:"frxGBPUSD", name:"GBP/USD", full:"British Pound vs US Dollar"},
  {id:"frxUSDJPY", name:"USD/JPY", full:"US Dollar vs Japanese Yen"},
  {id:"frxAUDUSD", name:"AUD/USD", full:"Australian Dollar vs US Dollar"},
  {id:"frxUSDCAD", name:"USD/CAD", full:"US Dollar vs Canadian Dollar"},
  {id:"frxBTCUSD", name:"BTC/USD", full:"Bitcoin vs US Dollar"},
  {id:"frxETHUSD", name:"ETH/USD", full:"Ethereum vs US Dollar"},
];

export default function Page(){
  const [price,setPrice]=useState(1450.67);
  const [ticks,setTicks]=useState([]);
  const [candles,setCandles]=useState([]);
  const [signal,setSignal]=useState("BUY");
  const [conf,setConf]=useState(92);
  const [timeframe,setTimeframe]=useState("15m");
  const [tab,setTab]=useState("chart");
  const [balance,setBalance]=useState(10247.89);
  const [symbol,setSymbol]=useState("R_100");
  const [entry,setEntry]=useState(1448.90);
  const [lastNotify,setLastNotify]=useState("");
  const [updated,setUpdated]=useState(0);
  const wsRef=useRef(null);
  const canvasRef=useRef(null);
  const audioRef=useRef(null);

  const currentMarket = ALL_MARKETS.find(m=>m.id===symbol) || ALL_MARKETS[4];

  useEffect(()=>{
    if("Notification" in window && Notification.permission==="default") Notification.requestPermission();
    audioRef.current=new Audio("https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3");
  },[]);

  function sendPhoneNotification(newSignal,newConf,priceNow,marketName){
    const title=newSignal==="BUY"?`🟢 NEW BUY SIGNAL - ${marketName}`:newSignal==="SELL"?`🔴 NEW SELL SIGNAL - ${marketName}`:`🟡 HOLD - ${marketName}`;
    const body=`${newSignal} ${newConf}% • $${priceNow.toFixed(2)} • ${marketName} • ${timeframe} • LEXXYPRO PRO`;
    const key=`${newSignal}-${newConf}-${Math.floor(priceNow)}-${symbol}`;
    if(key===lastNotify) return;
    setLastNotify(key);
    if("Notification" in window && Notification.permission==="granted"){
      new Notification(title,{body,icon:"https://cdn-icons-png.flaticon.com/512/1828/1828884.png",vibrate:[200,100,200],tag:"lexxy"});
    }
    try{ audioRef.current.currentTime=0; audioRef.current.play(); }catch(e){}
    if("vibrate" in navigator) navigator.vibrate(newSignal==="BUY"?[200,100,200]:[300,100,300,100,300]);
    document.body.style.background="#00ff88"; setTimeout(()=>document.body.style.background="#060a0e",150);
  }

  useEffect(()=>{
    if(wsRef.current) wsRef.current.close();
    const ws=new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");
    wsRef.current=ws;
    ws.onopen=()=>ws.send(JSON.stringify({ticks:symbol,subscribe:1}));
    ws.onmessage=(e)=>{
      const d=JSON.parse(e.data);
      if(!d.tick) return;
      setPrice(d.tick.quote); setTicks(t=>[...t.slice(-299),d.tick.quote]); setUpdated(0);
      if(t.length>20){
        const last=t.slice(-10); const up=last.filter((v,i)=>i>0&&v>last[i-1]).length;
        let newSig=up>=6?"BUY":up<=4?"SELL":"HOLD"; let newConf=up>=8?92:up<=2?88:up>=6?78:65;
        if(newSig!==signal || Math.abs(newConf-conf)>10){
          setSignal(newSig); setConf(newConf);
          if(newConf>=75 && newSig!=="HOLD"){
            sendPhoneNotification(newSig,newConf,d.tick.quote,currentMarket.full);
            setEntry(d.tick.quote);
          }
        }
      }
    };
    const timer=setInterval(()=>setUpdated(s=>s+1),1000);
    return()=>{ws.close(); clearInterval(timer);}
  },[symbol,signal,conf]);

  useEffect(()=>{
    if(ticks.length<10) return;
    const tfMap={ "1m":5, "5m":12, "15m":20, "4H":40, "1D":60 };
    const sz=tfMap[timeframe]||20; const arr=[];
    for(let i=0;i<ticks.length;i+=sz){
      const s=ticks.slice(i,i+sz); if(s.length<2) continue;
      arr.push({o:s[0],h:Math.max(...s),l:Math.min(...s),c:s[s.length-1]});
    }
    setCandles(arr.slice(-40));
  },[ticks,timeframe]);

  useEffect(()=>{
    if(!canvasRef.current||candles.length<2) return;
    const cv=canvasRef.current; const ctx=cv.getContext("2d");
    const W=cv.width=360; const H=cv.height=110;
    ctx.clearRect(0,0,W,H); ctx.fillStyle="#0a1410"; ctx.fillRect(0,0,W,H);
    const closes=candles.map(c=>c.c); const max=Math.max(...closes); const min=Math.min(...closes); const rng=max-min||1;
    ctx.strokeStyle="#00ff88"; ctx.lineWidth=2; ctx.shadowColor="#00ff88"; ctx.shadowBlur=8; ctx.beginPath();
    closes.forEach((p,i)=>{ const x=(i/(closes.length-1))*W; const y=H-((p-min)/rng)*H*0.8-10; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); });
    ctx.stroke(); ctx.shadowBlur=0;
    const grad=ctx.createLinearGradient(0,0,0,H); grad.addColorStop(0,"rgba(0,255,136,0.25)"); grad.addColorStop(1,"rgba(0,255,136,0)");
    ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
  },[candles]);

  return(
    <div style={{background:"#060a0e",color:"#fff",minHeight:"100vh",display:"flex",justifyContent:"center",paddingBottom:"70px",fontFamily:"Arial"}}>
      <div style={{width:"100%",maxWidth:"380px",padding:"10px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0"}}>
          <div style={{color:"#00ff88",fontWeight:"900"}}>LEXXYPRO PRO</div>
          <button onClick={()=>{if(Notification.permission!=="granted")Notification.requestPermission(); sendPhoneNotification("BUY",92,price,currentMarket.full);}} style={{background:"#00ff88",border:"none",padding:"4px 8px",borderRadius:"6px",fontSize:"9px",fontWeight:"bold"}}>TEST NOTIFY</button>
        </div>

        {/* FULL MARKET SELECTOR */}
        <div style={{background:"#0f1a16",border:"1px solid #1e3a2d",borderRadius:"12px",padding:"8px",marginBottom:"8px"}}>
          <div style={{fontSize:"8px",color:"#5a7a6a",marginBottom:"4px"}}>SELECT MARKET - ALL PAIRS</div>
          <select value={symbol} onChange={e=>setSymbol(e.target.value)} style={{width:"100%",padding:"10px",background:"#060a0e",color:"#00ff88",border:"1px solid #1e3a2d",borderRadius:"8px",fontSize:"12px",fontWeight:"bold"}}>
            {ALL_MARKETS.map(m=><option key={m.id} value={m.id}>{m.full} ({m.id})</option>)}
          </select>
        </div>

        <div style={{fontSize:"9px",color:"#5a7a6a"}}>{currentMarket.full.toUpperCase()} • LIVE TRADING ANALYZER</div>
        <div style={{display:"flex",alignItems:"center",gap:"8px",margin:"8px 0"}}>
          <div style={{fontSize:"28px",fontWeight:"900"}}>${price.toFixed(2)}</div>
          <div style={{fontSize:"10px",background:"#0f2818",color:"#00ff88",padding:"4px 8px",borderRadius:"20px"}}>{currentMarket.name}</div>
        </div>
        <div style={{fontSize:"10px",color:"#00ff88",marginBottom:"12px"}}>Live • Updated {updated}s ago • {symbol} ● {Notification.permission==="granted"?"🔔 ON":"🔕 Allow Notify"}</div>

        <div style={{background:"#0f1a16",border:"1px solid #1e3a2d",borderRadius:"16px",padding:"14px",textAlign:"center"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:"12px",color:signal==="SELL"?"#fff":"#444"}}>SELL</span>
            <span style={{fontSize:"48px",fontWeight:"900",color:signal==="BUY"?"#00ff88":signal==="SELL"?"#ff3b3b":"#ffcc00"}}>{signal}</span>
            <span style={{fontSize:"12px",color:signal==="HOLD"?"#fff":"#444"}}>HOLD</span>
          </div>
          <div style={{fontSize:"9px",color:"#5a7a6a"}}>{currentMarket.full} • SIGNAL CONFIDENCE {conf}% • {conf>=80?"STRONG":"MEDIUM"}</div>
        </div>

        <div style={{background:"#0f1a16",border:"1px solid #1e3a2d",borderRadius:"16px",padding:"10px",marginTop:"10px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
            <div style={{fontSize:"8px",color:"#5a7a6a"}}>PRICE CHART — {currentMarket.full.toUpperCase()}</div>
            <div style={{display:"flex",gap:"4px"}}>
              {["1m","5m","15m","4H","1D"].map(tf=>(
                <button key={tf} onClick={()=>setTimeframe(tf)} style={{fontSize:"9px",padding:"4px 8px",borderRadius:"6px",border:"none",background:timeframe===tf?"#00ff88":"#1a2a20",color:timeframe===tf?"#000":"#888",fontWeight:"bold"}}>{tf}</button>
              ))}
            </div>
          </div>
          <canvas ref={canvasRef} style={{width:"100%",height:"110px"}}/>
        </div>

        <div style={{background:"#0f1a16",border:"1px solid #1e3a2d",borderRadius:"16px",padding:"12px",marginTop:"10px"}}>
          <div style={{fontSize:"9px",color:"#5a7a6a",marginBottom:"8px"}}>TRADE DETAILS - {currentMarket.name}</div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px"}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:"9px",color:"#5a7a6a"}}>ENTRY</div><div style={{fontSize:"12px",fontWeight:"bold"}}>${entry.toFixed(2)}</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:"9px",color:"#5a7a6a"}}>TP</div><div style={{fontSize:"12px",fontWeight:"bold",color:"#00ff88"}}>${(entry*1.01).toFixed(2)}</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:"9px",color:"#5a7a6a"}}>SL</div><div style={{fontSize:"12px",fontWeight:"bold",color:"#ff3b3b"}}>${(entry*0.99).toFixed(2)}</div></div>
          </div>
          <button onClick={()=>sendPhoneNotification(signal,conf,price,currentMarket.full)} style={{width:"100%",padding:"14px",background:"#00ff88",color:"#000",border:"none",borderRadius:"12px",fontWeight:"900"}}>PLACE TRADE • {currentMarket.name} • {signal} {conf}%</button>
          <div style={{fontSize:"8px",color:"#5a7a6a",textAlign:"center",marginTop:"6px"}}>Notification will show: NEW {signal} SIGNAL - {currentMarket.full} - {conf}%</div>
        </div>
      </div>

      <div style={{position:"fixed",bottom:"0",left:"0",right:"0",background:"#0a1210",borderTop:"1px solid #1e3a2d",display:"flex",justifyContent:"space-around",padding:"10px 0",maxWidth:"400px",margin:"0 auto"}}>
        {[{id:"chart",icon:"📈",label:"Chart"},{id:"signals",icon:"📶",label:"Signals"},{id:"trades",icon:"☰",label:"Trades"},{id:"wallet",icon:"💼",label:"Wallet"},{id:"settings",icon:"⚙️",label:"Settings"}].map(item=>(
          <button key={item.id} onClick={()=>setTab(item.id)} style={{background:"none",border:"none",color:tab===item.id?"#00ff88":"#5a7a6a",fontSize:"9px",display:"flex",flexDirection:"column",alignItems:"center"}}>
            <span style={{fontSize:"18px"}}>{item.icon}</span><span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
