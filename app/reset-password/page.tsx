'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Sparkles, Loader2, KeyRound, CheckCircle2, ArrowRight, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { triggerGentleSanctuaryCelebration } from '@/components/SanctuaryConfetti';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { checkAuth } = useAuthStore();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [strength, setStrength] = useState({ score: 0, label: 'Weak', color: 'bg-rose-500' });

  useEffect(() => {
    // Check if recovery session is active (either hash params or active auth session)
    const checkRecoverySession = async () => {
      // In Supabase, clicking the reset link redirect puts recovery tokens in URL hash.
      // Next.js client-side can verify if user is authenticated or has hash params.
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setHasSession(true);
      } else {
        // Look at the window hash params
        if (typeof window !== 'undefined' && (window.location.hash.includes('access_token') || window.location.search.includes('code'))) {
          setHasSession(true);
        } else {
          setHasSession(false);
          setError('No active password reset session found. Please request a new recovery link.');
        }
      }
    };
    checkRecoverySession();
  }, []);

  // Dynamic Password Strength Meter
  useEffect(() => {
    const checkStrength = () => {
      if (!password) {
        setStrength({ score: 0, label: 'Too Short', color: 'bg-slate-300' });
        return;
      }
      let score = 0;
      if (password.length >= 8) score += 1;
      if (/[A-Z]/.test(password)) score += 1;
      if (/[0-9]/.test(password)) score += 1;
      if (/[^A-Za-z0-9]/.test(password)) score += 1;

      let label = 'Weak';
      let color = 'bg-rose-500';
      if (score === 2) {
        label = 'Fair';
        color = 'bg-amber-500';
      } else if (score === 3) {
        label = 'Good';
        color = 'bg-blue-500';
      } else if (score === 4) {
        label = 'Strong';
        color = 'bg-emerald-500';
      }

      setStrength({ score, label, color });
    };
    setTimeout(checkStrength, 0);
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.updateUser({ password });
      if (resetError) {
        setError(resetError.message || 'Recovery token has expired or is invalid.');
      } else {
        setSuccess(true);
        triggerGentleSanctuaryCelebration('petals');
        // Refresh Auth Store session
        await checkAuth();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
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
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-2xs">
            <Sparkles size={20} strokeWidth={1.75} />
          </Link>
          <h1 className="text-xl font-medium text-slate-900 dark:text-slate-100">Set New Password</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Choose a secure password for your account</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4 text-center py-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-slate-950 dark:text-slate-50">Password Changed</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 px-2 leading-relaxed">
                Your password has been updated. You are now logged in and redirected to your workspace.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2"
              >
                <span>Enter Dashboard</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-[#FAF9F6] dark:bg-[#16181D] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                  disabled={hasSession === false}
                  required
                />
                <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Strength:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{strength.label}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-100 dark:bg-[#2B2F38] rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: `${(strength.score / 4) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-[#FAF9F6] dark:bg-[#16181D] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                  disabled={hasSession === false}
                  required
                />
                <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || hasSession === false}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-2xs disabled:opacity-50"
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              <span>Reset Password</span>
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="text-xs text-primary dark:text-[#A1C2D4] hover:underline"
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </main>
  );
}
