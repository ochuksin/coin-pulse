import { DataPoint } from "../model/types";

interface StatCardsProps {
  data: DataPoint[];
}

export default function StatCards({ data }: StatCardsProps) {
  // Защита на случай, если данные еще не загрузились
  if (!data || data.length === 0) return null;

  //  Текущая цена -последняя точка в массиве
  const currentPrice = data[data.length - 1].price;

  //  Начальная цена периода -первая точка в массиве
  const firstPrice = data[0].price;

  //  Вычисляем Максимум и Минимум за весь период
  const allPrices = data.map((d) => d.price);
  const periodHigh = Math.max(...allPrices);
  const periodLow = Math.min(...allPrices);

  //  Расчет изменения цены в процентах
  const priceChangeRaw = currentPrice - firstPrice;
  const percentageChange = (priceChangeRaw / firstPrice) * 100;

  const isPositive = percentageChange >= 0;

  //  Стили для карточек
  const cardClassName =
    "flex flex-col p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs mb-2";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {/* CARD 1: Current price */}
      <div className={cardClassName}>
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Current price
        </span>
        <span className="text-xl font-bold mt-1 tracking-tight">
          ${currentPrice.toLocaleString()}
        </span>
      </div>

      {/* CARD 2: Changing trend */}
      <div className={cardClassName}>
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Changing trend
        </span>
        <span
          className={`text-xl font-bold mt-1 tracking-tight flex items-center gap-1 ${
            isPositive ? "text-green-500" : "text-red-500"
          }`}
        >
          {isPositive ? "▲" : "▼"} {Math.abs(percentageChange).toFixed(2)}%
        </span>
      </div>

      {/* CARD 3: Max */}
      <div className={cardClassName}>
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Max
        </span>
        <span className="text-xl font-bold mt-1 tracking-tight text-zinc-700 dark:text-zinc-200">
          ${periodHigh.toLocaleString()}
        </span>
      </div>

      {/* CARD 4: Min */}
      <div className={cardClassName}>
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Min
        </span>
        <span className="text-xl font-bold mt-1 tracking-tight text-zinc-700 dark:text-zinc-200">
          ${periodLow.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
