'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  AlertCircle
} from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { useHabitStore } from '@/store/useHabitStore';

const iconsList = ['🚶‍♂️', '🧘', '📓', '💧', '🥗', '😴', '💊', '🎨', '📖', '🏃‍♀️'];
const colorsList = ['#10b981', '#6366f1', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function HabitsTrackerPage() {
  const { user, isLoading: authLoading } = useAuthStore();
  const { habits, fetchHabits, createHabit, deleteHabit, toggleCompletion, isLoading } = useHabitStore();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🧘');
  const [frequency, setFrequency] = useState('DAILY');
  const [color, setColor] = useState('#10b981');
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
    }
  };

  return (
    <AppSidebar>
      <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
              <ListTodo size={16} />
              <span>Routine & Behavioral Architecture</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-900">Habits & Daily Routines</h1>
            <p className="text-sm text-slate-500 mt-1">Consistency builds neuroplasticity. Track daily micro-habits for inner stability.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Plus size={18} />
            <span>Create New Habit</span>
          </button>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : habits.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ListTodo size={32} />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1 font-display">No habits created yet</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
              Start building your daily self-care routine with simple 5-minute activities like walking, journaling, or deep breathing.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white font-bold text-sm rounded-2xl shadow-md hover:bg-indigo-700 transition-all"
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
                className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                  habit.completedToday
                    ? 'bg-emerald-50/70 border-emerald-200 shadow-sm'
                    : 'bg-white border-slate-200/80 hover:border-indigo-300 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-2xs">
                      {habit.icon}
                    </span>
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      title="Delete Habit"
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <h3 className={`font-bold text-lg font-display mb-1 ${habit.completedToday ? 'line-through text-emerald-900' : 'text-slate-900'}`}>
                    {habit.name}
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    {habit.frequency}
                  </span>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 text-xs">
                    <Flame size={14} fill="currentColor" />
                    <span>{habit.streak || 0}d Streak</span>
                  </div>

                  <button
                    onClick={() => toggleCompletion(habit.id)}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 ${
                      habit.completedToday
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-900 hover:bg-indigo-600 text-white shadow-sm'
                    }`}
                  >
                    <CheckCircle2 size={14} />
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
              className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white max-w-md w-full rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                  <h2 className="text-xl font-bold font-display text-slate-900">Create Daily Habit</h2>
                  <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Habit Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. 15-minute mindful walk in nature"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Choose Icon Emoji</label>
                    <div className="flex flex-wrap gap-2">
                      {iconsList.map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => setIcon(ic)}
                          className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center border transition-all ${
                            icon === ic ? 'bg-indigo-600 text-white border-indigo-600 scale-105 shadow-md' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Frequency</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                    >
                      <option value="DAILY">Daily Routine</option>
                      <option value="WEEKDAY">Weekdays Only</option>
                      <option value="WEEKEND">Weekends Only</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all"
                    >
                      {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
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
