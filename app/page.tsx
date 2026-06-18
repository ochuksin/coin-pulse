"use client";
import { useState } from "react";
import {
  CryptoChart,
  StatCards,
  useCryptoChartData,
} from "@/src/entities/crypto-chart";
import { PeriodSelect } from "@/src/features/select-chart-period";
import { CoinSelect } from "@/src/features/select-coin";
import { ThemeToggle } from "@/src/shared";

/**
 * Главная страница
 * @returns
 */
export default function ChartPage() {
  const [days, setDays] = useState<number>(1);
  const [coinId, setCoinId] = useState<string>("bitcoin");

  const { data, isMocked, isLoading } = useCryptoChartData(coinId, days);

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <main className="w-full max-w-7xl mx-auto p-6 space-y-6 sm:items-start">
      <header className="text-sm text-zinc-400 font-medium p-2 text-left border-b border-zinc-200 dark:border-zinc-800">
        CryptoPulse Analytics
      </header>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-zinc-100 dark:border-zinc-800 pb-6 text-blue-600 dark:text-blue-100">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight ">
            {capitalize(coinId)} Chart for {days} {days === 1 ? "day" : "days"}
          </h1>
          <div
            className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium ${isMocked ? "bg-amber-500/10 dark:bg-amber-500/40 text-amber-500 border border-amber-500/20" : "bg-green-500/10 dark:bg-green-500/40 text-green-500 border border-green-500/20"}`}
          >
            {isMocked ? "🔄 (Mock)" : "🌐 (CoinGecko API)"}
          </div>
        </div>
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 w-full md:w-auto md:flex md:items-center md:gap-4">
          <div className="flex-1 sm:flex-initial min-w-[130px]">
            <CoinSelect value={coinId} onChange={setCoinId} />
          </div>
          <div className="flex-1 sm:flex-initial min-w-[120px]">
            <PeriodSelect value={days} onChange={setDays} />
          </div>
          <div className="shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </div>
      <div className="space-y-6">
        {isLoading ? (
          <div className="w-full h-100 bg-zinc-100 dark:bg-zinc-800/40 rounded-3xl animate-pulse flex items-center justify-center text-zinc-400 font-medium">
            Loading...
          </div>
        ) : (
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
