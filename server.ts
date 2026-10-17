import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google Gemini Client with required aistudio-build User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// WeatherGPT System Prompt
const WEATHER_GPT_SYSTEM_PROMPT = `You are WeatherGPT, the world's most advanced AI AgriTech Meteorologist and Farmer Assistant Agronomist.
Your #1 priority is direct, empathetic, and practical assistance to farmers (किसान की सहायता).

CRITICAL SAME-LANGUAGE MANDATORY DIRECTIVE (जिस भाषा में किसान पूछे, उसी भाषा में जवाब दें):
1. **SAME-LANGUAGE MIRRORING (सर्वोच्च प्राथमिकता)**:
   Whichever language, dialect, or script the farmer asks their weather question in, YOU MUST REPLY IN THAT EXACT SAME LANGUAGE AND SCRIPT!
   - If the user asks in Punjabi (ਪੰਜਾਬੀ) -> Reply in authentic, respectful Punjabi in Gurmukhi script (e.g. "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ! ਅੱਜ ਤੁਹਾਡੇ ਖੇਤ ਦਾ ਮੌਸਮ...").
   - If the user asks in Marathi (मराठी) -> Reply in authentic, respectful Marathi (e.g. "नमस्कार शेतकरी बंधूंनो! आज तुमच्या शेतात...").
   - If the user asks in Bengali (বাংলা) -> Reply in authentic, respectful Bengali (e.g. "নমস্কার কৃষক ভাই! আজ আপনার জমিতে...").
   - If the user asks in Gujarati (ગુજરાતી) -> Reply in authentic, respectful Gujarati (e.g. "નમસ્તે ખેડૂત મિત્ર! આજે તમારા ખેતરમાં...").
   - If the user asks in Telugu (తెలుగు) -> Reply in authentic, respectful Telugu (e.g. "నమస్కారం రైతు సోదరులారా! ఈ రోజు మీ పొలంలో...").
   - If the user asks in Tamil (தமிழ்) -> Reply in authentic, respectful Tamil (e.g. "வணக்கம் விவசாய நண்பரே! இன்று உங்கள் நிலத்தில்...").
   - If the user asks in Kannada (ಕನ್ನಡ) -> Reply in authentic, respectful Kannada (e.g. "ನಮಸ್ಕಾರ ರೈತ ಬಾಂಧವರೇ! ಇಂದು ನಿಮ್ಮ ಹೊಲದಲ್ಲಿ...").
   - If the user asks in Malayalam (മലയാളം) -> Reply in authentic, respectful Malayalam (e.g. "നമസ്കാരം കർഷക സുഹൃത്തേ! ಇಂದು ನಿಮ್ಮ வயലിൽ...").
   - If the user asks in Odia (ଓଡ଼ିଆ) -> Reply in authentic, respectful Odia (e.g. "ନମସ୍କାର କୃଷକ ଭାଇ! ଆଜି ଆପଣଙ୍କ ଜମିରେ...").
   - If the user asks in Bhojpuri (भोजपुरी) -> Reply in authentic rural Bhojpuri (e.g. "प्रणाम किसान भाई! राउर खेत खातिर आज...").
   - If the user asks in Haryanvi (हरियाणवी) -> Reply in authentic rural Haryanvi (e.g. "राम-राम किसान भाई! थारे खेत खातर आज...").
   - If the user asks in Hindi (हिन्दी) -> Reply in warm, simple, crystal-clear Hindi (e.g. "नमस्ते / राम-राम किसान भाई! आज आपके खेत में...").
   - If the user asks in English -> Reply in clear, simple agricultural English (e.g. "Hello farmer friend! For your farm today...").
   - If the user writes in Hinglish / Romanized script (e.g., "kya aaj barish hogi kya spray kar sakte hain") -> Reply in simple conversational Hindi / Hinglish that they can easily read and listen to.
   - If the user asks in any other regional tongue (Rajasthani, Marwari, Maithili, Urdu, Assamese) -> Mirror that exact tongue!
   - NEVER force Hindi if the user asked in Punjabi, Marathi, Gujarati, Bengali, Telugu, Tamil, English, etc. Always match the user's language choice.

2. VOICE & AUDIO READABILITY (कम पढ़े-लिखे किसानों के लिए):
   - Keep sentences short, warm, spoken-friendly, and crystal-clear. This response is frequently read aloud via Text-to-Speech to illiterate farmers.
   - Give direct YES/NO verdicts first (e.g. "हाँ, आज आप सिंचाई कर सकते हैं" / "ਨਹੀਂ, ਅੱਜ ਸਪਰੇਅ ਨਾ ਕਰੋ" / "No, avoid spraying today").
   - Avoid complex scientific jargon. Use everyday farming words: खेत, फसल, सिंचाई (पानी देना), छिड़काव (स्प्रे), पाला, लू, इल्ली, फफूंद, खाद।

3. Provide crisp practical action points:
   - आज खेत में क्या करें (What to do today)
   - क्या न करें या क्या टालें (What to postpone)
   - सही समय और मौसम सावधानी (Safety & best window)

4. ULTRA-FAST DIRECT ACTION & BREVITY (तुरंत, सीधा और तेज जवाब):
   - Be concise, punchy, and crystal-clear. Deliver the answer immediately in 2 to 4 crisp sentences.
   - Start directly with the answer verdict in the very first sentence (e.g. "हाँ, आज आप सिंचाई कर सकते हैं..." / "ਨਹੀਂ, ਅੱਜ ਕੀਟਨਾਸ਼ਕ ਸਪਰੇਅ ਨਾ ਕਰੋ..." / "No, avoid spraying today because...").
   - Follow immediately with the 1-2 key weather reasons (wind, rain chance, moisture) and best time window.
   - Avoid long essays, preambles, or repetitive fillers so the farmer receives the answer in milliseconds.

Key domains of expertise:
1. Spray Windows (छिड़काव समय): Wind speed (< 15 km/h ideal), rain wash-off risk, leaf wetness, temperature inversions.
2. Smart Irrigation (स्मार्ट सिंचाई): ET₀ crop water loss, soil moisture depth balance, avoiding waterlogging or drought stress.
3. Pest & Disease Forecasts (कीट व रोग चेतावनी): Fungal pathogens (Late Blight/झुलसा, Powdery Mildew, Rust/गेरुआ) and pests (Aphids/माहू, Armyworms/सूंड़ी).
4. Field Operations (खेत के काम): Tillage (जुताई), Sowing (बुआई), Harvesting (कटाई).
5. Thermal Time & Weather Hazards (मौसम आपदाएं): Frost protection (पाला बचाव), Heat stress (लू बचाव), Hail protection (ओलावृष्टि)।`;

// In-memory instant cache for frequent / repeated farm queries
const chatCache = new Map<string, { reply: string; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute fresh cache per location-query

function buildUserPrompt(
  activeQuery: string,
  farmContext: any,
  requestedLanguage?: string
): { prompt: string; cacheKey: string } {
  let contextSnippet = '';
  if (farmContext) {
    contextSnippet = `\n\n[CURRENT LIVE FARM & METEOROLOGICAL CONTEXT]:
Location: ${farmContext.location || 'Unknown'} (Lat: ${farmContext.lat}, Lon: ${farmContext.lon})
Current Weather: Temp ${farmContext.temp}°C, Humidity ${farmContext.humidity}%, Condition: ${farmContext.weatherCondition}
Wind: ${farmContext.windSpeed} km/h (Gusts: ${farmContext.windGusts} km/h, Dir: ${farmContext.windDirection}°)
Precipitation Probability (next 24h): ${farmContext.precipProb}% (Expected Rain: ${farmContext.rainSum} mm)
Evapotranspiration (ET₀): ${farmContext.et0} mm/day
Soil Moisture (0-7cm): ${farmContext.soilMoisture}% | Soil Temp (0cm): ${farmContext.soilTemp}°C
Vapor Pressure Deficit (VPD): ${farmContext.vpd} kPa
Crop Selected: ${farmContext.crop || 'Mixed/General Crops'} (Growth Stage: ${farmContext.stage || 'Active vegetative'})
Soil Type: ${farmContext.soilType || 'Loam'}
Upcoming 3-Day Forecast: ${farmContext.forecastSummary || 'Partly cloudy, mild conditions'}
`;
  }

  const languageDirective = `\n\n[STRICT LANGUAGE MANDATE]: The farmer's question is: "${activeQuery}". ${
    requestedLanguage && requestedLanguage !== 'auto'
      ? `The farmer specifically selected the language/dialect: "${requestedLanguage}". Reply strictly in ${requestedLanguage}!`
      : `Detect the exact language/dialect of the question ("${activeQuery}"). YOU MUST REPLY IN THAT EXACT SAME LANGUAGE AND SCRIPT! (e.g. Punjabi if in Punjabi, Marathi if in Marathi, Bengali if in Bengali, Gujarati if in Gujarati, Telugu if in Telugu, Tamil if in Tamil, Kannada if in Kannada, Malayalam if in Malayalam, Odia if in Odia, Bhojpuri if in Bhojpuri, Haryanvi if in Haryanvi, English if in English, Hindi if in Hindi). Do not use any other language!`
  }`;

  const prompt = `${contextSnippet}${languageDirective}\nFarmer Question: ${activeQuery}`;
  const cacheKey = `${farmContext?.location || 'loc'}_${requestedLanguage || 'auto'}_${activeQuery.trim().toLowerCase()}`;
  return { prompt, cacheKey };
}

// API: WeatherGPT Conversational Agent (Optimized with ThinkingLevel.LOW for sub-second responses)
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, farmContext, userQuestion, requestedLanguage } = req.body;
    const activeQuery = userQuestion || messages?.[messages.length - 1]?.text || 'Provide agronomic weather advisory.';
    const { prompt: currentPrompt, cacheKey } = buildUserPrompt(activeQuery, farmContext, requestedLanguage);

    // Fast memory cache check
    const cached = chatCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.json({
        reply: cached.reply,
        cached: true,
        timestamp: new Date(cached.timestamp).toISOString(),
      });
    }

    const conversationHistory = (messages || []).map((m: { role: string; text: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        ...conversationHistory.slice(0, -1),
        {
          role: 'user',
          parts: [{ text: currentPrompt }],
        },
      ],
      config: {
        systemInstruction: WEATHER_GPT_SYSTEM_PROMPT,
        temperature: 0.3,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });

    const reply = response.text || 'Unable to generate advisory at this moment.';
    chatCache.set(cacheKey, { reply, timestamp: Date.now() });

    res.json({
      reply,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({
      error: 'Failed to process AgriTech advisory query.',
      details: error.message || String(error),
    });
  }
});

// API: Real-Time Token Streaming (Server-Sent Events) - Instant First-Token Appearance
app.post('/api/chat-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  try {
    const { messages, farmContext, userQuestion, requestedLanguage } = req.body;
    const activeQuery = userQuestion || messages?.[messages.length - 1]?.text || 'Provide agronomic weather advisory.';
    const { prompt: currentPrompt, cacheKey } = buildUserPrompt(activeQuery, farmContext, requestedLanguage);

    // If cached, stream instantly
    const cached = chatCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      res.write(`data: ${JSON.stringify({ text: cached.reply })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const conversationHistory = (messages || []).map((m: { role: string; text: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents: [
        ...conversationHistory.slice(0, -1),
        {
          role: 'user',
          parts: [{ text: currentPrompt }],
        },
      ],
      config: {
        systemInstruction: WEATHER_GPT_SYSTEM_PROMPT,
        temperature: 0.3,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });

    let fullText = '';
    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    if (fullText.trim()) {
      chatCache.set(cacheKey, { reply: fullText, timestamp: Date.now() });
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('Error in /api/chat-stream:', err);
    res.write(`data: ${JSON.stringify({ error: err.message || 'Streaming failed' })}\n\n`);
    res.end();
  }
});

// API: Automated AI Precision Crop & Field Advisory
app.post('/api/advisory', async (req, res) => {
  try {
    const { crop, stage, location, weather } = req.body;

    const prompt = `Perform an in-depth precision agro-meteorological diagnosis for:
Crop: ${crop || 'Wheat'}
Growth Stage: ${stage || 'Vegetative / Tillering'}
Location: ${location || 'Farm Plot'}
Current Meteorological Data:
- Air Temperature: ${weather?.temp}°C (Min: ${weather?.minTemp}°C, Max: ${weather?.maxTemp}°C)
- Relative Humidity: ${weather?.humidity}%
- Dew Point: ${weather?.dewPoint}°C
- Wind Speed: ${weather?.windSpeed} km/h (Gusts: ${weather?.windGusts} km/h)
- 24h Rain Forecast: ${weather?.rainExpected || 0} mm (Chance: ${weather?.rainChance || 0}%)
- Reference Evapotranspiration (ET₀): ${weather?.et0 || 3.5} mm/day
- Topsoil Moisture (0-7cm): ${weather?.soilMoisture || 24}%
- Subsoil Moisture (7-28cm): ${weather?.subsoilMoisture || 28}%
- Soil Temperature (6cm): ${weather?.soilTemp || 19}°C
- Vapor Pressure Deficit (VPD): ${weather?.vpd || 1.1} kPa
- Next 7 Days Rain Total: ${weather?.weekRainTotal || 5} mm

Generate a structured JSON response with strict agronomic recommendations matching this exact structure:
{
  "overallStatus": "Optimal" | "Caution" | "Hazardous",
  "headline": "Short 1-sentence executive summary for the farmer",
  "todayAction": "Top priority action to take in the field right now",
  "sprayAdvisory": {
    "verdict": "Optimal" | "Marginal" | "Unsafe",
    "bestWindow": "e.g. 06:00 AM - 10:00 AM",
    "reasoning": "Detailed wind, drift, humidity, wash-off rationale",
    "driftRiskScore": 1-100
  },
  "irrigationAdvisory": {
    "action": "Hold off" | "Light Irrigation" | "Heavy Irrigation" | "Normal Cycle",
    "recommendedAmountMm": number,
    "timing": "e.g. Late evening or early morning to reduce evaporative loss",
    "soilMoistureDeficit": "explanation of soil water balance vs ET0"
  },
  "diseasePestAlerts": [
    {
      "pathogen": "Name of fungal/pest threat (e.g. Late Blight, Aphids, Rust)",
      "riskLevel": "Low" | "Medium" | "High" | "Critical",
      "trigger": "Why microclimate conditions favor this pathogen",
      "preventiveMeasures": "Recommended preventive action or organic/chemical control"
    }
  ],
  "fieldOperations": {
    "harvestWindow": "Suitable" | "Postpone",
    "sowingWindow": "Favorable" | "Unfavorable",
    "tillageCompactionRisk": "Low" | "Moderate" | "Severe"
  },
  "sevenDayForecastSummary": "Key weather events farmers must prepare for in the coming week."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: WEATHER_GPT_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/advisory:', error);
    res.status(500).json({
      error: 'Failed to generate crop advisory.',
      details: error.message || String(error),
    });
  }
});

// API: Quick AI S.O.S Risk Assessment for Extreme Events (Hail, Frost, Heat wave, Torrential Rain)
app.post('/api/sos-risk', async (req, res) => {
  try {
    const { threatType, crop, currentTemp, minTemp, maxTemp, windGusts, rainExpected } = req.body;

    const prompt = `Urgent Farm Emergency Advisory needed:
Threat: ${threatType || 'Frost / Heat stress'}
Crop: ${crop || 'Crop'}
Temperature Range: ${minTemp}°C to ${maxTemp}°C (Current: ${currentTemp}°C)
Wind Gusts: ${windGusts} km/h
Expected Rain: ${rainExpected} mm

Provide immediate actionable countermeasures a farmer can deploy in the next 6 to 18 hours to protect their crop from yield destruction.
Respond with JSON:
{
  "severity": "Watch" | "Warning" | "Critical Danger",
  "damagePotential": "Description of cellular/canopy/root damage likely",
  "urgentCountermeasures": ["step 1", "step 2", "step 3", "step 4"],
  "postEventRecovery": "What to do after the event passes to save the yield",
  "economicRiskLevel": "Low" | "Moderate" | "Severe"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: WEATHER_GPT_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Error in /api/sos-risk:', error);
    res.status(500).json({ error: 'Failed to process S.O.S alert' });
  }
});

// API: Text-to-Speech (Gemini 3.8 Flash Lite TTS)
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Kore' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    // Clean markdown symbols for natural speech pronunciation
    const cleanedText = text
      .replace(/[*#_`~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .slice(0, 1500); // Keep reasonable length for audio response

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanedText,
              speechMetadata: {
                style: 'Calm, authoritative, friendly agricultural advisor',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('No audio returned by Gemini TTS');
    }

    res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    console.error('Error in /api/tts:', error);
    res.status(500).json({
      error: 'TTS generation failed',
      details: error.message || String(error),
    });
  }
});

// API: One-Click Spoken Local Weather Bulletin for Farmers
app.post('/api/audio-bulletin', async (req, res) => {
  try {
    const {
      dialect = 'hi',
      location,
      temp,
      condition,
      windSpeed,
      rainChance,
      soilMoisture,
      crop,
      voice = 'Kore',
    } = req.body;

    const dialectStyle =
      dialect === 'bho'
        ? 'Speak in authentic, respectful rural Bhojpuri (भोजपुरी). For example: प्रणाम किसान भाई! राउर इलाका में आज मौसम...'
        : dialect === 'hr'
        ? 'Speak in authentic, warm rural Haryanvi (हरियाणवी). For example: राम-राम किसान भाई! आज थारे खेत का मौसम...'
        : dialect === 'pa'
        ? 'Speak in authentic, warm Punjabi (ਪੰਜਾਬੀ). For example: ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ! ਅੱਜ ਤੁਹਾਡੇ ਖੇਤ ਦਾ ਮੌਸਮ...'
        : dialect === 'mr'
        ? 'Speak in authentic, warm Marathi (मराठी). For example: नमस्कार शेतकरी बंधूंनो! आज तुमच्या शेतात हवामान...'
        : dialect === 'bn'
        ? 'Speak in authentic, warm Bengali (বাংলা). For example: নমস্কার কৃষক ভাই! আজ আপনার জমিতে আবহাওয়া...'
        : dialect === 'gu'
        ? 'Speak in authentic, warm Gujarati (ગુજરાતી). For example: નમસ્તે ખેડૂત મિત્ર! આજે તમારા ખેતરમાં હવામાન...'
        : dialect === 'te'
        ? 'Speak in authentic, warm Telugu (తెలుగు). For example: నమస్కారం రైతు సోదరులారా! ఈ రోజు మీ పొలంలో వాతావరణం...'
        : dialect === 'ta'
        ? 'Speak in authentic, warm Tamil (தமிழ்). For example: வணக்கம் விவசாய நண்பரே! இன்று உங்கள் நிலத்தில் வானிலை...'
        : dialect === 'kn'
        ? 'Speak in authentic, warm Kannada (ಕನ್ನಡ). For example: ನಮಸ್ಕಾರ ರೈತ ಬಾಂಧವರೇ! ಇಂದು ನಿಮ್ಮ ಹೊಲದಲ್ಲಿ ಹವಾಮಾನ...'
        : dialect === 'ml'
        ? 'Speak in authentic, warm Malayalam (മലയാളം). For example: നമസ്കാരം കർഷക സുഹൃത്തേ! ഇന്ന് നിങ്ങളുടെ കൃഷിയിടത്തിൽ...'
        : dialect === 'or'
        ? 'Speak in authentic, warm Odia (ଓଡ଼ିଆ). For example: ନମସ୍କାର କୃଷକ ଭାଇ! ଆଜି ଆପଣଙ୍କ ଜମିରେ ପାଣିପାଗ...'
        : dialect === 'en'
        ? 'Speak in clear, simple English for a farmer.'
        : 'Speak in warm, simple rural Hindi (सरल खड़ी हिन्दी). For example: नमस्ते किसान भाई! आज आपके खेत में...';

    const prompt = `You are a trusted rural agronomist speaking to a farmer on a community audio broadcast.
Style: ${dialectStyle}.
Length: Exactly 3 to 4 short, clear spoken sentences (under 60 words).
Location: ${location || 'खेत'}
Crop: ${crop || 'फसल'}
Current Weather: Temp ${temp}°C, Condition: ${condition}, Wind: ${windSpeed} km/h, Rain chance: ${rainChance}%, Soil Moisture: ${soilMoisture}%.
Cover:
1. Warm rural greeting.
2. Today's weather & temperature in simple words.
3. Direct farm advice: whether today is good for spraying (दवा छिड़काव) and watering (सिंचाई).
Return ONLY the spoken text, without markdown, titles, or quotes.`;

    const textResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: WEATHER_GPT_SYSTEM_PROMPT,
        temperature: 0.5,
      },
    });

    const spokenText =
      textResponse.text?.trim() ||
      'नमस्ते किसान भाई! आज आपके खेत का मौसम सामान्य रहेगा। तापमान अनुकूल है और दवा छिड़काव का काम सुबह के समय किया जा सकता है।';

    // Generate Audio via Gemini TTS
    let base64Audio = null;
    try {
      const ttsRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: spokenText.replace(/[*#_`~>]/g, ''),
                speechMetadata: {
                  style: 'Warm, caring, friendly rural farm broadcaster',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
            },
          },
        },
      });
      base64Audio = ttsRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (e) {
      console.warn('TTS generation inside bulletin failed:', e);
    }

    res.json({
      spokenText,
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    console.error('Error in /api/audio-bulletin:', error);
    res.status(500).json({ error: 'Failed to generate audio bulletin' });
  }
});


// API: Audio Transcription (Gemini 3.5 Transcribe)
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: audioBase64,
            },
          },
          {
            text: 'Transcribe this spoken agricultural query accurately in the language it was spoken (English, Hindi, or Hinglish). Return ONLY the transcribed text.',
          },
        ],
      },
    });

    res.json({
      text: response.text?.trim() || '',
    });
  } catch (error: any) {
    console.error('Error in /api/transcribe:', error);
    res.status(500).json({
      error: 'Transcription failed',
      details: error.message || String(error),
    });
  }
});

// API: Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'WeatherGPT AgriTech Weather AI Engine',
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode: attach Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve static build
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌾 WeatherGPT AgriTech AI Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
});
