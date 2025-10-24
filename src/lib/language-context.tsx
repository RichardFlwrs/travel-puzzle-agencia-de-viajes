'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLanguage } from '@/types';
import { translations } from './translations';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [isClient, setIsClient] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize language from localStorage on client
  useEffect(() => {
    setIsClient(true);
    const savedLanguage = localStorage.getItem('preferredLanguage') as SupportedLanguage;
    if (savedLanguage && translations[savedLanguage]) {
      setLanguageState(savedLanguage);
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.split('-')[0] as SupportedLanguage;
      if (translations[browserLang]) {
        setLanguageState(browserLang);
      }
    }
    setMounted(true);
  }, []);

  // Save language preference to localStorage
  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (isClient) {
      localStorage.setItem('preferredLanguage', lang);
    }
  };

  // Translation function
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ language: 'en', setLanguage: () => {}, t: (key: string) => key }}>
        {children}
      </LanguageContext.Provider>
    );
  }

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

