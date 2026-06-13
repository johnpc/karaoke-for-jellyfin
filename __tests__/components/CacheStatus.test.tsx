import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CacheStatus } from "@/components/CacheStatus";

const mockUseServiceWorker = {
  isSupported: true,
  isRegistered: true,
  isUpdateAvailable: false,
  isUpdating: false,
  registration: null,
  waitingWorker: null,
  updateServiceWorker: vi.fn(),
  clearCache: vi.fn().mockResolvedValue(true),
  getCacheInfo: vi.fn().mockResolvedValue({ "runtime-cache": 5, precache: 10 }),
  forceRefresh: vi.fn(),
};

vi.mock("@/hooks/useServiceWorker", () => ({
  useServiceWorker: () => mockUseServiceWorker,
}));

describe("CacheStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseServiceWorker.isSupported = true;
    mockUseServiceWorker.isUpdateAvailable = false;
    mockUseServiceWorker.isUpdating = false;
    mockUseServiceWorker.clearCache.mockResolvedValue(true);
    mockUseServiceWorker.getCacheInfo.mockResolvedValue({
      "runtime-cache": 5,
      precache: 10,
    });
  });

  it("renders nothing when service workers are not supported", () => {
    mockUseServiceWorker.isSupported = false;
    const { container } = render(<CacheStatus />);
    expect(container.firstChild).toBeNull();
  });

  it("renders cache status component when supported", () => {
    render(<CacheStatus />);
    expect(screen.getByTestId("cache-status")).toBeInTheDocument();
  });

  it("displays 'Cache Status' heading", () => {
    render(<CacheStatus />);
    expect(screen.getByText("Cache Status")).toBeInTheDocument();
  });

  it("displays cached items count", async () => {
    render(<CacheStatus />);
    await waitFor(() => {
      expect(screen.getByTestId("cache-stats")).toBeInTheDocument();
    });
  });

  it("shows update available banner when update exists", () => {
    mockUseServiceWorker.isUpdateAvailable = true;
    render(<CacheStatus />);
    expect(screen.getByText("App update available")).toBeInTheDocument();
    expect(screen.getByText("Update Available")).toBeInTheDocument();
  });

  it("renders Quick Clear button", () => {
    render(<CacheStatus />);
    expect(screen.getByTestId("clear-cache-button")).toBeInTheDocument();
    expect(screen.getByText("Quick Clear")).toBeInTheDocument();
  });

  it("renders Full Clear button", () => {
    render(<CacheStatus />);
    expect(screen.getByText("Full Clear")).toBeInTheDocument();
  });

  it("calls clearCache when Quick Clear is clicked", async () => {
    render(<CacheStatus />);
    fireEvent.click(screen.getByTestId("clear-cache-button"));

    await waitFor(() => {
      expect(mockUseServiceWorker.clearCache).toHaveBeenCalled();
    });
  });

  it("calls updateServiceWorker when Update button is clicked", () => {
    mockUseServiceWorker.isUpdateAvailable = true;
    render(<CacheStatus />);
    fireEvent.click(screen.getByText("Update"));
    expect(mockUseServiceWorker.updateServiceWorker).toHaveBeenCalled();
  });

  it("shows cache details when showDetails is true", async () => {
    render(<CacheStatus showDetails={true} />);
    await waitFor(() => {
      expect(screen.getByText("runtime-cache")).toBeInTheDocument();
      expect(screen.getByText("precache")).toBeInTheDocument();
    });
  });
});
