"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import AnimatedCard from "@/components/AnimatedCard";
import GlowButton from "@/components/GlowButton";
import ModalWrapper from "@/components/ModalWrapper";

interface Facility {
  id: number;
  name: string;
  type: string;
  licenseNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string | null;
  bedCount: number | null;
  complianceStatus: string;
  isActive: boolean;
  createdAt: string;
}

const facilityTypes = [
  { value: "clinic", label: "Clinic" },
  { value: "nursing_home", label: "Nursing Home" },
  { value: "lab", label: "Laboratory" },
  { value: "dental", label: "Dental Clinic" },
  { value: "veterinary", label: "Veterinary" },
  { value: "other", label: "Other" },
];

const statusStyles: Record<string, { bg: string; text: string; glow: string }> = {
  compliant: { bg: "rgba(34,197,94,0.15)", text: "#4ade80", glow: "rgba(34,197,94,0.3)" },
  non_compliant: { bg: "rgba(239,68,68,0.15)", text: "#f87171", glow: "rgba(239,68,68,0.3)" },
  pending_review: { bg: "rgba(245,158,11,0.15)", text: "#fbbf24", glow: "rgba(245,158,11,0.3)" },
  suspended: { bg: "rgba(107,114,128,0.15)", text: "#9ca3af", glow: "rgba(107,114,128,0.3)" },
};

const emptyForm = {
  name: "", type: "clinic", licenseNumber: "", address: "", city: "",
  state: "", pincode: "", contactPerson: "", contactPhone: "",
  contactEmail: "", bedCount: "", complianceStatus: "pending_review",
};

const inputClass = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all";

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchFacilities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/facilities?${params}`);
      const json = await res.json();
      setFacilities(json.data || []);
      setTotal(json.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchFacilities(); }, [fetchFacilities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editId ? `/api/facilities/${editId}` : "/api/facilities";
      await fetch(url, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setShowForm(false);
      setForm(emptyForm);
      setEditId(null);
      await fetchFacilities();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleEdit = (f: Facility) => {
    setForm({
      name: f.name, type: f.type, licenseNumber: f.licenseNumber,
      address: f.address, city: f.city, state: f.state, pincode: f.pincode,
      contactPerson: f.contactPerson, contactPhone: f.contactPhone,
      contactEmail: f.contactEmail || "", bedCount: f.bedCount?.toString() || "",
      complianceStatus: f.complianceStatus,
    });
    setEditId(f.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this facility?")) return;
    await fetch(`/api/facilities/${id}`, { method: "DELETE" });
    await fetchFacilities();
  };

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex items-center justify-between mb-8">
        <div>
          <motion.h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-primary-200 to-neon-blue bg-clip-text text-transparent" style={{ backgroundSize: "200% 200%" }} animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }} transition={{ duration: 6, repeat: Infinity }}>
            Facilities
          </motion.h1>
          <p className="text-gray-500 mt-2">{total} registered facilities</p>
        </div>
        <GlowButton onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }}>
          + Add Facility
        </GlowButton>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex gap-4 mb-8 flex-wrap">
        <input type="text" placeholder="🔍 Search facilities..." value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputClass} max-w-md flex-1`} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass + " w-48"}>
          <option value="">All Statuses</option>
          <option value="compliant">Compliant</option>
          <option value="non_compliant">Non-Compliant</option>
          <option value="pending_review">Pending Review</option>
          <option value="suspended">Suspended</option>
        </select>
      </motion.div>

      {/* Facility Cards */}
      {loading ? (
        <div className="flex justify-center py-20">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-12 h-12 rounded-full border-4 border-primary-500/30 border-t-primary-500" />
        </div>
      ) : facilities.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <motion.p animate={{ y: [0, -15, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-5xl mb-4">🏥</motion.p>
          <p className="text-gray-400">No facilities found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {facilities.map((f, i) => {
            const st = statusStyles[f.complianceStatus] || statusStyles.suspended;
            return (
              <AnimatedCard key={f.id} delay={i * 0.05} glowColor={st.glow}>
                <div className="p-6 relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-2xl" style={{ background: st.text }} />

                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-white/90">{f.name}</h3>
                      <p className="text-xs text-gray-500 capitalize">{f.type.replace(/_/g, " ")}</p>
                    </div>
                    <motion.span whileHover={{ scale: 1.1 }} className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: st.bg, color: st.text }}>
                      {f.complianceStatus.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </motion.span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-400 mb-4">
                    <p>📍 {f.city}, {f.state}</p>
                    <p>👤 {f.contactPerson}</p>
                    <p className="font-mono text-xs">🪪 {f.licenseNumber}</p>
                    {f.bedCount && <p>🛏️ {f.bedCount} beds</p>}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-white/5">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleEdit(f)} className="flex-1 px-3 py-2 rounded-lg bg-primary-500/10 text-primary-400 text-xs font-medium hover:bg-primary-500/20 transition">
                      Edit
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleDelete(f.id)} className="flex-1 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition">
                      Delete
                    </motion.button>
                  </div>
                </div>
              </AnimatedCard>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <ModalWrapper isOpen={showForm} onClose={() => { setShowForm(false); setEditId(null); }} title={editId ? "Edit Facility" : "Add New Facility"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Name *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Type *</label><select required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass}>{facilityTypes.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}</select></div>
            <div><label className="block text-xs font-medium text-gray-400 mb-1.5">License # *</label><input required value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Beds</label><input type="number" value={form.bedCount} onChange={(e) => setForm({ ...form, bedCount: e.target.value })} className={inputClass} /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Address *</label><textarea required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className={inputClass} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-gray-400 mb-1.5">City *</label><input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-gray-400 mb-1.5">State *</label><input required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Pincode *</label><input required value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} className={inputClass} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Contact *</label><input required value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Phone *</label><input required value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label><input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className={inputClass} /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label><select value={form.complianceStatus} onChange={(e) => setForm({ ...form, complianceStatus: e.target.value })} className={inputClass}><option value="pending_review">Pending Review</option><option value="compliant">Compliant</option><option value="non_compliant">Non-Compliant</option><option value="suspended">Suspended</option></select></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setShowForm(false); setEditId(null); }} className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition">Cancel</motion.button>
            <GlowButton type="submit" disabled={submitting} variant="success">{submitting ? "Saving..." : editId ? "Update" : "Create"}</GlowButton>
          </div>
        </form>
      </ModalWrapper>
    </div>
  );
}
