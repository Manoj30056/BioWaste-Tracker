"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function ModalWrapper({
  isOpen,
  onClose,
  title,
  children,
}: ModalWrapperProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40, rotateX: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 40 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl glass-strong"
            style={{
              background: "linear-gradient(135deg, rgba(15,15,40,0.95), rgba(10,10,30,0.98))",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              boxShadow: "0 40px 100px rgba(0,0,0,0.5), 0 0 60px rgba(99, 102, 241, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-white to-primary-300 bg-clip-text text-transparent">
                {title}
              </h2>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition"
              >
                ✕
              </motion.button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
