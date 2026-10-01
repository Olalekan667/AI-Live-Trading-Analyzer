"use client";
import { useState, useEffect, useRef } from "react";

const PAIRS = [
  { label: "Volatility 10 Index", symbol: "R_10" },
  { label: "Volatility 25 Index", symbol: "R_25" },
  { label: "Volatility 50 Index", symbol: "R_50" },
  { label: "Volatility 75 Index", symbol: "R_75" },
  { label: "Volatility 100 Index", symbol: "R_100" },
  { label: "Volatility 10 (1s) Index", symbol: "R_10_1s" },
  { label: "Volatility 25 (1s) Index", symbol: "R_25_1s" },
  { label: "Volatility 50 (1s) Index", symbol: "R_50_1s" },
  { label: "Volatility 75 (1s) Index", symbol: "R_75_1s" },
  { label: "Volatility 100 (1s) Index", symbol: "R_100_1s" },
  { label: "Boom 300 Index", symbol: "BOOM300" },
  { label: "Boom 500 Index", symbol: "BOOM500" },
  { label: "Boom 1000 Index", symbol: "BOOM1000" },
  { label: "Crash 300 Index", symbol: "CRASH300" },
  { label: "Crash 500 Index", symbol: "CRASH500" },
  { label: "Crash 1000 Index", symbol: "CRASH1000" },
  { label: "Jump 10 Index", symbol: "JD10" },
  { label: "Jump 25 Index", symbol: "JD25" },
  { label: "Jump 50 Index", symbol: "JD50" },
  { label: "Jump 75 Index", symbol: "JD75" },
  { label: "Jump 100 Index", symbol: "JD100" },
  { label: "Step Index", symbol: "ST100" },
  { label: "Gold vs US Dollar (XAUUSD)", symbol: "frxXAUUSD" },
  { label: "EUR vs USD", symbol: "frxEURUSD" },
  { label: "GBP vs USD", symbol: "frxGBPUSD" },
  { label: "Volatility 100 (1s) Index - 2", symbol: "R_100_1s" },
];

const TIMEFRAMES = ["1m", "5m", "15m", "4H", "1D"];

export default function Page() {
  const [pair, setPair] = useState(PAIRS[4]);
  const [tf, setTf] = useState("5m");
  const [price, setPrice] = useState(0);
  const [history, setHistory] = useState([]);
  const [signal, setSignal] = useState("WAITING");
  const [conf, setConf] = useState(0);
  const wsRef = useRef(null);
  const lastNotify = useRef(0);

  // Notification permission
  const testNotify = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then(p => {
        if (p === "granted") {
          new Notification("🔔 LEXXYPRO ACTIVE", { body: `🟢 NEW BUY SIGNAL - ${pair.label} - 92% - ${tf}` });
          if (navigator.vibrate) navigator.vibrate(200);
        }
      });
    }
  };

  const sendLiveAlert = (type, pct) => {
    const now = Date.now();
    if (now - lastNotify.current < 30000) return; // 30 sec cooldown
    lastNotify.current = now;
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`${type === "BUY"? "🟢" : "🔴"} NEW ${type} SIGNAL`, {
        body: `${pair.label} - ${pct}% - ${tf}\nPrice: ${price}`,
      });
      if
