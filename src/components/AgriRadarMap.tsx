import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Play,
  Pause,
  Layers,
  Wind,
  Droplets,
  Thermometer,
  CloudRain,
  Maximize2,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { LocationInfo, CurrentWeatherMetrics, FarmPlot } from '../types/agritech';

interface AgriRadarMapProps {
  location: LocationInfo;
  current: CurrentWeatherMetrics;
  activePlot: FarmPlot;
}

type LayerMode = 'radar' | 'satellite' | 'soil' | 'wind';

export const AgriRadarMap: React.FC<AgriRadarMapProps> = ({
  location,
  current,
  activePlot,
}) => {
  const [layer, setLayer] = useState<LayerMode>('radar');
  const [isPlaying, setIsPlaying] = useState(true);
  const [radarTimeOffset, setRadarTimeOffset] = useState(0); // -60m to now
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Time slider ticker
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setRadarTimeOffset((prev) => (prev >= 0 ? -60 : prev + 15));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Canvas drawing loop for animated radar sweep and simulated convective cells
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let sweepAngle = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Dark background
      ctx.fillStyle = '#060d17';
      ctx.fillRect(0, 0, width, height);

      // Draw map coordinate grid lines
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.lineWidth = 1;

      // Range rings (10km, 25km, 50km, 75km)
      const maxRadius = Math.min(width, height) * 0.45;
      const rings = [0.25, 0.5, 0.75, 1];
      rings.forEach((rFactor, idx) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius * rFactor, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(16, 185, 129, 0.5)';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillText(`${(idx + 1) * 20} km`, centerX + 6, centerY - maxRadius * rFactor + 12);
      });

      // Axis crosshairs
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - maxRadius);
      ctx.lineTo(centerX, centerY + maxRadius);
      ctx.moveTo(centerX - maxRadius, centerY);
      ctx.lineTo(centerX + maxRadius, centerY);
      ctx.stroke();

      // Render Layer Specific Effects
      if (layer === 'radar') {
        // Draw precipitation reflectivity cells (dBZ)
        const cellCount = current.precipProb > 30 ? 7 : 3;
        const timeFactor = (radarTimeOffset + 60) / 60; // 0 to 1

        for (let i = 0; i < cellCount; i++) {
          const angle = (i * 1.1) + timeFactor * 0.4;
          const dist = (maxRadius * 0.4) + (i * 22) - (timeFactor * 15);
          const cellX = centerX + Math.cos(angle) * dist;
          const cellY = centerY + Math.sin(angle) * dist;
          const size = 30 + (i * 10);

          const grad = ctx.createRadialGradient(cellX, cellY, 4, cellX, cellY, size);
          if (current.weatherCode >= 80 || current.precipProb > 60) {
            grad.addColorStop(0, 'rgba(239, 68, 68, 0.85)'); // Red heavy core
            grad.addColorStop(0.4, 'rgba(249, 115, 22, 0.7)'); // Orange
            grad.addColorStop(0.7, 'rgba(234, 179, 8, 0.5)'); // Yellow
            grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
          } else {
            grad.addColorStop(0, 'rgba(6, 182, 212, 0.8)'); // Cyan moderate
            grad.addColorStop(0.5, 'rgba(16, 185, 129, 0.4)'); // Green
            grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
          }

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cellX, cellY, size, 0, Math.PI * 2);
          ctx.fill();
        }

        // Rotating radar beam
        sweepAngle = (sweepAngle + 0.035) % (Math.PI * 2);
        ctx.save();
        ctx.translate(centerX, centerY);
        const beamGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius);
        beamGrad.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
        beamGrad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, maxRadius, sweepAngle, sweepAngle + 0.35);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(52, 211, 153, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(sweepAngle + 0.35) * maxRadius, Math.sin(sweepAngle + 0.35) * maxRadius);
        ctx.stroke();
        ctx.restore();
      } else if (layer === 'satellite') {
        // Infrared cloud canopy simulation
        for (let i = 0; i < 9; i++) {
          const cx = centerX + (Math.sin(i * 2 + sweepAngle * 0.1) * maxRadius * 0.7);
          const cy = centerY + (Math.cos(i * 1.5) * maxRadius * 0.7);
          const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 70);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
          grad.addColorStop(0.6, 'rgba(203, 213, 225, 0.15)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, 70, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (layer === 'soil') {
        // Soil Moisture VWC heatmap
        const colors = [
          'rgba(245, 158, 11, 0.35)', // dry
          'rgba(16, 185, 129, 0.45)', // optimal
          'rgba(6, 182, 212, 0.55)', // moist
          'rgba(59, 130, 246, 0.5)', // heavy
        ];
        for (let i = 0; i < 6; i++) {
          const x = centerX + Math.cos(i) * (maxRadius * 0.5);
          const y = centerY + Math.sin(i) * (maxRadius * 0.5);
          const grad = ctx.createRadialGradient(x, y, 5, x, y, 60);
          grad.addColorStop(0, colors[i % colors.length]);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, 60, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (layer === 'wind') {
        // Wind vector streamlines
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 1.5;
        const step = 45;
        for (let x = centerX - maxRadius; x <= centerX + maxRadius; x += step) {
          for (let y = centerY - maxRadius; y <= centerY + maxRadius; y += step) {
            const angle = (current.windDirection * Math.PI) / 180;
            const len = Math.min(25, current.windSpeed * 1.2);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
            ctx.stroke();

            // Arrow head
            ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
            ctx.beginPath();
            ctx.arc(x + Math.cos(angle) * len, y + Math.sin(angle) * len, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Farm Center Marker (The user's active plot)
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing circle around center
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
      ctx.stroke();

      // Plot Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`📍 ${activePlot.name}`, centerX, centerY + 25);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [layer, current, radarTimeOffset, activePlot]);

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 lg:p-6 shadow-xl">
      {/* Header with Layer Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Agri-Radar & Cloud Satellite
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Live Simulated Telemetry
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              High-resolution precipitation echoes, cloud cover, and convective storm front detection
            </p>
          </div>
        </div>

        {/* Layer Toggle Chips */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setLayer('radar')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              layer === 'radar'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" /> Rain Radar
          </button>
          <button
            onClick={() => setLayer('satellite')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              layer === 'satellite'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Satellite
          </button>
          <button
            onClick={() => setLayer('soil')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              layer === 'soil'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" /> Soil Moisture
          </button>
          <button
            onClick={() => setLayer('wind')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              layer === 'wind'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wind className="w-3.5 h-3.5" /> Wind Vector
          </button>
        </div>
      </div>

      {/* Canvas Radar Container */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#060d17] aspect-[16/9] max-h-[380px] w-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={720}
          height={380}
          className="w-full h-full object-contain"
        />

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300">
          <span className="font-bold text-white block mb-1">
            {layer === 'radar'
              ? 'Precipitation Intensity (dBZ)'
              : layer === 'soil'
              ? 'Soil Moisture Saturation'
              : layer === 'wind'
              ? `Wind Flow: ${current.windSpeed} km/h`
              : 'Infrared Cloud Density'}
          </span>
          <div className="flex items-center gap-1">
            <span className="w-4 h-2 rounded bg-cyan-400"></span>
            <span className="text-[10px] text-slate-400">Light</span>
            <span className="w-4 h-2 rounded bg-emerald-400 ml-1"></span>
            <span className="text-[10px] text-slate-400">Moderate</span>
            <span className="w-4 h-2 rounded bg-amber-400 ml-1"></span>
            <span className="text-[10px] text-slate-400">Heavy</span>
            <span className="w-4 h-2 rounded bg-rose-500 ml-1"></span>
            <span className="text-[10px] text-slate-400">Severe</span>
          </div>
        </div>

        {/* Playback Controls Overlay */}
        <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1 text-slate-300 hover:text-emerald-400 transition"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <span className="text-xs font-mono font-bold text-emerald-400">
            {radarTimeOffset === 0 ? 'LIVE NOW' : `${radarTimeOffset} min`}
          </span>
        </div>
      </div>
    </div>
  );
};
