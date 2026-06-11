"use client";
import { DataPoint } from "../model/types";
import { useEffect, useRef, useState } from "react";

export default function CryptoChart({ data }: { data: DataPoint[] }) {
  //   console.log("data", data);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  //
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
  // перевод реальной цены и индекса в координаты Canvas (X и Y)
  const getCanvasX = (index: number) => {
    return padding.left + index * stepX;
  };
  const getCanvasY = (price: number) => {
    const ratio = (price - minPrice) / priceRange;
    return canvasHeight - padding.bottom - ratio * chartHeight;
  };

  // ЭФФЕКТ ОТРИСОВКИ ГРАФИКА И СЕТКИ
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ==========================================
    // ГОРИЗОНТАЛЬНАЯ СЕТКА И ШКАЛА ЦЕН (Y)
    // ==========================================
    ctx.strokeStyle = "rgba(161, 161, 170, 0.15)";
    ctx.lineWidth = 1;
    ctx.fillStyle = "currentColor";
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
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 4;
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
  }, [data]);

  return (
    <div className="relative p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl text-zinc-900 dark:text-zinc-100 flex flex-col items-center w-fulls">
      <div className="relative w-full max-w-175">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="w-full h-auto"
        ></canvas>
      </div>
    </div>
  );
}
