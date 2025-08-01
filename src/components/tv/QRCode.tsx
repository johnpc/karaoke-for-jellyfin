"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCodeLib from "qrcode";

interface QRCodeProps {
  url: string;
  size?: number;
  className?: string;
}

export function QRCode({ url, size = 80, className = "" }: QRCodeProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const qrCodeUrl = await QRCodeLib.toDataURL(url, {
          width: size,
          margin: 1,
          color: {
            dark: "#FFFFFF", // White QR code
            light: "#00000000", // Transparent background
          },
          errorCorrectionLevel: "M",
        });
        setQrCodeDataUrl(qrCodeUrl);
      } catch (error) {
        console.error("Error generating QR code:", error);
      }
    };

    generateQRCode();
  }, [url, size]);

  if (!qrCodeDataUrl) {
    return null;
  }

  return (
    <div data-testid="qr-code" className={`${className}`}>
      <Image
        src={qrCodeDataUrl}
        alt={`QR Code for ${url}`}
        width={size}
        height={size}
        className="rounded-lg bg-gray-900 bg-opacity-80 p-2 backdrop-blur-sm border border-gray-700"
        unoptimized // QR codes are already optimized data URLs
      />
    </div>
  );
}
