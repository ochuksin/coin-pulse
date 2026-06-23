"use client";
import { JSX, useEffect, useState } from "react";

/**
 * Компонент переключения темы
 *
 * Кнопка для переключения между светлой и темной темами приложения.
 * Сохраняет выбранную тему в localStorage и уведомляет другие компоненты
 * о изменении темы через событие `themechange`.
 *
 * @returns {JSX.Element} Элемент React, представляющий кнопку переключения темы
 *
 * @remarks
 * - Использует localStorage для сохранения выбора пользователя
 * - Добавляет/удаляет класс "dark" у корневого элемента (documentElement)
 * - Генерирует событие "themechange" для уведомления других компонентов
 * - Отображает иконки солнца (☀️) для светлой темы и луны (🌙) для темной темы
 * - Предотвращает мерцание темы при SSR за счет заглушки на стороне сервера
 * - Поддерживает системные предпочтения пользователя через `prefers-color-scheme`
 *
 * @example
 * // Использование компонента
 * <ThemeToggle />
 *
 * @version 1.0.0
 */
export default function ThemeToggle(): JSX.Element {
  // Состояние темы (по умолчанию false для серверного рендеринга)
  const [isDark, setIsDark] = useState<boolean>(false);

  // Флаг монтирования компонента на клиенте
  const [mounted, setMounted] = useState<boolean>(false);

  // Инициализация темы при первом рендеринге на клиенте
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);

      const savedTheme = localStorage.getItem("theme");
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;

      //  Приоритет: 1) сохраненная тема, 2) системные настройки
      const shouldBeDark =
        savedTheme === "dark" || (!savedTheme && prefersDark);

      setIsDark(shouldBeDark);

      if (shouldBeDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  //  Синхронизация темы с localStorage и DOM при изменении состояния
  useEffect(() => {
    if (!mounted) return; //  Пропускаем на сервере

    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark, mounted]);

  // Обработчик переключения темы
  const toggleTheme = () => {
    setIsDark((prev) => !prev);
    // Уведомляем другие компоненты о смене темы
    setTimeout(() => {
      window.dispatchEvent(new Event("themechange"));
    }, 0);
  };

  // Заглушка для предотвращения мерцания темы при SSR
  if (!mounted) {
    return (
      <div className="p-2.5 rounded-xl border border-zinc-200 bg-white min-w-[40px] h-[38px]" />
    );
  }

  return (
    <button onClick={toggleTheme} type="button" className="cursor-pointer">
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
