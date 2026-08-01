"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import GlowButton from "@/components/GlowButton";

const facilityTypes = [
  { value: "clinic", label: "🏥 Clinic", desc: "Small medical clinic" },
  { value: "nursing_home", label: "🏠 Nursing Home", desc: "Elder care facility" },
  { value: "lab", label: "🔬 Laboratory", desc: "Diagnostic lab" },
  { value: "dental", label: "🦷 Dental Clinic", desc: "Dental practice" },
  { value: "veterinary", label: "🐾 Veterinary", desc: "Animal clinic" },
  { value: "other", label: "🏢 Other", desc: "Other healthcare" },
];

const inputClass = "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    facilityName: "",
    facilityType: "",
    licenseNumber: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    contactPerson: "",
    contactPhone: "",
    bedCount: "",
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push("/");
      } else {
        alert("Error creating facility. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Error creating facility. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-2xl"
      >
        <div
          className="glass-strong rounded-3xl p-8 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(15,15,40,0.95), rgba(10,10,30,0.98))",
            border: "1px solid rgba(99, 102, 241, 0.2)",
          }}
        >
          {/* Progress */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <motion.div
                  animate={{
                    background: step >= s
                      ? "linear-gradient(135deg, #6366f1, #00ff88)"
                      : "rgba(255,255,255,0.1)",
                    boxShadow: step >= s
                      ? "0 0 20px rgba(99, 102, 241, 0.4)"
                      : "none",
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                >
                  {step > s ? "✓" : s}
                </motion.div>
                {s < 3 && (
                  <div className="flex-1 h-1 mx-2 rounded-full overflow-hidden bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: step > s ? "100%" : "0%" }}
                      className="h-full bg-gradient-to-r from-primary-500 to-neon-green"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Choose Type */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-2xl font-bold mb-2">Welcome! 👋</h2>
              <p className="text-gray-400 mb-6">
                Let&apos;s set up your facility. What type is it?
              </p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {facilityTypes.map((type) => (
                  <motion.button
                    key={type.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setForm({ ...form, facilityType: type.value })}
                    className={`p-4 rounded-xl text-left transition-all ${
                      form.facilityType === type.value
                        ? "bg-primary-500/20 border-primary-500/50"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    } border`}
                  >
                    <p className="text-xl mb-1">{type.label}</p>
                    <p className="text-xs text-gray-500">{type.desc}</p>
                  </motion.button>
                ))}
              </div>
              <GlowButton
                onClick={() => setStep(2)}
                disabled={!form.facilityType}
                className="w-full"
              >
                Continue →
              </GlowButton>
            </motion.div>
          )}

          {/* Step 2: Basic Info */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-2xl font-bold mb-2">Facility Details</h2>
              <p className="text-gray-400 mb-6">
                Tell us about your {form.facilityType.replace(/_/g, " ")}
              </p>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Facility Name *
                  </label>
                  <input
                    value={form.facilityName}
                    onChange={(e) => setForm({ ...form, facilityName: e.target.value })}
                    placeholder="e.g., City Care Clinic"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    License Number *
                  </label>
                  <input
                    value={form.licenseNumber}
                    onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                    placeholder="e.g., MH-CL-2024-001"
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Contact Person *
                    </label>
                    <input
                      value={form.contactPerson}
                      onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                      placeholder="Dr. Name"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Phone *
                    </label>
                    <input
                      value={form.contactPhone}
                      onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Number of Beds (optional)
                  </label>
                  <input
                    type="number"
                    value={form.bedCount}
                    onChange={(e) => setForm({ ...form, bedCount: e.target.value })}
                    placeholder="e.g., 10"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white transition"
                >
                  ← Back
                </motion.button>
                <GlowButton
                  onClick={() => setStep(3)}
                  disabled={!form.facilityName || !form.licenseNumber || !form.contactPerson || !form.contactPhone}
                  className="flex-1"
                >
                  Continue →
                </GlowButton>
              </div>
            </motion.div>
          )}

          {/* Step 3: Address */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-2xl font-bold mb-2">Location</h2>
              <p className="text-gray-400 mb-6">Where is your facility located?</p>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Full Address *
                  </label>
                  <textarea
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Street address, building, floor..."
                    rows={2}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      City *
                    </label>
                    <input
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="Mumbai"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      State *
                    </label>
                    <input
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      placeholder="Maharashtra"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Pincode *
                    </label>
                    <input
                      value={form.pincode}
                      onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                      placeholder="400001"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setStep(2)}
                  className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white transition"
                >
                  ← Back
                </motion.button>
                <GlowButton
                  onClick={handleSubmit}
                  disabled={loading || !form.address || !form.city || !form.state || !form.pincode}
                  variant="success"
                  className="flex-1"
                >
                  {loading ? "Creating..." : "🎉 Complete Setup"}
                </GlowButton>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
