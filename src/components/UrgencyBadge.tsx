import React from "react";
import { UrgencyLevel } from "../types";
import { AlertTriangle } from "lucide-react";

interface UrgencyBadgeProps {
  urgency: UrgencyLevel;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export function UrgencyBadge({ urgency, showIcon = true, size = "md" }: UrgencyBadgeProps) {
  // Strict palette requested in design direction:
  // 5 = red, 4 = orange, 3 = amber, 2 = blue, 1 = gray
  const config = {
    5: {
      bg: "bg-red-500/20 text-red-400 border-red-500/40",
      label: "Urgency 5 • Critical Life-Threat",
      shortLabel: "Tier 5 • Critical"
    },
    4: {
      bg: "bg-orange-500/20 text-orange-400 border-orange-500/40",
      label: "Urgency 4 • High Priority",
      shortLabel: "Tier 4 • High"
    },
    3: {
      bg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      label: "Urgency 3 • Urgent",
      shortLabel: "Tier 3 • Urgent"
    },
    2: {
      bg: "bg-sky-500/20 text-sky-400 border-sky-500/40",
      label: "Urgency 2 • Moderate",
      shortLabel: "Tier 2 • Moderate"
    },
    1: {
      bg: "bg-slate-700/40 text-slate-300 border-slate-600/40",
      label: "Urgency 1 • Low",
      shortLabel: "Tier 1 • Low"
    }
  }[urgency] || {
    bg: "bg-slate-700/40 text-slate-300 border-slate-600/40",
    label: `Tier ${urgency}`,
    shortLabel: `Tier ${urgency}`
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-xs px-2.5 py-1 font-medium",
    lg: "text-sm px-3.5 py-1.5 font-semibold"
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border whitespace-nowrap tracking-wide uppercase ${config.bg} ${sizeClasses}`}
    >
      {showIcon && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
      <span>{size === "sm" ? config.shortLabel : config.label}</span>
    </span>
  );
}
