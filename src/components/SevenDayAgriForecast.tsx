import React from 'react';
import {
  CalendarDays,
  Droplets,
  Wind,
  Sun,
  Flame,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Sparkles,
} from 'lucide-react';
import { DailyForecastItem, UnitSystem, FarmPlot } from '../types/agritech';

interface SevenDayAgriForecastProps {
  daily: DailyForecastItem[];
  units: UnitSystem;
  activePlot: FarmPlot;
  onOpenChatWithPrompt: (prompt: string) => void;
}

export const SevenDayAgriForecast: React.FC<SevenDayAgriForecastProps> = ({
  daily,
  units,
  activePlot,
  onOpenChatWithPrompt,
}) => {
  const formatTemp = (celsius: number) => {
    if (units === 'imperial') {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${celsius}°C`;
  };

  const formatRain = (mm: number) => {
    if (units === 'imperial') {
      return `${(mm * 0.03937).toFixed(2)} in`;
    }
    return `${mm} mm`;
  };

  const formatWind = (kmh: number) => {
    if (units === 'imperial') {
      return `${Math.round(kmh * 0.621371)} mph`;
    }
    return `${kmh} km/h`;
  };

  // Total 7-day rainfall and GDD
  const totalRain = Math.round(daily.reduce((sum, d) => sum + d.precipitationSum, 0) * 10) / 10;
  const totalGDD = Math.round(daily.reduce((sum, d) => sum + d.gdd, 0) * 10) / 10;
  const totalET0 = Math.round(daily.reduce((sum, d) => sum + d.et0Sum, 0) * 10) / 10;

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 lg:p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              7-Day Precision Agronomic Outlook
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                GDD & Field Trafficability
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Weekly thermal units (GDD), cumulative ET₀ moisture loss, and field operation windows
            </p>
          </div>
        </div>

        {/* 7-Day Cumulative Summary Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
            Accumulated GDD: <strong className="text-amber-400 font-mono">+{totalGDD}</strong>
          </span>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
            7-Day Rain: <strong className="text-cyan-400 font-mono">{formatRain(totalRain)}</strong>
          </span>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
            Total ET₀: <strong className="text-emerald-400 font-mono">{totalET0} mm</strong>
          </span>
        </div>
      </div>

      {/* 7-Day Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {daily.map((day, idx) => {
          const isGood = day.fieldWorkStatus === 'good';
          const isDelay = day.fieldWorkStatus === 'delay';

          return (
            <div
              key={day.date}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all hover:scale-[1.02] ${
                idx === 0
                  ? 'bg-slate-800/80 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Day name & date */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    {day.dayName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                  </span>
                </div>

                {/* Weather condition description */}
                <span className="text-[11px] font-semibold text-emerald-400 block truncate mb-2">
                  {day.weatherText}
                </span>

                {/* Temperatures Min/Max */}
                <div className="flex items-baseline justify-between text-sm font-bold font-mono text-white mb-2 pb-2 border-b border-slate-800">
                  <span className="text-base text-amber-300">{formatTemp(day.maxTemp)}</span>
                  <span className="text-xs text-slate-400">{formatTemp(day.minTemp)}</span>
                </div>

                {/* Ag Metrics */}
                <div className="space-y-1.5 text-[11px] text-slate-300 font-mono">
                  {/* Rain */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1 font-sans">
                      <Droplets className="w-3 h-3 text-cyan-400" /> Rain
                    </span>
                    <span className={day.precipitationSum > 0 ? 'text-cyan-300 font-bold' : 'text-slate-500'}>
                      {formatRain(day.precipitationSum)} ({day.precipProbMax}%)
                    </span>
                  </div>

                  {/* GDD */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1 font-sans">
                      <Flame className="w-3 h-3 text-amber-400" /> GDD (Base 10)
                    </span>
                    <span className="text-amber-300 font-bold">+{day.gdd}</span>
                  </div>

                  {/* ET0 */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1 font-sans">
                      <Activity className="w-3 h-3 text-emerald-400" /> ET₀ Loss
                    </span>
                    <span className="text-slate-300">{day.et0Sum} mm</span>
                  </div>

                  {/* Wind Max */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1 font-sans">
                      <Wind className="w-3 h-3 text-slate-400" /> Wind Gust
                    </span>
                    <span className="text-slate-400">{formatWind(day.windGustsMax)}</span>
                  </div>
                </div>
              </div>

              {/* Field Suitability Badge */}
              <div className="mt-3 pt-2.5 border-t border-slate-800">
                <div
                  className={`text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 justify-center text-center ${
                    isGood
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : isDelay
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {isGood ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : isDelay ? (
                    <XCircle className="w-3 h-3" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  <span className="truncate">
                    {isGood ? 'Fieldwork Prime' : isDelay ? 'Delay Spraying' : 'Marginal Winds'}
                  </span>
                </div>

                <button
                  onClick={() =>
                    onOpenChatWithPrompt(
                      `What is the best farm operation schedule for ${day.dayName} (${day.date}) for ${activePlot.crop}? Forecast: High ${day.maxTemp}°C, Low ${day.minTemp}°C, Rain ${day.precipitationSum} mm, Wind ${day.windSpeedMax} km/h.`
                    )
                  }
                  className="w-full mt-1.5 text-[10px] font-semibold text-slate-400 hover:text-emerald-400 text-center block transition"
                >
                  Ask AI for this day
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
