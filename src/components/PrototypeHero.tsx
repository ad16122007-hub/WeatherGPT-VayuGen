import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Bell,
  Send,
  RefreshCw,
  Volume2,
  Square,
  Sparkles,
  CheckCircle2,
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  Sprout,
  ArrowRight,
} from 'lucide-react';
import { LocationInfo, CurrentWeatherMetrics } from '../types/agritech';
import { askWeatherGPT, askWeatherGPTStream, playAgronomicAudio, stopAgronomicAudio } from '../services/aiService';

interface PrototypeHeroProps {
  location: LocationInfo;
  currentWeather: CurrentWeatherMetrics | null;
  onOpenAskModal: () => void;
  onOpenAlertsModal: () => void;
  onQuickSampleClick?: (text: string) => void;
  language: string;
}

export const PrototypeHero: React.FC<PrototypeHeroProps> = ({
  location,
  currentWeather,
  onOpenAskModal,
  onOpenAlertsModal,
  language,
}) => {
  // Interactive mini-chat inside the hero card
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      role: 'user' | 'assistant';
      text: string;
      source?: string;
      alert?: { title: string; desc: string };
    }>
  >([
    {
      id: 'default-user',
      role: 'user',
      text: 'कल उज्जैन में बारिश होगी क्या?',
    },
    {
      id: 'default-assistant',
      role: 'assistant',
      text: 'कल शाम को हल्की से मध्यम बारिश की संभावना है। तापमान 24° से 34°C रहेगा। छाता साथ रखें और खेत का काम सुबह कर लें।',
      source: 'Source: official forecast data (IMD)',
      alert: {
        title: 'सावधानी: हल्की बारिश',
        desc: 'कटी हुई फसल या खुली खाद को सुरक्षित स्थान पर रखें।',
      },
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat body on new messages or streaming
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const handleSendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || isProcessing) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
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
        crop: 'गेहूं व सोयाबीन',
        stage: 'वेजिटेटिव ग्रोथ',
        soilType: 'काली मध्यम मिट्टी',
      };

      const assistantId = `assistant-${Date.now()}`;
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
        language,
        (_chunk, accumulated) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, text: accumulated } : m))
          );
        }
      );

      // Play voice output immediately
      setIsPlayingAudio(true);
      playAgronomicAudio(
        reply,
        'Kore',
        () => setIsPlayingAudio(true),
        () => setIsPlayingAudio(false)
      );
    } catch (e) {
      console.error('Hero chat error:', e);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: 'माफ़ कीजिये, मौसम डेटा कनेक्ट करने में थोड़ा समय लग रहा है। कृपया पुनः पूछें।',
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
      recognition.lang = language === 'en' ? 'en-IN' : 'hi-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSendMessage(transcript);
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

  // Farmer weather condition helpers
  const tempVal = currentWeather ? Math.round(currentWeather.temp) : 28;
  const rainProb = currentWeather ? Math.round(currentWeather.precipProb) : 20;
  const windVal = currentWeather ? Math.round(currentWeather.windSpeed) : 12;
  const isSpraySafe = windVal < 15 && rainProb < 40;

  return (
    <section className="relative w-full overflow-hidden py-10 sm:py-14 lg:py-18">
      {/* Background Photography with atmospheric overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2200&q=80')`,
        }}
      >
        {/* Dark vignette overlay exactly matching the screenshot style */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/80 to-slate-950/95" />
        <div className="absolute inset-0 bg-radial from-transparent via-slate-950/60 to-slate-950/90" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* 2-Column Responsive Layout: Farmer Guide & Actions on Left, Interactive Chat on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* LEFT COLUMN: Clean Farmer-First Narrative, Quick Weather & Action Buttons */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-5">
            {/* Built for farmers Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-md text-xs text-slate-300 shadow-sm">
              <span className="text-emerald-400">🌱</span>
              <span className="font-medium tracking-wide">
                Built for farmers · किसान भाइयों के लिए
              </span>
            </div>

            {/* Big Editorial Serif Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-normal text-white tracking-tight leading-[1.12]">
              अपनी भाषा में मौसम पूछें। <br />
              <span className="text-[#E5A83B] font-serif">
                Ask in your language, get simple answers.
              </span>
            </h1>

            {/* Simple Farmer Description */}
            <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed font-normal max-w-2xl">
              जटिल चार्ट, मिलीबार और अंग्रेजी रिपोर्ट देखने की जरूरत नहीं है। WeatherGPT सरकारी मौसम विभाग (IMD)
              का डेटा आपकी अपनी भाषा में बोलकर या लिखकर समझाता है—ताकि बारिश, आंधी या लू से आपकी फसल सुरक्षित रहे।
            </p>

            {/* Action Buttons */}
            <div className="pt-1 flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onOpenAskModal}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#E5A83B] hover:bg-[#D99B26] active:scale-95 text-slate-950 font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Mic className="w-4 h-4 fill-slate-950 stroke-slate-950" />
                <span>बोलकर मौसम पूछें · Ask WeatherGPT</span>
              </button>

              <button
                onClick={onOpenAlertsModal}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-slate-900/70 hover:bg-slate-900/95 border border-white/20 active:scale-95 text-white font-medium text-sm flex items-center justify-center gap-2.5 backdrop-blur-sm transition-all cursor-pointer"
              >
                <Bell className="w-4 h-4 text-amber-400" />
                <span>मौसम चेतावनी सेट करें · Set alerts</span>
              </button>
            </div>

            {/* FARMER QUICK LIVE WEATHER STRIP (किसान आज का मौसम दर्शन) */}
            <div className="w-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-md rounded-2xl p-4 sm:p-5 text-white shadow-xl mt-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-slate-200">
                    📍 {location.name.split(',')[0]} के खेत का आज का हाल:
                  </span>
                </div>
                <span className="text-[11px] text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full">
                  लाइव आईएमडी डेटा
                </span>
              </div>

              {/* 4 Farmer Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/40">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                    <span>तापमान</span>
                  </div>
                  <div className="text-base font-bold text-white">{tempVal}°C</div>
                  <div className="text-[10px] text-slate-400">
                    {tempVal > 35 ? 'गर्मी अधिक' : 'सामान्य मौसम'}
                  </div>
                </div>

                <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/40">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                    <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                    <span>बारिश संभावना</span>
                  </div>
                  <div className="text-base font-bold text-white">{rainProb}%</div>
                  <div className="text-[10px] text-slate-400">
                    {rainProb < 30 ? 'बारिश की चिंता नहीं' : 'हल्की फुहार संभव'}
                  </div>
                </div>

                <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/40">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                    <Wind className="w-3.5 h-3.5 text-teal-400" />
                    <span>हवा की गति</span>
                  </div>
                  <div className="text-base font-bold text-white">{windVal} km/h</div>
                  <div className="text-[10px] text-emerald-400 font-medium">
                    {isSpraySafe ? 'छिड़काव के लिए सही' : 'तेज हवा, स्प्रे रोकें'}
                  </div>
                </div>

                <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/40">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                    <Droplets className="w-3.5 h-3.5 text-blue-400" />
                    <span>सिंचाई सलाह</span>
                  </div>
                  <div className="text-base font-bold text-white">उपयुक्त</div>
                  <div className="text-[10px] text-slate-400">शाम में पानी दें</div>
                </div>
              </div>
            </div>

            {/* Quick 1-Tap Questions for Farmers */}
            <div className="w-full pt-1">
              <span className="text-xs font-semibold text-slate-400 block mb-2">
                🌾 किसान भाई सीधे यहां टैप करके भी पूछ सकते हैं:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSendMessage('क्या आज खेत में पानी (सिंचाई) लगा सकते हैं?')}
                  className="text-xs px-3.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition active:scale-95 text-left"
                >
                  💧 क्या आज पानी लगाएं?
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('क्या आज कीटनाशक या खाद का स्प्रे करना सुरक्षित है?')}
                  className="text-xs px-3.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition active:scale-95 text-left"
                >
                  🚜 क्या आज स्प्रे करें?
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('अगले 24 घंटे में बारिश होगी क्या?')}
                  className="text-xs px-3.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition active:scale-95 text-left"
                >
                  🌧️ 24 घंटे में बारिश होगी?
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive In-Hero Working Chat Card */}
          <div className="lg:col-span-5 w-full mt-4 lg:mt-0">
            <div className="bg-[#FAF7EE] rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-700/30 text-left text-slate-900 ring-1 ring-black/10 flex flex-col justify-between">
              {/* Chat Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D2]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-900">WeatherGPT</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                    ⚡ तुरंत उत्तर (Fast Response)
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 bg-[#EFEAD8] px-2.5 py-0.5 rounded-md">
                  {language === 'en' ? 'English' : 'हिन्दी / बहुभाषी'}
                </span>
              </div>

              {/* Chat Messages Body */}
              <div
                ref={chatScrollRef}
                className="py-4 space-y-3.5 min-h-[220px] max-h-[340px] overflow-y-auto pr-1"
              >
                {messages.map((m) => (
                  <div key={m.id} className="space-y-2">
                    {m.role === 'user' ? (
                      <div className="flex justify-end">
                        <div className="bg-[#102A43] text-white text-xs sm:text-[13px] px-4 py-2.5 rounded-2xl rounded-tr-xs max-w-[88%] leading-relaxed font-medium shadow-sm">
                          {m.text}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="bg-white text-slate-900 text-xs sm:text-[13px] p-3.5 rounded-2xl rounded-tl-xs border border-slate-200/80 shadow-xs leading-relaxed space-y-2">
                          <p className="whitespace-pre-line">{m.text}</p>
                          {m.source && (
                            <div className="text-[10px] text-slate-400 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                              <span>{m.source}</span>
                              {isPlayingAudio && (
                                <button
                                  type="button"
                                  onClick={stopAgronomicAudio}
                                  className="text-amber-600 hover:text-amber-700 flex items-center gap-1 font-bold"
                                >
                                  <Square className="w-2.5 h-2.5" /> आवाज रोकें
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Alert Card inside assistant */}
                        {m.alert && (
                          <div className="bg-[#F8E7D8] border border-[#ECD1BA] rounded-xl p-3 text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-[#A74116]">
                              <Bell className="w-3.5 h-3.5" />
                              <span>{m.alert.title}</span>
                            </div>
                            <p className="text-[#87320D] text-[11px] mt-0.5 pl-5 font-medium">
                              {m.alert.desc}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {isProcessing && (
                  <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200/80 text-xs text-slate-500">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C27803]" />
                    <span>सरकारी मौसम डेटा का विश्लेषण हो रहा है...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputQuery);
                }}
                className="pt-2 border-t border-[#E8E2D2] flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="यहाँ लिखें या माइक दबाएं..."
                  className="flex-1 bg-white border border-[#DDD5C0] focus:border-[#C27803] rounded-full px-4 py-2 text-xs sm:text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={startVoiceInput}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition shrink-0 ${
                    isListening
                      ? 'bg-rose-500 text-white animate-bounce'
                      : 'bg-[#A65B17] hover:bg-[#8F4E12] text-white shadow-sm'
                  }`}
                  title="बोलकर पूछें (Tap to speak)"
                >
                  <Mic className="w-4 h-4" />
                </button>

                {inputQuery.trim() && (
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
