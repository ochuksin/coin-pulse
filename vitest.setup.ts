import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

//снимаем ошибку канвас
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  fillText: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  arc: vi.fn(),
  closePath: vi.fn(),
})) as any;
