'use client';

import { create } from 'zustand';
import { getStoredPreferences, savePreferencesRemote, syncPreferencesFromRemote, UserPreferences, getOrCreateAnonymousUUID } from '@/lib/identity-service';
import { supabase } from '@/lib/supabase';

export type SettingsTab = 'appearance' | 'language' | 'ai' | 'audio' | 'dashboard' | 'notifications' | 'wellness' | 'privacy' | 'security';

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

const ACCENT_COLORS = {
  slate: { primary: '#5C8397', hover: '#4B6F82', light: '#8DA9B7', subtle: '#E8F0F8' },
  emerald: { primary: '#6B907B', hover: '#567865', light: '#A8C8B5', subtle: '#E6EFEA' },
  violet: { primary: '#8D80A9', hover: '#73678F', light: '#C5B8DD', subtle: '#EFEAF6' },
  rose: { primary: '#B87B7B', hover: '#9E6464', light: '#DCA9A9', subtle: '#FCEAEA' },
  amber: { primary: '#C1885C', hover: '#A26F47', light: '#DEC1A9', subtle: '#F9EFE5' },
  teal: { primary: '#5C9794', hover: '#477E7B', light: '#8DB7B5', subtle: '#E8F6F5' },
  indigo: { primary: '#5C6597', hover: '#474E7E', light: '#8D94B7', subtle: '#E8EAF6' }
};

const FONTS = {
  standard: 'var(--font-sans), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
  monospace: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
  dyslexia: '"Comic Sans MS", "Comic Sans", cursive, sans-serif'
};

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

  // 4. Accessibility Theme
  root.classList.remove('theme-high-contrast');
  if (prefs.accessibilityTheme === 'high-contrast') {
    root.classList.add('theme-high-contrast');
  }

  // 5. Accent Color Custom Properties Injection
  const accent = ACCENT_COLORS[prefs.accentColor as keyof typeof ACCENT_COLORS] || ACCENT_COLORS.slate;
  root.style.setProperty('--color-primary', accent.primary);
  root.style.setProperty('--color-primary-hover', accent.hover);
  root.style.setProperty('--color-primary-light', accent.light);
  root.style.setProperty('--color-primary-subtle', accent.subtle);

  // 6. Font Family Property Injection
  const fontVal = FONTS[prefs.fontFamily as keyof typeof FONTS] || FONTS.standard;
  root.style.setProperty('--font-sans', fontVal);
  root.style.setProperty('--font-display', fontVal);

  // 7. Layout Density Toggle
  if (prefs.layoutDensity === 'compact') {
    root.classList.add('layout-compact');
  } else {
    root.classList.remove('layout-compact');
  }
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

    // 3. Background debounced Supabase sync (no await, returns immediately)
    savePreferencesRemote(updated).catch((err) => {
      console.warn("Background preferences sync failed:", err);
    });
  },
  loadPreferences: async () => {
    let prefs = getStoredPreferences();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const remote = await syncPreferencesFromRemote(session.user.id);
        if (remote) prefs = remote;
      }
    } catch (e) {}
    set({ preferences: prefs });
    applyDomStyles(prefs);
  },
  initDomStyles: () => {
    const prefs = getStoredPreferences();
    applyDomStyles(prefs);
  }
}));
