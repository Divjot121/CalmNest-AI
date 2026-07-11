import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { getUserProfile, createOrUpdateUserProfile, UserProfile, logUserSessionInfo } from '@/lib/db-service';
import {
  getOrCreateAnonymousUUID,
  getStoredPreferences,
  exportAllAnonymousData,
  deleteAnonymousDataAndReset,
  captureAnonymousData,
  mergeCapturedDataToAccount
} from '@/lib/identity-service';
import { useSettingsStore } from '@/store/useSettingsStore';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN' | string;
  avatarUrl?: string | null;
  streak?: number;
  bestStreak?: number;
  isAnonymous?: boolean;
}

interface AuthState {
  user: User | null;
  firebaseUser: any | null; // Aliased to Supabase user object for 100% backward compatibility
  supabaseUser: any | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<User | null>;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, pass: string, name: string) => Promise<{ success: boolean; error?: string }>;
  loginAnonymously: () => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  mergeAccount: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  exportData: () => Record<string, any>;
  deleteAnonymousAndReset: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  firebaseUser: null,
  supabaseUser: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  checkAuth: () => {
    return new Promise((resolve) => {
      set({ isLoading: true });
      const anonUuid = getOrCreateAnonymousUUID();
      const prefs = getStoredPreferences();

      // Subscribe to real-time auth state updates
      supabase.auth.onAuthStateChange(async (event, session) => {
        const u = session?.user;
        if (u && event !== 'INITIAL_SESSION') {
          logUserSessionInfo(u.id, u.is_anonymous ? 'anonymous' : 'email').catch(() => {});
          let profile = await getUserProfile(u.id);
          if (!profile) {
            profile = {
              uid: u.id,
              email: u.email || `anon_${u.id.slice(0, 6)}@calmnest.org`,
              name: u.user_metadata?.name || (u.is_anonymous ? 'Anonymous Guest' : 'CalmNest User'),
              role: u.user_metadata?.role || 'USER',
              streak: prefs.streakDays || 1,
              bestStreak: prefs.streakDays || 1,
            };
            await createOrUpdateUserProfile(u.id, profile);
          }
          const userObj: User = {
            id: u.id,
            email: profile.email || u.email || '',
            name: profile.name || u.user_metadata?.name || (u.is_anonymous ? 'Anonymous Guest' : 'CalmNest User'),
            role: profile.role || 'USER',
            avatarUrl: profile.avatarUrl || u.user_metadata?.avatar_url,
            streak: profile.streak || prefs.streakDays || 1,
            bestStreak: profile.bestStreak || prefs.streakDays || 1,
            isAnonymous: u.is_anonymous || false,
          };
          set({ user: userObj, firebaseUser: u, supabaseUser: u, isLoading: false });
        }
      });

      // Initial check on mount
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        const u = session?.user;
        if (u) {
          logUserSessionInfo(u.id, u.is_anonymous ? 'anonymous' : 'email').catch(() => {});
          let profile = await getUserProfile(u.id);
          if (!profile) {
            profile = {
              uid: u.id,
              email: u.email || `anon_${u.id.slice(0, 6)}@calmnest.org`,
              name: u.user_metadata?.name || (u.is_anonymous ? 'Anonymous Guest' : 'CalmNest User'),
              role: u.user_metadata?.role || 'USER',
              streak: prefs.streakDays || 1,
              bestStreak: prefs.streakDays || 1,
            };
            await createOrUpdateUserProfile(u.id, profile);
          }
          const userObj: User = {
            id: u.id,
            email: profile.email || u.email || '',
            name: profile.name || u.user_metadata?.name || (u.is_anonymous ? 'Anonymous Guest' : 'CalmNest User'),
            role: profile.role || 'USER',
            avatarUrl: profile.avatarUrl || u.user_metadata?.avatar_url,
            streak: profile.streak || prefs.streakDays || 1,
            bestStreak: profile.bestStreak || prefs.streakDays || 1,
            isAnonymous: u.is_anonymous || false,
          };
          set({ user: userObj, firebaseUser: u, supabaseUser: u, isLoading: false });
          resolve(userObj);
        } else {
          // Auto sign in anonymously
          try {
            const { data: anonData, error } = await supabase.auth.signInAnonymously();
            if (!error && anonData.user) {
              const uAnon = anonData.user;
              let profile = await getUserProfile(uAnon.id);
              if (!profile) {
                profile = {
                  uid: uAnon.id,
                  email: `anon_${uAnon.id.slice(0, 6)}@calmnest.org`,
                  name: 'Anonymous Guest',
                  role: 'USER',
                  streak: prefs.streakDays || 1,
                  bestStreak: prefs.streakDays || 1,
                };
                await createOrUpdateUserProfile(uAnon.id, profile);
              }
              const userObj: User = {
                id: uAnon.id,
                email: profile.email || `anon_${uAnon.id.slice(0, 6)}@calmnest.org`,
                name: profile.name || 'Anonymous Guest',
                role: profile.role || 'USER',
                streak: profile.streak || prefs.streakDays || 1,
                bestStreak: profile.bestStreak || prefs.streakDays || 1,
                isAnonymous: true,
              };
              set({ user: userObj, firebaseUser: uAnon, supabaseUser: uAnon, isLoading: false });
              resolve(userObj);
              return;
            }
          } catch (err) {}

          // Offline fallback resilience using local anonymous UUID
          const fallbackUser: User = {
            id: anonUuid,
            email: `${anonUuid.slice(0, 10)}@calmnest.org`,
            name: 'Anonymous Guest',
            role: 'USER',
            streak: prefs.streakDays || 1,
            bestStreak: prefs.streakDays || 1,
            isAnonymous: true,
          };
          set({ user: fallbackUser, firebaseUser: null, supabaseUser: null, isLoading: false });
          resolve(fallbackUser);
        }
      });
    });
  },
  login: async (email, pass) => {
    try {
      set({ isLoading: true });
      const { data: sessionData } = await supabase.auth.getSession();
      const oldUid = sessionData.session?.user?.id || getOrCreateAnonymousUUID();

      // Capture anonymous data BEFORE switching sessions
      const anonData = await captureAnonymousData(oldUid);

      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error || !data.user) {
        set({ isLoading: false });
        let errorMsg = error?.message || 'Login failed';
        if (errorMsg.toLowerCase().includes('invalid login credentials')) {
          errorMsg = 'Invalid email or password.';
        }
        return { success: false, error: errorMsg };
      }

      const newUid = data.user.id;
      await logUserSessionInfo(newUid, 'email');
      await mergeCapturedDataToAccount(oldUid, newUid, anonData);

      const profile = await getUserProfile(newUid);
      const userObj: User = {
        id: newUid,
        email: data.user.email || email,
        name: profile?.name || data.user.user_metadata?.name || 'CalmNest User',
        role: profile?.role || 'USER',
        streak: profile?.streak || 1,
        bestStreak: profile?.bestStreak || 1,
        isAnonymous: false,
      };

      await useSettingsStore.getState().loadPreferences();
      set({ user: userObj, firebaseUser: data.user, supabaseUser: data.user, isLoading: false });
      return { success: true };
    } catch (error: any) {
      set({ isLoading: false });
      return { success: false, error: error.message || 'Login failed' };
    }
  },
  signup: async (email, pass, name) => {
    try {
      set({ isLoading: true });
      const { data: sessionData } = await supabase.auth.getSession();
      const oldUid = sessionData.session?.user?.id || getOrCreateAnonymousUUID();

      const anonData = await captureAnonymousData(oldUid);

      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: { name, role: 'USER' }
        }
      });

      if (error || !data.user) {
        set({ isLoading: false });
        let errorMsg = error?.message || 'Registration failed';
        if (errorMsg.toLowerCase().includes('already registered')) {
          errorMsg = 'An account already exists with this email address.';
        } else if (errorMsg.toLowerCase().includes('password should be')) {
          errorMsg = 'Password should be at least 6 characters long.';
        }
        return { success: false, error: errorMsg };
      }

      const newUid = data.user.id;
      await logUserSessionInfo(newUid, 'email');
      await mergeCapturedDataToAccount(oldUid, newUid, anonData);

      const prefs = getStoredPreferences();
      const profile: UserProfile = {
        uid: newUid,
        email: data.user.email || email,
        name,
        role: 'USER',
        streak: prefs.streakDays || 1,
        bestStreak: prefs.streakDays || 1,
      };
      await createOrUpdateUserProfile(newUid, profile);

      const userObj: User = {
        id: newUid,
        email: profile.email || email,
        name: profile.name || name,
        role: profile.role,
        streak: profile.streak,
        bestStreak: profile.bestStreak,
        isAnonymous: false,
      };

      await useSettingsStore.getState().loadPreferences();
      set({ user: userObj, firebaseUser: data.user, supabaseUser: data.user, isLoading: false });
      return { success: true };
    } catch (error: any) {
      set({ isLoading: false });
      return { success: false, error: error.message || 'Registration failed' };
    }
  },
  loginAnonymously: async () => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error || !data.user) {
        throw new Error(error?.message || 'Anonymous sign in failed');
      }
      await logUserSessionInfo(data.user.id, 'anonymous');
      const prefs = getStoredPreferences();
      let profile = await getUserProfile(data.user.id);
      if (!profile) {
        profile = {
          uid: data.user.id,
          email: `anon_${data.user.id.slice(0, 6)}@calmnest.org`,
          name: 'Anonymous Guest',
          role: 'USER',
          streak: prefs.streakDays || 1,
          bestStreak: prefs.streakDays || 1,
        };
        await createOrUpdateUserProfile(data.user.id, profile);
      }
      const userObj: User = {
        id: data.user.id,
        email: profile.email || '',
        name: profile.name || 'Anonymous Guest',
        role: profile.role,
        streak: profile.streak,
        bestStreak: profile.bestStreak,
        isAnonymous: true,
      };
      set({ user: userObj, firebaseUser: data.user, supabaseUser: data.user, isLoading: false });
      return { success: true };
    } catch (error: any) {
      set({ isLoading: false });
      const anonUuid = getOrCreateAnonymousUUID();
      const prefs = getStoredPreferences();
      const fallbackUser: User = {
        id: anonUuid,
        email: `${anonUuid.slice(0, 10)}@calmnest.org`,
        name: 'Anonymous Guest',
        role: 'USER',
        streak: prefs.streakDays || 1,
        bestStreak: prefs.streakDays || 1,
        isAnonymous: true,
      };
      set({ user: fallbackUser, firebaseUser: null, supabaseUser: null, isLoading: false });
      return { success: true };
    }
  },
  loginWithGoogle: async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined
        }
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
  logout: async () => {
    try {
      await supabase.auth.signOut();
      get().loginAnonymously();
    } catch (error) {
      get().loginAnonymously();
    }
  },
  resetPassword: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to send reset email' };
    }
  },
  mergeAccount: async (email, pass) => {
    return get().login(email, pass);
  },
  exportData: () => {
    return exportAllAnonymousData();
  },
  deleteAnonymousAndReset: () => {
    deleteAnonymousDataAndReset();
    get().loginAnonymously();
  }
}));
