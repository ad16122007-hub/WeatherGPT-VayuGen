export type UnitSystem = 'metric' | 'imperial';

export interface LocationInfo {
  name: string;
  admin1?: string;
  country: string;
  countryCode?: string;
  lat: number;
  lon: number;
  elevation?: number;
}

export interface CurrentWeatherMetrics {
  temp: number;
  apparentTemp: number;
  humidity: number;
  dewPoint: number;
  weatherCode: number;
  weatherText: string;
  isDay: boolean;
  windSpeed: number;
  windGusts: number;
  windDirection: number;
  surfacePressure: number;
  cloudCover: number;
  uvIndex: number;
  rainSum24h: number;
  precipProb: number;
  et0: number; // mm/day
  soilMoisture0_1cm: number; // m3/m3 or %
  soilMoisture1_3cm: number;
  soilMoisture3_9cm: number;
  soilMoisture9_27cm: number;
  soilTemp0cm: number;
  soilTemp6cm: number;
  vpd: number; // kPa
}

export interface HourlyForecastItem {
  time: string;
  formattedHour: string;
  temp: number;
  humidity: number;
  precipProb: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  windGusts: number;
  et0: number;
  soilMoisture: number;
  vpd: number;
  sprayCondition: 'optimal' | 'marginal' | 'hazardous';
  sprayReason: string;
}

export interface DailyForecastItem {
  date: string;
  dayName: string;
  minTemp: number;
  maxTemp: number;
  weatherCode: number;
  weatherText: string;
  precipitationSum: number;
  precipProbMax: number;
  windSpeedMax: number;
  windGustsMax: number;
  et0Sum: number;
  gdd: number; // Growing Degree Days
  uvIndexMax: number;
  sprayWindowSummary: string;
  fieldWorkStatus: 'good' | 'caution' | 'delay';
}

export interface AgronomicAdvisory {
  overallStatus: 'Optimal' | 'Caution' | 'Hazardous';
  headline: string;
  todayAction: string;
  sprayAdvisory: {
    verdict: 'Optimal' | 'Marginal' | 'Unsafe';
    bestWindow: string;
    reasoning: string;
    driftRiskScore: number;
  };
  irrigationAdvisory: {
    action: string;
    recommendedAmountMm: number;
    timing: string;
    soilMoistureDeficit: string;
  };
  diseasePestAlerts: Array<{
    pathogen: string;
    riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    trigger: string;
    preventiveMeasures: string;
  }>;
  fieldOperations: {
    harvestWindow: string;
    sowingWindow: string;
    tillageCompactionRisk: string;
  };
  sevenDayForecastSummary: string;
}

export interface FarmPlot {
  id: string;
  name: string;
  crop: string;
  variety?: string;
  growthStage: string;
  sowingDate: string;
  soilType: 'Sandy' | 'Loam' | 'Clay' | 'Silt Loam' | 'Black Soil';
  areaAcres: number;
  irrigationSystem: 'Drip' | 'Sprinkler' | 'Flood' | 'Rainfed';
  notes?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface CropPreset {
  name: string;
  scientificName: string;
  baseTempC: number;
  stages: string[];
  optimalSoilMoisture: string;
  frostSensitive: boolean;
  commonPathogens: string[];
}
