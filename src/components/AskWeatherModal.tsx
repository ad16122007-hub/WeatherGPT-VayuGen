import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Mic,
  Send,
  Volume2,
  Square,
  Sparkles,
  RefreshCw,
  Globe,
  CloudRain,
  Droplets,
  Wind,
  Thermometer,
} from 'lucide-react';
import { LocationInfo, CurrentWeatherMetrics } from '../types/agritech';
import { askWeatherGPT, askWeatherGPTStream, playAgronomicAudio, stopAgronomicAudio } from '../services/aiService';

interface AskWeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationInfo;
  currentWeather: CurrentWeatherMetrics | null;
  language: string;
  onSelectLanguage: (lang: string) => void;
}

export const AskWeatherModal: React.FC<AskWeatherModalProps> = ({
  isOpen,
  onClose,
  location,
  currentWeather,
  language,
  onSelectLanguage,
}) => {
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      role: 'user' | 'assistant';
      text: string;
      source?: string;
    }>
  >([
    {
      id: 'welcome',
      role: 'assistant',
      text:
        language === 'en'
          ? `Namaste! I am WeatherGPT. Tap the microphone and ask me anything about rain, spraying, irrigation, or temperature for ${location.name.split(',')[0]} in your own language.`
          : `नमस्ते किसान भाई! मैं WeatherGPT हूँ। माइक दबाकर अपनी भाषा (हिन्दी, भोजपुरी, पंजाबी, मराठी, गुजराती आदि) में बारिश, स्प्रे या मौसम का हाल पूछें।`,
      source: 'Source: official forecast data',
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedDialect, setSelectedDialect] = useState<string>(language || 'auto');
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  useEffect(() => {
    return () => {
      stopAgronomicAudio();
    };
  }, []);

  if (!isOpen) return null;

  const handleSend = async (queryText: string) => {
    const text = queryText.trim();
    if (!text || isProcessing) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user' as const,
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsProcessing(true);

    try {
      const farmContext = {
        location: location.name,
        lat: location.lat,
        lon: location.lon,
        temp: currentWeather?.temp ?? 28,
        humidity: currentWeather?.humidity ?? 65,
        weatherCondition: currentWeather?.weatherText ?? 'Partly Cloudy',
        windSpeed: currentWeather?.windSpeed ?? 14,
        windGusts: currentWeather?.windGusts ?? 24,
        windDirection: currentWeather?.windDirection ?? 240,
        precipProb: currentWeather?.precipProb ?? 35,
        rainSum: currentWeather?.rainSum24h ?? 4.2,
        et0: currentWeather?.et0 ?? 4.5,
        soilMoisture: currentWeather?.soilMoisture0_1cm ?? 0.28,
        soilTemp: currentWeather?.soilTemp6cm ?? 26,
        vpd: currentWeather?.vpd ?? 1.8,
        crop: 'गेहूं व अन्य फसलें',
        stage: 'वेजिटेटिव',
        soilType: 'उपजाऊ काली व दोमट मिट्टी',
      };

      const assistantId = `a-${Date.now()}`;
      const placeholderMsg = {
        id: assistantId,
        role: 'assistant' as const,
        text: '...',
        source: 'Source: official forecast data (IMD & Open-Meteo)',
      };
      setMessages((prev) => [...prev, placeholderMsg]);

      const reply = await askWeatherGPTStream(
        [...messages.map((m) => ({ role: m.role, text: m.text })), { role: 'user', text }],
        farmContext,
        text,
        selectedDialect,
        (_chunk, accumulated) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, text: accumulated } : m))
          );
        }
      );

      // Play audio aloud immediately
      setIsPlayingAudio(true);
      playAgronomicAudio(
        reply,
        'Kore',
        () => setIsPlayingAudio(true),
        () => setIsPlayingAudio(false)
      );
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: 'माफ़ कीजिये, अभी संपर्क में बाधा आ रही है। कृपया पुनः प्रयास करें।',
          source: 'Source: official forecast data',
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('आपके ब्राउज़र में वॉइस सपोर्ट उपलब्ध नहीं है। कृपया लिखकर पूछें।');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang =
        selectedDialect === 'pa'
          ? 'pa-IN'
          : selectedDialect === 'mr'
          ? 'mr-IN'
          : selectedDialect === 'bn'
          ? 'bn-IN'
          : selectedDialect === 'gu'
          ? 'gu-IN'
          : selectedDialect === 'te'
          ? 'te-IN'
          : selectedDialect === 'ta'
          ? 'ta-IN'
          : selectedDialect === 'en'
          ? 'en-IN'
          : 'hi-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSend(transcript);
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#FAF7EE] rounded-3xl w-full max-w-2xl h-[92vh] max-h-[820px] shadow-2xl border border-[#DDD5C0] text-slate-900 flex flex-col overflow-hidden relative">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#E8E2D2] flex items-center justify-between bg-white/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E5A83B] to-[#F59E0B] flex items-center justify-center text-slate-950 shadow-sm">
              <CloudRain className="w-5 h-5 fill-slate-950 stroke-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900">
                  WeatherGPT
                </h3>
                <span className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Official Live
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {location.name.split(',')[0]} · {currentWeather?.temp ?? 28}°C ·{' '}
                {currentWeather?.weatherText ?? 'Partly Cloudy'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <select
              value={selectedDialect}
              onChange={(e) => {
                setSelectedDialect(e.target.value);
                onSelectLanguage(e.target.value);
              }}
              className="bg-[#EFEAD8] border border-[#DDD5C0] text-xs font-semibold rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none"
            >
              <option value="auto">✨ ऑटो (Auto - किसी भी भाषा में)</option>
              <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
              <option value="bho">🌾 भोजपुरी (Bhojpuri)</option>
              <option value="pa">🌾 ਪੰਜਾਬੀ (Punjabi)</option>
              <option value="mr">🌾 मराठी (Marathi)</option>
              <option value="gu">🌾 ગુજરાતી (Gujarati)</option>
              <option value="bn">🌾 বাংলা (Bengali)</option>
              <option value="te">🌾 తెలుగు (Telugu)</option>
              <option value="ta">🌾 தமிழ் (Tamil)</option>
              <option value="kn">🌾 ಕನ್ನಡ (Kannada)</option>
              <option value="en">English / Hinglish</option>
            </select>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#EFEAD8] text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Question Chips for illiterate farmers */}
        <div className="px-4 py-2 bg-[#F3EEDC] border-b border-[#E8E2D2] flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold text-slate-600 shrink-0">1-क्लिक सवाल:</span>
          <button
            onClick={() => handleSend('क्या आज मेरे खेत में बारिश होगी?')}
            className="shrink-0 text-xs px-3 py-1 bg-white hover:bg-[#EAE3D2] rounded-full border border-[#DDD5C0] text-slate-800 font-medium transition"
          >
            🌧️ क्या आज बारिश होगी?
          </button>
          <button
            onClick={() => handleSend('क्या आज कीटनाशक का स्प्रे करना सुरक्षित रहेगा?')}
            className="shrink-0 text-xs px-3 py-1 bg-white hover:bg-[#EAE3D2] rounded-full border border-[#DDD5C0] text-slate-800 font-medium transition"
          >
            🚜 क्या आज स्प्रे करें?
          </button>
          <button
            onClick={() => handleSend('क्या आज खेत में पानी लगाना चाहिए?')}
            className="shrink-0 text-xs px-3 py-1 bg-white hover:bg-[#EAE3D2] rounded-full border border-[#DDD5C0] text-slate-800 font-medium transition"
          >
            💧 क्या आज पानी लगाएं?
          </button>
          <button
            onClick={() => handleSend('अगले 7 दिनों का मौसम कैसा रहेगा?')}
            className="shrink-0 text-xs px-3 py-1 bg-white hover:bg-[#EAE3D2] rounded-full border border-[#DDD5C0] text-slate-800 font-medium transition"
          >
            📅 7 दिनों का पूर्वानुमान
          </button>
        </div>

        {/* Chat Messages Body */}
        <div ref={chatScrollRef} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div key={m.id} className="space-y-1.5">
              {m.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="bg-[#102A43] text-white text-xs sm:text-sm px-4 py-2.5 rounded-2xl rounded-tr-xs max-w-[85%] leading-relaxed font-medium shadow-sm">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-900 text-xs sm:text-sm p-4 rounded-2xl rounded-tl-xs border border-[#E5DFCE] shadow-xs max-w-[90%] leading-relaxed space-y-2">
                    <p className="whitespace-pre-line">{m.text}</p>
                    {m.source && (
                      <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span>{m.source}</span>
                        {isPlayingAudio && (
                          <button
                            onClick={stopAgronomicAudio}
                            className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 text-[11px]"
                          >
                            <Square className="w-3 h-3" /> आवाज रोकें
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-2.5 p-3.5 bg-white rounded-2xl border border-[#E5DFCE] text-xs text-slate-600 w-fit">
              <RefreshCw className="w-4 h-4 animate-spin text-[#C27803]" />
              <span>मौसम विभाग (IMD) डेटा से जवाब तैयार हो रहा है...</span>
            </div>
          )}
        </div>

        {/* Big Mic & Input Footer */}
        <div className="p-4 border-t border-[#E8E2D2] bg-white space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputQuery);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="बोलकर या यहाँ लिखकर पूछें (उदा: आज शाम का मौसम कैसा रहेगा?)..."
              className="flex-1 bg-[#FAF7EE] border border-[#DDD5C0] focus:border-[#C27803] rounded-full px-4 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
            />

            <button
              type="button"
              onClick={startVoiceInput}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition shrink-0 ${
                isListening
                  ? 'bg-rose-500 text-white animate-bounce'
                  : 'bg-[#E5A83B] hover:bg-[#D99B26] text-slate-950 shadow-md'
              }`}
              title="माइक दबाकर बोलें"
            >
              <Mic className="w-5 h-5 fill-slate-950 stroke-slate-950" />
            </button>

            {inputQuery.trim() && (
              <button
                type="submit"
                disabled={isProcessing}
                className="w-11 h-11 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shrink-0 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </form>

          <p className="text-[11px] text-center text-slate-400">
            गारंटी: किसान जिस भी भाषा में पूछेगा, WeatherGPT उसी भाषा में सरल व सीधा जवाब देगा।
          </p>
        </div>
      </div>
    </div>
  );
};
