'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAmbientSoundStore, SOUND_LIBRARY, PRESET_MIXES, SoundItem } from '@/store/useAmbientSoundStore';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Music,
  Maximize2,
  Minimize2,
  Heart,
  Trash2,
  Clock,
  Sparkles,
  X,
  Plus,
  Search,
  Star,
  History,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AmbientSoundEngine } from '@/lib/ambient-sound-engine';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [customMixName, setCustomMixName] = useState('');
  const [showSaveMixInput, setShowSaveMixInput] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [recentlyPlayed, setRecentlyPlayed] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load preferences and recently played from storage
  useEffect(() => {
    loadPreferences();
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    try {
      const recent = window.localStorage.getItem('calmnest_recent_mixes');
      if (recent) {
        setTimeout(() => {
          setRecentlyPlayed(JSON.parse(recent));
        }, 0);
      }
    } catch (e) {}

    return () => window.removeEventListener('resize', checkMobile);
  }, [loadPreferences]);

  // Save recently played whenever activeSounds changes
  useEffect(() => {
    const activeIds = Object.keys(activeSounds);
    if (activeIds.length > 0) {
      // Find matching preset or construct a simple label
      const activeString = activeIds.sort().join(',');
      const presetMatch = PRESET_MIXES.find(
        (p) => Object.keys(p.sounds).sort().join(',') === activeString
      );
      const label = presetMatch ? presetMatch.name : `${activeIds.length} Sound Mix`;

      setTimeout(() => {
        setRecentlyPlayed((prev) => {
          const filtered = prev.filter((item) => item !== label);
          const updated = [label, ...filtered].slice(0, 4);
          try {
            window.localStorage.setItem('calmnest_recent_mixes', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }, 0);
    }
  }, [activeSounds]);

  // Real-time Canvas Visualizer
  useEffect(() => {
    if (!isPlaying || !isExpanded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = AmbientSoundEngine.getInstance().getAnalyser();
    if (!analyser) return;

    let animationId: number;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.2;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.85;

        // Custom theme gradient matching CalmNest primary/secondary colors
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, 'rgba(92, 131, 151, 0.2)');
        gradient.addColorStop(0.5, 'rgba(107, 144, 123, 0.7)');
        gradient.addColorStop(1, 'rgba(141, 128, 169, 0.95)');

        ctx.fillStyle = gradient;
        // Rounded bars logic
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, canvas.height - barHeight, barWidth - 3, barHeight, [3, 3, 0, 0]);
          ctx.fill();
        } else {
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 3, barHeight);
        }

        x += barWidth;
      }
    };

    draw();
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPlaying, isExpanded]);

  const activeSoundIds = Object.keys(activeSounds);
  const currentSoundCount = activeSoundIds.length;

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

  // Search and filter logic
  const filteredSounds = SOUND_LIBRARY.filter((sound) => {
    const matchesSearch =
      sound.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sound.desc.toLowerCase().includes(searchQuery.toLowerCase());
    if (searchQuery) return matchesSearch;
    return sound.category === activeCategory;
  });

  // Calculate circular timer stroke dash
  const totalTimerSeconds = (timerDuration || 1) * 60;
  const strokeDashoffset = timeLeft !== null
    ? (1 - timeLeft / totalTimerSeconds) * 113.09
    : 0;

  return (
    <div className="z-40">
      {/* Floating Pill Mini Player (Glassmorphism & Micro-animations) */}
      <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-40 flex justify-center sm:justify-start pointer-events-none select-none">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl backdrop-blur-md bg-white/80 dark:bg-[#1E2128]/85 border border-slate-200/60 dark:border-[#2B2F38] shadow-lg w-full max-w-sm sm:max-w-md pointer-events-auto hover:border-primary/45 dark:hover:border-primary/45 transition-colors duration-200"
        >
          {/* Animated Glow Artwork / Wave */}
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-3 text-left focus:outline-none shrink-0"
          >
            <div className={`relative flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary dark:text-[#A1C2D4] shrink-0 overflow-hidden ${isPlaying ? 'ring-2 ring-[#6B907B] dark:ring-[#A8C8B5]/50 animate-pulse' : ''}`}>
              {isPlaying ? (
                <div className="flex items-end gap-0.5 h-4">
                  <span className="w-0.5 bg-[#6B907B] dark:bg-[#A8C8B5] animate-[bounce_0.8s_infinite] h-2"></span>
                  <span className="w-0.5 bg-primary dark:bg-[#A1C2D4] animate-[bounce_0.8s_infinite_0.15s] h-4"></span>
                  <span className="w-0.5 bg-[#8D80A9] dark:bg-[#C5B8DD] animate-[bounce_0.8s_infinite_0.3s] h-3"></span>
                  <span className="w-0.5 bg-primary dark:bg-[#A1C2D4] animate-[bounce_0.8s_infinite_0.45s] h-1.5"></span>
                </div>
              ) : (
                <Music size={16} />
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase leading-none">
                {isPlaying ? 'Smart Mix Active' : 'Ambient Engine'}
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate mt-0.5 max-w-[120px] sm:max-w-[180px]">
                {isPlaying ? `${currentSoundCount} sounds playing` : 'Silent Sanctuary'}
              </span>
            </div>
          </button>

          {/* Master quick toggle & expand */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200/60 dark:border-[#2B2F38]">
            {isPlaying ? (
              <button
                onClick={() => stopAll()}
                title="Stop Audio"
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
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
                title="Play Recommended Mix"
                className="p-2 rounded-xl text-primary hover:bg-primary/10 transition-all cursor-pointer"
              >
                <Play size={15} />
              </button>
            )}

            {/* Sleep Timer Display */}
            {timeLeft !== null && (
              <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-lg border border-amber-200/50 dark:border-amber-900/50 flex items-center gap-1">
                <Clock size={9} />
                {formatTime(timeLeft)}
              </span>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title="Expand Mixer Board"
              className="p-2 rounded-xl text-slate-500 hover:text-primary dark:hover:text-[#A1C2D4] hover:bg-slate-100 dark:hover:bg-[#252932] transition-colors cursor-pointer"
            >
              {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Expanded Mixer Sliding Drawer (Glassmorphic Dark Mode Design) */}
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 dark:bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:justify-end">
            {/* Click outside backdrop closure */}
            <div className="absolute inset-0" onClick={() => setIsExpanded(false)} />

            <motion.div
              initial={isMobile ? { y: '100%' } : { x: '100%' }}
              animate={{ x: 0, y: 0 }}
              exit={isMobile ? { y: '100%' } : { x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="w-full sm:max-w-md h-[90vh] sm:h-screen bg-slate-900 dark:bg-[#12141C] text-slate-100 shadow-2xl flex flex-col overflow-hidden rounded-t-3xl sm:rounded-t-none sm:rounded-l-3xl border-t sm:border-t-0 sm:border-l border-slate-800/80 relative"
            >
              {/* Animated Gradient Ambient Aura Background */}
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950/20 opacity-90 z-0 pointer-events-none" />

              {/* 1. Header (Dynamic & Premium) */}
              <div className="relative z-10 p-5 flex items-center justify-between border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-secondary-light" />
                  <span className="font-semibold text-sm tracking-tight">Ambient Mixer Board</span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Mixer Board Container */}
              <div className="flex-1 overflow-y-auto z-10 px-5 py-4 space-y-5 custom-scroll no-scrollbar">
                {/* 2. Premium Now Playing Card */}
                <div className="relative overflow-hidden rounded-3xl p-5 bg-white/5 border border-white/10 shadow-lg flex flex-col gap-4">
                  {/* Glowing background ring */}
                  <div className={`absolute -right-10 -top-10 w-28 h-28 rounded-full bg-secondary/15 blur-2xl transition-transform duration-[10s] ${isPlaying ? 'scale-150 animate-pulse' : ''}`} />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Album cover / rotating visualizer */}
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary/80 to-[#6B907B] flex items-center justify-center text-2xl shadow-md border border-white/10 ${isPlaying ? 'animate-[spin_8s_infinite_linear]' : ''}`}>
                        🪷
                      </div>
                      <div>
                        <span className="text-[10px] font-bold tracking-widest text-[#A8C8B5] uppercase">Currently Playing</span>
                        <h3 className="font-semibold text-sm mt-0.5">
                          {isPlaying ? `${currentSoundCount} Backing Track Mix` : 'Silent Sanctuary'}
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {isPlaying ? 'Smooth crossfading enabled' : 'Tap play to activate soundscape'}
                        </p>
                      </div>
                    </div>

                    {/* Circular Timer Countdowns */}
                    {timeLeft !== null && (
                      <div className="relative w-10 h-10 flex items-center justify-center">
                        <svg className="absolute w-10 h-10 -rotate-90">
                          <circle cx="20" cy="20" r="18" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" fill="transparent" />
                          <circle
                            cx="20"
                            cy="20"
                            r="18"
                            stroke="#A8C8B5"
                            strokeWidth="2.5"
                            fill="transparent"
                            strokeDasharray="113.09"
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-1000"
                          />
                        </svg>
                        <span className="text-[9px] font-mono font-bold text-slate-200">{formatTime(timeLeft)}</span>
                      </div>
                    )}
                  </div>

                  {/* Real-time Canvas Waveform Visualizer */}
                  {isPlaying ? (
                    <canvas ref={canvasRef} width="350" height="36" className="w-full h-9 bg-slate-950/20 rounded-xl" />
                  ) : (
                    <div className="w-full h-9 bg-slate-950/20 rounded-xl border border-white/5 flex items-center justify-center text-[10px] text-slate-500 font-mono italic">
                      Waveform visualization idle
                    </div>
                  )}
                </div>

                {/* Recommendation Banner */}
                {recommendation && (
                  <div className="p-4 bg-[#6B907B]/10 border border-[#6B907B]/30 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <Sparkles size={16} className="text-secondary-light shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#A8C8B5]">Suggested Soundscape</h4>
                        <p className="text-[10px] text-slate-300 mt-0.5 truncate">
                          Mix recommended for {recommendation.activity}: <strong>{recommendation.name}</strong>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleApplyRecommendation}
                      className="px-3.5 py-1.5 bg-[#6B907B] hover:bg-[#567865] text-white text-[10px] font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                )}

                {/* 3. Master Volume Board Slider */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-medium">Master Volume</span>
                    <span className="font-mono">{Math.round(masterVolume * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setMasterVolume(masterVolume === 0 ? 0.5 : 0)}
                      className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {masterVolume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={masterVolume}
                      onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-secondary-light"
                    />
                  </div>
                </div>

                {/* 4. Search and Category filter tabs */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search sound engine library..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-secondary-light"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {!searchQuery && (
                    <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                      {(['nature', 'relaxation', 'music', 'focus'] as const).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all cursor-pointer shrink-0 ${
                            activeCategory === cat
                              ? 'bg-[#6B907B] text-white shadow-sm'
                              : 'bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Sound Channels List with Individual Sliders */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
                    {searchQuery ? 'Search Results' : 'Sound Generator Channels'}
                  </h4>

                  <div className="grid grid-cols-1 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {filteredSounds.map((sound) => {
                      const activeVol = activeSounds[sound.id];
                      const isActive = activeVol !== undefined;

                      return (
                        <div
                          key={sound.id}
                          className={`p-3 rounded-xl border transition-all duration-200 ${
                            isActive
                              ? 'bg-[#6B907B]/10 border-[#6B907B]/40 shadow-xs'
                              : 'bg-white/3 border-white/5 hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <button
                              onClick={() => toggleSound(sound.id)}
                              className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
                            >
                              <span className="text-lg bg-slate-950/20 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                                {sound.icon}
                              </span>
                              <div className="truncate">
                                <span className="text-xs font-semibold block">{sound.name}</span>
                                <span className="text-[10px] text-slate-400 block truncate">{sound.desc}</span>
                              </div>
                            </button>

                            <button
                              onClick={() => toggleSound(sound.id)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isActive ? 'bg-[#6B907B] text-white' : 'text-slate-500 hover:text-slate-200'
                              }`}
                            >
                              {isActive ? <Pause size={12} /> : <Play size={12} />}
                            </button>
                          </div>

                          {/* Individual Slider */}
                          {isActive && (
                            <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-white/5">
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={activeVol}
                                onChange={(e) => setSoundVolume(sound.id, parseFloat(e.target.value))}
                                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-secondary"
                              />
                              <span className="text-[9px] font-mono text-slate-400 shrink-0">
                                {Math.round(activeVol * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {filteredSounds.length === 0 && (
                      <div className="text-center py-6 text-xs text-slate-500 italic">No matching backing sounds found.</div>
                    )}
                  </div>
                </div>

                {/* 6. Favorites, Recents & Presets */}
                <div className="space-y-3 pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Presets & Library Mixes</h4>
                    {isPlaying && (
                      <button
                        onClick={() => setShowSaveMixInput(true)}
                        className="text-[10px] font-bold text-secondary-light hover:underline flex items-center gap-1"
                      >
                        <Plus size={12} />
                        Save Current Mix
                      </button>
                    )}
                  </div>

                  {showSaveMixInput && (
                    <form onSubmit={handleSaveMixSubmit} className="flex gap-2 p-2.5 bg-slate-950/40 rounded-xl border border-white/5">
                      <input
                        type="text"
                        required
                        placeholder="Calm mix name..."
                        value={customMixName}
                        onChange={(e) => setCustomMixName(e.target.value)}
                        className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none flex-1"
                      />
                      <button type="submit" className="px-3 py-1 bg-[#6B907B] hover:bg-[#567865] text-white text-[10px] font-bold rounded-lg cursor-pointer">
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSaveMixInput(false)}
                        className="p-1 hover:bg-slate-800 rounded"
                      >
                        <X size={14} />
                      </button>
                    </form>
                  )}

                  {/* Recently Played Quick List */}
                  {recentlyPlayed.length > 0 && (
                    <div className="space-y-1 px-1">
                      <div className="text-[9px] font-bold text-slate-500 flex items-center gap-1.5">
                        <History size={10} />
                        <span>Recently Played</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 py-1">
                        {recentlyPlayed.map((label) => {
                          const matchPreset = PRESET_MIXES.find((p) => p.name === label);
                          return (
                            <button
                              key={label}
                              disabled={!matchPreset}
                              onClick={() => matchPreset && playPreset(matchPreset.sounds)}
                              className="px-2.5 py-1 text-[10px] bg-white/3 hover:bg-white/7 border border-white/5 hover:border-white/10 rounded-lg text-slate-300 font-semibold cursor-pointer disabled:opacity-50"
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Preset Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {[...PRESET_MIXES, ...customMixes].map((mix) => {
                      const isPreset = PRESET_MIXES.some((p) => p.name === mix.name);
                      return (
                        <div
                          key={mix.name}
                          className="p-2.5 rounded-xl border border-white/5 bg-white/3 flex items-center justify-between"
                        >
                          <button
                            onClick={() => playPreset(mix.sounds)}
                            className="flex flex-col text-left hover:text-secondary-light flex-1 min-w-0 cursor-pointer"
                          >
                            <span className="text-xs font-semibold truncate block">{mix.name}</span>
                            <span className="text-[9px] text-slate-400 font-normal mt-0.5">
                              {Object.keys(mix.sounds).length} sounds
                            </span>
                          </button>
                          <div className="flex items-center gap-0.5 ml-1.5">
                            <button
                              onClick={() => toggleFavoriteMix(mix.name)}
                              className={`p-1 rounded hover:bg-white/5 transition-colors cursor-pointer ${
                                isFavorite(mix.name) ? 'text-rose-500' : 'text-slate-500 hover:text-rose-400'
                              }`}
                            >
                              <Heart size={12} fill={isFavorite(mix.name) ? 'currentColor' : 'none'} />
                            </button>
                            {!isPreset && (
                              <button
                                onClick={() => deleteMix(mix.name)}
                                className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-white/5 cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 7. Sleep Countdown Timers */}
                <div className="space-y-2 pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock size={11} />
                      <span>Sleep Timer Engine</span>
                    </h3>
                    {timerDuration && (
                      <button
                        onClick={stopTimer}
                        className="text-[10px] font-bold text-rose-400 hover:underline cursor-pointer"
                      >
                        Cancel Timer
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[15, 30, 45, 60, 90, 120].map((mins) => {
                      const active = timerDuration === mins;
                      return (
                        <button
                          key={mins}
                          onClick={() => startTimer(mins)}
                          className={`py-2 border rounded-xl text-xs transition-all cursor-pointer ${
                            active
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold shadow-xs'
                              : 'border-white/5 bg-white/3 hover:bg-white/7 text-slate-300 hover:text-white'
                          }`}
                        >
                          {mins} min
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
