"use client";

import { BrowserMultiFormatReader } from "@zxing/browser";
import { useEffect, useRef, useState } from "react";

type BarcodeCameraScannerProps = {
  onDetected: (barcode: string) => void;
  disabled?: boolean;
};

type ScanControls = {
  stop: () => void;
};

export function BarcodeCameraScanner({ onDetected, disabled }: BarcodeCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<ScanControls | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, []);

  async function startScan() {
    if (!videoRef.current) {
      return;
    }

    setError("");

    if (!navigator.mediaDevices) {
      setError("Camera API is not available in this browser.");
      return;
    }

    const reader = readerRef.current ?? new BrowserMultiFormatReader();
    readerRef.current = reader;

    try {
      const controls = await reader.decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: "environment" },
          },
        },
        videoRef.current,
        (result) => {
          if (!result) {
            return;
          }

          const code = result.getText().trim();
          if (!code) {
            return;
          }

          onDetected(code);
          controlsRef.current?.stop();
          controlsRef.current = null;
          setActive(false);
        },
      );

      controlsRef.current = controls;
      setActive(true);
    } catch {
      setError("Unable to access camera. Check camera permissions.");
      setActive(false);
    }
  }

  function stopScan() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setActive(false);
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {!active ? (
          <button
            type="button"
            onClick={startScan}
            disabled={disabled}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Scan with camera
          </button>
        ) : (
          <button
            type="button"
            onClick={stopScan}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
          >
            Stop scanner
          </button>
        )}
        <p className="text-xs text-slate-500">Works best on secure origin (`https` or localhost).</p>
      </div>

      <video
        ref={videoRef}
        className={`max-h-56 w-full rounded-lg border border-slate-200 bg-black object-cover ${active ? "block" : "hidden"}`}
        muted
        playsInline
      />

      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
