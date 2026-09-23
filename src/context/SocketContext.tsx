import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { EmergencyRequest } from "../types";
import { getQueuedOfflineReports, removeQueuedReport, getQueuedCount } from "../offline/queue";
import { api } from "../api/client";

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  isOnline: boolean;
  pendingOfflineCount: number;
  lastUpdatedRequest: EmergencyRequest | null;
  lastEscalation: { id: string; trackCode: string; level: number } | null;
  subscribeTrackCode: (trackCode: string) => void;
  syncOfflineQueue: () => Promise<number>;
  simulateOfflineToggle: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);
  const [lastUpdatedRequest, setLastUpdatedRequest] = useState<EmergencyRequest | null>(null);
  const [lastEscalation, setLastEscalation] = useState<{ id: string; trackCode: string; level: number } | null>(null);
  const activeRooms = useRef<Set<string>>(new Set());

  // Check offline queue count
  const refreshPendingCount = async () => {
    try {
      const count = await getQueuedCount();
      setPendingOfflineCount(count);
    } catch {
      // no-op
    }
  };

  // Sync offline queue to backend
  const syncOfflineQueue = async (): Promise<number> => {
    if (!navigator.onLine) return 0;
    try {
      const queued = await getQueuedOfflineReports();
      if (queued.length === 0) return 0;

      let syncedCount = 0;
      for (const item of queued) {
        try {
          const res = await api.requests.create({
            description: item.description,
            lat: item.lat,
            lng: item.lng,
            clientId: item.clientId,
            contact: item.contact,
            reportedAt: item.reportedAt
          });
          await removeQueuedReport(item.clientId);
          syncedCount++;

          if (res && res.trackCode) {
            localStorage.setItem("rescuechain_last_track", res.trackCode);
            if (res.otp) localStorage.setItem("rescuechain_last_otp", res.otp);
            if (res.reporterToken) {
              localStorage.setItem(`rescuechain_reporter_token_${res.trackCode}`, res.reporterToken);
            }
          }
        } catch (err) {
          console.error("Error syncing queued item:", err);
        }
      }
      await refreshPendingCount();

      // Dispatch global sync notification so open dashboards refresh instantly
      window.dispatchEvent(new CustomEvent("rescuechain:offline-synced", { detail: { syncedCount } }));

      return syncedCount;
    } catch (err) {
      console.error("Failed to run offline queue sync:", err);
      return 0;
    }
  };

  useEffect(() => {
    refreshPendingCount();

    const handleQueued = () => {
      refreshPendingCount();
    };
    window.addEventListener("rescuechain:offline-queued", handleQueued);

    // Listen to network status
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initialize Socket.io
    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const s = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    s.on("connect", () => {
      setConnected(true);
      // Re-join any active rooms
      activeRooms.current.forEach((code) => {
        s.emit("track", { trackCode: code });
      });
    });

    s.on("disconnect", () => {
      setConnected(false);
    });

    s.on("request:update", (updated: EmergencyRequest) => {
      setLastUpdatedRequest(updated);
    });

    s.on("request:escalated", (data: { id: string; trackCode: string; level: number }) => {
      setLastEscalation(data);
    });

    setSocket(s);

    // Initial sync check
    if (navigator.onLine) {
      syncOfflineQueue();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      s.disconnect();
    };
  }, []);

  const subscribeTrackCode = (trackCode: string) => {
    if (!trackCode) return;
    activeRooms.current.add(trackCode);
    if (socket && socket.connected) {
      socket.emit("track", { trackCode });
    }
  };

  // Demo tool: allow user to manually simulate offline mode for testing
  const simulateOfflineToggle = () => {
    setIsOnline((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => syncOfflineQueue(), 300);
      }
      return next;
    });
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        isOnline,
        pendingOfflineCount,
        lastUpdatedRequest,
        lastEscalation,
        subscribeTrackCode,
        syncOfflineQueue,
        simulateOfflineToggle
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
