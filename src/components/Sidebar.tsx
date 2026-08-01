"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useSession } from "next-auth/react";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊", roles: ["admin", "inspector", "facility_manager", "collector"] },
  { href: "/mobile-entry", label: "Log Waste", icon: "➕", roles: ["admin", "inspector", "facility_manager"] },
  { href: "/facilities", label: "Facilities", icon: "🏥", roles: ["admin", "inspector"] },
  { href: "/waste-logs", label: "Waste Logs", icon: "🗑️", roles: ["admin", "inspector", "facility_manager"] },
  { href: "/scanner", label: "QR Scanner", icon: "📷", roles: ["admin", "inspector", "facility_manager", "collector"] },
  { href: "/collect", label: "Collection", icon: "🚛", roles: ["admin", "inspector", "collector"] },
  { href: "/alerts", label: "Alerts", icon: "🔔", roles: ["admin", "inspector"] },
  { href: "/inspections", label: "Inspections", icon: "📋", roles: ["admin", "inspector"] },
  { href: "/violations", label: "Violations", icon: "⚠️", roles: ["admin", "inspector"] },
  { href: "/spot-checks", label: "Spot Checks", icon: "🔍", roles: ["admin", "inspector"] },
  { href: "/reports", label: "Reports", icon: "📈", roles: ["admin", "inspector", "facility_manager"] },
];

const bottomItems = [
  { href: "/profile", label: "Profile", icon: "👤", roles: ["admin", "inspector", "facility_manager", "collector"] },
  { href: "/admin", label: "Admin", icon: "⚙️", roles: ["admin"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { data: session, status } = useSession();

  const userRole = session?.user?.role || "facility_manager";

  // Hide sidebar on login, onboarding, and mobile entry pages
  if (pathname === "/login" || pathname === "/onboarding" || pathname === "/mobile-entry") {
    return null;
  }

  const filteredNav = navItems.filter(item => item.roles.includes(userRole));
  const filteredBottom = bottomItems.filter(item => item.roles.includes(userRole));

  return (
    <motion.aside
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed left-0 top-0 w-72 h-screen glass-strong flex flex-col z-50"
      style={{
        background: "linear-gradient(180deg, rgba(10,10,30,0.95) 0%, rgba(5,5,20,0.98) 100%)",
        borderRight: "1px solid rgba(99, 102, 241, 0.15)",
      }}
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <motion.div
          className="flex items-center gap-4"
          whileHover={{ scale: 1.02 }}
        >
          <motion.div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #6366f1, #00ff88)",
            }}
            animate={{
              boxShadow: [
                "0 0 20px rgba(99, 102, 241, 0.4)",
                "0 0 40px rgba(0, 255, 136, 0.4)",
                "0 0 20px rgba(99, 102, 241, 0.4)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            ☣
            <motion.div
              className="absolute inset-0 bg-white/20"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              style={{ width: "50%", transform: "skewX(-20deg)" }}
            />
          </motion.div>
          <div>
            <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-primary-300 bg-clip-text text-transparent">
              BioWaste
            </h1>
            <p className="text-[11px] text-primary-400/60 tracking-widest uppercase">
              Tracking System
            </p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNav.map((item, index) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index + 0.3, duration: 0.5 }}
              onHoverStart={() => setHoveredItem(item.href)}
              onHoverEnd={() => setHoveredItem(null)}
            >
              <Link
                href={item.href}
                className={`relative flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
                  isActive
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <AnimatePresence>
                  {(isActive || hoveredItem === item.href) && (
                    <motion.div
                      layoutId="nav-bg"
                      className="absolute inset-0 rounded-xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        background: isActive
                          ? "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(0,255,136,0.08))"
                          : "rgba(255,255,255,0.04)",
                        border: isActive
                          ? "1px solid rgba(99,102,241,0.3)"
                          : "1px solid transparent",
                      }}
                    />
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="active-line"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full"
                    style={{
                      background: "linear-gradient(180deg, #6366f1, #00ff88)",
                    }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  />
                )}
                <motion.span
                  className="relative text-lg z-10"
                  whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  {item.icon}
                </motion.span>
                <span className="relative z-10">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}

        {/* Divider */}
        <div className="my-4 border-t border-white/5" />

        {/* Bottom items */}
        {filteredBottom.map((item, index) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * (index + filteredNav.length) + 0.3, duration: 0.5 }}
              onHoverStart={() => setHoveredItem(item.href)}
              onHoverEnd={() => setHoveredItem(null)}
            >
              <Link
                href={item.href}
                className={`relative flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive ? "text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <AnimatePresence>
                  {(isActive || hoveredItem === item.href) && (
                    <motion.div
                      className="absolute inset-0 rounded-xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        background: isActive
                          ? "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(0,255,136,0.08))"
                          : "rgba(255,255,255,0.04)",
                      }}
                    />
                  )}
                </AnimatePresence>
                <motion.span
                  className="relative text-lg z-10"
                  whileHover={{ scale: 1.2 }}
                >
                  {item.icon}
                </motion.span>
                <span className="relative z-10">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <motion.div
        className="p-4 border-t border-white/5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        {status === "authenticated" && session?.user ? (
          <Link href="/profile">
            <div className="glass rounded-xl p-3 flex items-center gap-3 hover:bg-white/5 transition cursor-pointer">
              {session.user.image ? (
                <img src={session.user.image} alt="" className="w-9 h-9 rounded-full" />
              ) : (
                <motion.div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm"
                  style={{ background: "linear-gradient(135deg, #6366f1, #00d4ff)" }}
                >
                  {session.user.name?.[0] || "?"}
                </motion.div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/90 truncate">{session.user.name || "User"}</p>
                <p className="text-[10px] text-primary-400/50 tracking-wider uppercase">
                  {(session.user.role || "user").replace(/_/g, " ")}
                </p>
              </div>
            </div>
          </Link>
        ) : (
          <Link href="/login">
            <div className="glass rounded-xl p-3 flex items-center gap-3 hover:bg-white/5 transition cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm">👤</div>
              <div>
                <p className="text-sm font-medium text-white/90">Sign In</p>
                <p className="text-[10px] text-gray-500">Access your account</p>
              </div>
            </div>
          </Link>
        )}
      </motion.div>
    </motion.aside>
  );
}
