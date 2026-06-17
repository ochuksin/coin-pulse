"use client";
import { DataPoint } from "../model/types";
import { useEffect, useRef, useState } from "react";
/**
 *
 * @param { data: DataPoint[] } - точки графика - данные монеты: дата, цена, время (для 1 дня)
 * @returns
 */
export default function CryptoChart({ data }: { data: DataPoint[] }) {
  //   console.log("data", data);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  //
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1); //мышь вне графика
  const [mouseCoord, setMouseCoord] = useState({ x: 0, y: 0 });
  const [themeTick, setThemeTick] = useState(0);

  const padding = { top: 40, right: 20, bottom: 40, left: 70 };
  // Геометрия холста
  const canvasWidth = 700;
  const canvasHeight = 350;
  // Размеры и отступы внутри Canvas
  const chartWidth = canvasWidth - padding.left - padding.right;
  const chartHeight = canvasHeight - padding.top - padding.bottom;
  // Масштабирование цен
  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  // Шаг по горизонтали между точками дня
  const stepX = chartWidth / (data.length - 1);

  /**
   *  Вычисляет горизонтальную координату X на Canvas для точки с заданным индексом - перевод реальной цены и индекса в координаты Canvas (X и Y).
   * @param {number} index - Индекс точки в массиве данных.
   * @returns {number} Координата X в пикселях с учетом левого отступа (padding.left).
   */
  const getCanvasX = (index: number): number => {
    return padding.left + index * stepX;
  };

  /**
   * Вычисляет вертикальную координату Y на Canvas на основе цены, динамически масштабируя её в диапазон графика.
   * Применяет инверсию осей (0 пикселей находится вверху холста).
   * @param {number} price - стоимость монеты.
   * @returns {number} Координата Y в пикселях с учетом верхнего и нижнего отступов.
   */
  const getCanvasY = (price: number): number => {
    const ratio = (price - minPrice) / priceRange;
    return canvasHeight - padding.bottom - ratio * chartHeight;
  };

  // ThemeToggle
  useEffect(() => {
    const handleToggleTheme = () => setThemeTick((prev) => prev + 1);
    window.addEventListener("themechange", handleToggleTheme);
    return () => window.removeEventListener("themechange", handleToggleTheme);
  }, []);

  // ЭФФЕКТ ОТРИСОВКИ ГРАФИКА И СЕТКИ
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const isDarkMode = document.documentElement.classList.contains("dark");
    console.log("isDarkMode:", isDarkMode);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ==========================================
    // ГОРИЗОНТАЛЬНАЯ СЕТКА И ШКАЛА ЦЕН (Y)
    // ==========================================
    ctx.strokeStyle = isDarkMode
      ? "rgba(255, 255, 255, 0.08)"
      : "rgba(161, 161, 170, 0.15)";
    ctx.lineWidth = 1;
    ctx.fillStyle = isDarkMode ? "#e4e4e7" : "#71717a"; //"currentColor";
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const gridLinesCount = 4;
    for (let i = 0; i <= gridLinesCount; i++) {
      const currentPrice = minPrice + (priceRange / gridLinesCount) * i;
      const y = getCanvasY(currentPrice);
      // Рисуем горизонтальную линию сетки
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(canvas.width - padding.right, y);
      ctx.stroke();
      // Пишем цену слева от сетки ($)
      ctx.fillText(`$${currentPrice.toLocaleString()}`, padding.left - 10, y);
    }
    // ==========================================
    // ВЕРТИКАЛЬНАЯ ШКАЛА ВРЕМЕНИ / ДАТ (X)
    // ==========================================
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    // Вычисляем шаг шага подписей, чтобы текст не слипался (для 288 или 720 точек)
    const labelInterval = Math.ceil(data.length / 6);

    data.forEach((point, index) => {
      if (index % labelInterval === 0 || index === data.length - 1) {
        const x = getCanvasX(index);

        const label = point.timeLabel || point.date;

        ctx.fillText(label, x, canvas.height - padding.bottom + 10);
      }
    });
    // ==========================================
    // РЕНДЕРИМ ЛИНИЮ ГРАФИКА
    // ========================================
    ctx.beginPath();
    data.forEach((point, index) => {
      const x = getCanvasX(index);
      const y = getCanvasY(point.price);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.strokeStyle = isDarkMode ? "#60a5fa" : "#3b82f6";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    // ==========================================
    // ЗАЛИВКА ГРАДИЕНТОМ ПОД ЛИНИЕМ
    // ==========================================
    // вертикальный градиент
    const gradient = ctx.createLinearGradient(
      0,
      padding.top,
      0,
      canvas.height - padding.bottom,
    );
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.25)");
    gradient.addColorStop(1, "rgba(59, 130, 246, 0)");

    // Замыкаем контур графика до нижней оси, чтобы залить градиентом
    ctx.lineTo(getCanvasX(data.length - 1), canvas.height - padding.bottom);
    ctx.lineTo(getCanvasX(0), canvas.height - padding.bottom);
    ctx.closePath();

    ctx.fillStyle = gradient;
    ctx.fill();
    // ==========================================
    // TOOLTIP
    // ==========================================
    if (hoveredIndex > 0 && hoveredIndex < data.length) {
      const activePoint = data[hoveredIndex];
      const targetX = getCanvasX(hoveredIndex);
      const targetY = getCanvasY(activePoint.price);

      //  Рисуем вертикальный пунктир-сканер
      ctx.strokeStyle = isDarkMode
        ? "rgba(59, 130, 246, 0.5)"
        : "rgba(59, 130, 246, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(targetX, padding.top);
      ctx.lineTo(targetX, canvas.height - padding.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Рисуем светящуюся точку-прицел на самой синей линии
      ctx.beginPath();
      ctx.arc(targetX, targetY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#3b82f6";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [data, hoveredIndex, themeTick]);
  // ФУНКЦИЯ РАСЧЕТА НАВЕДЕНИЯ МЫШИ
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Получаем реальные координаты мыши внутри Canvas
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    // console.log(mouseX, mouseY);

    //  мышь в зоне самого графика?
    if (mouseX >= padding.left && mouseX <= canvas.width - padding.right) {
      const relativeX = Math.floor(mouseX - padding.left);
      const relativeY = Math.floor(mouseY - padding.top);
      const exactIndex = Math.floor(relativeX / stepX);
      const closestIndex = Math.round(exactIndex);
      if (closestIndex >= 0 && closestIndex < data.length) {
        setHoveredIndex(closestIndex);
        setMouseCoord({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    } else {
      setHoveredIndex(-1); // Мышь ушла за пределы графика
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(-1);
  };
  return (
    <div className="relative p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl text-zinc-900 dark:text-zinc-100 flex flex-col items-center w-fulls">
      <div className="relative w-full max-w-175">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-auto block cursor-crosshair"
        ></canvas>
        {/* ==========================================
                TOOLTIP 
           ========================================== */}
        {hoveredIndex >= 0 && data[hoveredIndex] && (
          <div
            style={{
              position: "absolute",
              left: mouseCoord.x + 15,
              top: mouseCoord.y - 40,
              pointerEvents: "none",
            }}
            className="z-30 bg-zinc-900/90 dark:bg-zinc-950/95 text-white px-2 py-0.5 rounded-xl shadow-xl border border-zinc-700/50 backdrop-blur-xs text-xs font-mono space-y-0.5 min-w-30"
          >
            <p className="text-zinc-400 font-sans">
              {data[hoveredIndex].timeLabel || data[hoveredIndex].date}
            </p>
            <p className="text-sm font-bold text-blue-400">
              ${data[hoveredIndex].price.toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
