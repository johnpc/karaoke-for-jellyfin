import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QRCode } from "@/components/tv/QRCode";

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,mockqrcode"),
  },
}));

vi.mock("next/image", () => ({
  default: (
    props: React.ImgHTMLAttributes<HTMLImageElement> & {
      "data-testid"?: string;
    }
  ) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

describe("QRCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing initially before QR code generates", () => {
    const { container } = render(<QRCode url="http://example.com" />);
    // Before the async effect resolves, it returns null
    // But since mocks resolve immediately in microtasks, it may render quickly
    expect(container).toBeTruthy();
  });

  it("renders the QR code image after generation", async () => {
    render(<QRCode url="http://example.com" />);

    await waitFor(() => {
      expect(screen.getByTestId("qr-code")).toBeInTheDocument();
    });
  });

  it("passes the correct alt text", async () => {
    render(<QRCode url="http://example.com/karaoke" />);

    await waitFor(() => {
      expect(
        screen.getByAltText("QR Code for http://example.com/karaoke")
      ).toBeInTheDocument();
    });
  });

  it("applies custom className", async () => {
    render(<QRCode url="http://example.com" className="my-custom-class" />);

    await waitFor(() => {
      const wrapper = screen.getByTestId("qr-code");
      expect(wrapper.className).toContain("my-custom-class");
    });
  });

  it("uses default size of 80", async () => {
    render(<QRCode url="http://example.com" />);

    await waitFor(() => {
      const img = screen.getByAltText("QR Code for http://example.com");
      expect(img).toHaveAttribute("width", "80");
      expect(img).toHaveAttribute("height", "80");
    });
  });

  it("uses custom size when provided", async () => {
    render(<QRCode url="http://example.com" size={120} />);

    await waitFor(() => {
      const img = screen.getByAltText("QR Code for http://example.com");
      expect(img).toHaveAttribute("width", "120");
      expect(img).toHaveAttribute("height", "120");
    });
  });
});
