"use client";

import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "facility_manager",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (res?.error) {
        console.error("Login error:", res.error);
        setError(`Login failed: ${res.error === "CredentialsSignin" ? "Invalid email or password" : res.error}`);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
      } else {
        setSuccess("Account created! Signing you in...");
        // Auto-login after registration
        const loginRes = await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
        });
        if (loginRes?.error) {
          setSuccess("Account created! Please sign in.");
          setMode("login");
        } else {
          router.push("/");
          router.refresh();
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    setForm({ ...form, email, password });

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Demo account not found. Click 'Seed Demo Data' on the dashboard first.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
            top: "10%",
            left: "10%",
            filter: "blur(80px)",
          }}
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, #00ff88 0%, transparent 70%)",
            bottom: "10%",
            right: "10%",
            filter: "blur(80px)",
          }}
          animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-md"
      >
        <div
          className="rounded-3xl p-10 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(15,15,40,0.95), rgba(10,10,30,0.98))",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            boxShadow:
              "0 40px 100px rgba(0,0,0,0.5), 0 0 60px rgba(99, 102, 241, 0.1)",
          }}
        >
          {/* Logo */}
          <motion.div
            className="flex justify-center mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <motion.div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl relative overflow-hidden"
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
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
                style={{ width: "50%", transform: "skewX(-20deg)" }}
              />
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.div
            className="text-center mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-3xl font-black bg-gradient-to-r from-white via-indigo-200 to-green-400 bg-clip-text text-transparent mb-2">
              BioWaste Tracker
            </h1>
            <p className="text-gray-500 text-sm">
              Biomedical Waste Management System
            </p>
          </motion.div>

          {/* Mode Tabs */}
          <div className="flex rounded-xl bg-white/5 p-1 mb-6">
            <button
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === "login"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode("register");
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === "register"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Register
            </button>
          </div>

          {/* Error / Success Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm text-center"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 p-3 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm text-center"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@clinic.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-white relative overflow-hidden disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                    boxShadow: "0 8px 30px rgba(99, 102, 241, 0.35)",
                  }}
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mx-auto"
                    />
                  ) : (
                    "Sign In"
                  )}
                </motion.button>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Jane Smith"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@clinic.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Role
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value })
                    }
                    className={inputClass}
                  >
                    <option value="admin">Admin</option>
                    <option value="inspector">Inspector</option>
                    <option value="facility_manager">Facility Manager</option>
                    <option value="collector">Waste Collector</option>
                  </select>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-white relative overflow-hidden disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #00ff88, #00cc6a)",
                    boxShadow: "0 8px 30px rgba(0, 255, 136, 0.25)",
                    color: "#0a0a1e",
                  }}
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full mx-auto"
                    />
                  ) : (
                    "Create Account"
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-600">QUICK DEMO ACCESS</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Demo login buttons */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Admin",
                email: "admin@biowaste.com",
                pw: "admin123",
                icon: "👨‍💼",
                color: "#6366f1",
              },
              {
                label: "Inspector",
                email: "inspector@biowaste.com",
                pw: "inspect123",
                icon: "🔍",
                color: "#f59e0b",
              },
              {
                label: "Facility Mgr",
                email: "manager@biowaste.com",
                pw: "manage123",
                icon: "🏥",
                color: "#22c55e",
              },
              {
                label: "Collector",
                email: "collector@biowaste.com",
                pw: "collect123",
                icon: "🚛",
                color: "#3b82f6",
              },
            ].map((demo) => (
              <motion.button
                key={demo.label}
                type="button"
                onClick={() => handleDemoLogin(demo.email, demo.pw)}
                disabled={loading}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                style={{
                  background: `${demo.color}15`,
                  border: `1px solid ${demo.color}30`,
                  color: demo.color,
                }}
              >
                <span className="text-base">{demo.icon}</span>
                {demo.label}
              </motion.button>
            ))}
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 pt-4 border-t border-white/5 text-center"
          >
            <p className="text-xs text-gray-600">
              Secured with NextAuth.js · Biomedical Waste Tracking
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
