'use client';

import React, { useEffect, useState } from 'react';
import { useAmbientSoundStore, SOUND_LIBRARY, PRESET_MIXES, SoundItem } from '@/store/useAmbientSoundStore';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Music,
  Maximize2,
  Minimize2,
  Check,
  Heart,
  Trash2,
  Clock,
  Sparkles,
  X,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function GlobalAudioPlayer() {
  const {
    isPlaying,
    activeSounds,
    masterVolume,
    favorites,
    customMixes,
    timerDuration,
    timeLeft,
    recommendation,
    toggleSound,
    setSoundVolume,
    setMasterVolume,
    playPreset,
    stopAll,
    startTimer,
    stopTimer,
    saveCustomMix,
    deleteMix,
    toggleFavoriteMix,
    loadPreferences
  } = useAmbientSoundStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'nature' | 'relaxation' | 'music' | 'focus'>('nature');
  const [customMixName, setCustomMixName] = useState('');
  const [showSaveMixInput, setShowSaveMixInput] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    loadPreferences();
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [loadPreferences]);

  const activeSoundIds = Object.keys(activeSounds);
  const currentSoundCount = activeSoundIds.length;

  // Format timer countdown
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleApplyRecommendation = () => {
    if (recommendation) {
      playPreset(recommendation.sounds);
    }
  };

  const handleSaveMixSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customMixName.trim()) {
      saveCustomMix(customMixName.trim());
      setCustomMixName('');
      setShowSaveMixInput(false);
    }
  };

  const isFavorite = (mixName: string) => favorites.includes(mixName);

  return (
    <div className="z-40">
      {/* Floating Pill Mini Player */}
      <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-40 flex justify-center sm:justify-start pointer-events-none">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-2xl backdrop-blur-md bg-white/85 dark:bg-[#1E2128]/85 border border-slate-200/60 dark:border-[#2B2F38] shadow-lg w-full max-w-sm sm:max-w-md pointer-events-auto"
        >
          {/* Wave animation if playing */}
          <div className="flex items-center gap-1 shrink-0 w-8 h-8 rounded-xl bg-primary/15 dark:bg-primary/25 text-primary dark:text-[#A1C2D4] justify-center">
            {isPlaying ? (
              <div className="flex items-end gap-0.5 h-3.5">
                <span className="w-0.5 bg-primary dark:bg-[#A1C2D4] animate-[bounce_0.8s_infinite] h-2"></span>
                <span className="w-0.5 bg-primary dark:bg-[#A1C2D4] animate-[bounce_0.8s_infinite_0.15s] h-3.5"></span>
                <span className="w-0.5 bg-primary dark:bg-[#A1C2D4] animate-[bounce_0.8s_infinite_0.3s] h-3"></span>
                <span className="w-0.5 bg-primary dark:bg-[#A1C2D4] animate-[bounce_0.8s_infinite_0.45s] h-1.5"></span>
              </div>
            ) : (
              <Music size={16} />
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-none">
              {isPlaying ? 'Smart Ambient Mix' : 'Ambient Engine'}
            </span>
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate mt-0.5 max-w-[120px] sm:max-w-[180px]">
              {isPlaying ? `${currentSoundCount} sounds playing` : 'Quiet Sanctuary'}
            </span>
          </div>

          {/* Master controls */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200/60 dark:border-[#2B2F38]">
            {isPlaying ? (
              <button
                onClick={() => stopAll()}
                title="Stop Audio"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252932] transition-colors"
              >
                <Pause size={15} />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (recommendation) {
                    handleApplyRecommendation();
                  } else {
                    playPreset({ rain_gentle: 0.5 });
                  }
                }}
                title="Play Recommended/Default"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252932] transition-colors"
              >
                <Play size={15} />
              </button>
            )}

            {/* Timer quick info */}
            {timeLeft !== null && (
              <span className="text-[10px] font-mono font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-200/50 dark:border-amber-900/50">
                {formatTime(timeLeft)}
              </span>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title="Advanced Sound Mixer"
              className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
            >
              {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:justify-end">
            <motion.div
              initial={isMobile ? { y: '100%', opacity: 1 } : { x: '100%', opacity: 1 }}
              animate={{ x: 0, y: 0, opacity: 1 }}
              exit={isMobile ? { y: '100%', opacity: 1 } : { x: '100%', opacity: 1 }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              className="w-full sm:max-w-md h-[80vh] sm:h-full bg-white dark:bg-[#1E2128] border-t sm:border-t-0 sm:border-l border-slate-200/70 dark:border-[#2B2F38] shadow-2xl flex flex-col p-6 overflow-y-auto rounded-t-3xl sm:rounded-t-none sm:rounded-l-3xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-[#2B2F38]">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-primary" />
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Smart Sound Mixer</h2>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#252932] text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Recommendation Alert */}
              {recommendation && (
                <div className="mt-4 p-3.5 bg-primary-subtle/50 dark:bg-primary/10 border border-primary-light/30 dark:border-primary/30 rounded-2xl flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <Sparkles size={16} className="text-primary dark:text-[#A1C2D4] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Activity Recommendation</h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        Recommended soundscape for <strong>{recommendation.activity}</strong>: <em>{recommendation.name}</em>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleApplyRecommendation}
                    className="btn-primary self-end py-1.5 px-3.5 text-[10px]"
                  >
                    Apply Mix
                  </button>
                </div>
              )}

              {/* Master Volume Controls */}
              <div className="py-5 border-b border-slate-200/60 dark:border-[#2B2F38] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Master Volume</span>
                  <span className="text-xs font-mono font-medium text-slate-900 dark:text-slate-100">
                    {Math.round(masterVolume * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMasterVolume(masterVolume === 0 ? 0.5 : 0)}
                    className="text-slate-400 hover:text-primary transition-colors"
                  >
                    {masterVolume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={masterVolume}
                    onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex gap-1.5 py-4 border-b border-slate-200/60 dark:border-[#2B2F38] overflow-x-auto no-scrollbar">
                {(['nature', 'relaxation', 'music', 'focus'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                      activeCategory === cat
                        ? 'bg-primary text-white shadow-2xs font-semibold'
                        : 'bg-slate-50 dark:bg-[#252932]/40 border border-slate-200/60 dark:border-[#2B2F38] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#252932]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Sounds Selector Grid */}
              <div className="py-4 space-y-4 max-h-72 overflow-y-auto">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sounds in Library</h3>
                <div className="grid grid-cols-1 gap-3">
                  {SOUND_LIBRARY.filter((s) => s.category === activeCategory).map((sound) => {
                    const activeVol = activeSounds[sound.id];
                    const isActive = activeVol !== undefined;

                    return (
                      <div
                        key={sound.id}
                        className={`p-3 rounded-2xl border transition-all ${
                          isActive
                            ? 'bg-primary/5 border-primary/40 dark:border-primary/60'
                            : 'border-slate-200/70 dark:border-[#2B2F38] hover:bg-slate-50/50 dark:hover:bg-[#252932]/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <button
                            type="button"
                            onClick={() => toggleSound(sound.id)}
                            className="flex items-center gap-2.5 text-left text-xs font-semibold text-slate-800 dark:text-slate-200"
                          >
                            <span className="text-base">{sound.icon}</span>
                            <div>
                              <span>{sound.name}</span>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal leading-tight mt-0.5">{sound.desc}</p>
                            </div>
                          </button>
                          <button
                            onClick={() => toggleSound(sound.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isActive ? 'bg-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-[#252932] text-slate-400'
                            }`}
                          >
                            {isActive ? <Pause size={12} /> : <Play size={12} />}
                          </button>
                        </div>
                        {isActive && (
                          <div className="flex items-center gap-3 pt-1">
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={activeVol}
                              onChange={(e) => setSoundVolume(sound.id, parseFloat(e.target.value))}
                              className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <span className="text-[10px] font-mono font-medium text-slate-600 dark:text-slate-400">
                              {Math.round(activeVol * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mix Management (Presets & Custom Mixes) */}
              <div className="py-4 border-t border-slate-200/60 dark:border-[#2B2F38] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Presets & Custom Mixes</h3>
                  {isPlaying && (
                    <button
                      onClick={() => setShowSaveMixInput(true)}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Save Current Mix
                    </button>
                  )}
                </div>

                {/* Save Custom Mix Input form */}
                {showSaveMixInput && (
                  <form onSubmit={handleSaveMixSubmit} className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="My calm mix name..."
                      value={customMixName}
                      onChange={(e) => setCustomMixName(e.target.value)}
                      className="input-minimal text-xs py-2 px-3 border border-slate-200/80 dark:border-[#2B2F38]"
                    />
                    <button type="submit" className="btn-primary py-2 px-4 text-xs font-medium">
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSaveMixInput(false)}
                      className="p-2 border border-slate-200/60 dark:border-[#2B2F38] rounded-xl hover:bg-slate-50 dark:hover:bg-[#252932]"
                    >
                      <X size={15} />
                    </button>
                  </form>
                )}

                {/* Preset List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[...PRESET_MIXES, ...customMixes].map((mix) => {
                    const isPreset = PRESET_MIXES.some((p) => p.name === mix.name);
                    return (
                      <div
                        key={mix.name}
                        className="p-3 rounded-xl border border-slate-200/70 dark:border-[#2B2F38] bg-slate-50/50 dark:bg-[#252932]/25 flex items-center justify-between"
                      >
                        <button
                          onClick={() => playPreset(mix.sounds)}
                          className="flex flex-col text-left text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-primary"
                        >
                          <span>{mix.name}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">
                            {Object.keys(mix.sounds).length} sounds
                          </span>
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleFavoriteMix(mix.name)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isFavorite(mix.name) ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                            }`}
                          >
                            <Heart size={14} fill={isFavorite(mix.name) ? 'currentColor' : 'none'} />
                          </button>
                          {!isPreset && (
                            <button
                              onClick={() => deleteMix(mix.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sleep Timer section */}
              <div className="py-4 border-t border-slate-200/60 dark:border-[#2B2F38] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={12} />
                    <span>Sleep Timer</span>
                  </h3>
                  {timerDuration && (
                    <button
                      onClick={() => stopTimer()}
                      className="text-[11px] font-semibold text-rose-500 hover:underline"
                    >
                      Cancel Timer
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {[10, 20, 30, 45, 60, 90].map((mins) => {
                    const active = timerDuration === mins;
                    return (
                      <button
                        key={mins}
                        onClick={() => startTimer(mins)}
                        className={`px-3 py-1.5 border rounded-lg text-xs transition-all ${
                          active
                            ? 'bg-amber-500 text-white border-amber-500 shadow-2xs font-semibold'
                            : 'border-slate-200 dark:border-[#2B2F38] hover:bg-slate-50 dark:hover:bg-[#252932] text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {mins} min
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
