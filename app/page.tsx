"use client";
import { useState, useEffect } from "react";
import {
  CryptoChart,
  DataPoint,
  MarketDataResponse,
  StatCards,
  generateMockCryptoData,
} from "@/src/entities/crypto-chart";
import { PeriodSelect } from "@/src/features/select-chart-period";

const BITCOIN_URL = "https://api.coingecko.com/api/v3/coins/bitcoin/";

export default function ChartPage() {
  const [days, setDays] = useState<number>(1);
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [isMocked, setIsMocked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      try {
        const API_KEY = (
          process.env.NEXT_PUBLIC_COINGECKO_API_KEY || ""
        ).trim();

        const response = await fetch(
          `${BITCOIN_URL}market_chart?vs_currency=usd&days=${days}`,
          {
            method: "GET",
            headers: {
              "x-cg-demo-api-key": API_KEY,
              accept: "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch data: Status ${response.status}`);
        }
        const data: MarketDataResponse = await response.json();

        const formatedDate = data.prices.map(([timestamp, price]) => {
          const dateObj = new Date(timestamp);
          return {
            date: dateObj.toLocaleDateString("en-En", {
              day: "numeric",
              month: "short",
            }),
            price: Math.round(price),
            timeLabel:
              days === 1
                ? dateObj.toLocaleTimeString("en-En", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : undefined,
          };
        });
        setChartData(formatedDate);
        setIsMocked(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        const mock = generateMockCryptoData(days);
        setChartData(mock);
        setIsMocked(true);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [days]);

  return (
    <main className="w-full max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6 text-blue-600 dark:text-blue-100">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Coin Chart for {days} {days === 1 ? "day" : "days"}
          </h1>
          <span
            className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium ${isMocked ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-green-500/10 text-green-500 border border-green-500/20"}`}
          >
            {isMocked ? "🔄 (Mock)" : "🌐 (CoinGecko API)"}
          </span>
        </div>
        <PeriodSelect value={days} onChange={setDays} />
      </div>
      <div>
        {isLoading ? (
          <div className="w-full h-[400px] bg-zinc-100 dark:bg-zinc-800/40 rounded-3xl animate-pulse flex items-center justify-center text-zinc-400 font-medium">
            Loading...
          </div>
        ) : (
          <div>
            <StatCards data={chartData} />
            <CryptoChart data={chartData} />
          </div>
        )}
      </div>
    </main>
  );
}
