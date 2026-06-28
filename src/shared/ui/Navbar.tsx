"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();

  const linkClassName = (active: boolean) =>
    `px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
      active
        ? "bg-blue-500 text-white shadow-xs"
        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
    }`;

  return (
    <nav className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <span className="text-lg font-black tracking-tight bg-linear-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
          ⚡ CoinPulse...
        </span>
        <div className="flex items-center gap-2">
          <Link href="/" className={linkClassName(pathname === "/")}>
            Analytics (REST)
          </Link>
          <Link
            href="/terminal"
            className={linkClassName(pathname === "/terminal")}
          >
            Live Terminal (WS)
          </Link>
        </div>
      </div>
      <ThemeToggle />
    </nav>
  );
}
