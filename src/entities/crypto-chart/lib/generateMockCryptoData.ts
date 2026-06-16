// РЕЗЕРВНЫЙ ВАРИАНТ (Если API недоступен или превышен лимит запросов)
import { DataPoint } from "../model/types";

let _seed = 1337;

const rng = () => {
  // Простой линейно-конгруэнтный генератор
  _seed = (_seed * 1664525 + 1013904223) % 4294967296;
  return _seed / 4294967296;
};
// В тестах можно переопределить seed
export const setMockSeed = (seed: number) => {
  _seed = seed;
};
export default function generateMockCryptoData(
  days: number = 1,
  overrideSeed?: number,
) {
  console.log("days:", days);

  if (overrideSeed !== undefined) {
    _seed = overrideSeed; //Можно фиксироватьseed
  }
  let count = days;

  if (days < 1) days = 1;
  const interval = days === 1 ? 5 : days <= 90 ? 60 : 24 * 60;

  count = Math.round((days * 24 * 60) / interval);
  const now = new Date();

  const data: DataPoint[] = [];
  let currentPrice = 65000;

  for (let i = 0; i < count; i++) {
    const timestamp = now.getTime() - interval * i * 60 * 1000;
    const date = new Date(timestamp);

    const volatility = (rng() - 0.49) * 2; // в диапазоне ~[-1.98, 1.98]
    const priceChange = Math.round(currentPrice * volatility * 0.03);
    currentPrice = Math.round(currentPrice + priceChange);

    const formatedDate = {
      date: date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      }),
      price: currentPrice,
      timeLabel:
        days === 1
          ? date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : undefined,
    };
    data.push(formatedDate);
  }
  return data;
}
