import { useState, useRef, useEffect, MouseEvent, TouchEvent } from "react";
import { DataPoint } from "./types";

interface UseChartInteractiveProps {
  data: DataPoint[];
  dimensions: { width: number; height: number };
  padding: { top: number; right: number; bottom: number; left: number };
}
/**
 * Вешаем все обытия, получаем координаты
 * @param { data,  dimensions,  padding,} даные для графика и геометрия с отступами
 * @returns
 */
export const useChartInteractive = ({
  data,
  dimensions,
  padding,
}: UseChartInteractiveProps) => {
  const [scale, setScale] = useState<number>(1);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);
  const [mouseCoord, setMouseCoord] = useState({ x: 0, y: 0 });

  const dragStart = useRef<{ x: number }>({ x: 0 });

  // PINCH-TO-ZOOM
  const initialTouchDistance = useRef<number>(0);
  const initialScale = useRef<number>(1);

  const chartWidth = dimensions.width - padding.left - padding.right;
  const chartHeight = dimensions.height - padding.top - padding.bottom;

  const prices = data.map((d) => d.price);
  const realMaxPrice = Math.max(...prices, 1);
  const realMinPrice = Math.min(...prices);
  const realRange = realMaxPrice - realMinPrice || 1;

  // 5% отсткп вверху и внизу, чтобы не упирался
  const paddingPercent = 0.05;
  const maxPrice = realMaxPrice + realRange * paddingPercent;
  const minPrice = Math.max(0, realMinPrice - realRange * paddingPercent);
  const priceRange = maxPrice - minPrice || 1;

  const baseStepX = chartWidth / (data.length - 1 || 1);
  const stepX = baseStepX * scale;

  // Формулы координат
  const getCanvasX = (index: number) => padding.left + index * stepX + offsetX;
  const getCanvasY = (price: number) => {
    const ratio = (price - minPrice) / priceRange;
    return dimensions.height - padding.bottom - ratio * chartHeight;
  };

  // Ограничитель сдвига (чтобы график не улетал)
  useEffect(() => {
    const maxOffset = 0;
    const minOffset = chartWidth - chartWidth * scale;
    if (offsetX > maxOffset) setOffsetX(maxOffset);
    if (offsetX < minOffset && scale > 1) setOffsetX(minOffset);
    if (scale === 1) setOffsetX(0);
  }, [offsetX, scale, chartWidth]);

  const getPointIndexFromX = (clientX: number, rect: DOMRect) => {
    const mouseX = clientX - rect.left;
    if (mouseX >= padding.left && mouseX <= dimensions.width - padding.right) {
      const closestIndex = Math.round(
        (mouseX - padding.left - offsetX) / stepX,
      );
      if (closestIndex >= 0 && closestIndex < data.length) return closestIndex;
    }
    return -1;
  };

  //  Вычисление расстояния между двумя точками тача (Теорема Пифагора)
  const getTouchDistance = (e: TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length < 2) return 0;
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    if (!t1 || !t2) return 0;
    // гипотенуза
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  // Обработчики мыши
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    if (scale === 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offsetX };
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>, rect: DOMRect) => {
    if (isDragging) {
      setOffsetX(e.clientX - dragStart.current.x);
      setHoveredIndex(-1);
    } else {
      const idx = getPointIndexFromX(e.clientX, rect);
      if (idx !== -1) {
        setHoveredIndex(idx);
        setMouseCoord({ x: getCanvasX(idx), y: getCanvasY(data[idx].price) });
      } else {
        setHoveredIndex(-1);
      }
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  //Touch events
  const handleTouchStart = (
    e: TouchEvent<HTMLCanvasElement>,
    rect: DOMRect,
  ) => {
    if (e.touches.length === 2) {
      // Инициализация зума двумя пальцами
      initialTouchDistance.current = getTouchDistance(e);
      initialScale.current = scale;
      setIsDragging(false);
      setHoveredIndex(-1);
    } else if (e.touches.length === 1 && scale > 1) {
      // сначала показываем тултип
      setIsDragging(false);
      dragStart.current = { x: e.touches[0].clientX - offsetX };
      const idx = getPointIndexFromX(e.touches[0].clientX, rect);
      if (idx !== -1) {
        setHoveredIndex(idx);
        setMouseCoord({ x: getCanvasX(idx), y: getCanvasY(data[idx].price) });
      }
      // // Перетаскивание одним пальцем, если график с зумом
      // setIsDragging(true);
      // dragStart.current = { x: e.touches[0].clientX - offsetX };
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLCanvasElement>, rect: DOMRect) => {
    if (e.cancelable) e.preventDefault();

    if (e.touches.length === 2 && initialTouchDistance.current !== 0) {
      const currentDist = getTouchDistance(e);
      if (currentDist === 0) return;

      const factor = currentDist / initialTouchDistance.current;
      const newScale = Math.max(1, Math.min(8, initialScale.current * factor));

      // Центрируем зум между двумя пальцами
      const touchMidX =
        (e.touches[0].clientX + e.touches[1].clientX) / 2 -
        rect.left -
        padding.left;
      const newOffsetX = touchMidX - (touchMidX - offsetX) * (newScale / scale);

      setScale(newScale);
      setOffsetX(newOffsetX);
      setHoveredIndex(-1); // скрываем тултип при зуме
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      // насколько далеко палец ушел от точки старта
      const currentX = touch.clientX;
      const deltaX = Math.abs(currentX - (dragStart.current.x + offsetX));

      // Если график с зумом и движение пальцем дальше 10 пикселей - пан, иначе - трекинг тултипа
      if (scale > 1 && deltaX > 10) {
        setIsDragging(true);
      }

      // Перетаскивание одним пальцем, если график с зумом
      if (scale > 1 && isDragging) {
        // Pan
        setOffsetX(touch.clientX - dragStart.current.x);
        setHoveredIndex(-1);
      } else {
        const idx = getPointIndexFromX(touch.clientX, rect);
        if (idx !== -1) {
          setHoveredIndex(idx);
          setMouseCoord({ x: getCanvasX(idx), y: getCanvasY(data[idx].price) });
        } else {
          setHoveredIndex(-1);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    initialTouchDistance.current = 0;
    // setHoveredIndex(-1);
  };
  //
  return {
    scale,
    setScale,
    offsetX,
    setOffsetX,
    isDragging,
    setIsDragging,
    hoveredIndex,
    setHoveredIndex,
    mouseCoord,
    getCanvasX,
    getCanvasY,
    minPrice,
    priceRange,
    chartWidth,
    chartHeight,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};
