"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedCard from "@/components/AnimatedCard";
import GlowButton from "@/components/GlowButton";
import ModalWrapper from "@/components/ModalWrapper";

interface WasteLog {
  id: number; facilityId: number; facilityName: string | null; category: string;
  quantityKg: string; description: string | null; disposalMethod: string | null;
  handlerName: string | null; manifestNumber: string | null;
  storageLocation: string | null; collectedAt: string | null; createdAt: string;
}
interface FacilityOption { id: number; name: string; }
interface QRData {
  qrCode: string;
  wasteLog: {
    id: number; facilityName: string | null; category: string; quantityKg: string;
    trackingId: string; categoryLabel: string; disposalMethod: string | null;
    handlerName: string | null; manifestNumber: string | null;
    storageLocation: string | null; createdAt: string; collectedAt: string | null;
  };
}

const categories = [
  { value: "yellow", label: "Yellow - Infectious", color: "#fbbf24", icon: "🟡" },
  { value: "red", label: "Red - Contaminated", color: "#ef4444", icon: "🔴" },
  { value: "blue", label: "Blue - Glassware", color: "#3b82f6", icon: "🔵" },
  { value: "white", label: "White - Sharps", color: "#94a3b8", icon: "⚪" },
  { value: "cytotoxic", label: "Cytotoxic", color: "#a855f7", icon: "🟣" },
  { value: "chemical", label: "Chemical", color: "#f97316", icon: "🟠" },
  { value: "general", label: "General", color: "#22c55e", icon: "🟢" },
];
const catMap: Record<string, { label: string; color: string; icon: string }> = {};
categories.forEach((c) => { catMap[c.value] = { label: c.label, color: c.color, icon: c.icon }; });

const inputClass = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all";

export default function WasteLogsPage() {
  const [logs, setLogs] = useState<WasteLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [facilityFilter, setFacilityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [facilitiesList, setFacilitiesList] = useState<FacilityOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({ facilityId: "", category: "yellow", quantityKg: "", description: "", disposalMethod: "", handlerName: "", manifestNumber: "", storageLocation: "", collectedAt: "" });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (facilityFilter) p.set("facilityId", facilityFilter);
      if (categoryFilter) p.set("category", categoryFilter);
      const res = await fetch(`/api/waste-logs?${p}`);
      const json = await res.json();
      setLogs(json.data || []); setTotal(json.total || 0);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [facilityFilter, categoryFilter]);

  const fetchFacilities = useCallback(async () => {
    try {
      const res = await fetch("/api/facilities?limit=100");
      const json = await res.json();
      setFacilitiesList((json.data || []).map((f: FacilityOption) => ({ id: f.id, name: f.name })));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchLogs(); fetchFacilities(); }, [fetchLogs, fetchFacilities]);

  const fetchQR = async (logId: number) => {
    setQrLoading(true);
    try {
      const res = await fetch(`/api/qr/${logId}`);
      if (res.ok) {
        const data = await res.json();
        setQrData(data);
        setShowQR(true);
      }
    } catch (e) { console.error(e); }
    finally { setQrLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const res = await fetch("/api/waste-logs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) {
        const newLog = await res.json();
        setShowForm(false);
        setForm({ facilityId: "", category: "yellow", quantityKg: "", description: "", disposalMethod: "", handlerName: "", manifestNumber: "", storageLocation: "", collectedAt: "" });
        await fetchLogs();
        // Auto-open QR for the new entry
        await fetchQR(newLog.id);
      }
    } catch (e) { console.error(e); } finally { setSubmitting(false); }
  };

  const handlePrintQR = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html><head><title>BioWaste QR Label</title>
      <style>
        @page { size: 80mm 120mm; margin: 4mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: white; color: black; }
        .label { width: 72mm; padding: 4mm; border: 2px solid #000; border-radius: 4mm; }
        .header { text-align: center; font-size: 11pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 3mm; margin-bottom: 3mm; }
        .qr-container { text-align: center; margin: 3mm 0; }
        .qr-container img { width: 40mm; height: 40mm; }
        .tracking { text-align: center; font-size: 13pt; font-weight: bold; letter-spacing: 2px; margin: 2mm 0; }
        .info-row { display: flex; justify-content: space-between; font-size: 8pt; padding: 1.5mm 0; border-bottom: 1px dotted #999; }
        .info-label { font-weight: bold; color: #333; }
        .category-badge { text-align: center; padding: 2mm; margin: 2mm 0; font-size: 10pt; font-weight: bold; border: 2px solid #000; border-radius: 2mm; }
        .warning { text-align: center; font-size: 7pt; margin-top: 3mm; color: #666; border-top: 1px solid #999; padding-top: 2mm; }
        .biohazard { font-size: 16pt; }
      </style></head>
      <body>${printContent}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const handleDownloadQR = () => {
    if (!qrData) return;
    const link = document.createElement("a");
    link.href = qrData.qrCode;
    link.download = `${qrData.wasteLog.trackingId}-qr.png`;
    link.click();
  };

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        <div>
          <motion.h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-neon-green to-neon-blue bg-clip-text text-transparent" style={{ backgroundSize: "200% 200%" }} animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }} transition={{ duration: 6, repeat: Infinity }}>Waste Logs</motion.h1>
          <p className="text-gray-500 mt-2">{total} waste entries tracked · QR labels enabled</p>
        </div>
        <GlowButton onClick={() => setShowForm(true)} variant="success">+ Log Waste</GlowButton>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex gap-4 mb-8 flex-wrap">
        <select value={facilityFilter} onChange={(e) => setFacilityFilter(e.target.value)} className={inputClass + " w-56"}>
          <option value="">All Facilities</option>
          {facilitiesList.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={inputClass + " w-56"}>
          <option value="">All Categories</option>
          {categories.map((c) => (<option key={c.value} value={c.value}>{c.icon} {c.label}</option>))}
        </select>
      </motion.div>

      <AnimatedCard delay={0.3}>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-16"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-12 h-12 rounded-full border-4 border-neon-green/30 border-t-neon-green" /></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16"><motion.p animate={{ y: [0, -15, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-5xl mb-4">🗑️</motion.p><p className="text-gray-400">No waste logs found</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/5">{["Facility", "Category", "Quantity", "Disposal", "Manifest", "Date", "QR Label"].map((h) => (<th key={h} className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">{h}</th>))}</tr></thead>
                <tbody>
                  {logs.map((log, i) => {
                    const cat = catMap[log.category];
                    return (
                      <motion.tr key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors">
                        <td className="py-3 px-4 text-white/80 font-medium">{log.facilityName || "Unknown"}</td>
                        <td className="py-3 px-4"><span className="flex items-center gap-2"><motion.span className="w-3 h-3 rounded-full" style={{ background: cat?.color || "#6b7280", boxShadow: `0 0 10px ${cat?.color || "#6b7280"}60` }} animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }} /><span className="text-gray-400 text-xs">{cat?.label || log.category}</span></span></td>
                        <td className="py-3 px-4 font-mono text-white/70">{parseFloat(log.quantityKg).toFixed(2)} kg</td>
                        <td className="py-3 px-4 text-gray-400 text-xs">{log.disposalMethod || "—"}</td>
                        <td className="py-3 px-4 font-mono text-gray-500 text-[11px]">{log.manifestNumber || "—"}</td>
                        <td className="py-3 px-4 text-gray-500 text-xs">{new Date(log.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => fetchQR(log.id)}
                            disabled={qrLoading}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                            style={{
                              background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(0,255,136,0.1))",
                              border: "1px solid rgba(99,102,241,0.3)",
                              color: "#a5b4fc",
                            }}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                            QR
                          </motion.button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AnimatedCard>

      {/* Log Waste Modal */}
      <ModalWrapper isOpen={showForm} onClose={() => setShowForm(false)} title="Log New Waste Entry">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Facility *</label><select required value={form.facilityId} onChange={(e) => setForm({ ...form, facilityId: e.target.value })} className={inputClass}><option value="">Select...</option>{facilitiesList.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}</select></div>
            <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Category *</label><select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>{categories.map((c) => (<option key={c.value} value={c.value}>{c.icon} {c.label}</option>))}</select></div>
            <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Quantity (kg) *</label><input required type="number" step="0.001" min="0.001" value={form.quantityKg} onChange={(e) => setForm({ ...form, quantityKg: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Disposal Method</label><select value={form.disposalMethod} onChange={(e) => setForm({ ...form, disposalMethod: e.target.value })} className={inputClass}><option value="">Select...</option><option>Incineration</option><option>Autoclaving</option><option>Chemical Treatment</option><option>Deep Burial</option><option>Shredding</option></select></div>
            <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Handler</label><input value={form.handlerName} onChange={(e) => setForm({ ...form, handlerName: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Manifest #</label><input value={form.manifestNumber} onChange={(e) => setForm({ ...form, manifestNumber: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Storage</label><input value={form.storageLocation} onChange={(e) => setForm({ ...form, storageLocation: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Collected</label><input type="datetime-local" value={form.collectedAt} onChange={(e) => setForm({ ...form, collectedAt: e.target.value })} className={inputClass} /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={inputClass} /></div>
          <div className="glass rounded-xl p-4 flex items-center gap-3">
            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="text-2xl">📎</motion.div>
            <div>
              <p className="text-sm font-medium text-white/80">QR Label Auto-Generated</p>
              <p className="text-xs text-gray-500">A QR code label will be created automatically for you to print and stick on the waste bag</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition">Cancel</motion.button>
            <GlowButton type="submit" disabled={submitting} variant="success">{submitting ? "Generating QR..." : "Log Waste & Generate QR"}</GlowButton>
          </div>
        </form>
      </ModalWrapper>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && qrData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowQR(false)}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
              style={{
                background: "linear-gradient(135deg, rgba(15,15,40,0.98), rgba(10,10,30,0.99))",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 80px rgba(99, 102, 241, 0.15)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-white to-neon-green bg-clip-text text-transparent">
                    QR Label Generated ✅
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">Print and paste on the waste bag</p>
                </div>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setShowQR(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10">✕</motion.button>
              </div>

              {/* QR Preview */}
              <div className="p-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl p-6 text-black mb-6"
                >
                  {/* Printable Label Content */}
                  <div ref={printRef}>
                    <div className="label">
                      <div className="header">
                        <span className="biohazard">☣</span> BIOMEDICAL WASTE
                      </div>
                      <div className="qr-container">
                        <img src={qrData.qrCode} alt="QR Code" style={{ width: "160px", height: "160px" }} />
                      </div>
                      <div className="tracking">{qrData.wasteLog.trackingId}</div>
                      <div className="category-badge">{qrData.wasteLog.categoryLabel}</div>
                      <div className="info-row"><span className="info-label">Facility:</span><span>{qrData.wasteLog.facilityName}</span></div>
                      <div className="info-row"><span className="info-label">Weight:</span><span>{parseFloat(qrData.wasteLog.quantityKg).toFixed(3)} kg</span></div>
                      <div className="info-row"><span className="info-label">Disposal:</span><span>{qrData.wasteLog.disposalMethod || "Pending"}</span></div>
                      <div className="info-row"><span className="info-label">Handler:</span><span>{qrData.wasteLog.handlerName || "Unassigned"}</span></div>
                      <div className="info-row"><span className="info-label">Manifest:</span><span>{qrData.wasteLog.manifestNumber || "N/A"}</span></div>
                      <div className="info-row"><span className="info-label">Date:</span><span>{new Date(qrData.wasteLog.createdAt).toLocaleString()}</span></div>
                      <div className="warning">⚠️ Handle with care · Follow BMW Rules 2016 · Scan QR for details</div>
                    </div>
                  </div>
                </motion.div>

                {/* On-screen info cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="glass rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Tracking ID</p>
                    <p className="font-mono font-bold text-primary-400">{qrData.wasteLog.trackingId}</p>
                  </div>
                  <div className="glass rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Weight</p>
                    <p className="font-mono font-bold text-neon-green">{parseFloat(qrData.wasteLog.quantityKg).toFixed(3)} kg</p>
                  </div>
                  <div className="glass rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Category</p>
                    <p className="font-bold text-sm" style={{ color: catMap[qrData.wasteLog.category]?.color }}>{catMap[qrData.wasteLog.category]?.icon} {catMap[qrData.wasteLog.category]?.label}</p>
                  </div>
                  <div className="glass rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Facility</p>
                    <p className="font-bold text-sm text-white/80">{qrData.wasteLog.facilityName}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <GlowButton onClick={handlePrintQR} className="flex-1">
                    🖨️ Print Label
                  </GlowButton>
                  <GlowButton onClick={handleDownloadQR} variant="success" className="flex-1">
                    📥 Download QR
                  </GlowButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
