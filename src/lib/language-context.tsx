'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { SupportedLanguage } from '@/types';
import { translations } from './translations';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    // Initialize language from localStorage on client
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('preferredLanguage') as SupportedLanguage;
      if (savedLanguage && translations[savedLanguage]) {
        return savedLanguage;
      }
      // Try to detect browser language
      const browserLang = navigator.language.split('-')[0] as SupportedLanguage;
      if (translations[browserLang]) {
        return browserLang;
      }
    }
    return 'en';
  });
  // Save language preference to localStorage
  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('preferredLanguage', lang);
  };

  // Translation function
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

