import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import { ResourceItem, EmergencyRequest } from "../types";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { LeafletMapPicker } from "../components/LeafletMapPicker";
import { UrgencyBadge } from "../components/UrgencyBadge";
import { StatusBadge } from "../components/StatusBadge";
import {
  Building2,
  Package,
  Plus,
  Edit2,
  Check,
  X,
  MapPin,
  RefreshCw,
  AlertTriangle,
  Layers,
  Activity,
  Boxes
} from "lucide-react";

export function NgoDashboard() {
  const { user } = useAuth();
  const { lastUpdatedRequest } = useSocket();

  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add Resource Modal / Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTypes, setNewTypes] = useState<string[]>(["rescue"]);
  const [newQuantity, setNewQuantity] = useState<number>(10);
  const [newUnit, setNewUnit] = useState("units");
  const [newLat, setNewLat] = useState<number>(19.0760);
  const [newLng, setNewLng] = useState<number>(72.8777);
  const [submittingRes, setSubmittingRes] = useState(false);

  // Inline editing quantity
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(0);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resList, reqList] = await Promise.all([
        api.resources.list(),
        api.requests.list()
      ]);
      setResources(resList);
      setRequests(reqList);
    } catch (err: any) {
      setError(err.message || "Failed to load NGO depot data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Live Socket updates
  useEffect(() => {
    if (lastUpdatedRequest) {
      setRequests((prev) => {
        const exists = prev.find((r) => r.id === lastUpdatedRequest.id);
        if (exists) {
          return prev.map((r) => (r.id === lastUpdatedRequest.id ? lastUpdatedRequest : r));
        }
        return [lastUpdatedRequest, ...prev];
      });
    }
  }, [lastUpdatedRequest]);

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmittingRes(true);
    try {
      await api.resources.create({
        name: newName.trim(),
        types: newTypes,
        quantity: Number(newQuantity),
        unit: newUnit.trim(),
        lat: newLat,
        lng: newLng
      });
      setShowAddModal(false);
      setNewName("");
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to create resource entry");
    } finally {
      setSubmittingRes(false);
    }
  };

  const handleSaveQuantity = async (id: string) => {
    try {
      await api.resources.update(id, { quantity: Number(editQty) });
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to update quantity");
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await api.resources.update(id, { active: !currentActive });
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to toggle status");
    }
  };

  // Matched requests for this NGO's inventory
  const matchedDeliveries = requests.filter((r) => r.resource);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>NGO Relief Inventory Hub</span>
          </div>
          <h1 className="text-3xl font-black text-white">Relief Depot & Supply Matrix</h1>
          <p className="text-xs text-slate-400 mt-1">
            Organization: <strong className="text-slate-200">{user?.organization || user?.name || "Red Cross"}</strong> • Manage supply stock, GPS warehouses, and delivery tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-teal-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Depot Resource</span>
          </button>

          <button
            onClick={fetchData}
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

      {/* SECTION 1: INVENTORY STOCKS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-400" />
            <span>Active Resource Depots ({resources.length})</span>
          </h2>
          <span className="text-xs text-slate-400">
            Auto-matched by proximity to emergency SOS clusters
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((res) => {
            const available = Math.max(0, res.quantity - res.allocated);
            const isEditing = editingId === res.id;

            return (
              <div
                key={res.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-lg ${
                  res.active
                    ? "bg-slate-900 border-slate-800 hover:border-slate-700"
                    : "bg-slate-950/50 border-slate-900 opacity-60"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/40">
                      {res.types.join(", ")}
                    </span>

                    <button
                      onClick={() => handleToggleActive(res.id, res.active)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                        res.active
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {res.active ? "ACTIVE DEPOT" : "PAUSED"}
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{res.name}</h3>
                    <p className="text-xs text-slate-400">Owner: {res.ownerName}</p>
                  </div>

                  {/* Stock counter */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Available Stock:</span>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={editQty}
                            onChange={(e) => setEditQty(Number(e.target.value))}
                            className="w-16 px-1.5 py-0.5 rounded bg-slate-900 border border-teal-500 text-xs text-white font-mono"
                          />
                          <button
                            onClick={() => handleSaveQuantity(res.id)}
                            className="p-1 text-emerald-400 hover:text-emerald-300"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-slate-400 hover:text-slate-300"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-teal-300">
                            {available} {res.unit}
                          </span>
                          <button
                            onClick={() => {
                              setEditingId(res.id);
                              setEditQty(res.quantity);
                            }}
                            className="text-slate-500 hover:text-slate-300 p-0.5"
                            title="Edit stock"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>Allocated: {res.allocated}</span>
                      <span>Total Stock: {res.quantity}</span>
                    </div>

                    {/* Stock Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-teal-500 transition-all"
                        style={{
                          width: `${Math.min(100, (res.allocated / (res.quantity || 1)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-600" />
                    <span>
                      GPS: {res.location.coordinates[1].toFixed(4)}, {res.location.coordinates[0].toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: LIVE MATCHED DELIVERIES */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            <span>Deliveries Matched to NGO Inventory ({matchedDeliveries.length})</span>
          </h2>
          <span className="text-xs text-slate-400">
            Live volunteer dispatch and chain of custody tracking
          </span>
        </div>

        <div className="space-y-3">
          {matchedDeliveries.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-sm">
              No active deliveries matched to your inventory at this moment.
            </div>
          ) : (
            matchedDeliveries.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={req.status} />
                    <UrgencyBadge urgency={req.urgency} size="sm" />
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {req.trackCode}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">
                    {req.summary || req.description}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Allocated: <strong className="text-teal-300">{req.resource?.quantity} {req.resource?.unit} of {req.resource?.name}</strong>
                  </p>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <div className="text-xs text-slate-300">
                    {req.volunteer ? (
                      <span>
                        Responder: <strong className="text-blue-300">{req.volunteer.name}</strong>
                      </span>
                    ) : (
                      <span className="text-amber-400 font-medium">Awaiting Volunteer Claim</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Sector: {req.clusterId || "Sector 1"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ADD DEPOT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-400" />
                <span>Add Relief Supply Depot</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Supply / Equipment Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Inflatable Motorized Rescue Boats"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-teal-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Category Tag</label>
                  <select
                    value={newTypes[0] || "rescue"}
                    onChange={(e) => setNewTypes([e.target.value])}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-teal-400"
                  >
                    <option value="rescue">Rescue Boats / Gear</option>
                    <option value="medical">Medical Trauma Packs</option>
                    <option value="food">Emergency Rations</option>
                    <option value="water">Purified Drinking Water</option>
                    <option value="shelter">Tarpaulins & Tents</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm font-mono focus:outline-none focus:border-teal-400"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Unit</label>
                    <input
                      type="text"
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      placeholder="kits / boats"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-teal-400"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Depot GPS Pin Picker */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Warehouse / Depot GPS Location</span>
                  <span className="font-mono text-teal-400 text-[11px]">
                    {newLat.toFixed(4)}, {newLng.toFixed(4)}
                  </span>
                </label>
                <LeafletMapPicker
                  lat={newLat}
                  lng={newLng}
                  onChange={(lat, lng) => {
                    setNewLat(lat);
                    setNewLng(lng);
                  }}
                  height="160px"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRes}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/20"
                >
                  {submittingRes ? "Saving..." : "Save Depot Resource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
