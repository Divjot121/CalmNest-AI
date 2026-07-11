'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useSanctuaryTranslation, SupportedLanguage } from '@/lib/i18n/useSanctuaryTranslation';
import { PageTransition } from './PageTransition';
import { triggerGentleSanctuaryCelebration } from './SanctuaryConfetti';

interface SanctuaryWelcomeProps {
  onEnter: () => void;
  showLanguageSelectorOnly?: boolean;
}

export function SanctuaryWelcome({ onEnter, showLanguageSelectorOnly = false }: SanctuaryWelcomeProps) {
  const { t, currentLanguage, setLanguage } = useSanctuaryTranslation();
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(currentLanguage);
  const [breathingStep, setBreathingStep] = useState(0);

  useEffect(() => {
    setTimeout(() => setSelectedLang(currentLanguage), 0);
  }, [currentLanguage]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBreathingStep((prev) => (prev + 1) % 2);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleSelectLanguage = (lang: SupportedLanguage) => {
    setSelectedLang(lang);
    setLanguage(lang);
    triggerGentleSanctuaryCelebration('petals');
  };

  const handleContinue = () => {
    localStorage.setItem('calmnest_onboarded', 'true');
    triggerGentleSanctuaryCelebration('leaves');
    onEnter();
  };

  if (showLanguageSelectorOnly) {
    return (
      <PageTransition className="w-full max-w-lg mx-auto p-6">
        <div className="card-geometric text-center border-primary/20 shadow-xl bg-white/90 dark:bg-[#1A2027]/90 backdrop-blur-md">
          <div className="w-12 h-12 rounded-full bg-primary-subtle dark:bg-primary/20 text-primary flex items-center justify-center mx-auto mb-4 text-xl">
            🌿
          </div>
          <h2 className="text-2xl font-light text-slate-800 dark:text-slate-100 mb-2">
            {t('welcome.chooseLanguage')}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 font-light">
            {t('welcome.selectLanguageSubtitle')}
          </p>

          <div className="space-y-3">
            <LanguageButton
              code="en"
              label="English"
              nativeLabel="English (Default)"
              active={selectedLang === 'en'}
              onClick={() => handleSelectLanguage('en')}
            />
            <LanguageButton
              code="hi"
              label="Hindi"
              nativeLabel="हिन्दी (Devanagari)"
              active={selectedLang === 'hi'}
              onClick={() => handleSelectLanguage('hi')}
            />
            <LanguageButton
              code="pa"
              label="Punjabi"
              nativeLabel="ਪੰਜਾਬੀ (Gurmukhi)"
              active={selectedLang === 'pa'}
              onClick={() => handleSelectLanguage('pa')}
            />
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Soft animated background breathing circle */}
      <motion.div
        animate={{
          scale: breathingStep === 0 ? 1 : 1.15,
          opacity: breathingStep === 0 ? 0.35 : 0.55,
        }}
        transition={{ duration: 4.5, ease: 'easeInOut' }}
        className="absolute -z-10 w-96 h-96 rounded-full bg-gradient-to-tr from-[#8DA9B7]/40 via-[#6B907B]/30 to-[#8D80A9]/30 blur-3xl"
      />

      <PageTransition className="w-full max-w-xl mx-auto text-center space-y-8">
        {/* Emblem & Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="space-y-4"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/80 dark:bg-[#1A2027]/80 shadow-md border border-white/60 dark:border-slate-800 mb-2">
            <span className="text-4xl animate-pulse">🕊️</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-light text-slate-800 dark:text-slate-100 tracking-wide">
            {t('welcome.title')}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 font-light max-w-md mx-auto leading-relaxed">
            {t('welcome.subtitle')}
          </p>
        </motion.div>

        {/* Language Selection Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="card-geometric bg-white/90 dark:bg-[#1A2027]/90 backdrop-blur-xl border border-slate-100/80 dark:border-slate-800/80 p-8 shadow-xl text-left"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">
                {t('welcome.chooseLanguage')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('welcome.selectLanguageSubtitle')}
              </p>
            </div>
            <span className="text-xl">🌐</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <LanguageCard
              code="en"
              label="English"
              nativeLabel="English"
              active={selectedLang === 'en'}
              onClick={() => handleSelectLanguage('en')}
            />
            <LanguageCard
              code="hi"
              label="Hindi"
              nativeLabel="हिन्दी"
              active={selectedLang === 'hi'}
              onClick={() => handleSelectLanguage('hi')}
            />
            <LanguageCard
              code="pa"
              label="Punjabi"
              nativeLabel="ਪੰਜਾਬੀ"
              active={selectedLang === 'pa'}
              onClick={() => handleSelectLanguage('pa')}
            />
          </div>
        </motion.div>

        {/* Enter Sanctuary Action */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="pt-2"
        >
          <button
            onClick={handleContinue}
            className="btn-primary mx-auto w-full max-w-sm py-4 text-base shadow-lg shadow-primary/30 hover:scale-[1.01] transition-transform"
          >
            <span>🌿</span>
            <span>{t('welcome.continue')}</span>
          </button>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 italic font-light">
            &ldquo;{t('welcome.dailyAffirmation')}&rdquo;
          </p>
        </motion.div>
      </PageTransition>
    </div>
  );
}

function LanguageButton({
  code,
  label,
  nativeLabel,
  active,
  onClick,
}: {
  code: string;
  label: string;
  nativeLabel: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full py-3.5 px-5 rounded-2xl flex items-center justify-between border transition-all duration-300 ${
        active
          ? 'bg-primary-subtle dark:bg-primary/25 border-primary text-slate-900 dark:text-white font-medium shadow-sm'
          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm uppercase tracking-wider px-2 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-mono text-xs">
          {code}
        </span>
        <span className="text-base">{nativeLabel}</span>
      </div>
      {active && <span className="text-primary dark:text-[#A1C2D4] text-lg">✓</span>}
    </button>
  );
}

function LanguageCard({
  code,
  label,
  nativeLabel,
  active,
  onClick,
}: {
  code: string;
  label: string;
  nativeLabel: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center transition-all duration-300 ${
        active
          ? 'bg-primary text-white border-primary shadow-md shadow-primary/25 scale-[1.02]'
          : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <span className={`text-xl font-medium mb-1 ${active ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
        {nativeLabel}
      </span>
      <span className={`text-xs ${active ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
        {label}
      </span>
    </button>
  );
}
