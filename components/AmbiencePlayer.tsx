'use client';

import React from 'react';
import { useAmbientSoundStore, PRESET_MIXES } from '@/store/useAmbientSoundStore';
import { Volume2, Play, Pause, Sparkles, Sliders, Music } from 'lucide-react';
import { useSanctuaryTranslation } from '@/lib/i18n/useSanctuaryTranslation';

export function AmbiencePlayer({ minimal = false }: { minimal?: boolean }) {
  const { t } = useSanctuaryTranslation();
  const {
    isPlaying,
    activeSounds,
    masterVolume,
    playPreset,
    stopAll,
    setMasterVolume
  } = useAmbientSoundStore();

  const activeSoundIds = Object.keys(activeSounds);

  return (
    <div className="card-minimal p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/15 dark:bg-primary/25 text-primary dark:text-[#A1C2D4] flex items-center justify-center shrink-0">
            <Music size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Sanctuary Audio Engine
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {isPlaying ? `${activeSoundIds.length} sounds mixed` : 'Select a backing track for your sanctuary'}
            </p>
          </div>
        </div>

        {/* Master Play/Pause Toggle */}
        <div className="flex items-center gap-1.5">
          {isPlaying ? (
            <button
              onClick={() => stopAll()}
              className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl hover:bg-rose-100 transition-colors"
              title="Pause Ambient Mix"
            >
              <Pause size={15} />
            </button>
          ) : (
            <button
              onClick={() => playPreset({ rain_gentle: 0.5, piano: 0.3 })}
              className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
              title="Play Default Mix"
            >
              <Play size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Active Sound Tags */}
      {isPlaying && (
        <div className="flex flex-wrap gap-1.5 py-1">
          {activeSoundIds.map((id) => {
            const vol = activeSounds[id];
            return (
              <span
                key={id}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-primary-subtle dark:bg-primary/20 text-primary-hover dark:text-[#A1C2D4] border border-primary-light/40 dark:border-primary/40"
              >
                {id.replace('_', ' ')} ({Math.round(vol * 100)}%)
              </span>
            );
          })}
        </div>
      )}

      {/* Preset mix shortcuts */}
      {!minimal && (
        <div className="space-y-2 pt-1">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={11} className="text-primary" />
            <span>Popular Background Mixes</span>
          </span>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_MIXES.slice(0, 4).map((mix) => (
              <button
                key={mix.name}
                onClick={() => playPreset(mix.sounds)}
                className="p-2 border border-slate-200/60 dark:border-[#2B2F38] rounded-xl hover:bg-slate-50 dark:hover:bg-[#252932] text-left text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                {mix.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Volume slider */}
      <div className="flex items-center justify-between gap-4 pt-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Volume2 size={15} />
          <span>Volume</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={masterVolume}
          onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
          className="w-24 h-1 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>
    </div>
  );
}
