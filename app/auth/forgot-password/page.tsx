'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuthStore();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const res = await resetPassword(email);
    setIsSubmitting(false);
    if (res.success) {
      setSuccess(true);
    } else {
      setError(res.error || 'Failed to send recovery email.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden">
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
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Reset Password</h1>
          <p className="text-sm text-slate-500">Enter your account email to receive a password recovery link</p>
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

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-emerald-50 text-emerald-800 rounded-3xl text-center border border-emerald-100 space-y-4"
          >
            <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
            <h3 className="font-bold text-lg">Recovery Link Sent</h3>
            <p className="text-sm text-emerald-700">
              We have sent instructions to <strong>{email}</strong>. Please check your inbox and spam folder.
            </p>
            <Link
              href="/auth/login"
              className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm shadow-md hover:bg-emerald-700 transition-all"
            >
              Return to Login
            </Link>
          </motion.div>
        ) : (
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 text-white rounded-2xl font-semibold text-sm shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all mt-4"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Sending reset link...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>
          </form>
        )}

        <div className="text-center mt-8">
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600">
            <ArrowLeft size={16} />
            <span>Back to Login</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
