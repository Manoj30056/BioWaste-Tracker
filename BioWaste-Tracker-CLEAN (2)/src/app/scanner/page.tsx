"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedCard from "@/components/AnimatedCard";
import GlowButton from "@/components/GlowButton";

interface ScanResult {
  found: boolean;
  trackingId: string;
  category: {
    code: string;
    label: string;
    color: string;
    icon: string;
    hazardLevel: string;
  };
  weight: {
    kg: number;
    display: string;
  };
  facility: {
    name: string;
    type: string;
    license: string;
    location: string;
    complianceStatus: string;
  };
  disposal: {
    method: string;
    handler: string;
    manifest: string;
    storage: string;
  };
  timestamps: {
    logged: string;
    collected: string | null;
  };
  description: string | null;
}

const hazardColors: Record<string, { bg: string; text: string; border: string }> = {
  LOW: { bg: "rgba(34,197,94,0.15)", text: "#4ade80", border: "rgba(34,197,94,0.3)" },
  MEDIUM: { bg: "rgba(59,130,246,0.15)", text: "#60a5fa", border: "rgba(59,130,246,0.3)" },
  HIGH: { bg: "rgba(245,158,11,0.15)", text: "#fbbf24", border: "rgba(245,158,11,0.3)" },
  CRITICAL: { bg: "rgba(239,68,68,0.15)", text: "#f87171", border: "rgba(239,68,68,0.3)" },
};

const complianceColors: Record<string, string> = {
  compliant: "#22c55e",
  non_compliant: "#ef4444",
  pending_review: "#f59e0b",
  suspended: "#6b7280",
};

export default function ScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);

  const stopScanner = useCallback(async () => {
    try {
      const scanner = html5QrCodeRef.current as { isScanning?: boolean; stop?: () => Promise<void>; clear?: () => void } | null;
      if (scanner && scanner.isScanning) {
        await scanner.stop?.();
      }
      scanner?.clear?.();
    } catch {
      // ignore
    }
    html5QrCodeRef.current = null;
    setScanning(false);
    setScannerReady(false);
  }, []);

  const lookupQR = async (qrData: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/qr/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrData }),
      });
      const data = await res.json();
      if (res.ok && data.found) {
        setResult(data);
      } else {
        setError(data.error || "Could not find waste details for this QR code.");
      }
    } catch {
      setError("Failed to look up QR code. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const startScanner = useCallback(async () => {
    setResult(null);
    setError(null);
    setScanning(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      // Small delay for DOM
      await new Promise((r) => setTimeout(r, 300));

      if (!scannerRef.current) return;

      const scanner = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        async (decodedText: string) => {
          // Successfully scanned
          await stopScanner();
          await lookupQR(decodedText);
        },
        () => {
          // Scan frame - no match yet (ignore)
        }
      );

      setScannerReady(true);
    } catch (err) {
      console.error("Scanner error:", err);
      setError(
        "Camera access denied or not available. Please allow camera permissions and try again."
      );
      setScanning(false);
    }
  }, [stopScanner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const scanAgain = () => {
    setResult(null);
    setError(null);
    startScanner();
  };

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <motion.h1
          className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-neon-green to-neon-blue bg-clip-text text-transparent"
          style={{ backgroundSize: "200% 200%" }}
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          QR Scanner
        </motion.h1>
        <p className="text-gray-500 mt-2">
          Scan waste bag QR labels to view tracking details
        </p>
      </motion.div>

      <div className="max-w-2xl mx-auto">
        {/* Scanner or Start button */}
        {!scanning && !result && !loading && (
          <AnimatedCard delay={0.1} glowColor="rgba(0,255,136,0.15)">
            <div className="p-10 text-center relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-10 blur-3xl bg-neon-green" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-10 blur-3xl bg-neon-blue" />

              <motion.div
                animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="text-8xl mb-6 inline-block"
              >
                📱
              </motion.div>

              <h2 className="text-2xl font-bold text-white mb-3">
                Scan Waste QR Code
              </h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Point your camera at the QR label on the waste bag to instantly
                see all tracking details — category, weight, facility, handler,
                and disposal status.
              </p>

              <GlowButton
                onClick={startScanner}
                variant="success"
                className="text-lg px-10 py-4"
              >
                📷 Open Camera & Scan
              </GlowButton>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <p className="text-red-400 text-sm">{error}</p>
                </motion.div>
              )}

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 mt-10">
                {[
                  { icon: "🔍", label: "Instant Lookup" },
                  { icon: "📋", label: "Full Details" },
                  { icon: "✅", label: "Verify Compliance" },
                ].map((f, i) => (
                  <motion.div
                    key={f.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="glass rounded-xl p-4 text-center"
                  >
                    <p className="text-2xl mb-1">{f.icon}</p>
                    <p className="text-xs text-gray-400">{f.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </AnimatedCard>
        )}

        {/* Active Scanner */}
        {scanning && (
          <AnimatedCard delay={0} glowColor="rgba(0,255,136,0.2)">
            <div className="p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-3 h-3 rounded-full bg-red-500"
                    style={{ boxShadow: "0 0 10px rgba(239,68,68,0.6)" }}
                  />
                  <span className="text-sm font-medium text-white/80">
                    {scannerReady ? "Scanning..." : "Starting camera..."}
                  </span>
                </div>
                <GlowButton
                  onClick={stopScanner}
                  variant="danger"
                  className="text-xs px-4 py-2"
                >
                  ✕ Stop
                </GlowButton>
              </div>

              {/* Scanner viewport */}
              <div className="relative rounded-xl overflow-hidden bg-black">
                <div id="qr-reader" ref={scannerRef} className="w-full" />

                {/* Scanning overlay animation */}
                {scannerReady && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ zIndex: 10 }}
                  >
                    {/* Scanning line */}
                    <motion.div
                      animate={{ top: ["20%", "80%", "20%"] }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute left-[15%] right-[15%] h-0.5"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, #00ff88, transparent)",
                        boxShadow: "0 0 15px rgba(0,255,136,0.6)",
                      }}
                    />
                  </motion.div>
                )}
              </div>

              <p className="text-center text-xs text-gray-500 mt-4">
                Position the QR code within the scanner frame
              </p>
            </div>
          </AnimatedCard>
        )}

        {/* Loading */}
        {loading && (
          <AnimatedCard delay={0}>
            <div className="p-16 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="w-16 h-16 rounded-full border-4 border-neon-green/30 border-t-neon-green mx-auto mb-4"
              />
              <p className="text-gray-400">Looking up waste details...</p>
            </div>
          </AnimatedCard>
        )}

        {/* Scan Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
            >
              {/* Success Banner */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 rounded-2xl text-center"
                style={{
                  background: "linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,212,255,0.05))",
                  border: "1px solid rgba(0,255,136,0.2)",
                }}
              >
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: 2 }}
                  className="text-4xl inline-block"
                >
                  ✅
                </motion.span>
                <p className="text-neon-green font-bold mt-1">QR Code Scanned Successfully</p>
              </motion.div>

              {/* Tracking ID Card */}
              <AnimatedCard delay={0.1} glowColor={result.category.color + "25"}>
                <div className="p-6 relative overflow-hidden">
                  <div
                    className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-15 blur-3xl"
                    style={{ background: result.category.color }}
                  />

                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Tracking ID
                      </p>
                      <p className="text-3xl font-black font-mono text-primary-400">
                        {result.trackingId}
                      </p>
                    </div>
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="text-5xl"
                    >
                      ☣
                    </motion.div>
                  </div>

                  {/* Category Badge */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 rounded-xl mb-4 flex items-center justify-between"
                    style={{
                      background: `linear-gradient(135deg, ${result.category.color}15, ${result.category.color}08)`,
                      border: `2px solid ${result.category.color}40`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <motion.span
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-3xl"
                      >
                        {result.category.icon}
                      </motion.span>
                      <div>
                        <p
                          className="font-bold text-lg"
                          style={{ color: result.category.color }}
                        >
                          {result.category.label}
                        </p>
                        <p className="text-xs text-gray-500">
                          Waste Category
                        </p>
                      </div>
                    </div>
                    <div>
                      {(() => {
                        const hc =
                          hazardColors[result.category.hazardLevel] ||
                          hazardColors.MEDIUM;
                        return (
                          <motion.span
                            animate={{
                              boxShadow: [
                                `0 0 10px ${hc.border}`,
                                `0 0 20px ${hc.border}`,
                                `0 0 10px ${hc.border}`,
                              ],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="px-4 py-2 rounded-lg text-xs font-black"
                            style={{
                              background: hc.bg,
                              color: hc.text,
                              border: `1px solid ${hc.border}`,
                            }}
                          >
                            ⚠️ {result.category.hazardLevel} HAZARD
                          </motion.span>
                        );
                      })()}
                    </div>
                  </motion.div>

                  {/* Weight */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="glass rounded-xl p-5 mb-4 text-center"
                  >
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                      Weight
                    </p>
                    <p className="text-4xl font-black text-neon-green">
                      {result.weight.display}
                    </p>
                  </motion.div>
                </div>
              </AnimatedCard>

              {/* Facility Info */}
              <div className="mt-4">
                <AnimatedCard delay={0.3} glowColor="rgba(99,102,241,0.1)">
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <span>🏥</span> Facility
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="glass rounded-xl p-3">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                          Name
                        </p>
                        <p className="font-bold text-white/90">
                          {result.facility.name}
                        </p>
                      </div>
                      <div className="glass rounded-xl p-3">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                          Type
                        </p>
                        <p className="font-medium text-white/80 capitalize">
                          {(result.facility.type || "").replace(/_/g, " ")}
                        </p>
                      </div>
                      <div className="glass rounded-xl p-3">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                          Location
                        </p>
                        <p className="font-medium text-white/80">
                          {result.facility.location}
                        </p>
                      </div>
                      <div className="glass rounded-xl p-3">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                          Compliance
                        </p>
                        <p
                          className="font-bold capitalize"
                          style={{
                            color:
                              complianceColors[
                                result.facility.complianceStatus
                              ] || "#6b7280",
                          }}
                        >
                          {(result.facility.complianceStatus || "").replace(
                            /_/g,
                            " "
                          )}
                        </p>
                      </div>
                      <div className="glass rounded-xl p-3 col-span-2">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                          License Number
                        </p>
                        <p className="font-mono text-sm text-white/70">
                          {result.facility.license}
                        </p>
                      </div>
                    </div>
                  </div>
                </AnimatedCard>
              </div>

              {/* Disposal Info */}
              <div className="mt-4">
                <AnimatedCard delay={0.4} glowColor="rgba(245,158,11,0.1)">
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <span>🚛</span> Disposal & Handling
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="glass rounded-xl p-3">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                          Method
                        </p>
                        <p className="font-bold text-white/90">
                          {result.disposal.method}
                        </p>
                      </div>
                      <div className="glass rounded-xl p-3">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                          Handler
                        </p>
                        <p className="font-medium text-white/80">
                          {result.disposal.handler}
                        </p>
                      </div>
                      <div className="glass rounded-xl p-3">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                          Manifest #
                        </p>
                        <p className="font-mono text-sm text-white/70">
                          {result.disposal.manifest}
                        </p>
                      </div>
                      <div className="glass rounded-xl p-3">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                          Storage
                        </p>
                        <p className="font-medium text-white/80">
                          {result.disposal.storage}
                        </p>
                      </div>
                    </div>
                  </div>
                </AnimatedCard>
              </div>

              {/* Timestamps */}
              <div className="mt-4">
                <AnimatedCard delay={0.5} glowColor="rgba(168,85,247,0.1)">
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <span>🕐</span> Timeline
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-3 h-3 rounded-full bg-neon-green"
                          style={{
                            boxShadow: "0 0 10px rgba(0,255,136,0.5)",
                          }}
                        />
                        <div>
                          <p className="text-xs text-gray-500">Logged</p>
                          <p className="font-medium text-white/80">
                            {new Date(
                              result.timestamps.logged
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            result.timestamps.collected
                              ? "bg-neon-blue"
                              : "bg-gray-600"
                          }`}
                          style={{
                            boxShadow: result.timestamps.collected
                              ? "0 0 10px rgba(0,212,255,0.5)"
                              : "none",
                          }}
                        />
                        <div>
                          <p className="text-xs text-gray-500">Collected</p>
                          <p className="font-medium text-white/80">
                            {result.timestamps.collected
                              ? new Date(
                                  result.timestamps.collected
                                ).toLocaleString()
                              : "⏳ Awaiting collection"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </AnimatedCard>
              </div>

              {/* Description */}
              {result.description && (
                <div className="mt-4">
                  <AnimatedCard delay={0.6}>
                    <div className="p-6">
                      <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                        <span>📝</span> Notes
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {result.description}
                      </p>
                    </div>
                  </AnimatedCard>
                </div>
              )}

              {/* Scan Again Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-6 flex gap-3"
              >
                <GlowButton
                  onClick={scanAgain}
                  variant="primary"
                  className="flex-1 text-lg py-4"
                >
                  📷 Scan Another
                </GlowButton>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error on lookup */}
        {error && !scanning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AnimatedCard delay={0} glowColor="rgba(239,68,68,0.15)">
              <div className="p-10 text-center">
                <motion.p
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  ❌
                </motion.p>
                <h3 className="text-xl font-bold text-red-400 mb-2">
                  Scan Failed
                </h3>
                <p className="text-gray-400 mb-6">{error}</p>
                <GlowButton onClick={scanAgain} variant="primary">
                  🔄 Try Again
                </GlowButton>
              </div>
            </AnimatedCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}
