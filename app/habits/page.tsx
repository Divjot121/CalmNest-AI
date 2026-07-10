'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ListTodo,
  Plus,
  CheckCircle2,
  Trash2,
  Flame,
  Calendar,
  Sparkles,
  Loader2,
  X,
  AlertCircle,
  Leaf
} from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { useHabitStore } from '@/store/useHabitStore';
import { triggerGentleSanctuaryCelebration } from '@/components/SanctuaryConfetti';

const iconsList = ['🚶‍♂️', '🧘', '📓', '💧', '🥗', '😴', '💊', '🎨', '📖', '🏃‍♀️'];
const colorsList = ['#6B907B', '#5C8397', '#8D80A9', '#D9986A', '#A88C8C', '#6FA4AD'];

export default function HabitsTrackerPage() {
  const { user, isLoading: authLoading } = useAuthStore();
  const { habits, fetchHabits, createHabit, deleteHabit, toggleCompletion, isLoading } = useHabitStore();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🧘');
  const [frequency, setFrequency] = useState('DAILY');
  const [color, setColor] = useState('#6B907B');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      fetchHabits();
    }
  }, [authLoading, fetchHabits]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    const ok = await createHabit(name.trim(), icon, frequency, color);
    setIsSubmitting(false);
    if (ok) {
      setName('');
      setShowModal(false);
      triggerGentleSanctuaryCelebration('petals');
    }
  };

  const handleToggle = async (id: string) => {
    await toggleCompletion(id);
    const updated = habits.find(h => h.id === id);
    if (!updated?.completedToday) {
      triggerGentleSanctuaryCelebration('petals');
    }
  };

  return (
    <AppSidebar>
      <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-6xl mx-auto bg-[#FAF9F6] dark:bg-[#16181D] min-h-screen transition-colors duration-300 select-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-[#2B2F38]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-emerald text-[11px] py-0.5 px-2.5 font-mono flex items-center gap-1.5">
                <Leaf size={12} /> Routine & Anchors
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-slate-900 dark:text-slate-100">
              Mindful Habits & Routines
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Consistency builds calm resilience. Track daily micro-habits to anchor your nervous system.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary px-5 py-2.5 text-xs flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus size={16} strokeWidth={1.75} />
            <span>New Daily Habit</span>
          </button>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-[#5C8397]" size={28} />
          </div>
        ) : habits.length === 0 ? (
          <div className="card-minimal text-center py-16">
            <div className="w-12 h-12 bg-[#E6EFEA] dark:bg-[#6B907B]/20 text-[#6B907B] dark:text-[#A8C8B5] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <ListTodo size={22} strokeWidth={1.75} />
            </div>
            <h3 className="font-medium text-base text-slate-900 dark:text-slate-100 mb-1">No habits created yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
              Start building your gentle self-care routine with simple 5-minute activities like short walks, gratitude, or deep breathing.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary px-6 py-2.5 text-xs"
            >
              Create Your First Habit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map((habit) => (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`card-minimal flex flex-col justify-between transition-all duration-200 ${
                  habit.completedToday
                    ? 'bg-[#F2F8F5] dark:bg-[#1A2520] border-[#6B907B]/40 dark:border-[#6B907B]/40'
                    : 'hover:border-[#5C8397]/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl p-3 bg-white dark:bg-[#1E2128] rounded-xl border border-slate-200/70 dark:border-[#2B2F38] shadow-2xs">
                      {habit.icon || '🍃'}
                    </span>
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      title="Delete Habit"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} strokeWidth={1.75} />
                    </button>
                  </div>

                  <h3 className={`font-medium text-base mb-1 ${habit.completedToday ? 'line-through text-[#4A725D] dark:text-[#A8C8B5]' : 'text-slate-900 dark:text-slate-100'}`}>
                    {habit.name}
                  </h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {habit.frequency}
                  </span>
                </div>

                <div className="pt-4 mt-5 border-t border-slate-200/60 dark:border-[#2B2F38] flex items-center justify-between">
                  <div className="flex items-center gap-1 font-mono text-amber-600 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-800 text-[11px]">
                    <Flame size={13} fill="currentColor" />
                    <span>{habit.streak || 0}d Streak</span>
                  </div>

                  <button
                    onClick={() => handleToggle(habit.id)}
                    className={`px-3.5 py-1.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all ${
                      habit.completedToday
                        ? 'bg-[#6B907B] text-white shadow-2xs'
                        : 'bg-slate-800 dark:bg-slate-700 hover:bg-[#5C8397] text-white shadow-2xs'
                    }`}
                  >
                    <CheckCircle2 size={14} strokeWidth={1.75} />
                    <span>{habit.completedToday ? 'Completed' : 'Check Off'}</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.96, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.96, y: 16 }}
                className="bg-white dark:bg-[#1E2128] border border-slate-200/80 dark:border-[#2B2F38] max-w-md w-full rounded-2xl p-6 sm:p-8 shadow-xl"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-[#2B2F38] mb-5">
                  <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Leaf size={18} className="text-[#6B907B] dark:text-[#A8C8B5]" />
                    <span>Create Daily Habit</span>
                  </h2>
                  <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
                    <X size={18} strokeWidth={1.75} />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Habit Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. 15-minute mindful walk in nature"
                      className="input-minimal text-xs py-2.5"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Choose Icon Emoji</label>
                    <div className="flex flex-wrap gap-2">
                      {iconsList.map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => setIcon(ic)}
                          className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center border transition-all ${
                            icon === ic ? 'bg-[#5C8397] text-white border-[#5C8397] scale-105 shadow-2xs' : 'bg-slate-50 dark:bg-[#16181D] border-slate-200/70 dark:border-[#2B2F38] hover:bg-slate-100 dark:hover:bg-[#252932]'
                          }`}
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Frequency</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="input-minimal text-xs py-2.5"
                    >
                      <option value="DAILY">Daily Routine</option>
                      <option value="WEEKDAY">Weekdays Only</option>
                      <option value="WEEKEND">Weekends Only</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/60 dark:border-[#2B2F38]">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="btn-secondary px-5 py-2 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary px-6 py-2 text-xs flex items-center gap-1.5"
                    >
                      {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                      <span>Create Habit</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppSidebar>
  );
}
