import React from "react";
import { EmergencyRequest, RequestStatus } from "../types";
import {
  Radio,
  Cpu,
  Boxes,
  PackageCheck,
  UserCheck,
  Camera,
  Navigation,
  CheckCircle,
  ShieldCheck,
  Check,
  Clock,
  ExternalLink
} from "lucide-react";

interface StatusTimelineProps {
  request: EmergencyRequest;
}

const ORDERED_STEPS: Array<{
  status: RequestStatus;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { status: "REPORTED", title: "1. SOS Emergency Reported", icon: Radio },
  { status: "AI_PROCESSED", title: "2. AI Triage & Assessment", icon: Cpu },
  { status: "CLUSTERED", title: "3. Geospatial Zone Clustered", icon: Boxes },
  { status: "RESOURCE_MATCHED", title: "4. Relief Inventory Allocated", icon: PackageCheck },
  { status: "VOLUNTEER_ASSIGNED", title: "5. Responder Dispatched", icon: UserCheck },
  { status: "PICKUP", title: "6. Supplies Picked Up & Proof", icon: Camera },
  { status: "IN_TRANSIT", title: "7. En Route with Live GPS", icon: Navigation },
  { status: "DELIVERED", title: "8. Physical Handover", icon: CheckCircle },
  { status: "VERIFIED", title: "9. Verified Relief Chain Closed", icon: ShieldCheck }
];

export function StatusTimeline({ request }: StatusTimelineProps) {
  const currentIndex = ORDERED_STEPS.findIndex((s) => s.status === request.status);

  // Group timeline log notes by status
  const timelineMap = new Map<RequestStatus, { at: string; by: string; note: string; photoUrl?: string }>();
  request.timeline.forEach((entry) => {
    timelineMap.set(entry.status, entry);
  });

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
      {ORDERED_STEPS.map((step, idx) => {
        const isCompleted = idx < currentIndex || request.status === "VERIFIED" || (idx === currentIndex && request.status === step.status);
        const isCurrent = idx === currentIndex && request.status !== "VERIFIED";
        const isPending = idx > currentIndex && request.status !== "VERIFIED";

        const logEntry = timelineMap.get(step.status);
        const Icon = step.icon;

        let circleStyle = "border-slate-700 bg-slate-900 text-slate-500";
        if (isCompleted) {
          circleStyle = "border-emerald-500 bg-emerald-950 text-emerald-400";
        }
        if (isCurrent) {
          circleStyle = "border-amber-500 bg-amber-950 text-amber-300 ring-4 ring-amber-500/20 animate-pulse";
        }

        return (
          <div key={step.status} className="relative group">
            {/* Step marker node */}
            <div
              className={`absolute -left-6 top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${circleStyle}`}
            >
              {isCompleted && !isCurrent ? (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              ) : (
                <Icon className="w-3 h-3" />
              )}
            </div>

            {/* Step content */}
            <div
              className={`p-3.5 rounded-lg border transition-all ${
                isCurrent
                  ? "bg-slate-900/90 border-amber-500/50 shadow-md shadow-amber-500/10"
                  : isCompleted
                  ? "bg-slate-900/50 border-slate-800"
                  : "bg-slate-950/40 border-slate-900 opacity-60"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold tracking-wide ${
                      isCurrent
                        ? "text-amber-300"
                        : isCompleted
                        ? "text-slate-200"
                        : "text-slate-500"
                    }`}
                  >
                    {step.title}
                  </span>
                  {isCurrent && (
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Active Stage
                    </span>
                  )}
                </div>

                {logEntry?.at && (
                  <span className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {new Date(logEntry.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>

              {logEntry?.note && (
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  {logEntry.note}
                </p>
              )}

              {logEntry?.by && (
                <div className="mt-1 text-[11px] text-slate-500 font-mono">
                  Recorded by: <span className="text-slate-400">{logEntry.by}</span>
                </div>
              )}

              {/* Matched Resource Special Details */}
              {step.status === "RESOURCE_MATCHED" && request.resource && (
                <div className="mt-2.5 p-2.5 rounded bg-teal-950/40 border border-teal-800/40 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-teal-300 font-medium">{request.resource.name}</div>
                    <div className="text-teal-400/80 text-[11px]">
                      Quantity: {request.resource.quantity} {request.resource.unit}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-teal-900/60 text-teal-200 rounded text-[10px] font-semibold uppercase">
                    Reserved
                  </span>
                </div>
              )}

              {/* Volunteer Details */}
              {step.status === "VOLUNTEER_ASSIGNED" && request.volunteer && (
                <div className="mt-2.5 p-2.5 rounded bg-blue-950/40 border border-blue-800/40 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-blue-200 font-medium">Responder: {request.volunteer.name}</div>
                    {request.volunteer.phone && (
                      <div className="text-blue-300/80 text-[11px]">Call: {request.volunteer.phone}</div>
                    )}
                  </div>
                  <span className="px-2 py-0.5 bg-blue-900/60 text-blue-200 rounded text-[10px] font-semibold uppercase">
                    Dispatched
                  </span>
                </div>
              )}

              {/* Pickup Photo Proof */}
              {step.status === "PICKUP" && logEntry?.photoUrl && (
                <div className="mt-2.5">
                  <div className="text-[11px] text-amber-300/90 font-medium mb-1">
                    Pickup Photographic Proof:
                  </div>
                  <div className="relative rounded-lg overflow-hidden border border-slate-700 max-w-xs bg-slate-950">
                    <img
                      src={logEntry.photoUrl}
                      alt="Pickup Proof"
                      className="w-full h-32 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-slate-900/90 rounded text-[9px] text-slate-300 font-mono">
                      Timestamped GPS verified
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
