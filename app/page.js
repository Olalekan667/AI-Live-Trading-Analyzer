"use client";
import { useState, useEffect, useRef } from "react";

export default function Page(){
  const [price,setPrice]=useState(1450.67);
  const [ticks,setTicks]=useState([]);
  const [candles,setCandles]=useState([]);
  const [signal,setSignal]=useState("BUY");
  const [conf,setConf]=useState(92);
  const [timeframe,setTimeframe]=useState("15m");
  const [tab,setTab]=useState("chart");
  const [balance,setBalance]=useState(10247.89);
  const [todayPnl,setTodayPnl]=useState(312.45);
  const [openPnl,setOpenPnl]=useState(84.12);
  const [autoTrade,setAutoTrade]=useState(true);
  const [symbol,setSymbol]=useState("R_100");
  const [entry,setEntry]=useState(1448.90);
  const wsRef=useRef(null);
  const canvasRef=useRef(null);
  const [updated,setUpdated]=useState(0);

  useEffect(()=>{
    if(wsRef.current) wsRef.current.close();
    const ws=new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");
    wsRef.current=ws;
    ws.onopen=()=>ws.send(JSON.stringify({ticks:symbol,subscribe:1}));
    ws.onmessage=(e)=>{
      const d=JSON.parse(e.data);
      if(!d.tick) return;
      setPrice(d.tick.quote);
      setTicks(t=>[...t.slice(-299),d.tick.quote]);
      setUpdated(0);
    };
    const timer=setInterval(()=>setUpdated(s=>s+1),1000);
    return()=>{ws.close(); clearInterval(timer);}
  },[symbol]);

  useEffect(()=>{
    if(ticks.length<10) return;
    const tfMap={ "1m":5, "5m":12, "15m":20, "4H":40, "1D":60 };
    const sz=tfMap[timeframe]||20;
    const arr=[];
    for(let i=0;i<ticks.length;i+=sz){
      const s=ticks.slice(i,i+sz); if(s.length<2) continue;
      arr.push({o:s[0],h:Math.max(...s),l:Math.min(...s),c:s[s.length-1]});
    }
    setCandles(arr.slice(-40));
  },[ticks,timeframe]);

  // GREEN LINE CHART LIKE YOUR IMAGE
  useEffect(()=>{
    if(!canvasRef.current||candles.length<2) return;
    const cv=canvasRef.current; const ctx=cv.getContext("2d");
    const W=cv.width=360; const H=cv.height=110;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle="#0a1410"; ctx.fillRect(0,0,W,H);
    const closes=candles.map(c=>c.c);
    const max=Math.max(...closes); const min=Math.min(...closes); const rng=max-min||1;
    ctx.strokeStyle="#00ff88"; ctx.lineWidth=2; ctx.shadowColor="#00ff88"; ctx.shadowBlur=8;
    ctx.beginPath();
    closes.forEach((p,i)=>{
      const x=(i/(closes.length-1))*W;
      const y=H-((p-min)/rng)*H*0.8-10;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.stroke();
    ctx.shadowBlur=0;
    // gradient fill
    const grad=ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,"rgba(0,255,136,0.25)"); grad.addColorStop(1,"rgba(0,255,136,0)");
    ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath();
    ctx.fillStyle=grad; ctx.fill();
  },[candles]);

  return(
    <div style={{background:"#060a0e",color:"#fff",minHeight:"100vh",display:"flex",justifyContent:"center",paddingBottom:"70px",fontFamily:"Arial"}}>
      <div style={{width:"100%",maxWidth:"380px",padding:"10px"}}>
        {/* HEADER LIKE IMAGE */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0"}}>
          <div style={{color:"#00ff88",fontWeight:"900",letterSpacing:"1px"}}>LEXXYPRO PRO</div>
          <div style={{display:"flex",gap:"10px",fontSize:"18px"}}><span>👤</span><span>🔔</span></div>
        </div>
        <div style={{fontSize:"9px",color:"#5a6a5a",letterSpacing:"1px"}}>VOLATILITY 100 INDEX • LIVE TRADING ANALYZER</div>
        <div style={{display:"flex",alignItems:"center",gap:"8px",margin:"8px 0"}}>
          <div style={{fontSize:"34px",fontWeight:"900"}}>${price.toFixed(2)}</div>
          <div style={{fontSize:"11px",background:"#0f2818",color:"#00ff88",padding:"4px 8px",borderRadius:"20px",border:"1px solid #1a3a2a"}}>+1.23% ↑ +17.62</div>
        </div>
        <div style={{fontSize:"10px",color:"#00ff88",marginBottom:"12px"}}>Live • Updated {updated}s ago ●</div>

        {/* SIGNAL - SELL BUY HOLD LIKE IMAGE */}
        <div style={{background:"#0f1a16",border:"1px solid #1e3a2d",borderRadius:"16px",padding:"14px",textAlign:"center"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:"12px",color:signal==="SELL"?"#fff":"#444"}}>SELL</span>
            <span style={{fontSize:"48px",fontWeight:"900",color:signal==="BUY"?"#00ff88":signal==="SELL"?"#ff3b3b":"#ffcc00"}}>{signal}</span>
            <span style={{fontSize:"12px",color:signal==="HOLD"?"#fff":"#444"}}>HOLD</span>
          </div>
          <div style={{fontSize:"9px",color:"#5a7a6a",marginTop:"4px"}}>SIGNAL CONFIDENCE {conf}% • STRONG</div>
        </div>

        {/* CHART WITH TIMEFRAME - YOU ASKED */}
        <div style={{background:"#0f1a16",border:"1px solid #1e3a2d",borderRadius:"16px",padding:"10px",marginTop:"10px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
            <div style={{fontSize:"9px",color:"#5a7a6a"}}>PRICE CHART — VOLATILITY 100</div>
            <div style={{display:"flex",gap:"4px"}}>
              {["1m","5m","15m","4H","1D"].map(tf=>(
                <button key={tf} onClick={()=>setTimeframe(tf)} style={{fontSize:"9px",padding:"4px 8px",borderRadius:"6px",border:"none",background:timeframe===tf?"#00ff88":"#1a2a20",color:timeframe===tf?"#000":"#888",fontWeight:"bold"}}>{tf}</button>
              ))}
            </div>
          </div>
          <canvas ref={canvasRef} style={{width:"100%",height:"110px",borderRadius:"8px"}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:"8px",color:"#444",marginTop:"4px"}}>
            <span>09:30</span><span>10:00</span><span>10:30</span><span>11:00</span>
          </div>
          {/* RSI VOL ATR LIKE IMAGE */}
          <div style={{display:"flex",justifyContent:"space-around",marginTop:"10px",borderTop:"1px solid #1a2a20",paddingTop:"8px"}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:"8px",color:"#5a7a6a"}}>RSI</div><div style={{fontSize:"13px",fontWeight:"bold"}}>64.2</div><div style={{fontSize:"8px",color:"#5a7a6a"}}>NEUTRAL</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:"8px",color:"#5a7a6a"}}>VOL</div><div style={{fontSize:"13px",fontWeight:"bold"}}>1.4M</div><div style={{fontSize:"8px",color:"#00ff88"}}>HIGH</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:"8px",color:"#5a7a6a"}}>ATR</div><div style={{fontSize:"13px",fontWeight:"bold"}}>12.8</div><div style={{fontSize:"8px",color:"#5a7a6a"}}>NORMAL</div></div>
          </div>
        </div>

        {/* ACCOUNT LIKE IMAGE */}
        <div style={{background:"#0f1a16",border:"1px solid #1e3a2d",borderRadius:"16px",padding:"12px",marginTop:"10px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
            <div style={{fontSize:"9px",color:"#5a7a6a"}}>ACCOUNT</div>
            <div style={{display:"flex",alignItems:"center",gap:"6px",background:"#1a2a20",padding:"4px 10px",borderRadius:"20px"}}>
              <span style={{fontSize:"9px"}}>AUTO TRADE</span>
              <div onClick={()=>setAutoTrade(!autoTrade)} style={{width:"28px",height:"16px",background:autoTrade?"#00ff88":"#333",borderRadius:"10px",position:"relative",cursor:"pointer"}}>
                <div style={{width:"12px",height:"12px",background:"#fff",borderRadius:"50%",position:"absolute",top:"2px",left:autoTrade?"14px":"2px",transition:"0.2s"}}/>
              </div>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <div><div style={{fontSize:"9px",color:"#5a7a6a"}}>BALANCE</div><div style={{fontSize:"14px",fontWeight:"800"}}>${balance.toFixed(2)}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:"9px",color:"#5a7a6a"}}>TODAY P&L</div><div style={{fontSize:"14px",fontWeight:"800",color:"#00ff88"}}>+${todayPnl.toFixed(2)}</div></div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:"6px",fontSize:"9px",color:"#5a7a6a"}}>
            <span style={{color:"#00ff88"}}>OPEN P&L: +${openPnl.toFixed(2)}</span>
            <span>WIN RATE: 78.4%</span>
          </div>
        </div>

        {/* TRADE DETAILS LIKE IMAGE */}
        <div style={{background:"#0f1a16",border:"1px solid #1e3a2d",borderRadius:"16px",padding:"12px",marginTop:"10px"}}>
          <div style={{fontSize:"9px",color:"#5a7a6a",marginBottom:"8px"}}>TRADE DETAILS</div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px"}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:"9px",color:"#5a7a6a"}}>ENTRY</div><div style={{fontSize:"12px",fontWeight:"bold"}}>${entry.toFixed(2)}</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:"9px",color:"#5a7a6a"}}>TP</div><div style={{fontSize:"12px",fontWeight:"bold",color:"#00ff88"}}>$1462.00</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:"9px",color:"#5a7a6a"}}>SL</div><div style={{fontSize:"12px",fontWeight:"bold",color:"#ff3b3b"}}>$1435.50</div></div>
          </div>
          <button style={{width:"100%",padding:"14px",background:"#00ff88",color:"#000",border:"none",borderRadius:"12px",fontWeight:"900",fontSize:"13px"}}>PLACE TRADE</button>
        </div>
      </div>

      {/* BOTTOM NAV LIKE IMAGE */}
      <div style={{position:"fixed",bottom:"0",left:"0",right:"0",background:"#0a1210",borderTop:"1px solid #1e3a2d",display:"flex",justifyContent:"space-around",padding:"10px 0",maxWidth:"400px",margin:"0 auto"}}>
        {[
          {id:"chart",icon:"📈",label:"Chart"},
          {id:"signals",icon:"📶",label:"Signals"},
          {id:"trades",icon:"☰",label:"Trades"},
          {id:"wallet",icon:"💼",label:"Wallet"},
          {id:"settings",icon:"⚙️",label:"Settings"}
        ].map(item=>(
          <button key={item.id} onClick={()=>setTab(item.id)} style={{background:"none",border:"none",color:tab===item.id?"#00ff88":"#5a7a6a",fontSize:"9px",display:"flex",flexDirection:"column",alignItems:"center"}}>
            <span style={{fontSize:"18px"}}>{item.icon}</span><span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
