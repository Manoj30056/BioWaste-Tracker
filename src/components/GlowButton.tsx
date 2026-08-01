"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface GlowButtonProps {
  children: ReactNode;
  variant?: "primary" | "danger" | "success" | "warning";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

const variants = {
  primary: {
    bg: "linear-gradient(135deg, #6366f1, #818cf8)",
    glow: "rgba(99, 102, 241, 0.4)",
    hover: "rgba(99, 102, 241, 0.6)",
  },
  danger: {
    bg: "linear-gradient(135deg, #ef4444, #f87171)",
    glow: "rgba(239, 68, 68, 0.4)",
    hover: "rgba(239, 68, 68, 0.6)",
  },
  success: {
    bg: "linear-gradient(135deg, #10b981, #34d399)",
    glow: "rgba(16, 185, 129, 0.4)",
    hover: "rgba(16, 185, 129, 0.6)",
  },
  warning: {
    bg: "linear-gradient(135deg, #f59e0b, #fbbf24)",
    glow: "rgba(245, 158, 11, 0.4)",
    hover: "rgba(245, 158, 11, 0.6)",
  },
};

export default function GlowButton({
  children,
  variant = "primary",
  className = "",
  disabled,
  onClick,
  type = "button",
}: GlowButtonProps) {
  const v = variants[variant];
  return (
    <motion.button
      whileHover={disabled ? {} : {
        scale: 1.05,
        boxShadow: `0 0 30px ${v.hover}, 0 0 60px ${v.glow}`,
      }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`relative px-6 py-3 rounded-xl text-white font-semibold text-sm overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        background: v.bg,
        boxShadow: `0 0 20px ${v.glow}`,
      }}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      <motion.div
        className="absolute inset-0 bg-white/20"
        initial={{ x: "-100%", skewX: "-20deg" }}
        whileHover={{ x: "200%" }}
        transition={{ duration: 0.6 }}
        style={{ width: "50%" }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
