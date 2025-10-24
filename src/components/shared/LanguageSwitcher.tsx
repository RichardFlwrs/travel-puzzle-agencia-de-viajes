'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/language-context';
import { SupportedLanguage } from '@/types';

const languages = [
  { code: 'en' as SupportedLanguage, label: 'EN', flag: '🇬🇧', name: 'English' },
  { code: 'es' as SupportedLanguage, label: 'ES', flag: '🇪🇸', name: 'Español' },
  { code: 'pt' as SupportedLanguage, label: 'PT', flag: '🇵🇹', name: 'Português' },
  { code: 'de' as SupportedLanguage, label: 'DE', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'fr' as SupportedLanguage, label: 'FR', flag: '🇫🇷', name: 'Français' },
  { code: 'it' as SupportedLanguage, label: 'IT', flag: '🇮🇹', name: 'Italiano' },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(l => l.code === language) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <span className="text-xl">{currentLanguage.flag}</span>
        <span className="font-medium text-sm">{currentLanguage.label}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 py-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50">
          {languages.map(({ code, label, flag, name }) => (
            <button
              key={code}
              onClick={() => {
                setLanguage(code);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3 transition-colors ${
                language === code ? 'bg-muted font-semibold' : ''
              }`}
            >
              <span className="text-xl">{flag}</span>
              <div className="flex flex-col">
                <span className="text-sm">{name}</span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              {language === code && (
                <svg className="w-4 h-4 ml-auto text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

