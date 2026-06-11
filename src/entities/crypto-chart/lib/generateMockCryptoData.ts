// РЕЗЕРВНЫЙ ВАРИАНТ (Если API недоступен или превышен лимит запросов)
import { DataPoint } from "../model/types";

export default function generateMockCryptoData(days: number = 1) {
  console.log("days:", days);
  let count = days;
  let interval = 5;
  if (days < 1) {
    console.log("Error: dayCount must be at least 1");
  } else if (days === 1) {
    interval = 5;
  } else if (days >= 2 && days <= 90) {
    interval = 60;
  } else {
    interval = 24 * 60;
  }
  count = (days * 24 * 60) / interval;
  console.log("count:", count);
  const data: DataPoint[] = [];

  let currentPrice = 65000;

  const now = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(now.getTime() - interval * i * 60 * 1000);
    const dateObj = new Date(now.getTime() - interval * i * 60 * 1000);
    // const date = new Date();
    // date.setDate(date.getDate() - i);

    const volatility = (Math.random() - 0.49) * 2;
    const priceChange = Math.round(currentPrice * volatility * 0.03);
    currentPrice = Math.round(currentPrice + priceChange);

    const formatedDate = {
      date: dateObj.toLocaleDateString("en-En", {
        day: "numeric",
        month: "short",
      }),
      price: currentPrice,
      timeLabel:
        days === 1
          ? dateObj.toLocaleTimeString("en-En", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : undefined,
    };
    data.push(formatedDate);
    // data.push({
    //   date: dateObj.toLocaleDateString("en-En", {
    //     day: "numeric",
    //     month: "short",
    //   }),
    //   timeLabel: dateObj.toLocaleTimeString("en-En", {
    //     hour: "2-digit",
    //     minute: "2-digit",
    //   }),
    //   price: currentPrice,
    // });
  }
  return data;
}
