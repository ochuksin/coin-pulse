import { DataPoint } from "../model/types";

interface StatCardsProps {
  data: DataPoint[];
}

export default function StatCards({ data }: StatCardsProps) {
  // Защита на случай, если данные еще не загрузились
  if (!data || data.length === 0) {
    return (
      <div className="text-sm text-zinc-400 font-medium p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl text-center border border-dashed border-zinc-200 dark:border-zinc-800">
        No data for period
      </div>
    );
  }

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
  const cardTitleClassName =
    "text-xs font-medium text-zinc-400 uppercase tracking-wider";
  const cardValueClassNameBase = "text-xl font-bold mt-1 tracking-tight";
  const cardValueClassName = `${cardValueClassNameBase} text-zinc-700 dark:text-zinc-200`;
  //
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {/* CARD 1: Current price */}
      <div className={cardClassName}>
        <span className={cardTitleClassName}>Current price</span>
        <span className={cardValueClassName}>
          ${currentPrice.toLocaleString()}
        </span>
      </div>

      {/* CARD 2: Changing trend */}
      <div className={cardClassName}>
        <span className={cardTitleClassName}>Changing trend</span>
        <span
          className={`flex items-center gap-1 ${cardValueClassNameBase} ${
            isPositive ? "text-green-500" : "text-red-500"
          }`}
        >
          {isPositive ? "▲" : "▼"} {Math.abs(percentageChange).toFixed(2)}%
        </span>
      </div>

      {/* CARD 3: Max */}
      <div className={cardClassName}>
        <span className={cardTitleClassName}>Max</span>
        <span className={cardValueClassName}>
          ${periodHigh.toLocaleString()}
        </span>
      </div>

      {/* CARD 4: Min */}
      <div className={cardClassName}>
        <span className={cardTitleClassName}>Min</span>
        <span className={cardValueClassName}>
          ${periodLow.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
