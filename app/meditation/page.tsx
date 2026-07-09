'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  Heart,
  Wind,
  ShieldCheck,
  Clock
} from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';

type BreathingPattern = 'BOX' | '478' | 'CALM';

const patterns = {
  BOX: { name: 'Box Breathing (4-4-4-4)', inhale: 4, holdIn: 4, exhale: 4, holdOut: 4, desc: 'Used by Navy SEALs to instantly reduce stress and regain mental focus under pressure.' },
  '478': { name: '4-7-8 Deep Relaxation', inhale: 4, holdIn: 7, exhale: 8, holdOut: 0, desc: 'Dr. Andrew Weil’s natural tranquilizer for the nervous system to fall asleep fast.' },
  CALM: { name: 'Simple Coherent Breathing', inhale: 5, holdIn: 0, exhale: 5, holdOut: 0, desc: 'Balances heart rate variability and activates the parasympathetic calming response.' }
};

export default function MeditationStudioPage() {
  const [patternKey, setPatternKey] = useState<BreathingPattern>('BOX');
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Pause'>('Inhale');
  const [countdown, setCountdown] = useState(4);
  const [sessionTime, setSessionTime] = useState(300); // 5 minutes in sec
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundType, setSoundType] = useState<'pink' | 'rain' | 'ocean'>('pink');
  const [completedSession, setCompletedSession] = useState(false);

  // Web Audio Context for synthesizer
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  const currentPattern = patterns[patternKey];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            setCompletedSession(true);
            stopAudio();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeRemaining]);

  useEffect(() => {
    let phaseInterval: NodeJS.Timeout;
    if (isActive) {
      phaseInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev > 1) return prev - 1;

          // Transition to next phase
          if (phase === 'Inhale') {
            if (currentPattern.holdIn > 0) {
              setPhase('Hold');
              return currentPattern.holdIn;
            } else {
              setPhase('Exhale');
              return currentPattern.exhale;
            }
          } else if (phase === 'Hold') {
            setPhase('Exhale');
            return currentPattern.exhale;
          } else if (phase === 'Exhale') {
            if (currentPattern.holdOut > 0) {
              setPhase('Pause');
              return currentPattern.holdOut;
            } else {
              setPhase('Inhale');
              return currentPattern.inhale;
            }
          } else {
            setPhase('Inhale');
            return currentPattern.inhale;
          }
        });
      }, 1000);
    }
    return () => clearInterval(phaseInterval);
  }, [isActive, phase, currentPattern]);

  const toggleSession = () => {
    if (!isActive) {
      setIsActive(true);
      setCompletedSession(false);
      if (soundEnabled) startAudio();
    } else {
      setIsActive(false);
      stopAudio();
    }
  };

  const resetSession = () => {
    setIsActive(false);
    stopAudio();
    setPhase('Inhale');
    setCountdown(currentPattern.inhale);
    setTimeRemaining(sessionTime);
    setCompletedSession(false);
  };

  const startAudio = () => {
    if (typeof window === 'undefined') return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = soundType === 'rain' ? 'lowpass' : 'bandpass';
      filter.frequency.value = soundType === 'rain' ? 800 : 400;

      const gain = ctx.createGain();
      gain.gain.value = 0.05;

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      whiteNoise.start();

      noiseNodeRef.current = whiteNoise;
    } catch (e) {
      console.error('Audio error:', e);
    }
  };

  const stopAudio = () => {
    if (noiseNodeRef.current) {
      try {
        (noiseNodeRef.current as any).stop();
      } catch (e) {}
      noiseNodeRef.current = null;
    }
  };

  const toggleSound = () => {
    if (soundEnabled) {
      setSoundEnabled(false);
      stopAudio();
    } else {
      setSoundEnabled(true);
      if (isActive) startAudio();
    }
  };

  const getCircleScale = () => {
    if (phase === 'Inhale') return 1.4;
    if (phase === 'Hold') return 1.4;
    if (phase === 'Exhale') return 0.85;
    return 0.85;
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AppSidebar>
      <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Compass size={16} />
              <span>Mindfulness & Relaxation Center</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-900">Meditation & Guided Breathing</h1>
            <p className="text-sm text-slate-500 mt-1">Calm your nervous system and regain mental clarity in minutes</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs">
            <Clock size={16} className="text-indigo-600" />
            <span className="text-xs font-bold text-slate-700">Time Left: {formatTime(timeRemaining)}</span>
          </div>
        </div>

        {completedSession && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-emerald-50 text-emerald-800 rounded-3xl border border-emerald-200 text-center space-y-3 shadow-md"
          >
            <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
            <h3 className="font-bold text-xl font-display">Breathing Session Completed!</h3>
            <p className="text-sm text-emerald-700 max-w-md mx-auto">
              You’ve successfully guided your body into a deep state of physiological relaxation. Notice how much calmer your heartbeat feels right now.
            </p>
            <button
              onClick={resetSession}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-emerald-700 transition-all"
            >
              Start Another Session
            </button>
          </motion.div>
        )}

        {/* Pattern & Preset Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(patterns) as BreathingPattern[]).map((key) => {
            const pat = patterns[key];
            const active = patternKey === key;
            return (
              <button
                key={key}
                disabled={isActive}
                onClick={() => {
                  setPatternKey(key);
                  setPhase('Inhale');
                  setCountdown(pat.inhale);
                }}
                className={`p-5 rounded-3xl border text-left transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 border-indigo-600 ring-2 ring-indigo-400'
                    : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-900 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm">{pat.name}</h4>
                  {active && <Sparkles size={16} className="text-amber-300 animate-pulse" />}
                </div>
                <p className={`text-xs leading-relaxed ${active ? 'text-indigo-100' : 'text-slate-500'}`}>
                  {pat.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Main Breathing Circle Studio */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-14 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[440px]">
          {/* Ambient Glowing Blobs */}
          <div className="absolute w-80 h-80 bg-indigo-600/30 rounded-full blur-[100px] pointer-events-none animate-pulse" />
          <div className="absolute w-80 h-80 bg-teal-500/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />

          <div className="relative z-10 flex flex-col items-center">
            {/* Animated Breathing Circle */}
            <motion.div
              animate={{
                scale: isActive ? getCircleScale() : 1,
                borderColor: phase === 'Inhale' ? '#6366f1' : phase === 'Exhale' ? '#14b8a6' : '#818cf8'
              }}
              transition={{ duration: phase === 'Inhale' ? currentPattern.inhale : phase === 'Exhale' ? currentPattern.exhale : 0.5, ease: 'easeInOut' }}
              className="w-56 h-56 md:w-64 md:h-64 rounded-full border-4 flex flex-col items-center justify-center bg-white/5 backdrop-blur-md shadow-2xl relative mb-10"
            >
              <div className="text-center space-y-1">
                <span className="text-4xl md:text-5xl font-extrabold font-display tracking-tight text-white">
                  {isActive ? countdown : 'READY'}
                </span>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                  {isActive ? phase : 'Click Play to Begin'}
                </p>
              </div>
            </motion.div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSession}
                className={`px-8 py-4 rounded-2xl font-bold text-sm shadow-xl flex items-center gap-2.5 transition-all ${
                  isActive
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-amber-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
                }`}
              >
                {isActive ? (
                  <>
                    <Pause size={18} fill="currentColor" />
                    <span>Pause Session</span>
                  </>
                ) : (
                  <>
                    <Play size={18} fill="currentColor" />
                    <span>Start Breathing</span>
                  </>
                )}
              </button>

              <button
                onClick={resetSession}
                title="Reset Session"
                className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md transition-all"
              >
                <RotateCcw size={18} />
              </button>

              <button
                onClick={toggleSound}
                title="Toggle Soothing Soundscape"
                className={`p-4 rounded-2xl backdrop-blur-md transition-all flex items-center gap-2 ${
                  soundEnabled ? 'bg-teal-500/30 text-teal-300 border border-teal-500/40' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
            </div>

            {/* Sound Synthesizer Selector */}
            {soundEnabled && (
              <div className="flex items-center gap-2 mt-6 bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10 text-xs">
                <span className="text-slate-300 font-semibold mr-1">Soundscape:</span>
                {(['pink', 'rain', 'ocean'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSoundType(t)}
                    className={`px-3 py-1 rounded-xl font-bold uppercase transition-all ${
                      soundType === t ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppSidebar>
  );
}
