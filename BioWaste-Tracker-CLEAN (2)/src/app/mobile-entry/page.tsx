"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlowButton from "@/components/GlowButton";

interface FacilityOption {
  id: number;
  name: string;
  type: string;
}

interface QRData {
  qrCode: string;
  wasteLog: {
    id: number;
    facilityName: string | null;
    category: string;
    quantityKg: string;
    trackingId: string;
    categoryLabel: string;
    disposalMethod: string | null;
    createdAt: string;
  };
}

const categories = [
  { value: "yellow", label: "Yellow - Infectious", color: "#fbbf24", icon: "🟡", description: "Human anatomical, blood, body fluids" },
  { value: "red", label: "Red - Contaminated", color: "#ef4444", icon: "🔴", description: "Tubing, catheters, gloves, plastic" },
  { value: "blue", label: "Blue - Glassware", color: "#3b82f6", icon: "🔵", description: "Broken glass, vials, ampoules" },
  { value: "white", label: "White - Sharps", color: "#94a3b8", icon: "⚪", description: "Needles, syringes, blades, scalpels" },
  { value: "cytotoxic", label: "Cytotoxic", color: "#a855f7", icon: "🟣", description: "Chemotherapy waste, cytotoxic drugs" },
  { value: "chemical", label: "Chemical", color: "#f97316", icon: "🟠", description: "Lab chemicals, disinfectants" },
  { value: "general", label: "General", color: "#22c55e", icon: "🟢", description: "Non-hazardous, office waste" },
];

export default function MobileEntryPage() {
  const [step, setStep] = useState(1);
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    facilityId: "",
    category: "",
    quantityKg: "",
    description: "",
    storageLocation: "",
    handlerName: "",
  });

  const fetchFacilities = useCallback(async () => {
    try {
      const res = await fetch("/api/facilities?limit=100");
      const json = await res.json();
      setFacilities(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  const handleSubmit = async () => {
    if (!form.facilityId || !form.category || !form.quantityKg) {
      setError("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/waste-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const newLog = await res.json();
        // Fetch QR code
        const qrRes = await fetch(`/api/qr/${newLog.id}`);
        if (qrRes.ok) {
          const qr = await qrRes.json();
          setQrData(qr);
        }
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to register waste");
      }
    } catch (e) {
      console.error(e);
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      facilityId: "",
      category: "",
      quantityKg: "",
      description: "",
      storageLocation: "",
      handlerName: "",
    });
    setStep(1);
    setSuccess(false);
    setQrData(null);
    setError(null);
  };

  const selectedCategory = categories.find((c) => c.value === form.category);
  const selectedFacility = facilities.find((f) => f.id.toString() === form.facilityId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 rounded-full border-4 border-neon-green/30 border-t-neon-green"
        />
      </div>
    );
  }

  if (success && qrData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 flex flex-col">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-7xl mb-6"
          >
            ✅
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">Waste Logged Successfully!</h1>
          <p className="text-gray-400 mb-6">Print or save the QR label for the waste bag</p>

          <div className="bg-white rounded-2xl p-6 mb-6 shadow-2xl">
            <img src={qrData.qrCode} alt="QR Code" className="w-48 h-48 mx-auto" />
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Tracking ID</p>
              <p className="text-lg font-mono font-bold text-slate-800">{qrData.wasteLog.trackingId}</p>
            </div>
          </div>

          <div className="w-full space-y-3 mb-6 text-left bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Facility</span>
              <span className="text-white font-medium">{qrData.wasteLog.facilityName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Category</span>
              <span className="font-medium" style={{ color: selectedCategory?.color }}>
                {selectedCategory?.icon} {qrData.wasteLog.categoryLabel}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Weight</span>
              <span className="text-white font-medium">{qrData.wasteLog.quantityKg} kg</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date/Time</span>
              <span className="text-white font-medium">
                {new Date(qrData.wasteLog.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="w-full space-y-3">
            <GlowButton
              onClick={() => {
                const link = document.createElement("a");
                link.href = qrData.qrCode;
                link.download = `${qrData.wasteLog.trackingId}-qr.png`;
                link.click();
              }}
              variant="success"
              className="w-full py-4"
            >
              📥 Download QR Label
            </GlowButton>
            <button
              onClick={resetForm}
              className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-medium hover:bg-white/10 transition"
            >
              + Log Another Waste Bag
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-3xl"
          >
            🗑️
          </motion.span>
          <div>
            <h1 className="text-xl font-bold text-white">Log Biomedical Waste</h1>
            <p className="text-xs text-gray-500">Mobile Entry System</p>
          </div>
        </div>
        {/* Progress */}
        <div className="flex gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <motion.div
              key={s}
              className="h-1.5 flex-1 rounded-full overflow-hidden bg-white/10"
            >
              <motion.div
                className="h-full bg-neon-green"
                initial={{ width: 0 }}
                animate={{ width: step >= s ? "100%" : "0%" }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-white">Select Facility</h2>
                <p className="text-sm text-gray-500">Choose the generating facility</p>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-auto">
                {facilities.map((facility) => (
                  <motion.button
                    key={facility.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setForm({ ...form, facilityId: facility.id.toString() });
                      setStep(2);
                    }}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      form.facilityId === facility.id.toString()
                        ? "bg-neon-green/20 border-2 border-neon-green"
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏥</span>
                      <div>
                        <p className="font-medium text-white">{facility.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{facility.type.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-white">Waste Category</h2>
                <p className="text-sm text-gray-500">Select the type of biomedical waste</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <motion.button
                    key={cat.value}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setForm({ ...form, category: cat.value });
                      setStep(3);
                    }}
                    className={`p-4 rounded-xl text-center transition-all ${
                      form.category === cat.value
                        ? "ring-2"
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    }`}
                    style={{
                      background: form.category === cat.value ? `${cat.color}20` : undefined,
                      borderColor: form.category === cat.value ? cat.color : undefined,
                      boxShadow: form.category === cat.value ? `0 0 0 2px ${cat.color}` : undefined,
                    }}
                  >
                    <span className="text-3xl block mb-2">{cat.icon}</span>
                    <p className="text-sm font-medium text-white">{cat.label.split(" - ")[0]}</p>
                    <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{cat.description}</p>
                  </motion.button>
                ))}
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full py-3 text-gray-500 text-sm"
              >
                ← Back to Facility Selection
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-white">Waste Details</h2>
                <p className="text-sm text-gray-500">Enter weight and additional info</p>
              </div>

              {/* Summary */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Facility</span>
                  <span className="text-white">{selectedFacility?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Category</span>
                  <span style={{ color: selectedCategory?.color }}>
                    {selectedCategory?.icon} {selectedCategory?.label}
                  </span>
                </div>
              </div>

              {/* Weight Input */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Weight (kg) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.quantityKg}
                  onChange={(e) => setForm({ ...form, quantityKg: e.target.value })}
                  className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-2xl font-mono text-center placeholder-gray-600 focus:outline-none focus:border-neon-green/50 focus:ring-2 focus:ring-neon-green/20"
                />
              </div>

              {/* Handler Name */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Handler Name
                </label>
                <input
                  type="text"
                  placeholder="Staff who handled the waste"
                  value={form.handlerName}
                  onChange={(e) => setForm({ ...form, handlerName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-neon-green/50"
                />
              </div>

              {/* Storage Location */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Storage Location
                </label>
                <input
                  type="text"
                  placeholder="e.g., Cold Storage Room A"
                  value={form.storageLocation}
                  onChange={(e) => setForm({ ...form, storageLocation: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-neon-green/50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional details about the waste..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-neon-green/50 resize-none"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <button
                onClick={() => setStep(2)}
                className="w-full py-3 text-gray-500 text-sm"
              >
                ← Back to Category Selection
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 border-t border-white/10 bg-slate-900/80 backdrop-blur"
        >
          <GlowButton
            onClick={handleSubmit}
            disabled={submitting || !form.quantityKg}
            variant="success"
            className="w-full py-4 text-lg"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  ⏳
                </motion.span>
                Processing...
              </span>
            ) : (
              "✅ Log Waste & Generate QR"
            )}
          </GlowButton>
        </motion.div>
      )}
    </div>
  );
}
