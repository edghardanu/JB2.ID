"use client";

import { useEffect, useRef } from "react";

import { GenerusItem } from "@/lib/types";

interface Props {
  item: GenerusItem;
  onClose: () => void;
}

export default function QRModal({ item, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function generateQR() {
      try {
        const QRCode = await import("qrcode");
        if (canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, item.nomorUnik, {
            width: 220,
            margin: 2,
            color: { dark: "#1e293b", light: "#ffffff" },
          });
        }
      } catch (e) {
        console.error("QR generation error:", e);
      }
    }
    generateQR();
  }, [item.nomorUnik]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `QR-${item.nomorUnik}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL();
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head><title>QR - ${item.nama}</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
          h2 { margin: 16px 0 4px; font-size: 20px; }
          p { color: #666; font-size: 14px; margin: 4px 0; }
          .id { font-family: monospace; font-size: 18px; font-weight: bold; margin: 8px 0; letter-spacing: 2px; }
        </style>
        </head>
        <body>
          <img src="${dataURL}" width="220" />
          <div class="id">${item.nomorUnik}</div>
          <h2>${item.nama}</h2>
          <p>${item.desaNama || ""} • ${item.kelompokNama || ""}</p>
          <p>${item.kategoriUsia}</p>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">QR Code Generus</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="qr-container">
            <canvas ref={canvasRef} style={{ borderRadius: 8, border: "1px solid var(--border)" }} />
            <div className="qr-id">{item.nomorUnik}</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{item.nama}</div>
              <div className="text-sm text-muted" style={{ marginTop: 4 }}>
                {item.desaNama} • {item.kelompokNama}
              </div>
              <div className="text-sm text-muted">{item.kategoriUsia}</div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handlePrint}>🖨️ Print</button>
          <button className="btn btn-primary" onClick={handleDownload}>⬇️ Download</button>
        </div>
      </div>
    </div>
  );
}
