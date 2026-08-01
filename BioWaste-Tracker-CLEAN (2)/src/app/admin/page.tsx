"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import AnimatedCard from "@/components/AnimatedCard";
import AnimatedCounter from "@/components/AnimatedCounter";
import GlowButton from "@/components/GlowButton";
import ModalWrapper from "@/components/ModalWrapper";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  isApproved: boolean;
  facilityId: number | null;
  facilityName: string | null;
  createdAt: string;
}

interface AdminStats {
  totalUsers: number;
  pendingApprovals: number;
  totalFacilities: number;
  totalWasteKg: number;
  usersByRole: Array<{ role: string; count: number }>;
}

const roleColors: Record<string, string> = {
  admin: "#a855f7",
  inspector: "#3b82f6",
  facility_manager: "#22c55e",
};

const inputClass = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/stats"),
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchData();
    else if (status === "unauthenticated") setLoading(false);
  }, [status, fetchData]);

  const handleApprove = async (userId: string) => {
    setUpdating(true);
    try {
      await fetch(`/api/admin/users/${userId}/approve`, { method: "POST" });
      await fetchData();
    } catch (e) { console.error(e); }
    finally { setUpdating(false); }
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;
    setUpdating(true);
    try {
      await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      setShowRoleModal(false);
      setSelectedUser(null);
      await fetchData();
    } catch (e) { console.error(e); }
    finally { setUpdating(false); }
  };

  if (loading || status === "loading") {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-16 h-16 rounded-full border-4 border-primary-500/30 border-t-primary-500" />
      </div>
    );
  }

  if (!session || session.user?.role !== "admin") {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen">
        <motion.p animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-6xl mb-4">🔐</motion.p>
        <p className="text-gray-400 mb-2">Admin access required</p>
        <p className="text-gray-600 text-sm">You don&apos;t have permission to view this page</p>
      </div>
    );
  }

  const pendingUsers = users.filter(u => !u.isApproved);

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <motion.h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-neon-purple to-neon-pink bg-clip-text text-transparent" style={{ backgroundSize: "200% 200%" }} animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }} transition={{ duration: 6, repeat: Infinity }}>Admin Panel</motion.h1>
        <p className="text-gray-500 mt-2">Manage users, approvals, and system settings</p>
      </motion.div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[
            { title: "Total Users", value: stats.totalUsers, icon: "👥", color: "#6366f1" },
            { title: "Pending Approvals", value: stats.pendingApprovals, icon: "⏳", color: "#f59e0b" },
            { title: "Total Facilities", value: stats.totalFacilities, icon: "🏥", color: "#22c55e" },
            { title: "Total Waste", value: stats.totalWasteKg, suffix: " kg", decimals: 1, icon: "⚗️", color: "#00d4ff" },
          ].map((stat, i) => (
            <AnimatedCard key={stat.title} delay={i * 0.1} glowColor={stat.color + "20"}>
              <div className="p-6 relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-15 blur-2xl" style={{ background: stat.color }} />
                <motion.span className="absolute top-4 right-4 text-3xl opacity-30" animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}>{stat.icon}</motion.span>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">{stat.title}</p>
                <AnimatedCounter value={stat.value} suffix={stat.suffix || ""} decimals={stat.decimals || 0} className="text-3xl font-black" />
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}

      {/* Pending Approvals */}
      {pendingUsers.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>⏳</motion.span>
            Pending Approvals ({pendingUsers.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingUsers.map((user, i) => (
              <AnimatedCard key={user.id} delay={0.4 + i * 0.05} glowColor="rgba(245,158,11,0.15)">
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    {user.image ? (
                      <img src={user.image} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center font-bold">{user.name?.[0] || "?"}</div>
                    )}
                    <div>
                      <p className="font-bold text-white text-sm">{user.name || "Unknown"}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">
                    📍 {user.facilityName || "No facility"}<br/>
                    📅 {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                  <GlowButton variant="success" className="w-full" onClick={() => handleApprove(user.id)} disabled={updating}>
                    ✓ Approve
                  </GlowButton>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </motion.div>
      )}

      {/* All Users */}
      <AnimatedCard delay={0.5} glowColor="rgba(99,102,241,0.08)">
        <div className="p-6">
          <h2 className="text-lg font-bold mb-6">👥 All Users</h2>
          {users.length === 0 ? (
            <div className="text-center py-10"><p className="text-gray-500">No users yet</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/5">{["User", "Email", "Role", "Facility", "Status", "Joined", "Actions"].map(h => (<th key={h} className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">{h}</th>))}</tr></thead>
                <tbody>
                  {users.map((user, i) => (
                    <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.02 }} className="border-b border-white/[0.03] hover:bg-white/[0.03] transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {user.image ? (
                            <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-neon-green flex items-center justify-center text-xs font-bold">{user.name?.[0] || "?"}</div>
                          )}
                          <span className="text-white/80 font-medium">{user.name || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-400">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold capitalize" style={{ background: `${roleColors[user.role]}20`, color: roleColors[user.role] }}>
                          {user.role.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-xs">{user.facilityName || "—"}</td>
                      <td className="py-3 px-4">
                        {user.isApproved ? (
                          <span className="text-green-400 text-xs font-medium">✓ Approved</span>
                        ) : (
                          <span className="text-yellow-400 text-xs font-medium">⏳ Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <motion.button whileHover={{ scale: 1.05 }} onClick={() => { setSelectedUser(user); setNewRole(user.role); setShowRoleModal(true); }} className="text-xs text-primary-400 hover:text-primary-300 font-medium">
                          Change Role
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AnimatedCard>

      {/* Role Modal */}
      <ModalWrapper isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} title="Change User Role">
        {selectedUser && (
          <div className="space-y-4">
            <p className="text-gray-400">Change role for <span className="text-white font-bold">{selectedUser.name || selectedUser.email}</span></p>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">New Role</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className={inputClass}>
                <option value="facility_manager">Facility Manager</option>
                <option value="inspector">Inspector</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <motion.button whileHover={{ scale: 1.02 }} onClick={() => setShowRoleModal(false)} className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white transition">Cancel</motion.button>
              <GlowButton onClick={handleRoleChange} disabled={updating}>{updating ? "Saving..." : "Save"}</GlowButton>
            </div>
          </div>
        )}
      </ModalWrapper>
    </div>
  );
}
