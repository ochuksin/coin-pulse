// app/page.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ChartPage from "./page";
import { setMockSeed } from "@/src/entities/crypto-chart";

describe("Smoke Test", () => {
  it("should pass simple math check", () => {
    expect(1 + 1).toBe(2);
  });
});

describe("ChartPage Integration Test", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.NEXT_PUBLIC_COINGECKO_API_KEY = "test_key_123";

    // Фиксируем сид для предсказуемой генерации при падении API
    setMockSeed(1337);
  });

  it("should render the chart with successful API data", async () => {
    // Жестко фиксируем массив цен CoinGecko: [timestamp, price]
    const fakeApiResponse = {
      prices: [
        [1781550000000, 67000],
        [1781557195785, 62000],
        [1781557494575, 66484.03008864018],
        [1781557798809, 66418.85362880632],
        [1781558096202, 66451.01745366756],
        [1781558399343, 66489.65484446366],
        [1781558697855, 66509.74675617156],
        [1781558996135, 66419.93155615365],
        [1781559299044, 66000],
      ],
    };

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => fakeApiResponse,
    } as Response);

    render(<ChartPage />);

    expect(screen.queryByText(/Loading/i)).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
        expect(
          screen.queryByText("$66,000") || screen.queryByText("$66 000"),
        ).toBeInTheDocument();
        expect(
          screen.queryByText("$62,000") || screen.queryByText("$62 000"),
        ).toBeInTheDocument();
        expect(
          screen.queryByText("$67,000") || screen.queryByText("$67 000"),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
    expect(
      screen.getByText((content) => content.includes("Current price")),
    ).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes("Changing trend")),
    ).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes("Max")),
    ).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes("Min")),
    ).toBeInTheDocument();
  });
});
