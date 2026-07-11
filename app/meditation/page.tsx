'use client';

import React, { useEffect } from 'react';
import AppSidebar from '@/components/AppSidebar';
import { BreathingExercise } from '@/components/BreathingExercise';
import { AmbiencePlayer } from '@/components/AmbiencePlayer';
import { PageTransition } from '@/components/PageTransition';
import { useSanctuaryTranslation } from '@/lib/i18n/useSanctuaryTranslation';
import { ChevronLeft, Compass } from 'lucide-react';
import Link from 'next/link';
import { useAmbientSoundStore } from '@/store/useAmbientSoundStore';
import SEO from '@/components/SEO';

export default function MeditationStudioPage() {
  const { t } = useSanctuaryTranslation();

  useEffect(() => {
    useAmbientSoundStore.getState().triggerRecommendation('meditation');
  }, []);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://calmnest.vercel.app"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Meditation Studio",
        "item": "https://calmnest.vercel.app/meditation"
      }
    ]
  };

  return (
    <AppSidebar>
      <SEO
        title="Breathing & Soundscape Studio | CalmNest"
        description="Relax with interactive box breathing, 4-7-8 deep breathing exercises, and high-fidelity custom ambient sound mixes."
        schema={breadcrumbSchema}
      />
      <PageTransition className="p-4 sm:p-6 md:p-8 space-y-6 max-w-4xl mx-auto bg-[#FAF9F6] dark:bg-[#16181D] min-h-screen transition-colors duration-300">
        {/* Sanctuary Studio Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-[#2B2F38]">
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard" 
              className="p-2 hover:bg-slate-100 dark:hover:bg-[#252932] rounded-xl transition-colors text-slate-600 dark:text-slate-300"
              aria-label="Back to dashboard"
            >
              <ChevronLeft size={20} strokeWidth={1.75} />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-[#6B907B] text-white flex items-center justify-center shadow-2xs">
              <Compass size={20} strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="badge-emerald text-[11px] py-0.5 px-2.5">🍃 {t('breathing.title') || 'Meditation & Breathing'}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-slate-900 dark:text-slate-100">
                Breathing & Soundscape Studio
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              {t('breathing.subtitle') || 'Calm your nervous system in minutes'}
            </span>
          </div>
        </div>

        {/* Ambient Soundscape Engine Section */}
        <div className="space-y-2">
          <AmbiencePlayer />
        </div>

        {/* Main Lotus Guided Breathing Exercise */}
        <div className="py-2">
          <BreathingExercise />
        </div>

        {/* Supportive Affirmation Footer */}
        <div className="text-center py-6 max-w-lg mx-auto">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-normal leading-relaxed">
            Take as long as you need. When you slow your breath, your heart rate follows, reminding your nervous system that you are safe in this exact moment.
          </p>
        </div>
      </PageTransition>
    </AppSidebar>
  );
}
