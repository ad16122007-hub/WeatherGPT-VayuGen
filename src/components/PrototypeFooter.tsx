import React from 'react';
import { CloudRain } from 'lucide-react';

export const PrototypeFooter: React.FC = () => {
  return (
    <footer className="bg-[#091522] text-slate-400 text-xs py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-8 border-b border-slate-800/80">
          {/* Left Brand Details */}
          <div className="max-w-md space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#E5A83B] to-[#F59E0B] flex items-center justify-center text-slate-950">
                <CloudRain className="w-4 h-4 fill-slate-900 stroke-slate-900" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight font-serif">
                Weather<span className="text-[#E5A83B]">GPT</span>
              </span>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed font-normal">
              Bridging the gap between weather data and the farmer&apos;s livelihood.
              Official data only, a source on every answer, no guessing.
            </p>
          </div>

          {/* Right Team Details from Prototype */}
          <div className="text-left md:text-right space-y-1.5">
            <h4 className="text-sm font-bold text-white tracking-wide">
              Team VayuGen
            </h4>
            <p className="text-xs text-slate-400 font-normal">
              Sneha Jayswal · Rishabh Mishra · Kalyani Kherwa · Adarsh Singh
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              CDC 2026 · PS ID CDC2603
            </p>
          </div>
        </div>

        {/* Bottom copyright notice */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <span>© 2026 WeatherGPT · Built for Indian farmers · Gramin Krishi Mausam Sewa</span>
          <span>IMD & Open-Meteo High Resolution Agro-Meteorology API</span>
        </div>
      </div>
    </footer>
  );
};
