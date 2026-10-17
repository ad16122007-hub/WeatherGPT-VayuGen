import React from 'react';
import {
  Sun,
  SunMedium,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudLightning,
  Zap,
  CloudHail,
  Wind,
  Droplets,
  Thermometer,
  ShieldAlert,
  Flame,
  AlertTriangle,
  Bot,
  Activity,
  Layers,
  Sparkles,
  Crosshair,
  MapPin,
} from 'lucide-react';
import { CurrentWeatherMetrics, LocationInfo, UnitSystem, FarmPlot } from '../types/agritech';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface HeroAgriBannerProps {
  current: CurrentWeatherMetrics;
  location: LocationInfo;
  activePlot: FarmPlot;
  units: UnitSystem;
  language: Language;
  onDetectLiveLocation?: () => void;
  isDetectingLocation?: boolean;
  onOpenChatWithPrompt: (prompt: string) => void;
  onOpenSosModal: (threat: string) => void;
}

export const HeroAgriBanner: React.FC<HeroAgriBannerProps> = ({
  current,
  location,
  activePlot,
  units,
  language,
  onDetectLiveLocation,
  isDetectingLocation = false,
  onOpenChatWithPrompt,
  onOpenSosModal,
}) => {
  const t = TRANSLATIONS[language];
  // Unit conversion helpers
  const formatTemp = (celsius: number) => {
    if (units === 'imperial') {
      const f = Math.round((celsius * 9) / 5 + 32);
      return `${f}°F`;
    }
    return `${celsius}°C`;
  };

  const formatRain = (mm: number) => {
    if (units === 'imperial') {
      const inches = (mm * 0.03937).toFixed(2);
      return `${inches} in`;
    }
    return `${mm} mm`;
  };

  const formatWind = (kmh: number) => {
    if (units === 'imperial') {
      const mph = Math.round(kmh * 0.621371);
      return `${mph} mph`;
    }
    return `${kmh} km/h`;
  };

  // Weather Icon mapper
  const renderWeatherIcon = (code: number) => {
    const props = { className: 'w-12 h-12 text-emerald-400 drop-shadow-md' };
    switch (code) {
      case 0:
        return <Sun {...props} className="w-12 h-12 text-amber-400 animate-spin-slow" />;
      case 1:
        return <SunMedium {...props} className="w-12 h-12 text-amber-300" />;
      case 2:
        return <CloudSun {...props} className="w-12 h-12 text-amber-200" />;
      case 3:
        return <Cloud {...props} className="w-12 h-12 text-slate-300" />;
      case 45:
      case 48:
        return <CloudFog {...props} className="w-12 h-12 text-slate-400" />;
      case 51:
      case 53:
      case 55:
        return <CloudDrizzle {...props} className="w-12 h-12 text-teal-300" />;
      case 61:
      case 63:
        return <CloudRain {...props} className="w-12 h-12 text-cyan-400" />;
      case 65:
        return <CloudRainWind {...props} className="w-12 h-12 text-blue-400" />;
      case 71:
      case 73:
      case 75:
        return <CloudSnow {...props} className="w-12 h-12 text-cyan-200" />;
      case 95:
        return <Zap {...props} className="w-12 h-12 text-amber-400 animate-pulse" />;
      case 96:
      case 99:
        return <CloudHail {...props} className="w-12 h-12 text-rose-400" />;
      default:
        return <CloudSun {...props} className="w-12 h-12 text-emerald-400" />;
    }
  };

  // Drift Risk assessment
  const isWindHazard = current.windSpeed > 20 || current.windGusts > 26;
  const isWindMarginal = current.windSpeed > 15 || current.windSpeed < 3;
  const driftRating = isWindHazard ? 'Hazardous' : isWindMarginal ? 'Caution' : 'Safe';
  const driftColor = isWindHazard
    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
    : isWindMarginal
    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

  // Soil moisture rating
  const soilStatus =
    current.soilMoisture0_1cm < 20
      ? 'Dry (Deficit)'
      : current.soilMoisture0_1cm > 38
      ? 'Waterlogged'
      : 'Adequate';
  const soilColor =
    current.soilMoisture0_1cm < 20
      ? 'text-amber-400'
      : current.soilMoisture0_1cm > 38
      ? 'text-blue-400'
      : 'text-emerald-400';

  // Weather hazard alerts
  const hasFrostRisk = current.temp <= 3;
  const hasHeatwaveRisk = current.temp >= 36;
  const hasStormRisk = current.weatherCode >= 80 || current.windGusts > 45;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-emerald-900/40 p-5 lg:p-7 shadow-xl">
      {/* Subtle background glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Emergency Alert Banner if any threshold is tripped */}
      {(hasFrostRisk || hasHeatwaveRisk || hasStormRisk) && (
        <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse flex-shrink-0" />
            <div>
              <span className="font-bold text-sm block">
                {hasFrostRisk
                  ? 'CRITICAL FROST HAZARD DETECTED'
                  : hasHeatwaveRisk
                  ? 'EXTREME CROP HEAT STRESS'
                  : 'SEVERE WEATHER & STORM WARNING'}
              </span>
              <p className="text-xs text-rose-300/90">
                {hasFrostRisk
                  ? `Temperature dropping to ${formatTemp(current.temp)}. Risk of freezing injury to cell membranes.`
                  : hasHeatwaveRisk
                  ? `High heat of ${formatTemp(current.temp)} causing stomatal closure and pollen sterility.`
                  : `Strong gusts of ${formatWind(current.windGusts)} with risk of crop lodging.`}
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              onOpenSosModal(
                hasFrostRisk
                  ? 'Frost & Freeze'
                  : hasHeatwaveRisk
                  ? 'Extreme Heat'
                  : 'Storm & Lodging'
              )
            }
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <ShieldAlert className="w-4 h-4" /> AI Emergency Plan
          </button>
        </div>
      )}

      {/* Main Meteorological Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Location, Current Temperature & Decoded Sky */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-medium text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Agrometeorology
            </span>
            <span>•</span>
            <span>Plot: {activePlot.name}</span>
            <span>•</span>
            <span>{activePlot.crop}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-2">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                {location.name}
              </span>
              {location.admin1 && (
                <span className="text-sm font-normal text-slate-300">({location.admin1})</span>
              )}
              {location.countryCode && (
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {location.countryCode}
                </span>
              )}
            </h1>

            {onDetectLiveLocation && (
              <button
                onClick={onDetectLiveLocation}
                disabled={isDetectingLocation}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition active:scale-95 shadow-sm"
                title={language === 'hi' ? 'अपनी वर्तमान लाइव लोकेशन पुनः प्राप्त करें' : 'Detect my live location'}
              >
                <Crosshair className={`w-3.5 h-3.5 text-emerald-400 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                <span>
                  {isDetectingLocation
                    ? (language === 'hi' ? 'लोकेशन खोजी जा रही है...' : 'Detecting...')
                    : (language === 'hi' ? 'मेरी लाइव लोकेशन लें' : 'My Live Location')}
                </span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Coordinates: {location.lat.toFixed(2)}°N, {location.lon.toFixed(2)}°E {location.elevation ? `• Alt: ${location.elevation}m` : ''}
          </p>

          <div className="mt-4 flex items-center gap-5">
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-inner">
              {renderWeatherIcon(current.weatherCode)}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                  {formatTemp(current.temp)}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Feels {formatTemp(current.apparentTemp)}
                </span>
              </div>
              <p className="text-sm font-semibold text-emerald-300 mt-0.5">
                {current.weatherText}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: 6 Precision AgriTech Metric Cards */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Card 1: Spray Drift Risk */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-emerald-500/30 transition">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-slate-400" /> {t.sprayDrift}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${driftColor}`}>
                {isWindHazard ? t.hazard : isWindMarginal ? t.marginal : t.safe}
              </span>
            </div>
            <div className="text-base font-bold text-white font-mono">
              {formatWind(current.windSpeed)}
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {language === 'hi' ? 'झोंके' : 'Gusts'}: {formatWind(current.windGusts)} • {current.windDirection}°
            </p>
          </div>

          {/* Card 2: 24h Rain Chance */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-emerald-500/30 transition">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" /> {t.rainRisk24h}
              </span>
              <span className="text-[10px] font-bold text-cyan-400">
                {current.precipProb}%
              </span>
            </div>
            <div className="text-base font-bold text-white font-mono">
              {formatRain(current.rainSum24h)}
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {language === 'hi' ? 'उमस' : 'Humidity'}: {current.humidity}% (Dew: {formatTemp(current.dewPoint)})
            </p>
          </div>

          {/* Card 3: Evapotranspiration ET0 */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-emerald-500/30 transition">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> {t.waterLossET0}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">FAO-56</span>
            </div>
            <div className="text-base font-bold text-white font-mono">
              {current.et0} <span className="text-xs font-normal text-slate-400">{language === 'hi' ? 'मिमी/दिन' : 'mm/day'}</span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              VPD: {current.vpd} kPa ({language === 'hi' ? 'वाष्पोत्सर्जन' : 'Transpiration'})
            </p>
          </div>

          {/* Card 4: Topsoil Moisture */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-emerald-500/30 transition">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-500" /> {t.topsoilMoisture}
              </span>
              <span className={`text-[10px] font-bold ${soilColor}`}>
                {current.soilMoisture0_1cm < 20
                  ? t.dryDeficit
                  : current.soilMoisture0_1cm > 38
                  ? t.waterlogged
                  : t.adequate}
              </span>
            </div>
            <div className="text-base font-bold text-white font-mono">
              {current.soilMoisture0_1cm}% <span className="text-xs font-normal text-slate-400">VWC</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, current.soilMoisture0_1cm * 2)}%` }}
              />
            </div>
          </div>

          {/* Card 5: Soil Temperature (6cm) */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-emerald-500/30 transition">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-orange-400" /> {t.soilTemp6cm}
              </span>
              <span className="text-[10px] text-emerald-400">{language === 'hi' ? 'जड़ क्षेत्र' : 'Root Zone'}</span>
            </div>
            <div className="text-base font-bold text-white font-mono">
              {formatTemp(current.soilTemp6cm)}
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {language === 'hi' ? 'सतह' : 'Surface'}: {formatTemp(current.soilTemp0cm)}
            </p>
          </div>

          {/* Card 6: Solar & UV Index */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-emerald-500/30 transition">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-yellow-400" /> {t.sunAndCloud}
              </span>
              <span className="text-[10px] font-mono text-yellow-400">
                UV {current.uvIndex}
              </span>
            </div>
            <div className="text-base font-bold text-white font-mono">
              {100 - current.cloudCover}% <span className="text-xs font-normal text-slate-400">{language === 'hi' ? 'धूप' : 'Sun'}</span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {language === 'hi' ? 'बादल' : 'Cloud cover'}: {current.cloudCover}%
            </p>
          </div>
        </div>
      </div>

      {/* Quick Prompt Suggestions for WeatherGPT */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mr-1">
          <Sparkles className="w-3.5 h-3.5" /> {t.quickAiAsk}
        </span>

        <button
          onClick={() =>
            onOpenChatWithPrompt(
              language === 'hi'
                ? `क्या आज मेरी ${activePlot.crop} की फसल पर कीटनाशक या फफूंदनाशक का छिड़काव (स्प्रे) करना सुरक्षित है? हवा की गति ${current.windSpeed} किमी/घंटा और बारिश की संभावना ${current.precipProb}% है।`
                : `Can I spray pesticide/fungicide today on my ${activePlot.crop}? Wind is ${current.windSpeed} km/h and rain chance is ${current.precipProb}%.`
            )
          }
          className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-emerald-950/60 border border-slate-700 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-emerald-300 transition"
        >
          💨 {language === 'hi' ? 'क्या आज दवा छिड़कना सुरक्षित है?' : 'Is it safe to spray today?'}
        </button>

        <button
          onClick={() =>
            onOpenChatWithPrompt(
              language === 'hi'
                ? `मेरी मिट्टी में नमी ${current.soilMoisture0_1cm}% है और दैनिक वाष्पीकरण ${current.et0} मिमी/दिन है। क्या मेरी ${activePlot.crop} को आज पानी (सिंचाई) देना चाहिए?`
                : `Given my soil moisture is ${current.soilMoisture0_1cm}% and ET0 is ${current.et0} mm/day, how much water should I irrigate for ${activePlot.crop}?`
            )
          }
          className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-emerald-950/60 border border-slate-700 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-emerald-300 transition"
        >
          💧 {language === 'hi' ? 'आज खेत में कितना पानी (सिंचाई) दें?' : 'Calculate irrigation depth (mm)'}
        </button>

        <button
          onClick={() =>
            onOpenChatWithPrompt(
              language === 'hi'
                ? `वर्तमान तापमान ${current.temp}°C और आर्द्रता ${current.humidity}% में मेरी ${activePlot.crop} में किन कीटों या फफूंद जनित रोगों (झुलसा, उकठा, माहू आदि) का खतरा है?`
                : `What fungal diseases or pests are at highest risk under current temp ${current.temp}°C and ${current.humidity}% humidity for ${activePlot.crop}?`
            )
          }
          className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-emerald-950/60 border border-slate-700 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-emerald-300 transition"
        >
          🐛 {language === 'hi' ? 'कीट व बीमारी का कितना खतरा है?' : 'Microclimate pest & disease risk'}
        </button>

        <button
          onClick={() =>
            onOpenChatWithPrompt(
              language === 'hi'
                ? `खेत की मिट्टी का तापमान ${current.soilTemp6cm}°C है। क्या यह मेरी ${activePlot.crop} के लिए और बुआई/जड़ फैलाव के लिए सही है?`
                : `Soil temperature is ${current.soilTemp6cm}°C. Is this optimal for ${activePlot.crop} root development or sowing?`
            )
          }
          className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-emerald-950/60 border border-slate-700 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-emerald-300 transition"
        >
          🌱 {language === 'hi' ? 'मिट्टी का तापमान बुआई के लिए उपयुक्त है?' : 'Soil temperature suitability'}
        </button>
      </div>
    </div>
  );
};
