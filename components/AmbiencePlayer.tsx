'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSanctuaryTranslation } from '@/lib/i18n/useSanctuaryTranslation';
import { Volume2, VolumeX, Timer, Headphones, Sparkles } from 'lucide-react';

export type SoundType = 'rain' | 'ocean' | 'forest' | 'fireplace' | 'wind' | 'brownNoise';

interface AmbienceOption {
  id: SoundType;
  icon: string;
  labelKey: string;
}

const SOUNDS: AmbienceOption[] = [
  { id: 'rain', icon: '🌧️', labelKey: 'ambience.rain' },
  { id: 'ocean', icon: '🌊', labelKey: 'ambience.ocean' },
  { id: 'forest', icon: '🌲', labelKey: 'ambience.forest' },
  { id: 'fireplace', icon: '🔥', labelKey: 'ambience.fireplace' },
  { id: 'wind', icon: '🍃', labelKey: 'ambience.wind' },
  { id: 'brownNoise', icon: '🎧', labelKey: 'ambience.brownNoise' },
];

const getNoiseSample = () => Math.random() * 2 - 1;

export function AmbiencePlayer({ minimal = false }: { minimal?: boolean }) {
  const { t } = useSanctuaryTranslation();
  const [activeSound, setActiveSound] = useState<SoundType | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(!minimal);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  const stopAudio = () => {
    if (noiseNodeRef.current) {
      try {
        (noiseNodeRef.current as any).stop?.();
        noiseNodeRef.current.disconnect();
      } catch (e) {}
      noiseNodeRef.current = null;
    }
  };

  const startAudio = (type: SoundType, vol: number) => {
    stopAudio();
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = getNoiseSample();
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      if (type === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.value = 850;
      } else if (type === 'ocean') {
        filter.type = 'bandpass';
        filter.frequency.value = 450;
      } else if (type === 'forest') {
        filter.type = 'highpass';
        filter.frequency.value = 1200;
      } else if (type === 'fireplace') {
        filter.type = 'lowpass';
        filter.frequency.value = 600;
      } else if (type === 'wind') {
        filter.type = 'bandpass';
        filter.frequency.value = 350;
      } else {
        filter.type = 'lowpass';
        filter.frequency.value = 300;
      }

      const gainNode = ctx.createGain();
      gainNode.gain.value = vol;
      gainNodeRef.current = gainNode;

      whiteNoise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      whiteNoise.start();

      noiseNodeRef.current = whiteNoise;
    } catch (e) {
      console.error('Ambience Audio Synth Error:', e);
    }
  };

  const toggleSound = (type: SoundType) => {
    if (activeSound === type && isPlaying) {
      setIsPlaying(false);
      setActiveSound(null);
      stopAudio();
    } else {
      setActiveSound(type);
      setIsPlaying(true);
      startAudio(type, volume);
    }
  };

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerMinutes && isPlaying) {
      setTimeout(() => setTimeLeft(timerMinutes * 60), 0);
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (!prev || prev <= 1) {
            setIsPlaying(false);
            setActiveSound(null);
            stopAudio();
            setTimerMinutes(null);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setTimeout(() => setTimeLeft(null), 0);
    }
    return () => clearInterval(timer);
  }, [timerMinutes, isPlaying]);

  useEffect(() => {
    return () => stopAudio();
  }, []);

  const formatTimeLeft = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isExpanded && minimal) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="btn-secondary py-2 px-3.5 text-xs font-medium gap-2"
        title="Open Ambient Soundscapes"
      >
        <Headphones size={15} strokeWidth={1.75} />
        <span>{isPlaying ? `${activeSound} playing` : 'Ambient Acoustics'}</span>
      </button>
    );
  }

  return (
    <div className="card-minimal select-none">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/60 dark:border-[#2B2F38]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#E6EFEA] dark:bg-[#6B907B]/20 text-[#6B907B] dark:text-[#A8C8B5] rounded-xl flex items-center justify-center">
            <Headphones size={16} strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {t('ambience.title') || 'Synthesized Ambient Soundscapes'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('ambience.subtitle') || 'High-fidelity acoustic masking for focus and relaxation'}
            </p>
          </div>
        </div>
        {minimal && (
          <button
            onClick={() => setIsExpanded(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 text-xs font-mono"
          >
            ✕
          </button>
        )}
      </div>

      {/* Soundscape Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {SOUNDS.map((sound) => {
          const active = activeSound === sound.id && isPlaying;
          return (
            <button
              key={sound.id}
              onClick={() => toggleSound(sound.id)}
              className={`p-3.5 rounded-xl border flex items-center gap-3 text-left transition-all duration-150 ${
                active
                  ? 'bg-[#5C8397] text-white border-[#5C8397] shadow-2xs'
                  : 'bg-slate-50/80 dark:bg-[#16181D] border-slate-200/80 dark:border-[#2B2F38] text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-[#252932]'
              }`}
            >
              <span className="text-2xl">{sound.icon}</span>
              <div className="overflow-hidden">
                <p className={`text-xs font-medium truncate ${active ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                  {t(sound.labelKey) || sound.id}
                </p>
                <p className={`text-[10px] truncate ${active ? 'text-white/80 font-mono' : 'text-slate-400 dark:text-slate-500'}`}>
                  {active ? 'Playing...' : 'Tap to play'}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Volume & Sleep Timer Bar */}
      {isPlaying && activeSound && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="pt-3 border-t border-slate-200/60 dark:border-[#2B2F38] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
        >
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <VolumeX size={15} className="text-slate-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full sm:w-32 accent-[#5C8397] h-1.5 bg-slate-200 dark:bg-[#2B2F38] rounded-lg cursor-pointer"
            />
            <Volume2 size={15} className="text-slate-400" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end font-mono">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Timer size={13} /> Timer:
            </span>
            {[15, 30, 60].map((min) => (
              <button
                key={min}
                onClick={() => setTimerMinutes(timerMinutes === min ? null : min)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  timerMinutes === min
                    ? 'bg-[#6B907B] text-white font-medium'
                    : 'bg-slate-100 dark:bg-[#16181D] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#252932]'
                }`}
              >
                {min}m
              </button>
            ))}
            {timeLeft !== null && (
              <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                {formatTimeLeft(timeLeft)}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
