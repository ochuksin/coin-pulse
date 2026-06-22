import { useState, useEffect, useCallback } from "react";
import {
  DataPoint,
  generateMockCryptoData,
  MarketDataResponse,
} from "@/src/entities/crypto-chart";
const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3/coins/";

export type UseBitcoinChartDataResult = {
  data: DataPoint[];
  isMocked: boolean;
  isLoading: boolean;
  error: Error | null;
};

//  Валидация ответа API
const validateMarketData = (data: unknown): data is MarketDataResponse => {
  if (!data || typeof data !== "object") return false;
  if (!("prices" in data) || !Array.isArray((data as any).prices)) return false;
  const prices = (data as any).prices as [number, number][];
  return (
    prices.length > 0 &&
    prices.every(
      (p) =>
        Array.isArray(p) &&
        p.length === 2 &&
        typeof p[0] === "number" &&
        typeof p[1] === "number",
    )
  );
};

export const useCryptoChartData = (
  coinId: string,
  days: number,
  generateMock: (days: number) => DataPoint[] = generateMockCryptoData,
): UseBitcoinChartDataResult => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isMocked, setIsMocked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCryptoData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const API_KEY = (process.env.NEXT_PUBLIC_COINGECKO_API_KEY || "").trim();

    // Если API ключ не найден, используем мок-данные
    if (!API_KEY) {
      console.warn("No API key found. Using mock data.");

      setData(generateMock(days));
      setIsMocked(true);
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(
        `${COINGECKO_BASE_URL}${coinId}/market_chart?vs_currency=usd&days=${days}`,
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
      const data = await response.json();
      // console.log(data);

      if (!validateMarketData(data)) {
        throw new Error("Incorrect response structure from CoinGecko API");
      }
      const formatedDate = data.prices.map(([timestamp, price]) => {
        const date = new Date(timestamp);
        return {
          date: date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
          }),
          price: Math.round(price),
          timeLabel:
            days === 1
              ? date.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : undefined,
        };
      });

      setData(formatedDate);
      setIsMocked(false);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Unknown network error");
      setError(error);
      console.error("CoinGecko fetch error:", error);
      //
      const mock = generateMockCryptoData(days);
      if (mock && mock.length > 0) {
        setData(mock);
      }
      setIsMocked(true);
    } finally {
      setIsLoading(false);
    }
  }, [coinId, days]);
  useEffect(() => {
    fetchCryptoData();
  }, [fetchCryptoData]);
  return { data, isMocked, isLoading, error };
};
