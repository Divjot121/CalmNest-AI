'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  SmilePlus,
  Plus,
  TrendingUp,
  Calendar,
  Tag as TagIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Sparkles,
  ArrowUpRight,
  Leaf
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import AppSidebar from '@/components/AppSidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { useWellnessStore } from '@/store/useWellnessStore';
import { triggerGentleSanctuaryCelebration } from '@/components/SanctuaryConfetti';

const moodScales = [
  { score: 1, label: 'Struggling', icon: '😔', desc: 'Overwhelmed or deeply distressed', bg: 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300' },
  { score: 2, label: 'Low', icon: '😕', desc: 'Feeling down, anxious or fatigued', bg: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300' },
  { score: 3, label: 'Okay', icon: '😐', desc: 'Neutral, stable or coping', bg: 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-[#252932] dark:border-[#2B2F38] dark:text-slate-300' },
  { score: 4, label: 'Good', icon: '🙂', desc: 'Positive, calm or productive', bg: 'bg-[#E8F0F8] border-[#8DA9B7]/60 text-[#436475] dark:bg-[#5C8397]/20 dark:border-[#5C8397]/40 dark:text-[#A1C2D4]' },
  { score: 5, label: 'Great', icon: '😄', desc: 'Joyful, energetic or peaceful', bg: 'bg-[#E6EFEA] border-[#6B907B]/60 text-[#4A725D] dark:bg-[#6B907B]/20 dark:border-[#6B907B]/40 dark:text-[#A8C8B5]' },
];

const availableTags = [
  'Anxious', 'Calm', 'Stressed', 'Grateful', 'Tired', 'Energetic',
  'Sad', 'Productive', 'Social', 'Isolated', 'Work', 'Family', 'Sleep', 'Exercise'
];

export default function MoodTrackerPage() {
  const { user, isLoading: authLoading } = useAuthStore();
  const { recentLogs, fetchDashboardData, logMood, isLoading: moodLoading } = useWellnessStore();

  const [selectedScore, setSelectedScore] = useState<number>(3);
  const [intensity, setIntensity] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Calm']);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [chartView, setChartView] = useState<'area' | 'bar'>('area');

  useEffect(() => {
    if (!authLoading) {
      fetchDashboardData();
    }
  }, [authLoading, fetchDashboardData]);

  const handleTagClick = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await logMood(selectedScore, intensity, selectedTags, notes);
      setSuccessMsg(true);
      setNotes('');
      triggerGentleSanctuaryCelebration('petals');
      setTimeout(() => setSuccessMsg(false), 3500);
    } catch (err) {
      console.error("Error logging mood:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const chartData = [...recentLogs]
    .slice(0, 14)
    .reverse()
    .map((log) => ({
      date: new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      score: log.moodScore,
      intensity: log.intensity || 5
    }));

  return (
    <AppSidebar>
      <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-6xl mx-auto bg-[#FAF9F6] dark:bg-[#16181D] min-h-screen transition-colors duration-300 select-none">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-[#2B2F38]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-blue text-[11px] py-0.5 px-2.5 font-mono">🍃 Emotional Check-in</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-slate-900 dark:text-slate-100">
              Mood & Resilience Journal
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
            Every entry deepens emotional clarity and helps your AI companion understand how to support you best.
          </p>
        </div>

        {/* Top Grid: Mood Entry Form & Recent Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Interactive Check-In Form (7 cols) */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-7 card-minimal"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <SmilePlus size={18} className="text-[#5C8397] dark:text-[#A1C2D4]" />
                <span>How are you feeling right now?</span>
              </h2>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">100% Private</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1. Mood Selection Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {moodScales.map((item) => {
                  const isSelected = selectedScore === item.score;
                  return (
                    <button
                      key={item.score}
                      type="button"
                      onClick={() => setSelectedScore(item.score)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-200 ${item.bg} ${
                        isSelected
                          ? 'ring-2 ring-[#5C8397] dark:ring-[#8DA9B7] scale-[1.02] font-medium shadow-2xs'
                          : 'opacity-85 hover:opacity-100 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-xs">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* 2. Intensity Slider */}
              <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-[#2B2F38]">
                <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                  <span>Intensity / Energy level:</span>
                  <span className="font-mono font-medium text-[#5C8397] dark:text-[#A1C2D4]">{intensity} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="w-full accent-[#5C8397] h-1.5 bg-slate-200 dark:bg-[#2B2F38] rounded-lg cursor-pointer"
                />
              </div>

              {/* 3. Emotional Tags */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200/60 dark:border-[#2B2F38]">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <TagIcon size={13} className="text-slate-400" />
                  <span>What describes your space today? (Select tags)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagClick(tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs transition-all ${
                          isSelected
                            ? 'bg-[#5C8397] text-white font-medium shadow-2xs'
                            : 'bg-slate-100 dark:bg-[#16181D] border border-slate-200/70 dark:border-[#2B2F38] text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-[#252932]'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Notes textarea */}
              <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-[#2B2F38]">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Optional Reflection Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What triggered this feeling or what gave you peace today?"
                  rows={3}
                  className="input-minimal text-xs resize-none"
                />
              </div>

              {/* Submit Button & Notification */}
              <div className="flex items-center justify-between pt-2">
                <AnimatePresence>
                  {successMsg ? (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-xs font-medium text-[#6B907B] dark:text-[#A8C8B5]"
                    >
                      <CheckCircle2 size={16} />
                      <span>Saved privately to your Sanctuary journal!</span>
                    </motion.div>
                  ) : <div />}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary px-6 py-2.5 text-xs ml-auto"
                >
                  {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  <span>Save Check-In</span>
                </button>
              </div>
            </form>
          </motion.div>

          {/* Right Column: Trend Visualizer (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="card-minimal flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-sm text-slate-900 dark:text-slate-100">14-Day Trajectory</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Emotional progression timeline</p>
                  </div>
                  <div className="flex bg-slate-100 dark:bg-[#16181D] p-0.5 rounded-lg border border-slate-200/70 dark:border-[#2B2F38] text-[11px]">
                    <button
                      onClick={() => setChartView('area')}
                      className={`px-2.5 py-1 rounded-md font-mono ${chartView === 'area' ? 'bg-white dark:bg-[#252932] text-slate-900 dark:text-slate-100 shadow-2xs font-medium' : 'text-slate-500'}`}
                    >
                      Area
                    </button>
                    <button
                      onClick={() => setChartView('bar')}
                      className={`px-2.5 py-1 rounded-md font-mono ${chartView === 'bar' ? 'bg-white dark:bg-[#252932] text-slate-900 dark:text-slate-100 shadow-2xs font-medium' : 'text-slate-500'}`}
                    >
                      Bars
                    </button>
                  </div>
                </div>

                <div className="h-56 w-full pt-2">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      {chartView === 'area' ? (
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#5C8397" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#5C8397" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#1E2128', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff' }} />
                          <Area type="monotone" dataKey="score" stroke="#5C8397" strokeWidth={2.5} fillOpacity={1} fill="url(#moodGradient)" />
                        </AreaChart>
                      ) : (
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#1E2128', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff' }} />
                          <Bar dataKey="score" fill="#5C8397" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
                      <TrendingUp size={24} className="mb-2 opacity-60" />
                      <p className="text-xs">Log check-ins to unlock trend history.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/60 dark:border-[#2B2F38] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Total Logs Recorded:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-slate-100">{recentLogs.length} entries</span>
              </div>
            </div>
          </div>
        </div>

        {/* History Stream */}
        <div className="card-minimal space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-[#2B2F38]">
            <h3 className="font-medium text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar size={16} className="text-[#5C8397] dark:text-[#A1C2D4]" />
              <span>Sanctuary Check-in History</span>
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">Chronological order</span>
          </div>

          <div className="space-y-3">
            {recentLogs.map((log) => {
              const matchedScale = moodScales.find(m => m.score === log.moodScore) || moodScales[2];
              return (
                <div
                  key={log.id}
                  className="p-4 rounded-xl bg-white dark:bg-[#1E2128] border border-slate-200/70 dark:border-[#2B2F38] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="text-2xl p-2.5 rounded-xl bg-slate-50 dark:bg-[#16181D] border border-slate-200/60 dark:border-[#2B2F38]">
                      {matchedScale.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-900 dark:text-slate-100">{matchedScale.label}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">Score: {log.moodScore}/5</span>
                      </div>
                      {log.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic font-light">&quot;{log.notes}&quot;</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {log.tags && log.tags.map((t, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-[#16181D] rounded-md text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 dark:text-slate-500 font-mono self-start sm:self-auto">
                    {new Date(log.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}
            {recentLogs.length === 0 && !moodLoading && (
              <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs">
                No past check-in logs found. Log your first check-in above when you are ready.
              </div>
            )}
          </div>
        </div>

      </div>
    </AppSidebar>
  );
}
