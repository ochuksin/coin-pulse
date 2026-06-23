"use client";

import { useEffect } from "react";
/**
 * Компонент регистрации Service Worker для PWA
 *
 * Регистрирует Service Worker для включения приложения в качестве Progressive Web App (PWA).
 * Service Worker позволяет кэширование ресурсов, офлайн-доступ и другие PWA-функции.
 *
 * @returns {null} Возвращает null, так как компонент не имеет UI
 *
 * @remarks
 * - Проверяет поддержку Service Worker в браузере
 * - Регистрирует файл `/sw.js` как Service Worker
 * - Использует событие `load` для корректной регистрации
 * - Логирует ошибки регистрации в консоль
 * - Очищает слушатели событий при размонтировании компонента
 * - Безопасно работает на сервере (не выполняет регистрацию)
 *
 * @example
 * // Добавление компонента в корневой компонент приложения
 * <PWARegister />
 *
 * @see {@link https://web.dev/progressive-web-apps/} - Руководство по Progressive Web Apps
 *
 * @version 1.0.0
 */
export default function PWARegister(): null {
  useEffect(() => {
    // Проверяем, что компонент монтируется в браузере и Service Worker поддерживается
    if (typeof window === "undefined" || !("serviceWorker" in navigator))
      return;

    const registerSW = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => {})
        .catch((error) => {
          console.error(" [PWA] Service Worker Registration Error :", error);
        });
    };

    // Регистрируем Service Worker после полной загрузки страницы
    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
      return () => window.removeEventListener("load", registerSW);
    }
  }, []);

  return null;
}
