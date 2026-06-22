import { useMemo, useCallback } from "react";
import { DataPoint } from "./types";

export const useChartGeometry = (
  data: DataPoint[],
  dimensions: { width: number; height: number },
  padding: { top: number; right: number; bottom: number; left: number },
  scale: number,
  offsetX: number,
) => {
  const chartWidth = useMemo(
    () => dimensions.width - padding.left - padding.right,
    [dimensions.width, padding],
  );

  const chartHeight = useMemo(
    () => dimensions.height - padding.top - padding.bottom,
    [dimensions.height, padding],
  );

  const prices = useMemo(() => data.map((d) => d.price), [data]);

  const minPrice = useMemo(() => {
    if (prices.length === 0) return 0;
    const min = Math.min(...prices);
    return Number.isFinite(min) ? min : 0;
  }, [prices]);

  const maxPrice = useMemo(() => {
    if (prices.length === 0) return 0;
    const max = Math.max(...prices);
    return Number.isFinite(max) ? max : 0;
  }, [prices]);

  const priceRange = useMemo(
    () => (maxPrice > minPrice ? maxPrice - minPrice : 1),
    [maxPrice, minPrice],
  );

  const baseStepX = useMemo(
    () => (data.length > 1 ? chartWidth / (data.length - 1) : chartWidth),
    [chartWidth, data.length],
  );

  const getCanvasX = useCallback(
    (index: number): number => {
      return padding.left + offsetX + index * (baseStepX * scale);
    },
    [offsetX, baseStepX, scale, padding.left],
  );

  const getCanvasY = useCallback(
    (price: number): number => {
      const ratio = (price - minPrice) / priceRange;
      return dimensions.height - padding.bottom - ratio * chartHeight;
    },
    [minPrice, priceRange, chartHeight, dimensions, padding],
  );

  const getTooltipPos = useCallback(
    (index: number) => {
      if (index < 0 || index >= data.length) return null;
      const price = data[index].price;
      return { x: getCanvasX(index), y: getCanvasY(price), price };
    },
    [data, getCanvasX, getCanvasY],
  );

  return {
    chartWidth,
    chartHeight,
    minPrice,
    maxPrice,
    priceRange,
    getCanvasX,
    getCanvasY,
    getTooltipPos,
  };
};
