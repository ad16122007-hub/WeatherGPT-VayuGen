import React, { useState } from 'react';
import { X, Bell, CheckCircle2, Phone, MapPin, Sprout, MessageSquare, ShieldCheck } from 'lucide-react';
import { LocationInfo } from '../types/agritech';

interface AlertsSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationInfo;
  language: string;
}

export const AlertsSubscriptionModal: React.FC<AlertsSubscriptionModalProps> = ({
  isOpen,
  onClose,
  location,
  language,
}) => {
  const [villageName, setVillageName] = useState(location.name.split(',')[0]);
  const [phone, setPhone] = useState('');
  const [crop, setCrop] = useState('गेहूं (Wheat)');
  const [channel, setChannel] = useState<'whatsapp' | 'sms' | 'voice'>('whatsapp');
  const [subscribed, setSubscribed] = useState(false);
  const [alerts, setAlerts] = useState({
    heavyRain: true,
    heatwave: true,
    frost: true,
    hailstorm: true,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) return;
    setSubscribed(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF7EE] rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl border border-[#DDD5C0] text-slate-900 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-[#EFEAD8] text-slate-500 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {!subscribed ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E5A83B] text-slate-950 flex items-center justify-center shadow-md">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
                  खेत मौसम अलर्ट सदस्यता
                </h3>
                <p className="text-xs text-slate-600">
                  Set up heavy rain, heatwave & storm alerts for your village
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-6 bg-white p-3 rounded-xl border border-[#E5DFCE] leading-relaxed">
              मौसम विभाग (IMD) की आधिकारिक चेतावनी आपके खेत तक संकट आने से पहले पहुँचेगी।
              बिना स्मार्टफोन या इंटरनेट के भी SMS/WhatsApp पर तुरंत सूचना।
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Village/Location */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C27803]" />
                  <span>गांव / कस्बा (Village / Location)</span>
                </label>
                <input
                  type="text"
                  value={villageName}
                  onChange={(e) => setVillageName(e.target.value)}
                  required
                  placeholder="उदा: उज्जैन, देवास, बठिंडा, नागपुर..."
                  className="w-full bg-white border border-[#DDD5C0] rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#C27803]"
                />
              </div>

              {/* Crop */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                  <span>मुख्य फसल (Primary Crop)</span>
                </label>
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full bg-white border border-[#DDD5C0] rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#C27803]"
                >
                  <option value="गेहूं (Wheat)">गेहूं (Wheat)</option>
                  <option value="सोयाबीन (Soybean)">सोयाबीन (Soybean)</option>
                  <option value="कपास (Cotton)">कपास (Cotton)</option>
                  <option value="सरसों (Mustard)">सरसों (Mustard)</option>
                  <option value="धान / चावल (Paddy/Rice)">धान / चावल (Paddy/Rice)</option>
                  <option value="मक्का (Maize)">मक्का (Maize)</option>
                  <option value="आलू / प्याज (Vegetables)">आलू / प्याज (Vegetables)</option>
                </select>
              </div>

              {/* Mobile Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-600" />
                  <span>मोबाइल नंबर (WhatsApp / SMS)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  pattern="[0-9]{10}"
                  placeholder="10 अंकों का मोबाइल नंबर डालें (उदा: 9876543210)"
                  className="w-full bg-white border border-[#DDD5C0] rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#C27803]"
                />
              </div>

              {/* Channel Radio */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  अलर्ट प्राप्त करने का माध्यम (Delivery Method)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setChannel('whatsapp')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      channel === 'whatsapp'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-[#DDD5C0]'
                    }`}
                  >
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel('sms')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      channel === 'sms'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-[#DDD5C0]'
                    }`}
                  >
                    <span>SMS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel('voice')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      channel === 'voice'
                        ? 'bg-[#C27803] text-white border-[#C27803] shadow-sm'
                        : 'bg-white text-slate-700 border-[#DDD5C0]'
                    }`}
                  >
                    <span>IVR Call</span>
                  </button>
                </div>
              </div>

              {/* Alert Types Checklist */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  किन आपदाओं का अलर्ट चाहिए:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#DDD5C0] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alerts.heavyRain}
                      onChange={(e) => setAlerts({ ...alerts, heavyRain: e.target.checked })}
                      className="accent-[#C27803]"
                    />
                    <span>🌧️ भारी बारिश</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#DDD5C0] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alerts.heatwave}
                      onChange={(e) => setAlerts({ ...alerts, heatwave: e.target.checked })}
                      className="accent-[#C27803]"
                    />
                    <span>☀️ लू / भीषण गर्मी</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#DDD5C0] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alerts.frost}
                      onChange={(e) => setAlerts({ ...alerts, frost: e.target.checked })}
                      className="accent-[#C27803]"
                    />
                    <span>❄️ पाला / शीतलहर</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#DDD5C0] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alerts.hailstorm}
                      onChange={(e) => setAlerts({ ...alerts, hailstorm: e.target.checked })}
                      className="accent-[#C27803]"
                    />
                    <span>💨 आंधी व ओले</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3.5 bg-[#E5A83B] hover:bg-[#D99B26] active:scale-98 text-slate-950 font-bold text-sm rounded-full shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span>अलर्ट शुरू करें (Subscribe to Alerts)</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-serif font-bold text-slate-900">
              अलर्ट सक्रिय हो गया!
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
              बधाई हो! आपके नंबर <strong className="text-slate-900 font-bold">+91 {phone}</strong> पर{' '}
              <strong>{villageName}</strong> क्षेत्र के लिए {channel.toUpperCase()} मौसम अलर्ट शुरू कर दिए गए हैं।
            </p>

            {/* Sample Alert Preview */}
            <div className="bg-[#F8E7D8] border border-[#ECD1BA] rounded-2xl p-4 text-left text-xs space-y-1">
              <span className="text-[10px] font-bold text-[#A74116] uppercase tracking-wider block">
                नमूना अलर्ट (Sample Alert Message):
              </span>
              <p className="font-bold text-[#87320D]">
                ⚠️ [WeatherGPT अलर्ट - {villageName}]
              </p>
              <p className="text-slate-800 leading-relaxed">
                कल शाम भारी वर्षा की 75% संभावना है। {crop} की कटी हुई फसल को तुरंत सुरक्षित स्थान पर रखें
                और रासायनिक छिड़काव रोक दें। - स्रोत: IMD Official
              </p>
            </div>

            <button
              onClick={() => {
                setSubscribed(false);
                onClose();
              }}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-full transition"
            >
              ठीक है (Done)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
