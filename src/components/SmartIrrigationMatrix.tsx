import React, { useState } from 'react';
import {
  Droplets,
  Layers,
  Thermometer,
  Gauge,
  Sparkles,
  HelpCircle,
  Timer,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { CurrentWeatherMetrics, UnitSystem, FarmPlot } from '../types/agritech';

interface SmartIrrigationMatrixProps {
  current: CurrentWeatherMetrics;
  units: UnitSystem;
  activePlot: FarmPlot;
  onOpenChatWithPrompt: (prompt: string) => void;
}

export const SmartIrrigationMatrix: React.FC<SmartIrrigationMatrixProps> = ({
  current,
  units,
  activePlot,
  onOpenChatWithPrompt,
}) => {
  // Crop Coefficient (Kc) mapping based on crop stage
  const getCropKc = (stage: string) => {
    const s = stage.toLowerCase();
    if (s.includes('emergence') || s.includes('seedling')) return 0.45;
    if (s.includes('tillering') || s.includes('vegetative')) return 0.85;
    if (s.includes('flowering') || s.includes('bloom') || s.includes('silking')) return 1.15;
    if (s.includes('grain') || s.includes('bulking') || s.includes('fruit')) return 1.05;
    if (s.includes('maturity') || s.includes('ripening')) return 0.65;
    return 0.9;
  };

  const kc = getCropKc(activePlot.growthStage);
  const dailyETc = Math.round(current.et0 * kc * 10) / 10; // Crop Evapotranspiration
  const rainInput = current.rainSum24h;
  const netWaterBalance = Math.round((rainInput - dailyETc) * 10) / 10;

  // Root zone average moisture (3-9cm & 9-27cm)
  const rootZoneMoisture = Math.round((current.soilMoisture3_9cm + current.soilMoisture9_27cm) / 2);

  // Irrigation requirement in mm
  const needsIrrigation = rootZoneMoisture < 24 && netWaterBalance < -1;
  const recommendedMm = needsIrrigation ? Math.max(8, Math.round(dailyETc * 3 - rainInput)) : 0;

  // Estimate runtime for irrigation system
  // Drip: ~4 mm/hr application rate
  // Sprinkler: ~7 mm/hr
  // Flood: ~15 mm/hr
  const appRate = activePlot.irrigationSystem === 'Drip' ? 4 : activePlot.irrigationSystem === 'Sprinkler' ? 7 : 12;
  const estimatedHours = recommendedMm > 0 ? (recommendedMm / appRate).toFixed(1) : '0';

  const formatTemp = (celsius: number) => {
    if (units === 'imperial') {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${celsius}°C`;
  };

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 lg:p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Root-Zone Moisture & Irrigation Matrix
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                ET₀ FAO-56 Model
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Depth profile and deficit replenishment schedule for {activePlot.name} ({activePlot.soilType})
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
            needsIrrigation
              ? 'bg-amber-950/40 border-amber-500/30 text-amber-400'
              : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
          }`}
        >
          {needsIrrigation ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          <span>{needsIrrigation ? `Irrigate ${recommendedMm} mm Needed` : 'Moisture Sufficient'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 4-Layer Soil Moisture Profile */}
        <div className="lg:col-span-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" /> Soil Moisture by Depth (VWC %)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Soil Type: {activePlot.soilType}</span>
          </div>

          <div className="space-y-3">
            {/* Layer 1: 0 - 1 cm */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">0 - 1 cm (Surface Crust / Seedbed)</span>
                <span className="font-mono font-bold text-white">{current.soilMoisture0_1cm}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, current.soilMoisture0_1cm * 2.2)}%` }}
                />
              </div>
            </div>

            {/* Layer 2: 1 - 3 cm */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">1 - 3 cm (Upper Root Zone)</span>
                <span className="font-mono font-bold text-white">{current.soilMoisture1_3cm}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, current.soilMoisture1_3cm * 2.2)}%` }}
                />
              </div>
            </div>

            {/* Layer 3: 3 - 9 cm */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">3 - 9 cm (Core Active Roots)</span>
                <span className="font-mono font-bold text-emerald-300">{current.soilMoisture3_9cm}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, current.soilMoisture3_9cm * 2.2)}%` }}
                />
              </div>
            </div>

            {/* Layer 4: 9 - 27 cm */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">9 - 27 cm (Subsoil Reservoir)</span>
                <span className="font-mono font-bold text-cyan-300">{current.soilMoisture9_27cm}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, current.soilMoisture9_27cm * 2.2)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Soil Temperature readout */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-orange-400" />
              Root Zone Temp: <strong className="text-white font-mono">{formatTemp(current.soilTemp6cm)}</strong>
            </span>
            <span className="text-[11px] text-emerald-400 font-medium">
              Surface: {formatTemp(current.soilTemp0cm)}
            </span>
          </div>
        </div>

        {/* Right Column: Water Balance & Irrigation Action Card */}
        <div className="lg:col-span-6 flex flex-col justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-cyan-400" /> Daily Water Balance
              </span>
              <span className="text-[10px] text-slate-400">
                Crop Kc: <strong className="text-white font-mono">{kc}</strong>
              </span>
            </div>

            {/* Metrics breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center mb-4">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">ETc (Loss)</span>
                <span className="text-sm font-black text-rose-400 font-mono">
                  -{dailyETc} <span className="text-[10px] font-normal">mm</span>
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rain Inflow</span>
                <span className="text-sm font-black text-cyan-400 font-mono">
                  +{rainInput} <span className="text-[10px] font-normal">mm</span>
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Net Deficit</span>
                <span
                  className={`text-sm font-black font-mono ${
                    netWaterBalance < 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {netWaterBalance} <span className="text-[10px] font-normal">mm</span>
                </span>
              </div>
            </div>

            {/* Agronomic Plan Recommendation */}
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                <Timer className="w-4 h-4 text-emerald-400" />
                <span>
                  {needsIrrigation
                    ? `Recommended: ${recommendedMm} mm via ${activePlot.irrigationSystem}`
                    : 'Optimal Root Moisture - No Irrigation Required Today'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {needsIrrigation
                  ? `Run ${activePlot.irrigationSystem} for approximately ${estimatedHours} hours during dusk or early dawn to minimize vapor pressure evaporation loss.`
                  : `Root reservoir (${rootZoneMoisture}%) is above critical stress threshold (50% field capacity). Water conservation hold is recommended for the next 24-36h.`}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Plot size: <strong className="text-white">{activePlot.areaAcres} acres</strong>
            </span>
            <button
              onClick={() =>
                onOpenChatWithPrompt(
                  `Create an irrigation schedule for ${activePlot.crop} (${activePlot.growthStage}) on ${activePlot.soilType} soil with root moisture at ${rootZoneMoisture}% and ET0 at ${current.et0} mm/day.`
                )
              }
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
            >
              <Sparkles className="w-3.5 h-3.5" /> Optimize Schedule with AI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
