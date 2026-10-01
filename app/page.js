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
];

const TIMEFRAMES = ["1m", "5m", "15m", "4H", "1D"];

export default function Page() {
  const [pair, setPair]
