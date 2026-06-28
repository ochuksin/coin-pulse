"use client";
import { useState, useRef, useEffect } from "react";

interface StreamPoint {
  timestamp: number;
  price: number;
}

/**
 * Компонент потокового графика криптовалюты
 *
 * Отображает реальное время цены криптовалюты с использованием Web Worker для оптимизации производительности.
 * Реализует многослойную систему Canvas для разделения статической и динамической отрисовки.
 *
 * @param {Object} props - Свойства компонента
 * @param {string} [props.coinId="btcusdt"] - ID криптовалюты для отображения (btcusdt, ethusdt, solusdt)
 *
 * @returns {JSX.Element} Элемент React, представляющий потоковый график
 *
 * @remarks
 * - Использует Web Worker для получения данных в отдельном потоке
 * - Реализует многослойную систему Canvas для разделения статической и динамической отрисовки
 * - Автоматически адаптируется к размеру контейнера через ResizeObserver
 * - Поддерживает темную и светлую темы
 * - Оптимизирован для высоких частот обновления (Web Worker + requestAnimationFrame)
 * - Отображает вертикальный сканер и цену при наведении курсора
 *
 * @example
 * // Использование компонента
 * <StreamChart coinId="ethusdt" />
 *
 * @version 1.0.0
 */
export default function StreamChart({
  coinId = "btcusdt",
}: {
  coinId?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const lineCanvasRef = useRef<HTMLCanvasElement>(null);
  const uiCanvasRef = useRef<HTMLCanvasElement>(null);

  const workerRef = useRef<Worker | null>(null);
  const dataRef = useRef<StreamPoint[]>([]);
  const [dimensions, setDimensions] = useState({ width: 700, height: 350 });
  const [hoveredIdx, setHoveredIdx] = useState<number>(-1);

  const [hoveredPrice, setHoveredPrice] = useState<number | null>(null);
  const [tooltipX, setTooltipX] = useState<number>(0);

  const padding = { top: 40, right: 20, bottom: 40, left: 70 };
  const chartWidth = dimensions.width - padding.left - padding.right;
  const chartHeight = dimensions.height - padding.top - padding.bottom;

  // Инициализация Web Worker
  useEffect(() => {
    const worker = new Worker(
      new URL("../lib/crypto.worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;

    worker.onmessage = (e) => {
      if (e.data.type === "DATA_UPDATE") {
        dataRef.current = e.data.payload;
      }
    };

    worker.postMessage({ command: "START_STREAM", payload: coinId });
    return () => {
      worker.postMessage({ command: "STOP_STREAM" });
      worker.terminate();
    };
  }, [coinId]);

  // ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({ width, height: Math.max(250, width * 0.5) });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  //  НИЖНИЙ СЛОЙ
  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const isDarkMode = document.documentElement.classList.contains("dark");
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Сетка
    ctx.strokeStyle = isDarkMode
      ? "rgba(255, 255, 255, 0.06)"
      : "rgba(161, 161, 170, 0.12)";
    ctx.lineWidth = 1;

    // 4 горизонтлаьных линии
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(dimensions.width - padding.right, y);
      ctx.stroke();
    }
  }, [
    dimensions,
    chartHeight,
    dimensions.width,
    padding.left,
    padding.right,
    padding.top,
  ]);
  //   СЛОЙ 2 И 3
  useEffect(() => {
    let animationFrameId: number;
    const renderLoop = () => {
      const lineCanvas = lineCanvasRef.current;
      const uiCanvas = uiCanvasRef.current;
      const points = dataRef.current;

      if (!lineCanvas || !uiCanvas || points.length < 2) {
        animationFrameId = requestAnimationFrame(renderLoop);
        return;
      }

      const lineCtx = lineCanvas.getContext("2d");
      const uiCtx = uiCanvas.getContext("2d");
      if (!lineCtx || !uiCtx) return;

      const dpr = window.devicePixelRatio || 1;
      const isDarkMode = document.documentElement.classList.contains("dark");

      // Настраиваем dpr динамических слоев
      if (lineCanvas.width !== dimensions.width * dpr) {
        lineCanvas.width = dimensions.width * dpr;
        lineCanvas.height = dimensions.height * dpr;
        lineCtx.scale(dpr, dpr);
      }
      if (uiCanvas.width !== dimensions.width * dpr) {
        uiCanvas.width = dimensions.width * dpr;
        uiCanvas.height = dimensions.height * dpr;
        uiCtx.scale(dpr, dpr);
      }
      // Очищаем динамические слои перед каждым кадром
      lineCtx.clearRect(0, 0, dimensions.width, dimensions.height);
      uiCtx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Математика экстремумов для текущего скользящего окна данных
      const prices = points.map((p) => p.price);
      const rMax = Math.max(...prices);
      const rMin = Math.min(...prices);
      const rRange = rMax - rMin || 1;
      const maxPrice = rMax + rRange * 0.05;
      const minPrice = Math.max(0, rMin - rRange * 0.05);
      const priceRange = maxPrice - minPrice || 1;

      const stepX = chartWidth / (points.length - 1 || 1);
      const getX = (idx: number) => padding.left + idx * stepX;
      const getY = (price: number) =>
        dimensions.height -
        padding.bottom -
        ((price - minPrice) / priceRange) * chartHeight;

      // ОТРИСОВКА ЦЕН НА ОСИ Y
      lineCtx.fillStyle = isDarkMode ? "#a1a1aa" : "#71717a";
      lineCtx.font = "10px monospace";
      lineCtx.textAlign = "right";
      lineCtx.textBaseline = "middle";
      for (let i = 0; i <= 4; i++) {
        const currentPrice = minPrice + (priceRange / 4) * i;
        const y = getY(currentPrice);
        lineCtx.fillText(
          `$${Math.round(currentPrice).toLocaleString()}`,
          padding.left - 10,
          y,
        );
      }

      //  РИСУЕМ ТРЕНД (СРЕДНИЙ СЛОЙ)
      lineCtx.save();
      lineCtx.beginPath();
      lineCtx.rect(padding.left, padding.top, chartWidth, chartHeight);
      lineCtx.clip();

      lineCtx.beginPath();
      points.forEach((p, idx) => lineCtx.lineTo(getX(idx), getY(p.price)));
      lineCtx.strokeStyle = isDarkMode ? "#22c55e" : "#16a34a"; // Стриминг - зеленый (Live!)
      lineCtx.lineWidth = 2.5;
      lineCtx.stroke();
      // Градиент под линией
      lineCtx.lineTo(
        getX(points.length - 1),
        dimensions.height - padding.bottom,
      );
      lineCtx.lineTo(getX(0), dimensions.height - padding.bottom);
      lineCtx.closePath();
      const grad = lineCtx.createLinearGradient(
        0,
        padding.top,
        0,
        dimensions.height - padding.bottom,
      );
      grad.addColorStop(
        0,
        isDarkMode ? "rgba(34, 197, 94, 0.12)" : "rgba(22, 163, 74, 0.15)",
      );
      grad.addColorStop(1, "rgba(22, 163, 74, 0.0)");
      lineCtx.fillStyle = grad;
      lineCtx.fill();
      lineCtx.restore();

      // РИСУЕМ ТУЛТИП (ВЕРХНИЙ СЛОЙ)

      if (hoveredIdx >= 0 && points[hoveredIdx]) {
        const targetX = getX(hoveredIdx);
        const targetY = getY(points[hoveredIdx].price);
        // Вертикальная пунктирная линия-сканер
        uiCtx.strokeStyle = isDarkMode ? "#22c55e" : "#16a34a";
        uiCtx.setLineDash([10, 7]);
        uiCtx.lineCap = "round";
        uiCtx.lineJoin = "bevel";
        uiCtx.lineWidth = 1;
        uiCtx.beginPath();
        uiCtx.moveTo(targetX, padding.top);
        uiCtx.lineTo(targetX, dimensions.height - padding.bottom);
        uiCtx.stroke();
        uiCtx.setLineDash([]);
        // Вертикальная пунктирная линия-сканер

        uiCtx.beginPath();
        uiCtx.arc(targetX, targetY, 5, 0, 2 * Math.PI);
        uiCtx.fillStyle = isDarkMode ? "#22c55e" : "#16a34a";
        uiCtx.fill();
      }
      // Рекурсивный вызов следующего кадра анимации
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    // Старт цикла
    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    dimensions,
    chartHeight,
    chartWidth,
    hoveredIdx,
    padding.bottom,
    padding.left,
    padding.top,
  ]);

  // Движение мыши по верхнему холсту
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = uiCanvasRef.current;
    const points = dataRef.current;
    if (!canvas || points.length < 2) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    if (mouseX >= padding.left && mouseX <= dimensions.width - padding.right) {
      const stepX = chartWidth / (points.length - 1 || 1);
      const idx = Math.round((mouseX - padding.left) / stepX);
      if (idx >= 0 && idx < points.length) {
        setHoveredIdx(idx);
        setHoveredPrice(points[idx].price);
        setTooltipX(padding.left + idx * stepX);
      }
    } else {
      setHoveredIdx(-1);
      setHoveredPrice(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm w-full select-none"
    >
      <div
        className="relative w-full overflow-hidden"
        style={{ height: dimensions.height }}
      >
        {/* СЛОЙ 1: Сетка  */}
        <canvas
          ref={bgCanvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
        />
        {/*  СЛОЙ 2: Линия тренда  */}
        <canvas
          ref={lineCanvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-20"
        />
        {/*  СЛОЙ 3: Интерактивный UI */}
        <canvas
          ref={uiCanvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIdx(-1)}
          className="absolute top-0 left-0 w-full h-full cursor-crosshair z-30 pointer-events-auto"
        />
        {/* Тултип */}
        {hoveredIdx >= 0 && hoveredPrice !== null && (
          <div
            style={{
              position: "absolute",
              left:
                tooltipX + 15 > dimensions.width - 130
                  ? tooltipX - 135
                  : tooltipX + 15,

              pointerEvents: "none",
            }}
            className="z-40 bg-zinc-950/95 text-white p-2 rounded-xl border border-zinc-800 text-xs font-mono"
          >
            ${hoveredPrice.toLocaleString()} Live Streaming from Test WebSocket
            (Web Worker Layered Canvas)
          </div>
        )}
      </div>
    </div>
  );
}
