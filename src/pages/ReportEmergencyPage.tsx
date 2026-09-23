import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { queueOfflineReport } from "../offline/queue";
import { useSocket } from "../context/SocketContext";
import { translations, Language } from "../i18n/translations";
import { LeafletMapPicker } from "../components/LeafletMapPicker";
import {
  AlertTriangle,
  MapPin,
  Send,
  CheckCircle,
  Copy,
  Check,
  Phone,
  Shield,
  Clock,
  Sparkles,
  WifiOff
} from "lucide-react";

interface ReportEmergencyPageProps {
  lang: Language;
}

export function ReportEmergencyPage({ lang }: ReportEmergencyPageProps) {
  const t = translations[lang];
  const { isOnline, syncOfflineQueue } = useSocket();
  const navigate = useNavigate();

  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [lat, setLat] = useState<number>(19.0760);
  const [lng, setLng] = useState<number>(72.8777);
  const [geoState, setGeoState] = useState<"detecting" | "locked" | "denied">("detecting");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success Confirmation State
  const [submittedData, setSubmittedData] = useState<{
    trackCode: string;
    otp: string;
    isOfflineQueued?: boolean;
  } | null>(null);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Auto-detect geolocation
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(Number(pos.coords.latitude.toFixed(5)));
          setLng(Number(pos.coords.longitude.toFixed(5)));
          setGeoState("locked");
        },
        (err) => {
          console.warn("Geolocation denied or unavailable:", err.message);
          setGeoState("denied");
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setGeoState("denied");
    }
  }, []);

  // Quick preset emergency phrases for faster testing in presentation
  const emergencyPresets = [
    "Water reached 1st floor, family of 5 trapped on roof with elderly grandmother who needs heart medicine urgently. Please send rescue boat.",
    "छत पर 4 लोग फंसे हैं, पीने का पानी खत्म हो गया है और एक छोटा बच्चा भूखा है। तुरंत मदद चाहिए।",
    "Flooded ground floor in school shelter, 35 people stranded without drinking water and rations."
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Please describe the emergency situation.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const reportedAt = new Date().toISOString();

    // Check if offline or online
    if (!isOnline || !navigator.onLine) {
      // Offline Flow -> Save to IndexedDB
      const offlineItem = {
        clientId,
        description: description.trim(),
        lat,
        lng,
        contact: contact.trim() || undefined,
        reportedAt
      };

      try {
        await queueOfflineReport(offlineItem);
        // Generate predictable provisional tracking code for user
        const provisionalCode = `RC-OFFLINE-${clientId.substring(7, 12).toUpperCase()}`;
        const provisionalOtp = "9999";

        localStorage.setItem("rescuechain_last_track", provisionalCode);
        localStorage.setItem("rescuechain_last_otp", provisionalOtp);

        setSubmittedData({
          trackCode: provisionalCode,
          otp: provisionalOtp,
          isOfflineQueued: true
        });
      } catch (err: any) {
        setError("Failed to save report offline: " + err.message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Online Flow -> Post directly to API
    try {
      const result = await api.requests.create({
        description: description.trim(),
        lat,
        lng,
        clientId,
        contact: contact.trim() || undefined,
        reportedAt
      });

      // Save to localStorage for quick return
      localStorage.setItem("rescuechain_last_track", result.trackCode);
      if (result.otp) {
        localStorage.setItem("rescuechain_last_otp", result.otp);
      }

      setSubmittedData({
        trackCode: result.trackCode,
        otp: result.otp || "••••",
        isOfflineQueued: false
      });
    } catch (err: any) {
      // If network fails unexpectedly mid-request, fallback to IndexedDB queue
      console.warn("Online POST failed, falling back to local queue:", err);
      const offlineItem = {
        clientId,
        description: description.trim(),
        lat,
        lng,
        contact: contact.trim() || undefined,
        reportedAt
      };
      await queueOfflineReport(offlineItem);
      const provisionalCode = `RC-OFFLINE-${clientId.substring(7, 12).toUpperCase()}`;
      setSubmittedData({
        trackCode: provisionalCode,
        otp: "9999",
        isOfflineQueued: true
      });
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, type: "code" | "otp") => {
    navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    }
  };

  // 1. Success Confirmation View
  if (submittedData) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-slate-100">
              {submittedData.isOfflineQueued
                ? "SOS Saved on Your Device"
                : "Emergency Signal Broadcasted"}
            </h2>

            <p className="text-sm text-slate-400">
              {submittedData.isOfflineQueued
                ? "Your phone is currently offline. The signal is securely stored in local storage and will automatically dispatch the moment cellular or Wi-Fi connectivity returns."
                : "Your SOS has been prioritized by AI triage, clustered with nearby responders, and matched to emergency relief inventory."}
            </p>
          </div>

          {/* Tracking Code Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-xs uppercase font-bold text-sky-400 flex items-center justify-between">
              <span>{t.trackingCode}</span>
              <span className="text-[11px] text-slate-500 font-mono">Public Status</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="font-mono text-3xl font-black text-white tracking-wider">
                {submittedData.trackCode}
              </div>
              <button
                onClick={() => copyToClipboard(submittedData.trackCode, "code")}
                className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all flex items-center gap-1 text-xs font-semibold"
                title="Copy tracking code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Secret Delivery OTP Card */}
          <div className="p-5 rounded-xl bg-amber-950/40 border-2 border-amber-500/50 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold text-amber-300 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-400" />
                {t.deliveryOtp}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold">
                SECRET HANDOVER KEY
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 py-1">
              <div className="font-mono text-4xl font-black text-amber-300 tracking-widest">
                {submittedData.otp}
              </div>
              <button
                onClick={() => copyToClipboard(submittedData.otp, "otp")}
                className="p-2.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-all flex items-center gap-1 text-xs"
              >
                {copiedOtp ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedOtp ? "Copied" : "Copy OTP"}</span>
              </button>
            </div>

            <p className="text-xs text-amber-200/90 leading-relaxed font-medium pt-1">
              ⚠️ <strong>Critical Security Instruction:</strong> {t.keepOtpWarning}
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-2">
            {!submittedData.isOfflineQueued ? (
              <Link
                to={`/track/${submittedData.trackCode}`}
                className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm text-center flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t.viewLiveTimeline}</span>
              </Link>
            ) : (
              <button
                onClick={() => {
                  syncOfflineQueue();
                  navigate(`/track/${submittedData.trackCode}`);
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm text-center flex items-center justify-center gap-2 transition-all"
              >
                <WifiOff className="w-4 h-4" />
                <span>Track Pending Queue</span>
              </button>
            )}

            <button
              onClick={() => {
                setSubmittedData(null);
                setDescription("");
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold text-center transition-all"
            >
              Report Another Emergency
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Main SOS Report Form
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Priority Emergency Broadcast</span>
        </div>
        <h1 className="text-3xl font-black text-white">{t.reportEmergency}</h1>
        <p className="text-sm text-slate-400">
          No sign-in required. Works completely offline. Triage AI processes English, Hindi, and mixed regional phrases.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Emergency Description */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-200">
            {t.emergencyDescLabel} <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.emergencyDescPlaceholder}
            className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            required
          />

          {/* Quick Demo Presets */}
          <div className="pt-1">
            <span className="text-[11px] text-slate-500 font-medium">Quick presets for demo testing:</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {emergencyPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setDescription(preset)}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-400 hover:text-slate-200 text-left transition-all"
                >
                  Preset {idx + 1}: {preset.slice(0, 32)}...
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Number */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-200">
            {t.phoneLabel}
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="tel"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t.phonePlaceholder}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* GPS Location & Map Pin Picker */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-400" />
              <span>Incident Location Coordinates</span>
            </label>
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded ${
                geoState === "locked"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : geoState === "detecting"
                  ? "bg-amber-500/20 text-amber-400 animate-pulse"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {geoState === "locked" ? t.gpsLocked : geoState === "detecting" ? t.gpsDetecting : "Manual GPS Mode"}
            </span>
          </div>

          <p className="text-xs text-slate-400">{t.dragPinHelp}</p>

          <LeafletMapPicker
            lat={lat}
            lng={lng}
            onChange={(newLat, newLng) => {
              setLat(newLat);
              setLng(newLng);
            }}
            height="220px"
          />

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-500 block text-[10px]">Latitude</span>
              <span className="font-mono text-slate-200 font-semibold">{lat.toFixed(5)}</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-500 block text-[10px]">Longitude</span>
              <span className="font-mono text-slate-200 font-semibold">{lng.toFixed(5)}</span>
            </div>
          </div>
        </div>

        {/* Submit SOS Button */}
        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-4 px-6 rounded-xl font-black text-base shadow-xl transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 ${
            !isOnline
              ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
              : "bg-red-600 hover:bg-red-500 text-white shadow-red-600/30"
          }`}
        >
          <Send className="w-5 h-5" />
          <span>
            {submitting
              ? t.submitting
              : !isOnline
              ? "SAVE SOS OFFLINE (SYNC ON RECONNECT)"
              : t.submitSos}
          </span>
        </button>

        <p className="text-center text-xs text-slate-500">
          Encrypted client token • Retries never produce duplicate signals • Direct socket dispatch
        </p>
      </form>
    </div>
  );
}
