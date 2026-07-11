'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  SmilePlus,
  MessageSquareHeart,
  BookOpen,
  Compass,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Loader2,
  Globe,
  Sun,
  Moon,
  ListTodo,
  ShieldCheck,
  Leaf,
  Settings
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import AppSidebar from '@/components/AppSidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { useWellnessStore } from '@/store/useWellnessStore';
import { useHabitStore } from '@/store/useHabitStore';
import { useTherapistStore } from '@/store/useTherapistStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useSanctuaryTranslation, SupportedLanguage } from '@/lib/i18n/useSanctuaryTranslation';
import { SanctuaryWelcome } from '@/components/SanctuaryWelcome';
import { AmbiencePlayer } from '@/components/AmbiencePlayer';
import { triggerGentleSanctuaryCelebration } from '@/components/SanctuaryConfetti';
import { getWellnessSessions } from '@/lib/db-service';
import { useAmbientSoundStore } from '@/store/useAmbientSoundStore';

const moodOptions = [
  { score: 1, label: 'Struggling', icon: '😔', color: 'bg-rose-50/80 border-rose-200/80 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300' },
  { score: 2, label: 'Low', icon: '😕', color: 'bg-amber-50/80 border-amber-200/80 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300' },
  { score: 3, label: 'Okay', icon: '😐', color: 'bg-slate-50/80 border-slate-200/80 text-slate-700 dark:bg-[#252932] dark:border-[#2B2F38] dark:text-slate-300' },
  { score: 4, label: 'Good', icon: '🙂', color: 'bg-primary-subtle border-primary-light/60 text-primary-hover dark:bg-primary/20 dark:border-primary/40 dark:text-[#A1C2D4]' },
  { score: 5, label: 'Great', icon: '😄', color: 'bg-[#E6EFEA] border-[#6B907B]/60 text-[#4A725D] dark:bg-[#6B907B]/20 dark:border-[#6B907B]/40 dark:text-[#A8C8B5]' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { t, currentLanguage, setLanguage } = useSanctuaryTranslation();
  const { user, isLoading: authLoading } = useAuthStore();
  const { todayMood, recentLogs, streak, fetchDashboardData, logMood, isLoading: moodLoading } = useWellnessStore();
  const { habits, fetchHabits, toggleCompletion, isLoading: habitsLoading } = useHabitStore();
  const { createNewConversation } = useTherapistStore();
  const { openSettings, preferences } = useSettingsStore();
  const [primaryColor, setPrimaryColor] = useState('#5C8397');

  useEffect(() => {
      if (typeof window !== 'undefined') {
        const val = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
        if (val) {
          setTimeout(() => {
            setPrimaryColor(val);
          }, 0);
        }
      }
    }, [preferences.accentColor]);

  const [isOnboarded, setIsOnboarded] = useState(true);
  const [selectedMoodScore, setSelectedMoodScore] = useState<number | null>(null);
  const [isLoggingMood, setIsLoggingMood] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [greeting, setGreeting] = useState('Good day');
  const [sessionsCount, setSessionsCount] = useState(0);

  useEffect(() => {
    const checkOnboarded = localStorage.getItem('calmnest_onboarded');
    const hour = new Date().getHours();
    setTimeout(() => {
      if (!checkOnboarded) {
        setIsOnboarded(false);
      }
      if (hour < 12) setGreeting('Good morning');
      else if (hour < 18) setGreeting('Good afternoon');
      else setGreeting('Good evening');
    }, 0);
  }, []);

  useEffect(() => {
    useAmbientSoundStore.getState().triggerRecommendation('focus');
  }, []);

  useEffect(() => {
    if (!authLoading && user?.id) {
      fetchDashboardData();
      fetchHabits();
      getWellnessSessions(user.id).then(sessions => {
        setSessionsCount(sessions.length);
      }).catch(() => {});
    }
  }, [authLoading, user?.id, fetchDashboardData, fetchHabits]);

  const handleQuickMoodSubmit = async (score: number) => {
    setIsLoggingMood(true);
    await logMood(score, 3, ['check-in'], `Logged from Sanctuary Check-in`);
    setIsLoggingMood(false);
    setSelectedMoodScore(null);
    triggerGentleSanctuaryCelebration('petals');
  };

  const handleStartTherapySession = async () => {
    await createNewConversation('Sanctuary Check-in');
    router.push('/chat');
  };

  if (!isOnboarded) {
    return <SanctuaryWelcome onEnter={() => setIsOnboarded(true)} />;
  }

  // Calculate Virtual Plant Stage
  const activeStreak = user?.streak || streak || 1;
  const completedHabitsCount = habits.filter(h => h.completedToday).length;
  const totalWellnessScore = activeStreak * 2 + completedHabitsCount + (todayMood ? 5 : 0);
  
  let plantStage = { title: 'Sanctuary Sprout 🌱', desc: 'Your plant just sprouted! Take a deep breath to nurture its roots.', stageNum: 1 };
  if (totalWellnessScore > 18) {
    plantStage = { title: 'Blooming Lotus 🪷', desc: 'Your lotus is in full bloom. You are creating deep harmony inside.', stageNum: 3 };
  } else if (totalWellnessScore > 8) {
    plantStage = { title: 'Flourishing Leaf 🌿', desc: 'Your plant is growing strong with every gentle daily check-in.', stageNum: 2 };
  }

  // Formatting chart data
  const chartData = [...recentLogs]
    .slice(0, 7)
    .reverse()
    .map((log) => ({
      date: new Date(log.createdAt).toLocaleDateString([], { weekday: 'short' }),
      mood: log.moodScore,
    }));

  return (
    <AppSidebar>
      <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-6xl mx-auto bg-[#FAF9F6] dark:bg-[#16181D] min-h-screen transition-colors duration-300">
        
        {/* 1. Daily Greeting & Workspace Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-[#2B2F38]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-emerald py-0.5 px-2.5 text-[11px]">🍃 Sanctuary Workspace</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-medium text-slate-900 dark:text-slate-100 tracking-tight">
              {greeting}, {user?.name || 'Friend'}
            </h1>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {/* Sanctuary Settings Action */}
            <button
              onClick={() => openSettings()}
              className="btn-secondary py-2 px-3 text-xs gap-2"
              title="Open Sanctuary Settings"
            >
              <Settings size={14} strokeWidth={1.75} className="text-primary dark:text-[#A1C2D4]" />
              <span className="hidden sm:inline">Preferences</span>
            </button>

            {/* Language Selection Pill */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="btn-secondary py-2 px-3 text-xs gap-2"
                aria-label="Change language"
              >
                <Globe size={14} strokeWidth={1.75} className="text-primary dark:text-[#A1C2D4]" />
                <span className="uppercase font-mono font-medium">{currentLanguage}</span>
              </button>

              <AnimatePresence>
                {showLangMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-36 bg-white dark:bg-[#1E2128] rounded-xl shadow-md border border-slate-200/80 dark:border-[#2B2F38] py-1 z-50"
                  >
                    {[
                      { code: 'en', label: 'English 🇺🇸' },
                      { code: 'hi', label: 'हिन्दी 🇮🇳' },
                      { code: 'pa', label: 'ਪੰਜਾਬੀ 🇮🇳' },
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code as SupportedLanguage);
                          setShowLangMenu(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                          currentLanguage === lang.code ? 'bg-primary/15 text-primary dark:text-[#A1C2D4] font-medium' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#252932]'
                        }`}
                      >
                        <span>{lang.label}</span>
                        {currentLanguage === lang.code && <CheckCircle2 size={13} />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Streak Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-[#1E2128] border border-slate-200/70 dark:border-[#2B2F38] text-xs font-medium text-slate-700 dark:text-slate-300">
              <span className="text-amber-500">🔥</span>
              <span>{activeStreak} Days</span>
            </div>
          </div>
        </div>

        {/* 2. Emotional Check-In Card (Top Priority) */}
        {preferences.dashboardShowMood !== false && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="card-minimal"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                {todayMood ? "You've checked in today" : "How are you feeling right now?"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {todayMood 
                  ? "Your emotional awareness lowers cognitive load and nurtures inner resilience." 
                  : "Check in with your nervous system. Every response is private and safe."}
              </p>
            </div>
            {todayMood && (
              <Link href="/mood" className="text-xs font-medium text-primary dark:text-[#A1C2D4] hover:underline flex items-center gap-1 self-start sm:self-auto">
                <span>View Full Mood Journal</span>
                <ArrowRight size={13} />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {moodOptions.map((opt) => {
              const isSelected = todayMood?.moodScore === opt.score || selectedMoodScore === opt.score;
              return (
                <button
                  key={opt.score}
                  disabled={isLoggingMood || Boolean(todayMood)}
                  onClick={() => handleQuickMoodSubmit(opt.score)}
                  className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-200 ${opt.color} ${
                    isSelected 
                      ? 'ring-2 ring-primary dark:ring-[#8DA9B7] scale-[1.02] shadow-xs font-medium' 
                      : 'hover:border-slate-300 dark:hover:border-slate-600 opacity-90 hover:opacity-100'
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="text-xs">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
        )}

        {/* 3. Today's Wellness Summary & 4. Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wellness Summary */}
          <div className="lg:col-span-1 card-minimal flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-base text-slate-900 dark:text-slate-100">Daily Summary</h3>
                <span className="badge-blue font-mono text-[11px]">Today</span>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#252932]/60 border border-slate-200/50 dark:border-[#2B2F38]">
                  <span className="text-xs text-slate-600 dark:text-slate-300">Habits Completed</span>
                  <span className="text-xs font-mono font-medium text-slate-900 dark:text-slate-100">{completedHabitsCount} of {habits.length || 1}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#252932]/60 border border-slate-200/50 dark:border-[#2B2F38]">
                  <span className="text-xs text-slate-600 dark:text-slate-300">Current Mood State</span>
                  <span className="text-xs font-medium text-[#6B907B] dark:text-[#A8C8B5]">
                    {todayMood ? `${todayMood.moodScore} / 5` : 'Not logged'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#252932]/60 border border-slate-200/50 dark:border-[#2B2F38]">
                  <span className="text-xs text-slate-600 dark:text-slate-300">Sanctuary Streak</span>
                  <span className="text-xs font-mono font-medium text-amber-600 dark:text-amber-400">{activeStreak} Days</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#252932]/60 border border-slate-200/50 dark:border-[#2B2F38]">
                  <span className="text-xs text-slate-600 dark:text-slate-300">Wellness Sessions</span>
                  <span className="text-xs font-mono font-medium text-slate-900 dark:text-slate-100">{sessionsCount} Completed</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-[#2B2F38]">
              <Link href="/assessments" className="w-full btn-ghost text-xs justify-center py-2">
                <span>Self-Assessment Screenings</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {preferences.dashboardShowQuickChat !== false && (
            <div onClick={handleStartTherapySession} className="card-minimal cursor-pointer group flex flex-col justify-between hover:border-primary/50 transition-all">
              <div>
                <div className="w-9 h-9 bg-primary-subtle dark:bg-primary/20 text-primary dark:text-[#A1C2D4] rounded-xl flex items-center justify-center mb-3">
                  <MessageSquareHeart size={18} strokeWidth={1.75} />
                </div>
                <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 group-hover:text-primary dark:group-hover:text-[#A1C2D4] transition-colors">
                  AI Therapist Session
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Start an empathetic, non-judgmental dialogue with your AI wellness companion right now.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-primary dark:text-[#A1C2D4] pt-4">
                <span>Begin Chat</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            )}

            {preferences.dashboardShowMeditation !== false && (
            <Link href="/meditation" className="card-minimal group flex flex-col justify-between hover:border-[#6B907B]/50 transition-all">
              <div>
                <div className="w-9 h-9 bg-[#E6EFEA] dark:bg-[#6B907B]/20 text-[#6B907B] dark:text-[#A8C8B5] rounded-xl flex items-center justify-center mb-3">
                  <Compass size={18} strokeWidth={1.75} />
                </div>
                <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 group-hover:text-[#6B907B] dark:group-hover:text-[#A8C8B5] transition-colors">
                  Breathing Studio
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Calm your nervous system with interactive lotus Box Breathing and 4-7-8 relaxation exercises.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#6B907B] dark:text-[#A8C8B5] pt-4">
                <span>Enter Studio</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            )}

            <Link href="/journal" className="card-minimal group flex flex-col justify-between hover:border-[#8D80A9]/50 transition-all">
              <div>
                <div className="w-9 h-9 bg-[#EFEAF6] dark:bg-[#8D80A9]/20 text-[#8D80A9] dark:text-[#C5B8DD] rounded-xl flex items-center justify-center mb-3">
                  <BookOpen size={18} strokeWidth={1.75} />
                </div>
                <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 group-hover:text-[#8D80A9] dark:group-hover:text-[#C5B8DD] transition-colors">
                  Private Journal
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Reflect on your day with structured mindful prompts and emotional tag filters.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#8D80A9] dark:text-[#C5B8DD] pt-4">
                <span>Write Entry</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {preferences.dashboardShowHabits !== false && (
            <Link href="/habits" className="card-minimal group flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-all">
              <div>
                <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl flex items-center justify-center mb-3">
                  <ListTodo size={18} strokeWidth={1.75} />
                </div>
                <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 transition-colors">
                  Daily Routine & Habits
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Track mindful rituals like hydration, gratitude, short walks, and evening reading.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 pt-4">
                <span>Check Routine</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            )}
          </div>
        </div>

        {/* 5. Mood Insights Chart & 8. Virtual Sanctuary Plant */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mood Trend Chart */}
          <div className="lg:col-span-2 card-minimal flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-base text-slate-900 dark:text-slate-100">Recent Mood Trends</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">7-day progression overview</p>
              </div>
              <Link href="/mood" className="btn-ghost text-xs py-1.5">
                <span>Details</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="h-56 w-full pt-2">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={primaryColor} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={primaryColor} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1E2128', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="mood" stroke={primaryColor} strokeWidth={2.5} fillOpacity={1} fill="url(#colorMood)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
                  <TrendingUp size={24} className="mb-2 opacity-60" />
                  <p className="text-xs">Log your daily check-in to generate your peaceful mood trend visualization.</p>
                </div>
              )}
            </div>
          </div>

          {/* Virtual Plant Sprout Card */}
          <div className="lg:col-span-1 card-minimal flex flex-col justify-between bg-gradient-to-br from-white to-[#FAF9F6] dark:from-[#1E2128] dark:to-[#16181D]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="badge-emerald font-mono text-[11px]">Calm Corner</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">Stage {plantStage.stageNum}/3</span>
              </div>

              <div className="text-center py-4">
                <motion.div
                  key={plantStage.title}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="w-20 h-20 bg-[#E6EFEA] dark:bg-[#6B907B]/20 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl shadow-2xs"
                >
                  {plantStage.stageNum === 1 ? '🌱' : plantStage.stageNum === 2 ? '🌿' : '🪷'}
                </motion.div>
                <h4 className="font-medium text-base text-slate-900 dark:text-slate-100">{plantStage.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed px-2">
                  {plantStage.desc}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/60 dark:border-[#2B2F38] text-center">
              <p className="text-[11px] text-[#6B907B] dark:text-[#A8C8B5] font-normal">
                ✓ Grows organically with every daily check-in and habit completed.
              </p>
            </div>
          </div>
        </div>

        {/* 7. Daily Habits Checklist Snapshot */}
        <div className="card-minimal">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-base text-slate-900 dark:text-slate-100">Today&apos;s Mindful Habits</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Gentle daily anchor routines</p>
            </div>
            <Link href="/habits" className="btn-ghost text-xs py-1.5">
              <span>Manage Habits</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {habits.slice(0, 6).map((habit) => (
              <div
                key={habit.id}
                onClick={() => toggleCompletion(habit.id)}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-150 ${
                  habit.completedToday
                    ? 'bg-slate-50/80 dark:bg-[#252932]/70 border-slate-200/80 dark:border-[#2B2F38] text-slate-400 dark:text-slate-500 line-through'
                    : 'bg-white dark:bg-[#1E2128] border-slate-200/70 dark:border-[#2B2F38] text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <span className="text-lg">{habit.icon || '🍃'}</span>
                  <span className="text-xs font-medium truncate">{habit.name}</span>
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                  habit.completedToday ? 'text-[#6B907B] dark:text-[#A8C8B5]' : 'text-slate-300 dark:text-slate-600'
                }`}>
                  <CheckCircle2 size={18} strokeWidth={1.75} />
                </div>
              </div>
            ))}
            {habits.length === 0 && !habitsLoading && (
              <div className="col-span-full py-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                Your mindful daily habit checklist will appear here. Click &quot;Manage Habits&quot; to customize your gentle routines.
              </div>
            )}
          </div>
        </div>

        {/* Embedded Ambient Soundscape Studio Snapshot */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
              Ambient Soundscape Engine
            </span>
          </div>
          <AmbiencePlayer />
        </div>

      </div>
    </AppSidebar>
  );
}
