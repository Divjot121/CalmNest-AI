import { db, auth } from './firebase';
import { getOrCreateAnonymousUUID } from './identity-service';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// Helper for safe localStorage access in browser environment
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

export function resolveActiveUserIds(passedId?: string): string[] {
  const ids = new Set<string>();
  if (passedId && passedId.trim()) ids.add(passedId.trim());
  if (auth.currentUser?.uid) ids.add(auth.currentUser.uid);
  const anonId = getOrCreateAnonymousUUID();
  if (anonId) ids.add(anonId);
  return Array.from(ids);
}

export function resolveRemoteUserId(passedId?: string): string {
  if (auth.currentUser?.uid) return auth.currentUser.uid;
  if (passedId && passedId.trim()) return passedId.trim();
  const anonId = getOrCreateAnonymousUUID();
  return anonId || 'anonymous_fallback';
}

// --- USERS ---
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  streak: number;
  bestStreak: number;
  lastCheckIn?: string;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = { uid, ...userDoc.data() } as UserProfile;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`calmnest_profile_${uid}`, JSON.stringify(data));
      }
      return data;
    }
    return null;
  } catch (error: any) {
    // Fallback to local storage if permission denied or offline
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(`calmnest_profile_${uid}`);
      if (saved) return JSON.parse(saved) as UserProfile;
    }
    return null;
  }
}

export async function createOrUpdateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  if (typeof window !== 'undefined') {
    const existing = getLocalList<UserProfile>(`calmnest_profile_${uid}`);
    window.localStorage.setItem(`calmnest_profile_${uid}`, JSON.stringify({ ...existing, ...data, uid }));
  }
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  } catch (error: any) {
    // Silently handled by local storage fallback to prevent permission errors
  }
}

// --- MOOD & WELLNESS ---
export interface MoodLogData {
  id?: string;
  userId: string;
  moodScore: number;
  intensity: number;
  tags: string[];
  notes?: string;
  createdAt: any;
}

export async function logMoodEntry(userId: string, data: { moodScore: number; intensity: number; tags: string[]; notes?: string }): Promise<string> {
  const activeIds = resolveActiveUserIds(userId);
  const targetId = auth.currentUser ? auth.currentUser.uid : (activeIds[0] || userId);
  const localId = `local_mood_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const localItem: MoodLogData = {
    id: localId,
    userId: targetId,
    moodScore: data.moodScore,
    intensity: data.intensity,
    tags: data.tags,
    notes: data.notes || '',
    createdAt: new Date().toISOString(),
  };

  // Save across all local storage identity keys for bulletproof offline recovery
  activeIds.forEach(id => {
    const list = getLocalList<MoodLogData>(`calmnest_moodLogs_${id}`);
    setLocalList(`calmnest_moodLogs_${id}`, [localItem, ...list]);
  });

  try {
    if (!auth.currentUser) throw new Error('Unauthenticated');
    const docRef = await addDoc(collection(db, 'moodLogs'), {
      userId: targetId,
      anonUuid: getOrCreateAnonymousUUID(),
      moodScore: data.moodScore,
      intensity: data.intensity,
      tags: data.tags,
      notes: data.notes || '',
      createdAt: serverTimestamp(),
    });

    // Update local storage cache to use the real Firestore ID
    if (typeof window !== 'undefined') {
      activeIds.forEach(id => {
        const key = `calmnest_moodLogs_${id}`;
        const list = getLocalList<MoodLogData>(key);
        const index = list.findIndex(e => e.id === localId);
        if (index !== -1) {
          list[index].id = docRef.id;
          setLocalList(key, list);
        }
      });
    }

    return docRef.id;
  } catch (error: any) {
    return localId;
  }
}

export async function getRecentMoodLogs(userId: string, count = 30): Promise<MoodLogData[]> {
  const activeIds = resolveActiveUserIds(userId);
  const remoteUid = resolveRemoteUserId(userId);
  let remoteLogs: MoodLogData[] = [];
  try {
    if (!auth.currentUser) throw new Error('Unauthenticated');
    const q = query(
      collection(db, 'moodLogs'),
      where('userId', '==', remoteUid),
      orderBy('createdAt', 'desc'),
      limit(count)
    );
    const snap = await getDocs(q);
    remoteLogs = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      } as MoodLogData;
    });
  } catch (error: any) {}

  let localLogs: MoodLogData[] = [];
  activeIds.forEach(id => {
    localLogs.push(...getLocalList<MoodLogData>(`calmnest_moodLogs_${id}`));
  });

  const map = new Map<string, MoodLogData>();
  [...remoteLogs, ...localLogs].forEach(item => {
    const key = item.id || `${item.createdAt}_${item.moodScore}`;
    if (!map.has(key)) map.set(key, item);
  });

  return Array.from(map.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, count);
}

// --- JOURNAL ---
export interface JournalEntryData {
  id?: string;
  userId: string;
  title: string;
  content: string;
  moodTag?: string;
  customTags: string[];
  imageUrl?: string;
  isDraft: boolean;
  createdAt: any;
  updatedAt?: any;
}

export async function getJournalEntries(userId: string): Promise<JournalEntryData[]> {
  const activeIds = resolveActiveUserIds(userId);
  const remoteUid = resolveRemoteUserId(userId);
  let remoteEntries: JournalEntryData[] = [];
  try {
    if (!auth.currentUser) throw new Error('Unauthenticated');
    const q = query(
      collection(db, 'journalEntries'),
      where('userId', '==', remoteUid),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    remoteEntries = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as JournalEntryData;
    });
  } catch (error: any) {}

  let localEntries: JournalEntryData[] = [];
  activeIds.forEach(id => {
    localEntries.push(...getLocalList<JournalEntryData>(`calmnest_journalEntries_${id}`));
  });

  const map = new Map<string, JournalEntryData>();
  [...remoteEntries, ...localEntries].forEach(item => {
    const key = item.id || `${item.createdAt}_${item.title}`;
    if (!map.has(key)) map.set(key, item);
  });

  return Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function saveJournalEntry(userId: string, data: { title: string; content: string; moodTag?: string; customTags: string[]; imageUrl?: string; isDraft?: boolean }): Promise<string> {
  const activeIds = resolveActiveUserIds(userId);
  const targetId = auth.currentUser ? auth.currentUser.uid : (activeIds[0] || userId);
  const localId = `local_journal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const localItem: JournalEntryData = {
    id: localId,
    userId: targetId,
    title: data.title,
    content: data.content,
    moodTag: data.moodTag || '',
    customTags: data.customTags || [],
    imageUrl: data.imageUrl || '',
    isDraft: data.isDraft || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  activeIds.forEach(id => {
    const list = getLocalList<JournalEntryData>(`calmnest_journalEntries_${id}`);
    setLocalList(`calmnest_journalEntries_${id}`, [localItem, ...list]);
  });

  try {
    if (!auth.currentUser) throw new Error('Unauthenticated');
    const docRef = await addDoc(collection(db, 'journalEntries'), {
      userId: targetId,
      anonUuid: getOrCreateAnonymousUUID(),
      title: data.title,
      content: data.content,
      moodTag: data.moodTag || '',
      customTags: data.customTags || [],
      imageUrl: data.imageUrl || '',
      isDraft: data.isDraft || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update local storage cache to use the real Firestore ID
    if (typeof window !== 'undefined') {
      activeIds.forEach(id => {
        const key = `calmnest_journalEntries_${id}`;
        const list = getLocalList<JournalEntryData>(key);
        const index = list.findIndex(e => e.id === localId);
        if (index !== -1) {
          list[index].id = docRef.id;
          setLocalList(key, list);
        }
      });
    }

    return docRef.id;
  } catch (error: any) {
    return localId;
  }
}

export async function updateJournalEntry(entryId: string, data: { title: string; content: string; moodTag?: string; customTags: string[]; imageUrl?: string; isDraft?: boolean }): Promise<void> {
  // Always update local storage cache if present
  if (typeof window !== 'undefined') {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith('calmnest_journalEntries_')) {
        const list = getLocalList<JournalEntryData>(key);
        const index = list.findIndex(e => e.id === entryId);
        if (index !== -1) {
          list[index] = { ...list[index], ...data, updatedAt: new Date().toISOString() };
          setLocalList(key, list);
        }
      }
    }
  }

  if (entryId.startsWith('local_')) return;

  try {
    if (!auth.currentUser) return;
    const entryRef = doc(db, 'journalEntries', entryId);
    await updateDoc(entryRef, {
      title: data.title,
      content: data.content,
      moodTag: data.moodTag || '',
      customTags: data.customTags || [],
      imageUrl: data.imageUrl || '',
      isDraft: data.isDraft || false,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    // Silently handled by local storage cache without throwing permission error
  }
}

export async function deleteJournalEntry(entryId: string): Promise<void> {
  if (typeof window !== 'undefined') {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith('calmnest_journalEntries_')) {
        const list = getLocalList<JournalEntryData>(key);
        setLocalList(key, list.filter(e => e.id !== entryId));
      }
    }
  }

  if (entryId.startsWith('local_')) return;

  try {
    if (!auth.currentUser) return;
    await deleteDoc(doc(db, 'journalEntries', entryId));
  } catch (error: any) {}
}

// --- HABITS ---
export interface HabitData {
  id?: string;
  userId: string;
  name: string;
  icon: string;
  frequency: string;
  color: string;
  streak: number;
  bestStreak: number;
  createdAt: any;
}

export async function getHabits(userId: string): Promise<HabitData[]> {
  const activeIds = resolveActiveUserIds(userId);
  const remoteUid = resolveRemoteUserId(userId);
  let remote: HabitData[] = [];
  try {
    if (!auth.currentUser) throw new Error('Unauthenticated');
    const q = query(collection(db, 'habits'), where('userId', '==', remoteUid));
    const snap = await getDocs(q);
    remote = snap.docs.map(d => ({ id: d.id, ...d.data() }) as HabitData);
  } catch (error: any) {}

  let local: HabitData[] = [];
  activeIds.forEach(id => {
    local.push(...getLocalList<HabitData>(`calmnest_habits_${id}`));
  });

  const map = new Map<string, HabitData>();
  [...remote, ...local].forEach(item => {
    const key = item.id || item.name;
    if (!map.has(key)) map.set(key, item);
  });

  return Array.from(map.values());
}

export async function createHabit(userId: string, data: { name: string; icon: string; frequency: string; color: string }): Promise<string> {
  const activeIds = resolveActiveUserIds(userId);
  const targetId = auth.currentUser ? auth.currentUser.uid : (activeIds[0] || userId);
  const localId = `local_habit_${Date.now()}`;
  const localHabit: HabitData = {
    id: localId,
    userId: targetId,
    name: data.name,
    icon: data.icon,
    frequency: data.frequency,
    color: data.color,
    streak: 0,
    bestStreak: 0,
    createdAt: new Date().toISOString(),
  };

  activeIds.forEach(id => {
    const list = getLocalList<HabitData>(`calmnest_habits_${id}`);
    setLocalList(`calmnest_habits_${id}`, [...list, localHabit]);
  });

  try {
    if (!auth.currentUser) throw new Error('Unauthenticated');
    const docRef = await addDoc(collection(db, 'habits'), {
      userId: targetId,
      anonUuid: getOrCreateAnonymousUUID(),
      name: data.name,
      icon: data.icon,
      frequency: data.frequency,
      color: data.color,
      streak: 0,
      bestStreak: 0,
      createdAt: serverTimestamp(),
    });

    // Update local storage cache to use the real Firestore ID
    if (typeof window !== 'undefined') {
      activeIds.forEach(id => {
        const key = `calmnest_habits_${id}`;
        const list = getLocalList<HabitData>(key);
        const index = list.findIndex(e => e.id === localId);
        if (index !== -1) {
          list[index].id = docRef.id;
          setLocalList(key, list);
        }
      });
    }

    return docRef.id;
  } catch (error: any) {
    return localId;
  }
}

export async function deleteHabit(habitId: string): Promise<void> {
  if (typeof window !== 'undefined') {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith('calmnest_habits_')) {
        const list = getLocalList<HabitData>(key);
        setLocalList(key, list.filter(h => h.id !== habitId));
      }
    }
  }

  if (habitId.startsWith('local_')) return;

  try {
    if (!auth.currentUser) return;
    await deleteDoc(doc(db, 'habits', habitId));
  } catch (error: any) {}
}

export async function getHabitCompletionsForDate(userId: string, dateStr: string): Promise<string[]> {
  const activeIds = resolveActiveUserIds(userId);
  const remoteUid = resolveRemoteUserId(userId);
  let remote: string[] = [];
  try {
    if (!auth.currentUser) throw new Error('Unauthenticated');
    const q = query(
      collection(db, 'habitCompletions'),
      where('userId', '==', remoteUid),
      where('date', '==', dateStr)
    );
    const snap = await getDocs(q);
    remote = snap.docs.map(d => d.data().habitId);
  } catch (error: any) {}

  let local: string[] = [];
  activeIds.forEach(id => {
    local.push(...getLocalList<string>(`calmnest_completions_${id}_${dateStr}`));
  });

  return Array.from(new Set([...remote, ...local]));
}

export async function toggleHabitCompletion(userId: string, habitId: string, dateStr: string, completed: boolean): Promise<void> {
  const activeIds = resolveActiveUserIds(userId);
  const targetId = auth.currentUser ? auth.currentUser.uid : (activeIds[0] || userId);

  activeIds.forEach(id => {
    const localKey = `calmnest_completions_${id}_${dateStr}`;
    let current = getLocalList<string>(localKey);
    if (completed) {
      if (!current.includes(habitId)) current.push(habitId);
    } else {
      current = current.filter(h => h !== habitId);
    }
    setLocalList(localKey, current);
  });

  try {
    if (!auth.currentUser) return;
    const remoteUid = resolveRemoteUserId(userId);
    const q = query(
      collection(db, 'habitCompletions'),
      where('userId', '==', remoteUid),
      where('habitId', '==', habitId),
      where('date', '==', dateStr)
    );
    const snap = await getDocs(q);

    if (completed && snap.empty) {
      await addDoc(collection(db, 'habitCompletions'), {
        userId: targetId,
        anonUuid: getOrCreateAnonymousUUID(),
        habitId,
        date: dateStr,
        createdAt: serverTimestamp(),
      });
      if (!habitId.startsWith('local_')) {
        const habitRef = doc(db, 'habits', habitId);
        const habitDoc = await getDoc(habitRef);
        if (habitDoc.exists()) {
          const curStreak = (habitDoc.data().streak || 0) + 1;
          const bestStreak = Math.max(curStreak, habitDoc.data().bestStreak || 0);
          await updateDoc(habitRef, { streak: curStreak, bestStreak });
        }
      }
    } else if (!completed && !snap.empty) {
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
      if (!habitId.startsWith('local_')) {
        const habitRef = doc(db, 'habits', habitId);
        const habitDoc = await getDoc(habitRef);
        if (habitDoc.exists()) {
          const curStreak = Math.max(0, (habitDoc.data().streak || 1) - 1);
          await updateDoc(habitRef, { streak: curStreak });
        }
      }
    }
  } catch (error: any) {}
}

// --- ASSESSMENTS ---
export interface AssessmentData {
  id?: string;
  userId: string;
  type: 'PHQ9' | 'GAD7' | 'STRESS' | 'BURNOUT';
  score: number;
  severity: string;
  answers: number[];
  recommendations: string[];
  createdAt: any;
}

export async function saveAssessmentResult(userId: string, data: { type: AssessmentData['type']; score: number; severity: string; answers: number[]; recommendations: string[] }): Promise<string> {
  const activeIds = resolveActiveUserIds(userId);
  const targetId = auth.currentUser ? auth.currentUser.uid : (activeIds[0] || userId);
  const localId = `local_assess_${Date.now()}`;
  const localAssess: AssessmentData = {
    id: localId,
    userId: targetId,
    type: data.type,
    score: data.score,
    severity: data.severity,
    answers: data.answers,
    recommendations: data.recommendations,
    createdAt: new Date().toISOString(),
  };

  activeIds.forEach(id => {
    const list = getLocalList<AssessmentData>(`calmnest_assessments_${id}`);
    setLocalList(`calmnest_assessments_${id}`, [localAssess, ...list]);
  });

  try {
    if (!auth.currentUser) throw new Error('Unauthenticated');
    const docRef = await addDoc(collection(db, 'assessments'), {
      userId: targetId,
      anonUuid: getOrCreateAnonymousUUID(),
      type: data.type,
      score: data.score,
      severity: data.severity,
      answers: data.answers,
      recommendations: data.recommendations,
      createdAt: serverTimestamp(),
    });

    // Update local storage cache to use the real Firestore ID
    if (typeof window !== 'undefined') {
      activeIds.forEach(id => {
        const key = `calmnest_assessments_${id}`;
        const list = getLocalList<AssessmentData>(key);
        const index = list.findIndex(e => e.id === localId);
        if (index !== -1) {
          list[index].id = docRef.id;
          setLocalList(key, list);
        }
      });
    }

    return docRef.id;
  } catch (error: any) {
    return localId;
  }
}

export async function saveAssessmentScore(
  userId: string,
  dataOrType: any,
  score?: number,
  extra?: any
): Promise<string> {
  if (typeof dataOrType === 'string') {
    return saveAssessmentResult(userId, {
      type: dataOrType as AssessmentData['type'],
      score: score || 0,
      severity: extra?.severity || 'Assessed',
      answers: extra?.answers || [],
      recommendations: extra?.recommendations || []
    });
  }
  return saveAssessmentResult(userId, dataOrType);
}

export async function getAssessments(userId: string): Promise<AssessmentData[]> {
  const activeIds = resolveActiveUserIds(userId);
  const remoteUid = resolveRemoteUserId(userId);
  let remote: AssessmentData[] = [];
  try {
    if (!auth.currentUser) throw new Error('Unauthenticated');
    const q = query(
      collection(db, 'assessments'),
      where('userId', '==', remoteUid),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    remote = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      } as AssessmentData;
    });
  } catch (error: any) {}

  let local: AssessmentData[] = [];
  activeIds.forEach(id => {
    local.push(...getLocalList<AssessmentData>(`calmnest_assessments_${id}`));
  });

  const map = new Map<string, AssessmentData>();
  [...remote, ...local].forEach(item => {
    const key = item.id || `${item.createdAt}_${item.type}`;
    if (!map.has(key)) map.set(key, item);
  });

  return Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
