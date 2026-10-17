import React, { useState } from 'react';
import { CloudRain, Globe, MapPin, RefreshCw } from 'lucide-react';
import { LocationInfo } from '../types/agritech';

interface PrototypeNavbarProps {
  activeTab: 'home' | 'ask' | 'alerts';
  onSelectTab: (tab: 'home' | 'ask' | 'alerts') => void;
  currentLanguage: string;
  onSelectLanguage: (lang: string) => void;
  currentLocation: LocationInfo;
  onDetectLocation: () => Promise<void>;
  isDetectingLocation?: boolean;
}

export const PrototypeNavbar: React.FC<PrototypeNavbarProps> = ({
  activeTab,
  onSelectTab,
  currentLanguage,
  onSelectLanguage,
  currentLocation,
  onDetectLocation,
  isDetectingLocation = false,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);

  const LANGUAGES = [
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'bho', label: 'भोजपुरी (Bhojpuri)' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
    { code: 'mr', label: 'मराठी (Marathi)' },
    { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
    { code: 'bn', label: 'বাংলা (Bengali)' },
    { code: 'te', label: 'తెలుగు (Telugu)' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
    { code: 'en', label: 'English' },
  ];

  const currentLangLabel =
    LANGUAGES.find((l) => l.code === currentLanguage)?.label.split(' ')[0] || 'हिन्दी';

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7EE]/95 backdrop-blur-md border-b border-[#E8E2D2]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2 cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#E5A83B] to-[#F59E0B] flex items-center justify-center text-slate-950 shadow-sm group-hover:scale-105 transition-transform">
            <CloudRain className="w-5 h-5 fill-slate-900 stroke-slate-900" />
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 font-serif">
            Weather<span className="text-[#C27803]">GPT</span>
          </span>
        </div>

        {/* Center Nav Pills */}
        <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={() => onSelectTab('home')}
            className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'home'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-950 hover:bg-[#EFEAD8]'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onSelectTab('ask')}
            className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'ask'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-950 hover:bg-[#EFEAD8]'
            }`}
          >
            Ask
          </button>
          <button
            onClick={() => onSelectTab('alerts')}
            className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'alerts'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-950 hover:bg-[#EFEAD8]'
            }`}
          >
            Alerts
          </button>
        </nav>

        {/* Right Side: Language Switcher & Location */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Location badge */}
          <button
            onClick={onDetectLocation}
            title="वर्तमान स्थान अपडेट करें"
            disabled={isDetectingLocation}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EFEAD8] hover:bg-[#E5DFCC] border border-[#DDD5C0] text-xs text-slate-700 font-medium transition"
          >
            <MapPin className="w-3.5 h-3.5 text-[#C27803]" />
            <span className="truncate max-w-[120px]">{currentLocation.name.split(',')[0]}</span>
            {isDetectingLocation && <RefreshCw className="w-3 h-3 animate-spin text-slate-500" />}
          </button>

          {/* Language Toggle Pill */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-[#DDD5C0] text-xs font-semibold text-slate-800 shadow-2xs transition"
            >
              <Globe className="w-3.5 h-3.5 text-slate-600" />
              <span>文A {currentLangLabel}</span>
            </button>

            {showLangMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLangMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    भाषा चुनें (Select Language)
                  </div>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onSelectLanguage(lang.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition ${
                        currentLanguage === lang.code
                          ? 'bg-amber-50 text-amber-900 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{lang.label}</span>
                      {currentLanguage === lang.code && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
