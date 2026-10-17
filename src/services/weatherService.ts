import {
  LocationInfo,
  CurrentWeatherMetrics,
  HourlyForecastItem,
  DailyForecastItem,
  CropPreset,
} from '../types/agritech';

export const POPULAR_AGRI_REGIONS: LocationInfo[] = [
  {
    name: 'पंजाब (Ludhiana)',
    admin1: 'Punjab',
    country: 'India',
    countryCode: 'IN',
    lat: 30.9010,
    lon: 75.8573,
    elevation: 244,
  },
  {
    name: 'उत्तर प्रदेश (Varanasi / पूर्वांचल)',
    admin1: 'Uttar Pradesh',
    country: 'India',
    countryCode: 'IN',
    lat: 25.3176,
    lon: 82.9739,
    elevation: 81,
  },
  {
    name: 'मध्य प्रदेश (Indore / मालवा)',
    admin1: 'Madhya Pradesh',
    country: 'India',
    countryCode: 'IN',
    lat: 22.7196,
    lon: 75.8577,
    elevation: 553,
  },
  {
    name: 'हरियाणा (Karnal / धान का कटोरा)',
    admin1: 'Haryana',
    country: 'India',
    countryCode: 'IN',
    lat: 29.6857,
    lon: 76.9905,
    elevation: 252,
  },
  {
    name: 'बिहार (Patna / गंगा बेल्ट)',
    admin1: 'Bihar',
    country: 'India',
    countryCode: 'IN',
    lat: 25.5941,
    lon: 85.1376,
    elevation: 53,
  },
  {
    name: 'राजस्थान (Sri Ganganagar / नहरी क्षेत्र)',
    admin1: 'Rajasthan',
    country: 'India',
    countryCode: 'IN',
    lat: 29.9038,
    lon: 73.8772,
    elevation: 178,
  },
  {
    name: 'महाराष्ट्र (Nashik / प्याज व अंगूर बेल्ट)',
    admin1: 'Maharashtra',
    country: 'India',
    countryCode: 'IN',
    lat: 19.9975,
    lon: 73.7898,
    elevation: 600,
  },
  {
    name: 'गुजरात (Rajkot / सौराष्ट्र मूंगफली-कपास)',
    admin1: 'Gujarat',
    country: 'India',
    countryCode: 'IN',
    lat: 22.3039,
    lon: 70.8022,
    elevation: 134,
  },
  {
    name: 'Mato Grosso Grain Hub (Sorriso)',
    admin1: 'Mato Grosso',
    country: 'Brazil',
    countryCode: 'BR',
    lat: -12.5425,
    lon: -55.7114,
    elevation: 365,
  },
  {
    name: 'Salinas Valley (Salad Bowl)',
    admin1: 'California',
    country: 'United States',
    countryCode: 'US',
    lat: 36.6777,
    lon: -121.6555,
    elevation: 16,
  },
  {
    name: 'Bordeaux Vineyards',
    admin1: 'Gironde',
    country: 'France',
    countryCode: 'FR',
    lat: 44.8378,
    lon: -0.5792,
    elevation: 20,
  },
];

export const COMMON_CROPS: CropPreset[] = [
  {
    name: 'Wheat (Winter / Spring)',
    scientificName: 'Triticum aestivum',
    baseTempC: 4.5,
    stages: ['Emergence', 'Tillering', 'Stem Elongation', 'Booting', 'Anthesis / Flowering', 'Milk / Dough', 'Maturity'],
    optimalSoilMoisture: '22% - 32%',
    frostSensitive: false,
    commonPathogens: ['Yellow Rust', 'Leaf Blight', 'Powdery Mildew', 'Fusarium Head Blight', 'Aphids'],
  },
  {
    name: 'Maize / Corn',
    scientificName: 'Zea mays',
    baseTempC: 10.0,
    stages: ['VE Emergence', 'V4 Early Vegetative', 'V8 Rapid Growth', 'VT Tasseling', 'R1 Silking', 'R3 Milk Stage', 'R6 Black Layer'],
    optimalSoilMoisture: '25% - 35%',
    frostSensitive: true,
    commonPathogens: ['Fall Armyworm', 'Northern Corn Leaf Blight', 'Common Rust', 'Stalk Rot'],
  },
  {
    name: 'Paddy / Rice',
    scientificName: 'Oryza sativa',
    baseTempC: 10.0,
    stages: ['Seedling Nursery', 'Tillering', 'Panicle Initiation', 'Booting', 'Flowering / Heading', 'Grain Filling', 'Harvest'],
    optimalSoilMoisture: '35% - 50% (Saturated/Puddled)',
    frostSensitive: true,
    commonPathogens: ['Blast (Magnaporthe oryzae)', 'Brown Spot', 'Bacterial Leaf Blight', 'Sheath Blight', 'Brown Planthopper'],
  },
  {
    name: 'Soybean',
    scientificName: 'Glycine max',
    baseTempC: 10.0,
    stages: ['Emergence', 'First Trifoliolate', 'Bloom (R1-R2)', 'Pod Development (R3-R4)', 'Seed Filling (R5-R6)', 'Maturity (R7-R8)'],
    optimalSoilMoisture: '22% - 30%',
    frostSensitive: true,
    commonPathogens: ['Asian Soybean Rust', 'Frog Eye Leaf Spot', 'Sudden Death Syndrome', 'Pod Borer'],
  },
  {
    name: 'Cotton',
    scientificName: 'Gossypium hirsutum',
    baseTempC: 15.0,
    stages: ['Germination', 'Squaring', 'Flowering / Boll Formation', 'Boll Maturation', 'Defoliation / Open Boll'],
    optimalSoilMoisture: '20% - 28%',
    frostSensitive: true,
    commonPathogens: ['Pink Bollworm', 'Whitefly', 'Verticillium Wilt', 'Alternaria Leaf Spot'],
  },
  {
    name: 'Tomato (Solanaceous)',
    scientificName: 'Solanum lycopersicum',
    baseTempC: 10.0,
    stages: ['Transplanting', 'Vegetative Bushing', 'First Truss Flowering', 'Fruit Set', 'Color Break', 'Ripening'],
    optimalSoilMoisture: '25% - 32%',
    frostSensitive: true,
    commonPathogens: ['Late Blight (Phytophthora)', 'Early Blight', 'Bacterial Canker', 'Leaf Curl Virus', 'Fruit Borer'],
  },
  {
    name: 'Potato',
    scientificName: 'Solanum tuberosum',
    baseTempC: 7.0,
    stages: ['Sprout Development', 'Vegetative Canopy', 'Tuber Initiation', 'Tuber Bulking', 'Maturation / Vine Senescence'],
    optimalSoilMoisture: '26% - 34%',
    frostSensitive: true,
    commonPathogens: ['Late Blight', 'Early Blight', 'Black Scurf', 'Potato Cyst Nematode'],
  },
  {
    name: 'Grapevines / Vineyard',
    scientificName: 'Vitis vinifera',
    baseTempC: 10.0,
    stages: ['Budbreak', 'Shoot Growth', 'Bloom / Flowering', 'Veraison (Berry Softening & Color)', 'Harvest / Ripening', 'Post-Harvest Dormancy'],
    optimalSoilMoisture: '18% - 26%',
    frostSensitive: true,
    commonPathogens: ['Downy Mildew', 'Powdery Mildew (Oidium)', 'Botrytis Bunch Rot', 'Black Rot'],
  },
  {
    name: 'Mustard / Rapeseed',
    scientificName: 'Brassica juncea',
    baseTempC: 5.0,
    stages: ['Seedling', 'Rosette', 'Bolting', 'Flowering', 'Siliqua Pod Formation', 'Maturity'],
    optimalSoilMoisture: '20% - 28%',
    frostSensitive: false,
    commonPathogens: ['White Rust (Albugo candida)', 'Alternaria Blight', 'Mustard Aphid'],
  },
];

// Interpret WMO Weather Code
export function decodeWmoCode(code: number): { text: string; icon: string; category: string } {
  switch (code) {
    case 0:
      return { text: 'Clear Sky / Sunny', icon: 'Sun', category: 'clear' };
    case 1:
      return { text: 'Mainly Clear', icon: 'SunMedium', category: 'clear' };
    case 2:
      return { text: 'Partly Cloudy', icon: 'CloudSun', category: 'cloudy' };
    case 3:
      return { text: 'Overcast Skies', icon: 'Cloud', category: 'cloudy' };
    case 45:
    case 48:
      return { text: 'Fog / Depositing Rime Fog', icon: 'CloudFog', category: 'fog' };
    case 51:
    case 53:
    case 55:
      return { text: 'Drizzle (Light to Dense)', icon: 'CloudDrizzle', category: 'rain' };
    case 61:
      return { text: 'Slight Rain Showers', icon: 'CloudRain', category: 'rain' };
    case 63:
      return { text: 'Moderate Rain', icon: 'CloudRain', category: 'rain' };
    case 65:
      return { text: 'Heavy Rain Deluge', icon: 'CloudRainWind', category: 'heavy-rain' };
    case 71:
    case 73:
    case 75:
      return { text: 'Snow Fall (Light to Heavy)', icon: 'CloudSnow', category: 'snow' };
    case 80:
    case 81:
    case 82:
      return { text: 'Violent Rain Showers', icon: 'CloudLightning', category: 'storm' };
    case 95:
      return { text: 'Thunderstorm', icon: 'Zap', category: 'storm' };
    case 96:
    case 99:
      return { text: 'Severe Thunderstorm & Hail', icon: 'CloudHail', category: 'hail' };
    default:
      return { text: 'Fair Weather', icon: 'Sun', category: 'clear' };
  }
}

// Compute Spray Window Suitability
export function evaluateSprayWindow(
  windSpeed: number,
  windGusts: number,
  precipProb: number,
  precipMm: number,
  temp: number,
  humidity: number
): { status: 'optimal' | 'marginal' | 'hazardous'; reason: string; score: number } {
  if (precipMm > 0.5 || precipProb > 45) {
    return {
      status: 'hazardous',
      reason: 'Rain imminent: Chemical wash-off will nullify efficacy and contaminate runoff.',
      score: 15,
    };
  }
  if (windSpeed > 20 || windGusts > 26) {
    return {
      status: 'hazardous',
      reason: 'Excessive wind: severe spray drift risk to adjacent fields and non-target crops.',
      score: 20,
    };
  }
  if (temp > 32) {
    return {
      status: 'hazardous',
      reason: 'High heat: droplets rapidly evaporate before leaf absorption; risk of crop burn.',
      score: 30,
    };
  }
  if (windSpeed < 3.5 && temp < 14) {
    return {
      status: 'marginal',
      reason: 'Possible thermal inversion: fine spray droplets may stay suspended in stagnant air.',
      score: 55,
    };
  }
  if (windSpeed > 15 || temp > 28 || precipProb > 25 || humidity > 88) {
    return {
      status: 'marginal',
      reason: 'Moderate drift potential or high humidity slowing droplet dry time. Use coarse nozzles.',
      score: 65,
    };
  }
  return {
    status: 'optimal',
    reason: 'Prime spray window: steady 5-14 km/h breeze, no rain threat, moderate temperature.',
    score: 95,
  };
}

// Fetch live weather data from Open-Meteo
export async function fetchAgriWeatherData(lat: number, lon: number): Promise<{
  current: CurrentWeatherMetrics;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
}> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,surface_pressure,cloud_cover,evapotranspiration,et0_fao_evapotranspiration,vapour_pressure_deficit,wind_speed_10m,wind_gusts_10m,wind_direction_10m,soil_temperature_0cm,soil_temperature_6cm,soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm,soil_moisture_9_to_27cm,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,et0_fao_evapotranspiration&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo API returned status ${res.status}`);
  }

  const data = await res.json();
  const c = data.current;
  const h = data.hourly;
  const d = data.daily;

  // Find index for current hour
  const now = new Date();
  const nowISO = now.toISOString().slice(0, 13);
  let currentHourIdx = 0;
  if (h && h.time) {
    const idx = h.time.findIndex((t: string) => t.startsWith(nowISO));
    if (idx !== -1) currentHourIdx = idx;
  }

  const weatherDecoded = decodeWmoCode(c.weather_code ?? 0);

  // Convert m3/m3 soil moisture to volumetric percentage (0.28 -> 28%)
  const toPct = (val?: number) => (val !== undefined ? Math.round(val * 100) : 25);

  const currentMetrics: CurrentWeatherMetrics = {
    temp: Math.round(c.temperature_2m * 10) / 10,
    apparentTemp: Math.round(c.apparent_temperature * 10) / 10,
    humidity: Math.round(c.relative_humidity_2m),
    dewPoint: Math.round(c.dew_point_2m * 10) / 10,
    weatherCode: c.weather_code,
    weatherText: weatherDecoded.text,
    isDay: Boolean(c.is_day),
    windSpeed: Math.round(c.wind_speed_10m * 10) / 10,
    windGusts: Math.round((c.wind_gusts_10m || c.wind_speed_10m * 1.3) * 10) / 10,
    windDirection: Math.round(c.wind_direction_10m),
    surfacePressure: Math.round(c.surface_pressure),
    cloudCover: Math.round(c.cloud_cover),
    uvIndex: Math.round((h?.uv_index?.[currentHourIdx] ?? 4) * 10) / 10,
    rainSum24h: Math.round((d?.precipitation_sum?.[0] ?? 0) * 10) / 10,
    precipProb: Math.round(h?.precipitation_probability?.[currentHourIdx] ?? 10),
    et0: Math.round(((d?.et0_fao_evapotranspiration?.[0] ?? (h?.et0_fao_evapotranspiration?.[currentHourIdx] != null ? h.et0_fao_evapotranspiration[currentHourIdx] * 24 : 3.8))) * 10) / 10,
    soilMoisture0_1cm: toPct(h?.soil_moisture_0_to_1cm?.[currentHourIdx]),
    soilMoisture1_3cm: toPct(h?.soil_moisture_1_to_3cm?.[currentHourIdx]),
    soilMoisture3_9cm: toPct(h?.soil_moisture_3_to_9cm?.[currentHourIdx]),
    soilMoisture9_27cm: toPct(h?.soil_moisture_9_to_27cm?.[currentHourIdx]),
    soilTemp0cm: Math.round((h?.soil_temperature_0cm?.[currentHourIdx] ?? c.temperature_2m) * 10) / 10,
    soilTemp6cm: Math.round((h?.soil_temperature_6cm?.[currentHourIdx] ?? c.temperature_2m - 1) * 10) / 10,
    vpd: Math.round((h?.vapour_pressure_deficit?.[currentHourIdx] ?? 1.2) * 100) / 100,
  };

  // Build next 24-36 hourly records
  const hourlyItems: HourlyForecastItem[] = [];
  const maxHours = Math.min(36, (h?.time?.length || 0) - currentHourIdx);

  for (let i = 0; i < maxHours; i++) {
    const idx = currentHourIdx + i;
    const timeStr = h.time[idx];
    const dateObj = new Date(timeStr);
    const hourNum = dateObj.getHours();
    const formattedHour = hourNum === 0 ? '12 AM' : hourNum < 12 ? `${hourNum} AM` : hourNum === 12 ? '12 PM' : `${hourNum - 12} PM`;

    const wSpeed = Math.round(h.wind_speed_10m[idx] * 10) / 10;
    const wGust = Math.round(h.wind_gusts_10m[idx] * 10) / 10;
    const pProb = h.precipitation_probability[idx] ?? 0;
    const pMm = h.precipitation[idx] ?? 0;
    const t = Math.round(h.temperature_2m[idx] * 10) / 10;
    const rh = Math.round(h.relative_humidity_2m[idx]);

    const sprayEval = evaluateSprayWindow(wSpeed, wGust, pProb, pMm, t, rh);

    hourlyItems.push({
      time: timeStr,
      formattedHour,
      temp: t,
      humidity: rh,
      precipProb: pProb,
      precipitation: Math.round(pMm * 10) / 10,
      weatherCode: h.weather_code[idx],
      windSpeed: wSpeed,
      windGusts: wGust,
      et0: Math.round((h.et0_fao_evapotranspiration?.[idx] ?? 0.2) * 100) / 100,
      soilMoisture: toPct(h.soil_moisture_0_to_1cm?.[idx]),
      vpd: Math.round((h.vapour_pressure_deficit?.[idx] ?? 1.0) * 100) / 100,
      sprayCondition: sprayEval.status,
      sprayReason: sprayEval.reason,
    });
  }

  // Build 7-day forecast
  const dailyItems: DailyForecastItem[] = [];
  const daysCount = Math.min(7, d?.time?.length || 0);

  for (let i = 0; i < daysCount; i++) {
    const dateStr = d.time[i];
    const dateObj = new Date(dateStr);
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });

    const minT = Math.round(d.temperature_2m_min[i] * 10) / 10;
    const maxT = Math.round(d.temperature_2m_max[i] * 10) / 10;
    const wCode = d.weather_code[i];
    const precipSum = Math.round((d.precipitation_sum[i] ?? 0) * 10) / 10;
    const precipProb = Math.round(d.precipitation_probability_max[i] ?? 0);
    const windMax = Math.round(d.wind_speed_10m_max[i] * 10) / 10;
    const gustMax = Math.round(d.wind_gusts_10m_max[i] * 10) / 10;
    const et0Sum = Math.round((d.et0_fao_evapotranspiration?.[i] ?? 3.5) * 10) / 10;

    // GDD Base 10C standard
    const meanT = (minT + maxT) / 2;
    const gdd = Math.max(0, Math.round((meanT - 10) * 10) / 10);

    let fieldStatus: 'good' | 'caution' | 'delay' = 'good';
    let spraySummary = 'Favorable morning window';

    if (precipSum > 6 || precipProb > 65) {
      fieldStatus = 'delay';
      spraySummary = 'Rain & wet canopy: Spray delayed';
    } else if (windMax > 22 || precipSum > 2) {
      fieldStatus = 'caution';
      spraySummary = 'Gusty winds: Early dawn only';
    }

    dailyItems.push({
      date: dateStr,
      dayName,
      minTemp: minT,
      maxTemp: maxT,
      weatherCode: wCode,
      weatherText: decodeWmoCode(wCode).text,
      precipitationSum: precipSum,
      precipProbMax: precipProb,
      windSpeedMax: windMax,
      windGustsMax: gustMax,
      et0Sum,
      gdd,
      uvIndexMax: Math.round(d.uv_index_max?.[i] ?? 5),
      sprayWindowSummary: spraySummary,
      fieldWorkStatus: fieldStatus,
    });
  }

  return {
    current: currentMetrics,
    hourly: hourlyItems,
    daily: dailyItems,
  };
}

// Search locations via Open-Meteo Geocoding API
export async function searchLocations(query: string): Promise<LocationInfo[]> {
  if (!query || query.trim().length < 2) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=6&language=en&format=json`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.results || !Array.isArray(data.results)) return [];

  return data.results.map((r: any) => ({
    name: r.name,
    admin1: r.admin1,
    country: r.country,
    countryCode: r.country_code,
    lat: r.latitude,
    lon: r.longitude,
    elevation: r.elevation,
  }));
}

// Reverse geocoding to resolve Village / Town / District name from coordinates
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<{ name: string; admin1?: string; country: string; countryCode?: string }> {
  try {
    // 1. Try BigDataCloud free client-side reverse geocode
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    if (res.ok) {
      const data = await res.json();
      const locality =
        data.locality ||
        data.city ||
        data.principalSubdivisionCity ||
        data.localityInfo?.administrative?.[3]?.name;
      const admin1 = data.principalSubdivision;
      const country = data.countryName;
      const countryCode = data.countryCode;

      if (locality || admin1) {
        return {
          name: locality || admin1 || 'Local Farm Field',
          admin1: admin1 !== locality ? admin1 : undefined,
          country: country || 'Local',
          countryCode: countryCode,
        };
      }
    }
  } catch (e) {
    console.warn('BigDataCloud reverse geocode error:', e);
  }

  // 2. OpenStreetMap Nominatim fallback
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const name =
        addr.village || addr.town || addr.city || addr.suburb || addr.county || 'Local Farm Field';
      const admin1 = addr.state;
      const country = addr.country || 'Local';
      const countryCode = (addr.country_code || '').toUpperCase();
      return { name, admin1, country, countryCode };
    }
  } catch (e) {
    console.warn('Nominatim fallback error:', e);
  }

  return {
    name: 'My Farm Location',
    admin1: `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`,
    country: 'Local',
  };
}

// Auto-detect user's current location seamlessly (GPS first, then IP geolocation fallback)
export async function autoDetectUserLocation(): Promise<LocationInfo> {
  // 1. Try HTML5 Geolocation (GPS)
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 6000,
          enableHighAccuracy: true,
          maximumAge: 60000,
        });
      });

      const lat = Number(pos.coords.latitude.toFixed(4));
      const lon = Number(pos.coords.longitude.toFixed(4));
      const place = await reverseGeocode(lat, lon);

      return {
        name: place.name,
        admin1: place.admin1,
        country: place.country,
        countryCode: place.countryCode,
        lat,
        lon,
      };
    } catch (gpsError) {
      console.warn('GPS detection failed or timed out, trying IP Geolocation:', gpsError);
    }
  }

  // 2. IP Geolocation seamless fallback (instant without permission prompt)
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      if (data.latitude && data.longitude) {
        return {
          name: data.city || data.region || 'Local Region',
          admin1: data.region,
          country: data.country_name || 'India',
          countryCode: data.country_code || 'IN',
          lat: Number(data.latitude),
          lon: Number(data.longitude),
        };
      }
    }
  } catch (e) {
    console.warn('ipapi.co fallback failed, trying ipwho.is:', e);
  }

  try {
    const res = await fetch('https://ipwho.is/');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.latitude && data.longitude) {
        return {
          name: data.city || data.region || 'Local Region',
          admin1: data.region,
          country: data.country || 'India',
          countryCode: data.country_code || 'IN',
          lat: Number(data.latitude),
          lon: Number(data.longitude),
        };
      }
    }
  } catch (e) {
    console.warn('ipwho.is fallback failed:', e);
  }

  // 3. Fallback to default
  return POPULAR_AGRI_REGIONS[0];
}

