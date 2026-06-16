"use client";
import { useState } from "react";
import {
  CryptoChart,
  StatCards,
  useCryptoChartData,
} from "@/src/entities/crypto-chart";
import { PeriodSelect } from "@/src/features/select-chart-period";
import { CoinSelect } from "@/src/features/select-coin";

export default function ChartPage() {
  const [days, setDays] = useState<number>(1);
  const [coinId, setCoinId] = useState<string>("bitcoin");

  const { data, isMocked, isLoading } = useCryptoChartData(coinId, days);

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <main className="w-full max-w-3xl mx-auto p-6 space-y-6">
      <header className="text-l text-zinc-400 font-medium p-2 text-left border-b  border-zinc-200 dark:border-zinc-800">
        CryptoPulse Analytics
      </header>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6 text-blue-600 dark:text-blue-100">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {capitalize(coinId)} Chart for {days} {days === 1 ? "day" : "days"}
          </h1>
          <div
            className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium ${isMocked ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-green-500/10 text-green-500 border border-green-500/20"}`}
          >
            {isMocked ? "🔄 (Mock)" : "🌐 (CoinGecko API)"}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <CoinSelect value={coinId} onChange={setCoinId} />
          <PeriodSelect value={days} onChange={setDays} />
        </div>
      </div>
      <div>
        {isLoading ? (
          <div className="w-full h-100 bg-zinc-100 dark:bg-zinc-800/40 rounded-3xl animate-pulse flex items-center justify-center text-zinc-400 font-medium">
            Loading...
          </div>
        ) : (
          //  : error ? (
          //   <div>
          //     Error loading data:{error.message}
          //     <br />
          //     Error loading data
          //   </div>
          // )
          <div>
            <StatCards data={data} />
            <CryptoChart data={data} />
          </div>
        )}
      </div>
      <footer className="text-sm text-zinc-400 font-medium p-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl text-center border  border-zinc-200 dark:border-zinc-800">
        Powered by CoinGecko API & Native HTML5 Canvas
      </footer>
    </main>
  );
}
