"use client";

import { useRef, useEffect, useState } from "react";
import { DataPoint } from "../model/types";
import { useChartInteractive } from "../";

/**
 * Основная функция отрисовки на канвасе
 *
 * Интерактивный компонент графика криптовалюты, реализованный на HTML5 Canvas.
 * Обеспечивает отображение ценовых данных с возможностью масштабирования,
 * панорамирования и взаимодействия пользователя.
 *
 * @param {Object} props - Свойства компонента
 * @param {DataPoint[]} props.data - Массив точек данных графика, содержащий дату, цену и временную метку
 * @returns {JSX.Element} Элемент React, представляющий интерактивный график
 *
 * @see {@link ../hooks/useChartInteractive.ts} - Хук управления интерактивностью
 *
 * @remarks
 * - Поддерживает горизонтальное масштабирование колесиком мыши/ pinch gesture
 * - Показывает всплывающую подсказку при наведении курсора
 * - Адаптивный дизайн с поддержкой темной/светлой темы
 * - Использует ResizeObserver для автоматического изменения размера
 * - Отрисовывает сетку, оси и градиентную заливку под графиком
 *
 * @example
 * // Использование компонента
 * <CryptoChart data={chartData} />
 *
 * @version 1.1.0
 */
export default function CryptoChart({ data }: { data: DataPoint[] }) {
  // Ссылки на DOM-элементы контейнера и canvas
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Состояние размеров компонента
  const [dimensions, setDimensions] = useState({ width: 700, height: 350 });
  // Тик для отслеживания смены темы (для принудительного обновления)
  const [themeTick, setThemeTick] = useState(0);

  // Отступы вокруг графика для осей и меток
  const padding = { top: 40, right: 20, bottom: 40, left: 60 };

  // Хук управления интерактивностью графика
  const interactive = useChartInteractive({ data, dimensions, padding });

  /**
   * Эффект для слушателя смены темы приложения
   * Обновляет внутреннее состояние при изменении темы, что приводит к перерисовке
   */
  useEffect(() => {
    const handleThemeChange = () => setThemeTick((t) => t + 1);
    window.addEventListener("themechange", handleThemeChange);
    return () => window.removeEventListener("themechange", handleThemeChange);
  }, []);

  /**
   * Эффект для адаптивного изменения размеров канваса
   * Использует ResizeObserver для отслеживания изменений размера контейнера
   */
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({ width, height: Math.max(250, width * 0.5) });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);
  // ==========================================
  /**
   * Эффект для обработки прокрутки колесиком мыши
   * Подписывается на событие wheel для масштабирования графика
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onNativeWheel = (e: globalThis.WheelEvent) => {
      const rect = canvas.getBoundingClientRect();

      interactive.handleWheel(e, rect);
    };

    canvas.addEventListener("wheel", onNativeWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onNativeWheel);
  }, [interactive]);

  // ==========================================
  //  ЦИКЛ РЕНДЕРИНГА CANVAS
  // ==========================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Настройка высокого разрешения для Retina-дисплеев
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const isDarkMode = document.documentElement.classList.contains("dark");
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Отрисовка сетки по оси Y (цены)
    ctx.strokeStyle = isDarkMode
      ? "rgba(255, 255, 255, 0.08)"
      : "rgba(161, 161, 170, 0.15)";
    ctx.fillStyle = isDarkMode ? "#a1a1aa" : "#71717a";
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let i = 0; i <= 4; i++) {
      const currentPrice =
        interactive.minPrice + (interactive.priceRange / 4) * i;
      const y = interactive.getCanvasY(currentPrice);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(dimensions.width - padding.right, y);
      ctx.stroke();
      ctx.fillText(
        `$${Math.round(currentPrice).toLocaleString()}`,
        padding.left - 10,
        y,
      );
    }

    // Создание маски для клиппирования содержимого графика
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      padding.left,
      padding.top,
      interactive.chartWidth,
      interactive.chartHeight,
    );
    ctx.clip();

    // ==========================================
    // ЛИНИЯ ГРАФИКА
    // ========================================
    ctx.beginPath();

    data.forEach((point, index) => {
      ctx.lineTo(
        interactive.getCanvasX(index),
        interactive.getCanvasY(point.price),
      );
    });
    ctx.strokeStyle = isDarkMode ? "#60a5fa" : "#3b82f6";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = dimensions.width < 500 ? 2 : 3;
    ctx.stroke();

    // Отрисовка градиентной заливки под графиком
    const gradient = ctx.createLinearGradient(
      0,
      padding.top,
      0,
      canvas.height - padding.bottom,
    );
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.25)");
    gradient.addColorStop(1, "rgba(59, 130, 246, 0)");

    ctx.lineTo(
      interactive.getCanvasX(data.length - 1),
      dimensions.height - padding.bottom,
    );
    ctx.lineTo(interactive.getCanvasX(0), dimensions.height - padding.bottom);
    ctx.closePath();

    ctx.fillStyle = gradient;
    ctx.fill();
    // ==========================================
    // Отрисовка всплывающей подсказки (tooltip)
    if (interactive.hoveredIndex >= 0 && data[interactive.hoveredIndex]) {
      const targetX = interactive.getCanvasX(interactive.hoveredIndex);
      const targetY = interactive.getCanvasY(
        data[interactive.hoveredIndex].price,
      );

      // Вертикальная пунктирная линия-сканер
      ctx.strokeStyle = isDarkMode ? "#60a5fa" : "#3b82f6";
      ctx.setLineDash([10, 7]);
      ctx.lineCap = "round";
      ctx.lineJoin = "bevel";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(targetX, padding.top);
      ctx.lineTo(targetX, dimensions.height - padding.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Точка-прицел на графике
      ctx.beginPath();
      ctx.arc(targetX, targetY, 6, 0, 2 * Math.PI);
      ctx.fillStyle = isDarkMode ? "#60a5fa" : "#3b82f6";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore(); // Снимаем клиппирование

    // Отрисовка оси X с датами
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const maxLabels = dimensions.width < 500 ? 3 : 6;
    const labelInterval = Math.ceil(
      data.length / maxLabels / interactive.scale,
    );

    data.forEach((point, index) => {
      const x = interactive.getCanvasX(index);
      if (x >= padding.left && x <= dimensions.width - padding.right) {
        if (
          index % Math.max(1, labelInterval) === 0 ||
          index === data.length - 1
        ) {
          ctx.fillText(
            point.timeLabel || point.date, //для одного дня - время
            x,
            dimensions.height - padding.bottom + 10,
          );
        }
      }
    });
  }, [
    data,
    dimensions,
    themeTick,
    interactive,
    padding.bottom,
    padding.left,
    padding.right,
    padding.top,
  ]);
  // JSX-представление компонента
  return (
    <div
      ref={containerRef}
      className="relative p-2 sm:p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl shadow-sm flex flex-col items-center w-full select-none"
    >
      <div className="relative w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={interactive.handleMouseDown}
          onMouseMove={(e) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) interactive.handleMouseMove(e, rect);
          }}
          onMouseUp={interactive.handleMouseUp}
          onMouseLeave={() => {
            interactive.setHoveredIndex(-1);
            interactive.setIsDragging(false);
          }}
          // Touch
          onTouchStart={(e) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) interactive.handleTouchStart(e, rect);
          }}
          onTouchMove={(e) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) interactive.handleTouchMove(e, rect);
          }}
          onTouchEnd={() => interactive.handleTouchEnd}
          className={`w-full h-auto block ${interactive.scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"} touch-none`}
        />

        {interactive.hoveredIndex >= 0 && data[interactive.hoveredIndex] && (
          <div
            style={{
              position: "absolute",
              left:
                interactive.mouseCoord.x + 15 > dimensions.width - 130
                  ? interactive.mouseCoord.x - 135
                  : interactive.mouseCoord.x + 15,
              top:
                interactive.mouseCoord.y - 60 < 10
                  ? interactive.mouseCoord.y + 15
                  : interactive.mouseCoord.y - 60,
              pointerEvents: "none",
            }}
            className="z-30 bg-zinc-900/95 dark:bg-zinc-950/95 text-white p-2.5 rounded-xl shadow-xl border border-zinc-700/50 text-xs font-mono space-y-0.5 min-w-[120px]"
          >
            <p className="text-zinc-400 font-sans">
              {data[0].timeLabel
                ? data[interactive.hoveredIndex].timeLabel
                : data[interactive.hoveredIndex].date}
            </p>
            <p className="text-sm font-bold text-blue-400">
              ${data[interactive.hoveredIndex].price.toLocaleString()}
            </p>
          </div>
        )}
      </div>
      {/* Инструкция по управлению */}
      <div className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 mt-2 font-medium">
        Scroll wheel / Pinch screen to{" "}
        <span className="text-blue-500 font-bold">Zoom</span> • Drag to{" "}
        <span className="text-blue-500 font-bold">Pan</span> • Hover to{" "}
        <span className="text-blue-500 font-bold">Inspect</span>
      </div>
    </div>
  );
}
