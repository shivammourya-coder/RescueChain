import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import { EmergencyRequest, ResourceItem, AnalyticsData, UrgencyLevel, EmergencyCategory } from "../types";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { LiveDisasterMap } from "../components/LiveDisasterMap";
import { UrgencyBadge } from "../components/UrgencyBadge";
import { StatusBadge } from "../components/StatusBadge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from "recharts";
import {
  Shield,
  Activity,
  Layers,
  MapPin,
  Flame,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Package,
  Boxes,
  Zap,
  Filter
} from "lucide-react";

export function AuthorityDashboard() {
  const { user } = useAuth();
  const { lastUpdatedRequest, lastEscalation } = useSocket();

  const [activeTab, setActiveTab] = useState<"map" | "board" | "analytics">("map");
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedUrgency, setSelectedUrgency] = useState<string>("all");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const fetchCommandData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqList, resList, analyticsData] = await Promise.all([
        api.requests.list(),
        api.resources.list(),
        api.analytics.get()
      ]);
      setRequests(reqList);
      setResources(resList);
      setAnalytics(analyticsData);
    } catch (err: any) {
      setError(err.message || "Failed to load command grid");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommandData();
  }, []);

  // Real-time socket updates
  useEffect(() => {
    if (lastUpdatedRequest) {
      setRequests((prev) => {
        const exists = prev.find((r) => r.id === lastUpdatedRequest.id);
        if (exists) {
          return prev.map((r) => (r.id === lastUpdatedRequest.id ? lastUpdatedRequest : r));
        }
        return [lastUpdatedRequest, ...prev];
      });

      // Refresh analytics metrics
      api.analytics.get().then(setAnalytics).catch(() => {});
    }
  }, [lastUpdatedRequest]);

  // Handle Flag as Fake
  const handleFlagFake = async (id: string) => {
    try {
      await api.requests.flagFake(id);
      fetchCommandData();
    } catch (err: any) {
      setError(err.message || "Failed to flag report");
    }
  };

  // Handle Escalation (widens search radius and upgrades priority tier)
  const handleEscalate = async (id: string) => {
    try {
      await api.requests.escalate(id);
      fetchCommandData();
    } catch (err: any) {
      setError(err.message || "Failed to escalate request");
    }
  };

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    if (selectedCategory !== "all" && r.category !== selectedCategory) return false;
    if (selectedUrgency !== "all" && r.urgency !== Number(selectedUrgency)) return false;
    return true;
  });

  const selectedRequest = requests.find((r) => r.id === selectedRequestId);

  // Chart Data Preparation
  const categoryColors: Record<string, string> = {
    rescue: "#ef4444",
    medical: "#f97316",
    water: "#0284c7",
    food: "#f59e0b",
    shelter: "#10b981",
    other: "#64748b"
  };

  const pieChartData = analytics?.byCategory
    ? Object.entries(analytics.byCategory)
        .filter(([_, count]) => count > 0)
        .map(([name, value]) => ({
          name: name.toUpperCase(),
          value,
          color: categoryColors[name] || "#64748b"
        }))
    : [];

  const funnelChartData = analytics?.byStatus
    ? [
        { stage: "Reported", count: analytics.byStatus.REPORTED },
        { stage: "AI Triaged", count: analytics.byStatus.AI_PROCESSED },
        { stage: "Clustered", count: analytics.byStatus.CLUSTERED },
        { stage: "Inventory", count: analytics.byStatus.RESOURCE_MATCHED },
        { stage: "Dispatched", count: analytics.byStatus.VOLUNTEER_ASSIGNED },
        { stage: "Pickup", count: analytics.byStatus.PICKUP },
        { stage: "In Transit", count: analytics.byStatus.IN_TRANSIT },
        { stage: "Delivered", count: analytics.byStatus.DELIVERED },
        { stage: "Verified", count: analytics.byStatus.VERIFIED }
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>National Incident Command Grid</span>
          </div>
          <h1 className="text-3xl font-black text-white">Disaster Authority HQ</h1>
          <p className="text-xs text-slate-400 mt-1">
            Command Center: <strong className="text-slate-200">NDMA / State Emergency Cell</strong> • Live incident telemetry, cluster analytics, & relief reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Main View Switcher */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center text-xs font-bold">
            <button
              onClick={() => setActiveTab("map")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "map"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Tactical Map</span>
            </button>

            <button
              onClick={() => setActiveTab("board")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "board"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Incident Board</span>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "analytics"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Post-Disaster Intel</span>
            </button>
          </div>

          <button
            onClick={fetchCommandData}
            disabled={loading}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 text-xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Signals
            </span>
            <div className="text-2xl font-black text-white font-mono">{analytics.totalRequests}</div>
            <div className="text-[10px] text-slate-500">Raw citizen SOS signals</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1 shadow-sm">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>Verified Relief</span>
            </span>
            <div className="text-2xl font-black text-emerald-300 font-mono">
              {analytics.deliveredAndVerified}
            </div>
            <div className="text-[10px] text-emerald-500/80">Closed with recipient OTP</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1 shadow-sm">
            <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Avg Response Time</span>
            </span>
            <div className="text-2xl font-black text-sky-300 font-mono">
              {analytics.avgResponseTimeMinutes} <span className="text-xs font-normal">min</span>
            </div>
            <div className="text-[10px] text-slate-500">From SOS to physical handoff</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1 shadow-sm">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <Boxes className="w-3 h-3" />
              <span>Duplicates Merged</span>
            </span>
            <div className="text-2xl font-black text-indigo-300 font-mono">
              {analytics.duplicatesMerged}
            </div>
            <div className="text-[10px] text-slate-500">Zero wasted responder trips</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1 shadow-sm">
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Fake Flagged</span>
            </span>
            <div className="text-2xl font-black text-red-300 font-mono">{analytics.fakeFlagged}</div>
            <div className="text-[10px] text-slate-500">Fraudulent spam suppressed</div>
          </div>
        </div>
      )}

      {/* FILTER BAR (FOR MAP & BOARD) */}
      {(activeTab === "map" || activeTab === "board") && (
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-purple-400" />
              <span>Filters:</span>
            </span>

            {/* Category filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-purple-400"
            >
              <option value="all">All Categories</option>
              <option value="rescue">Rescue</option>
              <option value="medical">Medical</option>
              <option value="water">Drinking Water</option>
              <option value="food">Food Rations</option>
              <option value="shelter">Shelter & Tents</option>
            </select>

            {/* Urgency filter */}
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-purple-400"
            >
              <option value="all">All Urgency Tiers</option>
              <option value="5">Tier 5 (Life Critical)</option>
              <option value="4">Tier 4 (High Need)</option>
              <option value="3">Tier 3 (Urgent)</option>
              <option value="2">Tier 2 (Moderate)</option>
              <option value="1">Tier 1 (Low)</option>
            </select>
          </div>

          <div className="text-slate-400 font-mono text-[11px]">
            Displaying <strong>{filteredRequests.length}</strong> of {requests.length} incidents
          </div>
        </div>
      )}

      {/* TAB 1: TACTICAL LIVE MAP */}
      {activeTab === "map" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <LiveDisasterMap
              requests={filteredRequests}
              resources={resources}
              selectedRequestId={selectedRequestId}
              onSelectRequest={(req) => setSelectedRequestId(req.id)}
              onFlagFake={handleFlagFake}
              onEscalate={handleEscalate}
              height="580px"
            />
          </div>

          {/* Side Drawer: Selected Incident Dossier */}
          <div className="lg:col-span-1 space-y-4">
            {selectedRequest ? (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="font-mono text-xs font-bold text-sky-400">
                    {selectedRequest.trackCode}
                  </div>
                  <button
                    onClick={() => setSelectedRequestId(null)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <UrgencyBadge urgency={selectedRequest.urgency} />
                    <StatusBadge status={selectedRequest.status} size="sm" />
                  </div>

                  <h3 className="text-sm font-bold text-white pt-1">
                    {selectedRequest.summary || selectedRequest.description}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    {selectedRequest.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-400">
                    <div>
                      <span className="text-[10px] block text-slate-500">People</span>
                      <strong className="text-slate-200">{selectedRequest.people}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] block text-slate-500">Merged</span>
                      <strong className="text-slate-200">{selectedRequest.reportCount} reports</strong>
                    </div>
                    <div>
                      <span className="text-[10px] block text-slate-500">Escalation</span>
                      <strong className="text-amber-400">Tier {selectedRequest.escalationLevel}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] block text-slate-500">Triage</span>
                      <strong className="text-purple-300">{selectedRequest.triageSource}</strong>
                    </div>
                  </div>

                  {selectedRequest.resource && (
                    <div className="p-2.5 rounded-lg bg-teal-950/40 border border-teal-800/40 text-xs">
                      <span className="text-[10px] uppercase font-bold text-teal-400 block">Matched Inventory</span>
                      <span className="text-teal-200 font-medium">
                        {selectedRequest.resource.name} ({selectedRequest.resource.quantity} {selectedRequest.resource.unit})
                      </span>
                    </div>
                  )}

                  {selectedRequest.volunteer && (
                    <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/40 text-xs">
                      <span className="text-[10px] uppercase font-bold text-blue-400 block">Assigned Responder</span>
                      <span className="text-blue-200 font-medium">
                        {selectedRequest.volunteer.name} ({selectedRequest.volunteer.phone || "En Route"})
                      </span>
                    </div>
                  )}

                  {/* Operational actions */}
                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => handleEscalate(selectedRequest.id)}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                      title="Widens search radius and increases dispatch priority"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Escalate Priority & Radius</span>
                    </button>

                    {!selectedRequest.suspectedFake ? (
                      <button
                        onClick={() => handleFlagFake(selectedRequest.id)}
                        className="w-full py-2 px-3 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-800/80 text-red-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        <span>Flag as Suspected Fake</span>
                      </button>
                    ) : (
                      <div className="text-center text-xs text-red-400 font-bold py-1">
                        ⚠️ Marked as Fraudulent / Spam
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 text-xs space-y-2">
                <MapPin className="w-6 h-6 mx-auto text-slate-600" />
                <p>Click on any marker on the map to inspect incident details, volunteer assignment, and trigger priority escalation.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: INCIDENT BOARD (SORTED BY URGENCY) */}
      {activeTab === "board" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <UrgencyBadge urgency={req.urgency} size="sm" />
                    <StatusBadge status={req.status} size="sm" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-mono text-sky-400 font-bold">{req.trackCode}</span>
                      <span className="uppercase font-semibold text-slate-300">{req.category}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug">
                      {req.summary || req.description}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{req.description}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                    <span>{req.people} people affected</span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      {req.reportCount} signal(s)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleEscalate(req.id)}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Escalate</span>
                  </button>

                  {!req.suspectedFake ? (
                    <button
                      onClick={() => handleFlagFake(req.id)}
                      className="py-1.5 px-2.5 rounded-lg bg-red-950/40 hover:bg-red-950 text-red-300 border border-red-800/50 text-xs font-semibold"
                    >
                      Flag Fake
                    </button>
                  ) : (
                    <span className="text-[10px] text-red-400 font-bold px-2 py-1 bg-red-950/60 rounded">
                      Flagged
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: POST-DISASTER INTEL & ANALYTICS */}
      {activeTab === "analytics" && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Relief Funnel */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Incident Verification Funnel</h3>
                <p className="text-xs text-slate-400">
                  Progression across the 9 sequential chain-of-custody status checkpoints.
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="stage" stroke="#64748b" fontSize={11} angle={-25} textAnchor="end" />
                    <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                      labelStyle={{ color: "#f8fafc", fontWeight: "bold" }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Category Breakdown */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Emergency Category Distribution</h3>
                <p className="text-xs text-slate-400">
                  Multilingual AI classification of incident distress calls.
                </p>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Section: Hotspots and Supply vs Deficit */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cluster Hotspots List */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-400" />
                  <span>Geographic Hotspot Sectors</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Consolidated emergency density clusters requiring heavy logistics.
                </p>
              </div>

              <div className="space-y-2.5">
                {analytics.hotspots.map((spot) => (
                  <div
                    key={spot.clusterId}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-200 capitalize">
                        {spot.clusterId.replace(/_/g, " ")}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        Coordinates: {spot.lat.toFixed(4)}, {spot.lng.toFixed(4)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/40">
                        {spot.requestCount} SOS Calls
                      </span>
                      <UrgencyBadge urgency={spot.maxUrgency as UrgencyLevel} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inventory Stock vs Deficit Shortages */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-400" />
                  <span>Strategic Stock vs Critical Shortages</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Deficit intelligence computed to dispatch procurement requests.
                </p>
              </div>

              <div className="space-y-2.5">
                {analytics.shortages.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-amber-200">{item.item}</div>
                      <div className="text-[10px] text-amber-400/80 uppercase font-semibold">
                        Severity: {item.severity}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-red-500/20 text-red-300 font-mono text-xs font-bold border border-red-500/30">
                      Deficit: -{item.deficit} units
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
