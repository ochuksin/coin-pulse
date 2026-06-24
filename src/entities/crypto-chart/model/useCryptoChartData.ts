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

/**
 * Валидация ответа API CoinGecko
 *
 * Проверяет структуру ответа от API CoinGecko на соответствие ожидаемому формату
 *
 * @param {unknown} data - Данные, полученные от API
 * @returns {data is MarketDataResponse} true, если данные соответствуют ожидаемой структуре
 *
 * @remarks
 * - Проверяет наличие свойства "prices" и его тип (массив)
 * - Убедиться, что массив не пустой
 * - Проверяет, что каждая цена представлена массивом из двух чисел: [timestamp, price]
 *
 * @example
 * const isValid = validateMarketData(responseData);
 * if (isValid) {
 *   // Безопасно использовать data.prices
 * }
 */
const validateMarketData = (data: unknown): data is MarketDataResponse => {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  if (!("prices" in obj) || !Array.isArray(obj.prices)) return false;

  const prices = obj.prices as [number, number][];
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

/**
 * Хук для получения данных о криптовалюте с CoinGecko API
 *
 * Использует CoinGecko API для получения истории цен криптовалюты с возможностью
 * автоматического переключения на mock-данные при отсутствии API-ключа
 *
 * @param {string} coinId - ID криптовалюты (например, "bitcoin", "ethereum")
 * @param {number} days - Количество дней для отображения истории цен
 * @param {(days: number) => DataPoint[]} [generateMock=generateMockCryptoData] - Функция для генерации mock-данных
 * @returns {UseBitcoinChartDataResult} Объект с данными графика, флагом mock-данных и состоянием загрузки
 *
 * @returns {DataPoint[]} data - Массив точек данных графика (дата, цена, метка времени)
 * @returns {boolean} isMocked - true, если данные получены из mock, false - из реального API
 * @returns {boolean} isLoading - true, пока идет загрузка данных
 * @returns {Error | null} error - Ошибка, если произошла ошибка при загрузке
 *
 * @see {@link https://www.coingecko.com/api/documentations/v3} - CoinGecko API документация
 *
 * @remarks
 * - Использует NEXT_PUBLIC_COINGECKO_API_KEY из переменных окружения для доступа к реальному API
 * - При отсутствии API ключа автоматически переключается на mock-данные
 * - Автоматически форматирует timestamps в читаемые даты
 * - Для 1-дневного периода отображает время (час:минута), для остальных - даты
 * - Реализует возврат к mock-данным при сетевых ошибках
 *
 * @example
 * // Использование в компоненте
 * const { data, isMocked, isLoading, error } = useCryptoChartData("bitcoin", 30);
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return <Chart data={data} />;
 *
 * @version 1.0.0
 */
export const useCryptoChartData = (
  coinId: string,
  days: number,
  generateMock: (days: number) => DataPoint[] = generateMockCryptoData,
): UseBitcoinChartDataResult => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isMocked, setIsMocked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCryptoData = useCallback(
    async (
      onSuccess: (formattedData: DataPoint[], mocked: boolean) => void,
    ) => {
      // Принудительно уводим  функцию в асинхронный поток.
      await Promise.resolve();

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
          `${COINGECKO_BASE_URL}${coinId}/market_chart?vs_currency=usd&days=${days}&x_cg_demo_api_key=${API_KEY}`,
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
        onSuccess(formatedDate, false);
        // setData(formatedDate);
        // setIsMocked(false);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Unknown network error");
        setError(error);
        console.error("CoinGecko fetch error:", error);

        // При ошибке используем mock-данные как фолбек
        const mock = generateMockCryptoData(days);
        onSuccess(mock, true);
        setError(error);
        // if (mock && mock.length > 0) {
        //   setData(mock);
        // }
        // setIsMocked(true);
      } finally {
        setIsLoading(false);
      }
    },
    [coinId, days, generateMock],
  );

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      fetchCryptoData((formattedData, mocked) => {
        if (!active) return;
        setData(formattedData);
        setIsMocked(mocked);
        setIsLoading(false);
      });
    }, 0);
    return () => {
      clearTimeout(timer);
      active = false;
    };
  }, [fetchCryptoData]);
  return { data, isMocked, isLoading, error };
};
