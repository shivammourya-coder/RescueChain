import React from "react";
import { useSocket } from "../context/SocketContext";
import { WifiOff, Wifi, RefreshCw, Smartphone } from "lucide-react";

export function OfflineBanner() {
  const { isOnline, pendingOfflineCount, syncOfflineQueue, simulateOfflineToggle } = useSocket();
  const [syncing, setSyncing] = React.useState(false);

  const handleSync = async () => {
    setSyncing(true);
    await syncOfflineQueue();
    setSyncing(false);
  };

  if (isOnline && pendingOfflineCount === 0) {
    return null;
  }

  return (
    <div
      className={`w-full py-2.5 px-4 text-xs font-medium flex flex-wrap items-center justify-between gap-3 transition-colors border-b ${
        !isOnline
          ? "bg-amber-950/90 text-amber-200 border-amber-800"
          : "bg-blue-950/90 text-blue-200 border-blue-800"
      }`}
    >
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
        ) : (
          <Wifi className="w-4 h-4 text-blue-400 shrink-0" />
        )}
        <span>
          {!isOnline ? (
            <strong>Disaster Zone Connectivity: Offline Mode Active.</strong>
          ) : (
            <strong>Connectivity Restored.</strong>
          )}{" "}
          {pendingOfflineCount > 0 ? (
            <span>
              {pendingOfflineCount} emergency SOS report(s) queued locally in device memory (IndexedDB).
            </span>
          ) : (
            <span>All local reports are synced to the emergency cloud.</span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {pendingOfflineCount > 0 && isOnline && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            Sync Now ({pendingOfflineCount})
          </button>
        )}

        <button
          onClick={simulateOfflineToggle}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-[11px] flex items-center gap-1.5"
          title="Toggle offline mode simulation for hackathon presentation"
        >
          <Smartphone className="w-3 h-3 text-amber-400" />
          {isOnline ? "Simulate Offline" : "Restore Connection"}
        </button>
      </div>
    </div>
  );
}
