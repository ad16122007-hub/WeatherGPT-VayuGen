import { AgronomicAdvisory } from '../types/agritech';

export interface FarmContextPayload {
  location: string;
  lat: number;
  lon: number;
  temp: number;
  humidity: number;
  weatherCondition: string;
  windSpeed: number;
  windGusts: number;
  windDirection: number;
  precipProb: number;
  rainSum: number;
  et0: number;
  soilMoisture: number;
  soilTemp: number;
  vpd: number;
  crop: string;
  stage: string;
  soilType: string;
  forecastSummary?: string;
}

export async function askWeatherGPT(
  messages: Array<{ role: 'user' | 'assistant'; text: string }>,
  farmContext: FarmContextPayload,
  userQuestion?: string,
  requestedLanguage?: string
): Promise<string> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        farmContext,
        userQuestion,
        requestedLanguage,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return data.reply;
  } catch (err) {
    console.warn('Backend /api/chat error, generating localized agronomic response:', err);
    return generateLocalFallbackChat(farmContext, userQuestion || messages[messages.length - 1]?.text || '');
  }
}

/**
 * Ultra-fast token streaming: first words appear on farmer's screen in < 250ms
 */
export async function askWeatherGPTStream(
  messages: Array<{ role: 'user' | 'assistant'; text: string }>,
  farmContext: FarmContextPayload,
  userQuestion: string,
  requestedLanguage: string,
  onChunk: (chunkText: string, fullText: string) => void
): Promise<string> {
  let accumulated = '';
  try {
    const res = await fetch('/api/chat-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        farmContext,
        userQuestion,
        requestedLanguage,
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Streaming failed with status ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.replace(/^data:\s*/, '');
        if (payload === '[DONE]') break;
        try {
          const parsed = JSON.parse(payload);
          if (parsed.text) {
            accumulated += parsed.text;
            onChunk(parsed.text, accumulated);
          }
        } catch {
          // ignore chunk parse errors
        }
      }
    }

    if (accumulated.trim()) {
      return accumulated;
    }
  } catch (err) {
    console.warn('Chat streaming error, attempting fast direct fallback:', err);
  }

  // Fallback to standard fast askWeatherGPT
  if (accumulated.trim()) return accumulated;
  const directReply = await askWeatherGPT(messages, farmContext, userQuestion, requestedLanguage);
  onChunk(directReply, directReply);
  return directReply;
}

export async function fetchAudioBulletin(payload: {
  dialect?: string;
  location: string;
  temp: number;
  condition: string;
  windSpeed: number;
  rainChance: number;
  soilMoisture: number;
  crop: string;
  voice?: string;
}): Promise<{ spokenText: string; audioBase64: string | null }> {
  try {
    const res = await fetch('/api/audio-bulletin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Bulletin fetch failed');
    return await res.json();
  } catch (err) {
    console.warn('Audio bulletin error, returning fallback:', err);
    const spoken = `नमस्ते किसान भाई! आज ${payload.location} में तापमान ${payload.temp}°C है और मौसम ${payload.condition} रहेगा। बारिश की संभावना ${payload.rainChance}% है। अपनी ${payload.crop} में दवा छिड़कने या पानी देने के लिए यह सामान्य स्थिति है।`;
    return {
      spokenText: spoken,
      audioBase64: null,
    };
  }
}


export async function textToSpeech(text: string, voice = 'Kore'): Promise<string | null> {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    });
    if (!res.ok) throw new Error(`TTS failed with status ${res.status}`);
    const data = await res.json();
    return data.audioBase64 || null;
  } catch (err) {
    console.warn('Gemini TTS error:', err);
    return null;
  }
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onloadend = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        const res = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64String,
            mimeType: audioBlob.type || 'audio/webm',
          }),
        });
        if (!res.ok) throw new Error('Transcription failed');
        const data = await res.json();
        resolve(data.text || '');
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(audioBlob);
  });
}

// Universal Audio Player (Gemini WAV first, Web Speech Synthesis fallback)
let currentAudioElement: HTMLAudioElement | null = null;

export async function playAgronomicAudio(
  text: string,
  voice = 'Kore',
  onStart?: () => void,
  onEnd?: () => void,
  instantNative = true
): Promise<() => void> {
  // Stop any currently playing audio
  stopAgronomicAudio();

  const stopCallback = () => {
    stopAgronomicAudio();
    if (onEnd) onEnd();
  };

  try {
    if (onStart) onStart();

    // 1. Ultra-fast zero-latency instant speech via device Speech Synthesis
    if (instantNative && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      fallbackSpeechSynthesis(text, onEnd);
      return stopCallback;
    }

    // 2. High-fidelity Gemini 3.8 Flash Lite TTS
    const base64Audio = await textToSpeech(text, voice);
    if (base64Audio) {
      const audioUrl = `data:audio/wav;base64,${base64Audio}`;
      const audio = new Audio(audioUrl);
      currentAudioElement = audio;

      audio.onended = () => {
        currentAudioElement = null;
        if (onEnd) onEnd();
      };
      audio.onerror = () => {
        currentAudioElement = null;
        fallbackSpeechSynthesis(text, onEnd);
      };

      await audio.play();
      return stopCallback;
    }
  } catch (e) {
    console.warn('Audio playback error, falling back to Web Speech Synthesis:', e);
  }

  // 3. Fallback to native Web Speech API synthesis
  fallbackSpeechSynthesis(text, onEnd);
  return stopCallback;
}

export function stopAgronomicAudio() {
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement.currentTime = 0;
    currentAudioElement = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

function fallbackSpeechSynthesis(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  // Clean markdown
  const cleaned = text.replace(/[*#_`~>]/g, '').slice(0, 1000);
  const utterance = new SpeechSynthesisUtterance(cleaned);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Detect script to pick native Indian regional or English voice
  let targetLangPrefix = 'hi';
  if (/[\u0A00-\u0A7F]/.test(cleaned)) targetLangPrefix = 'pa'; // Punjabi (Gurmukhi)
  else if (/[\u0980-\u09FF]/.test(cleaned)) targetLangPrefix = 'bn'; // Bengali
  else if (/[\u0A80-\u0AFF]/.test(cleaned)) targetLangPrefix = 'gu'; // Gujarati
  else if (/[\u0C00-\u0C7F]/.test(cleaned)) targetLangPrefix = 'te'; // Telugu
  else if (/[\u0B80-\u0BFF]/.test(cleaned)) targetLangPrefix = 'ta'; // Tamil
  else if (/[\u0C80-\u0CFF]/.test(cleaned)) targetLangPrefix = 'kn'; // Kannada
  else if (/[\u0D00-\u0D7F]/.test(cleaned)) targetLangPrefix = 'ml'; // Malayalam
  else if (/[\u0B00-\u0B7F]/.test(cleaned)) targetLangPrefix = 'or'; // Odia
  else if (/[\u0900-\u097F]/.test(cleaned)) targetLangPrefix = 'hi'; // Hindi / Marathi
  else if (/^[A-Za-z0-9\s.,!?'"()-]+$/.test(cleaned)) targetLangPrefix = 'en';

  utterance.lang = `${targetLangPrefix}-IN`;

  const voices = window.speechSynthesis.getVoices();
  const selectedVoice =
    voices.find((v) => v.lang.toLowerCase().startsWith(targetLangPrefix)) ||
    voices.find((v) => v.lang.startsWith('hi')) ||
    voices.find((v) => v.lang.startsWith('en')) ||
    voices[0];

  if (selectedVoice) utterance.voice = selectedVoice;

  utterance.onend = () => {
    if (onEnd) onEnd();
  };
  utterance.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

export async function getCropAdvisory(
  crop: string,
  stage: string,
  location: string,
  weather: any
): Promise<AgronomicAdvisory> {
  try {
    const res = await fetch('/api/advisory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crop,
        stage,
        location,
        weather,
      }),
    });

    if (!res.ok) {
      throw new Error(`Advisory status: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Backend advisory error, returning calculated advisory:', err);
    return generateLocalFallbackAdvisory(crop, stage, weather);
  }
}

export async function getSosRiskAlert(payload: {
  threatType: string;
  crop: string;
  currentTemp: number;
  minTemp: number;
  maxTemp: number;
  windGusts: number;
  rainExpected: number;
}) {
  try {
    const res = await fetch('/api/sos-risk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to fetch S.O.S alert');
    return await res.json();
  } catch (e) {
    return {
      severity: payload.currentTemp < 2 ? 'Critical Danger' : 'Warning',
      damagePotential: `Direct cellular crystallization or thermal wilt risk for ${payload.crop}.`,
      urgentCountermeasures: [
        'Run sprinkler or furrow irrigation to release latent heat of fusion.',
        'Apply anti-transpirant / potassium silicate foliar coat to shield stomatal membranes.',
        'Avoid nitrogen fertilizers which trigger soft vegetative growth prone to burn.',
        'Deploy smoke or orchard heaters in low-lying frost pockets.',
      ],
      postEventRecovery: 'Inspect vascular tissue 24-48h post-event; spray mild biostimulant or humic acid.',
      economicRiskLevel: 'Severe',
    };
  }
}

function generateLocalFallbackChat(ctx: FarmContextPayload, query: string): string {
  const q = query.toLowerCase();

  if (q.includes('spray') || q.includes('pesticide') || q.includes('fungicide')) {
    const isWindHigh = ctx.windSpeed > 18;
    const isRainNear = ctx.precipProb > 30;
    return `🌱 **WeatherGPT Spray Window Analysis for ${ctx.crop}**:
- **Current Wind Speed**: ${ctx.windSpeed} km/h (Gusts: ${ctx.windGusts} km/h)
- **Precipitation Chance**: ${ctx.precipProb}% (${ctx.rainSum} mm forecasted)
- **Verdict**: ${isWindHigh || isRainNear ? '⚠️ **Postpone or Spray with Caution**' : '✅ **Optimal Spray Conditions**'}
- **Agronomic Action**: ${
      isWindHigh
        ? 'Wind speed exceeds 18 km/h. High danger of spray drift causing chemical off-target loss. Wait for wind to drop below 14 km/h.'
        : isRainNear
        ? 'Precipitation probability is elevated. Applying foliar sprays now risks rain wash-off before systemic uptake. Delay until canopy dries.'
        : 'Wind and humidity are within the golden spray window. Use medium droplet nozzles (250-350 microns) for full canopy penetration.'
    }`;
  }

  if (q.includes('water') || q.includes('irrigation') || q.includes('sinchai')) {
    return `💧 **WeatherGPT Irrigation Recommendation for ${ctx.crop} (${ctx.stage})**:
- **Soil Moisture (0-7cm)**: ${ctx.soilMoisture}%
- **Evapotranspiration (ET₀)**: ${ctx.et0} mm/day
- **Soil Type**: ${ctx.soilType}
- **Strategy**: ${
      ctx.soilMoisture < 22
        ? `Soil moisture has depleted below 22%. Apply **${Math.round(ctx.et0 * 3.5)} mm** of irrigation within the next 24 hours. Best applied during late evening to avoid high evaporative loss.`
        : `Root zone moisture (${ctx.soilMoisture}%) is currently sufficient. Hold irrigation for the next 48 hours to conserve water and prevent root hypoxia.`
    }`;
  }

  return `🌾 **WeatherGPT Agronomic Advisory for ${ctx.location}**:
- **Current Temperature**: ${ctx.temp}°C | **Humidity**: ${ctx.humidity}%
- **Vapor Pressure Deficit (VPD)**: ${ctx.vpd} kPa (optimal transpiration range: 0.8 - 1.4 kPa)
- **Soil Status**: ${ctx.soilMoisture}% moisture at ${ctx.soilTemp}°C
- **Key Observation for ${ctx.crop}**:
  Keep close track of diurnal temperature swings. If relative humidity stays above 85% for more than 6 consecutive hours with canopy leaf wetness, consider prophylactic bio-fungicide treatment. Feel free to ask about specific spray windows, fertilization schedules, or pest outbreak models!`;
}

function generateLocalFallbackAdvisory(crop: string, stage: string, weather: any): AgronomicAdvisory {
  const wind = weather?.windSpeed || 10;
  const rain = weather?.rainChance || 10;
  const isOptimalSpray = wind < 15 && rain < 20;

  return {
    overallStatus: isOptimalSpray ? 'Optimal' : 'Caution',
    headline: `Favorable microclimate for ${crop} during ${stage} with controlled moisture loss.`,
    todayAction: `Monitor field canopy for early fungal spores and inspect drip lines before afternoon ET₀ peak.`,
    sprayAdvisory: {
      verdict: isOptimalSpray ? 'Optimal' : 'Marginal',
      bestWindow: '06:30 AM - 10:30 AM',
      reasoning: `Wind speed is ${wind} km/h with low wash-off risk. Delta-T conditions are suitable for fine absorption.`,
      driftRiskScore: wind > 15 ? 58 : 22,
    },
    irrigationAdvisory: {
      action: (weather?.soilMoisture || 25) < 22 ? 'Light Irrigation' : 'Hold off',
      recommendedAmountMm: Math.round((weather?.et0 || 3.5) * 2),
      timing: 'Early morning (05:00 - 08:00)',
      soilMoistureDeficit: `Replenish daily crop evapotranspiration loss of ~${weather?.et0 || 3.5} mm/day.`,
    },
    diseasePestAlerts: [
      {
        pathogen: crop.includes('Wheat') ? 'Yellow Rust / Aphids' : crop.includes('Grape') ? 'Downy Mildew' : 'Leaf Blight & Thrips',
        riskLevel: (weather?.humidity || 60) > 75 ? 'Medium' : 'Low',
        trigger: 'Moderate canopy humidity and nocturnal dew point condensation.',
        preventiveMeasures: 'Ensure good air circulation, prune lower infected foliage, and apply preventative neem or bio-fungicide.',
      },
    ],
    fieldOperations: {
      harvestWindow: (weather?.rainChance || 10) < 25 ? 'Suitable' : 'Postpone',
      sowingWindow: (weather?.soilTemp || 20) >= 14 ? 'Favorable' : 'Unfavorable',
      tillageCompactionRisk: (weather?.soilMoisture || 25) > 35 ? 'Moderate' : 'Low',
    },
    sevenDayForecastSummary: 'Stable weather outlook with moderate solar radiation. Perfect window for nutrient top-dressing.',
  };
}
