'use client';

import { useState, useEffect, useCallback } from 'react';
import en from './locales/en.json';
import hi from './locales/hi.json';
import pa from './locales/pa.json';

export type SupportedLanguage = 'en' | 'hi' | 'pa';

const dictionaries: Record<SupportedLanguage, any> = {
  en,
  hi,
  pa
};

export function useSanctuaryTranslation() {
  const [currentLanguage, setCurrentLangState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    // Load persisted language preference
    const saved = localStorage.getItem('calmnest_language') as SupportedLanguage;
    if (saved && dictionaries[saved]) {
      setTimeout(() => setCurrentLangState(saved), 0);
    }

    // Listen for instant language updates across components
    const handleLangChange = (e: CustomEvent<{ language: SupportedLanguage }>) => {
      if (e.detail?.language && dictionaries[e.detail.language]) {
        setCurrentLangState(e.detail.language);
      }
    };

    window.addEventListener('sanctuary-language-change' as any, handleLangChange);
    return () => window.removeEventListener('sanctuary-language-change' as any, handleLangChange);
  }, []);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    if (!dictionaries[lang]) return;
    localStorage.setItem('calmnest_language', lang);
    setCurrentLangState(lang);
    window.dispatchEvent(new CustomEvent('sanctuary-language-change', { detail: { language: lang } }));
  }, []);

  const t = useCallback((path: string): string => {
    const keys = path.split('.');
    let current: any = dictionaries[currentLanguage] || dictionaries.en;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English if key missing in current dict
        let fallback: any = dictionaries.en;
        for (const k of keys) {
          if (fallback && typeof fallback === 'object' && k in fallback) {
            fallback = fallback[k];
          } else {
            return path;
          }
        }
        return typeof fallback === 'string' ? fallback : path;
      }
    }
    return typeof current === 'string' ? current : path;
  }, [currentLanguage]);

  return {
    t,
    currentLanguage,
    setLanguage
  };
}
