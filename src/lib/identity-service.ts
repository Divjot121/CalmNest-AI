'use client';

import { supabase } from './supabase';

const ANON_STORAGE_KEY = 'calmnest_anon_uuid';
const ANON_COOKIE_KEY = 'calmnest_anon_uuid';
const ANON_PREFS_KEY = 'calmnest_user_prefs';

export interface UserPreferences {
  // --- Appearance ---
  language: 'en' | 'hi' | 'pa' | string;
  theme: 'light' | 'dark' | 'system';
  accentColor: 'slate' | 'emerald' | 'violet' | 'rose' | 'amber' | 'teal' | 'indigo';
  fontSize: 'regular' | 'large' | 'xlarge';
  fontFamily: 'standard' | 'serif' | 'monospace' | 'dyslexia';
  layoutDensity: 'compact' | 'comfortable';
  motionStyle: 'gentle' | 'reduced';
  accessibilityTheme: 'normal' | 'high-contrast';

  // --- AI Preferences ---
  aiPersonality: 'counselor' | 'mentor' | 'companion' | 'philosopher';
  aiResponseLength: 'short' | 'medium' | 'long';
  aiPreferredLanguage: 'en' | 'hi' | 'pa' | 'auto';
  aiEmpathyLevel: 'high' | 'moderate' | 'low';
  aiStreamingEnabled: boolean;
  aiSuggestedQuestions: boolean;
  aiVoiceOutput: boolean;
  aiMemoryEnabled: boolean;
  aiDailyReflection: boolean;

  // --- Ambient Sound ---
  ambientSound: 'rain' | 'ocean' | 'forest' | 'silence' | string;
  ambientVolume: number; // 0 to 100
  ambientLastPlayed: string;
  ambientAutoResume: boolean;
  ambientTimer: number; // 0 for loop, or minutes
  ambientMixes: string[];
  ambientLoop: boolean;

  // --- Dashboard ---
  dashboardLayout: string[];
  dashboardLandingPage: 'dashboard' | 'chat' | 'journal' | 'breathing';
  dashboardShowQuickActions: boolean;
  dashboardGreetingVisible: boolean;
  dashboardShowQuote: boolean;
  dashboardShowMood: boolean;
  dashboardShowHabits: boolean;
  dashboardShowQuickChat: boolean;
  dashboardShowMeditation: boolean;

  // --- Notifications (Reminders) ---
  remindCheckIn: boolean;
  remindCheckInTime: string;
  remindCheckInFrequency: 'daily' | 'weekly';
  remindJournal: boolean;
  remindJournalTime: string;
  remindMeditation: boolean;
  remindMeditationTime: string;
  remindHabit: boolean;
  remindHabitTime: string;
  remindWeeklySummary: boolean;
  remindMonthlyReport: boolean;
  remindProductUpdates: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  timezone: string;

  // --- Privacy & Retention ---
  dataRetention: 'indefinite' | '90_days' | '1_year';

  // --- Accessibility ---
  screenReaderOptimized: boolean;
  keyboardNavEnabled: boolean;

  // --- Wellness ---
  wellnessMeditationLength: number; // minutes
  wellnessBreathingExercise: string;
  wellnessDailyGoalMinutes: number;
  wellnessHabitGoalsCount: number;
  wellnessAmbientMusic: string;
  wellnessMoodFrequency: 'daily' | 'twice_daily' | 'hourly';
  wellnessSleepReminder: boolean;
  wellnessSleepReminderTime: string;
  wellnessGratitudeReminder: boolean;
  wellnessGratitudeReminderTime: string;

  // --- Compatibility & Historical Fields ---
  streakDays: number;
  lastActiveDate: string;
  defaultBreathingRhythm: '4-7-8' | 'box' | 'coherent';
  preferredBreathingExercise: string;
  favoriteMeditation: string;
  notificationsEnabled: boolean;
  privacyMode: boolean;
  reminderTime: string;
  aiVoiceOrStyle: 'warm' | 'concise' | 'poetic';
}

const DEFAULT_PREFERENCES: UserPreferences = {
  // --- Appearance ---
  language: 'en',
  theme: 'dark',
  accentColor: 'slate',
  fontSize: 'regular',
  fontFamily: 'standard',
  layoutDensity: 'comfortable',
  motionStyle: 'gentle',
  accessibilityTheme: 'normal',

  // --- AI Preferences ---
  aiPersonality: 'counselor',
  aiResponseLength: 'medium',
  aiPreferredLanguage: 'auto',
  aiEmpathyLevel: 'high',
  aiStreamingEnabled: true,
  aiSuggestedQuestions: true,
  aiVoiceOutput: false,
  aiMemoryEnabled: true,
  aiDailyReflection: true,

  // --- Ambient Sound ---
  ambientSound: 'rain',
  ambientVolume: 50,
  ambientLastPlayed: 'rain',
  ambientAutoResume: false,
  ambientTimer: 0,
  ambientMixes: [],
  ambientLoop: true,

  // --- Dashboard ---
  dashboardLayout: ['greeting', 'mood', 'quick-chat', 'habits', 'streak'],
  dashboardLandingPage: 'dashboard',
  dashboardShowQuickActions: true,
  dashboardGreetingVisible: true,
  dashboardShowQuote: true,
  dashboardShowMood: true,
  dashboardShowHabits: true,
  dashboardShowQuickChat: true,
  dashboardShowMeditation: true,

  // --- Notifications (Reminders) ---
  remindCheckIn: true,
  remindCheckInTime: '09:00',
  remindCheckInFrequency: 'daily',
  remindJournal: false,
  remindJournalTime: '21:00',
  remindMeditation: false,
  remindMeditationTime: '18:00',
  remindHabit: false,
  remindHabitTime: '08:00',
  remindWeeklySummary: true,
  remindMonthlyReport: false,
  remindProductUpdates: false,
  emailNotifications: true,
  pushNotifications: false,
  timezone: 'GMT+5:30',

  // --- Privacy & Retention ---
  dataRetention: 'indefinite',

  // --- Accessibility ---
  screenReaderOptimized: false,
  keyboardNavEnabled: false,

  // --- Wellness ---
  wellnessMeditationLength: 10,
  wellnessBreathingExercise: '4-7-8',
  wellnessDailyGoalMinutes: 15,
  wellnessHabitGoalsCount: 3,
  wellnessAmbientMusic: 'piano',
  wellnessMoodFrequency: 'daily',
  wellnessSleepReminder: false,
  wellnessSleepReminderTime: '22:30',
  wellnessGratitudeReminder: false,
  wellnessGratitudeReminderTime: '20:00',

  // --- Compatibility & Historical Fields ---
  streakDays: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  defaultBreathingRhythm: '4-7-8',
  preferredBreathingExercise: '4-7-8',
  favoriteMeditation: 'Deep Calm',
  notificationsEnabled: true,
  privacyMode: false,
  reminderTime: '21:00',
  aiVoiceOrStyle: 'warm',
};

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookieValue(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function generateSecureUUID(): string {
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
    try {
      return window.crypto.randomUUID();
    } catch (e) {}
  }
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(4);
    window.crypto.getRandomValues(array);
    return 'anon_' + Array.from(array, dec => dec.toString(16).padStart(8, '0')).join('-');
  }
  return 'anon_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
}

export function getOrCreateAnonymousUUID(): string {
  if (typeof window === 'undefined') return 'server_render_uuid';

  let uuid = window.localStorage.getItem(ANON_STORAGE_KEY);
  if (!uuid) {
    uuid = getCookieValue(ANON_COOKIE_KEY);
  }
  if (!uuid) {
    uuid = generateSecureUUID();
  }

  try {
    window.localStorage.setItem(ANON_STORAGE_KEY, uuid);
    setCookieValue(ANON_COOKIE_KEY, uuid);
  } catch (e) {
    console.warn("Storage warning during identity sync:", e);
  }

  return uuid;
}

/**
 * Retrieves the active Supabase Auth User ID (or fallback anonymous UUID).
 * Note: property 'firebaseUid' is aliased to 'supabaseUid' for backward compatibility.
 */
export async function getEffectiveIdentity(): Promise<{ anonUuid: string; firebaseUid: string; supabaseUid: string; isOnlineAuth: boolean }> {
  const anonUuid = getOrCreateAnonymousUUID();

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) {
      return {
        anonUuid,
        firebaseUid: session.user.id,
        supabaseUid: session.user.id,
        isOnlineAuth: true
      };
    }

    // Attempt non-blocking anonymous sign in if no active user
    const { data: anonData, error } = await supabase.auth.signInAnonymously();
    if (!error && anonData?.user) {
      syncIdentityToRemote(anonUuid, anonData.user.id).catch(() => {});
      return {
        anonUuid,
        firebaseUid: anonData.user.id,
        supabaseUid: anonData.user.id,
        isOnlineAuth: true
      };
    }
  } catch (e) {
    // Operate in offline resilience mode using anonUuid
  }

  return {
    anonUuid,
    firebaseUid: anonUuid,
    supabaseUid: anonUuid,
    isOnlineAuth: false
  };
}

async function syncIdentityToRemote(anonUuid: string, userId: string): Promise<void> {
  try {
    await supabase.from('profiles').upsert({
      id: userId,
      role: 'USER',
      last_check_in: new Date().toISOString()
    });

    await supabase.from('user_settings').upsert({
      user_id: userId,
      anon_uuid: anonUuid,
      is_anonymous: true,
      updated_at: new Date().toISOString()
    });
  } catch (e) {}
}

export function getStoredPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const deviceId = getOrCreateAnonymousUUID();
    const deviceSpecificKey = `${ANON_PREFS_KEY}_${deviceId}`;
    const raw = window.localStorage.getItem(deviceSpecificKey) || window.localStorage.getItem(ANON_PREFS_KEY);
    
    if (!raw) {
      window.localStorage.setItem(deviceSpecificKey, JSON.stringify(DEFAULT_PREFERENCES));
      window.localStorage.setItem(ANON_PREFS_KEY, JSON.stringify(DEFAULT_PREFERENCES));
      return DEFAULT_PREFERENCES;
    }
    const parsed = JSON.parse(raw);
    
    const today = new Date().toISOString().split('T')[0];
    if (parsed.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (parsed.lastActiveDate === yesterday) {
        parsed.streakDays = (parsed.streakDays || 1) + 1;
      } else if (parsed.lastActiveDate !== today) {
        parsed.streakDays = Math.max(1, parsed.streakDays || 1);
      }
      parsed.lastActiveDate = today;
      window.localStorage.setItem(deviceSpecificKey, JSON.stringify(parsed));
      window.localStorage.setItem(ANON_PREFS_KEY, JSON.stringify(parsed));
    }
    
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch (e) {
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferencesRemote(prefs: UserPreferences): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || getOrCreateAnonymousUUID();
  const anonUuid = getOrCreateAnonymousUUID();
  try {
    await supabase.from('user_settings').upsert({
      user_id: userId,
      anon_uuid: anonUuid,
      preferences: prefs,
      is_anonymous: !session?.user || session.user.is_anonymous || false,
      updated_at: new Date().toISOString()
    });
  } catch (e) {}
}

export async function syncPreferencesFromRemote(uid?: string): Promise<UserPreferences | null> {
  const targetId = uid || (await supabase.auth.getSession()).data.session?.user?.id || getOrCreateAnonymousUUID();
  const anonUuid = getOrCreateAnonymousUUID();
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('preferences')
      .or(`user_id.eq.${targetId},anon_uuid.eq.${anonUuid}`)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!error && data?.preferences) {
      return { ...DEFAULT_PREFERENCES, ...data.preferences };
    }
  } catch (e) {}
  return null;
}

function getLocalList<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function setLocalList<T>(key: string, list: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {}
}

export interface CapturedAnonData {
  journalEntries: any[];
  moodLogs: any[];
  habits: any[];
  habitCompletions: { date: string; habitIds: string[] }[];
  assessments: any[];
  wellnessSessions: any[];
}

export async function captureAnonymousData(oldUid: string): Promise<CapturedAnonData> {
  const data: CapturedAnonData = {
    journalEntries: [],
    moodLogs: [],
    habits: [],
    habitCompletions: [],
    assessments: [],
    wellnessSessions: []
  };

  if (!oldUid) return data;

  data.journalEntries = getLocalList<any>(`calmnest_journalEntries_${oldUid}`);
  data.moodLogs = getLocalList<any>(`calmnest_moodLogs_${oldUid}`);
  data.habits = getLocalList<any>(`calmnest_habits_${oldUid}`);
  data.assessments = getLocalList<any>(`calmnest_assessments_${oldUid}`);
  data.wellnessSessions = getLocalList<any>(`calmnest_wellnessSessions_${oldUid}`);

  const prefix = `calmnest_completions_${oldUid}_`;
  if (typeof window !== 'undefined') {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const dateStr = key.substring(prefix.length);
        const habitIds = getLocalList<string>(key);
        data.habitCompletions.push({ date: dateStr, habitIds });
      }
    }
  }

  try {
    const { data: journals } = await supabase.from('journals').select('*').or(`user_id.eq.${oldUid},anon_uuid.eq.${oldUid}`);
    if (journals) {
      journals.forEach(doc => {
        if (!data.journalEntries.some(e => e.id === doc.id)) data.journalEntries.push(doc);
      });
    }

    const { data: moods } = await supabase.from('moods').select('*').or(`user_id.eq.${oldUid},anon_uuid.eq.${oldUid}`);
    if (moods) {
      moods.forEach(doc => {
        if (!data.moodLogs.some(e => e.id === doc.id)) data.moodLogs.push(doc);
      });
    }

    const { data: habits } = await supabase.from('habits').select('*').or(`user_id.eq.${oldUid},anon_uuid.eq.${oldUid}`);
    if (habits) {
      habits.forEach(doc => {
        if (!data.habits.some(e => e.id === doc.id)) data.habits.push(doc);
      });
    }

    const { data: assessments } = await supabase.from('assessment_results').select('*').or(`user_id.eq.${oldUid},anon_uuid.eq.${oldUid}`);
    if (assessments) {
      assessments.forEach(doc => {
        if (!data.assessments.some(e => e.id === doc.id)) data.assessments.push(doc);
      });
    }

    const { data: wellness } = await supabase.from('meditation_sessions').select('*').or(`user_id.eq.${oldUid},anon_uuid.eq.${oldUid}`);
    if (wellness) {
      wellness.forEach(doc => {
        if (!data.wellnessSessions.some(e => e.id === doc.id)) data.wellnessSessions.push(doc);
      });
    }
  } catch (e) {
    console.warn("[Identity Service] Non-blocking notice: Could not fetch remote anonymous data:", e);
  }

  return data;
}

export async function mergeCapturedDataToAccount(oldUid: string, newAccountUid: string, data: CapturedAnonData): Promise<void> {
  if (oldUid === newAccountUid) return;

  console.log(`[Identity Service] Merging captured anonymous profile data of ${oldUid} into account ${newAccountUid}...`);
  const anonUuid = getOrCreateAnonymousUUID();

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(`calmnest_journalEntries_${newAccountUid}`, JSON.stringify(data.journalEntries));
    window.localStorage.setItem(`calmnest_moodLogs_${newAccountUid}`, JSON.stringify(data.moodLogs));
    window.localStorage.setItem(`calmnest_habits_${newAccountUid}`, JSON.stringify(data.habits));
    window.localStorage.setItem(`calmnest_assessments_${newAccountUid}`, JSON.stringify(data.assessments));
    window.localStorage.setItem(`calmnest_wellnessSessions_${newAccountUid}`, JSON.stringify(data.wellnessSessions));

    data.habitCompletions.forEach(c => {
      window.localStorage.setItem(`calmnest_completions_${newAccountUid}_${c.date}`, JSON.stringify(c.habitIds));
    });

    const prefs = getStoredPreferences();
    window.localStorage.setItem(`${ANON_PREFS_KEY}_${newAccountUid}`, JSON.stringify(prefs));

    window.localStorage.removeItem(`calmnest_journalEntries_${oldUid}`);
    window.localStorage.removeItem(`calmnest_moodLogs_${oldUid}`);
    window.localStorage.removeItem(`calmnest_habits_${oldUid}`);
    window.localStorage.removeItem(`calmnest_assessments_${oldUid}`);
    window.localStorage.removeItem(`calmnest_wellnessSessions_${oldUid}`);
    data.habitCompletions.forEach(c => {
      window.localStorage.removeItem(`calmnest_completions_${oldUid}_${c.date}`);
    });
  }

  try {
    // 1. Merge user settings (preferences)
    const { data: anonSettings } = await supabase.from('user_settings').select('*').eq('user_id', oldUid).maybeSingle();
    const prefs = getStoredPreferences();
    const { data: userSettings } = await supabase.from('user_settings').select('*').eq('user_id', newAccountUid).maybeSingle();
    if (userSettings) {
      const mergedPrefs = { ...prefs, ...(anonSettings?.preferences || {}), ...(userSettings.preferences || {}) };
      await supabase.from('user_settings').update({
        preferences: mergedPrefs,
        merged_at: new Date().toISOString(),
        is_anonymous: false
      }).eq('user_id', newAccountUid);
      if (anonSettings) {
        await supabase.from('user_settings').delete().eq('user_id', oldUid);
      }
    } else {
      await supabase.from('user_settings').upsert({
        user_id: newAccountUid,
        anon_uuid: anonUuid,
        preferences: anonSettings?.preferences || prefs,
        is_anonymous: false,
        merged_at: new Date().toISOString()
      });
      if (anonSettings) {
        await supabase.from('user_settings').delete().eq('user_id', oldUid);
      }
    }

    // 2. Merge streaks
    const { data: anonStreak } = await supabase.from('streaks').select('*').eq('user_id', oldUid).maybeSingle();
    if (anonStreak) {
      const { data: userStreak } = await supabase.from('streaks').select('*').eq('user_id', newAccountUid).maybeSingle();
      if (userStreak) {
        const mergedCurrent = Math.max(anonStreak.current_streak || 1, userStreak.current_streak || 1);
        const mergedBest = Math.max(anonStreak.best_streak || 1, userStreak.best_streak || 1);
        await supabase.from('streaks').update({
          current_streak: mergedCurrent,
          best_streak: mergedBest,
          last_activity_date: anonStreak.last_activity_date || userStreak.last_activity_date
        }).eq('user_id', newAccountUid);
        await supabase.from('streaks').delete().eq('user_id', oldUid);
      } else {
        await supabase.from('streaks').upsert({
          user_id: newAccountUid,
          anon_uuid: anonUuid,
          current_streak: anonStreak.current_streak,
          best_streak: anonStreak.best_streak,
          last_activity_date: anonStreak.last_activity_date
        });
        await supabase.from('streaks').delete().eq('user_id', oldUid);
      }
    }

    // 3. Merge ambient preferences
    const { data: anonAmbient } = await supabase.from('ambient_preferences').select('*').eq('user_id', oldUid).maybeSingle();
    if (anonAmbient) {
      const { data: userAmbient } = await supabase.from('ambient_preferences').select('*').eq('user_id', newAccountUid).maybeSingle();
      if (userAmbient) {
        const mergedFavorites = Array.from(new Set([...(anonAmbient.favorites || []), ...(userAmbient.favorites || [])]));
        const mergedMixes = [...(anonAmbient.custom_mixes || []), ...(userAmbient.custom_mixes || [])];
        const mergedVolume = { ...(anonAmbient.volume_ratios || {}), ...(userAmbient.volume_ratios || {}) };
        await supabase.from('ambient_preferences').update({
          favorites: mergedFavorites,
          custom_mixes: mergedMixes,
          volume_ratios: mergedVolume
        }).eq('user_id', newAccountUid);
        await supabase.from('ambient_preferences').delete().eq('user_id', oldUid);
      } else {
        await supabase.from('ambient_preferences').upsert({
          user_id: newAccountUid,
          favorites: anonAmbient.favorites,
          custom_mixes: anonAmbient.custom_mixes,
          volume_ratios: anonAmbient.volume_ratios
        });
        await supabase.from('ambient_preferences').delete().eq('user_id', oldUid);
      }
    }

    // 4. Update simple ownership reference tables
    const filter = `user_id.eq.${oldUid},anon_uuid.eq.${oldUid}`;
    await supabase.from('journals').update({ user_id: newAccountUid }).or(filter);
    await supabase.from('moods').update({ user_id: newAccountUid }).or(filter);
    await supabase.from('habits').update({ user_id: newAccountUid }).or(filter);
    await supabase.from('habit_logs').update({ user_id: newAccountUid }).or(filter);
    await supabase.from('meditation_sessions').update({ user_id: newAccountUid }).or(filter);
    await supabase.from('breathing_sessions').update({ user_id: newAccountUid }).or(filter);
    await supabase.from('assessment_results').update({ user_id: newAccountUid }).or(filter);
    await supabase.from('conversations').update({ user_id: newAccountUid }).or(filter);
    await supabase.from('wellness_plans').update({ user_id: newAccountUid }).or(filter);
    await supabase.from('ai_memory').update({ user_id: newAccountUid }).or(filter);
    await supabase.from('notifications').update({ user_id: newAccountUid }).or(filter);
    await supabase.from('reminders').update({ user_id: newAccountUid }).or(filter);
  } catch (e) {
    console.error("[Identity Service] Supabase upload during merge failed:", e);
  }
}

export async function mergeAnonymousProfileToAccount(oldUid: string, newAccountUid?: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const finalNewUid = newAccountUid || (session?.user ? session.user.id : oldUid);
  if (oldUid === finalNewUid) return;
  const data = await captureAnonymousData(oldUid);
  await mergeCapturedDataToAccount(oldUid, finalNewUid, data);
}

export function exportAllAnonymousData(): Record<string, any> {
  if (typeof window === 'undefined') return {};
  const data: Record<string, any> = {
    exportDate: new Date().toISOString(),
    anonUuid: getOrCreateAnonymousUUID(),
    preferences: getStoredPreferences(),
    journalEntries: [],
    moodLogs: [],
    habits: [],
    chatMessages: []
  };

  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith('calmnest_')) {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw) data[key] = JSON.parse(raw);
      } catch (e) {}
    }
  }
  return data;
}

export async function deleteAnonymousDataAndReset(): Promise<void> {
  if (typeof window === 'undefined') return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith('calmnest_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => window.localStorage.removeItem(k));
  
  setCookieValue(ANON_COOKIE_KEY, '', -1);
  
  await supabase.auth.signOut().catch(() => {});
  
  getOrCreateAnonymousUUID();
}
