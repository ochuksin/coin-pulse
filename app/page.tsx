"use client";
import { useState, useEffect } from "react";
import {
  CryptoChart,
  DataPoint,
  MarketDataResponse,
} from "@/src/entities/crypto-chart";
import { generateMockCryptoData } from "@/src/entities/crypto-chart/";

const COINGECKO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY || "";
const BITCOIN_URL = "https://api.coingecko.com/api/v3/coins/bitcoin/";

export default function ChartPage() {
  const [days, setDays] = useState<number>(30);
  const [isMocked, setIsMocked] = useState<boolean>(true);
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      if (isMocked) {
        const mock = generateMockCryptoData();
        setChartData(mock);
      } else {
      }
      try {
        const response = await fetch(
          `${BITCOIN_URL}market_chart?vs_currency=usd&days=${days}`,
          {
            method: "GET",
            headers: {
              "x-cg-demo-api-key": COINGECKO_API_KEY,
              accept: "application/json",
            },
          },
        );
        console.log("res", response.ok);
        if (!response.ok)
          throw new Error(`Failed to fetch data: Status ${response.status}`);
        const data: MarketDataResponse = await response.json();
        console.log("data", data);

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
    <main>
      <div>
        <h1>
          Coin Chart for {days} {days === 1 ? "day" : "days"}
        </h1>
      </div>
      <div>
        {isLoading ? (
          <div>'Loading...'</div>
        ) : (
          <div>
            <CryptoChart data={chartData} />
          </div>
        )}
      </div>
    </main>
  );
}
