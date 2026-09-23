import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { EmergencyRequest } from "../types";
import { useSocket } from "../context/SocketContext";
import { StatusTimeline } from "../components/StatusTimeline";
import { UrgencyBadge } from "../components/UrgencyBadge";
import { StatusBadge } from "../components/StatusBadge";
import {
  Search,
  Shield,
  Clock,
  Radio,
  Copy,
  Check,
  MapPin,
  Users,
  AlertTriangle,
  RefreshCw,
  Package,
  HeartHandshake
} from "lucide-react";

export function TrackRequestPage() {
  const { code } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const { socket, subscribeTrackCode, lastUpdatedRequest } = useSocket();

  const [inputCode, setInputCode] = useState(code || localStorage.getItem("rescuechain_last_track") || "RC-82914");
  const [request, setRequest] = useState<EmergencyRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch tracking data
  const fetchTrackData = async (trackCode: string) => {
    if (!trackCode.trim()) return;
    setLoading(true);
    setError(null);

    // If it's a provisional offline code, show helpful offline notice
    if (trackCode.startsWith("RC-OFFLINE")) {
      const storedOtp = localStorage.getItem("rescuechain_last_otp") || "9999";
      setRequest({
        id: "offline_temp",
        trackCode,
        otp: storedOtp,
        description: "Emergency report saved offline on device memory. Awaiting network reconnection to sync with central dispatch.",
        category: "rescue",
        urgency: 4,
        needs: ["Emergency triage pending sync"],
        summary: "Offline report queued on phone. Will automatically dispatch as soon as connectivity resumes.",
        people: 1,
        suspectedFake: false,
        triageSource: "rules",
        location: { type: "Point", coordinates: [72.8777, 19.0760] },
        status: "REPORTED",
        timeline: [
          {
            status: "REPORTED",
            at: new Date().toISOString(),
            by: "Device Local Memory",
            note: "Stored in device IndexedDB queue. Ready for automated network flush."
          }
        ],
        reportCount: 1,
        escalationLevel: 1,
        reportedAt: new Date().toISOString()
      });
      setLoading(false);
      return;
    }

    try {
      const data = await api.requests.track(trackCode.trim());
      setRequest(data);
      subscribeTrackCode(trackCode.trim());
    } catch (err: any) {
      setError(err.message || "Tracking code not found. Please verify the code.");
      setRequest(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code) {
      setInputCode(code);
      fetchTrackData(code);
    } else {
      const stored = localStorage.getItem("rescuechain_last_track");
      if (stored) {
        setInputCode(stored);
        fetchTrackData(stored);
      } else {
        fetchTrackData("RC-82914");
      }
    }
  }, [code]);

  // Handle live socket updates
  useEffect(() => {
    if (lastUpdatedRequest && request && lastUpdatedRequest.id === request.id) {
      setRequest(lastUpdatedRequest);
    }
  }, [lastUpdatedRequest]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      navigate(`/track/${inputCode.trim()}`);
      fetchTrackData(inputCode.trim());
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Radio className="w-3.5 h-3.5" />
            <span>Public SOS Tracker</span>
          </div>
          <h1 className="text-3xl font-black text-white">Follow Relief Chain</h1>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="e.g., RC-82914"
              className="pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm uppercase font-mono tracking-wider focus:outline-none focus:border-sky-400 w-44"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Track</span>
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {loading && !request && (
        <div className="py-20 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-sky-400" />
          <p className="text-sm">Connecting to distributed relief chain...</p>
        </div>
      )}

      {request && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Top Column: Overview Card & OTP */}
          <div className="lg:col-span-1 space-y-4">
            {/* Secret Recipient OTP Box */}
            <div className="p-5 rounded-2xl bg-amber-950/40 border-2 border-amber-500/50 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-400" />
                  Your Handover OTP
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                  DO NOT SHARE ONLINE
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="font-mono text-4xl font-black text-amber-300 tracking-widest">
                  {request.otp || "••••"}
                </div>
                {request.otp && (
                  <button
                    onClick={() => copyToClipboard(request.otp || "", "otp")}
                    className="p-2 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 text-xs flex items-center gap-1"
                  >
                    {copiedOtp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedOtp ? "Copied" : "Copy"}</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-amber-200/80 leading-relaxed font-medium">
                Keep this code secret until your volunteer physically hands over relief supplies. Handing over this OTP certifies delivery.
              </p>
            </div>

            {/* Request Summary Card */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs text-slate-400 font-mono">TRACKING ID</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-100">{request.trackCode}</span>
                  <button
                    onClick={() => copyToClipboard(request.trackCode, "code")}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Current Status</span>
                  <StatusBadge status={request.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Urgency Level</span>
                  <UrgencyBadge urgency={request.urgency} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Category</span>
                  <span className="text-xs font-bold text-slate-200 uppercase bg-slate-800 px-2 py-0.5 rounded">
                    {request.category}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">People Trapped / Affected</span>
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {request.people} Person(s)
                  </span>
                </div>
                {request.reportCount > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Consolidated Reports</span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                      {request.reportCount} nearby reports merged
                    </span>
                  </div>
                )}
              </div>

              {/* AI Triage Summary */}
              <div className="pt-2 border-t border-slate-800">
                <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <span>AI Situational Assessment</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-200">
                    {request.triageSource === "ai" ? "Gemini 2.5 Flash" : "Rule Engine"}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  "{request.summary || request.description}"
                </p>
              </div>

              {/* Needs Tags */}
              {request.needs && request.needs.length > 0 && (
                <div className="pt-1">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1.5">Required Relief Supplies:</div>
                  <div className="flex flex-wrap gap-1">
                    {request.needs.map((item, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right / Main Column: 9-Step Vertical Progress Timeline */}
          <div className="lg:col-span-2">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Live Chain of Custody</h2>
                  <p className="text-xs text-slate-400">
                    Cryptographic 9-step audit trail verifying delivery from initial signal to verified relief.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Real-Time Sync</span>
                </div>
              </div>

              {/* Status Timeline */}
              <StatusTimeline request={request} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
