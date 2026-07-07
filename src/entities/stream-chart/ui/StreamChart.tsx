"use client";
import { useState, useRef, useEffect, JSX, useMemo, useCallback } from "react";
import { useCryptoChartData } from "../../crypto-chart";

interface StreamPoint {
  timestamp: number;
  price: number;
}

const COIN_MAP: Record<string, string> = {
  btcusdt: "bitcoin",
  ethusdt: "ethereum",
  solusdt: "solana",
};
const padding = { top: 40, right: 20, bottom: 40, left: 70 };
export default function StreamChart({
  coinId = "btcusdt",
}: {
  coinId?: string;
}): JSX.Element {
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
  // ЛАЙВ-СЧЕТЧИК
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [priceDelta, setPriceDelta] = useState<number>(0); //

  const containerRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({ width, height: Math.max(250, width * 0.5) });
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // const { chartWidth, chartHeight } = useMemo(() => {
  //   return {
  //     chartWidth: dimensions.width - padding.left - padding.right,
  //     chartHeight: dimensions.height - padding.top - padding.bottom,
  //   };
  // }, [dimensions]);

  const chartWidth = dimensions.width - padding.left - padding.right;
  const chartHeight = dimensions.height - padding.top - padding.bottom;

  // Очистка реф при смене тикера
  useEffect(() => {
    dataRef.current = [];
  }, [coinId]);

  // Качаем реальные данные за 1 день из CoinGecko
  const coinGeckoSlug = COIN_MAP[coinId] || "bitcoin";
  const { data: restData, isLoading: isRestLoading } = useCryptoChartData(
    coinGeckoSlug,
    1,
  );
  const avgPrice = useMemo(() => {
    if (!restData || restData.length === 0) return 0;
    const sum = restData.reduce((acc, point) => acc + point.price, 0);
    return Math.round((sum / restData.length) * 100) / 100;
  }, [restData]);

  // Инициализация Web Worker и запуск живого счетчика
  useEffect(() => {
    if (isRestLoading || avgPrice === 0) return;

    const worker = new Worker(
      new URL("../lib/crypto.worker.ts", import.meta.url),
      { type: "module" },
    );

    workerRef.current = worker;

    worker.onmessage = (e) => {
      if (e.data.type === "DATA_UPDATE") {
        const points = e.data.payload;
        dataRef.current = points;
        // Обновляем метрики
        if (points && points.length > 0) {
          const latest = points[points.length - 1].price;
          setLivePrice(latest);

          if (avgPrice > 0) {
            const delta = ((latest - avgPrice) / avgPrice) * 100;
            setPriceDelta(Math.round(delta * 100) / 100);
          }
        }
      }
    };
    // Передаем в payload имя тикера и  базовую цену
    worker.postMessage({
      command: "START_STREAM",
      payload: { coinSymbol: coinId, basePrice: avgPrice },
    });
    return () => {
      worker.postMessage({ command: "STOP_STREAM" });
      worker.terminate();
    };
  }, [coinId, avgPrice, isRestLoading]);

  // ПОДГОТОВКА ГЕОМЕТРИИ CANVAS
  useEffect(() => {
    const bg = bgCanvasRef.current;
    const line = lineCanvasRef.current;
    const ui = uiCanvasRef.current;

    if (!bg || !line || !ui) return;

    const dpr = window.devicePixelRatio || 1;

    [bg, line, ui].forEach((canvas) => {
      canvas.width = dimensions.width * dpr;
      canvas.height = dimensions.height * dpr;

      canvas.style.width = `${dimensions.width}px`;
      canvas.style.height = `${dimensions.height}px`;
    });
  }, [dimensions]);

  //

  // Бесконечный цикл анимации requestAnimationFrame (Game Loop)
  useEffect(() => {
    let animationFrameId: number;

    const renderLoop = () => {
      const bgCanvas = bgCanvasRef.current;
      const lineCanvas = lineCanvasRef.current;
      const uiCanvas = uiCanvasRef.current;
      const points = dataRef.current;

      if (!bgCanvas || !lineCanvas || !uiCanvas || points.length < 2) {
        animationFrameId = requestAnimationFrame(renderLoop);
        return;
      }

      const bgCtx = bgCanvas.getContext("2d");
      const lineCtx = lineCanvas.getContext("2d");
      const uiCtx = uiCanvas.getContext("2d");
      if (!bgCtx || !lineCtx || !uiCtx) return;

      const dpr = window.devicePixelRatio || 1;
      const isDarkMode = document.documentElement.classList.contains("dark");

      // Очищаем слои
      bgCtx.setTransform(1, 0, 0, 1, 0, 0);
      bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

      lineCtx.setTransform(1, 0, 0, 1, 0, 0);
      lineCtx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);

      uiCtx.setTransform(1, 0, 0, 1, 0, 0);
      uiCtx.clearRect(0, 0, uiCanvas.width, uiCanvas.height);

      //
      bgCtx.scale(dpr, dpr);
      lineCtx.scale(dpr, dpr);
      uiCtx.scale(dpr, dpr);

      // Слой 1: Статичная сетка
      bgCtx.strokeStyle = isDarkMode
        ? "rgba(255, 255, 255, 0.06)"
        : "rgba(161, 161, 170, 0.12)";
      bgCtx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        bgCtx.beginPath();
        bgCtx.moveTo(padding.left, y);
        bgCtx.lineTo(dimensions.width - padding.right, y);
        bgCtx.stroke();
      }

      // Рассчитываем экстремумы цен для текущего кадра
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

      // ЦЕНЫ НА ОСИ Y
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

      // Слой 2: Линия тренда и градиент под ней
      lineCtx.save();
      lineCtx.beginPath();
      lineCtx.rect(padding.left, padding.top, chartWidth, chartHeight);
      lineCtx.clip();

      lineCtx.beginPath();
      points.forEach((p, idx) => lineCtx.lineTo(getX(idx), getY(p.price)));
      lineCtx.strokeStyle = isDarkMode ? "#22c55e" : "#16a34a";
      lineCtx.lineWidth = 2.5;
      lineCtx.stroke();

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

      // Слой 3: Тултип-прицел
      if (hoveredIdx >= 0 && points[hoveredIdx]) {
        const targetX = getX(hoveredIdx);
        const targetY = getY(points[hoveredIdx].price);

        uiCtx.strokeStyle = isDarkMode ? "#22c55e" : "#16a34a";
        uiCtx.lineWidth = 1;
        uiCtx.beginPath();
        uiCtx.moveTo(targetX, padding.top);
        uiCtx.lineTo(targetX, dimensions.height - padding.bottom);
        uiCtx.stroke();

        uiCtx.beginPath();
        uiCtx.arc(targetX, targetY, 5, 0, 2 * Math.PI);
        uiCtx.fillStyle = isDarkMode ? "#22c55e" : "#16a34a";
        uiCtx.fill();
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions, chartHeight, chartWidth, hoveredIdx]);

  // Движение мыши/тача
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = uiCanvasRef.current;
    const points = dataRef.current;
    if (!canvas || points.length < 2) return;

    const rect = canvas.getBoundingClientRect();
    const canvasWidth = rect.width;
    const mouseX = e.clientX - rect.left;

    if (mouseX >= padding.left && mouseX <= canvasWidth - padding.right) {
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
      ref={containerRefCallback}
      className="relative  bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm w-full select-none"
    >
      {isRestLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xs flex items-center justify-center rounded-3xl z-50 text-zinc-400 font-semibold text-sm animate-pulse">
          Syncing with CoinGecko Market Rates...
        </div>
      )}
      {livePrice && (
        <div className="flex items-baseline gap-3 px-2">
          <span className="text-sm sm:text-base font-bold px-2 py-0.5 rounded-lg font-mono flex items-center gap-0.5 bg-zinc-500/10 text-zinc-800 dark:text-zinc-400">
            $
            {livePrice.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span
            className={`text-sm sm:text-base font-bold px-2 py-0.5 rounded-lg font-mono flex items-center gap-0.5 ${
              priceDelta >= 0
                ? "bg-green-500/10 text-green-500 dark:text-green-400"
                : "bg-red-500/10 text-red-500 dark:text-red-400"
            }`}
          >
            {priceDelta >= 0 ? "▲" : "▼"} {priceDelta >= 0 ? "+" : ""}
            {priceDelta}%
          </span>
          <span className="text-xs text-zinc-400 font-medium">
            vs day average (${avgPrice.toLocaleString()})
          </span>
        </div>
      )}
      {/* Оболочка канвасов */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: dimensions.height }}
      >
        {/* СЛОЙ 1: Сетка  */}
        <canvas
          ref={bgCanvasRef}
          className="absolute top-0 left-0 pointer-events-none z-10"
          style={{ width: dimensions.width, height: dimensions.height }}
        />
        {/*  СЛОЙ 2: Линия тренда  */}
        <canvas
          ref={lineCanvasRef}
          className="absolute top-0 left-0 pointer-events-none z-20"
          style={{ width: dimensions.width, height: dimensions.height }}
        />
        {/*  СЛОЙ 3: Интерактивный UI */}
        <canvas
          ref={uiCanvasRef}
          style={{ width: dimensions.width, height: dimensions.height }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            setHoveredIdx(-1);
            setHoveredPrice(null);
          }}
          className="absolute top-0 left-0  cursor-crosshair z-30 pointer-events-auto"
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
