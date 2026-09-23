import React from "react";
import { motion } from "motion/react";

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Tactical Dot Matrix */}
      <div className="absolute inset-0 bg-tactical-dots opacity-40" />

      {/* Floating Animated Ambient Glow Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
          opacity: [0.12, 0.22, 0.12]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/20 rounded-full blur-3xl"
      />

      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -40, 0],
          y: [0, 40, 0],
          opacity: [0.15, 0.25, 0.15]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl"
      />

      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 30, 0],
          y: [0, 50, 0],
          opacity: [0.1, 0.18, 0.1]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-40 left-1/4 w-[30rem] h-[30rem] bg-blue-600/15 rounded-full blur-3xl"
      />

      {/* Subtle Horizontal Scanline */}
      <motion.div
        animate={{ y: ["-100%", "1000%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="w-full h-24 bg-gradient-to-b from-transparent via-amber-400/[0.02] to-transparent"
      />
    </div>
  );
}
