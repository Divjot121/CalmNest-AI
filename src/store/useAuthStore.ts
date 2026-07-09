import { create } from 'zustand';
import { auth, db } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { getUserProfile, createOrUpdateUserProfile, UserProfile } from '@/lib/firestore-service';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  avatarUrl?: string | null;
  streak?: number;
  bestStreak?: number;
  isAnonymous?: boolean;
}

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<User | null>;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, pass: string, name: string) => Promise<{ success: boolean; error?: string }>;
  loginAnonymously: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  firebaseUser: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  checkAuth: () => {
    return new Promise((resolve) => {
      set({ isLoading: true });
      const unsub = onAuthStateChanged(auth, async (u) => {
        if (u) {
          let profile = await getUserProfile(u.uid);
          if (!profile) {
            profile = {
              uid: u.uid,
              email: u.email || `anon_${u.uid.slice(0, 6)}@calmnest.org`,
              name: u.displayName || (u.isAnonymous ? 'Anonymous Guest' : 'CalmNest User'),
              role: 'USER',
              streak: 1,
              bestStreak: 1,
            };
            await createOrUpdateUserProfile(u.uid, profile);
          }
          const userObj: User = {
            id: u.uid,
            email: profile.email || u.email || '',
            name: profile.name || u.displayName || 'CalmNest User',
            role: profile.role || 'USER',
            avatarUrl: profile.avatarUrl || u.photoURL,
            streak: profile.streak || 1,
            bestStreak: profile.bestStreak || 1,
            isAnonymous: u.isAnonymous,
          };
          set({ user: userObj, firebaseUser: u, isLoading: false });
          resolve(userObj);
        } else {
          // If no user, default to anonymous auth or null if on auth pages
          if (typeof window !== 'undefined' && (window.location.pathname.startsWith('/auth') || window.location.pathname === '/')) {
            set({ user: null, firebaseUser: null, isLoading: false });
            resolve(null);
          } else {
            try {
              const cred = await signInAnonymously(auth);
              let profile = await getUserProfile(cred.user.uid);
              if (!profile) {
                profile = {
                  uid: cred.user.uid,
                  email: `anon_${cred.user.uid.slice(0, 6)}@calmnest.org`,
                  name: 'Anonymous Guest',
                  role: 'USER',
                  streak: 1,
                  bestStreak: 1,
                };
                await createOrUpdateUserProfile(cred.user.uid, profile);
              }
              const userObj: User = {
                id: cred.user.uid,
                email: profile.email,
                name: profile.name,
                role: profile.role,
                streak: profile.streak,
                bestStreak: profile.bestStreak,
                isAnonymous: true,
              };
              set({ user: userObj, firebaseUser: cred.user, isLoading: false });
              resolve(userObj);
            } catch (err) {
              set({ user: null, firebaseUser: null, isLoading: false });
              resolve(null);
            }
          }
        }
      });
    });
  },
  login: async (email, pass) => {
    try {
      set({ isLoading: true });
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const profile = await getUserProfile(cred.user.uid);
      const userObj: User = {
        id: cred.user.uid,
        email: cred.user.email || email,
        name: profile?.name || cred.user.displayName || 'CalmNest User',
        role: profile?.role || 'USER',
        streak: profile?.streak || 1,
        bestStreak: profile?.bestStreak || 1,
        isAnonymous: false,
      };
      set({ user: userObj, firebaseUser: cred.user, isLoading: false });
      return { success: true };
    } catch (error: any) {
      set({ isLoading: false });
      let errorMsg = error.message || 'Login failed';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMsg = 'Invalid email or password.';
      }
      return { success: false, error: errorMsg };
    }
  },
  signup: async (email, pass, name) => {
    try {
      set({ isLoading: true });
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
      
      const profile: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email || email,
        name,
        role: 'USER',
        streak: 1,
        bestStreak: 1,
      };
      await createOrUpdateUserProfile(cred.user.uid, profile);

      const userObj: User = {
        id: cred.user.uid,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        streak: profile.streak,
        bestStreak: profile.bestStreak,
        isAnonymous: false,
      };
      set({ user: userObj, firebaseUser: cred.user, isLoading: false });
      return { success: true };
    } catch (error: any) {
      set({ isLoading: false });
      let errorMsg = error.message || 'Registration failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMsg = 'An account already exists with this email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMsg = 'Password should be at least 6 characters long.';
      }
      return { success: false, error: errorMsg };
    }
  },
  loginAnonymously: async () => {
    try {
      set({ isLoading: true });
      const cred = await signInAnonymously(auth);
      let profile = await getUserProfile(cred.user.uid);
      if (!profile) {
        profile = {
          uid: cred.user.uid,
          email: `anon_${cred.user.uid.slice(0, 6)}@calmnest.org`,
          name: 'Anonymous Guest',
          role: 'USER',
          streak: 1,
          bestStreak: 1,
        };
        await createOrUpdateUserProfile(cred.user.uid, profile);
      }
      const userObj: User = {
        id: cred.user.uid,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        streak: profile.streak,
        bestStreak: profile.bestStreak,
        isAnonymous: true,
      };
      set({ user: userObj, firebaseUser: cred.user, isLoading: false });
      return { success: true };
    } catch (error: any) {
      set({ isLoading: false });
      return { success: false, error: error.message || 'Anonymous login failed' };
    }
  },
  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null, firebaseUser: null });
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    } catch (error) {
      set({ user: null, firebaseUser: null });
    }
  },
  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to send reset email' };
    }
  },
}));
