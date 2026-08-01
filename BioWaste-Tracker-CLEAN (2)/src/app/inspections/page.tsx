"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import AnimatedCard from "@/components/AnimatedCard";
import GlowButton from "@/components/GlowButton";
import ModalWrapper from "@/components/ModalWrapper";

interface Inspection {
  id: number; facilityId: number; facilityName: string | null; facilityType: string | null;
  status: string; scheduledDate: string; completedDate: string | null; isSpotCheck: boolean;
  overallScore: number | null; segregationScore: number | null; storageScore: number | null;
  documentationScore: number | null; trainingScore: number | null; notes: string | null; createdAt: string;
}
interface FacilityOption { id: number; name: string; }

const statusGlow: Record<string, string> = { scheduled: "#3b82f6", in_progress: "#f59e0b", completed: "#22c55e", cancelled: "#6b7280" };
const inputClass = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all";

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [facilitiesList, setFacilitiesList] = useState<FacilityOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<Inspection | null>(null);
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ facilityId: "", scheduledDate: "", isSpotCheck: false, notes: "" });
  const [scoreForm, setScoreForm] = useState({ overallScore: "", segregationScore: "", storageScore: "", documentationScore: "", trainingScore: "", notes: "" });

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (statusFilter) p.set("status", statusFilter);
      const res = await fetch(`/api/inspections?${p}`);
      const json = await res.json();
      setInspections(json.data || []); setTotal(json.total || 0);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [statusFilter]);

  const fetchFacilities = useCallback(async () => {
    try {
      const res = await fetch("/api/facilities?limit=100");
      const json = await res.json();
      setFacilitiesList((json.data || []).map((f: FacilityOption) => ({ id: f.id, name: f.name })));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchInspections(); fetchFacilities(); }, [fetchInspections, fetchFacilities]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try { await fetch("/api/inspections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); setShowForm(false); setForm({ facilityId: "", scheduledDate: "", isSpotCheck: false, notes: "" }); await fetchInspections(); } catch (e) { console.error(e); } finally { setSubmitting(false); }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault(); if (!showDetail) return; setSubmitting(true);
    try { await fetch(`/api/inspections/${showDetail.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "completed", ...scoreForm }) }); setShowScoreForm(false); setShowDetail(null); await fetchInspections(); } catch (e) { console.error(e); } finally { setSubmitting(false); }
  };

  const scoreColor = (s: number | null) => s === null ? "#6b7280" : s >= 80 ? "#22c55e" : s >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        <div>
          <motion.h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-neon-blue to-neon-purple bg-clip-text text-transparent" style={{ backgroundSize: "200% 200%" }} animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }} transition={{ duration: 6, repeat: Infinity }}>Inspections</motion.h1>
          <p className="text-gray-500 mt-2">{total} inspections tracked</p>
        </div>
        <GlowButton onClick={() => setShowForm(true)}>+ Schedule Inspection</GlowButton>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex gap-4 mb-8">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass + " w-48"}>
          <option value="">All Statuses</option><option value="scheduled">Scheduled</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
        </select>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-20"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-12 h-12 rounded-full border-4 border-neon-blue/30 border-t-neon-blue" /></div>
      ) : inspections.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center"><motion.p animate={{ y: [0, -15, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-5xl mb-4">📋</motion.p><p className="text-gray-400">No inspections found</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {inspections.map((insp, i) => {
            const glowC = statusGlow[insp.status] || "#6b7280";
            return (
              <AnimatedCard key={insp.id} delay={i * 0.05} glowColor={glowC + "30"}>
                <div className="p-6 relative overflow-hidden cursor-pointer" onClick={() => setShowDetail(insp)}>
                  <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-15 blur-2xl" style={{ background: glowC }} />
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-white/90">{insp.facilityName || "Unknown"}</h3>
                      <p className="text-xs text-gray-500 capitalize">{(insp.facilityType || "").replace(/_/g, " ")}</p>
                    </div>
                    <motion.span animate={{ boxShadow: [`0 0 10px ${glowC}40`, `0 0 20px ${glowC}60`, `0 0 10px ${glowC}40`] }} transition={{ duration: 2, repeat: Infinity }} className="px-3 py-1 rounded-full text-xs font-bold capitalize" style={{ background: `${glowC}20`, color: glowC }}>
                      {insp.status.replace(/_/g, " ")}
                    </motion.span>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1 mb-4">
                    <p>📅 {new Date(insp.scheduledDate).toLocaleDateString()}</p>
                    {insp.isSpotCheck && (<motion.p animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-orange-400 font-bold text-xs">🔍 SPOT CHECK</motion.p>)}
                  </div>
                  {insp.overallScore !== null && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        <motion.div className="text-3xl font-black" style={{ color: scoreColor(insp.overallScore) }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                          {insp.overallScore}%
                        </motion.div>
                        <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${insp.overallScore}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full rounded-full" style={{ background: scoreColor(insp.overallScore), boxShadow: `0 0 10px ${scoreColor(insp.overallScore)}` }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </AnimatedCard>
            );
          })}
        </div>
      )}

      {/* Schedule Modal */}
      <ModalWrapper isOpen={showForm} onClose={() => setShowForm(false)} title="Schedule Inspection">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Facility *</label><select required value={form.facilityId} onChange={(e) => setForm({ ...form, facilityId: e.target.value })} className={inputClass}><option value="">Select...</option>{facilitiesList.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}</select></div>
          <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Date *</label><input required type="datetime-local" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} className={inputClass} /></div>
          <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.isSpotCheck} onChange={(e) => setForm({ ...form, isSpotCheck: e.target.checked })} className="w-5 h-5 rounded bg-white/5 border-white/10" /><span className="text-sm">Spot Check (Unannounced)</span></label>
          <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className={inputClass} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white transition">Cancel</motion.button>
            <GlowButton type="submit" disabled={submitting}>{submitting ? "Creating..." : "Schedule"}</GlowButton>
          </div>
        </form>
      </ModalWrapper>

      {/* Detail Modal */}
      <ModalWrapper isOpen={!!showDetail && !showScoreForm} onClose={() => setShowDetail(null)} title="Inspection Details">
        {showDetail && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="glass rounded-xl p-4"><p className="text-xs text-gray-500 mb-1">Facility</p><p className="font-bold">{showDetail.facilityName}</p></div>
              <div className="glass rounded-xl p-4"><p className="text-xs text-gray-500 mb-1">Date</p><p className="font-bold">{new Date(showDetail.scheduledDate).toLocaleString()}</p></div>
              <div className="glass rounded-xl p-4"><p className="text-xs text-gray-500 mb-1">Status</p><p className="font-bold capitalize" style={{ color: statusGlow[showDetail.status] }}>{showDetail.status.replace(/_/g, " ")}</p></div>
              <div className="glass rounded-xl p-4"><p className="text-xs text-gray-500 mb-1">Type</p><p className="font-bold">{showDetail.isSpotCheck ? "🔍 Spot Check" : "📋 Scheduled"}</p></div>
            </div>
            {showDetail.overallScore !== null && (
              <div className="glass rounded-xl p-6">
                <h3 className="font-bold mb-4">Scores</h3>
                <div className="space-y-3">
                  {[
                    { label: "Overall", score: showDetail.overallScore },
                    { label: "Segregation", score: showDetail.segregationScore },
                    { label: "Storage", score: showDetail.storageScore },
                    { label: "Documentation", score: showDetail.documentationScore },
                    { label: "Training", score: showDetail.trainingScore },
                  ].filter(s => s.score !== null).map((s) => (
                    <div key={s.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">{s.label}</span>
                        <span className="font-bold" style={{ color: scoreColor(s.score) }}>{s.score}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${s.score}%` }} transition={{ duration: 1.2 }} className="h-full rounded-full" style={{ background: scoreColor(s.score), boxShadow: `0 0 8px ${scoreColor(s.score)}` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {showDetail.notes && <div className="glass rounded-xl p-4"><p className="text-xs text-gray-500 mb-1">Notes</p><p className="text-sm">{showDetail.notes}</p></div>}
            {showDetail.status !== "completed" && showDetail.status !== "cancelled" && (
              <GlowButton variant="success" className="w-full" onClick={() => { setScoreForm({ overallScore: "", segregationScore: "", storageScore: "", documentationScore: "", trainingScore: "", notes: showDetail.notes || "" }); setShowScoreForm(true); }}>
                ✅ Complete Inspection
              </GlowButton>
            )}
          </div>
        )}
      </ModalWrapper>

      {/* Score Entry Modal */}
      <ModalWrapper isOpen={showScoreForm} onClose={() => setShowScoreForm(false)} title={`Complete — ${showDetail?.facilityName}`}>
        <form onSubmit={handleComplete} className="space-y-4">
          <p className="text-sm text-gray-400">Enter scores (0-100):</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "overallScore" as const, label: "Overall *", req: true },
              { key: "segregationScore" as const, label: "Segregation", req: false },
              { key: "storageScore" as const, label: "Storage", req: false },
              { key: "documentationScore" as const, label: "Documentation", req: false },
              { key: "trainingScore" as const, label: "Training", req: false },
            ].map((field) => (
              <div key={field.key}><label className="block text-xs font-medium text-gray-400 mb-1.5">{field.label}</label><input required={field.req} type="number" min="0" max="100" value={scoreForm[field.key]} onChange={(e) => setScoreForm({ ...scoreForm, [field.key]: e.target.value })} className={inputClass} /></div>
            ))}
          </div>
          <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Notes</label><textarea value={scoreForm.notes} onChange={(e) => setScoreForm({ ...scoreForm, notes: e.target.value })} rows={3} className={inputClass} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <motion.button type="button" whileHover={{ scale: 1.02 }} onClick={() => setShowScoreForm(false)} className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white transition">Cancel</motion.button>
            <GlowButton type="submit" disabled={submitting} variant="success">{submitting ? "Completing..." : "Complete"}</GlowButton>
          </div>
        </form>
      </ModalWrapper>
    </div>
  );
}
