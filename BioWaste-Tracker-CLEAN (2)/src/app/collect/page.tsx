"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedCard from "@/components/AnimatedCard";
import GlowButton from "@/components/GlowButton";

interface ScanResult {
  found: boolean;
  trackingId: string;
  category: { code: string; label: string; color: string; icon: string; hazardLevel: string };
  weight: { kg: number; display: string };
  facility: { name: string; type: string; license: string; location: string; complianceStatus: string };
  disposal: { method: string; handler: string; manifest: string; storage: string };
  timestamps: { logged: string; collected: string | null };
  description: string | null;
  wasteLogId?: number;
}

interface Collection {
  id: number;
  wasteLogId: number;
  collectorName: string;
  vehicleNumber: string | null;
  collectedAt: string;
  facilityName: string | null;
  wasteCategory: string;
  wasteQuantity: string;
}

const categoryColors: Record<string, string> = {
  yellow: "#fbbf24", red: "#ef4444", blue: "#3b82f6", white: "#94a3b8",
  cytotoxic: "#a855f7", chemical: "#f97316", general: "#22c55e",
};

export default function CollectPage() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [collected, setCollected] = useState(false);
  const [recentCollections, setRecentCollections] = useState<Collection[]>([]);
  const [collectorName, setCollectorName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [scannerReady, setScannerReady] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);

  const fetchRecentCollections = useCallback(async () => {
    try {
      const res = await fetch("/api/collections?limit=10");
      const json = await res.json();
      setRecentCollections(json.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchRecentCollections();
  }, [fetchRecentCollections]);

  const stopScanner = useCallback(async () => {
    try {
      const scanner = html5QrCodeRef.current as { isScanning?: boolean; stop?: () => Promise<void>; clear?: () => void } | null;
      if (scanner && scanner.isScanning) {
        await scanner.stop?.();
      }
      scanner?.clear?.();
    } catch { /* ignore */ }
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
        // Extract wasteLogId from trackingId
        const match = data.trackingId.match(/BWM-(\d+)/);
        if (match) {
          data.wasteLogId = parseInt(match[1]!, 10);
        }
        setScanResult(data);
        
        // Check if already collected
        if (data.timestamps.collected) {
          setError("This waste has already been collected.");
        }
      } else {
        setError(data.error || "Could not find waste details.");
      }
    } catch {
      setError("Failed to look up QR code.");
    } finally {
      setLoading(false);
    }
  };

  const startScanner = useCallback(async () => {
    setScanResult(null);
    setError(null);
    setCollected(false);
    setScanning(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      await new Promise((r) => setTimeout(r, 300));
      if (!scannerRef.current) return;

      const scanner = new Html5Qrcode("collect-qr-reader");
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        async (decodedText: string) => {
          await stopScanner();
          await lookupQR(decodedText);
        },
        () => {}
      );
      setScannerReady(true);
    } catch (err) {
      console.error(err);
      setError("Camera access denied. Please allow camera permissions.");
      setScanning(false);
    }
  }, [stopScanner]);

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  const confirmCollection = async () => {
    if (!scanResult?.wasteLogId || !collectorName) return;
    setCollecting(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wasteLogId: scanResult.wasteLogId,
          collectorName,
          vehicleNumber: vehicleNumber || null,
        }),
      });
      if (res.ok) {
        setCollected(true);
        await fetchRecentCollections();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to record collection.");
      }
    } catch {
      setError("Failed to record collection.");
    } finally {
      setCollecting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <motion.h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-neon-green to-neon-blue bg-clip-text text-transparent" style={{ backgroundSize: "200% 200%" }} animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }} transition={{ duration: 6, repeat: Infinity }}>
          Waste Collection
        </motion.h1>
        <p className="text-gray-500 mt-2">Scan QR codes to record waste pickup</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Section */}
        <div>
          {!scanning && !scanResult && !loading && (
            <AnimatedCard delay={0.1} glowColor="rgba(0,255,136,0.15)">
              <div className="p-10 text-center relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-10 blur-3xl bg-neon-green" />
                <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 4, repeat: Infinity }} className="text-7xl mb-6 inline-block">
                  🚛
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-3">Collector Mode</h2>
                <p className="text-gray-400 mb-8">Scan waste bag QR code to confirm pickup and record collection</p>
                <GlowButton onClick={startScanner} variant="success" className="text-lg px-10 py-4">
                  📷 Scan Waste QR
                </GlowButton>
              </div>
            </AnimatedCard>
          )}

          {scanning && (
            <AnimatedCard delay={0} glowColor="rgba(0,255,136,0.2)">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-3 h-3 rounded-full bg-red-500" style={{ boxShadow: "0 0 10px rgba(239,68,68,0.6)" }} />
                    <span className="text-sm font-medium text-white/80">{scannerReady ? "Scanning..." : "Starting camera..."}</span>
                  </div>
                  <GlowButton onClick={stopScanner} variant="danger" className="text-xs px-4 py-2">✕ Stop</GlowButton>
                </div>
                <div className="relative rounded-xl overflow-hidden bg-black">
                  <div id="collect-qr-reader" ref={scannerRef} className="w-full" />
                  {scannerReady && (
                    <motion.div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                      <motion.div animate={{ top: ["20%", "80%", "20%"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} className="absolute left-[15%] right-[15%] h-0.5" style={{ background: "linear-gradient(90deg, transparent, #00ff88, transparent)", boxShadow: "0 0 15px rgba(0,255,136,0.6)" }} />
                    </motion.div>
                  )}
                </div>
              </div>
            </AnimatedCard>
          )}

          {loading && (
            <AnimatedCard delay={0}>
              <div className="p-16 text-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-16 h-16 rounded-full border-4 border-neon-green/30 border-t-neon-green mx-auto mb-4" />
                <p className="text-gray-400">Looking up waste details...</p>
              </div>
            </AnimatedCard>
          )}

          {/* Scan Result */}
          <AnimatePresence>
            {scanResult && !collected && (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <AnimatedCard delay={0.1} glowColor={scanResult.category.color + "25"}>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-4xl">{scanResult.category.icon}</span>
                      <div>
                        <p className="font-mono font-bold text-xl text-primary-400">{scanResult.trackingId}</p>
                        <p className="text-sm text-gray-500">{scanResult.facility.name}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="glass rounded-xl p-3">
                        <p className="text-[10px] text-gray-500 uppercase">Category</p>
                        <p className="font-bold" style={{ color: scanResult.category.color }}>{scanResult.category.label}</p>
                      </div>
                      <div className="glass rounded-xl p-3">
                        <p className="text-[10px] text-gray-500 uppercase">Weight</p>
                        <p className="font-bold text-neon-green">{scanResult.weight.display}</p>
                      </div>
                      <div className="glass rounded-xl p-3">
                        <p className="text-[10px] text-gray-500 uppercase">Location</p>
                        <p className="font-medium text-white/80 text-sm">{scanResult.facility.location}</p>
                      </div>
                      <div className="glass rounded-xl p-3">
                        <p className="text-[10px] text-gray-500 uppercase">Disposal</p>
                        <p className="font-medium text-white/80 text-sm">{scanResult.disposal.method}</p>
                      </div>
                    </div>

                    {!scanResult.timestamps.collected ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Collector Name *</label>
                          <input value={collectorName} onChange={(e) => setCollectorName(e.target.value)} placeholder="Your name" className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-neon-green/50" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Vehicle Number</label>
                          <input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="e.g., MH-01-AB-1234" className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-neon-green/50" />
                        </div>
                        <GlowButton onClick={confirmCollection} disabled={collecting || !collectorName} variant="success" className="w-full text-lg py-4">
                          {collecting ? "Recording..." : "✅ Confirm Collection"}
                        </GlowButton>
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                        <p className="text-yellow-400 font-bold">⚠️ Already Collected</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(scanResult.timestamps.collected).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {error && (
                      <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <p className="text-red-400 text-sm">{error}</p>
                      </div>
                    )}

                    <motion.button whileHover={{ scale: 1.02 }} onClick={() => { setScanResult(null); setError(null); }} className="w-full mt-3 px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white transition text-sm">
                      Scan Another
                    </motion.button>
                  </div>
                </AnimatedCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collection Success */}
          {collected && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <AnimatedCard delay={0} glowColor="rgba(34,197,94,0.2)">
                <div className="p-10 text-center">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: 2 }} className="text-7xl mb-4">✅</motion.div>
                  <h3 className="text-2xl font-bold text-neon-green mb-2">Collection Recorded!</h3>
                  <p className="text-gray-400 mb-6">Waste pickup confirmed and logged to the system.</p>
                  <GlowButton onClick={() => { setScanResult(null); setCollected(false); startScanner(); }} variant="primary" className="text-lg">
                    📷 Scan Next
                  </GlowButton>
                </div>
              </AnimatedCard>
            </motion.div>
          )}

          {error && !scanResult && !scanning && (
            <AnimatedCard delay={0} glowColor="rgba(239,68,68,0.15)">
              <div className="p-10 text-center">
                <p className="text-5xl mb-4">❌</p>
                <p className="text-red-400 mb-4">{error}</p>
                <GlowButton onClick={startScanner} variant="primary">🔄 Try Again</GlowButton>
              </div>
            </AnimatedCard>
          )}
        </div>

        {/* Recent Collections */}
        <div>
          <AnimatedCard delay={0.2} glowColor="rgba(99,102,241,0.1)">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>📋</span> Recent Collections
              </h3>
              {recentCollections.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No collections recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {recentCollections.map((col, i) => (
                    <motion.div key={col.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ background: categoryColors[col.wasteCategory] || "#6b7280", boxShadow: `0 0 8px ${categoryColors[col.wasteCategory] || "#6b7280"}60` }} />
                          <span className="font-mono text-sm text-primary-400">BWM-{String(col.wasteLogId).padStart(6, "0")}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(col.collectedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-white/80">{col.facilityName}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>⚖️ {parseFloat(col.wasteQuantity).toFixed(2)} kg</span>
                        <span>👤 {col.collectorName}</span>
                        {col.vehicleNumber && <span>🚛 {col.vehicleNumber}</span>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </AnimatedCard>
        </div>
      </div>
    </div>
  );
}
