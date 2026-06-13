import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PWAInstaller } from "@/components/PWAInstaller";

describe("PWAInstaller", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock matchMedia for standalone check
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Mock navigator.serviceWorker
    Object.defineProperty(navigator, "serviceWorker", {
      writable: true,
      value: {
        register: vi.fn().mockResolvedValue({
          installing: null,
          waiting: null,
          addEventListener: vi.fn(),
          update: vi.fn(),
        }),
        controller: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
  });

  it("renders nothing by default (no install/update prompt)", () => {
    const { container } = render(<PWAInstaller />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when app is already installed", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(display-mode: standalone)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { container } = render(<PWAInstaller />);
    expect(container.firstChild).toBeNull();
  });

  it("does not crash when serviceWorker is not available", () => {
    Object.defineProperty(navigator, "serviceWorker", {
      writable: true,
      value: undefined,
    });

    const { container } = render(<PWAInstaller />);
    expect(container.firstChild).toBeNull();
  });
});
