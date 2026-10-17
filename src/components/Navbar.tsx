import React, { useState, useEffect, useRef } from 'react';
import {
  Sprout,
  Search,
  MapPin,
  Crosshair,
  Bot,
  RefreshCw,
  Layers,
  ChevronDown,
  Mic,
  Languages,
} from 'lucide-react';
import { LocationInfo, UnitSystem, FarmPlot } from '../types/agritech';
import { POPULAR_AGRI_REGIONS, searchLocations } from '../services/weatherService';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface NavbarProps {
  currentLocation: LocationInfo;
  onSelectLocation: (loc: LocationInfo) => void;
  units: UnitSystem;
  onToggleUnits: () => void;
  language: Language;
  onToggleLanguage: () => void;
  onOpenChat: () => void;
  onOpenVoiceBot: () => void;
  onOpenPlotManager: () => void;
  activePlot: FarmPlot;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLocation,
  onSelectLocation,
  units,
  onToggleUnits,
  language,
  onToggleLanguage,
  onOpenChat,
  onOpenVoiceBot,
  onOpenPlotManager,
  activePlot,
  onRefresh,
  isRefreshing,
}) => {
  const t = TRANSLATIONS[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [locatingGPS, setLocatingGPS] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const res = await searchLocations(searchQuery);
      setSearchResults(res);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      alert(language === 'hi' ? 'आपके ब्राउज़र में जीपीएस लोकेशन की सुविधा नहीं है।' : 'Geolocation is not supported by your browser.');
      return;
    }
    setLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingGPS(false);
        onSelectLocation({
          name: language === 'hi' ? 'मेरा खेत (जीपीएस)' : 'My GPS Farm Field',
          admin1: language === 'hi' ? 'वर्तमान निर्देशांक' : 'Current Coordinates',
          country: 'Local',
          lat: Number(pos.coords.latitude.toFixed(4)),
          lon: Number(pos.coords.longitude.toFixed(4)),
        });
        setShowSearchDropdown(false);
      },
      (err) => {
        setLocatingGPS(false);
        console.warn('GPS location error:', err);
        alert(language === 'hi' ? 'जीपीएस स्थान नहीं मिल पाया। कृपया अपने नजदीकी जिले का नाम खोजें।' : 'Could not access current GPS position. Please search your nearest town.');
      },
      { timeout: 10000 }
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-emerald-950/60 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Plot selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-300/40">
              <Sprout className="w-6 h-6 stroke-[2.2]" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
                  Weather<span className="text-emerald-400">GPT</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {language === 'hi' ? 'किसान AI' : 'AgriTech AI'}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {t.brandSubtitle}
              </p>
            </div>
          </div>

          {/* Plot switcher badge */}
          <button
            onClick={onOpenPlotManager}
            className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-white transition group"
            title={language === 'hi' ? 'खेत बदलें या नया जोड़ें' : 'Switch or edit farm plot'}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <span className="font-semibold block leading-tight truncate max-w-[120px] sm:max-w-[160px]">
                {activePlot.name}
              </span>
              <span className="text-[10px] text-emerald-400/90 leading-none">
                {activePlot.crop} • {activePlot.growthStage}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-1" />
          </button>
        </div>

        {/* Search, GPS & Quick Regions */}
        <div className="flex-1 max-w-md mx-auto md:mx-4 relative" ref={searchContainerRef}>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-10 py-1.5 text-xs sm:text-sm bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
            />
            <button
              onClick={handleUseGPS}
              disabled={locatingGPS}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-emerald-400 transition"
              title={t.gpsButton}
            >
              <Crosshair className={`w-4 h-4 ${locatingGPS ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>

          {/* Autocomplete & Quick preset menu */}
          {showSearchDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 max-h-80 overflow-y-auto">
              <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {searchQuery.length >= 2 ? t.searchResults : t.popularBelts}
                </span>
                <button
                  onClick={handleUseGPS}
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Crosshair className="w-3 h-3" /> {t.gpsButton}
                </button>
              </div>

              {isSearching ? (
                <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" /> {t.searching}
                </div>
              ) : searchQuery.length >= 2 && searchResults.length === 0 ? (
                <div className="py-3 text-center text-xs text-slate-400">
                  {t.noResults}
                </div>
              ) : searchQuery.length >= 2 ? (
                searchResults.map((loc, idx) => (
                  <button
                    key={`${loc.name}-${loc.lat}-${idx}`}
                    onClick={() => {
                      onSelectLocation(loc);
                      setShowSearchDropdown(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-950/40 hover:text-emerald-300 flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="font-medium text-slate-200">
                        {loc.name}
                        {loc.admin1 && <span className="text-slate-400">, {loc.admin1}</span>}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{loc.country}</span>
                  </button>
                ))
              ) : (
                POPULAR_AGRI_REGIONS.map((region, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelectLocation(region);
                      setShowSearchDropdown(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-xs flex items-center justify-between text-slate-300 hover:text-white transition"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400/80" />
                      <span>{region.name}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {region.countryCode}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Actions: Language Toggle, Unit toggle, Refresh, Voice Bot, Ask WeatherGPT */}
        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
          {/* Prominent Language Switcher */}
          <button
            onClick={onToggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs shadow-sm transition active:scale-95"
            title="भाषा बदलें / Change Language"
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'hi' ? '🇮🇳 हिन्दी' : '🌐 English'}</span>
          </button>

          {/* Unit Toggle */}
          <button
            onClick={onToggleUnits}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono font-bold text-slate-300 hover:text-white transition"
            title={t.unitsToggle}
          >
            {units === 'metric' ? '°C | mm' : '°F | in'}
          </button>

          {/* Refresh Data */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Voice Bot Button */}
          <button
            onClick={onOpenVoiceBot}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-bold text-xs sm:text-sm shadow-sm transition active:scale-95 group"
            title="Open Voice Chat Bot"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Mic className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>{t.voiceBotBtn}</span>
          </button>

          {/* Ask WeatherGPT Primary Action */}
          <button
            onClick={onOpenChat}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/25 transition active:scale-95"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">{t.askChatBtn}</span>
            <span className="sm:hidden">Chat</span>
          </button>
        </div>
      </div>
    </header>
  );
};
