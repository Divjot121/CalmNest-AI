'use client';

import { auth, db } from './firebase';
import { signInAnonymously, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, getDocs, writeBatch, query, where } from 'firebase/firestore';

const ANON_STORAGE_KEY = 'calmnest_anon_uuid';
const ANON_COOKIE_KEY = 'calmnest_anon_uuid';
const ANON_PREFS_KEY = 'calmnest_user_prefs';

export interface UserPreferences {
  language: 'en' | 'hi' | 'pa' | string;
  theme: 'light' | 'dark' | 'system';
  fontSize: 'regular' | 'large' | 'xlarge';
  motionStyle: 'gentle' | 'reduced';
  aiVoiceOrStyle: 'warm' | 'concise' | 'poetic';
  ambientSound: 'rain' | 'ocean' | 'forest' | 'silence';
  defaultBreathingRhythm: '4-7-8' | 'box' | 'coherent';
  dashboardLayout: string[];
  dashboardShowQuote: boolean;
  dashboardShowMood: boolean;
  dashboardShowHabits: boolean;
  dashboardShowQuickChat: boolean;
  dashboardShowMeditation: boolean;
  streakDays: number;
  lastActiveDate: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'en',
  theme: 'dark',
  fontSize: 'regular',
  motionStyle: 'gentle',
  aiVoiceOrStyle: 'warm',
  ambientSound: 'rain',
  defaultBreathingRhythm: '4-7-8',
  dashboardLayout: ['greeting', 'mood', 'quick-chat', 'habits', 'streak'],
  dashboardShowQuote: true,
  dashboardShowMood: true,
  dashboardShowHabits: true,
  dashboardShowQuickChat: true,
  dashboardShowMeditation: true,
  streakDays: 1,
  lastActiveDate: new Date().toISOString().split('T')[0]
};

/**
 * Helper: Read cookie by name
 */
function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Helper: Set secure cookie
 */
function setCookieValue(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Generates a cryptographically secure UUID v4 or fallback random string
 */
export function generateSecureUUID(): string {
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
    try {
      return window.crypto.randomUUID();
    } catch (e) {}
  }
  // Fallback cryptographically random hex
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(4);
    window.crypto.getRandomValues(array);
    return 'anon_' + Array.from(array, dec => dec.toString(16).padStart(8, '0')).join('-');
  }
  return 'anon_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
}

/**
 * Retrieves or initializes the persistent anonymous UUID across LocalStorage, Cookies, and IndexedDB
 */
export function getOrCreateAnonymousUUID(): string {
  if (typeof window === 'undefined') return 'server_render_uuid';

  // 1. Check LocalStorage
  let uuid = window.localStorage.getItem(ANON_STORAGE_KEY);

  // 2. If not in LocalStorage, check Cookie
  if (!uuid) {
    uuid = getCookieValue(ANON_COOKIE_KEY);
  }

  // 3. If neither exists, generate new secure UUID
  if (!uuid) {
    uuid = generateSecureUUID();
  }

  // Ensure both LocalStorage and Cookie are synchronized
  try {
    window.localStorage.setItem(ANON_STORAGE_KEY, uuid);
    setCookieValue(ANON_COOKIE_KEY, uuid);
  } catch (e) {
    console.warn("Storage warning during identity sync:", e);
  }

  return uuid;
}

/**
 * Retrieves the currently active Firebase Auth UID (if signed in) or falls back to anonymous UUID.
 * Using Firebase Auth UID ensures remote Firestore security rules (request.auth.uid == userId) pass cleanly.
 */
export async function getEffectiveIdentity(): Promise<{ anonUuid: string; firebaseUid: string; isOnlineAuth: boolean }> {
  const anonUuid = getOrCreateAnonymousUUID();

  if (auth.currentUser) {
    return {
      anonUuid,
      firebaseUid: auth.currentUser.uid,
      isOnlineAuth: true
    };
  }

  // Attempt non-blocking anonymous sign in if no active user
  try {
    const cred = await signInAnonymously(auth);
    if (cred.user) {
      // Sync anonymous identity record in Firestore asynchronously
      syncIdentityToRemote(anonUuid, cred.user.uid).catch(() => {});
      return {
        anonUuid,
        firebaseUid: cred.user.uid,
        isOnlineAuth: true
      };
    }
  } catch (e) {
    // If offline or auth fails, we operate in offline resilience mode using anonUuid
  }

  return {
    anonUuid,
    firebaseUid: anonUuid,
    isOnlineAuth: false
  };
}

/**
 * Synchronizes the anonymous UUID record with the Firebase Auth UID on Google Cloud Firestore
 */
async function syncIdentityToRemote(anonUuid: string, firebaseUid: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', firebaseUid);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      await setDoc(userDocRef, {
        anonUuid,
        firebaseUid,
        isAnonymous: true,
        createdAt: serverTimestamp(),
        lastActiveAt: serverTimestamp()
      }, { merge: true });
    } else {
      await updateDoc(userDocRef, {
        lastActiveAt: serverTimestamp()
      });
    }
  } catch (e) {
    // Silently handled if offline or permission restricted
  }
}

/**
 * Load User Preferences tied to exact Device ID (Language, Theme, Dashboard State, Streaks)
 */
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
    
    // Check and update streak automatically
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

/**
 * Helper to get and set local lists
 */
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

/**
 * Save User Preferences locally according to Device ID and to Firestore asynchronously
 */
export async function savePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  const current = getStoredPreferences();
  const updated = { ...current, ...prefs };
  if (typeof window !== 'undefined') {
    try {
      const deviceId = getOrCreateAnonymousUUID();
      const deviceSpecificKey = `${ANON_PREFS_KEY}_${deviceId}`;
      window.localStorage.setItem(deviceSpecificKey, JSON.stringify(updated));
      window.localStorage.setItem(ANON_PREFS_KEY, JSON.stringify(updated));
    } catch (e) {}
  }

  // Sync to remote in background
  savePreferencesRemote(updated).catch(() => {});

  return updated;
}

let syncTimeoutId: any = null;

/**
 * Debounced Firestore Sync for Preferences
 */
export async function savePreferencesRemote(updated: UserPreferences): Promise<void> {
  if (typeof window === 'undefined') return;

  if (syncTimeoutId) {
    clearTimeout(syncTimeoutId);
  }

  return new Promise((resolve) => {
    syncTimeoutId = setTimeout(async () => {
      try {
        const deviceId = getOrCreateAnonymousUUID();
        const { firebaseUid, isOnlineAuth } = await getEffectiveIdentity();
        if (isOnlineAuth) {
          await setDoc(doc(db, 'users', firebaseUid), {
            preferences: updated,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
        await setDoc(doc(db, 'devicePreferences', deviceId), {
          deviceId,
          preferences: updated,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.warn("[Identity Service] Background preferences sync failed:", e);
      }
      resolve();
    }, 1000);
  });
}

/**
 * Load Preferences from user's remote Firestore profile
 */
export async function syncPreferencesFromRemote(uid: string): Promise<UserPreferences | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.preferences) {
        const remotePrefs = data.preferences as UserPreferences;
        if (typeof window !== 'undefined') {
          const deviceId = getOrCreateAnonymousUUID();
          const deviceSpecificKey = `${ANON_PREFS_KEY}_${deviceId}`;
          window.localStorage.setItem(deviceSpecificKey, JSON.stringify(remotePrefs));
          window.localStorage.setItem(ANON_PREFS_KEY, JSON.stringify(remotePrefs));
        }
        return remotePrefs;
      }
    }
  } catch (e) {
    console.error("[Identity Service] Failed to sync preferences from remote:", e);
  }
  return null;
}

export interface CapturedAnonData {
  journalEntries: any[];
  moodLogs: any[];
  habits: any[];
  habitCompletions: { date: string; habitIds: string[] }[];
  assessments: any[];
}

/**
 * Capture all local and Firestore data for the anonymous user BEFORE they log in to the new account
 */
export async function captureAnonymousData(oldUid: string): Promise<CapturedAnonData> {
  const data: CapturedAnonData = {
    journalEntries: [],
    moodLogs: [],
    habits: [],
    habitCompletions: [],
    assessments: []
  };

  if (!oldUid) return data;

  // 1. Read from LocalStorage
  data.journalEntries = getLocalList<any>(`calmnest_journalEntries_${oldUid}`);
  data.moodLogs = getLocalList<any>(`calmnest_moodLogs_${oldUid}`);
  data.habits = getLocalList<any>(`calmnest_habits_${oldUid}`);
  data.assessments = getLocalList<any>(`calmnest_assessments_${oldUid}`);

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

  // 2. Query Firestore (whilst still signed in as oldUid)
  try {
    const journalSnap = await getDocs(query(collection(db, 'journalEntries'), where('userId', '==', oldUid)));
    journalSnap.docs.forEach(doc => {
      const docData = doc.data();
      if (!data.journalEntries.some(e => e.id === doc.id || (e.title === docData.title && e.createdAt === docData.createdAt))) {
        data.journalEntries.push({ id: doc.id, ...docData });
      }
    });

    const moodSnap = await getDocs(query(collection(db, 'moodLogs'), where('userId', '==', oldUid)));
    moodSnap.docs.forEach(doc => {
      const docData = doc.data();
      if (!data.moodLogs.some(e => e.id === doc.id || e.createdAt === docData.createdAt)) {
        data.moodLogs.push({ id: doc.id, ...docData });
      }
    });

    const habitSnap = await getDocs(query(collection(db, 'habits'), where('userId', '==', oldUid)));
    habitSnap.docs.forEach(doc => {
      const docData = doc.data();
      if (!data.habits.some(e => e.id === doc.id || e.name === docData.name)) {
        data.habits.push({ id: doc.id, ...docData });
      }
    });

    const completionSnap = await getDocs(query(collection(db, 'habitCompletions'), where('userId', '==', oldUid)));
    completionSnap.docs.forEach(doc => {
      const docData = doc.data();
      const existing = data.habitCompletions.find(c => c.date === docData.date);
      if (existing) {
        if (!existing.habitIds.includes(docData.habitId)) {
          existing.habitIds.push(docData.habitId);
        }
      } else {
        data.habitCompletions.push({ date: docData.date, habitIds: [docData.habitId] });
      }
    });

    const assessmentSnap = await getDocs(query(collection(db, 'assessments'), where('userId', '==', oldUid)));
    assessmentSnap.docs.forEach(doc => {
      const docData = doc.data();
      if (!data.assessments.some(e => e.id === doc.id || e.createdAt === docData.createdAt)) {
        data.assessments.push({ id: doc.id, ...docData });
      }
    });
  } catch (e) {
    console.warn("[Identity Service] Non-blocking notice: Could not fetch remote anonymous data for merging (probably offline):", e);
  }

  return data;
}

// Helper to batch write documents to Firestore
async function saveDocsToFirestore(colName: string, docs: any[], newUid: string) {
  if (docs.length === 0) return;
  const anonUuid = getOrCreateAnonymousUUID();
  let batch = writeBatch(db);
  let count = 0;
  for (const docData of docs) {
    const newDocRef = doc(collection(db, colName));
    const { id, ...cleanData } = docData;
    cleanData.userId = newUid;
    cleanData.anonUuid = anonUuid;
    
    if (cleanData.createdAt && typeof cleanData.createdAt === 'string') {
      cleanData.createdAt = new Date(cleanData.createdAt);
    }
    if (cleanData.updatedAt && typeof cleanData.updatedAt === 'string') {
      cleanData.updatedAt = new Date(cleanData.updatedAt);
    }

    batch.set(newDocRef, cleanData);
    count++;

    if (count === 400) {
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  }
  if (count > 0) {
    await batch.commit();
  }
}

/**
 * Merge captured anonymous data into the new authenticated account
 */
export async function mergeCapturedDataToAccount(oldUid: string, newAccountUid: string, data: CapturedAnonData): Promise<void> {
  if (oldUid === newAccountUid) return;

  console.log(`[Identity Service] Merging captured anonymous profile data of ${oldUid} into account ${newAccountUid}...`);

  const anonUuid = getOrCreateAnonymousUUID();

  // 1. Copy local storage keys over
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(`calmnest_journalEntries_${newAccountUid}`, JSON.stringify(data.journalEntries));
    window.localStorage.setItem(`calmnest_moodLogs_${newAccountUid}`, JSON.stringify(data.moodLogs));
    window.localStorage.setItem(`calmnest_habits_${newAccountUid}`, JSON.stringify(data.habits));
    window.localStorage.setItem(`calmnest_assessments_${newAccountUid}`, JSON.stringify(data.assessments));

    data.habitCompletions.forEach(c => {
      window.localStorage.setItem(`calmnest_completions_${newAccountUid}_${c.date}`, JSON.stringify(c.habitIds));
    });

    const prefs = getStoredPreferences();
    window.localStorage.setItem(`${ANON_PREFS_KEY}_${newAccountUid}`, JSON.stringify(prefs));

    // Clear old keys
    window.localStorage.removeItem(`calmnest_journalEntries_${oldUid}`);
    window.localStorage.removeItem(`calmnest_moodLogs_${oldUid}`);
    window.localStorage.removeItem(`calmnest_habits_${oldUid}`);
    window.localStorage.removeItem(`calmnest_assessments_${oldUid}`);
    data.habitCompletions.forEach(c => {
      window.localStorage.removeItem(`calmnest_completions_${oldUid}_${c.date}`);
    });
  }

  // 2. Upload to Firestore under the new UID
  try {
    const prefs = getStoredPreferences();
    await setDoc(doc(db, 'users', newAccountUid), {
      anonUuid,
      preferences: prefs,
      isAnonymous: false,
      mergedAt: serverTimestamp()
    }, { merge: true });

    await saveDocsToFirestore('journalEntries', data.journalEntries, newAccountUid);
    await saveDocsToFirestore('moodLogs', data.moodLogs, newAccountUid);
    await saveDocsToFirestore('habits', data.habits, newAccountUid);
    await saveDocsToFirestore('assessments', data.assessments, newAccountUid);

    if (data.habitCompletions.length > 0) {
      let batch = writeBatch(db);
      let count = 0;
      for (const comp of data.habitCompletions) {
        for (const habitId of comp.habitIds) {
          const newDocRef = doc(collection(db, 'habitCompletions'));
          batch.set(newDocRef, {
            userId: newAccountUid,
            anonUuid,
            habitId,
            date: comp.date,
            createdAt: serverTimestamp()
          });
          count++;
          if (count === 400) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
          }
        }
      }
      if (count > 0) {
        await batch.commit();
      }
    }
  } catch (e) {
    console.error("[Identity Service] Firestore upload during merge failed:", e);
  }
}

export async function mergeAnonymousProfileToAccount(oldUid: string, newAccountUid?: string): Promise<void> {
  const finalNewUid = newAccountUid || (auth.currentUser ? auth.currentUser.uid : oldUid);
  if (oldUid === finalNewUid) return;
  console.log(`[Identity Service] Legacy merge facade called for ${oldUid} -> ${finalNewUid}`);
  const data = await captureAnonymousData(oldUid);
  await mergeCapturedDataToAccount(oldUid, finalNewUid, data);
}

/**
 * Export all local and anonymous data as a structured JSON object
 */
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

  // Scan LocalStorage for all CalmNest records
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

/**
 * Permanently delete all anonymous data from browser storage and start a fresh profile
 */
export function deleteAnonymousDataAndReset(): void {
  if (typeof window === 'undefined') return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith('calmnest_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => window.localStorage.removeItem(k));
  
  // Clear cookie
  setCookieValue(ANON_COOKIE_KEY, '', -1);
  
  // Sign out of Firebase if signed in anonymously
  if (auth.currentUser && auth.currentUser.isAnonymous) {
    auth.signOut().catch(() => {});
  }
  
  // Generate a fresh anonymous ID immediately
  getOrCreateAnonymousUUID();
}
