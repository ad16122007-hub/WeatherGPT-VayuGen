import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  X,
  Sparkles,
  RefreshCw,
  Flame,
  CloudSnow,
  Wind,
  CloudRain,
  CheckCircle2,
  Bot,
} from 'lucide-react';
import { CurrentWeatherMetrics, FarmPlot } from '../types/agritech';
import { getSosRiskAlert } from '../services/aiService';

interface FieldSosModalProps {
  isOpen: boolean;
  onClose: () => void;
  threatType: string;
  current: CurrentWeatherMetrics;
  activePlot: FarmPlot;
  onOpenChatWithPrompt: (prompt: string) => void;
}

export const FieldSosModal: React.FC<FieldSosModalProps> = ({
  isOpen,
  onClose,
  threatType,
  current,
  activePlot,
  onOpenChatWithPrompt,
}) => {
  const [selectedThreat, setSelectedThreat] = useState(threatType || 'Frost & Freeze');
  const [loading, setLoading] = useState(false);
  const [sosData, setSosData] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadEmergencyPlan(selectedThreat);
    }
  }, [isOpen, selectedThreat]);

  const loadEmergencyPlan = async (threat: string) => {
    setLoading(true);
    const res = await getSosRiskAlert({
      threatType: threat,
      crop: activePlot.crop,
      currentTemp: current.temp,
      minTemp: current.temp - 4,
      maxTemp: current.temp + 4,
      windGusts: current.windGusts,
      rainExpected: current.rainSum24h,
    });
    setSosData(res);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-rose-950/80 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Field S.O.S Emergency Advisory
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-extrabold uppercase">
                  Yield Defense
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Immediate countermeasures for {activePlot.crop} at {activePlot.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Threat Type Selector */}
        <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-none border-b border-slate-800/80">
          {['Frost & Freeze', 'Extreme Heat & Drought', 'Severe Storm & Lodging', 'Torrential Rain & Flooding'].map(
            (threat) => (
              <button
                key={threat}
                onClick={() => setSelectedThreat(threat)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                  selectedThreat === threat
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {threat.includes('Frost') ? (
                  <CloudSnow className="w-3.5 h-3.5" />
                ) : threat.includes('Heat') ? (
                  <Flame className="w-3.5 h-3.5" />
                ) : threat.includes('Storm') ? (
                  <Wind className="w-3.5 h-3.5" />
                ) : (
                  <CloudRain className="w-3.5 h-3.5" />
                )}
                {threat}
              </button>
            )
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-rose-400" />
              <span>Analyzing physiological damage potential and countermeasures...</span>
            </div>
          ) : sosData ? (
            <div className="space-y-4">
              {/* Severity Card */}
              <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">
                      Severity: {sosData.severity || 'Warning'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                      Economic Risk: {sosData.economicRiskLevel || 'Severe'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {sosData.damagePotential}
                  </p>
                </div>
              </div>

              {/* Action Checklist */}
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Urgent Action Steps (Next 6-18h):
                </h4>
                <div className="space-y-2">
                  {sosData.urgentCountermeasures?.map((step: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Post-Event Recovery */}
              {sosData.postEventRecovery && (
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-300">
                  <strong className="text-emerald-400 block mb-1">Post-Event Crop Recovery Protocol:</strong>
                  {sosData.postEventRecovery}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenChatWithPrompt(
                `Urgent emergency plan needed: How do I defend my ${activePlot.crop} against imminent ${selectedThreat}?`
              );
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md"
          >
            <Bot className="w-4 h-4" /> Ask WeatherGPT Live Questions
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
