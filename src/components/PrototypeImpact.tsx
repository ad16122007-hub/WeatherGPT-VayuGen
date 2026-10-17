import React from 'react';

export const PrototypeImpact: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-[#1E4E38] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Text Narrative */}
          <div className="lg:col-span-6 space-y-4">
            <span className="text-[11px] sm:text-xs font-bold tracking-widest text-[#86EFAC] uppercase block font-mono">
              IMPACT
            </span>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-white tracking-tight leading-[1.15]">
              Built on IMD, made for the last mile.
            </h2>

            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-xl font-normal pt-2">
              IMD&apos;s Gramin Krishi Mausam Sewa already reaches over 20 million farmers by SMS and IVR.
              WeatherGPT adds a conversational, local-language layer on top, so anyone can simply ask.
            </p>
          </div>

          {/* Right Roadmap Step Cards */}
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Step 1: Active Live (Amber) */}
            <div className="bg-[#E5A83B] text-slate-950 rounded-2xl p-4.5 flex flex-col justify-between shadow-md">
              <span className="text-[11px] font-semibold text-slate-800 uppercase font-mono">
                Step 1
              </span>
              <div className="my-3">
                <h4 className="text-sm sm:text-base font-bold text-slate-950 leading-tight">
                  Chat app
                </h4>
              </div>
              <span className="text-[11px] font-medium text-slate-800">
                Live now
              </span>
            </div>

            {/* Step 2: Next */}
            <div className="bg-[#183F2E]/80 border border-emerald-500/20 text-white rounded-2xl p-4.5 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-emerald-300/80 uppercase font-mono">
                Step 2
              </span>
              <div className="my-3">
                <h4 className="text-sm sm:text-base font-bold text-white leading-tight">
                  SMS alerts
                </h4>
              </div>
              <span className="text-[11px] text-emerald-300/70">
                Next
              </span>
            </div>

            {/* Step 3: IVR / USSD */}
            <div className="bg-[#183F2E]/80 border border-emerald-500/20 text-white rounded-2xl p-4.5 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-emerald-300/80 uppercase font-mono">
                Step 3
              </span>
              <div className="my-3">
                <h4 className="text-sm sm:text-base font-bold text-white leading-tight">
                  IVR / USSD
                </h4>
              </div>
              <span className="text-[11px] text-emerald-300/70">
                No smartphone needed
              </span>
            </div>

            {/* Step 4: More states */}
            <div className="bg-[#183F2E]/80 border border-emerald-500/20 text-white rounded-2xl p-4.5 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-emerald-300/80 uppercase font-mono">
                Step 4
              </span>
              <div className="my-3">
                <h4 className="text-sm sm:text-base font-bold text-white leading-tight">
                  More states
                </h4>
              </div>
              <span className="text-[11px] text-emerald-300/70">
                More languages
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
