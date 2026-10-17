import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  MapPin,
  RefreshCw,
  Send,
  Droplets,
  Wind,
  Thermometer,
  CloudRain,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Radio,
  Sprout,
  Sun,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import {
  LocationInfo,
  FarmPlot,
  CurrentWeatherMetrics,
  HourlyForecastItem,
} from '../types/agritech';
import { POPULAR_AGRI_REGIONS } from '../services/weatherService';
import {
  askWeatherGPT,
  fetchAudioBulletin,
  playAgronomicAudio,
  stopAgronomicAudio,
} from '../services/aiService';

export type RegionalDialect =
  | 'auto'
  | 'hi'
  | 'pa'
  | 'mr'
  | 'bn'
  | 'gu'
  | 'te'
  | 'ta'
  | 'kn'
  | 'ml'
  | 'or'
  | 'bho'
  | 'hr'
  | 'en';

const SPEECH_LANG_MAP: Record<RegionalDialect, string> = {
  auto: 'hi-IN',
  hi: 'hi-IN',
  pa: 'pa-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  gu: 'gu-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  or: 'or-IN',
  bho: 'hi-IN',
  hr: 'hi-IN',
  en: 'en-IN',
};

interface KisanVoiceWeatherHubProps {
  location: LocationInfo;
  onSelectLocation: (loc: LocationInfo) => void;
  onDetectLiveLocation: () => Promise<void>;
  isDetectingLocation: boolean;
  activePlot: FarmPlot;
  currentWeather: CurrentWeatherMetrics;
  hourly: HourlyForecastItem[];
}

export const KisanVoiceWeatherHub: React.FC<KisanVoiceWeatherHubProps> = ({
  location,
  onSelectLocation,
  onDetectLiveLocation,
  isDetectingLocation,
  activePlot,
  currentWeather,
  hourly,
}) => {
  // Dialect state (Defaults to 'auto' so any language is mirrored)
  const [dialect, setDialect] = useState<RegionalDialect>(() => {
    return (localStorage.getItem('weathergpt_dialect') as RegionalDialect) || 'auto';
  });

  // Voice Chat States
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [customQuery, setCustomQuery] = useState<string>('');
  const [aiAnswer, setAiAnswer] = useState<string>('');
  const [askedQuestion, setAskedQuestion] = useState<string>('');
  const [audioError, setAudioError] = useState<string | null>(null);

  // Daily Bulletin Radio States
  const [isRadioPlaying, setIsRadioPlaying] = useState<boolean>(false);
  const [isRadioLoading, setIsRadioLoading] = useState<boolean>(false);
  const [radioBulletinText, setRadioBulletinText] = useState<string>('');
  const radioAudioRef = useRef<HTMLAudioElement | null>(null);

  const recognitionRef = useRef<any>(null);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    localStorage.setItem('weathergpt_dialect', dialect);
    return () => {
      isMountedRef.current = false;
      stopAgronomicAudio();
      stopListening();
      if (radioAudioRef.current) {
        radioAudioRef.current.pause();
        radioAudioRef.current = null;
      }
    };
  }, [dialect]);

  // Speech Recognition setup (Supports Hindi hi-IN and English)
  const setupSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    // Set speech recognition language based on selected dialect
    recognition.lang = SPEECH_LANG_MAP[dialect] || 'hi-IN';

    recognition.onstart = () => {
      setVoiceStatus('listening');
      setInterimText('');
      setAudioError(null);
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

      if (interim) setInterimText(interim);
      if (final) {
        setTranscript(final);
        setInterimText('');
        handleAskQuestion(final);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setAudioError('माइक की अनुमति नहीं मिली। कृपया ब्राउज़र में माइक की अनुमति दें या नीचे लिखकर पूछें।');
      }
      setVoiceStatus('idle');
    };

    recognition.onend = () => {
      if (voiceStatus === 'listening') {
        setVoiceStatus('idle');
      }
    };

    return recognition;
  };

  const startListening = () => {
    stopAgronomicAudio();
    if (radioAudioRef.current) {
      radioAudioRef.current.pause();
      setIsRadioPlaying(false);
    }

    const recognition = setupSpeechRecognition();
    if (!recognition) {
      setAudioError('आपके ब्राउज़र में डायरेक्ट माइक सपोर्ट नहीं है। आप नीचे लिखकर भी पूछ सकते हैं।');
      return;
    }

    try {
      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setVoiceStatus('idle');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setVoiceStatus('idle');
  };

  // Submit Question & Speak Out Response
  const handleAskQuestion = async (questionText: string) => {
    if (!questionText.trim()) return;

    stopListening();
    setVoiceStatus('processing');
    setAskedQuestion(questionText);
    setAudioError(null);

    // Context for AI
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
      dialect: dialect,
    };

    // Prompt instructions based on dialect
    const dialectPromptPrefix =
      dialect === 'auto'
        ? '[किसान जिस भी भाषा में पूछे, उसी भाषा में उत्तर दें / Mirror user language strictly]: '
        : dialect === 'pa'
        ? '[ਜਵਾਬ ਸ਼ੁੱਧ ਅਤੇ ਸਰਲ ਪੰਜਾਬੀ ਵਿੱਚ ਦਿਓ, ਜਿਵੇਂ: ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ!]: '
        : dialect === 'mr'
        ? '[उत्तर सोप्या आणि स्पष्ट मराठीत द्या, जसे: नमस्कार शेतकरी बंधूंनो!]: '
        : dialect === 'bn'
        ? '[উত্তর সহজ এবং স্পষ্ট বাংলায় দিন, যেমন: নমস্কার কৃষক ভাই!]: '
        : dialect === 'gu'
        ? '[જવાબ સરળ અને સ્પષ્ટ ગુજરાતીમાં આપો, જેમ કે: નમસ્તે ખેડૂત મિત્ર!]: '
        : dialect === 'te'
        ? '[సమాధానం సాధారణ మరియు స్పష్టమైన తెలుగులో ఇవ్వండి, ఉదాహరణకు: నమస్కారం రైతు సోదరులారా!]: '
        : dialect === 'ta'
        ? '[பதிலை எளிய மற்றும் தெளிவான தமிழில் தரவும், உதாரணமாக: வணக்கம் விவசாய நண்பரே!]: '
        : dialect === 'kn'
        ? '[ಉತ್ತರವನ್ನು ಸರಳ ಮತ್ತು ಸ್ಪಷ್ಟ ಕನ್ನಡದಲ್ಲಿ ನೀಡಿ, ಉದಾಹರಣೆಗೆ: ನಮಸ್ಕಾರ ರೈತ ಬಾಂಧವರೇ!]: '
        : dialect === 'ml'
        ? '[ഉത്തരം ലളിതവും വ്യക്തവുമായ മലയാളത്തിൽ നൽകുക, ഉദാഹരണത്തിന്: നമസ്കാരം കർഷക സുഹൃത്തേ!]: '
        : dialect === 'or'
        ? '[ଉତ୍ତର ସରଳ ଓ ସ୍ପଷ୍ଟ ଓଡ଼ିଆରେ ଦିଅନ୍ତୁ, ଯଥା: ନମସ୍କାର କୃଷକ ଭାଇ!]: '
        : dialect === 'bho'
        ? '[जवाब सरल और ठेठ भोजपुरी में दें, जैसे: प्रणाम किसान भाई!]: '
        : dialect === 'hr'
        ? '[जवाब सरल और ठेठ हरियाणवी में दें, जैसे: राम-राम किसान भाई!]: '
        : dialect === 'en'
        ? '[Respond in very simple, clear English for a farmer]: '
        : '[जवाब अत्यंत सरल, सहज और शुद्ध व्यावहारिक हिन्दी में दें, ताकि कम पढ़े-लिखे किसान भाई तुरंत समझ सकें]: ';

    try {
      const fullQuery = `${dialectPromptPrefix}${questionText}`;
      const reply = await askWeatherGPT(
        [{ role: 'user', text: fullQuery }],
        farmContext,
        questionText,
        dialect
      );

      if (!isMountedRef.current) return;
      setAiAnswer(reply);
      setCustomQuery('');

      // Automatically speak out the response in voice so illiterate farmers don't have to read!
      setVoiceStatus('speaking');
      await playAgronomicAudio(
        reply,
        'Kore',
        () => {
          if (isMountedRef.current) setVoiceStatus('speaking');
        },
        () => {
          if (isMountedRef.current) setVoiceStatus('idle');
        }
      );
    } catch (err) {
      console.error('Error fetching voice answer:', err);
      if (isMountedRef.current) {
        setAiAnswer('माफ़ कीजिए, मौसम की जानकारी निकालने में कुछ दिक्कत हुई। कृपया दोबारा पूछें।');
        setVoiceStatus('idle');
      }
    }
  };

  const handleStopAudio = () => {
    stopAgronomicAudio();
    if (radioAudioRef.current) {
      radioAudioRef.current.pause();
      setIsRadioPlaying(false);
    }
    setVoiceStatus('idle');
  };

  const handleReplayAnswer = () => {
    if (!aiAnswer) return;
    setVoiceStatus('speaking');
    playAgronomicAudio(
      aiAnswer,
      'Kore',
      () => setVoiceStatus('speaking'),
      () => setVoiceStatus('idle')
    );
  };

  // Play Daily Radio Bulletin
  const handlePlayRadioBulletin = async () => {
    if (isRadioPlaying) {
      stopAgronomicAudio();
      if (radioAudioRef.current) {
        radioAudioRef.current.pause();
      }
      setIsRadioPlaying(false);
      return;
    }

    setIsRadioLoading(true);
    setAudioError(null);

    try {
      const data = await fetchAudioBulletin({
        dialect: dialect,
        location: location.name,
        temp: currentWeather.temp,
        condition: currentWeather.weatherText,
        windSpeed: currentWeather.windSpeed,
        rainChance: currentWeather.precipProb,
        soilMoisture: currentWeather.soilMoisture0_1cm,
        crop: activePlot.crop,
        voice: 'Kore',
      });

      setRadioBulletinText(data.spokenText);

      if (data.audioBase64) {
        const audioUrl = `data:audio/wav;base64,${data.audioBase64}`;
        const audio = new Audio(audioUrl);
        radioAudioRef.current = audio;

        audio.onplay = () => {
          setIsRadioLoading(false);
          setIsRadioPlaying(true);
        };
        audio.onended = () => {
          setIsRadioPlaying(false);
        };
        audio.onerror = () => {
          setIsRadioPlaying(false);
          setIsRadioLoading(false);
          playAgronomicAudio(
            data.spokenText,
            'Kore',
            () => setIsRadioPlaying(true),
            () => setIsRadioPlaying(false)
          );
        };

        await audio.play();
      } else {
        setIsRadioLoading(false);
        playAgronomicAudio(
          data.spokenText,
          'Kore',
          () => setIsRadioPlaying(true),
          () => setIsRadioPlaying(false)
        );
      }
    } catch (e) {
      console.warn('Radio bulletin error:', e);
      setIsRadioLoading(false);
      setIsRadioPlaying(false);
    }
  };

  // 1-Click Quick Questions tailored for illiterate farmers in their chosen language
  const getQuickQuestions = () => {
    if (dialect === 'pa') {
      return [
        { id: 'rain', icon: '🌧️', title: 'ਕੀ ਅੱਜ ਮੀਂਹ ਪਵੇਗਾ?', sub: 'ਮੀਂਹ ਦਾ ਹਾਲ', query: 'ਕੀ ਅੱਜ ਮੇਰੇ ਖੇਤ ਵਿੱਚ ਮੀਂਹ ਪਵੇਗਾ? ਸੰਭਾਵਨਾ ਕਿੰਨੀ ਹੈ? ਸਪਸ਼ਟ ਪੰਜਾਬੀ ਵਿੱਚ ਦੱਸੋ।' },
        { id: 'spray', icon: '🚜', title: 'ਕੀ ਅੱਜ ਸਪਰੇਅ ਕਰ ਸਕਦੇ ਹਾਂ?', sub: 'ਕੀਟਨਾਸ਼ਕ ਸਪਰੇਅ', query: 'ਕੀ ਅੱਜ ਮੇਰੀ ਫਸਲ ਉੱਤੇ ਦਵਾਈ ਦਾ ਸਪਰੇਅ ਕਰਨਾ ਸਹੀ ਹੈ? ਹਵਾ ਦੀ ਰਫ਼ਤਾਰ ਕਿੰਨੀ ਹੈ?' },
        { id: 'water', icon: '💧', title: 'ਕੀ ਅੱਜ ਪਾਣੀ (ਸਿੰਚਾਈ) ਲਗਾਈਏ?', sub: 'ਮਿੱਟੀ ਦੀ ਨਮੀ', query: 'ਮਿੱਟੀ ਦੀ ਨਮੀ ਨੂੰ ਦੇਖਦੇ ਹੋਏ ਕੀ ਅੱਜ ਖੇਤ ਨੂੰ ਪਾਣੀ ਦੇਣ ਦੀ ਲੋੜ ਹੈ?' },
        { id: 'today-tomorrow', icon: '🌡️', title: 'ਅੱਜ ਅਤੇ ਕੱਲ ਦਾ ਮੌਸਮ ਕਿਹੋ ਜਿਹਾ ਰਹੇਗਾ?', sub: 'ਤਾਪਮਾਨ ਤੇ ਧੁੱਪ', query: 'ਅੱਜ ਅਤੇ ਕੱਲ ਮੇਰੇ ਇਲਾਕੇ ਵਿੱਚ ਤਾਪਮਾਨ, ਧੁੱਪ ਅਤੇ ਹਵਾ ਕਿਹੋ ਜਿਹੀ ਰਹੇਗੀ?' },
        { id: 'pest', icon: '🐛', title: 'ਕੀੜੇ ਜਾਂ ਬਿਮਾਰੀ ਦਾ ਖ਼ਤਰਾ ਹੈ?', sub: 'ਫਸਲ ਸੁਰੱਖਿਆ', query: 'ਮੌਜੂਦਾ ਮੌਸਮ ਵਿੱਚ ਮੇਰੀ ਫਸਲ ਨੂੰ ਕਿਸੇ ਕੀੜੇ ਜਾਂ ਫਫੂੰਦੀ ਦਾ ਖ਼ਤਰਾ ਤਾਂ ਨਹੀਂ?' },
      ];
    }
    if (dialect === 'mr') {
      return [
        { id: 'rain', icon: '🌧️', title: 'आज पाऊस पडेल का?', sub: 'पावसाचा अंदाज', query: 'आज माझ्या शेतात पाऊस पडेल का? किती टक्के शक्यता आहे? स्पष्ट मराठीत सांगा.' },
        { id: 'spray', icon: '🚜', title: 'आज फवारणी करू शकतो का?', sub: 'औषध फवारणी', query: 'आज पिकावर कीटकनाशक किंवा बुरशीनाशक फवारणी करणे सुरक्षित आहे का?' },
        { id: 'water', icon: '💧', title: 'आज पिकाला पाणी द्यावे का?', sub: 'जमिनीतील ओलावा', query: 'जमिनीतील ओलाव्यानुसार आज पिकाला पाणी (सिंचन) देण्याची गरज आहे का?' },
        { id: 'today-tomorrow', icon: '🌡️', title: 'आज आणि उद्याचे हवामान कसे राहील?', sub: 'तापमान व उन', query: 'आज आणि उद्या तापमान, वारा आणि हवामान कसे राहील?' },
        { id: 'pest', icon: '🐛', title: 'कीड किंवा रोगाचा धोका आहे का?', sub: 'पीक संरक्षण', query: 'सध्याच्या हवामानामुळे पिकावर कोणती कीड किंवा रोग पडण्याची शक्यता आहे?' },
      ];
    }
    if (dialect === 'gu') {
      return [
        { id: 'rain', icon: '🌧️', title: 'શું આજે વરસાદ પડશે?', sub: 'વરસાદની આગાહી', query: 'શું આજે મારા ખેતરમાં વરસાદ પડશે? કેટલી શક્યતા છે? સ્પષ્ટ ગુજરાતીમાં કહો.' },
        { id: 'spray', icon: '🚜', title: 'શું આજે દવાનો છંટકાવ કરી શકાય?', sub: 'દવા છંટકાવ', query: 'શું આજે પાકમાં કીટનાશક દવાનો છંટકાવ કરવો સુરક્ષિત છે? પવનની ગતિ કેવી છે?' },
        { id: 'water', icon: '💧', title: 'શું આજે પિયત (પાણી) આપવું જોઈએ?', sub: 'જમીનમાં ભેજ', query: 'જમીનમાં ભેજ જોતા આજે ખેતરમાં પાણી આપવું જોઈએ કે નહીં?' },
        { id: 'today-tomorrow', icon: '🌡️', title: 'આજે અને કાલે હવામાન કેવું રહેશે?', sub: 'તાપમાન અને પવન', query: 'આજે અને કાલે મારા વિસ્તારમાં હવામાન અને તાપમાન કેવું રહેશે?' },
        { id: 'pest', icon: '🐛', title: 'રોગ કે જીવાતનો કોઈ ખતરો છે?', sub: 'પાક સંરક્ષણ', query: 'હવામાન જોતા પાકમાં કોઈ જીવાત કે રોગ આવવાની શક્યતા છે?' },
      ];
    }
    if (dialect === 'bn') {
      return [
        { id: 'rain', icon: '🌧️', title: 'আজ কি বৃষ্টি হবে?', sub: 'বৃষ্টির পূর্বাভাস', query: 'আজ আমার জমিতে কি বৃষ্টি হতে পারে? বৃষ্টির সম্ভাবনা কতটুকু? স্পষ্ট করে জানান।' },
        { id: 'spray', icon: '🚜', title: 'আজ কি স্প্রে করা যাবে?', sub: 'কীটনাশক স্প্রে', query: 'আজ ফসলে কীটনাশক বা ছত্রাকনাশক স্প্রে করা কি নিরাপদ? বাতাসের গতি কেমন?' },
        { id: 'water', icon: '💧', title: 'আজ জমিতে সেচ দেওয়া উচিত?', sub: 'মাটির আর্দ্রতা', query: 'মাটির আর্দ্রতা দেখে বলুন আজ ফসলে জল বা সেচ দেওয়া উচিত কি না?' },
        { id: 'today-tomorrow', icon: '🌡️', title: 'আজ ও আগামীকালের আবহাওয়া কেমন?', sub: 'তাপমাত্রা ও রোদ', query: 'আজ এবং আগামীকাল এলাকায় রোদ, বাতাস ও তাপমাত্রা কেমন থাকবে?' },
        { id: 'pest', icon: '🐛', title: 'পোকামাকড় বা রোগের ঝুঁকি আছে?', sub: 'ফসল রক্ষা', query: 'বর্তমান আবহাওয়ায় ফসলে কোনো রোগ বা পোকার আক্রমণের ঝুঁকি আছে কি?' },
      ];
    }
    if (dialect === 'te') {
      return [
        { id: 'rain', icon: '🌧️', title: 'ఈ రోజు వర్షం పడుతుందా?', sub: 'వర్ష సూచన', query: 'ఈ రోజు నా పొలంలో వర్షం పడే అవకాశం ఉందా? స్పష్టమైన తెలుగులో చెప్పండి.' },
        { id: 'spray', icon: '🚜', title: 'ఈ రోజు మందు పిచிகారీ చేయవచ్చా?', sub: 'పురుగు మందు పిచிகారీ', query: 'ఈ రోజు పంటపై పురుగు మందు పిచிகారీ చేయడం సురక్షితమేనా? గాలి వేగం ఎలా ఉంది?' },
        { id: 'water', icon: '💧', title: 'ఈ రోజు పొలానికి నీరు పెట్టాలా?', sub: 'నేలలో తేమ', query: 'నేలలోని తేమను బట్టి ఈ రోజు పొలానికి నీరు పెట్టాలా లేదా?' },
        { id: 'today-tomorrow', icon: '🌡️', title: 'ఈ రోజు, రేపు వాతావરણం ఎలా ఉంటుంది?', sub: 'ఉష్ణోగ్రత మరియు ఎండ', query: 'ఈ రోజు మరియు రేపు మా ప్రాంతంలో ఎండ, ఉష్ణోగ్రత, వాతావરણం ఎలా ఉంటుంది?' },
        { id: 'pest', icon: '🐛', title: 'పురుగులు లేదా తెగుళ్ల ముప్పు ఉందా?', sub: 'పంట సంరక్షణ', query: 'ప్రస్తుత వాతావరణం వల్ల పంటకు ఎలాంటి పురుగులు లేదా తెగుళ్లు వచ్చే ప్రమాదం ఉంది?' },
      ];
    }
    if (dialect === 'ta') {
      return [
        { id: 'rain', icon: '🌧️', title: 'இன்று மழை பெய்யுமா?', sub: 'மழை முன்னறிவிப்பு', query: 'இன்று எனது வயலில் மழை பெய்யுமா? மழைக்கான வாய்ப்பு எவ்வளவு? தெளிவாக கூறுங்கள்.' },
        { id: 'spray', icon: '🚜', title: 'இன்று மருந்து தெளிக்கலாமா?', sub: 'பூச்சிக்கொல்லி தெளிப்பு', query: 'இன்று பயிர்களுக்கு மருந்து தெளிப்பது பாதுகாப்பானதா? காற்றின் வேகம் எப்படி உள்ளது?' },
        { id: 'water', icon: '💧', title: 'இன்று பயிருக்கு நீர் பாய்ச்சலாமா?', sub: 'மண் ஈரப்பதம்', query: 'மண்ணின் ஈரப்பதத்தை கருத்தில் கொண்டு இன்று பயிருக்கு நீர் பாய்ச்ச வேண்டுமா?' },
        { id: 'today-tomorrow', icon: '🌡️', title: 'இன்றும் நாளையும் வானிலை எப்படி இருக்கும்?', sub: 'வெப்பநிலை', query: 'இன்றும் நாளையும் எனது பகுதியில் வெப்பநிலை, காற்று, வானிலை எப்படி இருக்கும்?' },
        { id: 'pest', icon: '🐛', title: 'பூச்சி அல்லது நோய் தாக்குதல் வருமா?', sub: 'பயிர் பாதுகாப்பு', query: 'தற்போதைய வானிலையால் பயிருக்கு ஏதேனும் பூச்சி அல்லது நோய் தாக்குதல் அபாயம் உள்ளதா?' },
      ];
    }
    if (dialect === 'en') {
      return [
        { id: 'rain', icon: '🌧️', title: 'Will it rain today?', sub: 'Precipitation outlook', query: 'Will it rain on my farm today? What is the rain probability and expected volume?' },
        { id: 'spray', icon: '🚜', title: 'Is it safe to spray today?', sub: 'Pesticide & Foliar', query: 'Is today a safe window to spray pesticides or fungicides? How is the wind drift risk?' },
        { id: 'water', icon: '💧', title: 'Should I irrigate today?', sub: 'Soil moisture balance', query: 'Based on topsoil moisture and crop evapotranspiration, should I irrigate today or wait?' },
        { id: 'today-tomorrow', icon: '🌡️', title: 'Weather for today & tomorrow?', sub: 'Temp, wind & sun', query: 'What is the 48-hour temperature, solar radiation, and wind forecast for my farm?' },
        { id: 'pest', icon: '🐛', title: 'Any pest or fungal risks?', sub: 'Crop canopy health', query: 'Given current relative humidity and temperature, what pathogen or pest outbreaks threaten my crop?' },
      ];
    }
    // Default Hindi / Bhojpuri / Haryanvi / Auto
    return [
      { id: 'rain', icon: '🌧️', title: 'क्या आज बारिश होगी?', sub: 'बारिश व बादल का हाल', query: 'क्या आज मेरे खेत में बारिश होगी? बारिश का कितना प्रतिशत चांस है और कितनी बारिश हो सकती है? साफ-साफ बताइए।' },
      { id: 'spray', icon: '🚜', title: 'क्या आज स्प्रे कर सकते हैं?', sub: 'कीटनाशक व खाद छिड़काव', query: 'क्या आज मेरी फसल में कीटनाशक या फफूंदनाशक का स्प्रे करना सुरक्षित है? हवा की गति और मौसम कैसा है?' },
      { id: 'water', icon: '💧', title: 'क्या आज पानी (सिंचाई) लगाएं?', sub: 'मिट्टी की नमी व सिंचाई', query: 'मेरी मिट्टी में नमी को देखते हुए क्या आज खेत में पानी (सिंचाई) देना चाहिए या नहीं? साफ सलाह दीजिए।' },
      { id: 'today-tomorrow', icon: '🌡️', title: 'आज और कल का मौसम कैसा रहेगा?', sub: 'तापमान, धूप व हवा', query: 'आज और कल मेरे इलाके में धूप, तापमान, हवा और मौसम कैसा रहेगा? किसान के लिए जरूरी बातें बताइए।' },
      { id: 'pest', icon: '🐛', title: 'कीट या बीमारी का कोई खतरा है?', sub: 'फसल सुरक्षा व रोकथाम', query: 'वर्तमान मौसम और उमस को देखते हुए मेरी फसल में कौन से रोग या कीड़े लगने का खतरा है और क्या बचाव करें?' },
    ];
  };

  const quickQuestionsList = getQuickQuestions();

  // Visual Traffic Lights calculations for Non-Readers
  // 1. Spray Status
  const isSpraySafe = currentWeather.windSpeed <= 15 && currentWeather.precipProb < 25;
  const isSprayMarginal = currentWeather.windSpeed > 15 && currentWeather.windSpeed <= 22 && currentWeather.precipProb < 45;
  
  // 2. Irrigation Status
  const needsIrrigation = currentWeather.soilMoisture0_1cm < 20;
  const holdIrrigationForRain = currentWeather.precipProb > 60 || currentWeather.rainSum24h > 5;

  // 3. Rain Status
  const rainAlert = currentWeather.precipProb > 50;

  return (
    <div className="w-full bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-emerald-500/40 rounded-3xl p-4 sm:p-7 shadow-2xl relative overflow-hidden">
      {/* Background Decorative Agri Aura */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* TOP HEADER: Location & GPS */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800 relative z-10">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 border border-emerald-500/30">
              <Sprout className="w-3.5 h-3.5" />
              सरल किसान केंद्र (Farmer Voice & Weather)
            </span>
            <span className="text-xs text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 font-medium">
              💡 कम पढ़े-लिखे किसान भाइयों के लिए विशेष सरल सेवा
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <MapPin className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-sm text-slate-300">आपकी जगह:</span>
            <span className="text-base sm:text-lg font-black text-white bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-700">
              {location.name}
              {location.admin1 && location.admin1 !== location.name ? `, ${location.admin1}` : ''}
            </span>
          </div>
        </div>

        {/* Action: Detect live GPS location with 1 tap */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          <button
            onClick={onDetectLiveLocation}
            disabled={isDetectingLocation}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition hover:scale-105 active:scale-95 disabled:opacity-50"
            title="जीपीएस से अपने खेत या गांव का सटीक मौसम तुरंत निकालें"
          >
            <RefreshCw className={`w-4 h-4 ${isDetectingLocation ? 'animate-spin' : ''}`} />
            <span>{isDetectingLocation ? 'स्थान खोजा जा रहा है...' : '📍 मेरी लाइव लोकेशन का मौसम निकालें (GPS)'}</span>
          </button>
        </div>
      </div>

      {/* QUICK INDIAN STATES & DISTRICTS SELECTOR */}
      <div className="py-3 border-b border-slate-800/80 relative z-10 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-xs text-slate-400 font-bold whitespace-nowrap flex items-center gap-1">
          <span>🌾 प्रमुख राज्य:</span>
        </span>
        {POPULAR_AGRI_REGIONS.slice(0, 8).map((region) => {
          const isSelected = location.name === region.name;
          return (
            <button
              key={region.name}
              onClick={() => onSelectLocation(region)}
              className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition font-bold flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black ring-2 ring-emerald-300'
                  : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
              }`}
            >
              <span>{region.name}</span>
            </button>
          );
        })}
      </div>

      {/* LANGUAGE & DIALECT SELECTOR */}
      <div className="py-3 border-b border-slate-800/80 relative z-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
            <Radio className="w-3.5 h-3.5" />
            अपनी भाषा चुनें:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'auto', label: '✨ ऑटो (Auto - किसी भी भाषा में बोलें)' },
              { id: 'hi', label: '🇮🇳 हिन्दी (Hindi)' },
              { id: 'pa', label: '🌾 ਪੰਜਾਬੀ (Punjabi)' },
              { id: 'mr', label: '🌾 मराठी (Marathi)' },
              { id: 'gu', label: '🌾 ગુજરાતી (Gujarati)' },
              { id: 'bn', label: '🌾 বাংলা (Bengali)' },
              { id: 'te', label: '🌾 తెలుగు (Telugu)' },
              { id: 'ta', label: '🌾 தமிழ் (Tamil)' },
              { id: 'kn', label: '🌾 ಕನ್ನಡ (Kannada)' },
              { id: 'ml', label: '🌾 മലയാളം (Malayalam)' },
              { id: 'or', label: '🌾 ଓଡ଼ିଆ (Odia)' },
              { id: 'bho', label: '🌾 भोजपुरी (Bhojpuri)' },
              { id: 'hr', label: '🌾 हरियाणवी (Haryanvi)' },
              { id: 'en', label: '🌐 English' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDialect(d.id as RegionalDialect)}
                className={`text-xs px-3 py-1 rounded-full font-bold transition whitespace-nowrap ${
                  dialect === d.id
                    ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* 1-Click Spoken Radio Bulletin Button */}
        <button
          onClick={handlePlayRadioBulletin}
          disabled={isRadioLoading}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition shadow-md ${
            isRadioPlaying
              ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
              : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 hover:scale-105 active:scale-95'
          }`}
          title="आज का पूरा मौसम बुलेटिन रेडियो की तरह आवाज़ में सुनें"
        >
          {isRadioLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>बुलेटिन तैयार हो रहा है...</span>
            </>
          ) : isRadioPlaying ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>रेडियो बुलेटिन रोकें</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              <span>📻 1-क्लिक में आज का मौसम बुलेटिन सुनें</span>
            </>
          )}
        </button>
      </div>

      {/* SAME-LANGUAGE GUARANTEE BANNER */}
      <div className="py-2.5 px-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2.5 relative z-10 text-xs text-emerald-200 mt-2">
        <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-pulse" />
        <div>
          <span className="font-extrabold text-white">किसान सहायता गारंटी: </span>
          <span>आप जिस भी भाषा में मौसम पूछेंगे (बोलकर या लिखकर), हमारा चैटबॉट <strong>उसी भाषा में बोलकर जवाब देगा</strong>। (You ask in any language, we reply in the same language).</span>
        </div>
      </div>

      {/* 3 VISUAL STATUS LIGHTS FOR NON-READERS (बिना पढ़े रंग देखकर समझें) */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
        {/* 1. Spray Status */}
        <div
          className={`p-3.5 rounded-2xl border flex items-center gap-3 transition ${
            isSpraySafe
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : isSprayMarginal
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-slate-950 font-black shadow-lg ${
              isSpraySafe ? 'bg-emerald-400' : isSprayMarginal ? 'bg-amber-400' : 'bg-rose-400'
            }`}
          >
            {isSpraySafe ? (
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            ) : isSprayMarginal ? (
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            ) : (
              <XCircle className="w-6 h-6 stroke-[2.5]" />
            )}
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              कीटनाशक / स्प्रे का हाल
            </div>
            <div className="text-sm font-black text-white">
              {isSpraySafe
                ? '🟢 आज स्प्रे कर सकते हैं (सुरक्षित)'
                : isSprayMarginal
                ? '🟡 सावधानी से स्प्रे करें (हवा तेज)'
                : '🔴 आज स्प्रे न करें (रुकें)'}
            </div>
            <div className="text-[11px] text-slate-400">हवा: {currentWeather.windSpeed} km/h</div>
          </div>
        </div>

        {/* 2. Irrigation Status */}
        <div
          className={`p-3.5 rounded-2xl border flex items-center gap-3 transition ${
            holdIrrigationForRain
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              : needsIrrigation
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
          }`}
        >
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-slate-950 font-black shadow-lg ${
              holdIrrigationForRain ? 'bg-rose-400' : needsIrrigation ? 'bg-emerald-400' : 'bg-cyan-400'
            }`}
          >
            <Droplets className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              सिंचाई / पानी की जरूरत
            </div>
            <div className="text-sm font-black text-white">
              {holdIrrigationForRain
                ? '🔴 पानी न लगाएं (बारिश संभव)'
                : needsIrrigation
                ? '🟢 खेत में पानी लगाएं (नमी कम)'
                : '⚪ नमी पर्याप्त है (पानी न लगाएं)'}
            </div>
            <div className="text-[11px] text-slate-400">नमी: {currentWeather.soilMoisture0_1cm}%</div>
          </div>
        </div>

        {/* 3. Rain Status */}
        <div
          className={`p-3.5 rounded-2xl border flex items-center gap-3 transition ${
            rainAlert
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              : currentWeather.precipProb > 20
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
          }`}
        >
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-slate-950 font-black shadow-lg ${
              rainAlert ? 'bg-rose-400' : currentWeather.precipProb > 20 ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
          >
            <CloudRain className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              बारिश की संभावना
            </div>
            <div className="text-sm font-black text-white">
              {rainAlert
                ? '🔴 बारिश का अलर्ट है'
                : currentWeather.precipProb > 20
                ? '🟡 हल्की फुहार संभव'
                : '🟢 सूखा व साफ मौसम'}
            </div>
            <div className="text-[11px] text-slate-400">संभावना: {currentWeather.precipProb}%</div>
          </div>
        </div>
      </div>

      {/* CORE INTERACTION: GIANT VOICE MIC & ASKING SECTION */}
      <div className="mt-6 p-5 sm:p-7 rounded-3xl bg-slate-950/90 border-2 border-emerald-400/40 relative z-10 shadow-inner">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* GIANT 1-TOUCH MIC BUTTON */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="relative flex items-center justify-center">
              {/* Animated Ripples */}
              {voiceStatus === 'listening' && (
                <>
                  <div className="absolute w-36 h-36 rounded-full bg-emerald-400/25 animate-ping" />
                  <div className="absolute w-28 h-28 rounded-full bg-emerald-500/35 animate-pulse" />
                </>
              )}
              {voiceStatus === 'speaking' && (
                <>
                  <div className="absolute w-36 h-36 rounded-full bg-teal-400/25 animate-ping duration-1000" />
                  <div className="absolute w-28 h-28 rounded-full bg-teal-500/35 animate-pulse" />
                </>
              )}

              <button
                onClick={() => {
                  if (voiceStatus === 'listening') {
                    stopListening();
                  } else if (voiceStatus === 'speaking') {
                    handleStopAudio();
                  } else {
                    startListening();
                  }
                }}
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl relative z-10 cursor-pointer ${
                  voiceStatus === 'listening'
                    ? 'bg-gradient-to-tr from-emerald-500 to-emerald-300 text-slate-950 scale-110 shadow-emerald-500/60 ring-4 ring-emerald-300'
                    : voiceStatus === 'speaking'
                    ? 'bg-gradient-to-tr from-teal-400 to-cyan-300 text-slate-950 scale-105 shadow-teal-500/50 ring-4 ring-teal-200'
                    : voiceStatus === 'processing'
                    ? 'bg-slate-800 text-emerald-400 ring-2 ring-emerald-500'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 hover:scale-105 active:scale-95 shadow-emerald-500/40 ring-4 ring-emerald-400/50'
                }`}
                title="माइक दबाकर अपनी भाषा में पूछें"
              >
                {voiceStatus === 'listening' ? (
                  <>
                    <Mic className="w-10 h-10 animate-bounce" />
                    <span className="text-[10px] font-black uppercase tracking-wider mt-1">सुन रहे हैं...</span>
                  </>
                ) : voiceStatus === 'speaking' ? (
                  <>
                    <Volume2 className="w-10 h-10 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-wider mt-1">बोल रहे हैं</span>
                  </>
                ) : voiceStatus === 'processing' ? (
                  <>
                    <RefreshCw className="w-8 h-8 animate-spin" />
                    <span className="text-[10px] font-bold mt-1">सोच रहे हैं...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-10 h-10" />
                    <span className="text-[10px] font-black uppercase tracking-wider mt-1">बोलने को दबाएं</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-3 text-center">
              <span className="text-xs sm:text-sm font-black text-emerald-300">
                {voiceStatus === 'listening'
                  ? '🗣️ अपनी बात बोलिए... (हम सुन रहे हैं)'
                  : voiceStatus === 'speaking'
                  ? '🔊 जवाब बोला जा रहा है... (सुनिए)'
                  : voiceStatus === 'processing'
                  ? '⏳ मौसम का जवाब तैयार हो रहा है...'
                  : '👆 माइक दबाएं और अपनी भाषा में पूछें'}
              </span>
            </div>
          </div>

          {/* RIGHT SIDE: Text Query & One-Click Farmer Questions */}
          <div className="flex-1 w-full space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>या नीचे लिखकर पूछें (लिखना चाहें तो):</span>
                </label>

                {voiceStatus === 'speaking' && (
                  <button
                    onClick={handleStopAudio}
                    className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold hover:bg-rose-500 hover:text-white transition"
                  >
                    ⏹️ आवाज़ रोकें
                  </button>
                )}
              </div>

              {/* Text Input Box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customQuery.trim()) {
                    handleAskQuestion(customQuery);
                  }
                }}
                className="mt-1.5 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="उदा: क्या आज शाम को बारिश होगी? या स्प्रे कब करें?..."
                  className="flex-1 bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
                <button
                  type="submit"
                  disabled={!customQuery.trim() || voiceStatus === 'processing'}
                  className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-sm flex items-center gap-1.5 transition hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/20 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>पूछें</span>
                </button>
              </form>
            </div>

            {/* Error message */}
            {audioError && (
              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {audioError}
              </div>
            )}

            {/* Live speech transcription text while user speaks */}
            {(voiceStatus === 'listening' || interimText) && (
              <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 text-sm animate-pulse flex items-center gap-2">
                <Mic className="w-4 h-4 text-emerald-400 animate-bounce flex-shrink-0" />
                <span>आप बोल रहे हैं: &quot;{interimText || 'बोलिए...'}&quot;</span>
              </div>
            )}

            {/* 1-CLICK QUESTIONS FOR ILLITERATE FARMERS */}
            <div>
              <div className="text-xs font-bold text-amber-300 mb-2 flex items-center gap-1">
                <span>👇 बिना लिखे, बस 1-क्लिक में पूछें और आवाज़ में सुनें:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickQuestionsList.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleAskQuestion(q.query)}
                    disabled={voiceStatus === 'processing'}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-emerald-950/80 border border-slate-700 hover:border-emerald-400 text-left text-xs font-bold text-slate-200 hover:text-emerald-300 transition hover:scale-102 active:scale-98 shadow-sm group"
                  >
                    <span className="text-base group-hover:scale-110 transition-transform">{q.icon}</span>
                    <span>{q.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI ANSWER DISPLAY (SPEAKS ALOUD & SHOWS TEXT) */}
        {aiAnswer && (
          <div className="mt-6 pt-5 border-t border-slate-800 animate-in fade-in duration-300">
            <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
                  AI
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-400">
                    किसान सलाहकार का जवाब ({location.name}):
                  </span>
                  {askedQuestion && (
                    <div className="text-[11px] text-slate-400 italic">
                      सवाल: &quot;{askedQuestion}&quot;
                    </div>
                  )}
                </div>
              </div>

              {/* Voice controls for answer */}
              <div className="flex items-center gap-2">
                {voiceStatus === 'speaking' ? (
                  <button
                    onClick={handleStopAudio}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>आवाज़ रोकें</span>
                  </button>
                ) : (
                  <button
                    onClick={handleReplayAnswer}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 text-xs font-bold transition"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>🔊 दोबारा आवाज़ में सुनें</span>
                  </button>
                )}
              </div>
            </div>

            {/* Answer Box */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-100 text-sm sm:text-base leading-relaxed space-y-2 whitespace-pre-line shadow-inner">
              {aiAnswer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
