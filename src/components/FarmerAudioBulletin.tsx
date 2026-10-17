import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  RefreshCw,
  Radio,
  Sparkles,
  Bot,
  Languages,
} from 'lucide-react';
import { LocationInfo, FarmPlot, CurrentWeatherMetrics } from '../types/agritech';
import { fetchAudioBulletin, playAgronomicAudio, stopAgronomicAudio } from '../services/aiService';

interface FarmerAudioBulletinProps {
  location: LocationInfo;
  activePlot: FarmPlot;
  current: CurrentWeatherMetrics;
}

export type Dialect = 'hi' | 'bho' | 'hr' | 'pa' | 'en';

export const FarmerAudioBulletin: React.FC<FarmerAudioBulletinProps> = ({
  location,
  activePlot,
  current,
}) => {
  const [dialect, setDialect] = useState<Dialect>(() => {
    return (localStorage.getItem('weathergpt_dialect') as Dialect) || 'hi';
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [spokenText, setSpokenText] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    localStorage.setItem('weathergpt_dialect', dialect);
  }, [dialect]);

  useEffect(() => {
    return () => {
      stopAgronomicAudio();
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, []);

  const handlePlayBulletin = async (chosenDialect: Dialect = dialect) => {
    if (isPlaying) {
      stopAgronomicAudio();
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchAudioBulletin({
        dialect: chosenDialect,
        location: location.name,
        temp: current.temp,
        condition: current.weatherText,
        windSpeed: current.windSpeed,
        rainChance: current.precipProb,
        soilMoisture: current.soilMoisture0_1cm,
        crop: activePlot.crop,
        voice: 'Kore',
      });

      setSpokenText(data.spokenText);

      if (data.audioBase64) {
        const url = `data:audio/wav;base64,${data.audioBase64}`;
        setAudioUrl(url);
        const audio = new Audio(url);
        audioElementRef.current = audio;

        audio.onplay = () => {
          setIsLoading(false);
          setIsPlaying(true);
        };
        audio.onended = () => {
          setIsPlaying(false);
        };
        audio.onerror = () => {
          setIsPlaying(false);
          setIsLoading(false);
          // Fallback to speech synthesis
          playAgronomicAudio(
            data.spokenText,
            'Kore',
            () => setIsPlaying(true),
            () => setIsPlaying(false)
          );
        };

        await audio.play();
      } else {
        // Fallback to speech synthesis
        setIsLoading(false);
        await playAgronomicAudio(
          data.spokenText,
          'Kore',
          () => setIsPlaying(true),
          () => setIsPlaying(false)
        );
      }
    } catch (err) {
      console.error('Failed to play audio bulletin:', err);
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const dialectLabels: Record<Dialect, { label: string; badge: string }> = {
    hi: { label: '🇮🇳 हिन्दी (मानक)', badge: 'Hindi' },
    bho: { label: '🌾 भोजपुरी / अवधी', badge: 'Bhojpuri' },
    hr: { label: '🌾 हरियाणवी', badge: 'Haryanvi' },
    pa: { label: '🌾 ਪੰਜਾਬੀ', badge: 'Punjabi' },
    en: { label: '🌐 English', badge: 'English' },
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border-2 border-emerald-500/40 p-4 sm:p-5 shadow-xl transition">
      {/* Decorative pulse background */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Headline & Dialect Switcher */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Radio className="w-4 h-4 animate-pulse" />
              दैनिक किसान मौसम बुलेटिन (Farmer Audio Bulletin)
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight">
            आज का मौसम और खेती सलाह अपनी भाषा में बोलकर सुनें
          </h3>

          {/* Dialect selector pills */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] text-slate-400 font-semibold mr-1 flex items-center gap-1">
              <Languages className="w-3.5 h-3.5 text-amber-400" /> बोली चुनें:
            </span>
            {(['hi', 'bho', 'hr', 'pa', 'en'] as Dialect[]).map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDialect(d);
                  if (isPlaying) {
                    stopAgronomicAudio();
                    setIsPlaying(false);
                  }
                  handlePlayBulletin(d);
                }}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                  dialect === d
                    ? 'bg-emerald-500 text-slate-950 shadow-md ring-1 ring-emerald-300'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                {dialectLabels[d].label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Big Audio Play Button */}
        <div className="flex items-center gap-3 self-start md:self-auto flex-shrink-0">
          <button
            onClick={() => handlePlayBulletin(dialect)}
            disabled={isLoading}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black text-sm transition-all duration-300 shadow-xl active:scale-95 ${
              isPlaying
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30 ring-2 ring-rose-400'
                : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-slate-950 shadow-emerald-500/30 hover:scale-105'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>आवाज़ तैयार हो रही है...</span>
              </>
            ) : isPlaying ? (
              <>
                <Square className="w-5 h-5 fill-current" />
                <span>आवाज़ बंद करें (Stop)</span>
                <span className="flex space-x-1">
                  <span className="w-1.5 h-4 bg-white animate-pulse"></span>
                  <span className="w-1.5 h-6 bg-white animate-pulse delay-75"></span>
                  <span className="w-1.5 h-3 bg-white animate-pulse delay-150"></span>
                </span>
              </>
            ) : (
              <>
                <Volume2 className="w-6 h-6 stroke-[2.4]" />
                <div className="text-left">
                  <span className="block leading-none text-xs text-slate-900 font-bold uppercase tracking-wider">
                    1-क्लिक में सुनें
                  </span>
                  <span className="text-sm font-black leading-tight">
                    मौसम रिपोर्ट बोलकर सुनें
                  </span>
                </div>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Spoken Text Output Box (Large, accessible font for farmers) */}
      {spokenText && (
        <div className="mt-3.5 p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-slate-100 text-xs sm:text-sm leading-relaxed flex items-start gap-3 animate-in fade-in duration-300">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 flex-shrink-0 mt-0.5">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block mb-0.5">
              बोली गई किसान सलाह ({dialectLabels[dialect].badge}):
            </span>
            <p className="font-medium text-white">{spokenText}</p>
          </div>
        </div>
      )}
    </div>
  );
};
