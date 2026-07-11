'use client';

import { supabase } from './supabase';
import { getOrCreateAnonymousUUID } from './identity-service';

/**
 * Resolves local ID vs active auth ID
 */
export function resolveActiveUserIds(passedId?: string): string[] {
  const anonUuid = getOrCreateAnonymousUUID();
  if (!passedId) return [anonUuid];
  if (passedId !== anonUuid) return [passedId, anonUuid];
  return [passedId];
}

export function resolveRemoteUserId(passedId?: string): string {
  if (passedId && !passedId.startsWith('anon_')) return passedId;
  return getOrCreateAnonymousUUID();
}

// Local storage list helpers for instant client UI / offline fallback
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

// ==========================================
// 1. PROFILES & SESSIONS
// ==========================================
export interface UserProfile {
  uid: string;
  email?: string | null;
  name?: string | null;
  role: 'USER' | 'MODERATOR' | 'ADMIN' | string;
  avatarUrl?: string | null;
  streak?: number;
  bestStreak?: number;
  lastCheckIn?: string;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const targetId = resolveRemoteUserId(uid);
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetId)
      .single();

    if (error || !data) return null;
    return {
      uid: data.id,
      email: data.email,
      name: data.name,
      role: data.role || 'USER',
      avatarUrl: data.avatar_url,
      streak: data.streak || 1,
      bestStreak: data.best_streak || 1,
      lastCheckIn: data.last_check_in
    };
  } catch (e) {
    return null;
  }
}

export async function createOrUpdateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const targetId = resolveRemoteUserId(uid);
  const payload: any = { id: targetId, updated_at: new Date().toISOString() };
  if (data.email !== undefined) payload.email = data.email;
  if (data.name !== undefined) payload.name = data.name;
  if (data.role !== undefined) payload.role = data.role;
  if (data.avatarUrl !== undefined) payload.avatar_url = data.avatarUrl;
  if (data.streak !== undefined) payload.streak = data.streak;
  if (data.bestStreak !== undefined) payload.best_streak = data.bestStreak;
  if (data.lastCheckIn !== undefined) payload.last_check_in = data.lastCheckIn;

  try {
    await supabase.from('profiles').upsert(payload);
  } catch (e) {
    console.error('[Supabase DB] Failed to update user profile:', e);
  }
}

export async function logUserSessionInfo(uid: string, provider: string): Promise<void> {
  try {
    await supabase.from('profiles').upsert({
      id: uid,
      last_check_in: new Date().toISOString()
    });
  } catch (e) {}
}

export async function initializeUserCollections(userId: string): Promise<void> {
  try {
    const targetId = resolveRemoteUserId(userId);
    const anonUuid = getOrCreateAnonymousUUID();

    // Ensure profile exists
    await supabase.from('profiles').upsert({
      id: targetId,
      role: 'USER',
      last_check_in: new Date().toISOString()
    });

    // Ensure settings exist
    await supabase.from('user_settings').upsert({
      user_id: targetId,
      anon_uuid: anonUuid,
      is_anonymous: targetId.startsWith('anon_'),
      updated_at: new Date().toISOString()
    });
  } catch (e) {}
}

// ==========================================
// 2. MOOD LOGS
// ==========================================
export interface MoodLogData {
  id?: string;
  userId: string;
  moodScore: number;
  intensity: number;
  tags: string[];
  notes?: string;
  energy?: number;
  sleepHours?: number;
  createdAt: string;
  [key: string]: any;
}

export async function logMoodEntry(userId: string, data: { moodScore: number; intensity: number; tags: string[]; notes?: string; [key: string]: any }): Promise<string> {
  const activeIds = resolveActiveUserIds(userId);
  const targetId = resolveRemoteUserId(userId);
  const anonUuid = getOrCreateAnonymousUUID();
  const localId = `local_mood_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const localItem: MoodLogData = {
    id: localId,
    userId: targetId,
    moodScore: data.moodScore,
    intensity: data.intensity,
    tags: data.tags || [],
    notes: data.notes || '',
    createdAt: new Date().toISOString()
  };

  activeIds.forEach(id => {
    const list = getLocalList<MoodLogData>(`calmnest_moodLogs_${id}`);
    setLocalList(`calmnest_moodLogs_${id}`, [localItem, ...list]);
  });

  try {
    const { data: inserted, error } = await supabase.from('moods').insert({
      user_id: targetId,
      anon_uuid: anonUuid,
      mood_score: data.moodScore,
      intensity: data.intensity,
      tags: data.tags || [],
      notes: data.notes || '',
      created_at: new Date().toISOString()
    }).select('id').single();

    if (!error && inserted?.id) {
      return inserted.id;
    }
  } catch (e) {
    console.warn('[Supabase DB] Offline fallback used for mood entry:', e);
  }
  return localId;
}

export async function getRecentMoodLogs(userId: string, count = 30): Promise<MoodLogData[]> {
  const activeIds = resolveActiveUserIds(userId);
  const targetId = resolveRemoteUserId(userId);
  const anonUuid = getOrCreateAnonymousUUID();

  const localList: MoodLogData[] = [];
  activeIds.forEach(id => {
    localList.push(...getLocalList<MoodLogData>(`calmnest_moodLogs_${id}`));
  });

  try {
    const { data, error } = await supabase
      .from('moods')
      .select('*')
      .or(`user_id.eq.${targetId},anon_uuid.eq.${anonUuid}`)
      .order('created_at', { ascending: false })
      .limit(count);

    if (!error && data) {
      const remoteMapped = data.map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        moodScore: item.mood_score,
        intensity: item.intensity,
        tags: item.tags || [],
        notes: item.notes || '',
        createdAt: item.created_at
      }));

      const mergedMap = new Map<string, MoodLogData>();
      remoteMapped.forEach(m => mergedMap.set(m.id || m.createdAt, m));
      localList.forEach(m => {
        if (!mergedMap.has(m.id || m.createdAt)) mergedMap.set(m.id || m.createdAt, m);
      });

      const final = Array.from(mergedMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (final.length > 0) {
        setLocalList(`calmnest_moodLogs_${userId}`, final);
      }
      return final.slice(0, count);
    }
  } catch (e) {}

  return localList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, count);
}

// ==========================================
// 3. WELLNESS SESSIONS
// ==========================================
export interface WellnessSessionData {
  id?: string;
  userId: string;
  type: string;
  duration: number;
  completedAt?: string;
  subType?: string;
  notes?: string;
  [key: string]: any;
}

export async function saveWellnessSession(userId: string, data: { type: string; duration: number; completedAt?: string; subType?: string; [key: string]: any }): Promise<string> {
  const activeIds = resolveActiveUserIds(userId);
  const targetId = resolveRemoteUserId(userId);
  const anonUuid = getOrCreateAnonymousUUID();
  const localId = `local_wellness_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const localItem: WellnessSessionData = {
    id: localId,
    userId: targetId,
    type: data.type,
    duration: data.duration,
    completedAt: data.completedAt || new Date().toISOString(),
  };

  activeIds.forEach(id => {
    const list = getLocalList<WellnessSessionData>(`calmnest_wellnessSessions_${id}`);
    setLocalList(`calmnest_wellnessSessions_${id}`, [localItem, ...list]);
  });

  try {
    const { data: inserted, error } = await supabase.from('meditation_sessions').insert({
      user_id: targetId,
      anon_uuid: anonUuid,
      type: data.type,
      duration: data.duration,
      completed_at: data.completedAt,
      created_at: new Date().toISOString()
    }).select('id').single();

    if (!error && inserted?.id) {
      return inserted.id;
    }
  } catch (e) {}
  return localId;
}

export async function getWellnessSessions(userId: string): Promise<WellnessSessionData[]> {
  const activeIds = resolveActiveUserIds(userId);
  const targetId = resolveRemoteUserId(userId);
  const anonUuid = getOrCreateAnonymousUUID();

  const localList: WellnessSessionData[] = [];
  activeIds.forEach(id => {
    localList.push(...getLocalList<WellnessSessionData>(`calmnest_wellnessSessions_${id}`));
  });

  try {
    const { data, error } = await supabase
      .from('meditation_sessions')
      .select('*')
      .or(`user_id.eq.${targetId},anon_uuid.eq.${anonUuid}`)
      .order('completed_at', { ascending: false });

    if (!error && data) {
      const mapped = data.map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        type: item.type,
        duration: item.duration,
        completedAt: item.completed_at
      }));
      setLocalList(`calmnest_wellnessSessions_${userId}`, mapped);
      return mapped;
    }
  } catch (e) {}
  return localList;
}

// ==========================================
// 4. JOURNAL ENTRIES
// ==========================================
export interface JournalEntryData {
  id?: string;
  userId: string;
  title: string;
  content: string;
  moodTag?: string;
  customTags: string[];
  imageUrl?: string;
  isDraft?: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getJournalEntries(userId: string): Promise<JournalEntryData[]> {
  const activeIds = resolveActiveUserIds(userId);
  const targetId = resolveRemoteUserId(userId);
  const anonUuid = getOrCreateAnonymousUUID();

  const localMap = new Map<string, JournalEntryData>();
  activeIds.forEach(id => {
    const list = getLocalList<JournalEntryData>(`calmnest_journalEntries_${id}`);
    list.forEach(e => localMap.set(e.id || e.createdAt, e));
  });

  try {
    const { data, error } = await supabase
      .from('journals')
      .select('*')
      .or(`user_id.eq.${targetId},anon_uuid.eq.${anonUuid}`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const remoteMapped = data.map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        title: item.title,
        content: item.content,
        moodTag: item.mood_tag || '',
        customTags: item.custom_tags || [],
        imageUrl: item.image_url || '',
        isDraft: item.is_draft || false,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      remoteMapped.forEach(r => localMap.set(r.id || r.createdAt, r));
      const final = Array.from(localMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLocalList(`calmnest_journalEntries_${userId}`, final);
      return final;
    }
  } catch (e) {}

  return Array.from(localMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function saveJournalEntry(userId: string, data: { title: string; content: string; moodTag?: string; customTags: string[]; imageUrl?: string; isDraft?: boolean }): Promise<string> {
  const activeIds = resolveActiveUserIds(userId);
  const targetId = resolveRemoteUserId(userId);
  const anonUuid = getOrCreateAnonymousUUID();
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
    updatedAt: new Date().toISOString()
  };

  activeIds.forEach(id => {
    const list = getLocalList<JournalEntryData>(`calmnest_journalEntries_${id}`);
    setLocalList(`calmnest_journalEntries_${id}`, [localItem, ...list]);
  });

  try {
    const { data: inserted, error } = await supabase.from('journals').insert({
      user_id: targetId,
      anon_uuid: anonUuid,
      title: data.title,
      content: data.content,
      mood_tag: data.moodTag || '',
      custom_tags: data.customTags || [],
      image_url: data.imageUrl || '',
      is_draft: data.isDraft || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).select('id').single();

    if (!error && inserted?.id) {
      return inserted.id;
    }
  } catch (e) {}
  return localId;
}

export async function updateJournalEntry(entryId: string, data: { title: string; content: string; moodTag?: string; customTags: string[]; imageUrl?: string; isDraft?: boolean }): Promise<void> {
  const activeIds = resolveActiveUserIds();
  activeIds.forEach(id => {
    const list = getLocalList<JournalEntryData>(`calmnest_journalEntries_${id}`);
    const updated = list.map(item => item.id === entryId ? { ...item, ...data, updatedAt: new Date().toISOString() } : item);
    setLocalList(`calmnest_journalEntries_${id}`, updated);
  });

  if (entryId && !entryId.startsWith('local_')) {
    try {
      await supabase.from('journals').update({
        title: data.title,
        content: data.content,
        mood_tag: data.moodTag || '',
        custom_tags: data.customTags || [],
        image_url: data.imageUrl || '',
        is_draft: data.isDraft || false,
        updated_at: new Date().toISOString()
      }).eq('id', entryId);
    } catch (e) {}
  }
}

export async function deleteJournalEntry(entryId: string): Promise<void> {
  const activeIds = resolveActiveUserIds();
  activeIds.forEach(id => {
    const list = getLocalList<JournalEntryData>(`calmnest_journalEntries_${id}`);
    const filtered = list.filter(item => item.id !== entryId);
    setLocalList(`calmnest_journalEntries_${id}`, filtered);
  });

  if (entryId && !entryId.startsWith('local_')) {
    try {
      await supabase.from('journals').delete().eq('id', entryId);
    } catch (e) {}
  }
}

// ==========================================
// 5. HABITS
// ==========================================
export interface HabitData {
  id?: string;
  userId: string;
  name: string;
  icon: string;
  frequency: string;
  color: string;
  streak?: number;
  bestStreak?: number;
  createdAt: string;
}

export async function getHabits(userId: string): Promise<HabitData[]> {
  const activeIds = resolveActiveUserIds(userId);
  const targetId = resolveRemoteUserId(userId);
  const anonUuid = getOrCreateAnonymousUUID();

  const localMap = new Map<string, HabitData>();
  activeIds.forEach(id => {
    const list = getLocalList<HabitData>(`calmnest_habits_${id}`);
    list.forEach(h => localMap.set(h.id || h.name, h));
  });

  try {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .or(`user_id.eq.${targetId},anon_uuid.eq.${anonUuid}`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const mapped = data.map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        name: item.name,
        icon: item.icon || '✨',
        frequency: item.frequency || 'DAILY',
        color: item.color || '#6366f1',
        streak: item.streak || 0,
        bestStreak: item.best_streak || 0,
        createdAt: item.created_at
      }));
      setLocalList(`calmnest_habits_${userId}`, mapped);
      return mapped;
    }
  } catch (e) {}

  return Array.from(localMap.values());
}

export async function createHabit(userId: string, data: { name: string; icon: string; frequency: string; color: string }): Promise<string> {
  const activeIds = resolveActiveUserIds(userId);
  const targetId = resolveRemoteUserId(userId);
  const anonUuid = getOrCreateAnonymousUUID();
  const localId = `local_habit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const localItem: HabitData = {
    id: localId,
    userId: targetId,
    name: data.name,
    icon: data.icon,
    frequency: data.frequency,
    color: data.color,
    streak: 0,
    bestStreak: 0,
    createdAt: new Date().toISOString()
  };

  activeIds.forEach(id => {
    const list = getLocalList<HabitData>(`calmnest_habits_${id}`);
    setLocalList(`calmnest_habits_${id}`, [localItem, ...list]);
  });

  try {
    const { data: inserted, error } = await supabase.from('habits').insert({
      user_id: targetId,
      anon_uuid: anonUuid,
      name: data.name,
      icon: data.icon,
      frequency: data.frequency,
      color: data.color,
      streak: 0,
      best_streak: 0,
      created_at: new Date().toISOString()
    }).select('id').single();

    if (!error && inserted?.id) {
      return inserted.id;
    }
  } catch (e) {}
  return localId;
}

export async function deleteHabit(habitId: string): Promise<void> {
  const activeIds = resolveActiveUserIds();
  activeIds.forEach(id => {
    const list = getLocalList<HabitData>(`calmnest_habits_${id}`);
    setLocalList(`calmnest_habits_${id}`, list.filter(h => h.id !== habitId));
  });

  if (habitId && !habitId.startsWith('local_')) {
    try {
      await supabase.from('habits').delete().eq('id', habitId);
      await supabase.from('habit_logs').delete().eq('habit_id', habitId);
    } catch (e) {}
  }
}

export async function getHabitCompletionsForDate(userId: string, dateStr: string): Promise<string[]> {
  const activeIds = resolveActiveUserIds(userId);
  const targetId = resolveRemoteUserId(userId);
  const anonUuid = getOrCreateAnonymousUUID();

  const localSet = new Set<string>();
  activeIds.forEach(id => {
    const list = getLocalList<string>(`calmnest_completions_${id}_${dateStr}`);
    list.forEach(item => localSet.add(item));
  });

  try {
    const { data, error } = await supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('date', dateStr)
      .or(`user_id.eq.${targetId},anon_uuid.eq.${anonUuid}`);

    if (!error && data) {
      const remoteIds = data.map((d: any) => d.habit_id);
      remoteIds.forEach((id: string) => localSet.add(id));
      setLocalList(`calmnest_completions_${userId}_${dateStr}`, Array.from(localSet));
      return Array.from(localSet);
    }
  } catch (e) {}

  return Array.from(localSet);
}

export async function toggleHabitCompletion(userId: string, habitId: string, dateStr: string, completed: boolean): Promise<void> {
  const activeIds = resolveActiveUserIds(userId);
  const targetId = resolveRemoteUserId(userId);
  const anonUuid = getOrCreateAnonymousUUID();

  activeIds.forEach(id => {
    const list = getLocalList<string>(`calmnest_completions_${id}_${dateStr}`);
    const updated = completed ? Array.from(new Set([...list, habitId])) : list.filter(x => x !== habitId);
    setLocalList(`calmnest_completions_${id}_${dateStr}`, updated);
  });

  if (habitId && !habitId.startsWith('local_')) {
    try {
      if (completed) {
        await supabase.from('habit_logs').upsert({
          habit_id: habitId,
          user_id: targetId,
          anon_uuid: anonUuid,
          date: dateStr,
          created_at: new Date().toISOString()
        }, { onConflict: 'habit_id,date' });
      } else {
        await supabase.from('habit_logs')
          .delete()
          .eq('habit_id', habitId)
          .eq('date', dateStr);
      }
    } catch (e) {}
  }
}

// ==========================================
// 6. ASSESSMENTS
// ==========================================
export interface AssessmentData {
  id?: string;
  userId: string;
  type: 'PHQ9' | 'GAD7' | 'STRESS' | 'BURNOUT' | string;
  score: number;
  severity: string;
  answers: number[];
  recommendations: string[];
  createdAt: string;
}

export async function saveAssessmentResult(userId: string, data: { type: AssessmentData['type']; score: number; severity: string; answers: number[]; recommendations: string[] }): Promise<string> {
  return saveAssessmentScore(userId, data.type, data.score, data.severity, data.answers, data.recommendations);
}

export async function saveAssessmentScore(
  userId: string,
  typeOrData: AssessmentData['type'] | { type: AssessmentData['type']; score: number; severity: string; answers: number[]; recommendations: string[] },
  scoreArg?: number,
  severityArg?: string,
  answersArg?: number[],
  recommendationsArg?: string[]
): Promise<string> {
  const type = typeof typeOrData === 'object' ? typeOrData.type : typeOrData;
  const score = typeof typeOrData === 'object' ? typeOrData.score : (scoreArg || 0);
  const severity = typeof typeOrData === 'object' ? typeOrData.severity : (severityArg || '');
  const answers = typeof typeOrData === 'object' ? typeOrData.answers : (answersArg || []);
  const recommendations = typeof typeOrData === 'object' ? typeOrData.recommendations : (recommendationsArg || []);
  const activeIds = resolveActiveUserIds(userId);
  const targetId = resolveRemoteUserId(userId);
  const anonUuid = getOrCreateAnonymousUUID();
  const localId = `local_assess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const localItem: AssessmentData = {
    id: localId,
    userId: targetId,
    type,
    score,
    severity,
    answers,
    recommendations,
    createdAt: new Date().toISOString()
  };

  activeIds.forEach(id => {
    const list = getLocalList<AssessmentData>(`calmnest_assessments_${id}`);
    setLocalList(`calmnest_assessments_${id}`, [localItem, ...list]);
  });

  try {
    const { data: inserted, error } = await supabase.from('assessment_results').insert({
      user_id: targetId,
      anon_uuid: anonUuid,
      type,
      score,
      severity,
      answers,
      recommendations,
      created_at: new Date().toISOString()
    }).select('id').single();

    if (!error && inserted?.id) {
      return inserted.id;
    }
  } catch (e) {}
  return localId;
}

export async function getAssessments(userId: string): Promise<AssessmentData[]> {
  const activeIds = resolveActiveUserIds(userId);
  const targetId = resolveRemoteUserId(userId);
  const anonUuid = getOrCreateAnonymousUUID();

  const localMap = new Map<string, AssessmentData>();
  activeIds.forEach(id => {
    const list = getLocalList<AssessmentData>(`calmnest_assessments_${id}`);
    list.forEach(a => localMap.set(a.id || a.createdAt, a));
  });

  try {
    const { data, error } = await supabase
      .from('assessment_results')
      .select('*')
      .or(`user_id.eq.${targetId},anon_uuid.eq.${anonUuid}`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const mapped = data.map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        type: item.type,
        score: item.score,
        severity: item.severity,
        answers: item.answers || [],
        recommendations: item.recommendations || [],
        createdAt: item.created_at
      }));
      setLocalList(`calmnest_assessments_${userId}`, mapped);
      return mapped;
    }
  } catch (e) {}

  return Array.from(localMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ==========================================
// 7. MOOD LOGS - EXTENDED CRUD
// ==========================================
export async function updateMoodEntry(logId: string, data: { moodScore: number; intensity: number; tags: string[]; notes?: string }): Promise<void> {
  const activeIds = resolveActiveUserIds();
  activeIds.forEach(id => {
    const list = getLocalList<any>(`calmnest_moodLogs_${id}`);
    const updated = list.map((item: any) => item.id === logId ? { ...item, ...data, moodScore: data.moodScore, intensity: data.intensity, tags: data.tags, notes: data.notes || '' } : item);
    setLocalList(`calmnest_moodLogs_${id}`, updated);
  });

  if (logId && !logId.startsWith('local_')) {
    try {
      await supabase.from('moods').update({
        mood_score: data.moodScore,
        intensity: data.intensity,
        tags: data.tags,
        notes: data.notes || ''
      }).eq('id', logId);
    } catch (e) {}
  }
}

export async function deleteMoodEntry(logId: string): Promise<void> {
  const activeIds = resolveActiveUserIds();
  activeIds.forEach(id => {
    const list = getLocalList<any>(`calmnest_moodLogs_${id}`);
    const filtered = list.filter((item: any) => item.id !== logId);
    setLocalList(`calmnest_moodLogs_${id}`, filtered);
  });

  if (logId && !logId.startsWith('local_')) {
    try {
      await supabase.from('moods').delete().eq('id', logId);
    } catch (e) {}
  }
}

// ==========================================
// 8. HABITS - EXTENDED CRUD
// ==========================================
export async function updateHabit(habitId: string, data: { name: string; icon: string; frequency: string; color: string }): Promise<void> {
  const activeIds = resolveActiveUserIds();
  activeIds.forEach(id => {
    const list = getLocalList<any>(`calmnest_habits_${id}`);
    const updated = list.map((item: any) => item.id === habitId ? { ...item, ...data } : item);
    setLocalList(`calmnest_habits_${id}`, updated);
  });

  if (habitId && !habitId.startsWith('local_')) {
    try {
      await supabase.from('habits').update({
        name: data.name,
        icon: data.icon,
        frequency: data.frequency,
        color: data.color,
        updated_at: new Date().toISOString()
      }).eq('id', habitId);
    } catch (e) {}
  }
}

export async function getAllHabitLogs(userId: string): Promise<{ habitId: string; date: string }[]> {
  const targetId = resolveRemoteUserId(userId);
  const anonUuid = getOrCreateAnonymousUUID();
  try {
    const { data, error } = await supabase
      .from('habit_logs')
      .select('habit_id, date')
      .or(`user_id.eq.${targetId},anon_uuid.eq.${anonUuid}`);
    if (!error && data) {
      return data.map((d: any) => ({ habitId: d.habit_id, date: d.date }));
    }
  } catch (e) {}
  return [];
}

// ==========================================
// 9. NOTIFICATIONS
// ==========================================
export interface NotificationData {
  id: string;
  userId: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export async function getNotifications(userId: string): Promise<NotificationData[]> {
  const targetId = resolveRemoteUserId(userId);
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', targetId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data.map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        title: d.title,
        body: d.body,
        isRead: d.is_read || false,
        createdAt: d.created_at
      }));
    }
  } catch (e) {}
  return [];
}

export async function createNotification(userId: string, title: string, body: string): Promise<string> {
  const targetId = resolveRemoteUserId(userId);
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: targetId,
        title,
        body,
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (!error && data?.id) return data.id;
  } catch (e) {}
  return `local_notif_${Date.now()}`;
}

export async function markNotificationRead(notifId: string): Promise<void> {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
  } catch (e) {}
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const targetId = resolveRemoteUserId(userId);
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', targetId);
  } catch (e) {}
}

export async function clearNotifications(userId: string): Promise<void> {
  const targetId = resolveRemoteUserId(userId);
  try {
    await supabase.from('notifications').delete().eq('user_id', targetId);
  } catch (e) {}
}

// ==========================================
// 10. AMBIENT PREFERENCES
// ==========================================
export async function getAmbientPreferences(userId: string) {
  const targetId = resolveRemoteUserId(userId);
  try {
    const { data, error } = await supabase
      .from('ambient_preferences')
      .select('*')
      .eq('user_id', targetId)
      .single();
    if (!error && data) return data;
  } catch (e) {}
  return null;
}

export async function saveAmbientPreferences(userId: string, data: { favorites: string[]; customMixes: any[]; volumeRatios?: any }) {
  const targetId = resolveRemoteUserId(userId);
  try {
    await supabase.from('ambient_preferences').upsert({
      user_id: targetId,
      favorites: data.favorites,
      custom_mixes: data.customMixes,
      volume_ratios: data.volumeRatios || {},
      updated_at: new Date().toISOString()
    });
  } catch (e) {}
}

// ==========================================
// 11. MULTIPLE CONVERSATIONS & CHATS
// ==========================================
export interface ConversationItem {
  id: string;
  userId: string;
  title: string;
  riskDetected: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getConversations(userId: string): Promise<ConversationItem[]> {
  const targetId = resolveRemoteUserId(userId);
  const anonUuid = getOrCreateAnonymousUUID();
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`user_id.eq.${targetId},anon_uuid.eq.${anonUuid}`)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      return data.map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        title: d.title,
        riskDetected: d.risk_detected || false,
        createdAt: d.created_at,
        updatedAt: d.updated_at
      }));
    }
  } catch (e) {}
  return [];
}

export async function createConversation(userId: string, title: string = 'New Session'): Promise<string> {
  const targetId = resolveRemoteUserId(userId);
  const anonUuid = getOrCreateAnonymousUUID();
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: targetId,
        anon_uuid: anonUuid,
        title,
        risk_detected: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (!error && data?.id) return data.id;
  } catch (e) {}
  return `local_conv_${Date.now()}`;
}

export async function renameConversation(convId: string, newTitle: string): Promise<void> {
  try {
    await supabase
      .from('conversations')
      .update({
        title: newTitle,
        updated_at: new Date().toISOString()
      })
      .eq('id', convId);
  } catch (e) {}
}

export async function deleteConversation(convId: string): Promise<void> {
  try {
    await supabase.from('conversations').delete().eq('id', convId);
  } catch (e) {}
}

export async function deleteAssessmentResult(assessId: string): Promise<void> {
  try {
    await supabase.from('assessment_results').delete().eq('id', assessId);
  } catch (e) {}
}

