import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Download,
  Trash2,
  Sprout,
  HelpCircle,
  Volume2,
  Mic,
  MicOff,
  Square,
} from 'lucide-react';
import { ChatMessage, LocationInfo, FarmPlot, CurrentWeatherMetrics } from '../types/agritech';
import { askWeatherGPT, playAgronomicAudio, stopAgronomicAudio } from '../services/aiService';

interface WeatherGPTChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationInfo;
  activePlot: FarmPlot;
  currentWeather: CurrentWeatherMetrics;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

export const WeatherGPTChatDrawer: React.FC<WeatherGPTChatDrawerProps> = ({
  isOpen,
  onClose,
  location,
  activePlot,
  currentWeather,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `🌾 **Namaste & Welcome to WeatherGPT!**
I am your dedicated AI Agro-Meteorologist & Precision Agronomist.

I am synced with your active plot **${activePlot.name}** (${activePlot.crop}, ${activePlot.growthStage}) at **${location.name}**.
Current telemetry: **${currentWeather.temp}°C**, **${currentWeather.humidity}% RH**, wind at **${currentWeather.windSpeed} km/h**, and ET₀ of **${currentWeather.et0} mm/day**.

How can I assist your field operations today? Ask me about:
- **Optimal Spray Windows** (fungicides, insecticides, liquid fertilizers)
- **Irrigation Volumes & Timings** (ET₀ water deficit replenishment)
- **Pest & Fungal Outbreak Forecasts**
- **Soil Temperature & Sowing Window Feasibility**
- You can ask in English, Hindi, or Hinglish!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Stop speech when drawer closes
  useEffect(() => {
    if (!isOpen) {
      stopAgronomicAudio();
      setPlayingMessageId(null);
    }
  }, [isOpen]);

  const handleTogglePlayMessage = (id: string, text: string) => {
    if (playingMessageId === id) {
      stopAgronomicAudio();
      setPlayingMessageId(null);
    } else {
      setPlayingMessageId(id);
      playAgronomicAudio(
        text,
        'Kore',
        () => setPlayingMessageId(id),
        () => setPlayingMessageId(null)
      );
    }
  };

  const toggleVoiceDictation = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Safari.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) final += event.results[i][0].transcript;
        }
        if (final) {
          setInputQuery((prev) => (prev ? `${prev} ${final}` : final));
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('Voice dictation error:', e);
      setIsListening(false);
    }
  };

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle triggered initial prompt from quick chips
  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSendPrompt(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt, isOpen]);

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: promptText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const farmContext = {
        location: location.name,
        lat: location.lat,
        lon: location.lon,
        temp: currentWeather.temp,
        humidity: currentWeather.humidity,
        weatherCondition: currentWeather.weatherText,
        windSpeed: currentWeather.windSpeed,
        windGusts: currentWeather.windGusts,
        windDirection: currentWeather.windDirection,
        precipProb: currentWeather.precipProb,
        rainSum: currentWeather.rainSum24h,
        et0: currentWeather.et0,
        soilMoisture: currentWeather.soilMoisture0_1cm,
        soilTemp: currentWeather.soilTemp6cm,
        vpd: currentWeather.vpd,
        crop: activePlot.crop,
        stage: activePlot.growthStage,
        soilType: activePlot.soilType,
      };

      const reply = await askWeatherGPT(
        [...messages, userMsg].map((m) => ({ role: m.role, text: m.text })),
        farmContext,
        promptText.trim()
      );

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: '⚠️ An error occurred while generating advisory. Please verify your connection or try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadChat = () => {
    const reportText = `WeatherGPT Farm Advisory Report\nField: ${activePlot.name} (${activePlot.crop})\nLocation: ${location.name}\nGenerated: ${new Date().toLocaleString()}\n\n` +
      messages.map((m) => `[${m.role.toUpperCase()} - ${m.timestamp}]\n${m.text}\n\n`).join('-----------------------------------\n\n');

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WeatherGPT-Advisory-${activePlot.crop}-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'reset',
        role: 'assistant',
        text: `🌾 Session refreshed for **${activePlot.name}**. Ask me any agricultural meteorology or crop health question!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-xl h-full bg-slate-900 border-l border-emerald-950/80 flex flex-col shadow-2xl relative animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">WeatherGPT AI Agronomist</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Synced with {activePlot.crop} • {location.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownloadChat}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Download Farm Advisory as Text Report"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleClearHistory}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
              title="Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Context Telemetry Strip */}
        <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 overflow-x-auto scrollbar-none">
          <span className="flex-shrink-0">
            🌡️ <strong className="text-white font-mono">{currentWeather.temp}°C</strong>
          </span>
          <span className="flex-shrink-0">
            💧 RH <strong className="text-white font-mono">{currentWeather.humidity}%</strong>
          </span>
          <span className="flex-shrink-0">
            💨 Wind <strong className="text-white font-mono">{currentWeather.windSpeed} km/h</strong>
          </span>
          <span className="flex-shrink-0">
            🌱 Soil <strong className="text-white font-mono">{currentWeather.soilMoisture0_1cm}%</strong>
          </span>
          <span className="flex-shrink-0">
            ☀️ ET₀ <strong className="text-emerald-400 font-mono">{currentWeather.et0} mm</strong>
          </span>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';

            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sprout className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-emerald-600 text-slate-950 font-medium rounded-tr-none'
                      : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  <div className="whitespace-pre-wrap space-y-1">{m.text}</div>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-700/40 text-[10px] text-slate-400">
                    <span>{m.timestamp}</span>
                    {!isUser && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleTogglePlayMessage(m.id, m.text)}
                          className={`hover:text-emerald-300 flex items-center gap-1 transition ${
                            playingMessageId === m.id ? 'text-emerald-400 font-bold' : ''
                          }`}
                          title="Read advisory aloud"
                        >
                          {playingMessageId === m.id ? (
                            <>
                              <Square className="w-3 h-3 text-rose-400" /> Stop
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3" /> Listen
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleCopy(m.id, m.text)}
                          className="hover:text-emerald-300 flex items-center gap-1 transition"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-800/90 border border-slate-700 text-xs text-slate-400 flex items-center gap-2 shadow-md">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>WeatherGPT is analyzing microclimatic variables and agronomic rules...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/60 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
          <button
            onClick={() =>
              handleSendPrompt('Is it safe to spray herbicide or fungicide today given current wind and rain chance?')
            }
            className="flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            💨 Spray suitability today
          </button>
          <button
            onClick={() =>
              handleSendPrompt('How many mm of irrigation is needed for my crop this week to match ET0 loss?')
            }
            className="flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            💧 Weekly irrigation volume
          </button>
          <button
            onClick={() =>
              handleSendPrompt('क्या इस मौसम में कीड़ों या फफूंदी (fungus) का खतरा है? बचाव के उपाय बताएं।')
            }
            className="flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            🇮🇳 कीटनाशक व फफूंद सलाह
          </button>
          <button
            onClick={() =>
              handleSendPrompt('Check frost or heatwave threat for the upcoming 72 hours.')
            }
            className="flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            ❄️ 72h Temperature hazards
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt(inputQuery);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={isListening ? 'Listening to speech...' : 'Ask WeatherGPT anything about your crop, spray timing, or weather...'}
              disabled={isLoading}
              className={`flex-1 bg-slate-900 border rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition ${
                isListening
                  ? 'border-emerald-400 ring-2 ring-emerald-500/40 bg-emerald-950/20'
                  : 'border-slate-800 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500'
              }`}
            />

            {/* Voice Dictation Button */}
            <button
              type="button"
              onClick={toggleVoiceDictation}
              className={`p-2.5 rounded-xl border transition ${
                isListening
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse'
                  : 'bg-slate-900 text-slate-400 hover:text-emerald-400 border-slate-800 hover:border-emerald-500/40'
              }`}
              title={isListening ? 'Stop listening' : 'Dictate with microphone'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 disabled:opacity-50 transition shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
