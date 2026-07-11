'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Sparkles, Loader2, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuthStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await resetPassword(email.trim());
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error || 'Failed to send recovery email. Double check the address.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
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
          <h1 className="text-xl font-medium text-slate-900 dark:text-slate-100">Recover Password</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Request a recovery link to access your account</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
            {error}
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
              <h3 className="font-semibold text-sm text-slate-950 dark:text-slate-50">Recovery Email Dispatched</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 px-2 leading-relaxed">
                If an account exists with <strong>{email}</strong>, you will receive a reset password link shortly. Check your inbox and spam folder.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-primary dark:text-[#A1C2D4] hover:underline font-semibold"
              >
                <ArrowLeft size={13} />
                <span>Return to Login</span>
              </Link>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-[#FAF9F6] dark:bg-[#16181D] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                  required
                />
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-2xs disabled:opacity-50"
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              <span>Send Recovery Link</span>
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                <ArrowLeft size={13} />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </main>
  );
}
