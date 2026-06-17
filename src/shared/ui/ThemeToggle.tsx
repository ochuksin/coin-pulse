"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {}, []);
  const toggleTheme = () => {
    console.log("toggleTheme");
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
    window.dispatchEvent(new Event("themechange"));
  };
  return (
    <button onClick={toggleTheme} type="button" className="cursor-pointer">
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
