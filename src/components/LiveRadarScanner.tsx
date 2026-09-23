import React from "react";
import { motion } from "motion/react";
import { Radio, Activity } from "lucide-react";

interface LiveRadarScannerProps {
  label?: string;
  count?: number;
  statusText?: string;
}

export function LiveRadarScanner({
  label = "Active Satellite Mesh",
  count = 24,
  statusText = "Scanning 10km Disaster Zone"
}: LiveRadarScannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-950/80 border border-slate-800 p-4 shadow-xl flex items-center gap-4">
      {/* Mini Radar Dish Visual */}
      <div className="relative w-14 h-14 shrink-0 rounded-full border border-sky-500/30 bg-slate-900/90 flex items-center justify-center overflow-hidden">
        {/* Radar Concentric Rings */}
        <div className="absolute inset-1 rounded-full border border-sky-500/20" />
        <div className="absolute inset-3 rounded-full border border-sky-500/20" />
        <div className="absolute inset-5 rounded-full border border-sky-500/30" />

        {/* Radar Crosshairs */}
        <div className="absolute w-full h-[1px] bg-sky-500/20" />
        <div className="absolute h-full w-[1px] bg-sky-500/20" />

        {/* Rotating Radar Sweep Cone */}
        <div className="absolute inset-0 rounded-full animate-radar-sweep origin-center pointer-events-none">
          <div className="w-1/2 h-1/2 bg-gradient-to-br from-emerald-400/40 via-sky-400/10 to-transparent rounded-tl-full" />
        </div>

        {/* Blinking Distress Blips */}
        <motion.div
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, times: [0, 0.2, 1] }}
          className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-red-400 shadow-sm shadow-red-400"
        />
        <motion.div
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2.3, repeat: Infinity, delay: 0.8, times: [0, 0.2, 1] }}
          className="absolute bottom-3 left-4 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400"
        />

        {/* Central Pulse */}
        <div className="relative w-2.5 h-2.5 rounded-full bg-sky-400 shadow-md shadow-sky-400/50" />
      </div>

      {/* Status Meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-black truncate">
            {label}
          </span>
        </div>
        <p className="text-xs font-bold text-slate-200 mt-0.5 truncate">{statusText}</p>
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
          <span className="text-emerald-400 font-bold">● LIVE</span>
          <span>•</span>
          <span>{count} Nodes Syncing</span>
        </div>
      </div>
    </div>
  );
}
