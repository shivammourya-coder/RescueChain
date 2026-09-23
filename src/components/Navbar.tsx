import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useLanguage } from "../context/LanguageContext";
import { Shield, Radio, Search, LogOut, LogIn, Globe, Activity, MapPin, Sparkles, FileText } from "lucide-react";
import { motion } from "motion/react";

export function Navbar() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const { lang, setLang, t } = useLanguage();
  const location = useLocation();

  const isCitizenActive = location.pathname === "/citizen" || location.pathname === "/report" || location.pathname.startsWith("/track");

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-amber-500 to-red-500 p-0.5 shadow-md shadow-amber-500/10">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            {connected && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-slate-100">
                Rescue<span className="text-amber-400">Chain</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide hidden sm:block">
              {t.tagline}
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-2 text-sm">
          {/* Unified Citizen Portal Link (Report & Track) */}
          <Link
            to="/citizen"
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
              isCitizenActive
                ? "bg-gradient-to-r from-red-600/20 to-amber-600/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent"
            }`}
          >
            <Radio className="w-4 h-4 text-red-400 animate-pulse" />
            <span>{lang === "en" ? "Citizen Portal (Report & Track)" : "नागरिक पोर्टल (SOS व ट्रैकिंग)"}</span>
          </Link>

          {user?.role === "volunteer" && (
            <Link
              to="/volunteer"
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
                location.pathname.startsWith("/volunteer")
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Activity className="w-4 h-4 text-blue-400" />
              <span>{lang === "en" ? "Volunteer Hub" : "स्वयंसेवक हब"}</span>
            </Link>
          )}

          {user?.role === "ngo" && (
            <Link
              to="/ngo"
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
                location.pathname.startsWith("/ngo")
                  ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-900"
              }`}
            >
              <MapPin className="w-4 h-4 text-teal-400" />
              <span>{lang === "en" ? "NGO Inventory" : "NGO राहत भंडार"}</span>
            </Link>
          )}

          {user?.role === "authority" && (
            <Link
              to="/authority"
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
                location.pathname.startsWith("/authority")
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Shield className="w-4 h-4 text-purple-400" />
              <span>{lang === "en" ? "Command Center" : "आपदा कमान केंद्र"}</span>
            </Link>
          )}

          {/* Direct Hackathon PDF Documentation Link */}
          <a
            href="/RescueChain_Documentation.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition-all border border-slate-800 hover:border-blue-500/50 text-xs"
            title="Open comprehensive 20-page Hackathon Project Documentation PDF"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>PDF Docs</span>
          </a>
        </nav>

        {/* Right Actions: Segmented Language Switcher + User/Login */}
        <div className="flex items-center gap-3">
          {/* Explicit Segmented Language Selector (Completely eliminates inversion confusion) */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl shadow-inner">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                lang === "en"
                  ? "bg-amber-400 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Switch to English"
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLang("hi")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                lang === "hi"
                  ? "bg-amber-400 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="हिन्दी में बदलें"
            >
              हिन्दी
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-200">{user.name}</div>
                <div className="text-[10px] text-amber-400/90 capitalize">{user.role} responder</div>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                title={lang === "en" ? "Log Out" : "लॉग आउट"}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-all hover:border-slate-700"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.responderLogin}</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
