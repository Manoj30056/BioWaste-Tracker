"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import AnimatedCard from "@/components/AnimatedCard";
import GlowButton from "@/components/GlowButton";

interface Violation {
  id: number; inspectionId: number; facilityId: number; facilityName: string | null;
  severity: string; category: string; description: string; correctiveAction: string | null;
  deadline: string | null; resolvedAt: string | null; isResolved: boolean;
  fineAmount: string | null; createdAt: string;
}

const sevStyles: Record<string, { color: string; icon: string; glow: string }> = {
  minor: { color: "#f59e0b", icon: "⚡", glow: "rgba(245,158,11,0.2)" },
  major: { color: "#f97316", icon: "⚠️", glow: "rgba(249,115,22,0.2)" },
  critical: { color: "#ef4444", icon: "🚨", glow: "rgba(239,68,68,0.3)" },
};

const inputClass = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all";

export default function ViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [resolvedFilter, setResolvedFilter] = useState("");

  const fetchViolations = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (resolvedFilter) p.set("resolved", resolvedFilter);
      const res = await fetch(`/api/violations?${p}`);
      const json = await res.json();
      setViolations(json.data || []); setTotal(json.total || 0);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [resolvedFilter]);

  useEffect(() => { fetchViolations(); }, [fetchViolations]);

  const handleResolve = async (id: number) => {
    await fetch(`/api/violations/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isResolved: true }) });
    await fetchViolations();
  };

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        <div>
          <motion.h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-neon-orange to-neon-pink bg-clip-text text-transparent" style={{ backgroundSize: "200% 200%" }} animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }} transition={{ duration: 6, repeat: Infinity }}>Violations</motion.h1>
          <p className="text-gray-500 mt-2">{total} violations tracked</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex gap-4 mb-8">
        <select value={resolvedFilter} onChange={(e) => setResolvedFilter(e.target.value)} className={inputClass + " w-48"}>
          <option value="">All</option><option value="false">Open</option><option value="true">Resolved</option>
        </select>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-20"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-12 h-12 rounded-full border-4 border-neon-orange/30 border-t-neon-orange" /></div>
      ) : violations.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center"><motion.p animate={{ y: [0, -15, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-5xl mb-4">🎉</motion.p><p className="text-gray-400">No violations found</p></div>
      ) : (
        <div className="space-y-4">
          {violations.map((v, i) => {
            const sev = sevStyles[v.severity] || sevStyles.minor;
            return (
              <AnimatedCard key={v.id} delay={i * 0.05} glowColor={sev.glow}>
                <div className={`p-6 relative overflow-hidden ${v.isResolved ? "opacity-60" : ""}`}>
                  <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-3xl" style={{ background: sev.color }} />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <motion.span animate={!v.isResolved ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 2, repeat: Infinity }} className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: `${sev.color}20`, color: sev.color, boxShadow: !v.isResolved ? `0 0 15px ${sev.color}30` : "none" }}>
                          {sev.icon} {v.severity.toUpperCase()}
                        </motion.span>
                        <span className="text-xs text-gray-500 bg-white/5 px-2.5 py-1 rounded-lg">{v.category}</span>
                        {v.isResolved && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-xs text-green-400 bg-green-500/10 px-2.5 py-1 rounded-lg font-bold">✓ Resolved</motion.span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-white/90 mb-1">{v.facilityName || "Unknown"}</h3>
                      <p className="text-gray-400 text-sm mb-4">{v.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="glass rounded-lg p-3"><p className="text-[10px] text-gray-500 uppercase tracking-wider">Fine</p><p className="font-bold" style={{ color: sev.color }}>{v.fineAmount ? `₹${parseFloat(v.fineAmount).toLocaleString()}` : "—"}</p></div>
                        <div className="glass rounded-lg p-3"><p className="text-[10px] text-gray-500 uppercase tracking-wider">Deadline</p><p className="font-bold text-white/80">{v.deadline ? new Date(v.deadline).toLocaleDateString() : "—"}</p></div>
                        <div className="glass rounded-lg p-3"><p className="text-[10px] text-gray-500 uppercase tracking-wider">Reported</p><p className="font-bold text-white/80">{new Date(v.createdAt).toLocaleDateString()}</p></div>
                        <div className="glass rounded-lg p-3"><p className="text-[10px] text-gray-500 uppercase tracking-wider">Action</p><p className="font-bold text-xs text-white/60">{v.correctiveAction || "Pending"}</p></div>
                      </div>
                    </div>
                    {!v.isResolved && (
                      <GlowButton variant="success" onClick={() => handleResolve(v.id)} className="shrink-0">
                        ✓ Resolve
                      </GlowButton>
                    )}
                  </div>
                </div>
              </AnimatedCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
