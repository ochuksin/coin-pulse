import generateMockCryptoData from "./generateMockCryptoData";
import { describe, it, vi, expect, beforeEach } from "vitest";
describe("generateMockCryptoData", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T00:00:00Z"));
  });
  it("should to return the corect number of points: 1 day -  5 minute intervale", () => {
    const mockData = generateMockCryptoData(1);
    expect(mockData).toHaveLength(288);
    // 1*24*60/5=288
  });
  it("should to return the corect number of points: 30 days - daily data", () => {
    const mockData = generateMockCryptoData(30);
    expect(mockData).toHaveLength(720);
    // 30*24=720
  });
  it("should reset incorrect input days to 1 day ", () => {
    const mockData = generateMockCryptoData(0);
    expect(mockData).toHaveLength(288);
  });

  it("each point should contain a valid data structure", () => {
    const mockData = generateMockCryptoData(30);
    const firstPoint = mockData[0];
    expect(firstPoint).toHaveProperty("date");
    expect(firstPoint).toHaveProperty("price");
    expect(firstPoint).toHaveProperty("timeLabel");
    expect(typeof firstPoint.price).toBe("number");
  });
});
