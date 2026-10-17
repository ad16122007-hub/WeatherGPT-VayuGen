import React from 'react';
import {
  Bug,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Droplets,
  Thermometer,
  Info,
} from 'lucide-react';
import { CurrentWeatherMetrics, FarmPlot } from '../types/agritech';

interface PestDiseaseRadarProps {
  current: CurrentWeatherMetrics;
  activePlot: FarmPlot;
  onOpenChatWithPrompt: (prompt: string) => void;
}

interface PathogenModel {
  name: string;
  type: 'Fungal' | 'Bacterial' | 'Insect / Pest';
  crops: string[];
  calculateRisk: (temp: number, humidity: number, precipProb: number) => {
    level: 'Low' | 'Medium' | 'High' | 'Severe';
    score: number;
    trigger: string;
    advice: string;
  };
}

const PATHOGEN_MODELS: PathogenModel[] = [
  {
    name: 'Late Blight (Phytophthora infestans)',
    type: 'Fungal',
    crops: ['Tomato', 'Potato'],
    calculateRisk: (temp, humidity, rain) => {
      if (temp >= 12 && temp <= 24 && (humidity >= 85 || rain > 30)) {
        return {
          level: 'Severe',
          score: 88,
          trigger: 'Continuous high humidity (>85%) with mild canopy temperature creates optimal spore germination.',
          advice: 'Apply protective copper fungicide or translaminar metalaxyl immediately before leaf lesions spread.',
        };
      }
      if (temp >= 10 && temp <= 27 && humidity >= 70) {
        return {
          level: 'Medium',
          score: 55,
          trigger: 'Moderate relative humidity supporting nocturnal zoospore mobility.',
          advice: 'Inspect underside of lower canopy leaves for water-soaked lesions or white mildew rings.',
        };
      }
      return {
        level: 'Low',
        score: 20,
        trigger: 'Microclimate humidity and dry leaf surface inhibit zoospore infection.',
        advice: 'Maintain standard scouting routines; avoid overhead sprinkler wetting.',
      };
    },
  },
  {
    name: 'Powdery Mildew (Erysiphe / Podosphaera)',
    type: 'Fungal',
    crops: ['Grapevines', 'Wheat', 'Mustard', 'Tomato', 'Maize / Corn'],
    calculateRisk: (temp, humidity) => {
      if (temp >= 18 && temp <= 28 && humidity >= 60 && humidity <= 85) {
        return {
          level: 'High',
          score: 75,
          trigger: 'Warm daylight with moderate-to-high relative humidity accelerates conidial sporulation.',
          advice: 'Apply wettable sulfur or bio-fungicide (Bacillus subtilis); ensure good airflow.',
        };
      }
      if (temp >= 15 && temp <= 30) {
        return {
          level: 'Medium',
          score: 48,
          trigger: 'Favorable temperature range; conidia can survive moderate dry spells.',
          advice: 'Scout upper leaf surfaces for faint white talcum-like powdery spots.',
        };
      }
      return {
        level: 'Low',
        score: 18,
        trigger: 'High heat (>35°C) or cold (<10°C) limits fungal hyphae growth.',
        advice: 'Low threat profile under current thermal regime.',
      };
    },
  },
  {
    name: 'Foliar Rust (Puccinia spp. / Yellow & Brown Rust)',
    type: 'Fungal',
    crops: ['Wheat', 'Maize / Corn', 'Soybean', 'Mustard'],
    calculateRisk: (temp, humidity, rain) => {
      if (temp >= 10 && temp <= 22 && (humidity >= 80 || rain > 20)) {
        return {
          level: 'High',
          score: 80,
          trigger: 'Cool wet nights with dew persistence > 6 hours allow urediniospores to germinate.',
          advice: 'Deploy triazole-based fungicide (e.g. Propiconazole or Tebuconazole) if yellow pustules appear.',
        };
      }
      if (temp >= 8 && temp <= 26 && humidity >= 65) {
        return {
          level: 'Medium',
          score: 45,
          trigger: 'Dew formation during early morning provides partial incubation window.',
          advice: 'Sample flag leaves in early tillering or boot stage.',
        };
      }
      return {
        level: 'Low',
        score: 15,
        trigger: 'Thermal or moisture conditions suppress urediniospore establishment.',
        advice: 'No urgent chemical intervention needed.',
      };
    },
  },
  {
    name: 'Aphid & Whitefly Outbreak',
    type: 'Insect / Pest',
    crops: ['Cotton', 'Mustard', 'Wheat', 'Tomato', 'Soybean'],
    calculateRisk: (temp, humidity) => {
      if (temp >= 20 && temp <= 30 && humidity < 70) {
        return {
          level: 'High',
          score: 78,
          trigger: 'Warm, dry weather without heavy washing rains accelerates aphid generational cycles.',
          advice: 'Install yellow sticky traps; spray neem seed kernel extract (NSKE 5%) or flonicamid if ETL breached.',
        };
      }
      if (temp >= 18 && temp <= 32) {
        return {
          level: 'Medium',
          score: 50,
          trigger: 'Moderate thermal conditions conducive to colony expansion.',
          advice: 'Check leaf curls and honeydew secretions on growing tips.',
        };
      }
      return {
        level: 'Low',
        score: 22,
        trigger: 'High rainfall wash-off or cold temperatures suppress population surges.',
        advice: 'Natural predators (ladybugs, lacewings) active in keeping numbers low.',
      };
    },
  },
  {
    name: 'Fall Armyworm / Pod Borer (Spodoptera / Helicoverpa)',
    type: 'Insect / Pest',
    crops: ['Maize / Corn', 'Cotton', 'Soybean', 'Paddy / Rice'],
    calculateRisk: (temp, humidity) => {
      if (temp >= 22 && temp <= 32 && humidity >= 65) {
        return {
          level: 'High',
          score: 72,
          trigger: 'Warm humid nights trigger peak moth oviposition and rapid larval emergence.',
          advice: 'Install pheromone traps (5/acre); apply Bacillus thuringiensis (Bt) or emamectin benzoate in whorls.',
        };
      }
      return {
        level: 'Medium',
        score: 40,
        trigger: 'Moderate larval feeding activity during night hours.',
        advice: 'Inspect central whorls for shot-hole damage or sawdust-like frass.',
      };
    },
  },
];

export const PestDiseaseRadar: React.FC<PestDiseaseRadarProps> = ({
  current,
  activePlot,
  onOpenChatWithPrompt,
}) => {
  // Filter or prioritize models relevant to active crop
  const relevantModels = PATHOGEN_MODELS.map((model) => {
    const isCropMatch = model.crops.some((c) =>
      activePlot.crop.toLowerCase().includes(c.toLowerCase().split(' ')[0])
    );
    const risk = model.calculateRisk(current.temp, current.humidity, current.precipProb);
    return {
      ...model,
      isCropMatch,
      risk,
    };
  }).sort((a, b) => b.risk.score - a.risk.score);

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 lg:p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Pest & Microclimate Disease Radar
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                Epidemiology Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Correlating current temperature ({current.temp}°C) and relative humidity ({current.humidity}%) with pathogen thresholds
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            onOpenChatWithPrompt(
              `Give me an integrated pest management (IPM) plan for ${activePlot.crop} at ${activePlot.growthStage} stage considering current humidity of ${current.humidity}% and temperature of ${current.temp}°C.`
            )
          }
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 border border-slate-700 hover:border-emerald-500/40 transition"
        >
          <Sparkles className="w-3.5 h-3.5" /> Full IPM AI Protocol
        </button>
      </div>

      {/* Pathogens Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {relevantModels.map((item, idx) => {
          const { risk } = item;
          const isHigh = risk.level === 'High' || risk.level === 'Severe';
          const isMed = risk.level === 'Medium';

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                isHigh
                  ? 'bg-rose-950/20 border-rose-900/60 hover:border-rose-500/60'
                  : isMed
                  ? 'bg-amber-950/20 border-amber-900/60 hover:border-amber-500/60'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Title & Tag */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono font-semibold uppercase text-slate-400 block">
                      {item.type} {item.isCropMatch && '• Host Matched'}
                    </span>
                    <h3 className="text-sm font-bold text-white leading-tight mt-0.5">
                      {item.name}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      isHigh
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : isMed
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {risk.level} ({risk.score}%)
                  </span>
                </div>

                {/* Risk Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 my-2.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-700 ${
                      isHigh ? 'bg-rose-500' : isMed ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${risk.score}%` }}
                  />
                </div>

                {/* Environmental Trigger */}
                <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                  <strong className="text-slate-200">Trigger:</strong> {risk.trigger}
                </p>

                {/* Practical Preventive Advice */}
                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 text-[11px] text-slate-300">
                  <strong className="text-emerald-400 block mb-0.5">Control Measure:</strong>
                  {risk.advice}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() =>
                  onOpenChatWithPrompt(
                    `How do I protect my ${activePlot.crop} from ${item.name}? Current risk is calculated at ${risk.level} (${risk.score}%).`
                  )
                }
                className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-bold text-slate-400 hover:text-emerald-400 flex items-center justify-between transition"
              >
                <span>Ask AI treatment for this pest</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
