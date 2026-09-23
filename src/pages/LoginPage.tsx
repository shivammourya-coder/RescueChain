import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Shield, Lock, Mail, Users, Building2, Compass, AlertCircle, ArrowRight } from "lucide-react";

export function LoginPage() {
  const { login, quickDemoLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === "volunteer") navigate("/volunteer");
      else if (user.role === "ngo") navigate("/ngo");
      else if (user.role === "authority") navigate("/authority");
      else navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: "volunteer" | "ngo" | "authority") => {
    setLoading(true);
    setError(null);
    try {
      await quickDemoLogin(role);
      if (role === "volunteer") navigate("/volunteer");
      else if (role === "ngo") navigate("/ngo");
      else if (role === "authority") navigate("/authority");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-amber-500 p-0.5 mx-auto">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white">Responder Sign In</h1>
          <p className="text-xs text-slate-400">
            For field volunteers, relief NGO coordinators, and disaster command authorities.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="responder@rescuechain.org"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-400"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-400"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <span>{loading ? "Authenticating..." : "Sign In to Response Grid"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Demo Accounts for Hackathon Jury */}
        <div className="pt-2 border-t border-slate-800 space-y-2.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            One-Click Hackathon Demo Logins:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo("volunteer")}
              className="p-2.5 rounded-lg bg-slate-950 hover:bg-blue-950/50 border border-slate-800 hover:border-blue-700 text-left transition-all group"
            >
              <Users className="w-4 h-4 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-200">Volunteer</div>
              <div className="text-[10px] text-slate-500">Rohan Verma</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("ngo")}
              className="p-2.5 rounded-lg bg-slate-950 hover:bg-teal-950/50 border border-slate-800 hover:border-teal-700 text-left transition-all group"
            >
              <Building2 className="w-4 h-4 text-teal-400 mb-1 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-200">Relief NGO</div>
              <div className="text-[10px] text-slate-500">Red Cross</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("authority")}
              className="p-2.5 rounded-lg bg-slate-950 hover:bg-purple-950/50 border border-slate-800 hover:border-purple-700 text-left transition-all group"
            >
              <Compass className="w-4 h-4 text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-200">Authority</div>
              <div className="text-[10px] text-slate-500">NDMA Cell</div>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          Don't have an account?{" "}
          <Link to="/register" className="text-amber-400 hover:underline font-semibold">
            Register as Volunteer or NGO
          </Link>
        </div>
      </div>
    </div>
  );
}
