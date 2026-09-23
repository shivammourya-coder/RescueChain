import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { queueOfflineReport } from "../offline/queue";
import { useSocket } from "../context/SocketContext";
import { useLanguage } from "../context/LanguageContext";
import { LeafletMapPicker } from "../components/LeafletMapPicker";
import { StatusTimeline } from "../components/StatusTimeline";
import { UrgencyBadge } from "../components/UrgencyBadge";
import { StatusBadge } from "../components/StatusBadge";
import { LiveRadarScanner } from "../components/LiveRadarScanner";
import { LocationSearchBar } from "../components/LocationSearchBar";
import { EmergencyRequest } from "../types";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import {
  Radio,
  Search,
  MapPin,
  Send,
  CheckCircle,
  Copy,
  Check,
  Phone,
  Shield,
  Clock,
  Sparkles,
  WifiOff,
  AlertTriangle,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ExternalLink,
  Package,
  UserCheck,
  Zap,
  Activity
} from "lucide-react";

export function CitizenPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOnline, subscribeTrackCode, lastUpdatedRequest } = useSocket();
  const { lang, t } = useLanguage();

  const tabParam = searchParams.get("tab");
  const codeParam = searchParams.get("code");

  const [activeTab, setActiveTab] = useState<"report" | "track">(
    tabParam === "track" || codeParam ? "track" : "report"
  );

  // REPORT STATE
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [lat, setLat] = useState<number>(19.076);
  const [lng, setLng] = useState<number>(72.8777);
  const [locationLabel, setLocationLabel] = useState<string>("");
  const [geoState, setGeoState] = useState<"detecting" | "locked" | "denied">("detecting");
  const [submitting, setSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    trackCode: string;
    otp: string;
    isOfflineQueued?: boolean;
  } | null>(null);

  // TRACK STATE
  const [inputCode, setInputCode] = useState<string>(
    codeParam || localStorage.getItem("rescuechain_last_track") || "RC-82914"
  );
  const [trackedRequest, setTrackedRequest] = useState<EmergencyRequest | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);

  // CITIZEN VERIFICATION MODAL STATE
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyPhone, setVerifyPhone] = useState("");
  const [verifyOtpInput, setVerifyOtpInput] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // COPY STATES
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [showOtpPlain, setShowOtpPlain] = useState(true);

  // RECENT SOS LIST ON THIS PHONE
  const [recentReports, setRecentReports] = useState<
    Array<{ trackCode: string; otp?: string; reportedAt: string; description: string }>
  >([]);

  useEffect(() => {
    const listStr = localStorage.getItem("rescuechain_my_sos_list");
    if (listStr) {
      try {
        setRecentReports(JSON.parse(listStr));
      } catch {
        // no-op
      }
    }
  }, []);

  // Sync tab with URL
  useEffect(() => {
    if (tabParam === "track") {
      setActiveTab("track");
    } else if (tabParam === "report") {
      setActiveTab("report");
    }
  }, [tabParam]);

  // Listen for offline queue sync completion to refresh tracking codes
  useEffect(() => {
    const handleSynced = () => {
      const lastTrack = localStorage.getItem("rescuechain_last_track");
      const lastOtp = localStorage.getItem("rescuechain_last_otp");
      if (lastTrack && !lastTrack.startsWith("RC-OFFLINE-")) {
        setSubmittedData((prev) => {
          if (prev && prev.isOfflineQueued) {
            return {
              trackCode: lastTrack,
              otp: lastOtp || prev.otp,
              isOfflineQueued: false
            };
          }
          return prev;
        });
        if (inputCode.startsWith("RC-OFFLINE-")) {
          setInputCode(lastTrack);
          handleFetchTrack(lastTrack);
        }
      }
    };
    window.addEventListener("rescuechain:offline-synced", handleSynced);
    return () => window.removeEventListener("rescuechain:offline-synced", handleSynced);
  }, [inputCode]);

  // Auto-detect geolocation for report
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(Number(pos.coords.latitude.toFixed(5)));
          setLng(Number(pos.coords.longitude.toFixed(5)));
          setGeoState("locked");
        },
        () => setGeoState("denied"),
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setGeoState("denied");
    }
  }, []);

  // Trigger celebration confetti
  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f59e0b", "#10b981", "#38bdf8", "#ef4444"]
      });
    } catch {
      // no-op if confetti fails
    }
  };

  // Fetch track data
  const handleFetchTrack = async (codeToTrack: string) => {
    if (!codeToTrack.trim()) return;
    setTrackLoading(true);
    setTrackError(null);

    // If offline temporary code
    if (codeToTrack.startsWith("RC-OFFLINE")) {
      const storedOtp = localStorage.getItem("rescuechain_last_otp") || "9999";
      setTrackedRequest({
        id: "offline_temp",
        trackCode: codeToTrack,
        otp: storedOtp,
        isReporter: true,
        description:
          "Emergency report saved offline on device memory. Central dispatch will receive it immediately upon network link.",
        category: "rescue",
        urgency: 4,
        needs: ["Offline report awaiting sync"],
        summary: "Local offline emergency report queued on phone.",
        people: 1,
        suspectedFake: false,
        triageSource: "rules",
        location: { type: "Point", coordinates: [72.8777, 19.076] },
        status: "REPORTED",
        timeline: [
          {
            status: "REPORTED",
            at: new Date().toISOString(),
            by: "Device Storage",
            note: "Stored in phone memory. Automatic sync triggers when online."
          }
        ],
        reportCount: 1,
        escalationLevel: 1,
        reportedAt: new Date().toISOString()
      });
      setTrackLoading(false);
      return;
    }

    try {
      const codeUpper = codeToTrack.trim().toUpperCase();
      const storedOtp =
        localStorage.getItem(`rescuechain_otp_${codeUpper}`) ||
        (localStorage.getItem("rescuechain_last_track")?.toUpperCase() === codeUpper
          ? localStorage.getItem("rescuechain_last_otp")
          : null);

      const data = await api.requests.track(codeToTrack.trim());
      if (storedOtp && !data.otp) {
        data.otp = storedOtp;
        data.isReporter = true;
      }
      setTrackedRequest(data);
      subscribeTrackCode(codeToTrack.trim());
      if (data.status === "VERIFIED" || data.status === "DELIVERED") {
        triggerCelebration();
      }
    } catch (err: any) {
      setTrackError(err.message || "Tracking code not found. Please verify the code.");
      setTrackedRequest(null);
    } finally {
      setTrackLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "track" && inputCode) {
      handleFetchTrack(inputCode);
    }
  }, [activeTab]);

  // Live Socket updates
  useEffect(() => {
    if (lastUpdatedRequest && trackedRequest && lastUpdatedRequest.id === trackedRequest.id) {
      setTrackedRequest((prev) => (prev ? { ...prev, ...lastUpdatedRequest } : null));
      if (lastUpdatedRequest.status === "VERIFIED") {
        triggerCelebration();
      }
    }
  }, [lastUpdatedRequest]);

  // SUBMIT SOS REPORT
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setReportError("Please describe the emergency situation.");
      return;
    }

    setSubmitting(true);
    setReportError(null);

    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const reportedAt = new Date().toISOString();

    if (!isOnline || !navigator.onLine) {
      // Offline Flow
      try {
        await queueOfflineReport({
          clientId,
          description: description.trim(),
          lat,
          lng,
          contact: contact.trim() || undefined,
          reportedAt
        });

        window.dispatchEvent(new CustomEvent("rescuechain:offline-queued"));

        const provisionalCode = `RC-OFFLINE-${clientId.substring(7, 12).toUpperCase()}`;
        const provisionalOtp = "9999";

        localStorage.setItem("rescuechain_last_track", provisionalCode);
        localStorage.setItem("rescuechain_last_otp", provisionalOtp);
        localStorage.setItem(`rescuechain_reporter_token_${provisionalCode}`, "offline_token");

        // Save to my recent SOS list
        const updatedList = [
          {
            trackCode: provisionalCode,
            otp: provisionalOtp,
            reportedAt,
            description: description.trim().substring(0, 70)
          },
          ...recentReports
        ].slice(0, 10);
        setRecentReports(updatedList);
        localStorage.setItem("rescuechain_my_sos_list", JSON.stringify(updatedList));

        setSubmittedData({
          trackCode: provisionalCode,
          otp: provisionalOtp,
          isOfflineQueued: true
        });
        triggerCelebration();
      } catch (err: any) {
        setReportError("Failed to save report offline: " + err.message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Online Flow
    try {
      const result = await api.requests.create({
        description: description.trim(),
        lat,
        lng,
        clientId,
        contact: contact.trim() || undefined,
        reportedAt
      });

      // Save credentials for verified reporter identity
      localStorage.setItem("rescuechain_last_track", result.trackCode);
      if (result.otp) {
        localStorage.setItem("rescuechain_last_otp", result.otp);
      }
      if (result.reporterToken) {
        localStorage.setItem(`rescuechain_reporter_token_${result.trackCode}`, result.reporterToken);
      }

      // Save to recent reports on this phone
      const updatedList = [
        {
          trackCode: result.trackCode,
          otp: result.otp,
          reportedAt,
          description: description.trim().substring(0, 70)
        },
        ...recentReports
      ].slice(0, 10);
      setRecentReports(updatedList);
      localStorage.setItem("rescuechain_my_sos_list", JSON.stringify(updatedList));

      setSubmittedData({
        trackCode: result.trackCode,
        otp: result.otp || "••••",
        isOfflineQueued: false
      });
      triggerCelebration();
    } catch (err: any) {
      console.warn("Online submission failed, storing to offline queue:", err);
      await queueOfflineReport({
        clientId,
        description: description.trim(),
        lat,
        lng,
        contact: contact.trim() || undefined,
        reportedAt
      });
      const provisionalCode = `RC-OFFLINE-${clientId.substring(7, 12).toUpperCase()}`;
      setSubmittedData({
        trackCode: provisionalCode,
        otp: "9999",
        isOfflineQueued: true
      });
      triggerCelebration();
    } finally {
      setSubmitting(false);
    }
  };

  // VERIFY AS CITIZEN REPORTER
  const handleVerifyCitizenOwnership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackedRequest) return;
    setVerifyLoading(true);
    setVerifyError(null);

    try {
      const res = await api.requests.verifyReporter(trackedRequest.trackCode, {
        phone: verifyPhone.trim() || undefined,
        otp: verifyOtpInput.trim() || undefined
      });

      if (res.verified) {
        localStorage.setItem(`rescuechain_reporter_token_${trackedRequest.trackCode}`, res.reporterToken);
        localStorage.setItem("rescuechain_last_track", trackedRequest.trackCode);
        localStorage.setItem("rescuechain_last_otp", res.otp);

        setTrackedRequest((prev) =>
          prev ? { ...prev, otp: res.otp, isReporter: true } : null
        );
        setShowVerifyModal(false);
        triggerCelebration();
      }
    } catch (err: any) {
      setVerifyError(err.message || "Could not verify citizen ownership. Please check your phone number.");
    } finally {
      setVerifyLoading(false);
    }
  };

  // 1-Click Quick Unlock OTP for citizen or demo
  const handleQuickUnlockOtp = async () => {
    if (!trackedRequest) return;
    setVerifyLoading(true);
    setVerifyError(null);

    try {
      const res = await api.requests.verifyReporter(trackedRequest.trackCode, {
        phone: trackedRequest.contact || verifyPhone.trim() || undefined,
        quickVerify: true
      });

      if (res.verified) {
        localStorage.setItem(`rescuechain_reporter_token_${trackedRequest.trackCode}`, res.reporterToken);
        localStorage.setItem("rescuechain_last_track", trackedRequest.trackCode);
        localStorage.setItem("rescuechain_last_otp", res.otp);
        localStorage.setItem(`rescuechain_otp_${trackedRequest.trackCode.toUpperCase()}`, res.otp);

        setTrackedRequest((prev) =>
          prev ? { ...prev, otp: res.otp, isReporter: true } : null
        );
        setShowVerifyModal(false);
        triggerCelebration();
      }
    } catch (err: any) {
      setVerifyError(err.message || "Could not verify citizen ownership. Please enter your phone number.");
      setShowVerifyModal(true);
    } finally {
      setVerifyLoading(false);
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

  return (
    <div className="max-w-6xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 relative z-10">
      {/* Top Beacon Header with Animated Concentric Radar Pulse */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-3 relative"
      >
        {/* Animated Sonar Radar Beacon Rings in Background */}
        <div className="absolute left-1/2 -top-4 -translate-x-1/2 pointer-events-none w-40 h-40 flex items-center justify-center -z-10">
          <div className="absolute w-24 h-24 rounded-full bg-red-500/10 animate-sonar" />
          <div className="absolute w-24 h-24 rounded-full bg-amber-500/10 animate-sonar-delayed" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-wide shadow-lg shadow-amber-500/10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{lang === "en" ? "RescueChain Citizen Safety Portal" : "रेस्क्यूचेन नागरिक सुरक्षा पोर्टल"}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight px-2">
          {lang === "en" ? "Emergency Relief & Verification" : "आपातकालीन राहत एवं सत्यापन"}
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed px-3">
          {lang === "en"
            ? "Broadcast critical distress signals and track verified physical aid delivery with confidential recipient OTP."
            : "आपातकालीन संकेत भेजें और गोपनीय नागरिक OTP के साथ राहत सामग्री की डिलीवरी ट्रैक करें।"}
        </p>

        {/* Live Radar Feed Status Scanner */}
        <div className="w-full max-w-md mx-auto pt-1 px-1">
          <LiveRadarScanner
            label={lang === "en" ? "Live Disaster Mesh" : "लाइव आपदा मेश"}
            statusText={
              lang === "en"
                ? "Active listening on 433MHz & Cellular Mesh"
                : "433MHz व सेल्युलर मेश पर निरंतर सक्रिय"
            }
          />
        </div>
      </motion.div>

      {/* Primary Focused Tabs: ONLY Report & Track with Animated Slider */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 max-w-md mx-auto shadow-2xl relative gap-1"
      >
        <button
          type="button"
          onClick={() => {
            setActiveTab("report");
            setSearchParams({ tab: "report" });
          }}
          className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all relative z-10 ${
            activeTab === "report" ? "text-slate-950 font-black shadow-sm" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Radio className={`w-4 h-4 shrink-0 ${activeTab === "report" ? "text-slate-950 animate-pulse" : "text-red-400"}`} />
          <span className="truncate">{t.reportSosTab}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("track");
            setSearchParams({ tab: "track" });
          }}
          className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all relative z-10 ${
            activeTab === "track" ? "text-slate-950 font-black shadow-sm" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Search className="w-4 h-4 shrink-0" />
          <span className="truncate">{t.trackSosTab}</span>
        </button>

        {/* Animated Pill Indicator */}
        <motion.div
          className="absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 shadow-md shadow-amber-400/30"
          layout
          transition={{ type: "spring", stiffness: 450, damping: 35 }}
          style={{
            width: "calc(50% - 6px)",
            left: activeTab === "report" ? "6px" : "calc(50%)"
          }}
        />
      </motion.div>

      {/* TAB CONTENT WITH RICH ANIMATION */}
      <AnimatePresence mode="wait">
        {activeTab === "report" && (
          <motion.div
            key="tab-report"
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* SUCCESS CONFIRMATION MODAL / PANEL */}
            {submittedData ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/60 shadow-2xl glow-amber space-y-6 relative overflow-hidden"
              >
                {/* Background radar sweep accent */}
                <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.6 }}
                    className="w-14 h-14 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle className="w-8 h-8" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                      <span>{lang === "en" ? "SOS Signal Registered in Chain!" : "SOS सिग्नल श्रृंखला में दर्ज हो गया!"}</span>
                      <Sparkles className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: "8s" }} />
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {submittedData.isOfflineQueued
                        ? t.offlineNoticeDesc
                        : lang === "en"
                        ? "AI triage completed. Nearby resources and field volunteers have been notified."
                        : "AI ट्राइएज पूर्ण। नजदीकी राहत भंडार और स्वयंसेवकों को सूचना भेज दी गई है।"}
                    </p>
                  </div>
                </div>

                {/* Tracking Code and Confidential OTP Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tracking Code */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2 shadow-inner"
                  >
                    <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">
                      {t.trackingCode}
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-2xl font-black text-sky-400 tracking-wider">
                        {submittedData.trackCode}
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={() => copyToClipboard(submittedData.trackCode, "code")}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 transition-all"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? "Copied" : "Copy"}</span>
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Secret Handover OTP with Neon Glow */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/60 to-amber-900/30 border-2 border-amber-500/70 space-y-2 shadow-xl glow-amber relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-amber-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4 text-amber-400 animate-bounce" />
                        {t.deliveryOtp}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold">
                        {lang === "en" ? "CONFIDENTIAL" : "गोपनीय"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="font-mono text-4xl font-black text-amber-300 tracking-widest">
                        {submittedData.otp}
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={() => copyToClipboard(submittedData.otp, "otp")}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1 transition-all shadow-md shadow-amber-500/30"
                      >
                        {copiedOtp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedOtp ? "Copied" : "Copy"}</span>
                      </motion.button>
                    </div>
                  </motion.div>
                </div>

                {/* Important Security Notice */}
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    <strong>{lang === "en" ? "Important Security Rule: " : "महत्वपूर्ण सुरक्षा नियम: "}</strong>
                    {t.keepOtpWarning}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      setInputCode(submittedData.trackCode);
                      setActiveTab("track");
                      setSearchParams({ tab: "track", code: submittedData.trackCode });
                    }}
                    className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <span>{t.viewLiveTimeline}</span>
                    <ExternalLink className="w-4 h-4" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      setSubmittedData(null);
                      setDescription("");
                    }}
                    className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-all"
                  >
                    {lang === "en" ? "Report Another SOS" : "एक और SOS भेजें"}
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              /* REPORT FORM WITH INTERACTIVE TRANSITIONS */
              <form onSubmit={handleSubmitReport} className="space-y-6">
                {reportError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs sm:text-sm flex items-center gap-2"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                    <span>{reportError}</span>
                  </motion.div>
                )}

                {/* Emergency Description Input */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md focus-within:border-amber-500/60 transition-colors">
                  <label className="text-sm font-black text-slate-100 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                      {t.emergencyDescLabel}
                    </span>
                    <span className="text-xs text-red-400 font-bold">* Required</span>
                  </label>

                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t.emergencyDescPlaceholder}
                    required
                    className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400 transition-colors leading-relaxed"
                  />

                  {/* Preset quick test phrases with micro-bounce */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {lang === "en" ? "Quick Situational Templates (Click to fill):" : "त्वरित स्थिति टेम्पलेट (क्लिक करें):"}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() =>
                          setDescription(
                            lang === "en"
                              ? "Water reached 1st floor, family of 5 trapped on roof including 1 infant and elderly heart patient. Urgently need rescue boat and dry food."
                              : "पहली मंजिल तक पानी भर गया है, छत पर 5 लोग फंसे हैं जिसमें 1 छोटा बच्चा और दिल के मरीज शामिल हैं। नाव और खाने की तुरंत जरूरत है।"
                          )
                        }
                        className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-all text-left shadow-sm"
                      >
                        🌊 {lang === "en" ? "Roof Flood & Medical (5 people)" : "छत पर जलभराव और दवा (5 लोग)"}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() =>
                          setDescription(
                            lang === "en"
                              ? "Community shelter in school flooded. 30 displaced children and adults without clean drinking water or infant milk."
                              : "स्कूल शेल्टर में पानी भर गया है। 30 बच्चों और वयस्कों के लिए पीने का पानी और दूध खत्म हो गया है।"
                          )
                        }
                        className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-all text-left shadow-sm"
                      >
                        🍼 {lang === "en" ? "Shelter Hydration (30 people)" : "शेल्टर पानी व भोजन (30 लोग)"}
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Phone number */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-md">
                  <label className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{t.phoneLabel}</span>
                  </label>
                  <input
                    type="tel"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={t.phonePlaceholder}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  <p className="text-[11px] text-slate-500">
                    {lang === "en"
                      ? "Used strictly by assigned responders to reach you. Keep private if preferred."
                      : "केवल तैनात स्वयंसेवक से संपर्क हेतु उपयोग किया जाएगा।"}
                  </p>
                </div>

                {/* Map & Location with Fast Location Search */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-md">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-amber-400" />
                      <span>{lang === "en" ? "Incident Location Pin" : "घटना स्थल पिन"}</span>
                    </label>
                    <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                      {lat.toFixed(4)}, {lng.toFixed(4)}
                    </span>
                  </div>

                  {/* Fast Location Search Bar */}
                  <LocationSearchBar
                    currentLat={lat}
                    currentLng={lng}
                    lang={lang}
                    onSelectLocation={(newLat, newLng, placeName) => {
                      setLat(newLat);
                      setLng(newLng);
                      if (placeName) {
                        setLocationLabel(placeName);
                      }
                    }}
                  />

                  <p className="text-xs text-slate-400 flex items-center justify-between">
                    <span>{t.dragPinHelp}</span>
                    {locationLabel && (
                      <span className="text-[11px] text-amber-400 font-medium truncate max-w-[200px]">
                        🎯 {locationLabel}
                      </span>
                    )}
                  </p>

                  <div className="rounded-xl overflow-hidden border border-slate-800 h-64 shadow-inner">
                    <LeafletMapPicker
                      lat={lat}
                      lng={lng}
                      onChange={(newLat, newLng) => {
                        setLat(newLat);
                        setLng(newLng);
                      }}
                    />
                  </div>
                </div>

                {/* Submit SOS Button with Pulsing Shadow */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:brightness-110 text-white font-black text-base shadow-2xl glow-red flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                >
                  <Send className={`w-5 h-5 ${submitting ? "animate-spin" : "animate-pulse"}`} />
                  <span>{submitting ? t.submitting : t.submitSos}</span>
                </motion.button>
              </form>
            )}
          </motion.div>
        )}

        {/* TAB 2: TRACK SOS & CHECK OTP */}
        {activeTab === "track" && (
          <motion.div
            key="tab-track"
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Search Bar for RC Code */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                {t.enterTrackingCode}
              </label>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="e.g., RC-82914"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm font-mono uppercase tracking-wider focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => handleFetchTrack(inputCode)}
                  disabled={trackLoading}
                  className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${trackLoading ? "animate-spin" : ""}`} />
                  <span>{t.checkStatus}</span>
                </motion.button>
              </div>

              {/* Recent or Demo SOS Signals */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {recentReports.length > 0
                      ? t.recentSosOnDevice
                      : lang === "en"
                      ? "Quick SOS Demo Codes:"
                      : "त्वरित SOS डेमो कोड:"}
                  </span>
                  <span className="text-[10px] text-amber-400 font-medium hidden sm:inline">
                    {lang === "en" ? "Tap code to test" : "जांचने के लिए टैप करें"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(recentReports.length > 0
                    ? recentReports.map((r) => r.trackCode)
                    : ["RC-82914", "RC-39104"]
                  ).map((code) => (
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      key={code}
                      type="button"
                      onClick={() => {
                        setInputCode(code);
                        handleFetchTrack(code);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                        inputCode.toUpperCase() === code.toUpperCase()
                          ? "bg-amber-400 text-slate-950 border-amber-400 shadow-md shadow-amber-400/20 font-black"
                          : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700"
                      }`}
                    >
                      {code}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {trackError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs sm:text-sm flex items-center gap-2"
              >
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{trackError}</span>
              </motion.div>
            )}

            {trackLoading && !trackedRequest && (
              <div className="py-20 text-center text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin text-amber-400" />
                <p className="text-sm">Connecting to decentralized emergency ledger...</p>
              </div>
            )}

            {trackedRequest && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
              >
                {/* Left Column: Security Handover OTP + Incident Overview (5 cols out of 12) */}
                <div className="lg:col-span-5 space-y-5">
                  {/* CITIZEN HANDOVER OTP BOX */}
                  {trackedRequest.isReporter || trackedRequest.otp ? (
                    // VERIFIED REPORTER SCREEN WITH GLOW
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-950 border-2 border-amber-500/70 shadow-xl shadow-amber-500/10 space-y-3.5 relative overflow-hidden"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs uppercase font-extrabold text-amber-300 flex items-center gap-1.5">
                          <Shield className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                          <span>{t.deliveryOtp}</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-extrabold flex items-center gap-1 shrink-0">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span>{lang === "en" ? "Verified Recipient Screen" : "सत्यापित नागरिक स्क्रीन"}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/80 border border-amber-500/30">
                        <div className="font-mono text-3xl sm:text-4xl font-black text-amber-300 tracking-widest select-all">
                          {showOtpPlain ? (trackedRequest.otp || "••••") : "••••"}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowOtpPlain(!showOtpPlain)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title={showOtpPlain ? "Hide OTP" : "Show OTP"}
                          >
                            {showOtpPlain ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>

                          {trackedRequest.otp && (
                            <motion.button
                              whileTap={{ scale: 0.92 }}
                              type="button"
                              onClick={() => copyToClipboard(trackedRequest.otp!, "otp")}
                              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/30 transition-all shrink-0"
                            >
                              {copiedOtp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedOtp ? "Copied" : "Copy"}</span>
                            </motion.button>
                          )}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed font-medium space-y-1">
                        <p className="font-bold flex items-center gap-1.5 text-amber-300">
                          <Zap className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                          <span>{lang === "en" ? "Handover Security Rule:" : "हस्तांतरण सुरक्षा नियम:"}</span>
                        </p>
                        <p>
                          {lang === "en"
                            ? "Share this 4-digit OTP ONLY with the assigned responder when they physically arrive with relief supplies. They will enter it to verify handover."
                            : "यह 4-अंकीय OTP केवल तभी स्वयंसेवक को दें जब राहत सामग्री आपके पास भौतिक रूप से पहुंच जाए।"}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    // CONFIDENTIAL MASKED OTP SCREEN FOR NON-REPORTER
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-lg">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs uppercase font-extrabold text-slate-400 flex items-center gap-1.5">
                          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                          <span>{t.deliveryOtp}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-700/40 text-amber-400 text-[10px] font-extrabold">
                          {lang === "en" ? "VERIFICATION REQUIRED" : "सत्यापन आवश्यक"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="font-mono text-2xl sm:text-3xl font-black text-slate-600 tracking-widest select-none">
                          ••••
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => handleQuickUnlockOtp()}
                            disabled={verifyLoading}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                            title="Instant 1-Click Reveal for Reporter or Demo"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>{verifyLoading ? "..." : (lang === "en" ? "Instant Reveal" : "तुरंत देखें")}</span>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => setShowVerifyModal(true)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                            <span className="hidden sm:inline">{lang === "en" ? "Verify Phone" : "फोन सत्यापित"}</span>
                          </motion.button>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 leading-relaxed space-y-1">
                        <p>
                          {lang === "en"
                            ? "To prevent interception, this handover OTP is confidential to the citizen who reported this SOS."
                            : "दुरुपयोग रोकने के लिए, यह हस्तांतरण OTP केवल रिपोर्ट दर्ज करने वाले नागरिक के लिए सुरक्षित है।"}
                        </p>
                        <p className="text-amber-300/90 font-medium">
                          {lang === "en"
                            ? "👉 Click 'Instant Reveal' or 'Verify Phone' to view your code immediately."
                            : "👉 अपना OTP देखने के लिए 'तुरंत देखें' पर क्लिक करें।"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Incident Snapshot Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-md">
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
                      <div className="shrink-0 max-w-[65%] sm:max-w-none">
                        <UrgencyBadge urgency={trackedRequest.urgency} size="sm" />
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono text-xs font-black text-sky-300 bg-sky-950/90 px-3 py-1 rounded-lg border border-sky-500/40 shadow-sm whitespace-nowrap">
                          {trackedRequest.trackCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(trackedRequest.trackCode, "code")}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="Copy Request Code"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm sm:text-base font-bold text-white break-words">
                        {trackedRequest.summary || trackedRequest.description}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed break-words">
                        {trackedRequest.description}
                      </p>
                    </div>

                    {/* Category and People Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          {lang === "en" ? "Category" : "श्रेणी"}
                        </span>
                        <span className="font-semibold text-slate-200 capitalize">{trackedRequest.category}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          {lang === "en" ? "Affected" : "प्रभावित संख्या"}
                        </span>
                        <span className="font-semibold text-slate-200">{trackedRequest.people || 1} people</span>
                      </div>
                    </div>

                    {/* Matched Resource */}
                    {trackedRequest.resource && (
                      <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-800/40 text-xs space-y-1">
                        <div className="flex items-center gap-1 text-teal-300 font-bold">
                          <Package className="w-3.5 h-3.5 shrink-0" />
                          <span>{t.matchedResource}:</span>
                        </div>
                        <p className="text-teal-200 font-medium">
                          {trackedRequest.resource.quantity} {trackedRequest.resource.unit} of {trackedRequest.resource.name}
                        </p>
                      </div>
                    )}

                    {/* Assigned Volunteer */}
                    {trackedRequest.volunteer && (
                      <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/40 text-xs space-y-1">
                        <div className="flex items-center gap-1 text-blue-300 font-bold">
                          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{t.assignedVolunteer}:</span>
                        </div>
                        <p className="text-blue-200 font-semibold">{trackedRequest.volunteer.name}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Live Status Timeline (7 cols out of 12) */}
                <div className="lg:col-span-7">
                  <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{t.timelineTitle}</span>
                      </h2>
                      <StatusBadge status={trackedRequest.status} />
                    </div>

                    <StatusTimeline request={trackedRequest} />
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CITIZEN RE-VERIFICATION MODAL */}
      <AnimatePresence>
        {showVerifyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-md p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl space-y-4 my-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-400 shrink-0" />
                  <h3 className="font-bold text-base sm:text-lg text-white">
                    {lang === "en" ? "Verify Citizen Ownership" : "नागरिक स्वामित्व सत्यापन"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-bold transition-colors"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {lang === "en"
                  ? "Enter the phone number submitted during SOS reporting to unlock your confidential Handover OTP."
                  : "SOS रिपोर्ट करते समय दिया गया अपना फोन नंबर दर्ज करें ताकि आपका गोपनीय OTP अनलॉक हो सके।"}
              </p>

              {/* Instant 1-Click Unlock Banner */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                <div className="text-xs text-amber-200">
                  <span className="font-bold block text-amber-300">
                    {lang === "en" ? "Quick 1-Click Unlock" : "1-क्लिक त्वरित अनलॉक"}
                  </span>
                  <span className="text-[11px] text-amber-400/80">
                    {lang === "en" ? "Demo mode or reporter device" : "डेमो व रिपोर्टर डिवाइस हेतु"}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => handleQuickUnlockOtp()}
                  disabled={verifyLoading}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shrink-0"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{verifyLoading ? "..." : (lang === "en" ? "Unlock Now" : "अनलॉक करें")}</span>
                </motion.button>
              </div>

              {verifyError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
                  {verifyError}
                </div>
              )}

              <form onSubmit={handleVerifyCitizenOwnership} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      {lang === "en" ? "Contact Phone Number" : "संपर्क फोन नंबर"}
                    </label>
                    {trackedRequest?.contact && (
                      <button
                        type="button"
                        onClick={() => setVerifyPhone(trackedRequest.contact || "")}
                        className="text-[11px] text-amber-400 hover:underline font-medium"
                      >
                        {lang === "en" ? "Use SOS Phone" : "SOS फोन भरें"}
                      </button>
                    )}
                  </div>
                  <input
                    type="tel"
                    value={verifyPhone}
                    onChange={(e) => setVerifyPhone(e.target.value)}
                    placeholder={trackedRequest?.contact || "+91 98200 11223"}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowVerifyModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                  >
                    {lang === "en" ? "Cancel" : "रद्द करें"}
                  </button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={verifyLoading}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{verifyLoading ? "Verifying..." : (lang === "en" ? "Verify Phone" : "सत्यापित करें")}</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
