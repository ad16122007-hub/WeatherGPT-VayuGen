import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  Sprout,
  Layers,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { FarmPlot } from '../types/agritech';
import { COMMON_CROPS } from '../services/weatherService';

interface CropManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  plots: FarmPlot[];
  activePlotId: string;
  onSelectPlot: (plotId: string) => void;
  onSavePlot: (plot: FarmPlot) => void;
  onDeletePlot: (plotId: string) => void;
}

export const CropManagerModal: React.FC<CropManagerModalProps> = ({
  isOpen,
  onClose,
  plots,
  activePlotId,
  onSelectPlot,
  onSavePlot,
  onDeletePlot,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlot, setEditingPlot] = useState<Partial<FarmPlot>>({
    name: '',
    crop: COMMON_CROPS[0].name,
    growthStage: COMMON_CROPS[0].stages[1],
    sowingDate: new Date().toISOString().slice(0, 10),
    soilType: 'Loam',
    areaAcres: 12,
    irrigationSystem: 'Drip',
  });

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlot.name?.trim() || !editingPlot.crop) return;

    const newPlot: FarmPlot = {
      id: `plot-${Date.now()}`,
      name: editingPlot.name.trim(),
      crop: editingPlot.crop,
      growthStage: editingPlot.growthStage || 'Vegetative',
      sowingDate: editingPlot.sowingDate || new Date().toISOString().slice(0, 10),
      soilType: editingPlot.soilType || 'Loam',
      areaAcres: Number(editingPlot.areaAcres) || 10,
      irrigationSystem: editingPlot.irrigationSystem || 'Drip',
      notes: editingPlot.notes || '',
    };

    onSavePlot(newPlot);
    setIsCreating(false);
    setEditingPlot({
      name: '',
      crop: COMMON_CROPS[0].name,
      growthStage: COMMON_CROPS[0].stages[1],
      sowingDate: new Date().toISOString().slice(0, 10),
      soilType: 'Loam',
      areaAcres: 10,
      irrigationSystem: 'Drip',
    });
  };

  const selectedCropPreset = COMMON_CROPS.find((c) => c.name === editingPlot.crop) || COMMON_CROPS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-emerald-950/80 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Farm Plots & Crop Manager</h3>
              <p className="text-xs text-slate-400">
                Configure your fields to receive customized agro-meteorological guidance
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {!isCreating ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Configured Plots ({plots.length})
                </span>
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition"
                >
                  <Plus className="w-4 h-4" /> Add New Field
                </button>
              </div>

              <div className="space-y-2.5">
                {plots.map((plot) => {
                  const isActive = plot.id === activePlotId;

                  return (
                    <div
                      key={plot.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                        isActive
                          ? 'bg-emerald-950/30 border-emerald-500 shadow-md ring-1 ring-emerald-500/40'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{plot.name}</h4>
                          {isActive && (
                            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-emerald-400 font-medium">{plot.crop}</span>
                          <span>•</span>
                          <span>{plot.growthStage}</span>
                          <span>•</span>
                          <span>{plot.areaAcres} acres</span>
                          <span>•</span>
                          <span>{plot.soilType} Soil</span>
                          <span>•</span>
                          <span>{plot.irrigationSystem}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {!isActive ? (
                          <button
                            onClick={() => {
                              onSelectPlot(plot.id);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-slate-950 text-xs font-bold transition flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Select Plot
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-400 font-bold px-3 py-1.5">
                            Currently Active
                          </span>
                        )}

                        {plots.length > 1 && (
                          <button
                            onClick={() => onDeletePlot(plot.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                            title="Delete plot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Creation Form */
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Field / Plot Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. North Field - Block 3"
                    value={editingPlot.name}
                    onChange={(e) => setEditingPlot({ ...editingPlot, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Crop Type *
                  </label>
                  <select
                    value={editingPlot.crop}
                    onChange={(e) => {
                      const newCrop = e.target.value;
                      const preset = COMMON_CROPS.find((c) => c.name === newCrop);
                      setEditingPlot({
                        ...editingPlot,
                        crop: newCrop,
                        growthStage: preset?.stages[1] || 'Vegetative',
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {COMMON_CROPS.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.scientificName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Current Phenological Stage *
                  </label>
                  <select
                    value={editingPlot.growthStage}
                    onChange={(e) => setEditingPlot({ ...editingPlot, growthStage: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {selectedCropPreset.stages.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Soil Texture Class *
                  </label>
                  <select
                    value={editingPlot.soilType}
                    onChange={(e) =>
                      setEditingPlot({ ...editingPlot, soilType: e.target.value as any })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Loam">Loam (Optimal water holding)</option>
                    <option value="Clay">Clay (Heavy, high retention)</option>
                    <option value="Sandy">Sandy (High percolation, fast draining)</option>
                    <option value="Silt Loam">Silt Loam</option>
                    <option value="Black Soil">Black Cotton Soil (Vertisol)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Acreage (Acres)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={editingPlot.areaAcres}
                    onChange={(e) =>
                      setEditingPlot({ ...editingPlot, areaAcres: parseFloat(e.target.value) || 1 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Irrigation Method
                  </label>
                  <select
                    value={editingPlot.irrigationSystem}
                    onChange={(e) =>
                      setEditingPlot({ ...editingPlot, irrigationSystem: e.target.value as any })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Drip">Drip Irrigation (90% Efficiency)</option>
                    <option value="Sprinkler">Overhead Sprinkler (75% Efficiency)</option>
                    <option value="Flood">Furrow / Flood (50% Efficiency)</option>
                    <option value="Rainfed">Strictly Rainfed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-md"
                >
                  Save & Activate Field
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
