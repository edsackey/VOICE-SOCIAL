
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale } from '../types';
import { getTranslation } from '../services/i18n';

interface LocaleContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  formatCurrency: (amount: number, currency: string) => string;
  isBilingual: boolean;
  setIsBilingual: (val: boolean) => void;
  selectedVoice: string;
  setSelectedVoice: (v: string) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem('vs_locale');
    return (saved as Locale) || 'en';
  });

  const [isBilingual, setIsBilingual] = useState<boolean>(() => {
    const saved = localStorage.getItem('vs_bilingual_mode');
    return saved === 'true';
  });

  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    return localStorage.getItem('vs_voice') || 'Zephyr';
  });

  useEffect(() => {
    localStorage.setItem('vs_locale', locale);
  }, [locale]);

  useEffect(() => {
    localStorage.setItem('vs_bilingual_mode', isBilingual.toString());
  }, [isBilingual]);

  useEffect(() => {
    localStorage.setItem('vs_voice', selectedVoice);
  }, [selectedVoice]);

  const t = (key: string) => getTranslation(key, locale);

  const formatCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat(locale === 'en' ? 'en-US' : locale === 'fr' ? 'fr-FR' : 'es-ES', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch (e) {
      return `${currency} ${amount.toLocaleString()}`;
    }
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, formatCurrency, isBilingual, setIsBilingual, selectedVoice, setSelectedVoice }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within a LocaleProvider');
  return context;
};
