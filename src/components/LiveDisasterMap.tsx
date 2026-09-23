import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { EmergencyRequest, ResourceItem } from "../types";

interface LiveDisasterMapProps {
  requests: EmergencyRequest[];
  resources?: ResourceItem[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  selectedRequestId?: string | null;
  onSelectRequest?: (req: EmergencyRequest) => void;
  onFlagFake?: (id: string) => void;
  onEscalate?: (id: string) => void;
}

export function LiveDisasterMap({
  requests,
  resources = [],
  center = [19.0760, 72.8777],
  zoom = 13,
  height = "520px",
  selectedRequestId,
  onSelectRequest,
  onFlagFake,
  onEscalate
}: LiveDisasterMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: false
      });

      // Dark style OpenStreetMap tiles or CARTO Dark
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, []);

  // Sync Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Render Resource Depots (Teal/Emerald hubs)
    resources.forEach((res) => {
      const [lng, lat] = res.location.coordinates;
      const resIcon = L.divIcon({
        className: "resource-depot-marker",
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background: #0d9488;
            border: 2.5px solid #ffffff;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(13, 148, 136, 0.5);
          " title="${res.name}">
            📦
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([lat, lng], { icon: resIcon });
      marker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; min-width: 190px; color: #0f172a; padding: 4px;">
          <div style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: #0d9488; margin-bottom: 2px;">
            NGO Relief Depot
          </div>
          <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 4px;">
            ${res.name}
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
            Owner: <strong>${res.ownerName}</strong>
          </div>
          <div style="font-size: 11px; background: #f0fdfa; border: 1px solid #ccfbf1; padding: 4px 6px; border-radius: 4px; color: #0f766e;">
            Available: <strong>${Math.max(0, res.quantity - res.allocated)}</strong> / ${res.quantity} ${res.unit}
          </div>
        </div>
      `);
      layerGroup.addLayer(marker);
    });

    // 2. Render Emergency Requests
    const urgencyColors: Record<number, string> = {
      5: "#ef4444", // Red
      4: "#f97316", // Orange
      3: "#f59e0b", // Amber
      2: "#0284c7", // Blue
      1: "#64748b"  // Gray
    };

    requests.forEach((req) => {
      const [lng, lat] = req.location.coordinates;
      const color = req.suspectedFake ? "#475569" : urgencyColors[req.urgency] || "#ef4444";
      const isSelected = selectedRequestId === req.id;
      const pulseRing = req.urgency >= 4 && !req.suspectedFake ? "animation: pulse 1.8s infinite;" : "";

      const reqIcon = L.divIcon({
        className: "emergency-sos-marker",
        html: `
          <div style="
            position: relative;
            width: ${isSelected ? "38px" : "30px"};
            height: ${isSelected ? "38px" : "30px"};
            background: ${color};
            border: ${isSelected ? "3px solid #fef08a" : "2.5px solid #ffffff"};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 12px;
            font-weight: 800;
            box-shadow: 0 4px 14px ${color}88;
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            ${req.urgency}
            ${
              req.escalationLevel > 1
                ? `<span style="position: absolute; top: -5px; right: -5px; background: #dc2626; color: #fff; font-size: 8px; padding: 1px 4px; border-radius: 10px; border: 1px solid #fff;">E${req.escalationLevel}</span>`
                : ""
            }
          </div>
        `,
        iconSize: isSelected ? [38, 38] : [30, 30],
        iconAnchor: isSelected ? [19, 19] : [15, 15]
      });

      const marker = L.marker([lat, lng], { icon: reqIcon });

      // Add popup with triage intel and actions
      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; min-width: 220px; max-width: 280px; color: #0f172a; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: ${color}20; color: ${color}; border: 1px solid ${color}60;">
              TIER ${req.urgency} • ${req.category.toUpperCase()}
            </span>
            <span style="font-size: 11px; font-family: monospace; font-weight: 700; color: #0284c7;">
              ${req.trackCode}
            </span>
          </div>

          <div style="font-size: 12px; font-weight: 600; color: #0f172a; line-height: 1.4; margin-bottom: 6px;">
            ${req.summary || req.description}
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px; background: #f8fafc; padding: 6px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 8px;">
            <div><strong>Status:</strong> ${req.status}</div>
            <div><strong>People:</strong> ${req.people} affected</div>
            <div><strong>Reports:</strong> ${req.reportCount || 1} merged</div>
            <div><strong>Triage:</strong> ${req.triageSource === "ai" ? "Gemini AI" : "Rules"}</div>
          </div>

          ${
            req.suspectedFake
              ? `<div style="font-size: 10px; color: #b91c1c; font-weight: bold; margin-bottom: 6px;">⚠️ Flagged as Suspected Fake</div>`
              : ""
          }

          <div style="display: flex; gap: 6px;">
            <button id="btn-select-${req.id}" style="flex: 1; padding: 5px 8px; font-size: 11px; background: #0f172a; color: #fff; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">
              View Details
            </button>
            ${
              !req.suspectedFake
                ? `<button id="btn-fake-${req.id}" style="padding: 5px 8px; font-size: 11px; background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 4px; font-weight: 600; cursor: pointer;">
                    Flag Fake
                  </button>`
                : ""
            }
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on("popupopen", () => {
        const selBtn = document.getElementById(`btn-select-${req.id}`);
        if (selBtn) {
          selBtn.onclick = () => onSelectRequest?.(req);
        }
        const fakeBtn = document.getElementById(`btn-fake-${req.id}`);
        if (fakeBtn && onFlagFake) {
          fakeBtn.onclick = () => onFlagFake(req.id);
        }
      });

      marker.on("click", () => {
        onSelectRequest?.(req);
      });

      layerGroup.addLayer(marker);

      // Add a subtle sector radius ring around high urgency requests or clusters
      if (req.urgency >= 4 && !req.suspectedFake) {
        const circle = L.circle([lat, lng], {
          radius: 350,
          color,
          fillColor: color,
          fillOpacity: 0.08,
          weight: 1,
          dashArray: "4 4"
        });
        layerGroup.addLayer(circle);
      }
    });

    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 150);
  }, [requests, resources, selectedRequestId]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
      <div ref={mapContainerRef} style={{ height, width: "100%", zIndex: 1 }} />
      {/* Map Legend Overlay */}
      <div className="absolute top-3 right-3 z-10 p-2.5 rounded-lg bg-slate-900/90 backdrop-blur border border-slate-800 text-[11px] text-slate-300 shadow-lg space-y-1 pointer-events-none">
        <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 mb-1 text-[10px] uppercase tracking-wider">
          Tactical Map Legend
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shrink-0"></span>
          <span>Tier 5: Life-Critical SOS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block shrink-0"></span>
          <span>Tier 4: High Urgency</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shrink-0"></span>
          <span>Tier 3: Moderate Need</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-teal-600 inline-block shrink-0"></span>
          <span>Relief Depot (Supplies)</span>
        </div>
      </div>
    </div>
  );
}
