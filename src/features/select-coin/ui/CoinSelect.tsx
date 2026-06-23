interface CoinSelectProps {
  value: string;
  onChange: (coinId: string) => void;
}

const AVAILABLE_COINS = [
  { id: "bitcoin", name: "Bitcoin (BTC)" },
  { id: "ethereum", name: "Ethereum (ETH)" },
  { id: "solana", name: "Solana (SOL)" },
];

/**
 * Компонент выбора криптовалюты
 *
 * Выпадающий список для выбора криптовалюты для отображения графика.
 * Поддерживает основные криптовалюты: Bitcoin, Ethereum и Solana.
 *
 * @param {CoinSelectProps} props - Свойства компонента
 * @param {string} props.value - Текущее значение выбранной криптовалюты (ID)
 * @param {(coinId: string) => void} props.onChange - Функция обратного вызова при изменении выбора
 * @returns {JSX.Element} Элемент React, представляющий компонент выбора криптовалюты
 *
 * @remarks
 * - Адаптивный дизайн с Tailwind CSS
 * - Поддерживает темную и светлую темы
 * - Имеет адаптивную подпись (скрыта на мобильных устройствах)
 * - Ограничивает выбор тремя популярными криптовалютами
 * - Использует короткие названия с тикерами (BTC, ETH, SOL)
 *
 * @example
 * // Использование компонента
 * <CoinSelect
 *   value="bitcoin"
 *   onChange={(coinId) => setCoin(coinId)}
 * />
 *
 * @version 1.0.0
 */
export default function CoinSelect({ value, onChange }: CoinSelectProps) {
  return (
    <div className="flex items-center gap-2 w-full">
      <label
        htmlFor="coin-select"
        className="hidden sm:inline text-sm font-medium text-zinc-500 dark:text-zinc-200 shrink-0"
      >
        Coin:
      </label>
      <select
        id="coin-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-medium text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer text-zinc-800 dark:text-zinc-200 min-h-[38px]"
      >
        {AVAILABLE_COINS.map((coin) => (
          <option key={coin.id} value={coin.id}>
            {coin.name}
          </option>
        ))}
      </select>
    </div>
  );
}
