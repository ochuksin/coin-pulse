interface PeriodSelectProps {
  value: number;
  onChange: (value: number) => void;
}
export default function PeriodSelect({ value, onChange }: PeriodSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="period"
        className="text-sm font-medium text-zinc-500 dark:text-zinc-200"
      >
        Interval:
      </label>
      <select
        id="period"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-medium text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer text-zinc-800 dark:text-zinc-200"
      >
        <option value={1}>1D - 5-minutely data</option>
        <option value={7}>7D - hourly data</option>
        <option value={30}>30D - daily data </option>
        <option value={90}>90D - daily data </option>
      </select>
    </div>
  );
}
