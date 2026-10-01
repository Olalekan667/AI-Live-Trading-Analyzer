"use client";
import { useState, useEffect } from "react";
export default function Page(){
  const [price,setPrice]=useState(0);
  const [signal,setSignal]=useState("CONNECTING...");
  useEffect(()=>{
    const ws = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");
    ws.onopen = ()=> ws.send(JSON.stringify({ticks:"R_100",subscribe:1}));
    ws.onmessage = (e)=>{
      const d=JSON.parse(e.data);
      if(d.tick){
        const p=d.tick.quote;
        setPrice(p);
        const digit = Math.floor(p)%10;
        if(digit>=7) setSignal("BUY");
        else if(digit<=2) setSignal("SELL");
        else setSignal("HOLD");
      }
    };
    ws.onerror=()=>setSignal("ERROR - Refresh");
  },[]);
  return(
    <div style={{background:"#000",color:"#fff",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",fontFamily:"Arial"}}>
      <h1>LEXXYPRO LIVE</h1>
      <h2 style={{fontSize:"36px"}}>V100: ${price}</h2>
      <h1 style={{fontSize:"72px",color:signal=="BUY"?"#0f0":signal=="SELL"?"#f00":"yellow"}}>{signal}</h1>
      <p>Real Deriv Tick • Live</p>
    </div>
  );
}
