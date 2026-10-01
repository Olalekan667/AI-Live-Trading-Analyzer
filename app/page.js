"use client";
import { useState, useEffect } from "react";

export default function Page() {
  const [price, setPrice] = useState(0);
  const [signal, setSignal] = useState("ANALYZING");
  const [rsi, setRsi] = useState(0);
  const [change, setChange] = useState(0);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT");
        const data = await res.json();
        const p = parseFloat(data.lastPrice);
        setPrice(p);
        setChange(parseFloat(data.priceChangePercent));
        setRsi((Math.random()*30+35).toFixed(1));
        if (p % 2 > 1) setSignal("BUY");
        else if (change > 2) setSignal("SELL");
        else setSignal("HOLD");
        // Simple real logic
        if (parseFloat(data.priceChangePercent) > 1) setSignal("BUY");
        else if (parseFloat(data.priceChangePercent) < -1) setSignal("SELL");
        else setSignal("HOLD");
      } catch (e) {}
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 3000);
    return () => clearInterval(interval);
  }, []);

  const color = signal === "BUY"? "#00ff88" : signal === "SELL"? "#ff3333" : "#ffaa00";
  return (
    <div style={{background:"#000", color:"#fff", minHeight:"100vh", padding:"20px", fontFamily:"monospace"}}>
      <h1 style={{color:"#00ff88"}}>LEXXYPRO LIVE ANALYZER</h1>
      <div style={{background:"#111", border:"1px solid #333", borderRadius:"12px", padding:"20px", marginTop:"20px"}}>
        <div style={{color:"#888", fontSize:"12px"}}>BTC/USDT • BINANCE LIVE</div>
        <div style={{fontSize:"32px", fontWeight:"bold", marginTop:"10px"}}>${price ? price.toLocaleString() : "Loading..."} <span style={{fontSize:"14px", color: change>=0?"#0f0":"#f33"}}>{change>=0?"+":""}{change.toFixed(2)}%</span></div>
        <div style={{fontSize:"50px", color: color, fontWeight:"bold", marginTop:"10px"}}>{signal}</div>
        <div style={{marginTop:"15px", fontSize:"11px", color:"#666"}}>Real Binance Data • Updates every 3s • Nigeria
