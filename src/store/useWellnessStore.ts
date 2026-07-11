import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { getRecentMoodLogs, logMoodEntry, MoodLogData } from '@/lib/db-service';

export interface MoodLogItem {
  id: string;
  moodScore: number;
  intensity: number;
  tags: string[];
  notes?: string | null;
  createdAt: string;
}

interface WellnessState {
  todayMood: MoodLogItem | null;
  recentLogs: MoodLogItem[];
  streak: number;
  isLoading: boolean;
  fetchDashboardData: () => Promise<void>;
  logMood: (
    score: number, 
    intensity: number, 
    tags: string[], 
    notes?: string,
    energy?: number,
    stress?: number,
    anxiety?: number,
    sleep?: number
  ) => Promise<boolean>;
}

export const useWellnessStore = create<WellnessState>((set, get) => ({
  todayMood: null,
  recentLogs: [],
  streak: 0,
  isLoading: true,
  fetchDashboardData: async () => {
    try {
      set({ isLoading: true });
      const user = useAuthStore.getState().user;
      if (!user?.id) {
        set({ isLoading: false });
        return;
      }
      const logs = await getRecentMoodLogs(user.id, 30);
      const formattedLogs: MoodLogItem[] = logs.map(l => ({
        id: l.id || '',
        moodScore: l.moodScore,
        intensity: l.intensity,
        tags: l.tags || [],
        notes: l.notes || '',
        createdAt: l.createdAt
      }));

      const todayStr = new Date().toISOString().split('T')[0];
      const todayMood = formattedLogs.find(l => l.createdAt.startsWith(todayStr)) || null;

      set({
        todayMood,
        recentLogs: formattedLogs,
        streak: user.streak || 1,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
    }
  },
  logMood: async (score, intensity, tags, notes, energy, stress, anxiety, sleep) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user?.id) return false;

      const logId = await logMoodEntry(user.id, { 
        moodScore: score, 
        intensity, 
        tags, 
        notes,
        energy,
        stress,
        anxiety,
        sleep
      });
      const newLog: MoodLogItem = {
        id: logId,
        moodScore: score,
        intensity,
        tags,
        notes: notes || '',
        createdAt: new Date().toISOString()
      };

      set(state => ({
        todayMood: newLog,
        recentLogs: [newLog, ...state.recentLogs],
        streak: state.streak
      }));
      return true;
    } catch (error) {
      return false;
    }
  },
}));
