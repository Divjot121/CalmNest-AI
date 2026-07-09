'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Mail, Lock, Loader2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginAnonymously, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(res.error || 'Invalid credentials');
    }
  };

  const handleAnonLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    const res = await loginAnonymously();
    setIsSubmitting(false);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(res.error || 'Failed to enter anonymous session');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] opacity-70 -z-10" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-emerald-50 rounded-full blur-[120px] opacity-60 -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-indigo-500/10 rounded-3xl p-8 md:p-10"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Heart size={24} fill="currentColor" />
            </div>
            <span className="text-2xl font-bold text-slate-900 font-display">CalmNest</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome Back</h1>
          <p className="text-sm text-slate-500">Log in to continue your mental wellness journey</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-red-50 text-red-700 rounded-2xl flex items-center gap-3 text-sm mb-6 border border-red-100"
          >
            <AlertCircle size={18} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Password</label>
              <Link href="/auth/forgot-password" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 text-white rounded-2xl font-semibold text-sm shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase font-bold text-slate-400">
            <span className="bg-white px-3">Or continue privately</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAnonLogin}
          disabled={isSubmitting}
          className="w-full py-3.5 bg-emerald-50 hover:bg-emerald-100/80 active:scale-[0.99] border border-emerald-200 text-emerald-800 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
        >
          <ShieldCheck size={18} className="text-emerald-600" />
          <span>Start 100% Anonymous Guest Session</span>
        </button>

        <p className="text-center text-sm text-slate-500 mt-8">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Sign up for free
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
