import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { api } from "../api/client";
import { Shield, Users, Building2, UserCircle, RotateCcw, Zap, Sparkles, FileText, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function DemoBar() {
  const { user, quickDemoLogin, logout } = useAuth();
  const { simulateOfflineToggle, isOnline } = useSocket();
  const navigate = useNavigate();
  const [resetting, setResetting] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleResetDemo = async () => {
    setResetting(true);
    try {
      await api.demo.reset();
      window.location.reload();
    } catch {
      // no-op
    } finally {
      setResetting(false);
    }
  };

  const switchToCitizen = () => {
    logout();
    navigate("/report");
  };

  const switchToRole = async (role: "volunteer" | "ngo" | "authority") => {
    await quickDemoLogin(role);
    if (role === "volunteer") navigate("/volunteer");
    if (role === "ngo") navigate("/ngo");
    if (role === "authority") navigate("/authority");
  };

  if (collapsed) {
    return (
      <div className="fixed bottom-3 right-3 z-50">
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Jury Demo Controller
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-md">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 font-bold text-amber-400 uppercase tracking-wider text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          <Zap className="w-3 h-3 text-amber-400" />
          Jury Demo Deck
        </span>
        <span className="text-slate-400 hidden sm:inline text-[11px]">
          Quick Role Switcher:
        </span>

        <div className="flex items-center gap-1">
          {/* 1. Citizen */}
          <button
            onClick={switchToCitizen}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-all ${
              !user
                ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <UserCircle className="w-3.5 h-3.5" />
            <span>Citizen (No Login)</span>
          </button>

          {/* 2. Volunteer */}
          <button
            onClick={() => switchToRole("volunteer")}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-all ${
              user?.role === "volunteer"
                ? "bg-blue-600 text-white font-bold shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Volunteer</span>
          </button>

          {/* 3. NGO */}
          <button
            onClick={() => switchToRole("ngo")}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-all ${
              user?.role === "ngo"
                ? "bg-teal-600 text-white font-bold shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>NGO Stock</span>
          </button>

          {/* 4. Authority */}
          <button
            onClick={() => switchToRole("authority")}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-all ${
              user?.role === "authority"
                ? "bg-purple-600 text-white font-bold shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Authority HQ</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* PDF Documentation Download / Preview Link */}
        <a
          href="/RescueChain_Documentation.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-all"
          title="Open comprehensive 20-page Hackathon Project Documentation PDF"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Documentation PDF</span>
        </a>

        <button
          onClick={simulateOfflineToggle}
          className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all ${
            !isOnline
              ? "bg-amber-500 text-slate-950 border-amber-400"
              : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
          }`}
          title="Simulates zero network connectivity for offline queue demo"
        >
          {!isOnline ? "⚡ SIMULATING OFFLINE" : "Simulate Offline"}
        </button>

        <button
          onClick={handleResetDemo}
          disabled={resetting}
          className="px-2.5 py-1 bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-200 rounded border border-slate-700 flex items-center gap-1 text-[11px] transition-all"
          title="Reset database to seed flood scenario"
        >
          <RotateCcw className={`w-3 h-3 ${resetting ? "animate-spin" : ""}`} />
          Reset Seed Data
        </button>

        <button
          onClick={() => setCollapsed(true)}
          className="text-slate-500 hover:text-slate-300 text-xs px-1"
          title="Hide toolbar"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
