'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLanguage } from '@/types';
import { translations } from './translations';
import { LoadingPage } from '@/components/shared/LoadingPage';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  isInitialized: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always start with 'en' to match server-side rendering
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  // After hydration, detect and set the correct language
  useEffect(() => {
    // Check localStorage first
    const savedLanguage = localStorage.getItem('preferredLanguage') as SupportedLanguage;
    if (savedLanguage && translations[savedLanguage]) {
      // eslint-disable-next-line
      setLanguageState(savedLanguage);
      // Small delay to ensure content is ready
      setTimeout(() => setIsInitialized(true), 100);
      return;
    }

    // Detect browser language
    const browserLang = navigator.language.split('-')[0] as SupportedLanguage;
    if (translations[browserLang]) {
      setLanguageState(browserLang);
      localStorage.setItem('preferredLanguage', browserLang);
    }

    // Mark as initialized after language detection
    setTimeout(() => setIsInitialized(true), 100);
  }, []);

  // Save language preference to localStorage
  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', lang);
    }
  };

  // Translation function
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isInitialized }}>
      <LoadingPage isLoading={!isInitialized} />
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

