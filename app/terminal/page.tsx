"use client";

import { useState } from "react";
import { StreamChart } from "@/src/entities/stream-chart";

/**
 * Available coins for the streaming chart.
 * Each object contains a unique identifier (`id`) and a display name (`name`).
 */
const STREAM_COINS = [
  { id: "btcusdt", name: "Bitcoin (BTC)" },
  { id: "ethusdt", name: "Ethereum (ETH)" },
  { id: "solusdt", name: "Solana (SOL)" },
];

/**
 * TerminalPage — A client-side React component for a real-time trading terminal simulation.
 *
 * Features:
 * - Live chart updates using `StreamChart` without blocking the UI thread.
 * - Coin selection via dropdown, updating the active coin stream.
 * - Clear disclaimers about simulation-only behavior.
 * - Responsive layout and dark/light theme support.
 *
 * @returns React component rendering a trading terminal interface with chart and coin selector.
 */
export default function TerminalPage() {
  const [activeCoin, setActiveCoin] = useState("btcusdt");

  return (
    <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-blue-600 dark:text-blue-100">
            Real-time Trading Terminal (Simulation)
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Background streaming of quotes without impacting the React UI
            thread.
          </p>
          <p className="text-sm text-zinc-400 mt-1">
            <span className="text-sm text-red-800 text-black mt-1">
              PLEASE NOTE:
            </span>{" "}
            This is just a simulation. Not real trading. Not real money.
          </p>
        </div>

        {/* Переключатель стрим-монет */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-sm font-medium text-zinc-500">Ticker:</span>
          <select
            value={activeCoin}
            onChange={(e) => setActiveCoin(e.target.value)}
            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-semibold text-sm outline-none cursor-pointer text-zinc-800 dark:text-zinc-200"
          >
            {STREAM_COINS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/*  многослойный холст */}
      <StreamChart key={activeCoin} coinId={activeCoin} />
    </main>
  );
}
