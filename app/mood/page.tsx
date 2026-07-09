'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowUpRight
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import AppSidebar from '@/components/AppSidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { useWellnessStore } from '@/store/useWellnessStore';

const moodScales = [
  { score: 1, label: 'Struggling', icon: '😔', desc: 'Overwhelmed or deeply distressed', bg: 'bg-rose-50 border-rose-200 text-rose-700' },
  { score: 2, label: 'Low', icon: '😕', desc: 'Feeling down, anxious or fatigued', bg: 'bg-amber-50 border-amber-200 text-amber-700' },
  { score: 3, label: 'Okay', icon: '😐', desc: 'Neutral, stable or coping', bg: 'bg-slate-50 border-slate-200 text-slate-700' },
  { score: 4, label: 'Good', icon: '🙂', desc: 'Positive, calm or productive', bg: 'bg-blue-50 border-blue-200 text-blue-700' },
  { score: 5, label: 'Great', icon: '😄', desc: 'Joyful, energetic or peaceful', bg: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
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
    setIsSubmitting(true);
    const ok = await logMood(selectedScore, intensity, selectedTags, notes);
    setIsSubmitting(false);
    if (ok) {
      setNotes('');
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    }
  };

  const chartData = [...recentLogs]
    .reverse()
    .slice(-14)
    .map((l) => ({
      date: new Date(l.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: l.moodScore,
      intensity: l.intensity || 5,
    }));

  if (chartData.length === 0) {
    chartData.push(
      { date: 'Mon', score: 3, intensity: 5 },
      { date: 'Tue', score: 4, intensity: 6 },
      { date: 'Wed', score: 3, intensity: 4 },
      { date: 'Thu', score: 5, intensity: 7 },
      { date: 'Fri', score: 4, intensity: 5 },
      { date: 'Sat', score: 4, intensity: 6 }
    );
  }

  const averageScore = chartData.length > 0
    ? (chartData.reduce((acc, c) => acc + c.score, 0) / chartData.length).toFixed(1)
    : '3.0';

  return (
    <AppSidebar>
      <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
              <SmilePlus size={16} />
              <span>Emotional Intelligence Studio</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-900">Mood Tracker & Analytics</h1>
            <p className="text-sm text-slate-500 mt-1">Log internal shifts, discover patterns, and build emotional self-awareness</p>
          </div>
          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400">14-Day Average</p>
              <p className="text-xl font-bold font-display text-indigo-600">{averageScore} / 5.0</p>
            </div>
          </div>
        </div>

        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 flex items-center gap-3 font-semibold text-sm shadow-sm"
          >
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>Mood check-in logged successfully! Your trends have been updated.</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Check-In Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-3">1. Select your current mood state</label>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {moodScales.map((item) => (
                    <button
                      key={item.score}
                      type="button"
                      onClick={() => setSelectedScore(item.score)}
                      className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-2 transition-all active:scale-95 ${
                        selectedScore === item.score
                          ? 'ring-2 ring-indigo-600 scale-105 shadow-md ' + item.bg
                          : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span className="text-3xl">{item.icon}</span>
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm font-bold text-slate-900 mb-2">
                  <span>2. Intensity Level</span>
                  <span className="text-indigo-600 font-display">{intensity} / 10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="w-full accent-indigo-600 bg-slate-100 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-semibold mt-1">
                  <span>Mild</span>
                  <span>Moderate</span>
                  <span>Intense</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-3">3. What is contributing to this mood?</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagClick(tag)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          active
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                        }`}
                      >
                        <span>{tag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">4. Personal notes or context (Optional)</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Had a difficult meeting, but feeling calmer after a 10-minute walk..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Saving check-in...</span>
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    <span>Log Mood Entry</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Col: Analytics & Trends */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 font-display text-base">Mood Dynamics</h3>
                  <p className="text-xs text-slate-500">Recent trajectory</p>
                </div>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setChartView('area')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${chartView === 'area' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'}`}
                  >
                    Area
                  </button>
                  <button
                    onClick={() => setChartView('bar')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${chartView === 'bar' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'}`}
                  >
                    Bar
                  </button>
                </div>
              </div>

              <div className="h-52 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  {chartView === 'area' ? (
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="moodAnalyticsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis domain={[1, 5]} ticks={[1, 3, 5]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }} />
                      <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#moodAnalyticsGrad)" />
                    </AreaChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis domain={[1, 5]} ticks={[1, 3, 5]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }} />
                      <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Log History */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm max-h-80 overflow-y-auto">
              <h3 className="font-bold text-slate-900 font-display text-base mb-4">Recent Check-ins</h3>
              {recentLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">No logs yet. Submit above to see history!</p>
              ) : (
                <div className="space-y-3">
                  {recentLogs.slice(0, 8).map((log) => (
                    <div key={log.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {moodScales.find((m) => m.score === log.moodScore)?.icon || '😐'}
                        </span>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900">
                            {moodScales.find((m) => m.score === log.moodScore)?.label} ({log.moodScore}/5)
                          </h4>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {log.tags.map((t) => (
                              <span key={t} className="text-[10px] font-semibold px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md">
                                {t}
                              </span>
                            ))}
                          </div>
                          {log.notes && <p className="text-[11px] text-slate-600 mt-1 italic">&quot;{log.notes}&quot;</p>}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                        {new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppSidebar>
  );
}
