
import React from 'react';
import { useLocale } from './LocaleContext';
import { Locale } from '../types';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' }
];

const VOICES = [
  { id: 'Zephyr', description: 'Professional, neutral and clear.', icon: '🎙️' },
  { id: 'Puck', description: 'Energetic, youthful and bright.', icon: '⚡' },
  { id: 'Charon', description: 'Deep, resonant and calm.', icon: '🌊' },
  { id: 'Kore', description: 'Warm, friendly and inviting.', icon: '☀️' },
];

interface LanguagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLanguage: string; // This remains for legacy transcription target if needed
  onSelectLanguage: (lang: string) => void;
  isVoiceEnabled: boolean;
  onToggleVoice: (enabled: boolean) => void;
  selectedVoice: string;
  onSelectVoice: (voice: string) => void;
  isBilingualEnabled: boolean;
  onToggleBilingual: (enabled: boolean) => void;
}

const LanguagePicker: React.FC<LanguagePickerProps> = ({ 
  isOpen, 
  onClose, 
  onSelectLanguage,
  isVoiceEnabled,
  onToggleVoice,
  selectedVoice,
  onSelectVoice,
  isBilingualEnabled,
  onToggleBilingual
}) => {
  const { locale, setLocale } = useLocale();

  if (!isOpen) return null;

  const handleLocaleSwitch = (l: Locale, name: string) => {
    setLocale(l);
    onSelectLanguage(name); // Sync transcription target
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-md px-4" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-[#f7f3e9] rounded-[56px] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-white flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8 shrink-0">
           <div>
             <h3 className="font-black text-gray-900 uppercase tracking-tight text-xl">Global Settings</h3>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Interface & AI Voice</p>
           </div>
           <button onClick={onClose} className="p-3 bg-white rounded-full text-gray-400 hover:text-gray-600 shadow-sm transition-all active:scale-90 border border-gray-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto space-y-10 pr-2 custom-scrollbar">
          {/* Interface Language Selection */}
          <section>
            <div className="flex items-center gap-3 mb-4 ml-2">
              <div className="w-6 h-[2px] bg-indigo-500 rounded-full" />
              <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em]">Language</h4>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleLocaleSwitch(lang.code as Locale, lang.name)}
                  className={`px-5 py-4 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all flex justify-between items-center border-2 ${
                    locale === lang.code 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' 
                    : 'bg-white text-gray-500 border-white hover:border-indigo-50 shadow-sm'
                  }`}
                >
                  {lang.name}
                  {locale === lang.code && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Voice Settings Section */}
          <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl transition-all ${isVoiceEnabled ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-100 text-gray-400'}`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 uppercase tracking-tight">AI Voice Reader</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Read translations aloud</p>
                    </div>
                </div>
                <button 
                  onClick={() => onToggleVoice(!isVoiceEnabled)}
                  className={`w-14 h-8 rounded-full transition-all relative ${isVoiceEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${isVoiceEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl transition-all ${isBilingualEnabled ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'bg-gray-100 text-gray-400'}`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5c.343 3.395-1.442 6.55-4.339 8.163m3.588-8.163A18.022 18.022 0 016.412 9m0 0H2" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Bilingual Voice</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Play Original + Translation</p>
                    </div>
                </div>
                <button 
                  onClick={() => onToggleBilingual(!isBilingualEnabled)}
                  className={`w-14 h-8 rounded-full transition-all relative ${isBilingualEnabled ? 'bg-orange-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${isBilingualEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            {isVoiceEnabled && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500 pt-6 border-t border-gray-50">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Select Voice Character</h4>
                <div className="space-y-3">
                  {VOICES.map(voice => (
                    <button
                      key={voice.id}
                      onClick={() => onSelectVoice(voice.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-[28px] border-2 transition-all ${
                        selectedVoice === voice.id 
                        ? 'bg-indigo-50/50 border-indigo-600' 
                        : 'bg-gray-50 border-transparent hover:border-gray-200'
                      }`}
                    >
                      <span className="text-2xl drop-shadow-sm">{voice.icon}</span>
                      <div className="text-left flex-1">
                        <p className={`text-xs font-black uppercase tracking-tight ${selectedVoice === voice.id ? 'text-indigo-600' : 'text-gray-900'}`}>{voice.id}</p>
                        <p className="text-[9px] text-gray-500 font-medium leading-tight">{voice.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default LanguagePicker;
