import { useState, useRef, useCallback, useMemo } from "react";
/**
 * Состояние масштабирования и смещения
 */
interface ZoomPanState {
  scale: number;
  offsetX: number;
}
/**
 * Опции для инициализации масштабирования и смещения
 */
interface UseZoomPanPanOptions {
  initialScale?: number;
  minScale?: number;
  maxScale?: number;
  initialOffsetX?: number;
}
/**
 * Возвращаемое состояние масштабирования и смещения
 */
interface UseZoomPanReturn {
  state: ZoomPanState;
  scale: number;
  offsetX: number;
  setScale: (val: number) => void;
  setOffsetX: (val: number) => void;
  isDragging: boolean;
  setIsDragging: (val: boolean) => void;
  dragStart: React.MutableRefObject<{ x: number; offsetX: number }>;
  resetZoom: () => void;
  clampOffsetX: (
    rawOffsetX: number,
    containerWidth: number,
    chartWidth: number,
  ) => number;
}

export const useZoomPan = (options: UseZoomPanPanOptions = {}) => {
  const {
    initialScale = 1,
    minScale = 1,
    maxScale = 8,
    initialOffsetX = 0,
  } = options;

  const [scale, setScale] = useState(initialScale);
  const [offsetX, setOffsetX] = useState(initialOffsetX);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({
    x: 0,
    offsetX: 0,
  });
  // ограничение масштаба
  const setScaleSafe = useCallback(
    (newScale: number) =>
      setScale((prev) => Math.min(Math.max(newScale, minScale), maxScale)),
    [minScale, maxScale],
  );

  /**
   * ограничение offsetX
   */
  const clampOffsetX = useCallback(
    (
      rawOffsetX: number,
      containerWidth: number,
      chartWidth: number,
    ): number => {
      const scaledWidth = chartWidth * scale;
      // Если масштаб < 1, то chartWidth < containerWidth не панорамируем
      if (scaledWidth <= containerWidth) return 0;

      const minOffset = scaledWidth - containerWidth; // при scale >= 1
      const maxOffset = 0;

      return Math.min(Math.max(rawOffsetX, minOffset), maxOffset);
    },
    [scale],
  );
  /**
   * Reset zoom/pan
   */
  const resetZoom = useCallback(() => {
    setScale(1);
    setOffsetX(0);
    setIsDragging(false);
  }, []);

  return {
    state: useMemo(() => ({ scale, offsetX }), [scale, offsetX]),
    scale,
    offsetX,
    setScale: setScaleSafe,
    setOffsetX,
    isDragging,
    setIsDragging,
    dragStart,
    resetZoom,
    clampOffsetX,
  };
};
