import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  MapPin,
  Crosshair,
  Loader2,
  CheckCircle2,
  X,
  Navigation,
  Compass,
  AlertCircle
} from "lucide-react";

interface SearchResult {
  place_id: number | string;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
}

interface LocationSearchBarProps {
  currentLat: number;
  currentLng: number;
  onSelectLocation: (lat: number, lng: number, placeName?: string) => void;
  lang?: "en" | "hi";
}

// Preset popular emergency hotspot coordinates for instant one-tap response
const PRESET_LOCATIONS = [
  { name: "Kurla West", nameHi: "कुर्ला वेस्ट", lat: 19.0688, lng: 72.8797 },
  { name: "Dharavi", nameHi: "धारावी", lat: 19.0422, lng: 72.8566 },
  { name: "Sion Hospital", nameHi: "सायन अस्पताल", lat: 19.0375, lng: 72.8601 },
  { name: "Bandra East", nameHi: "बांद्रा पूर्व", lat: 19.0596, lng: 72.8488 },
  { name: "Chembur Naka", nameHi: "चेंबूर नाका", lat: 19.0622, lng: 72.8988 },
  { name: "Relief Camp 4", nameHi: "राहत कैंप 4", lat: 19.076, lng: 72.8777 }
];

export function LocationSearchBar({
  currentLat,
  currentLng,
  onSelectLocation,
  lang = "en"
}: LocationSearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const searchTimeoutRef = useRef<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Real-time debounced geocoding search
  const handleQueryChange = (text: string) => {
    setQuery(text);
    setSearchError(null);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!text.trim() || text.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Fast geocoding via OpenStreetMap Nominatim
        const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          text.trim()
        )}&limit=6&addressdetails=1`;

        const res = await fetch(endpoint, {
          headers: {
            "Accept-Language": lang === "hi" ? "hi,en" : "en"
          }
        });

        if (!res.ok) throw new Error("Search service unavailable");
        const data: SearchResult[] = await res.json();

        if (data.length > 0) {
          setResults(data);
          setSearchError(null);
        } else {
          // If no online results, filter preset locations locally
          const localFiltered = PRESET_LOCATIONS.filter(
            (p) =>
              p.name.toLowerCase().includes(text.toLowerCase()) ||
              p.nameHi.includes(text)
          ).map((p, idx) => ({
            place_id: `preset_${idx}`,
            display_name: `${p.name}, Mumbai`,
            lat: p.lat.toString(),
            lon: p.lng.toString()
          }));

          setResults(localFiltered);
          if (localFiltered.length === 0) {
            setSearchError(
              lang === "en"
                ? "No matching locations found. Try a broader area or drag the map pin."
                : "स्थान नहीं मिला। कृपया अन्य क्षेत्र खोजें या मैप पिन ड्रैग करें।"
            );
          }
        }
      } catch (err) {
        // Fallback to local filter on offline or network error
        const localFiltered = PRESET_LOCATIONS.filter(
          (p) =>
            p.name.toLowerCase().includes(text.toLowerCase()) ||
            p.nameHi.includes(text)
        ).map((p, idx) => ({
          place_id: `fallback_${idx}`,
          display_name: `${p.name}, Mumbai (Offline Cache)`,
          lat: p.lat.toString(),
          lon: p.lng.toString()
        }));

        setResults(localFiltered);
        if (localFiltered.length === 0) {
          setSearchError(
            lang === "en"
              ? "Search offline. Choose from quick presets below or drag map pin."
              : "ऑफलाइन मोड: नीचे दिए गए त्वरित स्थानों में से चुनें या मैप पिन सेट करें।"
          );
        }
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  // Instant Current GPS Location
  const handleGetCurrentGps = () => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setGpsLoading(true);
    setGpsSuccess(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = Number(pos.coords.latitude.toFixed(5));
        const longitude = Number(pos.coords.longitude.toFixed(5));
        setGpsLoading(false);
        setGpsSuccess(true);
        setSelectedName(
          lang === "en" ? "My Exact GPS Location" : "मेरी सटीक जीपीएस स्थिति"
        );
        onSelectLocation(
          latitude,
          longitude,
          lang === "en" ? "My Exact GPS Location" : "मेरी सटीक जीपीएस स्थिति"
        );
        setTimeout(() => setGpsSuccess(false), 3000);
      },
      (err) => {
        console.warn("GPS error:", err);
        setGpsLoading(false);
        alert(
          lang === "en"
            ? "Could not access device GPS. Please enable location permissions or select your area below."
            : "डिवाइस GPS प्राप्त नहीं हो सका। कृपया लोकेशन अनुमति दें या नीचे स्थान चुनें।"
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Select a result from dropdown
  const handleSelectResult = (item: SearchResult) => {
    const latitude = Number(parseFloat(item.lat).toFixed(5));
    const longitude = Number(parseFloat(item.lon).toFixed(5));
    
    // Shorten display name for input
    const shortName = item.display_name.split(",").slice(0, 3).join(",");
    setSelectedName(shortName);
    setQuery(shortName);
    setIsOpen(false);
    onSelectLocation(latitude, longitude, shortName);
  };

  // Select a quick preset
  const handleSelectPreset = (preset: typeof PRESET_LOCATIONS[0]) => {
    const placeName = lang === "hi" ? preset.nameHi : preset.name;
    setSelectedName(placeName);
    setQuery(placeName);
    setIsOpen(false);
    onSelectLocation(preset.lat, preset.lng, placeName);
  };

  return (
    <div className="space-y-2.5 relative" ref={dropdownRef}>
      {/* Top Controls: Search Input + GPS Quick Button */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search Bar Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            placeholder={
              lang === "en"
                ? "Search area, colony, hospital, city (e.g., Dharavi, Kurla, Patna)..."
                : "क्षेत्र, अस्पताल, कॉलोनी या शहर खोजें (उदा. धारावी, कुर्ला, पटना)..."
            }
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all shadow-inner"
          />

          {/* Right Icon: Loader or Clear Button */}
          <div className="absolute right-3 top-3 flex items-center">
            {loading ? (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            ) : query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setIsOpen(false);
                  setSelectedName(null);
                }}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Instant GPS Quick Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleGetCurrentGps}
          disabled={gpsLoading}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 border ${
            gpsSuccess
              ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/20"
              : "bg-slate-850 hover:bg-slate-800 bg-slate-900 border-slate-700 text-slate-200 hover:text-white"
          }`}
        >
          {gpsLoading ? (
            <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          ) : gpsSuccess ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Crosshair className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          )}
          <span>
            {gpsLoading
              ? lang === "en"
                ? "Locking GPS..."
                : "GPS खोज रहे हैं..."
              : gpsSuccess
              ? lang === "en"
                ? "GPS Locked!"
                : "GPS लॉक!"
              : lang === "en"
              ? "Use My GPS"
              : "मेरी लाइव GPS"}
          </span>
        </motion.button>
      </div>

      {/* Autocomplete Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-12 z-50 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden max-h-64 overflow-y-auto"
          >
            {searchError ? (
              <div className="p-3.5 text-xs text-slate-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{searchError}</span>
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y divide-slate-800/80">
                {results.map((item) => (
                  <button
                    key={item.place_id}
                    type="button"
                    onClick={() => handleSelectResult(item)}
                    className="w-full p-3 text-left hover:bg-slate-800/90 transition-colors flex items-start gap-2.5 group"
                  >
                    <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-200 group-hover:text-amber-400 transition-colors truncate">
                        {item.display_name.split(",")[0]}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {item.display_name.split(",").slice(1).join(",")}
                      </p>
                      <span className="text-[9px] font-mono text-slate-500">
                        {Number(parseFloat(item.lat)).toFixed(4)}, {Number(parseFloat(item.lon)).toFixed(4)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Location Chips (One-Tap Shortcuts) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">
          {lang === "en" ? "Fast Presets:" : "त्वरित स्थान:"}
        </span>

        {PRESET_LOCATIONS.map((preset) => {
          const isSelected =
            Math.abs(preset.lat - currentLat) < 0.005 &&
            Math.abs(preset.lng - currentLng) < 0.005;

          return (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              key={preset.name}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all border ${
                isSelected
                  ? "bg-amber-400 text-slate-950 border-amber-400 shadow-md shadow-amber-400/20 font-bold"
                  : "bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-800"
              }`}
            >
              📍 {lang === "hi" ? preset.nameHi : preset.name}
            </motion.button>
          );
        })}
      </div>

      {/* Active Selected Location Banner */}
      {selectedName && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs text-emerald-300 shadow-sm"
        >
          <div className="flex items-center gap-1.5 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-bold text-slate-300 truncate">
              {lang === "en" ? "Location Locked: " : "स्थान लॉक: "}
              <strong className="text-emerald-300">{selectedName}</strong>
            </span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400 shrink-0 ml-2">
            {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
          </span>
        </motion.div>
      )}
    </div>
  );
}
