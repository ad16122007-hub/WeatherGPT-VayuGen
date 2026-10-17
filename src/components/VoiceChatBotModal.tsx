import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Bot,
  Sparkles,
  RefreshCw,
  Play,
  Square,
  HelpCircle,
  Radio,
  Sliders,
  Languages,
  Send,
} from 'lucide-react';
import { LocationInfo, FarmPlot, CurrentWeatherMetrics } from '../types/agritech';
import { Language } from '../i18n/translations';
import { askWeatherGPT, askWeatherGPTStream, playAgronomicAudio, stopAgronomicAudio } from '../services/aiService';

interface VoiceChatBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationInfo;
  activePlot: FarmPlot;
  currentWeather: CurrentWeatherMetrics;
  appLanguage?: Language;
}

type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking';

export const VoiceChatBotModal: React.FC<VoiceChatBotModalProps> = ({
  isOpen,
  onClose,
  location,
  activePlot,
  currentWeather,
  appLanguage = 'hi',
}) => {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string>(
    appLanguage === 'hi'
      ? `नमस्ते किसान भाई! मैं आपका WeatherGPT वॉइस सलाहकार हूँ। माइक का बटन दबाएं और अपनी ${activePlot.crop} की फसल या मौसम के बारे में अपनी भाषा में पूछें।`
      : `Namaste! I am your WeatherGPT Voice Agronomist. Tap the microphone and ask me anything about your ${activePlot.crop} at ${location.name}.`
  );
  const [language, setLanguage] = useState<string>(
    appLanguage === 'hi' ? 'hi-IN' : 'en-IN'
  );
  const [selectedVoice, setSelectedVoice] = useState<'Kore' | 'Zephyr' | 'Puck'>('Kore');
  const [handsFree, setHandsFree] = useState<boolean>(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean>(true);
  const [typedQuery, setTypedQuery] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const isComponentMounted = useRef<boolean>(true);

  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
      stopAgronomicAudio();
      stopListening();
    };
  }, []);

  // Initialize Speech Recognition if supported
  const setupSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not available in this browser');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === 'auto' ? 'hi-IN' : language;

    recognition.onstart = () => {
      setStatus('listening');
      setInterimTranscript('');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (interim) setInterimTranscript(interim);
      if (final) {
        setTranscript(final);
        setInterimTranscript('');
        handleQuerySubmit(final);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setMicPermissionGranted(false);
      }
      setStatus('idle');
    };

    recognition.onend = () => {
      if (status === 'listening') {
        setStatus('idle');
      }
    };

    return recognition;
  };

  const startListening = () => {
    stopAgronomicAudio();

    try {
      const recognition = setupSpeechRecognition();
      if (!recognition) {
        alert(
          'Your browser does not support Web Speech Recognition. You can still type queries or use voice on Chrome / Safari.'
        );
        return;
      }
      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setStatus('idle');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setStatus('idle');
  };

  const handleQuerySubmit = async (queryText: string) => {
    if (!queryText.trim()) return;

    stopListening();
    setStatus('processing');

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

      setAiResponse('...');
      const reply = await askWeatherGPTStream(
        [{ role: 'user', text: queryText }],
        farmContext,
        queryText,
        language,
        (_chunk, accumulated) => {
          setAiResponse(accumulated);
        }
      );

      setAiResponse(reply);

      // Play audio response aloud
      setStatus('speaking');
      await playAgronomicAudio(
        reply,
        selectedVoice,
        () => setStatus('speaking'),
        () => {
          if (isComponentMounted.current) {
            setStatus('idle');
            // If hands-free mode is on, automatically start listening again!
            if (handsFree) {
              setTimeout(() => {
                if (isComponentMounted.current) startListening();
              }, 1200);
            }
          }
        }
      );
    } catch (err) {
      console.error('Error in voice query submit:', err);
      setAiResponse('Sorry, I encountered an issue analyzing that. Please tap the mic and try again.');
      setStatus('idle');
    }
  };

  const handleStopAudio = () => {
    stopAgronomicAudio();
    setStatus('idle');
  };

  const handleReplayAudio = () => {
    if (!aiResponse) return;
    setStatus('speaking');
    playAgronomicAudio(
      aiResponse,
      selectedVoice,
      () => setStatus('speaking'),
      () => setStatus('idle')
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-emerald-950/90 rounded-3xl p-6 sm:p-8 shadow-2xl relative flex flex-col items-center text-center overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-32 -left-32 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-72 h-72 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

        {/* Top bar */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              WeatherGPT Voice Assistant
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Hands-Free Toggle */}
            <button
              onClick={() => setHandsFree(!handsFree)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                handsFree
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Hands-free field mode: automatically listens for your next question after speaking"
            >
              <Radio className="w-3.5 h-3.5" /> Hands-Free: {handsFree ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={() => {
                stopAgronomicAudio();
                stopListening();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Voice Animation Visualizer */}
        <div className="my-6 relative flex items-center justify-center">
          {/* Animated Ripples */}
          {status === 'listening' && (
            <>
              <div className="absolute w-44 h-44 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="absolute w-36 h-36 rounded-full bg-emerald-500/30 animate-pulse" />
            </>
          )}

          {status === 'speaking' && (
            <>
              <div className="absolute w-44 h-44 rounded-full bg-teal-500/20 animate-pulse" />
              <div className="absolute w-36 h-36 rounded-full bg-cyan-500/30 animate-ping duration-1000" />
            </>
          )}

          {status === 'processing' && (
            <div className="absolute w-40 h-40 rounded-full border-2 border-emerald-500/40 border-t-emerald-400 animate-spin" />
          )}

          {/* Core Mic Button */}
          <button
            onClick={() => {
              if (status === 'listening') {
                stopListening();
              } else if (status === 'speaking') {
                handleStopAudio();
              } else {
                startListening();
              }
            }}
            className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl relative z-10 ${
              status === 'listening'
                ? 'bg-gradient-to-tr from-emerald-500 to-emerald-400 text-slate-950 scale-110 shadow-emerald-500/40'
                : status === 'speaking'
                ? 'bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 scale-105 shadow-teal-500/40'
                : status === 'processing'
                ? 'bg-slate-800 text-emerald-400'
                : 'bg-gradient-to-tr from-slate-800 to-slate-700 hover:from-emerald-600 hover:to-teal-500 text-white hover:text-slate-950 hover:scale-105 shadow-black/50 ring-2 ring-emerald-500/40'
            }`}
          >
            {status === 'listening' ? (
              <>
                <Mic className="w-10 h-10 animate-bounce" />
                <span className="text-[10px] font-black uppercase mt-1">Listening</span>
              </>
            ) : status === 'speaking' ? (
              <>
                <Volume2 className="w-10 h-10 animate-pulse" />
                <span className="text-[10px] font-black uppercase mt-1">Speaking</span>
              </>
            ) : status === 'processing' ? (
              <>
                <RefreshCw className="w-9 h-9 animate-spin text-emerald-400" />
                <span className="text-[10px] font-bold text-slate-400 mt-1">Thinking</span>
              </>
            ) : (
              <>
                <Mic className="w-10 h-10" />
                <span className="text-[10px] font-extrabold uppercase mt-1">Tap to Speak</span>
              </>
            )}
          </button>
        </div>

        {/* Status Text Indicator */}
        <p className="text-xs font-semibold mb-2 tracking-wide text-slate-400">
          {status === 'listening'
            ? '🎙️ Listening to your field question...'
            : status === 'processing'
            ? '🤖 WeatherGPT is analyzing meteorological parameters & crop science...'
            : status === 'speaking'
            ? '🔊 WeatherGPT is speaking the advisory aloud...'
            : 'Tap the mic to ask any crop, spray, or weather question'}
        </p>

        {/* Live Speech Captions / Transcription */}
        {(transcript || interimTranscript) && (
          <div className="w-full p-3 rounded-2xl bg-slate-950/70 border border-slate-800 mb-3 text-left">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">
              You Said:
            </span>
            <p className="text-xs text-white">
              {transcript} <span className="text-emerald-400 italic">{interimTranscript}</span>
            </p>
          </div>
        )}

        {/* AI Audio Response Card */}
        <div className="w-full p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-left max-h-48 overflow-y-auto mb-4 relative group">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Bot className="w-3.5 h-3.5" /> WeatherGPT Response:
            </span>
            <div className="flex items-center gap-1">
              {status === 'speaking' ? (
                <button
                  onClick={handleStopAudio}
                  className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
                >
                  <Square className="w-3 h-3" /> Stop
                </button>
              ) : (
                <button
                  onClick={handleReplayAudio}
                  className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Play className="w-3 h-3" /> Listen
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
            {aiResponse}
          </p>
        </div>

        {/* Text Input Form (Type or Speak) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (typedQuery.trim()) {
              handleQuerySubmit(typedQuery);
              setTypedQuery('');
            }
          }}
          className="w-full flex items-center gap-2 mb-3"
        >
          <input
            type="text"
            value={typedQuery}
            onChange={(e) => setTypedQuery(e.target.value)}
            placeholder="या यहाँ लिखकर पूछें (उदा: आज बारिश होगी क्या?)..."
            className="flex-1 bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!typedQuery.trim() || status === 'processing'}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>पूछें</span>
          </button>
        </form>

        {/* Voice Prompts to Try */}
        <div className="w-full">
          <span className="text-[11px] text-slate-400 font-semibold block mb-2 text-left">
            1-क्लिक सवाल (बिना लिखे पूछें व सुनें):
          </span>
          <div className="flex flex-wrap gap-1.5 justify-start">
            <button
              onClick={() => handleQuerySubmit('क्या आज मेरी फसल पर कीटनाशक का छिड़काव सही रहेगा?')}
              className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-emerald-950/60 border border-slate-700 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 transition"
            >
              🚜 क्या आज स्प्रे करें?
            </button>
            <button
              onClick={() => handleQuerySubmit('क्या आज मेरे खेत में बारिश होगी?')}
              className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-emerald-950/60 border border-slate-700 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 transition"
            >
              🌧️ क्या आज बारिश होगी?
            </button>
            <button
              onClick={() => handleQuerySubmit('मेरी मिट्टी की नमी देखते हुए क्या आज खेत में पानी लगाना चाहिए?')}
              className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-emerald-950/60 border border-slate-700 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 transition"
            >
              💧 क्या आज सिंचाई लगाएं?
            </button>
            <button
              onClick={() => handleQuerySubmit('आज और कल का पूरा मौसम कैसा रहेगा?')}
              className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-emerald-950/60 border border-slate-700 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 transition"
            >
              🌡️ आज और कल का मौसम
            </button>
          </div>
        </div>

        {/* Footer Settings (Language & Voice) */}
        <div className="w-full mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Languages className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
            >
              <option value="auto">✨ Auto (जिस भाषा में पूछेंगे, उसी में जवाब)</option>
              <option value="hi-IN">🇮🇳 हिन्दी (Hindi)</option>
              <option value="pa-IN">🌾 ਪੰਜਾਬੀ (Punjabi)</option>
              <option value="mr-IN">🌾 मराठी (Marathi)</option>
              <option value="gu-IN">🌾 ગુજરાતી (Gujarati)</option>
              <option value="bn-IN">🌾 বাংলা (Bengali)</option>
              <option value="te-IN">🌾 తెలుగు (Telugu)</option>
              <option value="ta-IN">🌾 தமிழ் (Tamil)</option>
              <option value="kn-IN">🌾 ಕನ್ನಡ (Kannada)</option>
              <option value="ml-IN">🌾 മലയാളം (Malayalam)</option>
              <option value="or-IN">🌾 ଓଡ଼ିଆ (Odia)</option>
              <option value="en-IN">Hinglish / Indian English</option>
              <option value="en-US">English (US)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px]">AI Voice:</span>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none font-mono"
            >
              <option value="Kore">Kore (Warm & Clear)</option>
              <option value="Zephyr">Zephyr (Deep & Confident)</option>
              <option value="Puck">Puck (Crisp & Energetic)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
