import React from "react";
import { RequestStatus } from "../types";
import {
  Radio,
  Cpu,
  Boxes,
  PackageCheck,
  UserCheck,
  Camera,
  Navigation,
  CheckCircle,
  ShieldCheck
} from "lucide-react";

interface StatusBadgeProps {
  status: RequestStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const meta: Record<
    RequestStatus,
    { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    REPORTED: { label: "1. Reported", color: "bg-slate-800 text-slate-300 border-slate-700", icon: Radio },
    AI_PROCESSED: { label: "2. AI Triaged", color: "bg-purple-950/60 text-purple-300 border-purple-800/60", icon: Cpu },
    CLUSTERED: { label: "3. Clustered", color: "bg-indigo-950/60 text-indigo-300 border-indigo-800/60", icon: Boxes },
    RESOURCE_MATCHED: { label: "4. Inventory Matched", color: "bg-teal-950/60 text-teal-300 border-teal-800/60", icon: PackageCheck },
    VOLUNTEER_ASSIGNED: { label: "5. Volunteer Assigned", color: "bg-blue-950/60 text-blue-300 border-blue-800/60", icon: UserCheck },
    PICKUP: { label: "6. Supplies Picked Up", color: "bg-amber-950/60 text-amber-300 border-amber-800/60", icon: Camera },
    IN_TRANSIT: { label: "7. In Transit", color: "bg-orange-950/60 text-orange-300 border-orange-800/60", icon: Navigation },
    DELIVERED: { label: "8. Delivered", color: "bg-emerald-950/60 text-emerald-300 border-emerald-800/60", icon: CheckCircle },
    VERIFIED: { label: "9. Verified Relief", color: "bg-emerald-900/80 text-emerald-200 border-emerald-500/80 shadow-sm shadow-emerald-500/20", icon: ShieldCheck }
  };

  const item = meta[status] || {
    label: status,
    color: "bg-slate-800 text-slate-300 border-slate-700",
    icon: Radio
  };
  const Icon = item.icon;

  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium whitespace-nowrap ${item.color} ${sizeClass}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{item.label}</span>
    </span>
  );
}
