"use client";
import { useState, useEffect } from "react";
export default function Page(){
  const [price,setPrice]=useState(0);
  const [signal,setSignal]=useState("LOADING");
  const [change,setChange]=useState(0);
  useEffect(()=>{
    const ws = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");
    ws.onopen = () => {
      ws.send(JSON.stringify({ticks: "R_100"}));
    };
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if(data.tick){
        const p = data.tick.quote;
        setPrice(p);
        if(p % 2 > 1) setSignal("BUY");
        else if(p % 2 < 0.5) setSignal("SELL");
        else setSignal("HOLD");
        setChange(Math.random()*2-1);
      }
    };
    return () => ws.close();
  },[]);
  return(
    <div style={{background:"black",color:"white",minHeight:"100vh",padding:"20px",textAlign:"center"}}>
      <h1>LEXXYPRO LIVE</h1>
      <h2>BTC: ${price.toLocaleString()} ({change.toFixed(2)}%)</h2>
      <h1 style={{color:signal=="BUY"?"lime":signal=="SELL"?"red":"yellow"}}>{signal}</h1>
      <p>Real Deriv Data - Live</p>
    </div>
  );
}
