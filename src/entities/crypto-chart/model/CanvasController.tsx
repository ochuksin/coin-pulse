"use client";

import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { DataPoint } from "./types";
import { useChartGeometry } from "../";

interface CanvasControllerProps {
  data: DataPoint[];
  dimensions: { width: number; height: number };
  padding: { top: number; right: number; bottom: number; left: number };
  scale: number;
  offsetX: number;
  hoveredIndex: number;
  themeTick: number;
  // Events
  onWheel?: (e: React.WheelEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseUp?: () => void;
  onMouseLeave?: () => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  // onHover?: (x: number, y: number, price: number) => void;
}

export interface CanvasControllerRef {
  scrollToIndex: (index: number) => void;
}

export const CanvasController = forwardRef<
  CanvasControllerRef,
  CanvasControllerProps
>(
  (
    {
      data,
      dimensions,
      padding,
      scale,
      offsetX,
      hoveredIndex,
      themeTick,
      onWheel,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
      onTouchMove,
    },
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const {
      chartWidth,
      chartHeight,
      minPrice,
      maxPrice,
      priceRange,
      getCanvasX,
      getCanvasY,
    } = useChartGeometry(data, dimensions, padding, scale, offsetX);

    // === Hover detection (внутри CanvasController) ===
    const [localHoveredIndex, setLocalHoveredIndex] = React.useState(-1);

    useEffect(() => {
      setLocalHoveredIndex(hoveredIndex);
    }, [localHoveredIndex]);
    // expose some imperative API
    useImperativeHandle(ref, () => ({
      scrollToIndex: (index: number) => {
        console.log(`canvas.scrollToIndex(${index}) not implemented yet`);
      },
    }));

    // Attach canvas events
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const handleWheel = (e: WheelEvent) => onWheel?.(e as any);
      const handleMouseDown = (e: MouseEvent) => onMouseDown?.(e as any);
      const handleMouseMove = (e: MouseEvent) => onMouseMove?.(e as any);
      const handleMouseUp = () => onMouseUp?.();
      const handleMouseLeave = () => onMouseLeave?.();
      const handleTouchMove = (e: TouchEvent) => onTouchMove?.(e as any);

      canvas.addEventListener("wheel", handleWheel, { passive: false });
      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      canvas.addEventListener("mouseleave", handleMouseLeave);
      canvas.addEventListener("touchmove", handleTouchMove, { passive: false });

      return () => {
        canvas.removeEventListener("wheel", handleWheel);
        canvas.removeEventListener("mousedown", handleMouseDown);
        canvas.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
        canvas.removeEventListener("touchmove", handleTouchMove);
      };
    }, [onWheel, onMouseDown, onMouseUp, onMouseLeave, onTouchMove]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Retina-оптимизация
      const dpr = window.devicePixelRatio || 1;
      canvas.width = dimensions.width * dpr;
      canvas.height = dimensions.height * dpr;
      ctx.scale(dpr, dpr);

      const isDarkMode = document.documentElement.classList.contains("dark");

      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Клип для графика
      ctx.save();
      ctx.beginPath();
      ctx.rect(padding.left, padding.top, chartWidth, chartHeight);
      ctx.clip();

      // Линия графика
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
      ctx.lineWidth = dimensions.width < 500 ? 2 : 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      // Градиент
      const gradient = ctx.createLinearGradient(
        0,
        padding.top,
        0,
        dimensions.height - padding.bottom,
      );
      gradient.addColorStop(0, "rgba(59, 130, 246, 0.25)");
      gradient.addColorStop(1, "rgba(59, 130, 246, 0)");
      ctx.lineTo(
        getCanvasX(data.length - 1),
        dimensions.height - padding.bottom,
      );
      ctx.lineTo(getCanvasX(0), dimensions.height - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();

      // Сетка и подписи
      ctx.save();
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = isDarkMode
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(161, 161, 170, 0.15)";
      ctx.fillStyle = isDarkMode ? "#e4e4e7" : "#71717a";
      ctx.font = "11px monospace";

      const gridLinesCount = 4;
      for (let i = 0; i <= gridLinesCount; i++) {
        const currentPrice = minPrice + (priceRange / gridLinesCount) * i;
        const y = getCanvasY(currentPrice);

        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();

        ctx.fillText(
          `$${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
          padding.left - 10,
          y,
        );
      }

      // Временные метки
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const maxLabels = dimensions.width < 500 ? 3 : 6;
      const labelInterval = Math.ceil(data.length / maxLabels) || 1;

      for (let i = 0; i < data.length; i += labelInterval) {
        const point = data[i];
        const x = getCanvasX(i);
        const label = point.timeLabel || point.date;
        ctx.fillText(label, x, dimensions.height - padding.bottom + 10);
        if (i === data.length - 1) break;
      }

      // Индикатор hoveredIndex
      if (hoveredIndex >= 0 && hoveredIndex < data.length) {
        const activePoint = data[hoveredIndex];
        const targetX = getCanvasX(hoveredIndex);
        const targetY = getCanvasY(activePoint.price);

        ctx.strokeStyle = isDarkMode
          ? "rgba(59, 130, 246, 0.5)"
          : "rgba(59, 130, 246, 0.25)";
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(targetX, padding.top);
        ctx.lineTo(targetX, dimensions.height - padding.bottom);
        ctx.stroke();
        ctx.setLineDash([]);

        // Точка на линии
        ctx.beginPath();
        ctx.arc(targetX, targetY, 5, 0, Math.PI * 2);
        ctx.fillStyle = isDarkMode ? "#60a5fa" : "#3b82f6";
        ctx.fill();
        ctx.strokeStyle = isDarkMode ? "#0a0a0a" : "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();
    }, [
      data,
      localHoveredIndex,
      themeTick,
      dimensions,
      padding,
      scale,
      offsetX,
      chartWidth,
      chartHeight,
      getCanvasX,
      getCanvasY,
      minPrice,
      maxPrice,
      priceRange,
    ]);

    return (
      <canvas
        ref={canvasRef}
        className={`w-full h-auto block ${scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"} touch-none`}
        // onMouseMove={(e) => {
        //   console.log(e.clientX, canvasRef.current?.width);
        // }}
      />
    );
  },
);

CanvasController.displayName = "CanvasController";
