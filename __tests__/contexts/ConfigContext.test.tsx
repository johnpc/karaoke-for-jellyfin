import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, renderHook } from "@testing-library/react";
import { ConfigProvider, useConfig } from "@/contexts/ConfigContext";
import React from "react";

function mockFetchResponse(data: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

describe("ConfigContext", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("ConfigProvider", () => {
    it("renders children", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({
          autoplayDelay: 500,
          queueAutoplayDelay: 1000,
          controlsAutoHideDelay: 10000,
          timeUpdateInterval: 2000,
          ratingAnimationDuration: 15000,
          nextSongDuration: 15000,
        })
      );

      render(
        <ConfigProvider>
          <div data-testid="child">Hello</div>
        </ConfigProvider>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.getByTestId("child")).toHaveTextContent("Hello");
    });

    it("fetches config from /api/config on mount", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({
          autoplayDelay: 750,
          queueAutoplayDelay: 2000,
          controlsAutoHideDelay: 5000,
          timeUpdateInterval: 1000,
          ratingAnimationDuration: 10000,
          nextSongDuration: 12000,
        })
      );

      render(
        <ConfigProvider>
          <div>content</div>
        </ConfigProvider>
      );

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith("/api/config");
      });
    });

    it("provides default config values while loading", () => {
      // Never resolve fetch to keep in loading state
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));

      function ConfigReader() {
        const config = useConfig();
        return <div data-testid="config">{JSON.stringify(config)}</div>;
      }

      render(
        <ConfigProvider>
          <ConfigReader />
        </ConfigProvider>
      );

      const configEl = screen.getByTestId("config");
      const config = JSON.parse(configEl.textContent!);

      expect(config.autoplayDelay).toBe(500);
      expect(config.queueAutoplayDelay).toBe(1000);
      expect(config.controlsAutoHideDelay).toBe(10000);
      expect(config.timeUpdateInterval).toBe(2000);
      expect(config.ratingAnimationDuration).toBe(15000);
      expect(config.nextSongDuration).toBe(15000);
    });

    it("provides fetched config values after loading", async () => {
      const customConfig = {
        autoplayDelay: 1000,
        queueAutoplayDelay: 3000,
        controlsAutoHideDelay: 8000,
        timeUpdateInterval: 500,
        ratingAnimationDuration: 20000,
        nextSongDuration: 10000,
      };

      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse(customConfig)
      );

      function ConfigReader() {
        const config = useConfig();
        return <div data-testid="config">{JSON.stringify(config)}</div>;
      }

      render(
        <ConfigProvider>
          <ConfigReader />
        </ConfigProvider>
      );

      await waitFor(() => {
        const configEl = screen.getByTestId("config");
        const config = JSON.parse(configEl.textContent!);
        expect(config.autoplayDelay).toBe(1000);
        expect(config.queueAutoplayDelay).toBe(3000);
        expect(config.controlsAutoHideDelay).toBe(8000);
        expect(config.timeUpdateInterval).toBe(500);
        expect(config.ratingAnimationDuration).toBe(20000);
        expect(config.nextSongDuration).toBe(10000);
      });
    });

    it("falls back to default config on fetch error", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        Promise.reject(new Error("Network error"))
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      function ConfigReader() {
        const config = useConfig();
        return <div data-testid="config">{JSON.stringify(config)}</div>;
      }

      render(
        <ConfigProvider>
          <ConfigReader />
        </ConfigProvider>
      );

      await waitFor(() => {
        const configEl = screen.getByTestId("config");
        const config = JSON.parse(configEl.textContent!);
        expect(config.autoplayDelay).toBe(500);
        expect(config.queueAutoplayDelay).toBe(1000);
        expect(config.controlsAutoHideDelay).toBe(10000);
        expect(config.timeUpdateInterval).toBe(2000);
        expect(config.ratingAnimationDuration).toBe(15000);
        expect(config.nextSongDuration).toBe(15000);
      });

      consoleSpy.mockRestore();
    });

    it("renders multiple children", () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));

      render(
        <ConfigProvider>
          <div data-testid="first">First</div>
          <div data-testid="second">Second</div>
        </ConfigProvider>
      );

      expect(screen.getByTestId("first")).toBeInTheDocument();
      expect(screen.getByTestId("second")).toBeInTheDocument();
    });
  });

  describe("useConfig", () => {
    it("throws error when used outside ConfigProvider", () => {
      // Suppress React error boundary noise
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useConfig());
      }).toThrow("useConfig must be used within a ConfigProvider");

      consoleSpy.mockRestore();
    });

    it("returns config when used within ConfigProvider", () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));

      function wrapper({ children }: { children: React.ReactNode }) {
        return <ConfigProvider>{children}</ConfigProvider>;
      }

      const { result } = renderHook(() => useConfig(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.autoplayDelay).toBe(500);
    });

    it("returns updated config after fetch completes", async () => {
      const customConfig = {
        autoplayDelay: 200,
        queueAutoplayDelay: 500,
        controlsAutoHideDelay: 7000,
        timeUpdateInterval: 3000,
        ratingAnimationDuration: 12000,
        nextSongDuration: 8000,
      };

      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse(customConfig)
      );

      function wrapper({ children }: { children: React.ReactNode }) {
        return <ConfigProvider>{children}</ConfigProvider>;
      }

      const { result } = renderHook(() => useConfig(), { wrapper });

      await waitFor(() => {
        expect(result.current.autoplayDelay).toBe(200);
        expect(result.current.queueAutoplayDelay).toBe(500);
        expect(result.current.controlsAutoHideDelay).toBe(7000);
        expect(result.current.timeUpdateInterval).toBe(3000);
        expect(result.current.ratingAnimationDuration).toBe(12000);
        expect(result.current.nextSongDuration).toBe(8000);
      });
    });
  });
});
