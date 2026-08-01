"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import AnimatedCard from "@/components/AnimatedCard";
import GlowButton from "@/components/GlowButton";

interface FacilityOption { id: number; name: string; type: string; complianceStatus: string; city: string; }
interface SpotCheck { id: number; facilityId: number; facilityName: string | null; facilityType: string | null; status: string; scheduledDate: string; overallScore: number | null; notes: string | null; }

const statusGlow: Record<string, string> = { scheduled: "#3b82f6", in_progress: "#f59e0b", completed: "#22c55e", cancelled: "#6b7280" };
const inputClass = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all";

export default function SpotChecksPage() {
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [spotChecks, setSpotChecks] = useState<SpotCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState("");
  const [randomPick, setRandomPick] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [fRes, iRes] = await Promise.all([fetch("/api/facilities?limit=100"), fetch("/api/inspections?isSpotCheck=true&limit=50")]);
      const fJ = await fRes.json(); const iJ = await iRes.json();
      setFacilities(fJ.data || []); setSpotChecks(iJ.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const triggerSpotCheck = async (facilityId: string, note: string) => {
    setCreating(true);
    try {
      await fetch("/api/inspections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ facilityId, scheduledDate: new Date().toISOString(), isSpotCheck: true, notes: note }) });
      setSelectedFacility(""); await fetchData();
    } catch (e) { console.error(e); } finally { setCreating(false); }
  };

  const triggerRandom = async () => {
    if (facilities.length === 0) return;
    setCreating(true);
    // Animate through random picks
    const pickCount = 8;
    for (let i = 0; i < pickCount; i++) {
      const rf = facilities[Math.floor(Math.random() * facilities.length)]!;
      setRandomPick(rf.name);
      await new Promise(r => setTimeout(r, 100 + i * 50));
    }
    const final = facilities[Math.floor(Math.random() * facilities.length)]!;
    setRandomPick(final.name);
    await new Promise(r => setTimeout(r, 500));
    await triggerSpotCheck(final.id.toString(), `Random spot-check: ${final.name}`);
    setRandomPick(null);
  };

  const highRisk = facilities.filter(f => f.complianceStatus === "non_compliant" || f.complianceStatus === "suspended");

  if (loading) return <div className="p-8 flex items-center justify-center min-h-screen"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-16 h-16 rounded-full border-4 border-neon-orange/30 border-t-neon-orange" /></div>;

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <motion.h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-neon-orange to-neon-pink bg-clip-text text-transparent" style={{ backgroundSize: "200% 200%" }} animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }} transition={{ duration: 6, repeat: Infinity }}>Spot-Check Enforcement</motion.h1>
        <p className="text-gray-500 mt-2">Trigger unannounced inspections</p>
      </motion.div>

      {/* Trigger Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <AnimatedCard delay={0.1} glowColor="rgba(249,115,22,0.15)">
          <div className="p-6 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10 blur-3xl bg-orange-500" />
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} style={{ display: "inline-block" }}>🎯</motion.span> Targeted Spot Check</h3>
            <p className="text-sm text-gray-400 mb-4">Select a specific facility for inspection</p>
            <div className="flex gap-3">
              <select value={selectedFacility} onChange={(e) => setSelectedFacility(e.target.value)} className={inputClass + " flex-1"}>
                <option value="">Select facility...</option>
                {facilities.map(f => (<option key={f.id} value={f.id}>{f.name} — {f.city}</option>))}
              </select>
              <GlowButton variant="warning" disabled={!selectedFacility || creating} onClick={() => triggerSpotCheck(selectedFacility, "Targeted spot-check")}>
                Trigger
              </GlowButton>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.2} glowColor="rgba(239,68,68,0.15)">
          <div className="p-6 relative overflow-hidden text-center">
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full opacity-10 blur-3xl bg-red-500" />
            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="text-5xl mb-3" style={{ display: "inline-block" }}>🎲</motion.div>
            <h3 className="font-bold text-lg mb-2">Random Spot Check</h3>
            <p className="text-sm text-gray-400 mb-4">Randomly select for surprise enforcement</p>
            {randomPick && (
              <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="mb-4 py-3 px-4 rounded-xl text-xl font-black" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                {randomPick}
              </motion.div>
            )}
            <GlowButton variant="danger" disabled={creating || facilities.length === 0} onClick={triggerRandom} className="w-full text-lg py-4">
              {creating ? "🎰 Selecting..." : "🎲 Random Spot Check"}
            </GlowButton>
          </div>
        </AnimatedCard>
      </div>

      {/* High Risk */}
      {highRisk.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ display: "inline-block" }}>⚠️</motion.span>
            Priority Facilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {highRisk.map((f, i) => (
              <AnimatedCard key={f.id} delay={0.4 + i * 0.05} glowColor="rgba(239,68,68,0.2)">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-white/90">{f.name}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: f.complianceStatus === "suspended" ? "rgba(107,114,128,0.2)" : "rgba(239,68,68,0.2)", color: f.complianceStatus === "suspended" ? "#9ca3af" : "#f87171" }}>
                      {f.complianceStatus.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{f.city} · {f.type.replace(/_/g, " ")}</p>
                  <GlowButton variant="danger" className="w-full" disabled={creating} onClick={() => triggerSpotCheck(f.id.toString(), `Priority spot-check: ${f.name}`)}>
                    Spot Check Now
                  </GlowButton>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Spot Checks */}
      <AnimatedCard delay={0.5} glowColor="rgba(99,102,241,0.08)">
        <div className="p-6">
          <h2 className="text-lg font-bold mb-6">Recent Spot Checks</h2>
          {spotChecks.length === 0 ? (
            <div className="text-center py-10"><motion.p animate={{ y: [0, -15, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-5xl mb-3">🔍</motion.p><p className="text-gray-500">No spot checks yet</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/5">{["Facility", "Date", "Status", "Score", "Notes"].map(h => (<th key={h} className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">{h}</th>))}</tr></thead>
                <tbody>
                  {spotChecks.map((sc, i) => (
                    <motion.tr key={sc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-white/[0.03] hover:bg-white/[0.03] transition">
                      <td className="py-3 px-4 font-medium text-white/80">{sc.facilityName || "Unknown"}</td>
                      <td className="py-3 px-4 text-gray-400 text-xs">{new Date(sc.scheduledDate).toLocaleString()}</td>
                      <td className="py-3 px-4"><motion.span animate={sc.status !== "completed" ? { boxShadow: [`0 0 8px ${statusGlow[sc.status]}40`, `0 0 16px ${statusGlow[sc.status]}60`, `0 0 8px ${statusGlow[sc.status]}40`] } : {}} transition={{ duration: 2, repeat: Infinity }} className="px-2.5 py-1 rounded-full text-xs font-bold capitalize" style={{ background: `${statusGlow[sc.status] || "#6b7280"}20`, color: statusGlow[sc.status] || "#6b7280" }}>{sc.status.replace(/_/g, " ")}</motion.span></td>
                      <td className="py-3 px-4">{sc.overallScore !== null ? (<span className="font-black" style={{ color: sc.overallScore >= 80 ? "#22c55e" : sc.overallScore >= 60 ? "#f59e0b" : "#ef4444" }}>{sc.overallScore}%</span>) : "—"}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs max-w-[200px] truncate">{sc.notes || "—"}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AnimatedCard>
    </div>
  );
}
