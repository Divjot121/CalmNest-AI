'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Sparkles, Leaf, Shield, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { triggerGentleSanctuaryCelebration } from '@/components/SanctuaryConfetti';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loginWithGoogle, isLoading: authLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If user is already logged in as a registered user, redirect to dashboard
    if (user && !user.isAnonymous) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await login(email.trim(), password.trim());
      if (res.success) {
        triggerGentleSanctuaryCelebration('petals');
        router.push('/dashboard');
      } else {
        setError(res.error || 'Invalid credentials. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        setError(res.error || 'Google login failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize Google login.');
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF9F6] dark:bg-[#16181D] flex flex-col justify-center items-center p-4 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md bg-white dark:bg-[#1E2128] border border-slate-200/70 dark:border-[#2B2F38] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6"
      >
        {/* Logo */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-2xs">
            <Sparkles size={20} strokeWidth={1.75} />
          </Link>
          <h1 className="text-xl font-medium text-slate-900 dark:text-slate-100">Welcome Back to CalmNest</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Re-enter your private, mindful sanctuary</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/70 dark:border-[#2B2F38] bg-[#FAF9F6] dark:bg-[#16181D] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Password</label>
              <Link href="/forgot-password" className="text-[11px] text-primary dark:text-[#A1C2D4] hover:underline">
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/70 dark:border-[#2B2F38] bg-[#FAF9F6] dark:bg-[#16181D] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-primary"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-2xs disabled:opacity-50"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            <span>Sign In</span>
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-[#2B2F38]"></div>
          <span className="flex-shrink mx-3 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">Or continue with</span>
          <div className="flex-grow border-t border-slate-200 dark:border-[#2B2F38]"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-2.5 bg-white dark:bg-[#1E2128] hover:bg-slate-50 dark:hover:bg-[#252932] border border-slate-200 dark:border-[#2B2F38] rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-2xs flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" width="16" height="16">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>Sign In with Google</span>
        </button>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary dark:text-[#A1C2D4] hover:underline font-semibold">
              Create Permanent Account
            </Link>
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-100 dark:border-[#2B2F38] text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <Lock size={12} className="text-[#6B907B]" />
            Encrypted & Secure
          </span>
          <span className="flex items-center gap-1">
            <Shield size={12} className="text-[#6B907B]" />
            GDPR Compliant
          </span>
        </div>
      </motion.div>
    </main>
  );
}
