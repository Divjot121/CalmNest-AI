'use client';

import { create } from 'zustand';
import { AmbientSoundEngine } from '@/lib/ambient-sound-engine';
import { supabase } from '@/lib/supabase';
import { getAmbientPreferences, saveAmbientPreferences } from '@/lib/db-service';

export interface SoundItem {
  id: string;
  name: string;
  icon: string;
  category: 'nature' | 'relaxation' | 'music' | 'focus';
  desc: string;
}

export interface SoundMix {
  name: string;
  sounds: Record<string, number>;
}

export const SOUND_LIBRARY: SoundItem[] = [
  // Nature
  { id: 'rain_gentle', name: 'Gentle Rain', icon: '🌧️', category: 'nature', desc: 'Subtle, relaxing soft rain sound' },
  { id: 'rain_heavy', name: 'Heavy Rain', icon: '⛈️', category: 'nature', desc: 'Deep, enveloping thunderstorm' },
  { id: 'ocean', name: 'Ocean Waves', icon: '🌊', category: 'nature', desc: 'Rhythmic, soothing ocean surf' },
  { id: 'river', name: 'River Stream', icon: '💧', category: 'nature', desc: 'Bubbling, fresh mountain stream' },
  { id: 'waterfall', name: 'Waterfall', icon: '⛲', category: 'nature', desc: 'Wide, constant rushing waterfall' },
  { id: 'forest', name: 'Forest', icon: '🌲', category: 'nature', desc: 'Distant wind and rustling leaves' },
  { id: 'birds', name: 'Birds', icon: '🐦', category: 'nature', desc: 'Cheerful morning birds chirping' },
  { id: 'wind', name: 'Wind', icon: '💨', category: 'nature', desc: 'Blowing wind gusts' },
  { id: 'breeze', name: 'Mountain Breeze', icon: '🍃', category: 'nature', desc: 'Gentle, light breeze' },
  { id: 'crickets', name: 'Night Crickets', icon: '🦗', category: 'nature', desc: 'Warm summer evening crickets' },
  { id: 'campfire', name: 'Campfire', icon: '🔥', category: 'nature', desc: 'Cozy outdoor wood crackling' },
  { id: 'fireplace', name: 'Fireplace', icon: '🪵', category: 'nature', desc: 'Deep indoor logs burning' },

  // Relaxation
  { id: 'white_noise', name: 'White Noise', icon: '📺', category: 'relaxation', desc: 'Constant full-spectrum signal' },
  { id: 'brown_noise', name: 'Brown Noise', icon: '🎛️', category: 'relaxation', desc: 'Deep, low-frequency rumble' },
  { id: 'pink_noise', name: 'Pink Noise', icon: '📻', category: 'relaxation', desc: 'Balanced mid-spectrum hum' },
  { id: 'fan', name: 'Soft Fan', icon: '🔌', category: 'relaxation', desc: 'Rhythmic mechanical blade hum' },
  { id: 'ac', name: 'Air Conditioner', icon: '❄️', category: 'relaxation', desc: 'Steady cooling unit rumble' },
  { id: 'hum', name: 'Gentle Hum', icon: '🔊', category: 'relaxation', desc: 'Low-frequency grounding hum' },

  // Music
  { id: 'piano', name: 'Soft Piano', icon: '🎹', category: 'music', desc: 'Delicate, slow piano chords' },
  { id: 'pads', name: 'Ambient Pads', icon: '🪐', category: 'music', desc: 'Warm, detuned synth drones' },
  { id: 'bells', name: 'Meditation Bells', icon: '🔔', category: 'music', desc: 'Random soft metallic chimes' },
  { id: 'tibetan_bowl', name: 'Tibetan Bowls', icon: '🥣', category: 'music', desc: 'Deep singing bowl harmonics' },
  { id: 'guitar', name: 'Calm Guitar', icon: '🎸', category: 'music', desc: 'Slow, raw acoustic plucks' },
  { id: 'strings', name: 'Light Strings', icon: '🎻', category: 'music', desc: 'Long, slow orchestral textures' },

  // Focus
  { id: 'coffee_shop', name: 'Coffee Shop', icon: '☕', category: 'focus', desc: 'Subtle chatter & cup clicks' },
  { id: 'library', name: 'Library', icon: '📚', category: 'focus', desc: 'Quiet pages rustling & steps' },
  { id: 'keyboard', name: 'Keyboard', icon: '⌨️', category: 'focus', desc: 'Slow, steady mechanical typing' }
];

export const PRESET_MIXES: SoundMix[] = [
  { name: 'Rain + Piano', sounds: { rain_gentle: 0.5, piano: 0.3 } },
  { name: 'Ocean + Wind', sounds: { ocean: 0.6, wind: 0.3 } },
  { name: 'Fireplace + Soft Music', sounds: { fireplace: 0.4, pads: 0.3, bells: 0.2 } },
  { name: 'Forest + Birds', sounds: { forest: 0.5, birds: 0.4 } },
  { name: 'Brown Noise + Rain', sounds: { brown_noise: 0.4, rain_gentle: 0.4 } }
];

interface AmbientSoundState {
  isPlaying: boolean;
  activeSounds: Record<string, number>;
  masterVolume: number;
  favorites: string[];
  customMixes: SoundMix[];
  timerDuration: number | null;
  timeLeft: number | null;
  recommendation: { activity: string; name: string; sounds: Record<string, number> } | null;
  soundList: SoundItem[];
  timerIntervalId: NodeJS.Timeout | null;

  // Actions
  toggleSound: (soundId: string) => void;
  setSoundVolume: (soundId: string, vol: number) => void;
  setMasterVolume: (vol: number) => void;
  playPreset: (sounds: Record<string, number>) => void;
  stopAll: () => void;
  startTimer: (minutes: number) => void;
  stopTimer: () => void;
  saveCustomMix: (name: string) => void;
  deleteMix: (name: string) => void;
  toggleFavoriteMix: (mixName: string) => void;
  triggerRecommendation: (activity: 'journal' | 'chat' | 'breathing' | 'meditation' | 'focus' | 'sleep' | 'stress') => void;
  loadPreferences: () => Promise<void>;
  savePreferencesToStorage: () => Promise<void>;
}

export const useAmbientSoundStore = create<AmbientSoundState>((set, get) => ({
  isPlaying: false,
  activeSounds: {},
  masterVolume: 0.5,
  favorites: [],
  customMixes: [],
  timerDuration: null,
  timeLeft: null,
  recommendation: null,
  soundList: SOUND_LIBRARY,
  timerIntervalId: null,

  toggleSound: (soundId) => {
    const engine = AmbientSoundEngine.getInstance();
    const { activeSounds } = get();
    const isCurrentlyPlaying = !!activeSounds[soundId];
    const updatedSounds = { ...activeSounds };

    if (isCurrentlyPlaying) {
      delete updatedSounds[soundId];
      engine.toggleSound(soundId, false);
    } else {
      updatedSounds[soundId] = 0.5;
      engine.toggleSound(soundId, true, 0.5);
    }

    const hasActiveSounds = Object.keys(updatedSounds).length > 0;
    set({ activeSounds, isPlaying: hasActiveSounds });
    
    // Defer state update to bypass render phase issues
    setTimeout(() => {
      set({ activeSounds: updatedSounds, isPlaying: hasActiveSounds });
      get().savePreferencesToStorage();
    }, 0);
  },

  setSoundVolume: (soundId, vol) => {
    const engine = AmbientSoundEngine.getInstance();
    const updatedSounds = { ...get().activeSounds, [soundId]: vol };
    engine.setSoundVolume(soundId, vol);
    set({ activeSounds: updatedSounds });
    get().savePreferencesToStorage();
  },

  setMasterVolume: (vol) => {
    const engine = AmbientSoundEngine.getInstance();
    engine.setMasterVolume(vol);
    set({ masterVolume: vol });
    get().savePreferencesToStorage();
  },

  playPreset: (sounds) => {
    const engine = AmbientSoundEngine.getInstance();
    const currentActive = get().activeSounds;

    // Stop sounds not in the preset
    Object.keys(currentActive).forEach((id) => {
      if (!sounds[id]) {
        engine.toggleSound(id, false);
      }
    });

    // Start/Update preset sounds
    Object.entries(sounds).forEach(([id, vol]) => {
      engine.toggleSound(id, true, vol);
    });

    set({ activeSounds: sounds, isPlaying: true });
    get().savePreferencesToStorage();
  },

  stopAll: () => {
    const engine = AmbientSoundEngine.getInstance();
    engine.stopAll(1.0); // 1-second fade out
    get().stopTimer();
    set({ activeSounds: {}, isPlaying: false });
    get().savePreferencesToStorage();
  },

  startTimer: (minutes) => {
    get().stopTimer();
    const seconds = minutes * 60;
    set({ timerDuration: minutes, timeLeft: seconds });

    const intervalId = setInterval(() => {
      const { timeLeft } = get();
      if (timeLeft === null) return;

      if (timeLeft <= 1) {
        get().stopAll();
      } else {
        // Fade out Master Volume when 15 seconds remain
        if (timeLeft <= 15) {
          const fadeVol = (timeLeft / 15) * get().masterVolume;
          AmbientSoundEngine.getInstance().setMasterVolume(fadeVol);
        }
        set({ timeLeft: timeLeft - 1 });
      }
    }, 1000);

    set({ timerIntervalId: intervalId });
  },

  stopTimer: () => {
    const { timerIntervalId } = get();
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
    }
    set({ timerDuration: null, timeLeft: null, timerIntervalId: null });
    // Restore master volume back in case it was fading
    AmbientSoundEngine.getInstance().setMasterVolume(get().masterVolume);
  },

  saveCustomMix: (name) => {
    if (!name.trim()) return;
    const currentActive = get().activeSounds;
    if (Object.keys(currentActive).length === 0) return;

    const newMix: SoundMix = { name, sounds: { ...currentActive } };
    const updatedMixes = [...get().customMixes.filter(m => m.name !== name), newMix];
    set({ customMixes: updatedMixes });
    get().savePreferencesToStorage();
  },

  deleteMix: (name) => {
    const updatedMixes = get().customMixes.filter(m => m.name !== name);
    const updatedFavs = get().favorites.filter(f => f !== name);
    set({ customMixes: updatedMixes, favorites: updatedFavs });
    get().savePreferencesToStorage();
  },

  toggleFavoriteMix: (mixName) => {
    const { favorites } = get();
    const updated = favorites.includes(mixName)
      ? favorites.filter((f) => f !== mixName)
      : [...favorites, mixName];
    set({ favorites: updated });
    get().savePreferencesToStorage();
  },

  triggerRecommendation: (activity) => {
    const config: Record<string, { name: string; sounds: Record<string, number> }> = {
      journal: { name: 'Rain & Piano', sounds: { rain_gentle: 0.5, piano: 0.3 } },
      chat: { name: 'Soft Rain', sounds: { rain_gentle: 0.4 } },
      breathing: { name: 'Ocean Waves', sounds: { ocean: 0.5 } },
      meditation: { name: 'Tibetan Bowls & Pads', sounds: { tibetan_bowl: 0.4, pads: 0.2 } },
      focus: { name: 'Brown Noise & Rain', sounds: { brown_noise: 0.4, rain_gentle: 0.3 } },
      sleep: { name: 'Night Crickets & Breeze', sounds: { crickets: 0.5, breeze: 0.2 } },
      stress: { name: 'Forest & Wind', sounds: { forest: 0.4, wind: 0.2 } }
    };

    const rec = config[activity];
    if (rec) {
      set({ recommendation: { activity, name: rec.name, sounds: rec.sounds } });
    }
  },

  loadPreferences: async () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('calmnest_ambient_preferences');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed) {
          set({
            favorites: parsed.favorites || [],
            customMixes: parsed.customMixes || [],
            masterVolume: parsed.masterVolume !== undefined ? parsed.masterVolume : 0.5
          });
          AmbientSoundEngine.getInstance().setMasterVolume(get().masterVolume);
        }
      }
    } catch (e) {}

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const dbPrefs = await getAmbientPreferences(session.user.id);
        if (dbPrefs) {
          set({
            favorites: dbPrefs.favorites || [],
            customMixes: dbPrefs.custom_mixes || [],
            masterVolume: dbPrefs.volume_ratios?.masterVolume !== undefined ? dbPrefs.volume_ratios.masterVolume : get().masterVolume
          });
          AmbientSoundEngine.getInstance().setMasterVolume(get().masterVolume);
        }
      }
    } catch (e) {
      console.warn("Failed to load ambient sound preferences from DB:", e);
    }
  },

  savePreferencesToStorage: async () => {
    if (typeof window === 'undefined') return;
    try {
      const { favorites, customMixes, masterVolume } = get();
      window.localStorage.setItem(
        'calmnest_ambient_preferences',
        JSON.stringify({ favorites, customMixes, masterVolume })
      );

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await saveAmbientPreferences(session.user.id, {
          favorites,
          customMixes,
          volumeRatios: { masterVolume }
        });
      }
    } catch (e) {
      console.warn("Failed to save ambient sound preferences to DB:", e);
    }
  }
}));
