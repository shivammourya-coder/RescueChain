import React, { useState, useEffect, useMemo } from "react";
import { api } from "../api/client";
import { EmergencyRequest } from "../types";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useLanguage } from "../context/LanguageContext";
import { UrgencyBadge } from "../components/UrgencyBadge";
import { StatusBadge } from "../components/StatusBadge";
import { StatusTimeline } from "../components/StatusTimeline";
import { LiveRadarScanner } from "../components/LiveRadarScanner";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import {
  Activity,
  MapPin,
  Users,
  Compass,
  CheckCircle,
  Camera,
  Navigation,
  KeyRound,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Phone,
  ArrowRight,
  Package,
  Lock,
  Sparkles,
  Radio,
  Zap,
  Clock,
  Timer,
  Route,
  SlidersHorizontal,
  Filter
} from "lucide-react";

// Haversine distance calculation in kilometers
function computeDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// Transit speed & ETA model for disaster zones
function getEtaDetails(distKm: number): { etaMins: number; mode: string; isRapid: boolean } {
  if (distKm <= 0.5) return { etaMins: 2, mode: "Walk / Rapid Sprint", isRapid: true };
  if (distKm <= 1.5) return { etaMins: 4, mode: "Bicycle / Fast Run", isRapid: true };
  if (distKm <= 3.0) return { etaMins: 8, mode: "Motorbike / Auto", isRapid: false };
  if (distKm <= 6.0) return { etaMins: 14, mode: "Ambulance / Emergency Van", isRapid: false };
  return { etaMins: Math.max(16, Math.round(distKm * 2.5)), mode: "Rescue Vehicle", isRapid: false };
}

export function VolunteerDashboard() {
  const { user } = useAuth();
  const { isOnline, pendingOfflineCount, syncOfflineQueue, lastUpdatedRequest } = useSocket();
  const { lang, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<"available" | "mine">("available");
  const [availableTasks, setAvailableTasks] = useState<EmergencyRequest[]>([]);
  const [myTasks, setMyTasks] = useState<EmergencyRequest[]>([]);
  const [selectedTask, setSelectedTask] = useState<EmergencyRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncingOffline, setSyncingOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sorting & Filtering for nearest / fastest completion
  const [sortBy, setSortBy] = useState<"nearest" | "urgency">("nearest");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Stepper Inputs
  const [pickupPhoto, setPickupPhoto] = useState<string>("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [deliveryOtpInput, setDeliveryOtpInput] = useState("");
  const [stepLoading, setStepLoading] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  // Volunteer GPS
  const [volunteerLat, setVolunteerLat] = useState(19.076);
  const [volunteerLng, setVolunteerLng] = useState(72.8777);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setVolunteerLat(Number(pos.coords.latitude.toFixed(5)));
          setVolunteerLng(Number(pos.coords.longitude.toFixed(5)));
        },
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#10b981", "#38bdf8", "#f59e0b", "#6366f1"]
      });
    } catch {
      // no-op
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const [avail, mine] = await Promise.all([
        api.tasks.getAvailable(volunteerLat, volunteerLng),
        api.tasks.getMine()
      ]);
      setAvailableTasks(avail);
      setMyTasks(mine);

      // If user has an active task and none selected, auto-select
      if (mine.length > 0 && !selectedTask) {
        setSelectedTask(mine[0]);
        setActiveTab("mine");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch volunteer tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [volunteerLat, volunteerLng]);

  // Automatic task list reload when offline reports are synced
  useEffect(() => {
    const handleSyncEvent = () => {
      loadTasks();
    };
    window.addEventListener("rescuechain:offline-synced", handleSyncEvent);
    return () => window.removeEventListener("rescuechain:offline-synced", handleSyncEvent);
  }, [volunteerLat, volunteerLng]);

  // Live Socket updates - smoothly calculates distance and ETA for new incidents
  useEffect(() => {
    if (lastUpdatedRequest) {
      setAvailableTasks((prev) => {
        // If task is claimed or resolved, remove from available tasks
        if (lastUpdatedRequest.volunteer || ["VERIFIED", "DELIVERED"].includes(lastUpdatedRequest.status)) {
          return prev.filter((t) => t.id !== lastUpdatedRequest.id);
        }

        // Calculate distance from volunteer's live GPS
        const dist = computeDistanceKm(
          volunteerLat,
          volunteerLng,
          lastUpdatedRequest.location.coordinates[1],
          lastUpdatedRequest.location.coordinates[0]
        );
        const eta = getEtaDetails(dist);
        const enriched: EmergencyRequest = {
          ...lastUpdatedRequest,
          distanceKm: dist,
          etaMinutes: eta.etaMins,
          speedLabel: eta.mode
        };

        const exists = prev.find((t) => t.id === lastUpdatedRequest.id);
        if (exists) {
          return prev.map((t) => (t.id === lastUpdatedRequest.id ? enriched : t));
        }
        return [enriched, ...prev];
      });

      if (lastUpdatedRequest.volunteer?.id === user?.id) {
        setMyTasks((prev) => {
          const exists = prev.find((t) => t.id === lastUpdatedRequest.id);
          if (exists) {
            return prev.map((t) => (t.id === lastUpdatedRequest.id ? lastUpdatedRequest : t));
          }
          return [lastUpdatedRequest, ...prev];
        });
        if (selectedTask?.id === lastUpdatedRequest.id) {
          setSelectedTask(lastUpdatedRequest);
          if (lastUpdatedRequest.status === "VERIFIED") {
            triggerCelebration();
          }
        }
      }
    }
  }, [lastUpdatedRequest, user?.id, volunteerLat, volunteerLng]);

  // Manual offline queue sync & task refresh handler
  const handleManualSync = async () => {
    setSyncingOffline(true);
    try {
      if (pendingOfflineCount > 0) {
        await syncOfflineQueue();
      }
      await loadTasks();
    } finally {
      setSyncingOffline(false);
    }
  };

  // Enriched tasks with real-time distance and sorted for fast completion
  const displayedTasks = useMemo(() => {
    let list = availableTasks.map((t) => {
      const dist =
        t.distanceKm !== undefined
          ? t.distanceKm
          : computeDistanceKm(volunteerLat, volunteerLng, t.location.coordinates[1], t.location.coordinates[0]);
      const eta = getEtaDetails(dist);
      return {
        ...t,
        computedDistance: dist,
        computedEta: eta
      };
    });

    if (filterCategory !== "all") {
      list = list.filter((t) => t.category === filterCategory);
    }

    if (sortBy === "nearest") {
      list.sort((a, b) => {
        if (a.computedDistance !== b.computedDistance) {
          return a.computedDistance - b.computedDistance;
        }
        return b.urgency - a.urgency;
      });
    } else {
      list.sort((a, b) => {
        if (b.urgency !== a.urgency) return b.urgency - a.urgency;
        return a.computedDistance - b.computedDistance;
      });
    }

    return list;
  }, [availableTasks, volunteerLat, volunteerLng, sortBy, filterCategory]);

  // 1. Accept Task
  const handleAcceptTask = async (task: EmergencyRequest) => {
    setStepLoading(true);
    setStepError(null);
    try {
      const claimed = await api.tasks.accept(task.id);
      setSelectedTask(claimed);
      setActiveTab("mine");
      loadTasks();
    } catch (err: any) {
      if (err.status === 409) {
        setStepError(
          lang === "en"
            ? "Task was just claimed by another nearby responder."
            : "यह कार्य अभी किसी अन्य स्वयंसेवक ने स्वीकार कर लिया है।"
        );
      } else {
        setStepError(err.message || "Could not accept task.");
      }
      loadTasks();
    } finally {
      setStepLoading(false);
    }
  };

  // 2. Upload Pickup Proof
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPickupPhoto(base64);
        setPhotoPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmPickup = async () => {
    if (!selectedTask) return;
    setStepLoading(true);
    setStepError(null);
    try {
      const photoPayload =
        pickupPhoto ||
        "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=400";
      const updated = await api.tasks.pickup(selectedTask.id, {
        photo: photoPayload,
        lat: volunteerLat,
        lng: volunteerLng
      });
      setSelectedTask(updated);
      loadTasks();
    } catch (err: any) {
      setStepError(err.message || "Failed to confirm pickup.");
    } finally {
      setStepLoading(false);
    }
  };

  // 3. Mark In Transit
  const handleConfirmTransit = async () => {
    if (!selectedTask) return;
    setStepLoading(true);
    setStepError(null);
    try {
      const updated = await api.tasks.transit(selectedTask.id, {
        lat: volunteerLat,
        lng: volunteerLng
      });
      setSelectedTask(updated);
      loadTasks();
    } catch (err: any) {
      setStepError(err.message || "Failed to update transit status.");
    } finally {
      setStepLoading(false);
    }
  };

  // 4. Deliver with Recipient OTP
  const handleConfirmDeliver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !deliveryOtpInput.trim()) return;
    setStepLoading(true);
    setStepError(null);
    try {
      const res = await api.tasks.deliver(selectedTask.id, {
        otp: deliveryOtpInput.trim(),
        lat: volunteerLat,
        lng: volunteerLng
      });
      setSelectedTask(res.request);
      triggerCelebration();
      loadTasks();
    } catch (err: any) {
      setStepError(err.message || t.invalidOtpError);
    } finally {
      setStepLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 relative z-10">
      {/* Header with Tactical Radar Scanner */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6"
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1 shadow-sm">
            <Activity className="w-3.5 h-3.5 animate-pulse text-blue-400" />
            <span>{t.volunteerDashboard}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {lang === "en" ? "Field Responder Terminal" : "फील्ड स्वयंसेवक टर्मिनल"}
          </h1>

          <p className="text-xs text-slate-400">
            {lang === "en" ? "Responder:" : "स्वयंसेवक:"}{" "}
            <strong className="text-slate-200">{user?.name}</strong> • GPS:{" "}
            <span className="font-mono text-slate-300">
              {volunteerLat.toFixed(4)}, {volunteerLng.toFixed(4)}
            </span>
          </p>
        </div>

        {/* Live Radar Scanner Component */}
        <div className="w-full md:w-auto min-w-[280px]">
          <LiveRadarScanner
            label={lang === "en" ? "Sector Dispatch Feed" : "सेक्टर डिस्पैच"}
            statusText={
              lang === "en"
                ? `${availableTasks.length} Pending High-Urgency Tasks`
                : `${availableTasks.length} लंबित उच्च-प्राथमिकता कार्य`
            }
            count={availableTasks.length + myTasks.length}
          />
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Tabs with Animated Pill */}
      <div className="flex gap-2 border-b border-slate-800">
        <button
          onClick={() => {
            setActiveTab("available");
            setSelectedTask(null);
          }}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 relative ${
            activeTab === "available"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>{t.availableTasks}</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300 font-mono">
            {availableTasks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("mine")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 relative ${
            activeTab === "mine"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>{t.myDispatches}</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-900/60 text-blue-200 font-mono">
            {myTasks.length}
          </span>
        </button>
      </div>

      {/* VIEW A: AVAILABLE TASKS WITH PROXIMITY SORT & FASTEST DISPATCH */}
      {activeTab === "available" && (
        <div className="space-y-4">
          {/* Action Toolbar: Sorting, Category Filter, and Live Sync */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            {/* Sort Options */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-blue-400" />
                {lang === "en" ? "Sort:" : "क्रम:"}
              </span>

              <button
                onClick={() => setSortBy("nearest")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  sortBy === "nearest"
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60"
                }`}
                title="Sort by closest distance to complete fast"
              >
                <Zap className="w-3.5 h-3.5 text-amber-900" />
                <span>{lang === "en" ? "Nearest First (Fastest)" : "निकटतम पहले (त्वरित)"}</span>
              </button>

              <button
                onClick={() => setSortBy("urgency")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  sortBy === "urgency"
                    ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{lang === "en" ? "Critical Urgency" : "गंभीरता अनुसार"}</span>
              </button>
            </div>

            {/* Category Filter & Manual Sync */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs">
                <Filter className="w-3 h-3 text-slate-400 ml-1.5" />
                {["all", "rescue", "medical", "water", "food", "shelter"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2 py-0.5 rounded-lg font-semibold capitalize text-[11px] transition-all ${
                      filterCategory === cat
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Refresh / Sync Button */}
              <button
                onClick={handleManualSync}
                disabled={loading || syncingOffline}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  pendingOfflineCount > 0
                    ? "bg-amber-600 hover:bg-amber-500 text-white border-amber-500 animate-pulse"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
                title="Sync offline queue and refresh available tasks"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading || syncingOffline ? "animate-spin text-blue-400" : ""}`} />
                <span>
                  {pendingOfflineCount > 0
                    ? `Sync ${pendingOfflineCount} Queued SOS`
                    : lang === "en"
                    ? "Refresh Feed"
                    : "ताज़ा करें"}
                </span>
              </button>
            </div>
          </div>

          {displayedTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-16 text-center text-slate-400 space-y-2 bg-slate-900/40 rounded-3xl border border-slate-800 shadow-xl"
            >
              <CheckCircle className="w-10 h-10 mx-auto text-emerald-400" />
              <p className="font-bold text-base text-slate-200">
                {lang === "en" ? "No unassigned tasks matching filter." : "इस फिल्टर से मेल खाता कोई लंबित कार्य नहीं है।"}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {lang === "en"
                  ? "All emergencies in this category are actively claimed or resolved. Check back shortly."
                  : "इस श्रेणी के सभी आपातकालीन कार्य सक्रिय रूप से लिए जा चुके हैं।"}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.08 }
                }
              }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {displayedTasks.map((task, idx) => {
                const isFastest = idx === 0 && sortBy === "nearest";
                const gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${volunteerLat},${volunteerLng}&destination=${task.location.coordinates[1]},${task.location.coordinates[0]}`;

                return (
                  <motion.div
                    key={task.id}
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className={`p-5 rounded-2xl panel-glass border transition-all flex flex-col justify-between space-y-4 shadow-xl group relative overflow-hidden ${
                      isFastest
                        ? "border-emerald-500/60 ring-1 ring-emerald-500/40 bg-emerald-950/10"
                        : "border-white/10 panel-glass-hover"
                    }`}
                  >
                    {/* Top Fastest Ribbon for the #1 nearest task */}
                    {isFastest && (
                      <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-600 py-0.5 px-3 text-[10px] uppercase tracking-wider font-black text-slate-950 text-center flex items-center justify-center gap-1 shadow-sm">
                        <Zap className="w-3 h-3 text-slate-950 fill-current" />
                        <span>{lang === "en" ? "Fastest to Reach • #1 Closest Task" : "सबसे नज़दीक • त्वरित कार्य"}</span>
                      </div>
                    )}

                    <div className={`space-y-3 ${isFastest ? "pt-2" : ""}`}>
                      {/* Urgency & Distance ETA Pill */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <UrgencyBadge urgency={task.urgency} />

                        {/* Precise Proximity and ETA Badge */}
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/40 shadow-sm">
                          <Timer className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>
                            {task.computedDistance < 1
                              ? `${Math.round(task.computedDistance * 1000)}m away`
                              : `${task.computedDistance} km away`}
                          </span>
                          <span className="text-emerald-500">•</span>
                          <span className="text-emerald-200">~{task.computedEta.etaMins}m ETA</span>
                        </div>
                      </div>

                      {/* Travel Mode Hint */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="uppercase font-bold text-slate-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          {task.category}
                        </span>

                        <span className="text-slate-400 flex items-center gap-1 font-medium">
                          <Route className="w-3 h-3 text-sky-400" />
                          {task.computedEta.mode}
                        </span>
                      </div>

                      {/* Incident Summary and Description */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-white line-clamp-1">
                            {task.summary || task.description}
                          </h3>
                          {/* RC Tracking Code */}
                          <span className="font-mono font-black text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40 text-[11px] shrink-0">
                            {task.trackCode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {task.description}
                        </p>
                      </div>

                      {/* Matched Resource Badge */}
                      {task.resource && (
                        <div className="p-2.5 rounded-xl bg-teal-950/40 border border-teal-800/40 text-xs">
                          <div className="flex items-center gap-1.5 text-teal-300 font-semibold">
                            <Package className="w-3.5 h-3.5" />
                            <span>{t.matchedResource}:</span>
                          </div>
                          <div className="text-teal-200 text-[11px] mt-0.5">
                            {task.resource.quantity} {task.resource.unit} of {task.resource.name}
                          </div>
                        </div>
                      )}

                      {/* People affected & Triage Source */}
                      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          {task.people} {t.peopleAffected}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          Triage: {task.triageSource === "ai" ? "Gemini AI" : "Rules"}
                        </span>
                      </div>
                    </div>

                    {/* Action Row: Turn-by-Turn GPS Directions + Claim Button */}
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <a
                          href={gmapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all col-span-1"
                          title="Open Google Maps Turn-by-Turn Directions to victim location"
                        >
                          <Navigation className="w-3.5 h-3.5 text-sky-400" />
                          <span>{lang === "en" ? "GPS Route" : "रास्ता"}</span>
                        </a>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAcceptTask(task)}
                          disabled={stepLoading}
                          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2 col-span-2"
                        >
                          <span>{t.claimAndDispatch}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      )}

      {/* VIEW B: MY ACTIVE DISPATCH (GUIDED STEPPER) */}
      {activeTab === "mine" && (
        <AnimatePresence mode="wait">
          {!selectedTask ? (
            <motion.div
              key="no-task"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-16 text-center text-slate-400 space-y-3 bg-slate-900/40 rounded-3xl border border-slate-800 shadow-xl"
            >
              <Compass className="w-10 h-10 mx-auto text-blue-400 animate-spin" style={{ animationDuration: "12s" }} />
              <p className="font-bold text-base text-slate-200">
                {lang === "en" ? "No active dispatch claimed yet." : "कोई कार्य सक्रिय नहीं है।"}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab("available")}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20"
              >
                {lang === "en" ? "Browse Available Tasks" : "उपलब्ध कार्य देखें"}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key={selectedTask.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Stepper Guide Card */}
              <div className="lg:col-span-2 space-y-6">
                {stepError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{stepError}</span>
                  </motion.div>
                )}

                {/* Task Header & Prominent RC Tracking Code */}
                <div className="p-5 rounded-2xl panel-glass border border-white/10 space-y-4 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <UrgencyBadge urgency={selectedTask.urgency} />
                      <StatusBadge status={selectedTask.status} />
                    </div>

                    {/* PROMINENT RC TRACKING NUMBER BADGE */}
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 shadow-inner">
                      <span className="text-[10px] uppercase font-bold text-amber-400/90">{t.rcNumberLabel}:</span>
                      <span className="font-mono text-sm font-black text-amber-300 tracking-wider">
                        {selectedTask.trackCode}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">
                      {selectedTask.summary || selectedTask.description}
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {selectedTask.description}
                    </p>
                  </div>

                  {selectedTask.contact && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">
                          {lang === "en" ? "Recipient Contact" : "नागरिक संपर्क"}
                        </span>
                        <span className="font-semibold text-slate-200">{selectedTask.contact}</span>
                      </div>
                      <a
                        href={`tel:${selectedTask.contact}`}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 text-xs shadow-md shadow-emerald-600/20"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{lang === "en" ? "Call Citizen" : "कॉल करें"}</span>
                      </a>
                    </div>
                  )}

                  {/* Navigation Links */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedTask.location.coordinates[1]},${selectedTask.location.coordinates[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Navigation className="w-3.5 h-3.5 text-blue-400" />
                      <span>{lang === "en" ? "Open Navigation in Maps" : "मैप्स में रास्ता देखें"}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>

                  {/* SECURITY NOTICE REGARDING OTP HIDING */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed text-[11px]">
                      <strong className="text-slate-300">{lang === "en" ? "Security Protocol: " : "सुरक्षा प्रोटोकॉल: "}</strong>
                      {t.onlyReporterSeeOtp}
                    </p>
                  </div>
                </div>

                {/* GUIDED 3-STEP RESPONDER WIZARD */}
                <div className="p-6 rounded-2xl panel-glass border border-white/10 shadow-xl space-y-6">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-400" />
                    <span>{lang === "en" ? "Field Stepper: Chain of Custody" : "फील्ड चरण: राहत श्रृंखला"}</span>
                  </h3>

                  {/* STEP 1: PICKUP PROOF */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      selectedTask.status === "VOLUNTEER_ASSIGNED"
                        ? "bg-slate-950 border-amber-500/60 shadow-lg glow-amber"
                        : ["PICKUP", "IN_TRANSIT", "DELIVERED", "VERIFIED"].includes(selectedTask.status)
                        ? "bg-emerald-950/20 border-emerald-800/40 opacity-90"
                        : "bg-slate-950/40 border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs flex items-center justify-center font-mono font-bold">
                          1
                        </span>
                        <span>{t.pickupProofTitle}</span>
                      </span>
                      {["PICKUP", "IN_TRANSIT", "DELIVERED", "VERIFIED"].includes(selectedTask.status) && (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> {lang === "en" ? "Picked Up" : "पिकअप पूर्ण"}
                        </span>
                      )}
                    </div>

                    {selectedTask.status === "VOLUNTEER_ASSIGNED" && (
                      <div className="space-y-3 mt-3">
                        <p className="text-xs text-slate-400">
                          {t.pickupProofDesc}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all shadow-sm">
                            <Camera className="w-4 h-4 text-amber-400" />
                            <span>{t.capturePhoto}</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={handlePhotoUpload}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() =>
                              setPhotoPreview(
                                "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=400"
                              )
                            }
                            className="text-xs text-slate-400 hover:text-slate-200 underline"
                          >
                            {t.useDemoPhoto}
                          </button>
                        </div>

                        {photoPreview && (
                          <div className="relative rounded-lg overflow-hidden border border-slate-700 max-w-xs shadow-md">
                            <img src={photoPreview} alt="Preview" className="w-full h-32 object-cover" />
                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-slate-900/90 rounded text-[9px] text-slate-300">
                              Photo ready
                            </div>
                          </div>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleConfirmPickup}
                          disabled={stepLoading}
                          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/30"
                        >
                          {t.confirmPickupBtn}
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {/* STEP 2: IN TRANSIT */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      selectedTask.status === "PICKUP"
                        ? "bg-slate-950 border-blue-500/60 shadow-lg glow-blue"
                        : ["IN_TRANSIT", "DELIVERED", "VERIFIED"].includes(selectedTask.status)
                        ? "bg-emerald-950/20 border-emerald-800/40 opacity-90"
                        : "bg-slate-950/40 border-slate-800 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs flex items-center justify-center font-mono font-bold">
                          2
                        </span>
                        <span>{t.transitTitle}</span>
                      </span>
                      {["IN_TRANSIT", "DELIVERED", "VERIFIED"].includes(selectedTask.status) && (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> {lang === "en" ? "In Transit" : "रास्ते में"}
                        </span>
                      )}
                    </div>

                    {selectedTask.status === "PICKUP" && (
                      <div className="space-y-3 mt-3">
                        <p className="text-xs text-slate-400">
                          {t.transitDesc}
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleConfirmTransit}
                          disabled={stepLoading}
                          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
                        >
                          <Navigation className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} />
                          <span>{t.startTravelBtn}</span>
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {/* STEP 3: RECIPIENT HANDOVER OTP VERIFICATION */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      selectedTask.status === "IN_TRANSIT"
                        ? "bg-slate-950 border-emerald-500/60 shadow-lg glow-emerald"
                        : ["DELIVERED", "VERIFIED"].includes(selectedTask.status)
                        ? "bg-emerald-950/20 border-emerald-800/40"
                        : "bg-slate-950/40 border-slate-800 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs flex items-center justify-center font-mono font-bold">
                          3
                        </span>
                        <span>{t.handoverOtpTitle}</span>
                      </span>
                      {["DELIVERED", "VERIFIED"].includes(selectedTask.status) && (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4" /> {lang === "en" ? "VERIFIED RELIEF" : "सत्यापित राहत"}
                        </span>
                      )}
                    </div>

                    {selectedTask.status === "IN_TRANSIT" && (
                      <form onSubmit={handleConfirmDeliver} className="space-y-3 mt-3">
                        <p className="text-xs text-slate-400">
                          {t.handoverOtpDesc}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          <div className="relative">
                            <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                            <input
                              type="text"
                              maxLength={4}
                              value={deliveryOtpInput}
                              onChange={(e) => setDeliveryOtpInput(e.target.value)}
                              placeholder="4-digit OTP"
                              className="w-36 pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono text-center tracking-widest text-lg font-bold focus:outline-none focus:border-amber-400 transition-colors"
                              required
                            />
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={stepLoading}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>{t.verifyDeliveryBtn}</span>
                          </motion.button>
                        </div>
                      </form>
                    )}

                    {/* SUCCESS BANNER ON VERIFIED */}
                    {["DELIVERED", "VERIFIED"].includes(selectedTask.status) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-3 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/60 space-y-2 glow-emerald"
                      >
                        <div className="text-emerald-300 font-bold text-sm flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-emerald-400" />
                          <span>{t.verifiedReliefTitle}</span>
                        </div>
                        <p className="text-xs text-emerald-200/80 leading-relaxed">
                          {t.verifiedReliefDesc}
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Live Status Timeline */}
              <div className="lg:col-span-1">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                  <div className="border-b border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-slate-200">
                      {lang === "en" ? "Task Audit Timeline" : "ऑडिट टाइमलाइन"}
                    </h3>
                    <p className="text-[11px] font-mono text-amber-400 font-bold mt-0.5">
                      {selectedTask.trackCode}
                    </p>
                  </div>
                  <StatusTimeline request={selectedTask} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
