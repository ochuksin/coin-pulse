"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useZoomPan } from "../";
import { useDebounceCallback } from "usehooks-ts";
import { DataPoint } from "../model/types";
import { CanvasController } from "../";
import { useChartGeometry } from "../";

export default function CryptoChart({ data }: { data: DataPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasControllerRef = useRef(null);

  const [dimensions, setDimensions] = useState({ width: 700, height: 350 });
  const padding = { top: 40, right: 20, bottom: 40, left: 70 };

  const chartWidth = dimensions.width - padding.left - padding.right;

  const {
    state: { scale, offsetX },
    setScale,
    setOffsetX,
    isDragging,
    setIsDragging,
    dragStart,
    clampOffsetX,
  } = useZoomPan({ initialScale: 1, minScale: 1, maxScale: 8 });

  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [themeTick, setThemeTick] = useState(0);

  // Общая геометрия для всех компонентов
  const geometry = useChartGeometry(data, dimensions, padding, scale, offsetX);

  const tooltipData = geometry.getTooltipPos(hoveredIndex);
  // console.log("tooltipData: ", tooltipData);

  // Вычисляем DOM-координаты tooltip
  const tooltipPos = useMemo(() => {
    if (!tooltipData || !containerRef.current) return null;

    const containerRect = containerRef.current.getBoundingClientRect();
    return {
      x: containerRect.left + tooltipData.x,
      y: containerRect.top + tooltipData.y,
      price: tooltipData.price,
    };
  }, [tooltipData, containerRef]);

  // Theme toggle
  useEffect(() => {
    const handleToggleTheme = () => setThemeTick((t) => t + 1);
    window.addEventListener("themechange", handleToggleTheme);
    return () => window.removeEventListener("themechange", handleToggleTheme);
  }, []);

  // ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const computedHeight = Math.max(250, width * 0.5);
        setDimensions({ width, height: computedHeight });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // ✅ Ограничение границ (только при изменении scale/dimensions)
  useEffect(() => {
    const boundedOffsetX = clampOffsetX(offsetX, dimensions.width, chartWidth);
    if (boundedOffsetX !== offsetX) {
      setOffsetX(boundedOffsetX);
    }
  }, [scale, dimensions.width, chartWidth, offsetX, clampOffsetX, setOffsetX]);

  const updateHoveredIndex = useCallback(
    (clientX: number, rect: DOMRect): number => {
      const mouseX = clientX - rect.left;
      if (mouseX < padding.left || mouseX > dimensions.width - padding.right)
        return -1;

      const effectiveX = mouseX - padding.left - offsetX;
      const stepX = geometry.chartWidth / (data.length - 1 || 1);
      const index = Math.round(effectiveX / (stepX * scale));

      if (index >= 0 && index < data.length) {
        setHoveredIndex(index);
        return index;
      }

      setHoveredIndex(-1);
      return -1;
    },
    [
      dimensions.width,
      offsetX,
      scale,
      data.length,
      geometry.chartWidth,
      padding,
    ],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      if (isDragging) {
        const newOffsetX = e.clientX - dragStart.current.x;
        setOffsetX(newOffsetX);
        setHoveredIndex(-1);
      } else {
        updateHoveredIndex(e.clientX, rect);
      }
    },
    [isDragging, dragStart, setOffsetX, updateHoveredIndex],
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (e.cancelable) e.preventDefault();

      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;

      const scaleRatio = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.max(1, Math.min(scale * scaleRatio, 8));

      // Zoom-to-cursor
      const relativeX = mouseX - offsetX;
      const newOffsetX = offsetX - relativeX * (scaleRatio - 1);

      const boundedOffsetX = clampOffsetX(
        newOffsetX,
        dimensions.width,
        geometry.chartWidth,
      );

      setScale(newScale);
      setOffsetX(boundedOffsetX);
    },
    [
      scale,
      offsetX,
      setScale,
      setOffsetX,
      dimensions.width,
      geometry.chartWidth,
      clampOffsetX,
    ],
  );

  // Drag handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale === 1) return;
      setIsDragging(true);
      dragStart.current = { x: e.clientX, offsetX };
    },
    [scale, offsetX, setIsDragging],
  );

  const handleMouseUp = useCallback(
    () => setIsDragging(false),
    [setIsDragging],
  );
  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    setHoveredIndex(-1);
  }, [setIsDragging, setHoveredIndex]);

  const debouncedWheel = useDebounceCallback(handleWheel, 16, { maxWait: 66 });
  // Touch support
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!containerRef.current || e.touches.length === 0) return;
      if (e.cancelable) e.preventDefault();

      const rect = containerRef.current.getBoundingClientRect();
      const touch = e.touches[0];

      if (isDragging) {
        const newOffsetX = touch.clientX - dragStart.current.x;
        setOffsetX(newOffsetX);
      } else {
        updateHoveredIndex(touch.clientX, rect);
      }
    },
    [isDragging, dragStart, setOffsetX, updateHoveredIndex],
  );
  // Debounced handlers
  const debouncedMouseMove = useDebounceCallback(
    handleMouseMove,
    16, // ~60fps
    { maxWait: 66 },
  );
  const debouncedTouchMove = useDebounceCallback(handleTouchMove, 16, {
    maxWait: 66,
  });

  const handleWheelWrapper = useCallback(
    (e: React.WheelEvent) => debouncedWheel(e as unknown as WheelEvent),
    [debouncedWheel],
  );

  return (
    <div
      ref={containerRef}
      className="relative p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl text-zinc-900 dark:text-zinc-100 flex flex-col items-center w-full"
    >
      <div className="relative w-full overflow-hidden select-none">
        <CanvasController
          ref={canvasControllerRef}
          data={data}
          dimensions={dimensions}
          padding={padding}
          scale={scale}
          offsetX={offsetX}
          hoveredIndex={hoveredIndex}
          themeTick={themeTick}
          onWheel={handleWheelWrapper}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          // onHover={handleCanvasHover}
        />

        {/* TOOLTIP */}
        {tooltipPos && (
          <div
            style={{
              position: "absolute",
              left:
                tooltipPos.x -
                  containerRef.current!.getBoundingClientRect().left +
                  15 >
                dimensions.width - 130
                  ? tooltipPos.x -
                    containerRef.current!.getBoundingClientRect().left -
                    135
                  : tooltipPos.x -
                    containerRef.current!.getBoundingClientRect().left +
                    15,
              top:
                tooltipPos.y -
                  containerRef.current!.getBoundingClientRect().top -
                  40 <
                10
                  ? tooltipPos.y -
                    containerRef.current!.getBoundingClientRect().top +
                    15
                  : tooltipPos.y -
                    containerRef.current!.getBoundingClientRect().top -
                    40,
              pointerEvents: "none",
            }}
            className="z-30 bg-zinc-900/90 dark:bg-zinc-950/95 text-white px-2 py-0.5 rounded-xl shadow-xl border border-zinc-700/50 backdrop-blur text-xs font-mono space-y-0.5 min-w-[120px]"
          >
            <p className="text-zinc-400 font-sans">
              {data[hoveredIndex].timeLabel || data[hoveredIndex].date}
            </p>
            <p className="text-sm font-bold text-blue-400">
              ${data[hoveredIndex].price.toLocaleString()}
            </p>
          </div>
        )}

        {/* INSTRUCTIONS */}
        <div className="flex justify-center text-xs text-zinc-500 dark:text-zinc-400 select-none pointer-events-none">
          Scroll to Zoom • Drag to Pan • Hover to Inspect
        </div>
      </div>
    </div>
  );
}
