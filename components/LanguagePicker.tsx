
import React, { useState } from 'react';
import { useLocale } from './LocaleContext';
import { Locale } from '../types';
import { previewVoice } from '../services/geminiService';
import { decode, decodeAudioData } from '../services/audioUtils';

const LANGUAGES: { code: Locale; name: string; flag: string; region: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧', region: 'Global' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', region: 'Europe/Africa' },
  { code: 'es', name: 'Español', flag: '🇪🇸', region: 'Europe/LatAm' },
  { code: 'pt', name: 'Português', flag: '🇵🇹', region: 'Global' },
  { code: 'zh', name: 'Chinese (Mandarin)', flag: '🇨🇳', region: 'Asia' },
  { code: 'tw', name: 'Twi', flag: '🇬🇭', region: 'West Africa' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪', region: 'East Africa' },
  { code: 'yo', name: 'Yoruba', flag: '🇳🇬', region: 'West Africa' },
  { code: 'zu', name: 'Zulu', flag: '🇿🇦', region: 'South Africa' },
  { code: 'am', name: 'Amharic', flag: '🇪🇹', region: 'Horn of Africa' },
  { code: 'wo', name: 'Wolof', flag: '🇸🇳', region: 'West Africa' },
];

const VOICES = [
  { id: 'Puck', label: 'Puck', desc: 'Energetic & Youthful' },
  { id: 'Charon', label: 'Charon', desc: 'Calm & Intellectual' },
  { id: 'Kore', label: 'Kore', desc: 'Warm & Encouraging' },
  { id: 'Fenrir', label: 'Fenrir', desc: 'Deep & Commanding' },
  { id: 'Zephyr', label: 'Zephyr', desc: 'Friendly & Versatile' },
];

interface LanguagePickerProps {
  isOpen: boolean;
  onClose: () => void;
}

const LanguagePicker: React.FC<LanguagePickerProps> = ({ isOpen, onClose }) => {
  const { locale, setLocale, isBilingual, setIsBilingual, selectedVoice, setSelectedVoice } = useLocale();
  const [isPreviewing, setIsPreviewing] = useState(false);

  if (!isOpen) return null;

  const handlePreview = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPreviewing) return;
    setIsPreviewing(true);
    
    try {
      const audioBase64 = await previewVoice(selectedVoice);
      if (audioBase64) {
        const audioCtx = new AudioContext({ sampleRate: 24000 });
        const buffer = await decodeAudioData(decode(audioBase64), audioCtx, 24000, 1);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start();
        source.onended = () => setIsPreviewing(false);
      } else {
        setIsPreviewing(false);
      }
    } catch (err) {
      console.error(err);
      setIsPreviewing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-xl px-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-secondary rounded-[60px] p-10 shadow-2xl border border-white/10 flex flex-col max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8 shrink-0">
           <div>
             <h3 className="font-black text-main uppercase tracking-tighter text-3xl">Linguistic Hub</h3>
             <p className="text-[10px] text-muted font-black uppercase tracking-[0.4em] mt-1">Native Language & AI Voice Selection</p>
           </div>
           <button onClick={onClose} className="p-4 bg-white/5 rounded-full text-muted hover:text-white transition-all active:scale-90 border border-white/5">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-10">
          {/* Language Selection Grid */}
          <section>
            <h4 className="text-[10px] font-black text-accent uppercase tracking-widest mb-4 px-2">Primary Dialect</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => { setLocale(lang.code); }}
                  className={`group p-6 rounded-[32px] transition-all flex items-center gap-5 border-2 ${
                    locale === lang.code 
                    ? 'bg-accent border-accent text-white shadow-2xl shadow-accent/20' 
                    : 'bg-main/40 border-white/5 text-muted hover:border-accent/50'
                  }`}
                >
                  <span className="text-4xl filter grayscale-0 group-hover:scale-110 transition-transform">{lang.flag}</span>
                  <div className="text-left">
                    <p className="text-sm font-black uppercase tracking-widest">{lang.name}</p>
                    <p className={`text-[9px] font-bold uppercase tracking-tighter ${locale === lang.code ? 'text-white/60' : 'text-muted/60'}`}>{lang.region}</p>
                  </div>
                  {locale === lang.code && (
                    <div className="ml-auto w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* AI Voice Selection */}
          <section className="bg-main/30 p-8 rounded-[40px] border border-white/5">
            <div className="flex items-center justify-between mb-6">
               <h4 className="text-[10px] font-black text-accent uppercase tracking-widest px-2">Neural Co-Host Voice</h4>
               <button 
                onClick={handlePreview}
                disabled={isPreviewing}
                className={`bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2 transition-all hover:bg-white/10 ${isPreviewing ? 'opacity-50 cursor-default' : ''}`}
               >
                 <svg className={`w-3 h-3 text-accent ${isPreviewing ? 'animate-pulse' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                 <span className="text-[9px] font-black uppercase tracking-widest text-main">Preview Voice</span>
               </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {VOICES.map(voice => (
                 <button
                   key={voice.id}
                   onClick={() => setSelectedVoice(voice.id)}
                   className={`p-6 rounded-[32px] border-2 transition-all text-left ${selectedVoice === voice.id ? 'bg-accent/10 border-accent' : 'bg-secondary border-transparent hover:border-white/10'}`}
                 >
                    <div className="flex justify-between items-center mb-1">
                      <p className={`text-xs font-black uppercase tracking-widest ${selectedVoice === voice.id ? 'text-accent' : 'text-main'}`}>{voice.label}</p>
                      {selectedVoice === voice.id && <div className="w-2 h-2 bg-accent rounded-full shadow-[0_0_10px_var(--accent)]" />}
                    </div>
                    <p className="text-[9px] text-muted font-bold uppercase tracking-tighter">{voice.desc}</p>
                 </button>
               ))}
            </div>
          </section>

          {/* Bilingual Mode Toggle */}
          <section className="pb-10">
            <div className={`p-6 rounded-[32px] border transition-all flex items-center justify-between gap-6 ${isBilingual ? 'bg-accent/10 border-accent/20' : 'bg-white/5 border-white/5'}`}>
              <div className="flex items-center gap-6">
                <div className={`p-4 rounded-2xl text-white transition-colors ${isBilingual ? 'bg-accent' : 'bg-muted'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                </div>
                <div>
                  <p className={`text-xs font-black uppercase tracking-widest ${isBilingual ? 'text-accent' : 'text-muted'}`}>Bilingual Pulse Mode</p>
                  <p className="text-[10px] text-muted font-medium">Sequential original & translated audio for max clarity.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsBilingual(!isBilingual)}
                className={`w-14 h-8 rounded-full relative transition-all shadow-inner ${isBilingual ? 'bg-accent' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all ${isBilingual ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </section>
        </div>

        <div className="mt-4 pt-6 border-t border-white/5 text-center shrink-0">
           <p className="text-[9px] text-muted font-black uppercase tracking-[0.4em]">Global Connectivity Layer Enabled</p>
        </div>
      </div>
    </div>
  );
};

export default LanguagePicker;
