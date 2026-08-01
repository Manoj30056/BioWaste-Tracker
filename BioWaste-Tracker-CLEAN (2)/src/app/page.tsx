"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import AnimatedCard from "@/components/AnimatedCard";
import AnimatedCounter from "@/components/AnimatedCounter";
import GlowButton from "@/components/GlowButton";

interface DashboardData {
  facilities: {
    total: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  waste: {
    totalKgLast30Days: string;
    byCategory: Array<{ category: string; total: string; count: number }>;
  };
  inspections: {
    recent: Array<{
      id: number;
      facilityName: string | null;
      status: string;
      scheduledDate: string;
      isSpotCheck: boolean;
      overallScore: number | null;
    }>;
    byStatus: Array<{ status: string; count: number }>;
  };
  violations: {
    openCount: number;
    bySeverity: Array<{ severity: string; count: number }>;
  };
  recentWasteLogs: Array<{
    id: number;
    facilityName: string | null;
    category: string;
    quantityKg: string;
    createdAt: string;
  }>;
}

const categoryColors: Record<string, string> = {
  yellow: "#fbbf24",
  red: "#ef4444",
  blue: "#3b82f6",
  white: "#94a3b8",
  cytotoxic: "#a855f7",
  chemical: "#f97316",
  general: "#22c55e",
};

const categoryLabels: Record<string, string> = {
  yellow: "Infectious",
  red: "Contaminated",
  blue: "Glassware",
  white: "Sharps",
  cytotoxic: "Cytotoxic",
  chemical: "Chemical",
  general: "General",
};

const statusColorMap: Record<string, string> = {
  compliant: "#22c55e",
  non_compliant: "#ef4444",
  pending_review: "#f59e0b",
  suspended: "#6b7280",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await fetch("/api/seed", { method: "POST" });
      await fetchDashboard();
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border-4 border-primary-500/30 border-t-primary-500"
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Connection Error</h2>
        <p className="text-gray-500 mb-8">Could not connect to the database API.</p>
        <GlowButton onClick={() => window.location.reload()} variant="primary">
          Retry Connection
        </GlowButton>
      </div>
    );
  }

  const isEmpty = data.facilities.total === 0;

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex items-center justify-between mb-10"
      >
        <div>
          <motion.h1
            className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-primary-200 to-neon-green bg-clip-text text-transparent"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{ duration: 6, repeat: Infinity }}
            style={{ backgroundSize: "200% 200%" }}
          >
            Dashboard
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-500 mt-2 text-lg"
          >
            Biomedical waste tracking overview
          </motion.p>
        </div>
        {(isEmpty || (data && data.facilities.total > 0)) && (
          <GlowButton onClick={handleSeed} disabled={seeding} variant="success">
            {seeding ? "⏳ Seeding..." : "🌱 Seed Demo Data"}
          </GlowButton>
        )}
      </motion.div>

      {isEmpty ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 glass rounded-3xl"
        >
          <motion.div
            className="text-7xl mb-6"
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            📊
          </motion.div>
          <h2 className="text-2xl font-bold text-white/80 mb-3">
            No data yet
          </h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Click &quot;Seed Demo Data&quot; to populate the system with sample facilities,
            waste logs, and inspection records.
          </p>
        </motion.div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              {
                title: "Total Facilities",
                value: data!.facilities.total,
                icon: "🏥",
                color: "#6366f1",
                suffix: "",
              },
              {
                title: "Waste (30 days)",
                value: parseFloat(data!.waste.totalKgLast30Days || "0"),
                icon: "⚗️",
                color: "#00ff88",
                suffix: " kg",
                decimals: 1,
              },
              {
                title: "Open Violations",
                value: data!.violations.openCount,
                icon: "🚨",
                color: "#ef4444",
                suffix: "",
              },
              {
                title: "Inspections Done",
                value:
                  data!.inspections.byStatus.find(
                    (s) => s.status === "completed"
                  )?.count || 0,
                icon: "✅",
                color: "#00d4ff",
                suffix: "",
              },
            ].map((kpi, i) => (
              <AnimatedCard key={kpi.title} delay={i * 0.1} glowColor={kpi.color + "30"}>
                <div className="p-6 relative overflow-hidden">
                  {/* Floating icon */}
                  <motion.div
                    className="absolute top-4 right-4 text-4xl opacity-30"
                    animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: i * 0.3 }}
                  >
                    {kpi.icon}
                  </motion.div>

                  {/* Glow accent */}
                  <div
                    className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-3xl"
                    style={{ background: kpi.color }}
                  />

                  <p className="text-sm text-gray-400 font-medium mb-2 relative z-10">
                    {kpi.title}
                  </p>
                  <AnimatedCounter
                    value={kpi.value}
                    suffix={kpi.suffix}
                    decimals={kpi.decimals || 0}
                    className="text-4xl font-black relative z-10"
                    duration={2}
                  />
                </div>
              </AnimatedCard>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Compliance Status */}
            <AnimatedCard delay={0.4} glowColor="rgba(34, 197, 94, 0.1)">
              <div className="p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="animate-float" style={{ display: "inline-block" }}>🛡️</span>
                  Facility Compliance
                </h3>
                <div className="space-y-4">
                  {data!.facilities.byStatus.map((item, i) => {
                    const pct =
                      data!.facilities.total > 0
                        ? (item.count / data!.facilities.total) * 100
                        : 0;
                    const color = statusColorMap[item.status] || "#6b7280";
                    return (
                      <motion.div
                        key={item.status}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium capitalize text-gray-300">
                            {item.status.replace(/_/g, " ")}
                          </span>
                          <span className="text-sm font-bold" style={{ color }}>
                            {item.count} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1.2, delay: 0.6 + i * 0.1, ease: "easeOut" }}
                            className="h-full rounded-full relative"
                            style={{
                              background: `linear-gradient(90deg, ${color}, ${color}88)`,
                              boxShadow: `0 0 12px ${color}60`,
                            }}
                          >
                            <div className="absolute inset-0 animate-shimmer" />
                          </motion.div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </AnimatedCard>

            {/* Waste by Category - Circular style */}
            <AnimatedCard delay={0.5} glowColor="rgba(0, 212, 255, 0.1)">
              <div className="p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="animate-float-reverse" style={{ display: "inline-block" }}>🧪</span>
                  Waste by Category
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {data!.waste.byCategory.map((item, i) => {
                    const total = parseFloat(item.total || "0");
                    const color = categoryColors[item.category] || "#6b7280";
                    return (
                      <motion.div
                        key={item.category}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + i * 0.08 }}
                        whileHover={{ scale: 1.05 }}
                        className="p-3 rounded-xl relative overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${color}15, ${color}08)`,
                          border: `1px solid ${color}25`,
                        }}
                      >
                        <div
                          className="absolute top-0 right-0 w-12 h-12 rounded-full opacity-20 blur-xl"
                          style={{ background: color }}
                        />
                        <div
                          className="w-3 h-3 rounded-full mb-2"
                          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                        />
                        <p className="text-xs text-gray-400">
                          {categoryLabels[item.category] || item.category}
                        </p>
                        <p className="text-lg font-bold">{total.toFixed(1)} kg</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </AnimatedCard>
          </div>

          {/* Violations + Recent Inspections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            <AnimatedCard delay={0.6} glowColor="rgba(239, 68, 68, 0.1)">
              <div className="p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ display: "inline-block" }}
                  >
                    🚨
                  </motion.span>
                  Violations by Severity
                </h3>
                {data!.violations.bySeverity.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <motion.p
                      className="text-5xl mb-3"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      🎉
                    </motion.p>
                    <p className="text-gray-400">No open violations!</p>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {data!.violations.bySeverity.map((item, i) => {
                      const color =
                        item.severity === "critical"
                          ? "#ef4444"
                          : item.severity === "major"
                          ? "#f97316"
                          : "#f59e0b";
                      const icon =
                        item.severity === "critical"
                          ? "🔴"
                          : item.severity === "major"
                          ? "🟠"
                          : "🟡";
                      return (
                        <motion.div
                          key={item.severity}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 + i * 0.1 }}
                          whileHover={{ scale: 1.08 }}
                          className="text-center p-5 rounded-xl relative overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, ${color}18, ${color}08)`,
                            border: `1px solid ${color}30`,
                          }}
                        >
                          <motion.div
                            className="absolute inset-0 opacity-20"
                            animate={{
                              boxShadow: [
                                `inset 0 0 30px ${color}00`,
                                `inset 0 0 30px ${color}40`,
                                `inset 0 0 30px ${color}00`,
                              ],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          <p className="text-2xl mb-1">{icon}</p>
                          <AnimatedCounter
                            value={item.count}
                            className="text-3xl font-black"
                          />
                          <p className="text-xs text-gray-400 capitalize mt-1">
                            {item.severity}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </AnimatedCard>

            <AnimatedCard delay={0.7} glowColor="rgba(168, 85, 247, 0.1)">
              <div className="p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="animate-float-slow" style={{ display: "inline-block" }}>📋</span>
                  Recent Inspections
                </h3>
                <div className="space-y-3">
                  {data!.inspections.recent.map((insp, i) => (
                    <motion.div
                      key={insp.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.08 }}
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-all"
                    >
                      <div>
                        <p className="font-medium text-sm text-white/90">
                          {insp.facilityName || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          {new Date(insp.scheduledDate).toLocaleDateString()}
                          {insp.isSpotCheck && (
                            <motion.span
                              animate={{ opacity: [0.7, 1, 0.7] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded text-[10px] font-bold tracking-wide"
                            >
                              SPOT CHECK
                            </motion.span>
                          )}
                        </p>
                      </div>
                      {insp.overallScore !== null ? (
                        <motion.span
                          className={`text-lg font-black ${
                            insp.overallScore >= 80
                              ? "text-green-400"
                              : insp.overallScore >= 60
                              ? "text-yellow-400"
                              : "text-red-400"
                          }`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1 + i * 0.08, type: "spring" }}
                        >
                          {insp.overallScore}%
                        </motion.span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 bg-primary-500/20 text-primary-300 rounded-full capitalize">
                          {insp.status.replace(/_/g, " ")}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </AnimatedCard>
          </div>

          {/* Recent Waste Logs Table */}
          <AnimatedCard delay={0.8} glowColor="rgba(0, 255, 136, 0.08)">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <span className="animate-float" style={{ display: "inline-block" }}>📝</span>
                Recent Waste Logs
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["Facility", "Category", "Quantity", "Date"].map((h) => (
                        <th key={h} className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data!.recentWasteLogs.map((log, i) => (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 + i * 0.05 }}
                        className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="py-3 px-4 text-white/80">
                          {log.facilityName || "Unknown"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-2">
                            <motion.span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{
                                background: categoryColors[log.category] || "#6b7280",
                                boxShadow: `0 0 8px ${categoryColors[log.category] || "#6b7280"}60`,
                              }}
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                            />
                            <span className="text-gray-400 text-xs">
                              {categoryLabels[log.category] || log.category}
                            </span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-white/70">
                          {parseFloat(log.quantityKg).toFixed(2)} kg
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </AnimatedCard>
        </>
      )}
    </div>
  );
}
