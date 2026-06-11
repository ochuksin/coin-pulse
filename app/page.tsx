"use client";
import { useState, useEffect } from "react";
import { CryptoChart } from "@/src/entities/crypto-chart";
const COINGECKO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY || "";
const BITCOIN_URL = "https://api.coingecko.com/api/v3/coins/bitcoin/";

export default function ChartPage() {
  const [days, setDays] = useState<number>(1);

  useEffect(() => {
    async function loadData() {
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
        const data = await response.json();
        console.log("data", data);
      } catch (error) {
        console.error("Error fetching data:", error);
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
    </main>
  );
}
