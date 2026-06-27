import { useState, useRef, MouseEvent, TouchEvent } from "react";
import { DataPoint } from "./types";

interface UseChartInteractiveProps {
  data: DataPoint[];
  dimensions: { width: number; height: number };
  padding: { top: number; right: number; bottom: number; left: number };
}
/**
 * Хук управления интерактивностью графика криптовалюты
 *
 * Обеспечивает взаимодействие пользователя с графиком:
 * - Масштабирование колесиком мыши и жестом pinch-to-zoom на мобильных устройствах
 * - Перемещение (pan) графика при перетаскивании
 * - Отслеживание наведения курсора и показ подсказок
 * - Адаптивные ограничения для предотвращения выхода за границы
 *
 * @param {UseChartInteractiveProps} props - Параметры хука
 * @param {DataPoint[]} props.data - Массив точек данных графика (дата, цена, метка времени)
 * @param {{ width: number, height: number }} props.dimensions - Размеры канваса
 * @param {{ top: number, right: number, bottom: number, left: number }} props.padding - Отступы вокруг графика
 * @returns {Object} Объект с состоянием и методами управления интерактивностью
 *
 * @returns {number} scale - Коэффициент масштабирования (1 = оригинальный размер)
 * @returns {number} offsetX - Горизонтальное смещение (для панорамирования)
 * @returns {boolean} isDragging - Флаг активного перетаскивания
 * @returns {number} hoveredIndex - Индекс текущей отслеживаемой точки (-1, если ни одна)
 * @returns {{x: number, y: number}} mouseCoord - Координаты мыши/курсора
 * @returns {(index: number) => number} getCanvasX - Преобразование индекса точки в X-координату канваса
 * @returns {(price: number) => number} getCanvasY - Преобразование цены в Y-координату канваса
 * @returns {number} minPrice - Минимальная цена с учетом отступов
 * @returns {number} priceRange - Разница между максимальной и минимальной ценой
 * @returns {number} chartWidth - Ширина области графика (без отступов)
 * @returns {number} chartHeight - Высота области графика (без отступов)
 * @returns {(e: MouseEvent<HTMLCanvasElement>) => void} handleMouseDown - Обработчик нажатия кнопки мыши
 * @returns {(e: MouseEvent<HTMLCanvasElement>, rect: DOMRect) => void} handleMouseMove - Обработчик движения мыши
 * @returns {() => void} handleMouseUp - Обработчик отпускания кнопки мыши
 * @returns {(e: TouchEvent<HTMLCanvasElement>, rect: DOMRect) => void} handleTouchStart - Обработчик начала касания
 * @returns {(e: TouchEvent<HTMLCanvasElement>, rect: DOMRect) => void} handleTouchMove - Обработчик движения касания
 * @returns {() => void} handleTouchEnd - Обработчик окончания касания
 * @returns {(e: WheelEvent, rect: DOMRect) => void} handleWheel - Обработчик прокрутки колесиком мыши
 *
 * @see {@link ./types.ts} - Типы данных для графика
 *
 * @remarks
 * - Поддерживает как мышь, так и сенсорные устройства
 * - Реализует защиту от выхода за границы графика
 * - Использует пиксельные координаты относительно контейнера
 * - Добавляет 5% отступов сверху и снизу для визуального комфорта
 * - Учитывает высокое разрешение экранов (Retina)
 *
 * @example
 * // Использование в компоненте
 * const {
 *   scale,
 *   getCanvasX,
 *   getCanvasY,
 *   handleMouseDown,
 *   handleMouseMove,
 *   handleTouchMove
 * } = useChartInteractive({ data, dimensions, padding });
 *
 * @version 1.0.0
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
  /**
   * Преобразование индекса точки данных в X-координату на канвасе
   * @param {number} index - Индекс точки данных в массиве
   * @returns {number} X-координата на канвасе
   */
  const getCanvasX = (index: number): number =>
    padding.left + index * stepX + offsetX;

  /**
   * Преобразование цены в Y-координату на канвасе
   * @param {number} price - Цена криптовалюты
   * @returns {number} Y-координата на канвасе
   */
  const getCanvasY = (price: number): number => {
    const ratio = (price - minPrice) / priceRange;
    return dimensions.height - padding.bottom - ratio * chartHeight;
  };

  /**
   * Ограничитель сдвига (чтобы график не улетал)
   * @param {number} newOffset - Новое значение смещения
   * @param {number} currentScale - Текущий коэффициент масштабирования
   * @param {number} currentChartWidth - Текущая ширина области графика
   * @returns {number} Ограниченное значение смещения
   */
  const clampOffset = (
    newOffset: number,
    currentScale: number,
    currentChartWidth: number,
  ) => {
    if (currentScale === 1) return 0;
    const maxOffset = 0; // Левая граница
    const minOffset = currentChartWidth - currentChartWidth * currentScale; // Правая граница

    if (newOffset > maxOffset) return maxOffset;
    if (newOffset < minOffset) return minOffset;
    return newOffset;
  };

  /**
   * Получение индекса точки данных по координате X мыши
   * @param {number} clientX - X-координата мыши в экранных координатах
   * @param {DOMRect} rect - Прямоугольник, описывающий позицию и размер канваса
   * @returns {number} Индекс ближайшей точки данных (-1, если за пределами графика)
   */
  const getPointIndexFromX = (clientX: number, rect: DOMRect): number => {
    const mouseX = clientX - rect.left;
    if (mouseX >= padding.left && mouseX <= dimensions.width - padding.right) {
      const closestIndex = Math.round(
        (mouseX - padding.left - offsetX) / stepX,
      );
      if (closestIndex >= 0 && closestIndex < data.length) return closestIndex;
    }
    return -1;
  };

  /**
   * Вычисление расстояния между двумя точками касания (для pinch-to-zoom)
   * @param {TouchEvent<HTMLCanvasElement>} e - Событие касания с двумя точками
   * @returns {number} Расстояние между точками касания
   */
  const getTouchDistance = (e: TouchEvent<HTMLCanvasElement>): number => {
    if (e.touches.length < 2) return 0;
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    if (!t1 || !t2) return 0;
    // гипотенуза
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  /**
   * Обработчик нажатия кнопки мыши для начала перетаскивания
   * @param {MouseEvent<HTMLCanvasElement>} e - Событие мыши
   */
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    if (scale === 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offsetX };
  };

  /**
   * Обработчик движения мыши для перетаскивания и показа тултипа
   * @param {MouseEvent<HTMLCanvasElement>} e - Событие движения мыши
   * @param {DOMRect} rect - Прямоугольник, описывающий позицию и размер канваса
   */
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>, rect: DOMRect) => {
    if (isDragging) {
      const calculatedOffset = e.clientX - dragStart.current.x;
      setOffsetX(clampOffset(calculatedOffset, scale, chartWidth));
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

  /**
   * Обработчик отпускания кнопки мыши
   */
  const handleMouseUp = () => setIsDragging(false);

  /**
   * Обработчик начала касания (для сенсорных устройств)
   * @param {TouchEvent<HTMLCanvasElement>} e - Событие касания
   * @param {DOMRect} rect - Прямоугольник, описывающий позицию и размер канваса
   */
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
      // Фиксируем стартовую позицию
      dragStart.current = { x: e.touches[0].clientX - offsetX };
      const idx = getPointIndexFromX(e.touches[0].clientX, rect);
      if (idx !== -1) {
        setHoveredIndex(idx);
        setMouseCoord({ x: getCanvasX(idx), y: getCanvasY(data[idx].price) });
      }
    }
  };

  /**
   * Обработчик движения касания (для сенсорных устройств)
   * Поддерживает как pinch-to-zoom, так и перетаскивание одним пальцем
   * @param {TouchEvent<HTMLCanvasElement>} e - Событие движения касания
   * @param {DOMRect} rect - Прямоугольник, описывающий позицию и размер канваса
   */
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
      setOffsetX(clampOffset(newOffsetX, newScale, chartWidth)); //  Ограничиваем
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

        const calculatedOffset = touch.clientX - dragStart.current.x;
        setOffsetX(clampOffset(calculatedOffset, scale, chartWidth));
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

  /**
   * Обработчик окончания касания
   */
  const handleTouchEnd = () => {
    setIsDragging(false);
    initialTouchDistance.current = 0;
  };
  /**
   * Обработчик прокрутки колесиком мыши для масштабирования
   * @param {WheelEvent} e - Событие прокрутки колесика мыши
   * @param {DOMRect} rect - Прямоугольник, описывающий позицию и размер канваса
   */
  const handleWheel = (e: globalThis.WheelEvent, rect: DOMRect) => {
    e.preventDefault();
    const mouseX = e.clientX - rect.left - padding.left;
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.max(1, Math.min(8, scale * zoomFactor));
    const newOffsetX = mouseX - (mouseX - offsetX) * (newScale / scale);

    // Ограничиваем, используя clampOffset
    setScale(newScale);
    setOffsetX(clampOffset(newOffsetX, newScale, chartWidth));
    setHoveredIndex(-1);
  };
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
    handleWheel,
  };
};
