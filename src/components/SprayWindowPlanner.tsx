import React, { useState } from 'react';
import {
  Wind,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Droplets,
  Thermometer,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { HourlyForecastItem, UnitSystem, FarmPlot } from '../types/agritech';

interface SprayWindowPlannerProps {
  hourly: HourlyForecastItem[];
  units: UnitSystem;
  activePlot: FarmPlot;
  onOpenChatWithPrompt: (prompt: string) => void;
}

export const SprayWindowPlanner: React.FC<SprayWindowPlannerProps> = ({
  hourly,
  units,
  activePlot,
  onOpenChatWithPrompt,
}) => {
  const [selectedHourIdx, setSelectedHourIdx] = useState<number>(0);
  const selectedHour = hourly[selectedHourIdx] || hourly[0];

  const formatWind = (kmh: number) => {
    if (units === 'imperial') {
      return `${Math.round(kmh * 0.621371)} mph`;
    }
    return `${kmh} km/h`;
  };

  const formatTemp = (celsius: number) => {
    if (units === 'imperial') {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${celsius}°C`;
  };

  // Find best continuous spray window
  const optimalHours = hourly.filter((h) => h.sprayCondition === 'optimal');
  const bestWindowLabel =
    optimalHours.length > 0
      ? `${optimalHours[0].formattedHour} - ${
          optimalHours[Math.min(3, optimalHours.length - 1)].formattedHour
        }`
      : 'No optimal window in next 12h (Delay application)';

  // Calculate Delta-T estimate (Approximation: Dry bulb minus wet bulb)
  // Delta T = T - (T * (0.566 + 0.000084 * rh) - 0.000155 * rh^2) roughly
  const approxDeltaT = Math.max(
    1,
    Math.round((selectedHour.temp * (1 - selectedHour.humidity / 100) * 1.5) * 10) / 10
  );

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 lg:p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Precision Spray & Fieldwork Planner
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  Hour-by-Hour Drift Matrix
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Evaluating wind shear, inversion hazard, rain wash-off, and droplet delta-T for {activePlot.crop}
              </p>
            </div>
          </div>
        </div>

        {/* Golden Window Banner */}
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
          <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
              Recommended Spray Slot
            </span>
            <span className="text-xs font-black text-white font-mono">{bestWindowLabel}</span>
          </div>
        </div>
      </div>

      {/* Hourly Timeline Slider */}
      <div className="relative mb-6">
        <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center justify-between">
          <span>Click any hour to inspect drift risk & microclimate metrics:</span>
          <span className="text-[11px] text-emerald-400 font-mono">Next 24 Hours</span>
        </p>

        <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-slate-700">
          {hourly.slice(0, 24).map((h, idx) => {
            const isSelected = idx === selectedHourIdx;
            const isOptimal = h.sprayCondition === 'optimal';
            const isHazard = h.sprayCondition === 'hazardous';

            return (
              <button
                key={h.time}
                onClick={() => setSelectedHourIdx(idx)}
                className={`flex-shrink-0 flex flex-col items-center p-2.5 rounded-xl border transition-all text-center min-w-[72px] ${
                  isSelected
                    ? 'ring-2 ring-emerald-400 bg-slate-800 border-emerald-500 shadow-lg scale-105 z-10'
                    : isOptimal
                    ? 'bg-emerald-950/20 border-emerald-900/60 hover:border-emerald-500/50 text-slate-200'
                    : isHazard
                    ? 'bg-rose-950/20 border-rose-900/60 hover:border-rose-500/50 text-slate-300'
                    : 'bg-amber-950/20 border-amber-900/60 hover:border-amber-500/50 text-slate-300'
                }`}
              >
                <span className="text-[11px] font-bold font-mono text-slate-300 mb-1">
                  {h.formattedHour}
                </span>

                {/* Status Icon */}
                <div className="my-1">
                  {isOptimal ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isHazard ? (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                </div>

                <span className="text-xs font-bold text-white font-mono mt-0.5">
                  {formatTemp(h.temp)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {formatWind(h.windSpeed)}
                </span>

                {/* Rain indicator if any */}
                {h.precipProb > 15 && (
                  <span className="text-[9px] text-cyan-400 font-bold mt-1">
                    {h.precipProb}% rain
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Hour In-Depth Drilldown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
        {/* Left: Status & Action Summary */}
        <div className="md:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {selectedHour.formattedHour} Analysis
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  selectedHour.sprayCondition === 'optimal'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : selectedHour.sprayCondition === 'hazardous'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {selectedHour.sprayCondition === 'optimal'
                  ? 'Safe for Chemical Application'
                  : selectedHour.sprayCondition === 'hazardous'
                  ? 'High Risk: Postpone Spraying'
                  : 'Marginal Window: Caution Required'}
              </span>
            </div>

            <p className="text-sm font-medium text-slate-200 mt-2">
              {selectedHour.sprayReason}
            </p>
          </div>

          {/* AI Advice Callout */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Target crop: <strong className="text-white">{activePlot.crop}</strong> ({activePlot.growthStage})
            </div>
            <button
              onClick={() =>
                onOpenChatWithPrompt(
                  `Should I apply chemical or foliar nutrition at ${selectedHour.formattedHour} for ${activePlot.crop}? Wind is ${selectedHour.windSpeed} km/h and temp is ${selectedHour.temp}°C.`
                )
              }
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
            >
              Ask AI Agronomist <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Technical Microclimate Parameters (Delta T, Humidity, Wind Gusts, Rain Risk) */}
        <div className="md:col-span-5 grid grid-cols-2 gap-2.5">
          {/* Wind & Gust */}
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Wind & Gusts</span>
            <span className="text-sm font-black text-white font-mono">
              {formatWind(selectedHour.windSpeed)}
            </span>
            <span className="text-[10px] text-slate-500 block truncate">
              Gusts: {formatWind(selectedHour.windGusts)}
            </span>
          </div>

          {/* Delta-T (Crucial for droplet survival) */}
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              Delta T (ΔT)
              <span title="Ideal range is 2°C - 8°C. Below 2°C droplets don't dry; above 8°C droplets evaporate into drift." className="cursor-help">
                <HelpCircle className="w-3 h-3 text-slate-500" />
              </span>
            </span>
            <span
              className={`text-sm font-black font-mono ${
                approxDeltaT >= 2 && approxDeltaT <= 8 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {approxDeltaT}°C
            </span>
            <span className="text-[10px] text-slate-500 block truncate">
              {approxDeltaT >= 2 && approxDeltaT <= 8 ? 'Ideal droplet lifetime' : 'Droplet drift / rapid loss'}
            </span>
          </div>

          {/* Relative Humidity */}
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rel. Humidity</span>
            <span className="text-sm font-black text-white font-mono">
              {selectedHour.humidity}%
            </span>
            <span className="text-[10px] text-slate-500 block truncate">
              {selectedHour.humidity > 80 ? 'Slow drying / Fungal risk' : 'Moderate'}
            </span>
          </div>

          {/* Rain Probability */}
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Wash-off Risk</span>
            <span
              className={`text-sm font-black font-mono ${
                selectedHour.precipProb > 25 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {selectedHour.precipProb}%
            </span>
            <span className="text-[10px] text-slate-500 block truncate">
              Precip: {selectedHour.precipitation} mm
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
