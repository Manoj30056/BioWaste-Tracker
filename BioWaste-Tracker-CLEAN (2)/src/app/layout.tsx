import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import AnimatedBackground from "@/components/AnimatedBackground";
import FloatingOrbs from "@/components/FloatingOrbs";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "BioWaste Tracker — Biomedical Waste Management System",
  description:
    "Premium Biomedical Waste Tracking System with Spot-Check Enforcement for Small Clinics and Nursing Homes",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="noise-overlay">
        <Providers>
          <AnimatedBackground />
          <FloatingOrbs />
          <div className="flex min-h-screen relative" style={{ zIndex: 1 }}>
            <Sidebar />
            <main className="flex-1 ml-72 min-h-screen relative">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
