import React from 'react';
import { Mic, ShieldCheck, Bell, Thermometer, Languages } from 'lucide-react';

export const PrototypeWhatItDoes: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-[#FAF7EE] border-t border-[#EAE3D2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-3 mb-10">
          <span className="text-[11px] sm:text-xs font-bold tracking-widest text-[#245E43] uppercase block font-mono">
            WHAT IT DOES · क्या करता है
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-slate-900 tracking-tight">
            जटिल चार्ट नहीं, सीधा जवाब। <span className="text-slate-500 font-sans text-2xl sm:text-3xl font-normal block sm:inline">(Answers, not charts.)</span>
          </h2>
        </div>

        {/* 5-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Ask naturally */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E7E1D2] shadow-2xs hover:border-[#D5CDBC] transition">
            <div className="w-10 h-10 rounded-xl bg-[#E8F3EB] text-[#245E43] flex items-center justify-center mb-5">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 font-sans">
              बोलकर या लिखकर पूछें (Ask naturally)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              माइक दबाकर अपनी बोली में बोलें। किसी भी साधारण फोन या ब्राउज़र पर आसानी से काम करता है।
            </p>
          </div>

          {/* Card 2: Answers with source */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E7E1D2] shadow-2xs hover:border-[#D5CDBC] transition">
            <div className="w-10 h-10 rounded-xl bg-[#E8F3EB] text-[#245E43] flex items-center justify-center mb-5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 font-sans">
              सरकारी स्रोत के साथ उत्तर (Answers with source)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              हर उत्तर के साथ आधिकारिक मौसम विभाग (IMD) डेटा का संदर्भ दिया जाता है। कोई फर्जी अनुमान नहीं।
            </p>
          </div>

          {/* Card 3: Alert subscriptions */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E7E1D2] shadow-2xs hover:border-[#D5CDBC] transition">
            <div className="w-10 h-10 rounded-xl bg-[#E8F3EB] text-[#245E43] flex items-center justify-center mb-5">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 font-sans">
              गाँव के लिए मौसम चेतावनी (Alert subscriptions)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              आपके गाँव या कस्बे के लिए भारी बारिश, ओलावृष्टि, पाला और लू की समय पूर्व सीधी चेतावनी।
            </p>
          </div>

          {/* Card 4: Temperature insights */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E7E1D2] shadow-2xs hover:border-[#D5CDBC] transition">
            <div className="w-10 h-10 rounded-xl bg-[#E8F3EB] text-[#245E43] flex items-center justify-center mb-5">
              <Thermometer className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 font-sans">
              तापमान व फसल सुरक्षा (Temperature insights)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              वर्तमान, न्यूनतम और अधिकतम तापमान (°C) के साथ फसल को गर्मी व सर्दी से बचाने की व्यावहारिक सलाह।
            </p>
          </div>

          {/* Card 5: Local language (Dark Feature Card across full span) */}
          <div className="md:col-span-2 bg-[#0D2137] rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-md text-white flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#E5A83B] text-slate-950 flex items-center justify-center mb-5 shadow-sm">
                <Languages className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2 font-sans">
                किसान की अपनी स्थानीय मातृभाषा में (Local languages)
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal max-w-2xl">
                हिन्दी, भोजपुरी, मराठी, गुजराती, ਪੰਜਾਬੀ (पंजाबी), বাংলা (बंगाली), தமிழ் (तमिल), తెలుగు (तेलुगु), ಕನ್ನಡ (कन्नड़) और English में बेझिझक बात करें।
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
