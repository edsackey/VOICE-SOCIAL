
import React from 'react';
import { Locale } from '../types';

const LANGUAGES: { code: Locale; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'tw', name: 'Twi', flag: '🇬🇭' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
  { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
  { code: 'zu', name: 'Zulu', flag: '🇿🇦' },
  { code: 'am', name: 'Amharic', flag: '🇪🇹' },
  { code: 'wo', name: 'Wolof', flag: '🇸🇳' },
];

interface TranslationLangSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLang: Locale;
  onSelect: (lang: Locale) => void;
}

const TranslationLangSelector: React.FC<TranslationLangSelectorProps> = ({ isOpen, onClose, selectedLang, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-sm bg-secondary rounded-[40px] shadow-2xl border border-white/10 flex flex-col max-h-[70vh] animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black text-main uppercase tracking-widest">AI Translation Target</h3>
            <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Abena Engine Adaptation</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-muted">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar grid grid-cols-1 gap-2">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => { onSelect(lang.code); onClose(); }}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${selectedLang === lang.code ? 'bg-accent text-white shadow-lg' : 'hover:bg-white/5 text-muted'}`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="text-xs font-black uppercase tracking-widest">{lang.name}</span>
              {selectedLang === lang.code && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>
        
        <div className="p-6 bg-main/20 text-center">
           <p className="text-[8px] text-muted font-black uppercase tracking-[0.3em]">Neural Localization Active</p>
        </div>
      </div>
    </div>
  );
};

export default TranslationLangSelector;
