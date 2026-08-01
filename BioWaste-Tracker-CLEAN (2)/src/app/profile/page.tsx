"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import AnimatedCard from "@/components/AnimatedCard";
import AnimatedCounter from "@/components/AnimatedCounter";
import GlowButton from "@/components/GlowButton";

interface ProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    image: string;
    role: string;
    isApproved: boolean;
    createdAt: string;
  };
  facility: {
    id: number;
    name: string;
    type: string;
    licenseNumber: string;
    city: string;
    state: string;
    complianceStatus: string;
  } | null;
  stats: {
    totalWasteKg: number;
    wasteEntries: number;
    inspections: number;
    violations: number;
    complianceScore: number;
    wasteByCategory: Array<{ category: string; total: string; count: number }>;
  };
}

const categoryColors: Record<string, string> = {
  yellow: "#fbbf24", red: "#ef4444", blue: "#3b82f6", white: "#94a3b8",
  cytotoxic: "#a855f7", chemical: "#f97316", general: "#22c55e",
};
const categoryLabels: Record<string, string> = {
  yellow: "Infectious", red: "Contaminated", blue: "Glassware", white: "Sharps",
  cytotoxic: "Cytotoxic", chemical: "Chemical", general: "General",
};
const statusColors: Record<string, string> = {
  compliant: "#22c55e", non_compliant: "#ef4444", pending_review: "#f59e0b", suspended: "#6b7280",
};
const roleColors: Record<string, string> = {
  admin: "#a855f7", inspector: "#3b82f6", facility_manager: "#22c55e",
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfile();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchProfile]);

  if (loading || status === "loading") {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-16 h-16 rounded-full border-4 border-primary-500/30 border-t-primary-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen">
        <motion.p animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-6xl mb-4">🔒</motion.p>
        <p className="text-gray-400 mb-6">Please sign in to view your profile</p>
        <GlowButton onClick={() => window.location.href = "/login"}>Sign In</GlowButton>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <motion.h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-primary-200 to-neon-purple bg-clip-text text-transparent" style={{ backgroundSize: "200% 200%" }} animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }} transition={{ duration: 6, repeat: Infinity }}>Profile</motion.h1>
        <p className="text-gray-500 mt-2">Your account and facility overview</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Card */}
        <AnimatedCard delay={0.1} glowColor="rgba(168,85,247,0.15)">
          <div className="p-6 text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-3xl bg-purple-500" />
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="relative inline-block mb-4">
              {data?.user?.image ? (
                <img src={data.user.image} alt="Profile" className="w-24 h-24 rounded-full border-4 border-primary-500/30" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-neon-green flex items-center justify-center text-4xl">
                  {data?.user?.name?.[0] || "?"}
                </div>
              )}
              <motion.div animate={{ boxShadow: ["0 0 20px rgba(168,85,247,0.4)", "0 0 40px rgba(168,85,247,0.6)", "0 0 20px rgba(168,85,247,0.4)"] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 rounded-full" />
            </motion.div>
            <h2 className="text-xl font-bold text-white mb-1">{data?.user?.name || session.user?.name}</h2>
            <p className="text-sm text-gray-500 mb-3">{data?.user?.email || session.user?.email}</p>
            <motion.span animate={{ boxShadow: [`0 0 10px ${roleColors[data?.user?.role || "facility_manager"]}40`, `0 0 20px ${roleColors[data?.user?.role || "facility_manager"]}60`, `0 0 10px ${roleColors[data?.user?.role || "facility_manager"]}40`] }} transition={{ duration: 2, repeat: Infinity }} className="inline-block px-4 py-1.5 rounded-full text-xs font-bold capitalize" style={{ background: `${roleColors[data?.user?.role || "facility_manager"]}20`, color: roleColors[data?.user?.role || "facility_manager"] }}>
              {(data?.user?.role || "facility_manager").replace(/_/g, " ")}
            </motion.span>
            {data?.user && !data.user.isApproved && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-xs text-yellow-400">⏳ Awaiting admin approval</p>
              </motion.div>
            )}
            <div className="mt-6 pt-4 border-t border-white/5">
              <GlowButton variant="danger" onClick={() => { try { signOut({ callbackUrl: "/login", redirect: true }); } catch(e) { window.location.href = "/login"; } }} className="w-full">
                Sign Out
              </GlowButton>
            </div>
          </div>
        </AnimatedCard>

        {/* Facility Card */}
        <AnimatedCard delay={0.2} glowColor="rgba(34,197,94,0.15)">
          <div className="p-6 relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full opacity-10 blur-3xl bg-green-500" />
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>🏥</span> Your Facility
            </h3>
            {data?.facility ? (
              <div className="space-y-3">
                <div className="glass rounded-xl p-3">
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-bold text-white">{data.facility.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass rounded-xl p-3">
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="font-medium text-white/80 capitalize text-sm">{data.facility.type.replace(/_/g, " ")}</p>
                  </div>
                  <div className="glass rounded-xl p-3">
                    <p className="text-xs text-gray-500">Status</p>
                    <span className="text-sm font-bold" style={{ color: statusColors[data.facility.complianceStatus] || "#6b7280" }}>
                      {data.facility.complianceStatus.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  </div>
                </div>
                <div className="glass rounded-xl p-3">
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="font-medium text-white/80 text-sm">{data.facility.city}, {data.facility.state}</p>
                </div>
                <div className="glass rounded-xl p-3">
                  <p className="text-xs text-gray-500">License</p>
                  <p className="font-mono text-xs text-white/60">{data.facility.licenseNumber}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <motion.p animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-4xl mb-3">🏗️</motion.p>
                <p className="text-gray-500 text-sm">No facility assigned</p>
                <GlowButton onClick={() => window.location.href = "/onboarding"} className="mt-4">
                  Setup Facility
                </GlowButton>
              </div>
            )}
          </div>
        </AnimatedCard>

        {/* Stats Card */}
        <AnimatedCard delay={0.3} glowColor="rgba(0,212,255,0.15)">
          <div className="p-6 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-3xl bg-cyan-500" />
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>📊</span> Your Stats
            </h3>
            {data?.stats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass rounded-xl p-4 text-center">
                    <AnimatedCounter value={data.stats.totalWasteKg} suffix=" kg" decimals={1} className="text-2xl font-black text-neon-green" />
                    <p className="text-xs text-gray-500 mt-1">Total Waste</p>
                  </div>
                  <div className="glass rounded-xl p-4 text-center">
                    <AnimatedCounter value={data.stats.wasteEntries} className="text-2xl font-black text-neon-blue" />
                    <p className="text-xs text-gray-500 mt-1">Entries</p>
                  </div>
                  <div className="glass rounded-xl p-4 text-center">
                    <AnimatedCounter value={data.stats.inspections} className="text-2xl font-black text-purple-400" />
                    <p className="text-xs text-gray-500 mt-1">Inspections</p>
                  </div>
                  <div className="glass rounded-xl p-4 text-center">
                    <AnimatedCounter value={data.stats.violations} className="text-2xl font-black text-orange-400" />
                    <p className="text-xs text-gray-500 mt-1">Violations</p>
                  </div>
                </div>
                {data.stats.complianceScore > 0 && (
                  <div className="glass rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Compliance Score</span>
                      <span className="text-xl font-black" style={{ color: data.stats.complianceScore >= 80 ? "#22c55e" : data.stats.complianceScore >= 60 ? "#f59e0b" : "#ef4444" }}>
                        {data.stats.complianceScore}%
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${data.stats.complianceScore}%` }} transition={{ duration: 1.5 }} className="h-full rounded-full" style={{ background: data.stats.complianceScore >= 80 ? "#22c55e" : data.stats.complianceScore >= 60 ? "#f59e0b" : "#ef4444", boxShadow: `0 0 10px ${data.stats.complianceScore >= 80 ? "#22c55e" : data.stats.complianceScore >= 60 ? "#f59e0b" : "#ef4444"}` }} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No data yet</p>
              </div>
            )}
          </div>
        </AnimatedCard>
      </div>

      {/* Waste by Category */}
      {data?.stats?.wasteByCategory && data.stats.wasteByCategory.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-8">
          <AnimatedCard delay={0.5} glowColor="rgba(99,102,241,0.08)">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-6">🧪 Your Waste Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {data.stats.wasteByCategory.map((cat, i) => {
                  const color = categoryColors[cat.category] || "#6b7280";
                  const total = parseFloat(cat.total || "0");
                  return (
                    <motion.div key={cat.category} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 + i * 0.05 }} whileHover={{ scale: 1.05 }} className="p-4 rounded-xl text-center relative overflow-hidden" style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
                      <div className="absolute inset-0 opacity-10 blur-2xl" style={{ background: color }} />
                      <motion.div className="w-4 h-4 rounded-full mx-auto mb-2" style={{ background: color, boxShadow: `0 0 10px ${color}` }} animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }} />
                      <p className="text-xl font-black text-white">{total.toFixed(1)}</p>
                      <p className="text-[10px] text-gray-500">kg</p>
                      <p className="text-xs text-gray-400 mt-1">{categoryLabels[cat.category] || cat.category}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </AnimatedCard>
        </motion.div>
      )}
    </div>
  );
}
