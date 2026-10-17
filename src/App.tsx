/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  LocationInfo,
  CurrentWeatherMetrics,
  HourlyForecastItem,
  DailyForecastItem,
  FarmPlot,
} from './types/agritech';
import {
  POPULAR_AGRI_REGIONS,
  fetchAgriWeatherData,
  autoDetectUserLocation,
} from './services/weatherService';

import { PrototypeNavbar } from './components/PrototypeNavbar';
import { PrototypeHero } from './components/PrototypeHero';
import { PrototypeProblem } from './components/PrototypeProblem';
import { PrototypeWhatItDoes } from './components/PrototypeWhatItDoes';
import { PrototypeHowItWorks } from './components/PrototypeHowItWorks';
import { PrototypeImpact } from './components/PrototypeImpact';
import { PrototypeCta } from './components/PrototypeCta';
import { PrototypeFooter } from './components/PrototypeFooter';
import { AskWeatherModal } from './components/AskWeatherModal';
import { AlertsSubscriptionModal } from './components/AlertsSubscriptionModal';

// Optional Advanced Radar Section components
import { SprayWindowPlanner } from './components/SprayWindowPlanner';
import { SmartIrrigationMatrix } from './components/SmartIrrigationMatrix';
import { SevenDayAgriForecast } from './components/SevenDayAgriForecast';
import { AgriRadarMap } from './components/AgriRadarMap';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';

const DEFAULT_PLOT: FarmPlot = {
  id: 'plot-ujjain',
  name: 'Farm Plot - Malwa Heartland',
  crop: 'Soybean & Wheat (सोयाबीन व गेहूं)',
  growthStage: 'Vegetative Growth (वानस्पतिक वृद्धि)',
  sowingDate: '2026-11-10',
  soilType: 'Black Soil',
  areaAcres: 12,
  irrigationSystem: 'Drip',
};

export default function App() {
  // Navigation active tab: 'home' | 'ask' | 'alerts'
  const [navTab, setNavTab] = useState<'home' | 'ask' | 'alerts'>('home');

  // Language: 'hi' | 'bho' | 'pa' | 'mr' | 'gu' | 'bn' | 'te' | 'ta' | 'kn' | 'en'
  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem('weathergpt_language') || 'hi';
  });

  // Current Location
  const [currentLocation, setCurrentLocation] = useState<LocationInfo>(() => {
    const saved = localStorage.getItem('weathergpt_location');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    // Ujjain default as in screenshot prompt ("कल उज्जैन में बारिश होगी क्या?")
    return {
      name: 'Ujjain, Madhya Pradesh',
      state: 'Madhya Pradesh',
      lat: 23.1765,
      lon: 75.7885,
    };
  });

  // Weather Metrics
  const [currentWeather, setCurrentWeather] = useState<CurrentWeatherMetrics | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecastItem[]>([]);
  const [dailyForecast, setDailyForecast] = useState<DailyForecastItem[]>([]);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(true);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);

  // Modals
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);

  // Optional Advanced Agri-Radar Toggle
  const [showAdvancedRadar, setShowAdvancedRadar] = useState(false);

  // Load weather data
  const loadWeatherData = useCallback(async () => {
    setIsLoadingWeather(true);
    try {
      const data = await fetchAgriWeatherData(currentLocation.lat, currentLocation.lon);
      setCurrentWeather(data.current);
      setHourlyForecast(data.hourly);
      setDailyForecast(data.daily);
    } catch (err: any) {
      console.warn('Weather fetch error:', err);
    } finally {
      setIsLoadingWeather(false);
    }
  }, [currentLocation]);

  useEffect(() => {
    loadWeatherData();
  }, [loadWeatherData]);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem('weathergpt_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('weathergpt_location', JSON.stringify(currentLocation));
  }, [currentLocation]);

  // Handle GPS location detection
  const handleDetectLiveLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const loc = await autoDetectUserLocation();
      setCurrentLocation(loc);
    } catch (e) {
      console.warn('Live location detection failed:', e);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleSelectTab = (tab: 'home' | 'ask' | 'alerts') => {
    setNavTab(tab);
    if (tab === 'ask') {
      setIsAskModalOpen(true);
    } else if (tab === 'alerts') {
      setIsAlertsModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7EE] text-slate-800 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Prototype Navbar */}
      <PrototypeNavbar
        activeTab={navTab}
        onSelectTab={handleSelectTab}
        currentLanguage={language}
        onSelectLanguage={(l) => setLanguage(l)}
        currentLocation={currentLocation}
        onDetectLocation={handleDetectLiveLocation}
        isDetectingLocation={isDetectingLocation}
      />

      <main className="flex-1">
        {/* Section 1: Hero Banner with In-Hero Working Chat */}
        <PrototypeHero
          location={currentLocation}
          currentWeather={currentWeather}
          onOpenAskModal={() => setIsAskModalOpen(true)}
          onOpenAlertsModal={() => setIsAlertsModalOpen(true)}
          language={language}
        />

        {/* Section 2: THE PROBLEM */}
        <PrototypeProblem />

        {/* Section 3: WHAT IT DOES */}
        <PrototypeWhatItDoes />

        {/* Section 4: HOW IT WORKS */}
        <PrototypeHowItWorks />

        {/* Section 5: IMPACT */}
        <PrototypeImpact />

        {/* Optional Accordion for Detailed Meteorological Radar (For Krishi Vigyan Kendra / Soil data) */}
        <section className="py-8 bg-[#F4EFE2] border-t border-[#E8E2D2]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setShowAdvancedRadar(!showAdvancedRadar)}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 rounded-2xl border border-[#DDD5C0] text-slate-800 font-semibold text-xs sm:text-sm shadow-2xs transition"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-[#C27803]" />
                <span>
                  {showAdvancedRadar
                    ? 'विस्तृत कृषि मौसम विज्ञान एवं मिट्टी नमी चार्ट छुपाएं'
                    : 'विस्तृत कृषि मौसम विज्ञान, मिट्टी नमी व 7-दिवसीय पूर्वानुमान चार्ट देखें (Advanced Agronomic Radar)'}
                </span>
              </div>
              {showAdvancedRadar ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {showAdvancedRadar && currentWeather && (
              <div className="mt-6 space-y-6 animate-in fade-in duration-300">
                <SprayWindowPlanner
                  hourly={hourlyForecast}
                  units="metric"
                  activePlot={DEFAULT_PLOT}
                  onOpenChatWithPrompt={(prompt) => {
                    setIsAskModalOpen(true);
                  }}
                />

                <SmartIrrigationMatrix
                  current={currentWeather}
                  units="metric"
                  activePlot={DEFAULT_PLOT}
                  onOpenChatWithPrompt={(prompt) => {
                    setIsAskModalOpen(true);
                  }}
                />

                <SevenDayAgriForecast
                  daily={dailyForecast}
                  units="metric"
                  activePlot={DEFAULT_PLOT}
                  onOpenChatWithPrompt={(prompt) => {
                    setIsAskModalOpen(true);
                  }}
                />

                <AgriRadarMap
                  location={currentLocation}
                  current={currentWeather}
                  activePlot={DEFAULT_PLOT}
                />
              </div>
            )}
          </div>
        </section>

        {/* Section 6: CTA Section */}
        <PrototypeCta onStartAsking={() => setIsAskModalOpen(true)} />
      </main>

      {/* Footer */}
      <PrototypeFooter />

      {/* Multilingual Voice & Chat Modal */}
      <AskWeatherModal
        isOpen={isAskModalOpen}
        onClose={() => {
          setIsAskModalOpen(false);
          setNavTab('home');
        }}
        location={currentLocation}
        currentWeather={currentWeather}
        language={language}
        onSelectLanguage={(l) => setLanguage(l)}
      />

      {/* Alerts Subscription Modal */}
      <AlertsSubscriptionModal
        isOpen={isAlertsModalOpen}
        onClose={() => {
          setIsAlertsModalOpen(false);
          setNavTab('home');
        }}
        location={currentLocation}
        language={language}
      />
    </div>
  );
}
