import { db } from './firebase';
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
      return { uid, ...userDoc.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("getUserProfile error:", error);
    return null;
  }
}

export async function createOrUpdateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.error("createOrUpdateUserProfile error:", error);
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
  const docRef = await addDoc(collection(db, 'moodLogs'), {
    userId,
    moodScore: data.moodScore,
    intensity: data.intensity,
    tags: data.tags,
    notes: data.notes || '',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getRecentMoodLogs(userId: string, count = 30): Promise<MoodLogData[]> {
  try {
    const q = query(
      collection(db, 'moodLogs'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(count)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      } as MoodLogData;
    });
  } catch (error) {
    console.error("getRecentMoodLogs error:", error);
    return [];
  }
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
  try {
    const q = query(
      collection(db, 'journalEntries'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as JournalEntryData;
    });
  } catch (error) {
    console.error("getJournalEntries error:", error);
    return [];
  }
}

export async function saveJournalEntry(userId: string, data: { title: string; content: string; moodTag?: string; customTags: string[]; imageUrl?: string; isDraft?: boolean }): Promise<string> {
  const docRef = await addDoc(collection(db, 'journalEntries'), {
    userId,
    title: data.title,
    content: data.content,
    moodTag: data.moodTag || '',
    customTags: data.customTags || [],
    imageUrl: data.imageUrl || '',
    isDraft: data.isDraft || false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteJournalEntry(entryId: string): Promise<void> {
  await deleteDoc(doc(db, 'journalEntries', entryId));
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
  try {
    const q = query(collection(db, 'habits'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as HabitData);
  } catch (error) {
    console.error("getHabits error:", error);
    return [];
  }
}

export async function createHabit(userId: string, data: { name: string; icon: string; frequency: string; color: string }): Promise<string> {
  const docRef = await addDoc(collection(db, 'habits'), {
    userId,
    name: data.name,
    icon: data.icon,
    frequency: data.frequency,
    color: data.color,
    streak: 0,
    bestStreak: 0,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteHabit(habitId: string): Promise<void> {
  await deleteDoc(doc(db, 'habits', habitId));
}

export async function getHabitCompletionsForDate(userId: string, dateStr: string): Promise<string[]> {
  try {
    const q = query(
      collection(db, 'habitCompletions'),
      where('userId', '==', userId),
      where('date', '==', dateStr)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data().habitId);
  } catch (error) {
    console.error("getHabitCompletionsForDate error:", error);
    return [];
  }
}

export async function toggleHabitCompletion(userId: string, habitId: string, dateStr: string, completed: boolean): Promise<void> {
  try {
    const q = query(
      collection(db, 'habitCompletions'),
      where('userId', '==', userId),
      where('habitId', '==', habitId),
      where('date', '==', dateStr)
    );
    const snap = await getDocs(q);

    if (completed && snap.empty) {
      await addDoc(collection(db, 'habitCompletions'), {
        userId,
        habitId,
        date: dateStr,
        createdAt: serverTimestamp(),
      });
      // Increment streak on habit
      const habitRef = doc(db, 'habits', habitId);
      const habitDoc = await getDoc(habitRef);
      if (habitDoc.exists()) {
        const curStreak = (habitDoc.data().streak || 0) + 1;
        const bestStreak = Math.max(curStreak, habitDoc.data().bestStreak || 0);
        await updateDoc(habitRef, { streak: curStreak, bestStreak });
      }
    } else if (!completed && !snap.empty) {
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
      const habitRef = doc(db, 'habits', habitId);
      const habitDoc = await getDoc(habitRef);
      if (habitDoc.exists()) {
        const curStreak = Math.max(0, (habitDoc.data().streak || 1) - 1);
        await updateDoc(habitRef, { streak: curStreak });
      }
    }
  } catch (error) {
    console.error("toggleHabitCompletion error:", error);
  }
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
  const docRef = await addDoc(collection(db, 'assessments'), {
    userId,
    type: data.type,
    score: data.score,
    severity: data.severity,
    answers: data.answers,
    recommendations: data.recommendations,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
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
  try {
    const q = query(
      collection(db, 'assessments'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      } as AssessmentData;
    });
  } catch (error) {
    console.error("getAssessments error:", error);
    return [];
  }
}
