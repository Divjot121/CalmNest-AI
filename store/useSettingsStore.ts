'use client';

import { create } from 'zustand';
import { getStoredPreferences, savePreferencesRemote, syncPreferencesFromRemote, UserPreferences, getOrCreateAnonymousUUID } from '@/lib/identity-service';
import { auth } from '@/lib/firebase';

export type SettingsTab = 'appearance' | 'language' | 'ai' | 'audio' | 'dashboard' | 'privacy';

interface SettingsState {
  isOpen: boolean;
  activeTab: SettingsTab;
  preferences: UserPreferences;
  openSettings: (tab?: SettingsTab) => void;
  closeSettings: () => void;
  setActiveTab: (tab: SettingsTab) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  loadPreferences: () => Promise<void>;
  initDomStyles: () => void;
}

function applyDomStyles(prefs: UserPreferences) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  // 1. Theme
  if (prefs.theme === 'dark') {
    root.classList.add('dark');
  } else if (prefs.theme === 'light') {
    root.classList.remove('dark');
  } else if (prefs.theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }
  // 2. Font Size
  root.classList.remove('font-size-regular', 'font-size-large', 'font-size-xlarge');
  root.classList.add(`font-size-${prefs.fontSize || 'regular'}`);
  // 3. Motion Style
  root.classList.remove('motion-style-gentle', 'motion-style-reduced');
  root.classList.add(`motion-style-${prefs.motionStyle || 'gentle'}`);
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  isOpen: false,
  activeTab: 'appearance',
  preferences: getStoredPreferences(),
  openSettings: (tab = 'appearance') => {
    const prefs = getStoredPreferences();
    set({ isOpen: true, activeTab: tab, preferences: prefs });
  },
  closeSettings: () => {
    set({ isOpen: false });
  },
  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },
  updatePreferences: async (updates) => {
    const current = get().preferences;
    const updated = { ...current, ...updates };

    // 1. Optimistic Update (UI reacts instantly)
    set({ preferences: updated });
    applyDomStyles(updated);

    // 2. Fast synchronous local storage save
    if (typeof window !== 'undefined') {
      try {
        const deviceId = getOrCreateAnonymousUUID();
        const deviceSpecificKey = `calmnest_user_prefs_${deviceId}`;
        window.localStorage.setItem(deviceSpecificKey, JSON.stringify(updated));
        window.localStorage.setItem('calmnest_user_prefs', JSON.stringify(updated));
      } catch (e) {}
    }

    // 3. Background debounced Firestore sync (no await, returns immediately)
    savePreferencesRemote(updated).catch((err) => {
      console.warn("Background preferences sync failed:", err);
    });
  },
  loadPreferences: async () => {
    let prefs = getStoredPreferences();
    if (auth.currentUser) {
      try {
        const remote = await syncPreferencesFromRemote(auth.currentUser.uid);
        if (remote) prefs = remote;
      } catch (e) {}
    }
    set({ preferences: prefs });
    applyDomStyles(prefs);
  },
  initDomStyles: () => {
    const prefs = getStoredPreferences();
    applyDomStyles(prefs);
  }
}));
