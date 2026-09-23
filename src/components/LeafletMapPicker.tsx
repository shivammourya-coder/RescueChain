import React, { useEffect, useRef } from "react";
import L from "leaflet";

interface LeafletMapPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  height?: string;
  zoom?: number;
}

export function LeafletMapPicker({
  lat,
  lng,
  onChange,
  height = "240px",
  zoom = 14
}: LeafletMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Create map instance
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
      }).addTo(map);

      // Custom emergency pin icon
      const pinIcon = L.divIcon({
        className: "custom-leaflet-pin",
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background: #ef4444;
            border: 3px solid #ffffff;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 10px;
              height: 10px;
              background: #ffffff;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const marker = L.marker([lat, lng], {
        draggable: true,
        icon: pinIcon
      }).addTo(map);

      marker.on("dragend", () => {
        const position = marker.getLatLng();
        onChange(Number(position.lat.toFixed(5)), Number(position.lng.toFixed(5)));
      });

      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        onChange(Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5)));
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else {
      // Update position
      const curPos = markerRef.current?.getLatLng();
      if (curPos && markerRef.current && mapInstanceRef.current && (Math.abs(curPos.lat - lat) > 0.0001 || Math.abs(curPos.lng - lng) > 0.0001)) {
        markerRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.setView([lat, lng], zoom);
      }
    }

    // Force tile recalculation after layout
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 150);

    return () => {
      // Clean up map on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Update marker if lat/lng change externally
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      const cur = markerRef.current.getLatLng();
      if (Math.abs(cur.lat - lat) > 0.0001 || Math.abs(cur.lng - lng) > 0.0001) {
        markerRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.flyTo([lat, lng], 15, {
          duration: 1.0,
          easeLinearity: 0.25
        });
      }
    }
  }, [lat, lng]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-700/80 shadow-inner">
      <div ref={mapContainerRef} style={{ height, width: "100%", zIndex: 1 }} />
      <div className="absolute bottom-2 left-2 z-10 px-2.5 py-1 bg-slate-900/90 backdrop-blur rounded border border-slate-700 text-[11px] text-slate-300 font-mono pointer-events-none">
        GPS: {lat.toFixed(4)}, {lng.toFixed(4)} (Tap or drag pin)
      </div>
    </div>
  );
}
