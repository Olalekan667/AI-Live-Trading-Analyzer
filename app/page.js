"use client";
import { useState, useEffect } from "react";

export default function Page(){
  const [price,setPrice]=useState(0);
  const [signal,setSignal]=useState("CONNECTING...");

  useEffect(()=>{
    const ws = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");
    ws.onopen = () => ws.send(JSON.stringify({ticks: "R_100"}));
    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if(data.tick){
        const p = data.tick.quote;
        setPrice(p);
        const lastDigit = p.toString().slice(-1);
        if(["7","8","9"].includes(lastDigit)) setSignal("BUY");
        else if(["0","1"].includes(lastDigit)) setSignal("SELL");
        else setSignal("HOLD");
      }
    };
    return () => ws.close();
  },[]);

  return (
    <div style={{background:"#000",color:"#fff",minHeight:"100vh",padding:"30px",textAlign:"center",fontFamily:"Arial"}}>
      <h1>LEXXYPRO LIVE</h1>
      <h2 style={{fontSize:"40px"}}>Volatility 100: ${price}</h2>
      <h1 style={{fontSize:"70px",color:signal=="BUY"?"#00ff00":signal=="SELL"?"#ff0000":"yellow"}}>{signal}</h1>
      <p>Real Deriv Data - Live</p>
      <p style={{marginTop:"20px",color:"#888"}}>Connected to Deriv WS</p>
    </div>
  );
}
