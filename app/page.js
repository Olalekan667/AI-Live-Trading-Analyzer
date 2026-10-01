"use client";
import { useState, useEffect } from "react";
export default function Page(){
  const [price,setPrice]=useState(0);
  const [signal,setSignal]=useState("LOADING");
  const [change,setChange]=useState(0);
  useEffect(()=>{
    async function load(){
      try{
        const r=await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT");
        const d=await r.json();
        setPrice(parseFloat(d.lastPrice));
        setChange(parseFloat(d.priceChangePercent));
        if(parseFloat(d.priceChangePercent)>1)setSignal("BUY");
        else if(parseFloat(d.priceChangePercent)<-1)setSignal("SELL");
        else setSignal("HOLD");
      }catch(e){}
    }
    load();
    setInterval(load,3000);
  },[]);
  return(
    <div style={{background:"black",color:"white",minHeight:"100vh",padding:"20px"}}>
      <h1>LEXXYPRO LIVE</h1>
      <h2>BTC: ${price.toLocaleString()} ({change.toFixed(2)}%)</h2>
      <h1 style={{color:signal=="BUY"?"lime":signal=="SELL"?"red":"orange",fontSize:"60px"}}>{signal}</h1>
      <p>Real Binance Data - Live</p>
    </div>
  );
}
