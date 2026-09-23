import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { LiveRadarScanner } from "../components/LiveRadarScanner";
import { motion } from "motion/react";
import {
  ShieldAlert,
  HeartHandshake,
  Cpu,
  Boxes,
  PackageCheck,
  UserCheck,
  ShieldCheck,
  Building2,
  Users,
  Compass,
  Radio,
  ArrowRight,
  Sparkles,
  Layers,
  KeyRound,
  Shield,
  WifiOff,
  Activity,
  CheckCircle2,
  Clock,
  MapPin,
  Flame,
  Zap,
  Lock
} from "lucide-react";

export function LandingPage() {
  const { lang, t } = useLanguage();
  const [activeTabPreview, setActiveTabPreview] = useState<number>(1);

  // Auto-cycle through the 5 steps for an interactive animated preview
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTabPreview((prev) => (prev >= 5 ? 1 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950">
      {/* Real-time Crisis Telemetry Ticker */}
      <div className="w-full bg-slate-900/90 border-b border-white/5 py-1.5 px-4 overflow-hidden relative">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-none">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              DISASTER PROTOCOL ACTIVE
            </span>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <span className="shrink-0 flex items-center gap-1 text-slate-300">
              <Zap className="w-3 h-3 text-amber-400" />
              Cellular + Offline IndexedDB Sync
            </span>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <span className="shrink-0 flex items-center gap-1 text-slate-300">
              <ShieldCheck className="w-3 h-3 text-sky-400" />
              100% Anti-Theft Recipient OTP Handover
            </span>
            <span className="text-slate-700 hidden md:inline">|</span>
            <span className="shrink-0 hidden md:flex items-center gap-1 text-slate-300">
              <Cpu className="w-3 h-3 text-purple-400" />
              Multilingual Gemini AI Triage
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-slate-400 text-[10px]">
            <span>SECTOR: MUMBAI DISASTER GRID</span>
            <span className="text-emerald-400 font-bold">99.8% VERIFIED</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Hero Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-wide shadow-lg shadow-amber-500/5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {lang === "en"
                    ? "Next-Gen Tactical Emergency Coordination"
                    : "अगली पीढ़ी का आपातकालीन आपदा समन्वय"}
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]"
              >
                Rescue<span className="animate-shimmer">Chain</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl sm:text-2xl font-bold text-slate-200 tracking-tight"
              >
                {lang === "en"
                  ? "From Emergency Signal to Verified Relief."
                  : "आपातकालीन संकेत से सत्यापित राहत तक।"}
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal"
              >
                {lang === "en"
                  ? "Transform fragmented distress signals across flood and crisis zones into an auditable, verified response chain. Features 100% offline fallback and anti-theft recipient OTP handovers."
                  : "बाढ़ और आपदा क्षेत्रों से आ रहे बिखरे संकेतों को एक निष्पक्ष, सत्यापित राहत श्रृंखला में बदलें। पूर्णतः ऑफलाइन बैकअप और नागरिक OTP द्वारा सुरक्षित डिलीवरी।"}
              </motion.p>

              {/* Primary Dual Call to Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 max-w-md mx-auto lg:mx-0"
              >
                <Link
                  to="/citizen"
                  className="w-full sm:w-auto flex-1 px-7 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:brightness-110 text-white font-black text-base shadow-2xl glow-red transition-all flex items-center justify-center gap-2.5 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Radio className="w-5 h-5 animate-pulse text-white" />
                  <span>{t.needHelp}</span>
                </Link>

                <Link
                  to="/volunteer"
                  className="w-full sm:w-auto flex-1 px-7 py-4 rounded-2xl bg-slate-900 hover:bg-slate-850 text-white font-bold text-base border border-slate-700 hover:border-amber-400/50 shadow-xl transition-all flex items-center justify-center gap-2.5 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <HeartHandshake className="w-5 h-5 text-amber-400" />
                  <span>{t.wantToHelp}</span>
                </Link>
              </motion.div>

              {/* Sub-text security guarantees */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {lang === "en" ? "Zero Login for Citizens" : "नागरिकों हेतु लॉगिन मुक्त"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-400" />
                  {lang === "en" ? "Confidential Recipient OTP" : "गोपनीय नागरिक OTP"}
                </span>
                <span className="flex items-center gap-1.5">
                  <WifiOff className="w-4 h-4 text-sky-400" />
                  {lang === "en" ? "Offline IndexedDB Caching" : "ऑफलाइन स्थानीय संग्रहण"}
                </span>
              </div>
            </div>

            {/* Right Hero Column: Tactical Live Command Preview */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="p-5 sm:p-6 rounded-3xl panel-glass border border-white/10 shadow-2xl glow-amber relative overflow-hidden space-y-4"
              >
                {/* Background radar sweep cone accent */}
                <div className="absolute -top-24 -right-24 w-52 h-52 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

                {/* Tactical Live Radar Scanner Header */}
                <LiveRadarScanner
                  label={lang === "en" ? "Active Command Grid" : "सक्रिय आपदा कमान"}
                  statusText={
                    lang === "en"
                      ? "Real-Time Disaster Triage & Mesh"
                      : "रीयल-टाइम ट्राइएज व मेश लिंक"
                  }
                  count={24}
                />

                {/* Sample Live Telemetry Card */}
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-amber-400 font-black font-mono">
                      <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                      RC-82914
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-extrabold text-[10px] border border-red-500/40">
                      LEVEL 5 URGENCY
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 font-semibold line-clamp-2">
                    "Water reached 1st floor in Kurla West. 5 people trapped on roof including elderly patient."
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">
                        Allocated Resource
                      </span>
                      <span className="text-teal-300 font-bold truncate block">1 Rescue Boat</span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">
                        Secret Handover OTP
                      </span>
                      <span className="text-amber-300 font-mono font-bold tracking-widest">
                        •••• (Protected)
                      </span>
                    </div>
                  </div>

                  {/* Interactive Mini Stepper */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-mono">
                      <span>VERIFICATION PROGRESS</span>
                      <span className="text-emerald-400 font-bold">STEP 4/5</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-amber-500 via-red-500 to-emerald-400"
                        animate={{ width: ["20%", "85%", "20%"] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Direct Shortcut to Citizen Verification */}
                <Link
                  to="/citizen?tab=track&code=RC-82914"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold flex items-center justify-between transition-all border border-slate-700 hover:border-slate-600"
                >
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>{lang === "en" ? "Test OTP & Track Signal RC-82914" : "RC-82914 का OTP व स्टेटस टेस्ट करें"}</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* 5-Step Operational Response Flow */}
      <section className="py-14 px-4 bg-slate-900/60 border-y border-white/5 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 space-y-1">
            <span className="text-xs uppercase tracking-widest font-black text-amber-400">
              {lang === "en" ? "Decentralized Architecture" : "विकेंद्रीकृत प्रणाली संरचना"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {lang === "en"
                ? "5-Step Verifiable Coordination Flow"
                : "5-चरणीय सत्यापन योग्य समन्वय प्रवाह"}
            </h2>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              {lang === "en"
                ? "Every incident progresses through immutable audit milestones from initial distress signal to in-person physical verification."
                : "प्रत्येक आपात स्थिति प्रारंभिक संकेत से लेकर भौतिक सत्यापन तक एक पारदर्शी ऑडिट श्रृंखला में दर्ज होती है।"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                step: "01",
                title: lang === "en" ? "Report SOS" : "SOS रिपोर्ट",
                desc:
                  lang === "en"
                    ? "Citizen broadcasts situation. Offline queue saves locally with zero cellular signal."
                    : "नागरिक आपात संदेश भेजते हैं। सिग्नल न होने पर भी फोन में सुरक्षित रहता है।",
                icon: Radio,
                color: "text-red-400 bg-red-500/10 border-red-500/30"
              },
              {
                step: "02",
                title: lang === "en" ? "AI Prioritize" : "AI प्राथमिकता",
                desc:
                  lang === "en"
                    ? "Multilingual LLM parses English/Hindi distress into urgency levels 1–5."
                    : "बहुभाषी मॉडल संदेश का विश्लेषण कर 1-5 तात्कालिकता स्तर निर्धारित करता है।",
                icon: Cpu,
                color: "text-purple-400 bg-purple-500/10 border-purple-500/30"
              },
              {
                step: "03",
                title: lang === "en" ? "Cluster Zone" : "क्लस्टरिंग",
                desc:
                  lang === "en"
                    ? "Geospatial engine merges duplicate calls within 350m without losing detail."
                    : "350 मीटर दायरे में आने वाली समान कॉल्स को एक साथ क्लस्टर किया जाता है।",
                icon: Boxes,
                color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30"
              },
              {
                step: "04",
                title: lang === "en" ? "Match Inventory" : "सामग्री मिलान",
                desc:
                  lang === "en"
                    ? "Allocates nearest verified NGO supplies (boats, rations, trauma kits, water)."
                    : "निकटतम सत्यापित NGO भंडार से आवश्यक राहत सामग्री आवंटित होती है।",
                icon: PackageCheck,
                color: "text-teal-400 bg-teal-500/10 border-teal-500/30"
              },
              {
                step: "05",
                title: lang === "en" ? "Deliver & Verify" : "डिलीवरी व OTP",
                desc:
                  lang === "en"
                    ? "Volunteer captures pickup photo and completes handover with confidential recipient OTP."
                    : "स्वयंसेवक पिकअप फोटो लेता है और नागरिक के गोपनीय OTP द्वारा पुष्टि करता है।",
                icon: ShieldCheck,
                color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="p-5 rounded-2xl panel-glass panel-glass-hover relative group flex flex-col justify-between shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2.5 rounded-xl border ${item.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-mono font-black text-slate-500">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-100 mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-normal">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4 Beneficiary Roles */}
      <section className="py-14 px-4 max-w-6xl mx-auto w-full">
        <div className="text-center mb-10 space-y-1">
          <span className="text-xs uppercase tracking-widest font-black text-sky-400">
            {lang === "en" ? "Unified Stakeholder Ecosystem" : "एकीकृत आपदा पारिस्थितिकी तंत्र"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {lang === "en" ? "Built for Every Role in the Disaster Zone" : "आपदा क्षेत्र की प्रत्येक भूमिका हेतु समर्पित"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="p-5 rounded-2xl panel-glass panel-glass-hover space-y-3 shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-200">
              {lang === "en" ? "1. Affected Citizen" : "1. प्रभावित नागरिक"}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              {lang === "en"
                ? "No account creation needed. Quick SOS with auto-GPS, offline caching, tracking code, and safe delivery OTP."
                : "खाते की आवश्यकता नहीं। तुरंत SOS, ऑटो-GPS, ऑफलाइन सुविधा, ट्रैकिंग कोड व सुरक्षित डिलीवरी OTP।"}
            </p>
            <Link to="/citizen" className="text-xs font-bold text-red-400 flex items-center gap-1 hover:underline pt-1">
              <span>{lang === "en" ? "Citizen Portal" : "नागरिक पोर्टल"}</span> <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="p-5 rounded-2xl panel-glass panel-glass-hover space-y-3 shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-200">
              {lang === "en" ? "2. Field Volunteer" : "2. फील्ड स्वयंसेवक"}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              {lang === "en"
                ? "Prioritized dispatch queue sorted by life-urgency then proximity. Photo proof upload and recipient OTP handover."
                : "तात्कालिकता व निकटता के आधार पर कार्य सूची। फोटो प्रमाण अपलोड व प्राप्तकर्ता OTP द्वारा सत्यापन।"}
            </p>
            <Link to="/volunteer" className="text-xs font-bold text-blue-400 flex items-center gap-1 hover:underline pt-1">
              <span>{lang === "en" ? "Field Terminal" : "स्वयंसेवक टर्मिनल"}</span> <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="p-5 rounded-2xl panel-glass panel-glass-hover space-y-3 shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-200">
              {lang === "en" ? "3. Relief NGO" : "3. राहत NGO"}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              {lang === "en"
                ? "Catalog depot stock (boats, medicine, food, water) with map pins. Live visibility of matched deliveries."
                : "राहत डिपो स्टॉक (नाव, दवा, राशन, पानी) प्रबंधन एवं लाइव डिलीवरी ट्रैकिंग।"}
            </p>
            <Link to="/ngo" className="text-xs font-bold text-teal-400 flex items-center gap-1 hover:underline pt-1">
              <span>{lang === "en" ? "Manage Inventory" : "भंडार प्रबंधन"}</span> <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="p-5 rounded-2xl panel-glass panel-glass-hover space-y-3 shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-200">
              {lang === "en" ? "4. Disaster HQ" : "4. आपदा कमान केंद्र"}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              {lang === "en"
                ? "Real-time tactical command dashboard, cluster hotspots, deficit metrics, and fake report mitigation."
                : "लाइव नक्शा, क्लस्टर हॉटस्पॉट, कमी मेट्रिक्स और फेक रिपोर्ट फिल्टरिंग।"}
            </p>
            <Link to="/authority" className="text-xs font-bold text-purple-400 flex items-center gap-1 hover:underline pt-1">
              <span>{lang === "en" ? "Command Center" : "कमान केंद्र"}</span> <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/5 bg-slate-950/80 text-center text-xs text-slate-500">
        <p className="font-medium">
          RescueChain Protocol • Built for Disaster Resilience & Verifiable Humanitarian Aid Handover
        </p>
      </footer>
    </div>
  );
}
