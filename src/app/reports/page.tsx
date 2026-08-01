"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import AnimatedCard from "@/components/AnimatedCard";
import AnimatedCounter from "@/components/AnimatedCounter";
import GlowButton from "@/components/GlowButton";

interface ReportData {
  generatedAt: string;
  periodDays: number;
  startDate: string;
  endDate: string;
  summary: {
    facilities: {
      total: number;
      compliant: number;
      nonCompliant: number;
      pendingReview: number;
      suspended: number;
      complianceRate: string;
    };
    waste: {
      totalKg: string;
      totalEntries: number;
      byCategory: Array<{ category: string; totalKg: string; entries: number }>;
      collected: number;
      pendingCollection: number;
      collectionRate: string;
    };
    inspections: {
      total: number;
      completed: number;
      scheduled: number;
      spotChecks: number;
      averageScore: string;
    };
    violations: {
      total: number;
      resolved: number;
      open: number;
      critical: number;
      major: number;
      minor: number;
      resolutionRate: string;
    };
    alerts: {
      total: number;
      active: number;
      acknowledged: number;
      resolved: number;
    };
  };
  details: {
    recentViolations: Array<{
      id: number;
      facilityName: string | null;
      severity: string;
      category: string;
      description: string;
      isResolved: boolean;
      createdAt: string;
    }>;
    highRiskFacilities: Array<{
      id: number;
      name: string;
      type: string;
      city: string;
      complianceStatus: string;
      violationCount: number;
    }>;
  };
}

const catLabels: Record<string, string> = {
  yellow: "Yellow (Infectious)",
  red: "Red (Contaminated)",
  blue: "Blue (Glassware)",
  white: "White (Sharps)",
  cytotoxic: "Cytotoxic",
  chemical: "Chemical",
  general: "General",
};

const catColors: Record<string, string> = {
  yellow: "#fbbf24",
  red: "#ef4444",
  blue: "#3b82f6",
  white: "#94a3b8",
  cytotoxic: "#a855f7",
  chemical: "#f97316",
  general: "#22c55e",
};

const statusColor: Record<string, string> = {
  compliant: "#22c55e",
  non_compliant: "#ef4444",
  pending_review: "#f59e0b",
  suspended: "#6b7280",
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/generate?days=${days}`);
      setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePrintReport = () => {
    setGenerating(true);
    setTimeout(() => {
      window.print();
      setGenerating(false);
    }, 500);
  };

  const handleDownloadPDF = async () => {
    setGenerating(true);
    
    // Create a printable version
    const printWindow = window.open("", "_blank");
    if (!printWindow || !data) {
      setGenerating(false);
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>BioWaste Compliance Report - ${new Date().toLocaleDateString()}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5; font-size: 11pt; }
          .header { text-align: center; padding: 20px 0; border-bottom: 3px solid #6366f1; margin-bottom: 20px; }
          .header h1 { color: #6366f1; font-size: 24pt; margin-bottom: 5px; }
          .header p { color: #6b7280; font-size: 10pt; }
          .section { margin-bottom: 25px; break-inside: avoid; }
          .section-title { font-size: 14pt; font-weight: bold; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
          .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; text-align: center; }
          .stat-value { font-size: 24pt; font-weight: bold; color: #6366f1; }
          .stat-label { font-size: 9pt; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 10pt; }
          th { background: #f3f4f6; font-weight: bold; color: #374151; }
          .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 9pt; font-weight: bold; }
          .badge-critical { background: #fee2e2; color: #991b1b; }
          .badge-major { background: #ffedd5; color: #9a3412; }
          .badge-minor { background: #fef3c7; color: #92400e; }
          .progress-bar { height: 10px; background: #e5e7eb; border-radius: 5px; overflow: hidden; }
          .progress-fill { height: 100%; border-radius: 5px; }
          .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; margin-top: 30px; color: #6b7280; font-size: 9pt; }
          .alert-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; margin-bottom: 15px; }
          .alert-box.critical { background: #fee2e2; border-color: #ef4444; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>☣️ BioWaste Compliance Report</h1>
          <p>Period: ${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()} (${data.periodDays} days)</p>
          <p>Generated: ${new Date(data.generatedAt).toLocaleString()}</p>
        </div>

        <div class="section">
          <div class="section-title">📊 Executive Summary</div>
          <div class="grid">
            <div class="stat-card">
              <div class="stat-value">${data.summary.facilities.complianceRate}%</div>
              <div class="stat-label">Compliance Rate</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${data.summary.waste.totalKg}</div>
              <div class="stat-label">Total Waste (kg)</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${data.summary.violations.open}</div>
              <div class="stat-label">Open Violations</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${data.summary.inspections.completed}</div>
              <div class="stat-label">Inspections Done</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">🏥 Facility Status</div>
          <table>
            <tr><th>Status</th><th>Count</th><th>Percentage</th></tr>
            <tr><td>✅ Compliant</td><td>${data.summary.facilities.compliant}</td><td>${data.summary.facilities.total > 0 ? (data.summary.facilities.compliant / data.summary.facilities.total * 100).toFixed(1) : 0}%</td></tr>
            <tr><td>⏳ Pending Review</td><td>${data.summary.facilities.pendingReview}</td><td>${data.summary.facilities.total > 0 ? (data.summary.facilities.pendingReview / data.summary.facilities.total * 100).toFixed(1) : 0}%</td></tr>
            <tr><td>❌ Non-Compliant</td><td>${data.summary.facilities.nonCompliant}</td><td>${data.summary.facilities.total > 0 ? (data.summary.facilities.nonCompliant / data.summary.facilities.total * 100).toFixed(1) : 0}%</td></tr>
            <tr><td>🚫 Suspended</td><td>${data.summary.facilities.suspended}</td><td>${data.summary.facilities.total > 0 ? (data.summary.facilities.suspended / data.summary.facilities.total * 100).toFixed(1) : 0}%</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">🗑️ Waste Generation by Category</div>
          <table>
            <tr><th>Category</th><th>Quantity (kg)</th><th>Entries</th><th>% of Total</th></tr>
            ${data.summary.waste.byCategory.map(c => `
              <tr>
                <td>${catLabels[c.category] || c.category}</td>
                <td>${c.totalKg}</td>
                <td>${c.entries}</td>
                <td>${parseFloat(data.summary.waste.totalKg) > 0 ? (parseFloat(c.totalKg) / parseFloat(data.summary.waste.totalKg) * 100).toFixed(1) : 0}%</td>
              </tr>
            `).join("")}
            <tr style="font-weight:bold;background:#f3f4f6;"><td>Total</td><td>${data.summary.waste.totalKg}</td><td>${data.summary.waste.totalEntries}</td><td>100%</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">⚠️ Violation Summary</div>
          <div class="grid" style="grid-template-columns: repeat(3, 1fr);">
            <div class="stat-card" style="border-left: 4px solid #ef4444;">
              <div class="stat-value" style="color:#ef4444;">${data.summary.violations.critical}</div>
              <div class="stat-label">Critical</div>
            </div>
            <div class="stat-card" style="border-left: 4px solid #f97316;">
              <div class="stat-value" style="color:#f97316;">${data.summary.violations.major}</div>
              <div class="stat-label">Major</div>
            </div>
            <div class="stat-card" style="border-left: 4px solid #f59e0b;">
              <div class="stat-value" style="color:#f59e0b;">${data.summary.violations.minor}</div>
              <div class="stat-label">Minor</div>
            </div>
          </div>
          ${data.details.recentViolations.length > 0 ? `
            <table>
              <tr><th>Facility</th><th>Severity</th><th>Category</th><th>Status</th><th>Date</th></tr>
              ${data.details.recentViolations.slice(0, 5).map(v => `
                <tr>
                  <td>${v.facilityName || "Unknown"}</td>
                  <td><span class="badge badge-${v.severity}">${v.severity.toUpperCase()}</span></td>
                  <td>${v.category}</td>
                  <td>${v.isResolved ? "✅ Resolved" : "⏳ Open"}</td>
                  <td>${new Date(v.createdAt).toLocaleDateString()}</td>
                </tr>
              `).join("")}
            </table>
          ` : "<p>No violations in this period.</p>"}
        </div>

        ${data.details.highRiskFacilities.length > 0 ? `
          <div class="section">
            <div class="section-title">🚨 High-Risk Facilities</div>
            <div class="alert-box critical">
              <strong>Action Required:</strong> The following facilities require immediate attention.
            </div>
            <table>
              <tr><th>Facility</th><th>Type</th><th>City</th><th>Status</th><th>Open Violations</th></tr>
              ${data.details.highRiskFacilities.map(f => `
                <tr>
                  <td><strong>${f.name}</strong></td>
                  <td>${f.type.replace(/_/g, " ")}</td>
                  <td>${f.city}</td>
                  <td style="color:${statusColor[f.complianceStatus] || "#6b7280"};font-weight:bold;">${f.complianceStatus.replace(/_/g, " ").toUpperCase()}</td>
                  <td>${f.violationCount}</td>
                </tr>
              `).join("")}
            </table>
          </div>
        ` : ""}

        <div class="footer">
          <p>This report was automatically generated by BioWaste Tracking System</p>
          <p>© ${new Date().getFullYear()} BioWaste Tracker | Confidential</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      setGenerating(false);
    }, 500);
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
      <div className="p-8 text-center text-gray-500">Failed to load report data.</div>
    );
  }

  const totalWaste = parseFloat(data.summary.waste.totalKg);

  return (
    <div className="p-6 lg:p-8 min-h-screen" ref={reportRef}>
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-10 print:mb-4"
      >
        <div>
          <motion.h1
            className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-primary-300 to-neon-purple bg-clip-text text-transparent print:text-black"
            style={{ backgroundSize: "200% 200%" }}
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 6, repeat: Infinity }}
          >
            Reports & Analytics
          </motion.h1>
          <p className="text-gray-500 mt-2">
            Comprehensive compliance analytics · Last {days} days
          </p>
        </div>
        <div className="flex gap-3 print:hidden">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
            <option value={365}>Last Year</option>
          </select>
          <GlowButton onClick={handleDownloadPDF} disabled={generating}>
            {generating ? "⏳ Generating..." : "📄 Download PDF"}
          </GlowButton>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {[
          {
            title: "Compliance Rate",
            value: parseFloat(data.summary.facilities.complianceRate),
            suffix: "%",
            decimals: 1,
            desc: `${data.summary.facilities.compliant}/${data.summary.facilities.total} facilities`,
            color: "#22c55e",
          },
          {
            title: "Total Waste",
            value: totalWaste,
            suffix: " kg",
            decimals: 1,
            desc: `${data.summary.waste.totalEntries} entries`,
            color: "#00d4ff",
          },
          {
            title: "Collection Rate",
            value: parseFloat(data.summary.waste.collectionRate),
            suffix: "%",
            decimals: 1,
            desc: `${data.summary.waste.collected} collected`,
            color: "#a855f7",
          },
          {
            title: "Open Violations",
            value: data.summary.violations.open,
            suffix: "",
            decimals: 0,
            desc: `${data.summary.violations.critical} critical`,
            color: "#ef4444",
          },
        ].map((card, i) => (
          <AnimatedCard key={card.title} delay={i * 0.1} glowColor={card.color + "20"}>
            <div className="p-6 relative overflow-hidden">
              <div
                className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-15 blur-2xl"
                style={{ background: card.color }}
              />
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
                {card.title}
              </p>
              <AnimatedCounter
                value={card.value}
                suffix={card.suffix}
                decimals={card.decimals}
                className="text-3xl font-black"
              />
              <p className="text-xs text-gray-500 mt-1">{card.desc}</p>
            </div>
          </AnimatedCard>
        ))}
      </div>

      {/* Waste Breakdown */}
      <AnimatedCard delay={0.4} glowColor="rgba(0,212,255,0.08)">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span>📊</span> Waste Generation by Category
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {["Category", "Quantity", "Entries", "% Total", "Distribution"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.summary.waste.byCategory.map((cat, i) => {
                  const qty = parseFloat(cat.totalKg);
                  const pct = totalWaste > 0 ? (qty / totalWaste) * 100 : 0;
                  const color = catColors[cat.category] || "#6b7280";
                  return (
                    <motion.tr
                      key={cat.category}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                      className="border-b border-white/[0.03] hover:bg-white/[0.03] transition"
                    >
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ background: color, boxShadow: `0 0 8px ${color}60` }}
                          />
                          <span className="text-white/80">
                            {catLabels[cat.category] || cat.category}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-white/70">{qty.toFixed(2)} kg</td>
                      <td className="py-3 px-4 text-gray-400">{cat.entries}</td>
                      <td className="py-3 px-4 text-gray-400">{pct.toFixed(1)}%</td>
                      <td className="py-3 px-4 w-48">
                        <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1.5, delay: 0.6 + i * 0.05 }}
                            className="h-full rounded-full"
                            style={{
                              background: `linear-gradient(90deg, ${color}, ${color}88)`,
                              boxShadow: `0 0 8px ${color}40`,
                            }}
                          />
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/10">
                  <td className="py-3 px-4 font-bold">Total</td>
                  <td className="py-3 px-4 font-mono font-bold">{totalWaste.toFixed(2)} kg</td>
                  <td className="py-3 px-4 font-bold">{data.summary.waste.totalEntries}</td>
                  <td className="py-3 px-4 font-bold">100%</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </AnimatedCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Compliance Breakdown */}
        <AnimatedCard delay={0.6} glowColor="rgba(34,197,94,0.08)">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6">🛡️ Compliance Breakdown</h2>
            <div className="space-y-5">
              {[
                { status: "compliant", count: data.summary.facilities.compliant, label: "Compliant" },
                { status: "pending_review", count: data.summary.facilities.pendingReview, label: "Pending Review" },
                { status: "non_compliant", count: data.summary.facilities.nonCompliant, label: "Non-Compliant" },
                { status: "suspended", count: data.summary.facilities.suspended, label: "Suspended" },
              ].map((item, i) => {
                const pct = data.summary.facilities.total > 0
                  ? (item.count / data.summary.facilities.total) * 100
                  : 0;
                const color = statusColor[item.status] || "#6b7280";
                return (
                  <motion.div
                    key={item.status}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                  >
                    <div className="flex justify-between text-sm mb-2">
                      <span className="capitalize text-gray-300">{item.label}</span>
                      <span className="font-bold" style={{ color }}>
                        {item.count} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-4 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.5, delay: 0.8 + i * 0.1 }}
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${color}, ${color}88)`,
                          boxShadow: `0 0 10px ${color}40`,
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </AnimatedCard>

        {/* Violations */}
        <AnimatedCard delay={0.7} glowColor="rgba(239,68,68,0.08)">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6">⚠️ Violation Severity</h2>
            {data.summary.violations.total === 0 ? (
              <div className="text-center py-10">
                <motion.p
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-5xl mb-3"
                >
                  🎉
                </motion.p>
                <p className="text-gray-400">No violations in this period!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {[
                  { severity: "critical", count: data.summary.violations.critical, color: "#ef4444", icon: "🔴" },
                  { severity: "major", count: data.summary.violations.major, color: "#f97316", icon: "🟠" },
                  { severity: "minor", count: data.summary.violations.minor, color: "#f59e0b", icon: "🟡" },
                ].map((item, i) => (
                  <motion.div
                    key={item.severity}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <motion.span
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                      className="text-3xl"
                      style={{ display: "inline-block" }}
                    >
                      {item.icon}
                    </motion.span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize font-medium text-gray-300">{item.severity}</span>
                        <span className="font-black text-xl" style={{ color: item.color }}>
                          {item.count}
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min((item.count / Math.max(data.summary.violations.total, 1)) * 100, 100)}%`,
                          }}
                          transition={{ duration: 1.2 }}
                          className="h-full rounded-full"
                          style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </AnimatedCard>
      </div>

      {/* High Risk Facilities */}
      {data.details.highRiskFacilities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-8"
        >
          <AnimatedCard delay={1} glowColor="rgba(239,68,68,0.15)">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  🚨
                </motion.span>
                High-Risk Facilities Requiring Attention
              </h2>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
                <p className="text-red-400 text-sm">
                  <strong>Action Required:</strong> The following facilities have compliance issues or
                  unresolved violations that require immediate attention.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["Facility", "Type", "City", "Status", "Open Violations"].map((h) => (
                        <th key={h} className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.details.highRiskFacilities.map((f, i) => (
                      <motion.tr
                        key={f.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.1 + i * 0.05 }}
                        className="border-b border-white/[0.03] hover:bg-white/[0.03]"
                      >
                        <td className="py-3 px-4 font-medium text-white">{f.name}</td>
                        <td className="py-3 px-4 text-gray-400 capitalize">{f.type.replace(/_/g, " ")}</td>
                        <td className="py-3 px-4 text-gray-400">{f.city}</td>
                        <td className="py-3 px-4">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-bold"
                            style={{
                              background: `${statusColor[f.complianceStatus] || "#6b7280"}20`,
                              color: statusColor[f.complianceStatus] || "#6b7280",
                            }}
                          >
                            {f.complianceStatus.replace(/_/g, " ").toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-red-400">{f.violationCount}</span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </AnimatedCard>
        </motion.div>
      )}

      {/* Inspection Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="mt-8"
      >
        <AnimatedCard delay={1.1} glowColor="rgba(168,85,247,0.08)">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6">📋 Inspection Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Total", value: data.summary.inspections.total, color: "#6366f1" },
                { label: "Completed", value: data.summary.inspections.completed, color: "#22c55e" },
                { label: "Scheduled", value: data.summary.inspections.scheduled, color: "#3b82f6" },
                { label: "Spot Checks", value: data.summary.inspections.spotChecks, color: "#f59e0b" },
                { label: "Avg Score", value: data.summary.inspections.averageScore, color: "#a855f7", isText: true },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + i * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="p-5 rounded-xl text-center relative overflow-hidden"
                  style={{ background: `${item.color}10`, border: `1px solid ${item.color}25` }}
                >
                  <div className="absolute inset-0 opacity-10 blur-2xl" style={{ background: item.color }} />
                  {item.isText ? (
                    <p className="text-3xl font-black relative z-10" style={{ color: item.color }}>
                      {item.value}
                    </p>
                  ) : (
                    <AnimatedCounter value={item.value as number} className="text-3xl font-black relative z-10" />
                  )}
                  <p className="text-sm font-medium mt-2 relative z-10" style={{ color: item.color }}>
                    {item.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedCard>
      </motion.div>
    </div>
  );
}
