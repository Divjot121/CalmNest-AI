'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Flame,
  SmilePlus,
  MessageSquareHeart,
  BookOpen,
  Compass,
  ListTodo,
  ClipboardCheck,
  CheckCircle2,
  Circle,
  Plus,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Clock,
  Calendar
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import AppSidebar from '@/components/AppSidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { useWellnessStore } from '@/store/useWellnessStore';
import { useHabitStore } from '@/store/useHabitStore';
import { useTherapistStore } from '@/store/useTherapistStore';

const moodOptions = [
  { score: 1, label: 'Struggling', icon: '😔', color: 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100' },
  { score: 2, label: 'Low', icon: '😕', color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' },
  { score: 3, label: 'Okay', icon: '😐', color: 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' },
  { score: 4, label: 'Good', icon: '🙂', color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' },
  { score: 5, label: 'Great', icon: '😄', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' },
];

const wellnessTips = [
  {
    title: 'Box Breathing Technique',
    desc: 'Inhale for 4 seconds, hold for 4, exhale for 4, hold for 4. Repeat 3 times to instantly lower cortisol.',
    tag: 'Mindfulness',
    color: 'from-blue-500/10 to-indigo-500/10 border-blue-200 text-blue-900',
  },
  {
    title: 'The 3-3-3 Grounding Rule',
    desc: 'Name 3 things you see, 3 sounds you hear, and move 3 parts of your body when anxiety spikes.',
    tag: 'Anxiety Relief',
    color: 'from-emerald-500/10 to-teal-500/10 border-emerald-200 text-emerald-900',
  },
  {
    title: 'Cognitive Reframing',
    desc: 'Notice an unhelpful thought? Ask: Is this thought 100% true right now? What would I tell a close friend?',
    tag: 'CBT Strategy',
    color: 'from-purple-500/10 to-pink-500/10 border-purple-200 text-purple-900',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { todayMood, recentLogs, streak, fetchDashboardData, logMood, isLoading: moodLoading } = useWellnessStore();
  const { habits, fetchHabits, toggleCompletion, isLoading: habitsLoading } = useHabitStore();
  const { createNewConversation } = useTherapistStore();

  const [selectedMoodScore, setSelectedMoodScore] = useState<number | null>(null);
  const [moodNotes, setMoodNotes] = useState('');
  const [isLoggingMood, setIsLoggingMood] = useState(false);
  const [activeTipIndex, setActiveTipIndex] = useState(0);

  useEffect(() => {
    if (!authLoading) {
      fetchDashboardData();
      fetchHabits();
    }
  }, [authLoading, fetchDashboardData, fetchHabits]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTipIndex((prev) => (prev + 1) % wellnessTips.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleQuickMoodSubmit = async (score: number) => {
    setIsLoggingMood(true);
    await logMood(score, 3, ['check-in'], moodNotes || `Logged from quick check-in`);
    setIsLoggingMood(false);
    setSelectedMoodScore(null);
    setMoodNotes('');
  };

  const handleStartTherapySession = async () => {
    const convId = await createNewConversation('Quick Wellness Check-in');
    if (convId) {
      router.push('/chat');
    } else {
      router.push('/chat');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Prepare chart data
  const chartData = [...recentLogs]
    .reverse()
    .slice(-7)
    .map((l, idx) => ({
      day: new Date(l.createdAt).toLocaleDateString('en-US', { weekday: 'short' }),
      score: l.moodScore,
    }));

  if (chartData.length === 0) {
    // Fallback sample trend if no logs yet
    chartData.push(
      { day: 'Mon', score: 3 },
      { day: 'Tue', score: 4 },
      { day: 'Wed', score: 3 },
      { day: 'Thu', score: 5 },
      { day: 'Fri', score: 4 },
      { day: 'Sat', score: 4 },
      { day: 'Sun', score: todayMood?.moodScore || 4 }
    );
  }

  return (
    <AppSidebar>
      <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 md:p-8 rounded-3xl shadow-xl shadow-indigo-600/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} />
              <span>Personalized Wellness Center</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Friend'} 👋
            </h1>
            <p className="text-sm text-indigo-100/90 max-w-xl">
              Take a moment to check in with yourself. Small daily mindfulness habits lead to profound long-term inner peace.
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-3 bg-white/15 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/20 shrink-0">
            <div className="w-10 h-10 bg-amber-500/20 text-amber-300 rounded-xl flex items-center justify-center font-bold text-lg">
              🔥
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-indigo-200">Current Streak</p>
              <p className="text-xl font-bold font-display">{streak || 1} Days Active</p>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={handleStartTherapySession}
            className="flex flex-col justify-between p-5 bg-white hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-300 rounded-3xl shadow-sm transition-all group text-left"
          >
            <div className="w-11 h-11 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageSquareHeart size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">24/7 AI Therapist</h3>
              <p className="text-xs text-slate-500 mt-0.5">Start anonymous chat</p>
            </div>
          </button>

          <Link
            href="/mood"
            className="flex flex-col justify-between p-5 bg-white hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 rounded-3xl shadow-sm transition-all group text-left"
          >
            <div className="w-11 h-11 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <SmilePlus size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Mood Trends</h3>
              <p className="text-xs text-slate-500 mt-0.5">Track & analyze emotions</p>
            </div>
          </Link>

          <Link
            href="/journal"
            className="flex flex-col justify-between p-5 bg-white hover:bg-purple-50/50 border border-slate-200/80 hover:border-purple-300 rounded-3xl shadow-sm transition-all group text-left"
          >
            <div className="w-11 h-11 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Reflective Journal</h3>
              <p className="text-xs text-slate-500 mt-0.5">Write private entries</p>
            </div>
          </Link>

          <Link
            href="/meditation"
            className="flex flex-col justify-between p-5 bg-white hover:bg-blue-50/50 border border-slate-200/80 hover:border-blue-300 rounded-3xl shadow-sm transition-all group text-left"
          >
            <div className="w-11 h-11 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Compass size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Guided Breathing</h3>
              <p className="text-xs text-slate-500 mt-0.5">Box & 4-7-8 exercises</p>
            </div>
          </Link>
        </div>

        {/* Main 2-Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Daily Check-in & Habits */}
          <div className="lg:col-span-2 space-y-8">
            {/* Daily Mood Check-In Widget */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-display">How are you feeling right now?</h2>
                  <p className="text-xs text-slate-500">Log your current mood to track emotional shifts throughout the day</p>
                </div>
                {todayMood && (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    <span>Checked In Today</span>
                  </span>
                )}
              </div>

              {todayMood && !selectedMoodScore ? (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">
                      {moodOptions.find((o) => o.score === todayMood.moodScore)?.icon || '😐'}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        Today's Mood: {moodOptions.find((o) => o.score === todayMood.moodScore)?.label} ({todayMood.moodScore}/5)
                      </h4>
                      {todayMood.notes && <p className="text-xs text-slate-600 mt-0.5 italic">"{todayMood.notes}"</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMoodScore(todayMood.moodScore)}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Update Mood
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-2 md:gap-3">
                    {moodOptions.map((opt) => (
                      <button
                        key={opt.score}
                        disabled={isLoggingMood}
                        onClick={() => handleQuickMoodSubmit(opt.score)}
                        className={`p-3 md:p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all active:scale-95 ${opt.color} ${
                          selectedMoodScore === opt.score ? 'ring-2 ring-indigo-600 scale-105' : ''
                        }`}
                      >
                        <span className="text-3xl md:text-4xl">{opt.icon}</span>
                        <span className="text-xs font-bold">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Daily Habits Checklist */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-display">Daily Wellness Habits</h2>
                  <p className="text-xs text-slate-500">Complete daily routines to build long-term mental resilience</p>
                </div>
                <Link
                  href="/habits"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <span>Manage</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {habitsLoading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="animate-spin text-indigo-600" size={24} />
                </div>
              ) : habits.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-sm font-medium text-slate-500 mb-2">No habits active yet</p>
                  <Link href="/habits" className="text-xs font-bold text-indigo-600 hover:underline">
                    Create your first habit
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {habits.map((h) => (
                    <div
                      key={h.id}
                      onClick={() => toggleCompletion(h.id)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                        h.completedToday
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/80 text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                          h.completedToday ? 'bg-emerald-600 text-white' : 'border-2 border-slate-300 text-transparent'
                        }`}>
                          <CheckCircle2 size={16} />
                        </div>
                        <span className="text-xl">{h.icon}</span>
                        <div>
                          <h4 className={`font-bold text-sm ${h.completedToday ? 'line-through text-emerald-800' : ''}`}>
                            {h.name}
                          </h4>
                          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                            {h.frequency}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold bg-white px-3 py-1 rounded-xl shadow-2xs border border-slate-200/80">
                        <span>🔥</span>
                        <span>{h.streak || 0}d</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Mood Trend Chart & Tip of the Day */}
          <div className="space-y-8">
            {/* Mood Trend Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 font-display text-base">Mood Trend</h3>
                  <p className="text-xs text-slate-500">Last 7 Check-ins</p>
                </div>
                <TrendingUp className="text-indigo-600" size={20} />
              </div>

              <div className="h-44 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis domain={[1, 5]} ticks={[1, 3, 5]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }}
                      labelStyle={{ fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#moodGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Tip of the Day Carousel */}
            <div className={`p-6 rounded-3xl border bg-gradient-to-br ${wellnessTips[activeTipIndex].color} relative overflow-hidden shadow-sm transition-all duration-500`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 bg-white/80 rounded-full text-indigo-900">
                  {wellnessTips[activeTipIndex].tag}
                </span>
                <Sparkles size={18} className="text-indigo-600 animate-pulse" />
              </div>
              <h3 className="font-bold text-lg mb-2 font-display">{wellnessTips[activeTipIndex].title}</h3>
              <p className="text-xs leading-relaxed opacity-90 mb-6">{wellnessTips[activeTipIndex].desc}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {wellnessTips.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTipIndex(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === activeTipIndex ? 'w-5 bg-indigo-600' : 'w-1.5 bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <Link
                  href="/meditation"
                  className="text-xs font-bold text-indigo-700 hover:underline flex items-center gap-1"
                >
                  <span>Try Studio</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppSidebar>
  );
}
