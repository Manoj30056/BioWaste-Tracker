"use client";

export default function FloatingOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Large gradient orbs */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full animate-blob opacity-20"
        style={{
          background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
          top: "-10%",
          right: "-10%",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full animate-blob opacity-15"
        style={{
          background: "radial-gradient(circle, #00ff88 0%, transparent 70%)",
          bottom: "10%",
          left: "-5%",
          filter: "blur(80px)",
          animationDelay: "-5s",
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full animate-blob opacity-10"
        style={{
          background: "radial-gradient(circle, #00d4ff 0%, transparent 70%)",
          top: "40%",
          right: "20%",
          filter: "blur(60px)",
          animationDelay: "-8s",
        }}
      />
      <div
        className="absolute w-[350px] h-[350px] rounded-full animate-blob opacity-10"
        style={{
          background: "radial-gradient(circle, #b400ff 0%, transparent 70%)",
          top: "60%",
          left: "30%",
          filter: "blur(70px)",
          animationDelay: "-3s",
        }}
      />
    </div>
  );
}
