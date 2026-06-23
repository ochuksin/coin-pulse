interface PeriodSelectProps {
  value: number;
  onChange: (value: number) => void;
}

/**
 * Компонент выбора периода отображения графика
 *
 * Выпадающий список для выбора периода отображения криптовалютного графика.
 * Определяет временной интервал и частоту данных:
 * - 1 день: данные каждые 5 минут
 * - 7 дней: данные почасово
 * - 30 и 90 дней: данные в день
 *
 * @param {PeriodSelectProps} props - Свойства компонента
 * @param {number} props.value - Текущее значение выбранного периода (в днях)
 * @param {(value: number) => void} props.onChange - Функция обратного вызова при изменении выбора
 * @returns {JSX.Element} Элемент React, представляющий компонент выбора периода
 *
 * @remarks
 * - Адаптивный дизайн с Tailwind CSS
 * - Поддерживает темную и светлую темы
 * - Имеет адаптивную подпись (скрыта на мобильных устройствах)
 * - Отрисовывает опции для основных периодов (1D, 7D, 30D, 90D)
 * - Включает подсказку о частоте данных в каждом варианте выбора
 *
 * @example
 * // Использование компонента
 * <PeriodSelect
 *   value={7}
 *   onChange={(days) => setPeriod(days)}
 * />
 *
 * @version 1.0.0
 */
export default function PeriodSelect({ value, onChange }: PeriodSelectProps) {
  return (
    <div className="flex items-center gap-2 w-full">
      <label
        htmlFor="period"
        className="hidden sm:inline text-sm font-medium text-zinc-500 dark:text-zinc-200 shrink-0"
      >
        Interval:
      </label>
      <select
        id="period"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-medium text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer text-zinc-800 dark:text-zinc-200 min-h-[38px]"
      >
        <option value={1}>1D - 5-minutely data</option>
        <option value={7}>7D - hourly data</option>
        <option value={30}>30D - daily data </option>
        <option value={90}>90D - daily data </option>
      </select>
    </div>
  );
}
