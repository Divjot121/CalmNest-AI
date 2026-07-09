import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import {
  getHabits,
  createHabit,
  deleteHabit,
  getHabitCompletionsForDate,
  toggleHabitCompletion as toggleFirestoreHabit
} from '@/lib/firestore-service';

export interface HabitItem {
  id: string;
  name: string;
  icon: string;
  frequency: string;
  color: string;
  streak: number;
  bestStreak: number;
  completedToday: boolean;
}

interface HabitState {
  habits: HabitItem[];
  isLoading: boolean;
  fetchHabits: () => Promise<void>;
  createHabit: (name: string, icon: string, frequency: string, color: string) => Promise<boolean>;
  deleteHabit: (id: string) => Promise<boolean>;
  toggleCompletion: (id: string) => Promise<boolean>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  isLoading: true,
  fetchHabits: async () => {
    try {
      set({ isLoading: true });
      const user = useAuthStore.getState().user;
      if (!user?.id) {
        set({ isLoading: false });
        return;
      }
      const rawHabits = await getHabits(user.id);
      const todayStr = new Date().toISOString().split('T')[0];
      const completedIds = new Set(await getHabitCompletionsForDate(user.id, todayStr));

      const habits: HabitItem[] = rawHabits.map(h => ({
        id: h.id || '',
        name: h.name,
        icon: h.icon,
        frequency: h.frequency,
        color: h.color,
        streak: h.streak || 0,
        bestStreak: h.bestStreak || 0,
        completedToday: completedIds.has(h.id || '')
      }));

      // If user has no habits yet, auto-seed default habits to give an instant enterprise demo
      if (habits.length === 0) {
        const defaults = [
          { name: 'Daily 10m Mindful Walk', icon: '🚶‍♂️', frequency: 'DAILY', color: '#10b981' },
          { name: 'Evening Gratitude Journal', icon: '📓', frequency: 'DAILY', color: '#6366f1' },
          { name: '5m Deep Breathing', icon: '🧘', frequency: 'DAILY', color: '#3b82f6' },
        ];
        for (const d of defaults) {
          const newId = await createHabit(user.id, d);
          habits.push({
            id: newId,
            ...d,
            streak: 0,
            bestStreak: 0,
            completedToday: false
          });
        }
      }

      set({ habits, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },
  createHabit: async (name, icon, frequency, color) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user?.id) return false;

      const newId = await createHabit(user.id, { name, icon, frequency, color });
      const newHabit: HabitItem = {
        id: newId,
        name,
        icon,
        frequency,
        color,
        streak: 0,
        bestStreak: 0,
        completedToday: false
      };
      set(state => ({ habits: [...state.habits, newHabit] }));
      return true;
    } catch (error) {
      return false;
    }
  },
  deleteHabit: async (id) => {
    try {
      await deleteHabit(id);
      set(state => ({ habits: state.habits.filter(h => h.id !== id) }));
      return true;
    } catch (error) {
      return false;
    }
  },
  toggleCompletion: async (id) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user?.id) return false;

      const habits = get().habits;
      const index = habits.findIndex(h => h.id === id);
      if (index === -1) return false;

      const cur = habits[index];
      const newCompleted = !cur.completedToday;
      const newStreak = newCompleted ? cur.streak + 1 : Math.max(0, cur.streak - 1);

      const updated = [...habits];
      updated[index] = {
        ...cur,
        completedToday: newCompleted,
        streak: newStreak,
        bestStreak: Math.max(cur.bestStreak, newStreak)
      };
      set({ habits: updated });

      const todayStr = new Date().toISOString().split('T')[0];
      await toggleFirestoreHabit(user.id, id, todayStr, newCompleted);
      return true;
    } catch (error) {
      return false;
    }
  },
}));
