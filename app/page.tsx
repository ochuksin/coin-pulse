"use client";
import { useState } from "react";
import {
  CryptoChart,
  StatCards,
  useCryptoChartData,
} from "@/src/entities/crypto-chart";
import { PeriodSelect } from "@/src/features/select-chart-period";
import { CoinSelect } from "@/src/features/select-coin";

/**
 * CryptoPulse Analytics - Главная страница
 *
 * Главная страница приложения CryptoPulse Analytics, отображающая:
 * - Интерактивный график цены криптовалюты
 * - Статистические карточки с ключевыми показателями
 * - Управление периодом отображения и выбором криптовалюты
 * - Переключение темы оформления
 *
 * @component
 * @example
 * // Использование компонента в приложении
 * <ChartPage />
 *
 * @returns {JSX.Element} Элемент React, представляющий главную страницу
 *
 * @see {@link https://www.coingecko.com/api/documentations/v3} - CoinGecko API документация
 *
 * @remarks
 * - Использует `useCryptoChartData` для получения данных о ценах
 * - Поддерживает mock-данные для отладки и разработки
 * - Адаптивный дизайн с Tailwind CSS
 *
 * @version 1.0.0
 */
export default function ChartPage() {
  // Состояние для хранения периода отображения графика (в днях)
  const [days, setDays] = useState<number>(1);
  // Состояние для хранения ID криптовалюты
  const [coinId, setCoinId] = useState<string>("bitcoin");

  // Хук для получения данных о криптовалюте с API или mock-данными
  const { data, isMocked, isLoading } = useCryptoChartData(coinId, days);
  /**
   * Функция для капитализации первой буквы строки
   *
   * @param {string} s - Исходная строка
   * @returns {string} Строка с заглавной первой буквой
   * @example
   * capitalize("bitcoin"); // "Bitcoin"
   * capitalize("ethereum"); // "Ethereum"
   */
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <main className="w-full max-w-7xl mx-auto p-6 space-y-6 sm:items-start">
      {/* Секция с заголовком, управлением и переключателем темы */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-zinc-100 dark:border-zinc-800 pb-6 text-blue-600 dark:text-blue-100">
        <div className="space-y-1">
          {/* Динамический заголовок страницы */}
          <h1 className="text-2xl font-extrabold tracking-tight">
            {capitalize(coinId)} Chart for {days} {days === 1 ? "day" : "days"}
          </h1>

          {/* Индикатор источника данных */}
          <div
            className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium ${isMocked ? "bg-amber-500/10 dark:bg-amber-500/40 text-amber-500 border border-amber-500/20" : "bg-green-500/10 dark:bg-green-500/40 text-green-500 border border-green-500/20"}`}
          >
            {isMocked ? "🔄 (Mock)" : "🌐 (CoinGecko API)"}
          </div>
        </div>

        {/* Панель управления: выбор монеты, периода и темы */}
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 w-full md:w-auto md:flex md:items-center md:gap-4">
          <div className="flex-1 sm:flex-initial min-w-[130px]">
            <CoinSelect value={coinId} onChange={setCoinId} />
          </div>
          <div className="flex-1 sm:flex-initial min-w-[120px]">
            <PeriodSelect value={days} onChange={setDays} />
          </div>
        </div>
      </div>

      {/* Основной контент: статистика и график */}
      <div className="space-y-6">
        {isLoading ? (
          // Экран загрузки
          <div className="w-full h-100 bg-zinc-100 dark:bg-zinc-800/40 rounded-3xl animate-pulse flex items-center justify-center text-zinc-400 font-medium">
            Loading...
          </div>
        ) : (
          // Контейнер для статистики и графика
          <div>
            <StatCards data={data} />
            <CryptoChart data={data} />
          </div>
        )}
      </div>
      {/* Футер приложения */}
      <footer className="text-sm text-zinc-400 font-medium p-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl text-center border  border-zinc-200 dark:border-zinc-800">
        Powered by CoinGecko API & Native HTML5 Canvas
      </footer>
    </main>
  );
}
