"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import AnimatedCard from "@/components/AnimatedCard";
import AnimatedCounter from "@/components/AnimatedCounter";
import GlowButton from "@/components/GlowButton";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      console.error(e);
      setError("Could not connect to database. Make sure you ran 'npx drizzle-kit push' and 'npm run dev'.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleSeed = async () => {
    setSeeding(true);
    setError(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (!res.ok) throw new Error("Seed failed");
      await fetchDashboard();
    } catch (e) {
      setError("Failed to seed data. Please try again.");
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
          className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-500"
        />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-6xl mb-6"
        >
          
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-4">Connection Error</h2>
        <p className="text-gray-400 mb-6 max-w-md">
          {error || "Could not load dashboard data"}
        </p>
        <div className="flex gap-4">
          <GlowButton onClick={fetchDashboard} variant="primary">
            🔄 Retry Connection
          </GlowButton>
          <GlowButton onClick={handleSeed} disabled={seeding} variant="success">
            {seeding ? "⏳ Loading..." : "🌱 Seed Demo Data"}
          </GlowButton>
        </div>
        <div className="mt-8 p-6 bg-white/5 rounded-xl text-left max-w-lg">
          <h3 className="font-bold text-white mb-3">🛠️ Troubleshooting Steps:</h3>
          <ol className="text-gray-400 text-sm space-y-2 list-decimal list-inside">
            <li>Check terminal for errors</li>
            <li>Verify <code className="bg-white/10 px-2 py-0.5 rounded">.env</code> file exists</li>
            <li>Run: <code className="bg-white/10 px-2 py-0.5 rounded">npx drizzle-kit push</code></li>
            <li>Restart: <code className="bg-white/10 px-2 py-0.5 rounded">npm run dev</code></li>
          </ol>
        </div>
      </div>
    );
  }

  const isEmpty = !data.facilities || data.facilities.total === 0;

  if (isEmpty) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-7xl mb-6"
        >
          
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-3">No Data Yet</h2>
        <p className="text-gray-500 mb-8 max-w-md">
          Click "Seed Demo Data" to populate the system with sample facilities, waste logs, and inspection records.
        </p>
        <GlowButton onClick={handleSeed} disabled={seeding} variant="success" className="text-lg px-10 py-4">
          {seeding ? "⏳ Seeding..." : "🌱 Seed Demo Data"}
        </GlowButton>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-10"
      >
        <div>
          <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-indigo-200 to-green-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Biomedical waste tracking overview</p>
        </div>
        <GlowButton onClick={handleSeed} disabled={seeding} variant="success">
          {seeding ? "⏳ Seeding..." : "🌱 Seed Demo Data"}
        </GlowButton>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { title: "Total Facilities", value: data.facilities?.total || 0, icon: "🏥", color: "#6366f1" },
          { title: "Waste (30 days)", value: parseFloat(data.waste?.totalKgLast30Days || "0"), icon: "⚗️", color: "#00ff88", suffix: " kg", decimals: 1 },
          { title: "Open Violations", value: data.violations?.openCount || 0, icon: "🚨", color: "#ef4444" },
          { title: "Inspections Done", value: data.inspections?.byStatus?.find((s: any) => s.status === "completed")?.count || 0, icon: "✅", color: "#00d4ff" },
        ].map((kpi, i) => (
          <AnimatedCard key={kpi.title} delay={i * 0.1} glowColor={kpi.color + "30"}>
            <div className="p-6 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-4xl opacity-30">{kpi.icon}</div>
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-3xl" style={{ background: kpi.color }} />
              <p className="text-sm text-gray-400 font-medium mb-2">{kpi.title}</p>
              <AnimatedCounter value={kpi.value} suffix={kpi.suffix || ""} decimals={kpi.decimals || 0} className="text-4xl font-black" />
            </div>
          </AnimatedCard>
        ))}
      </div>

      {/* Waste by Category */}
      <AnimatedCard delay={0.4} glowColor="rgba(34, 197, 94, 0.1)">
        <div className="p-6">
          <h3 className="text-lg font-bold mb-6"> Waste by Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.waste?.byCategory?.map((cat: any, i: number) => (
              <div key={cat.category} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-2xl mb-2">{cat.category === 'yellow' ? '🟡' : cat.category === 'red' ? '' : cat.category === 'blue' ? '' : cat.category === 'white' ? '⚪' : '🟣'}</div>
                <p className="text-sm text-gray-400 capitalize">{cat.category}</p>
                <p className="text-xl font-bold text-white">{parseFloat(cat.total || "0").toFixed(1)} kg</p>
                <p className="text-xs text-gray-500">{cat.count} entries</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedCard>
    </div>
  );
}
