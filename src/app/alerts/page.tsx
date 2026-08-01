"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import AnimatedCard from "@/components/AnimatedCard";
import GlowButton from "@/components/GlowButton";

interface Alert {
  id: number;
  type: string;
  status: string;
  title: string;
  message: string;
  severity: string;
  facilityId: number | null;
  facilityName: string | null;
  wasteLogId: number | null;
  violationId: number | null;
  inspectionId: number | null;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

const typeIcons: Record<string, string> = {
  overdue_collection: "⏰",
  violation_found: "⚠️",
  non_compliant: "🚫",
  inspection_due: "📋",
  critical_waste: "☣️",
};

const severityStyles: Record<string, { bg: string; border: string; text: string }> = {
  low: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)", text: "#4ade80" },
  medium: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", text: "#fbbf24" },
  high: { bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.3)", text: "#fb923c" },
  critical: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", text: "#f87171" },
};

const statusStyles: Record<string, { bg: string; text: string }> = {
  active: { bg: "rgba(239,68,68,0.15)", text: "#f87171" },
  acknowledged: { bg: "rgba(245,158,11,0.15)", text: "#fbbf24" },
  resolved: { bg: "rgba(34,197,94,0.15)", text: "#4ade80" },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("active");
  const [generating, setGenerating] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/alerts?${params}`);
      const json = await res.json();
      setAlerts(json.data || []);
      setTotal(json.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const generateAlerts = async () => {
    setGenerating(true);
    try {
      await fetch("/api/alerts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      await fetchAlerts();
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const updateAlert = async (id: number, status: string) => {
    try {
      await fetch(`/api/alerts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await fetchAlerts();
    } catch (e) {
      console.error(e);
    }
  };

  const activeCount = alerts.filter((a) => a.status === "active").length;
  const criticalCount = alerts.filter((a) => a.severity === "critical" && a.status === "active").length;

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <motion.h1
            className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-red-400 to-orange-400 bg-clip-text text-transparent"
            style={{ backgroundSize: "200% 200%" }}
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 6, repeat: Infinity }}
          >
            Alerts & Notifications
          </motion.h1>
          <p className="text-gray-500 mt-2">
            {total} alerts · {criticalCount} critical
          </p>
        </div>
        <GlowButton onClick={generateAlerts} disabled={generating} variant="warning">
          {generating ? "Checking..." : "🔄 Check for Issues"}
        </GlowButton>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active Alerts", value: activeCount, color: "#ef4444", icon: "🔔" },
          { label: "Critical", value: criticalCount, color: "#dc2626", icon: "🚨" },
          { label: "Acknowledged", value: alerts.filter((a) => a.status === "acknowledged").length, color: "#f59e0b", icon: "👁️" },
          { label: "Resolved", value: alerts.filter((a) => a.status === "resolved").length, color: "#22c55e", icon: "✅" },
        ].map((stat, i) => (
          <AnimatedCard key={stat.label} delay={i * 0.1} glowColor={stat.color + "20"}>
            <div className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-3xl font-black" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
              <span className="text-3xl">{stat.icon}</span>
            </div>
          </AnimatedCard>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-2 mb-6"
      >
        {["active", "acknowledged", "resolved", ""].map((s) => (
          <motion.button
            key={s || "all"}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              statusFilter === s
                ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
            }`}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
          </motion.button>
        ))}
      </motion.div>

      {/* Alerts List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 rounded-full border-4 border-red-500/30 border-t-red-500"
          />
        </div>
      ) : alerts.length === 0 ? (
        <AnimatedCard delay={0.3}>
          <div className="p-16 text-center">
            <motion.p
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.p>
            <p className="text-gray-400 text-lg">No alerts found</p>
            <p className="text-gray-600 text-sm mt-2">
              All systems running smoothly
            </p>
          </div>
        </AnimatedCard>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert, i) => {
            const sev = severityStyles[alert.severity] || severityStyles.medium;
            const stat = statusStyles[alert.status] || statusStyles.active;
            return (
              <AnimatedCard key={alert.id} delay={i * 0.05} glowColor={sev.border}>
                <div className="p-6 relative overflow-hidden">
                  <div
                    className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-3xl"
                    style={{ background: sev.text }}
                  />

                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <motion.div
                      animate={
                        alert.status === "active"
                          ? { scale: [1, 1.2, 1] }
                          : {}
                      }
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-4xl"
                    >
                      {typeIcons[alert.type] || "🔔"}
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-bold text-lg text-white/90">
                          {alert.title}
                        </h3>
                        <span
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase"
                          style={{ background: sev.bg, color: sev.text, border: `1px solid ${sev.border}` }}
                        >
                          {alert.severity}
                        </span>
                        <span
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase"
                          style={{ background: stat.bg, color: stat.text }}
                        >
                          {alert.status}
                        </span>
                      </div>

                      <p className="text-gray-400 text-sm mb-3">
                        {alert.message}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {alert.facilityName && (
                          <span>🏥 {alert.facilityName}</span>
                        )}
                        <span>
                          🕐 {new Date(alert.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {alert.status === "active" && (
                        <GlowButton
                          onClick={() => updateAlert(alert.id, "acknowledged")}
                          variant="warning"
                          className="text-xs px-3 py-1.5"
                        >
                          👁️ Acknowledge
                        </GlowButton>
                      )}
                      {(alert.status === "active" ||
                        alert.status === "acknowledged") && (
                        <GlowButton
                          onClick={() => updateAlert(alert.id, "resolved")}
                          variant="success"
                          className="text-xs px-3 py-1.5"
                        >
                          ✅ Resolve
                        </GlowButton>
                      )}
                    </div>
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
