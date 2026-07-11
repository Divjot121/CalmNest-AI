'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSanctuaryTranslation } from '@/lib/i18n/useSanctuaryTranslation';
import { triggerGentleSanctuaryCelebration } from './SanctuaryConfetti';
import { Play, Pause, Sparkles, Leaf } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { saveWellnessSession } from '@/lib/db-service';

export type BreathingTechnique = 'box' | '478' | 'deep' | 'relaxation';

interface TechniqueInfo {
  id: BreathingTechnique;
  labelKey: string;
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
  color: string;
}

const TECHNIQUES: TechniqueInfo[] = [
  { id: 'box', labelKey: 'breathing.techniques.box', inhale: 4, holdIn: 4, exhale: 4, holdOut: 4, color: '#8DA9B7' },
  { id: '478', labelKey: 'breathing.techniques.478', inhale: 4, holdIn: 7, exhale: 8, holdOut: 0, color: '#8D80A9' },
  { id: 'deep', labelKey: 'breathing.techniques.deep', inhale: 5, holdIn: 0, exhale: 5, holdOut: 0, color: '#6B907B' },
  { id: 'relaxation', labelKey: 'breathing.techniques.relaxation', inhale: 4, holdIn: 0, exhale: 6, holdOut: 0, color: '#6FA4AD' },
];

function resolveDefaultTechnique(rhythm?: string): TechniqueInfo {
  if (rhythm === '4-7-8') return TECHNIQUES[1]; // 478
  if (rhythm === 'coherent') return TECHNIQUES[2]; // deep (5.5s in/out ≈ coherent)
  return TECHNIQUES[0]; // box
}
export function BreathingExercise({ onComplete }: { onComplete?: () => void }) {
  const { t } = useSanctuaryTranslation();
  const { user } = useAuthStore();
  const { preferences } = useSettingsStore();
  const defaultTech = resolveDefaultTechnique(preferences.defaultBreathingRhythm);
  const [selectedTech, setSelectedTech] = useState<TechniqueInfo>(defaultTech);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'holdIn' | 'exhale' | 'holdOut'>('inhale');
  const [secondsLeft, setSecondsLeft] = useState(defaultTech.inhale);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [activeSeconds, setActiveSeconds] = useState(0);

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([15]);
      } catch (e) {}
    }
  };

  // Track session duration and save when active state stops or unmounts
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive) {
      timer = setInterval(() => {
        setActiveSeconds(s => s + 1);
      }, 1000);
    } else {
      if (activeSeconds >= 3 && user?.id) {
        saveWellnessSession(user.id, {
          type: 'BREATHING',
          subType: selectedTech.id,
          duration: activeSeconds,
          completed: cyclesCompleted >= 1
        }).catch(err => console.warn("Failed to log breathing session:", err));
      }
      setTimeout(() => {
        setActiveSeconds(0);
      }, 0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, user?.id, selectedTech.id, cyclesCompleted, activeSeconds]);

  useEffect(() => {
    if (!isActive) {
      setTimeout(() => {
        setPhase('inhale');
        setSecondsLeft(selectedTech.inhale);
      }, 0);
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        triggerHaptic();
        if (phase === 'inhale') {
          if (selectedTech.holdIn > 0) {
            setPhase('holdIn');
            return selectedTech.holdIn;
          } else {
            setPhase('exhale');
            return selectedTech.exhale;
          }
        } else if (phase === 'holdIn') {
          setPhase('exhale');
          return selectedTech.exhale;
        } else if (phase === 'exhale') {
          if (selectedTech.holdOut > 0) {
            setPhase('holdOut');
            return selectedTech.holdOut;
          } else {
            setPhase('inhale');
            setCyclesCompleted((c) => {
              const next = c + 1;
              if (next === 3) triggerGentleSanctuaryCelebration('petals');
              if (onComplete) onComplete();
              return next;
            });
            return selectedTech.inhale;
          }
        } else {
          setPhase('inhale');
          setCyclesCompleted((c) => {
            const next = c + 1;
            if (next === 3) triggerGentleSanctuaryCelebration('petals');
            if (onComplete) onComplete();
            return next;
          });
          return selectedTech.inhale;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, phase, selectedTech, onComplete]);

  const handleSelectTechnique = (tech: TechniqueInfo) => {
    setSelectedTech(tech);
    setIsActive(false);
    setPhase('inhale');
    setSecondsLeft(tech.inhale);
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale': return t('breathing.inhale') || 'Breathe In';
      case 'holdIn': return t('breathing.hold') || 'Hold Breath';
      case 'exhale': return t('breathing.exhale') || 'Breathe Out';
      case 'holdOut': return t('breathing.hold') || 'Rest & Pause';
    }
  };

  const getTargetScale = () => {
    if (!isActive) return 1;
    if (phase === 'inhale') return 1.35;
    if (phase === 'holdIn') return 1.35;
    if (phase === 'exhale') return 0.85;
    return 0.85;
  };

  const getPhaseDuration = () => {
    switch (phase) {
      case 'inhale': return selectedTech.inhale;
      case 'holdIn': return selectedTech.holdIn;
      case 'exhale': return selectedTech.exhale;
      case 'holdOut': return selectedTech.holdOut;
    }
  };

  return (
    <div className="card-minimal flex flex-col items-center justify-center p-6 sm:p-10 select-none">
      <div className="text-center mb-6 max-w-md">
        <span className="badge-blue mb-2 font-mono text-[11px]">🍃 Mindfulness Rhythm</span>
        <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100">
          Guided Lotus Breathing Studio
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          Select a rhythm below. Follow the gentle movement to sync your nervous system with calmness.
        </p>
      </div>

      {/* Technique Selector Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {TECHNIQUES.map((tech) => (
          <button
            key={tech.id}
            onClick={() => handleSelectTechnique(tech)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              selectedTech.id === tech.id
                ? 'bg-primary text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-[#16181D] border border-slate-200/70 dark:border-[#2B2F38] text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-[#252932]'
            }`}
          >
            {t(tech.labelKey) || tech.id.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Visualizer Circle / Lotus */}
      <div className="relative w-64 h-64 mx-auto flex items-center justify-center my-4">
        {/* Outer subtle anchor ring */}
        <div className="absolute inset-0 rounded-full border border-slate-200/80 dark:border-[#2B2F38]" />

        {/* Middle breathing expansion circle */}
        <motion.div
          animate={{
            scale: getTargetScale(),
          }}
          transition={{
            duration: isActive ? getPhaseDuration() : 0.8,
            ease: phase === 'inhale' || phase === 'exhale' ? 'easeInOut' : 'linear',
          }}
          className="w-52 h-52 rounded-full border border-dashed border-primary/40 dark:border-primary-light/30 flex items-center justify-center bg-slate-50/90 dark:bg-[#16181D]/90 shadow-2xs"
        >
          {/* Inner lotus core */}
          <motion.div
            animate={{
              scale: getTargetScale() * 0.9,
              rotate: isActive ? 360 : 0,
            }}
            transition={{
              scale: { duration: isActive ? getPhaseDuration() : 0.8, ease: 'easeInOut' },
              rotate: { duration: 30, repeat: Infinity, ease: 'linear' },
            }}
            className="w-36 h-36 rounded-full bg-primary-subtle dark:bg-primary/20 flex flex-col items-center justify-center p-4 border border-primary/20 dark:border-primary/40"
          >
            <span className="text-2xl mb-1">{isActive ? '🪷' : '🍃'}</span>
            <span className="text-xs font-medium text-slate-800 dark:text-slate-100 tracking-tight">
              {isActive ? getPhaseText() : (t('breathing.start') || 'Ready')}
            </span>
            {isActive && (
              <span className="text-xl font-medium font-mono text-primary dark:text-[#A1C2D4] mt-0.5">
                {secondsLeft}s
              </span>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-col items-center gap-3 mt-6">
        <button
          onClick={() => {
            if (!isActive) {
              setIsActive(true);
              triggerHaptic();
            } else {
              setIsActive(false);
            }
          }}
          className={`btn-primary px-8 py-3 text-sm min-w-[150px] ${
            isActive ? 'bg-slate-700 hover:bg-slate-800 dark:bg-slate-600' : 'bg-primary hover:bg-[#4B6F82]'
          }`}
        >
          {isActive ? <Pause size={16} strokeWidth={1.75} /> : <Play size={16} strokeWidth={1.75} />}
          <span>{isActive ? (t('breathing.pause') || 'Pause Rhythm') : (t('breathing.start') || 'Begin Rhythm')}</span>
        </button>

        {cyclesCompleted > 0 && (
          <p className="text-xs font-mono text-[#6B907B] dark:text-[#A8C8B5] mt-1">
            ✨ {cyclesCompleted} calming {cyclesCompleted === 1 ? 'cycle' : 'cycles'} completed today
          </p>
        )}
      </div>
    </div>
  );
}
