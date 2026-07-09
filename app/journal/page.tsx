'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Plus,
  Search,
  Tag,
  Trash2,
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  Lock,
  Calendar,
  Smile,
  X
} from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { getJournalEntries, saveJournalEntry, deleteJournalEntry, JournalEntryData } from '@/lib/firestore-service';

const moodTags = ['Hopeful', 'Calm', 'Reflective', 'Anxious', 'Processing', 'Overwhelmed', 'Grateful'];

export default function JournalPage() {
  const { user, isLoading: authLoading } = useAuthStore();
  const [entries, setEntries] = useState<JournalEntryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // New entry modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [moodTag, setMoodTag] = useState('Reflective');
  const [customTagInput, setCustomTagInput] = useState('');
  const [customTags, setCustomTags] = useState<string[]>(['Mindfulness']);
  const [isSaving, setIsSaving] = useState(false);

  const loadEntries = React.useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const data = await getJournalEntries(user.id);
    setEntries(data);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    let active = true;
    if (user?.id) {
      const timer = setTimeout(() => {
        if (active) loadEntries();
      }, 0);
      return () => { active = false; clearTimeout(timer); };
    } else if (!authLoading) {
      const timer = setTimeout(() => {
        if (active) setIsLoading(false);
      }, 0);
      return () => { active = false; clearTimeout(timer); };
    }
  }, [user, authLoading, loadEntries]);

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTagInput.trim()) {
      e.preventDefault();
      if (!customTags.includes(customTagInput.trim())) {
        setCustomTags([...customTags, customTagInput.trim()]);
      }
      setCustomTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setCustomTags(customTags.filter(t => t !== tag));
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !user?.id) return;

    setIsSaving(true);
    const id = await saveJournalEntry(user.id, {
      title,
      content,
      moodTag,
      customTags,
      isDraft: false
    });
    setIsSaving(false);

    const newEntry: JournalEntryData = {
      id,
      userId: user.id,
      title,
      content,
      moodTag,
      customTags,
      isDraft: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setEntries([newEntry, ...entries]);
    setShowModal(false);
    setTitle('');
    setContent('');
    setCustomTags(['Mindfulness']);
  };

  const handleDelete = async (id: string) => {
    await deleteJournalEntry(id);
    setEntries(entries.filter(e => e.id !== id));
  };

  const handleExportMd = (entry: JournalEntryData) => {
    const mdContent = `# ${entry.title}\n**Date:** ${new Date(entry.createdAt).toLocaleString()}\n**Mood:** ${entry.moodTag}\n**Tags:** ${entry.customTags.join(', ')}\n\n---\n\n${entry.content}`;
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entry.title.replace(/\s+/g, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredEntries = entries.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || e.moodTag === selectedTag || e.customTags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <AppSidebar>
      <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
              <BookOpen size={16} />
              <span>Private & Encrypted Space</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-900">Reflective Journal</h1>
            <p className="text-sm text-slate-500 mt-1">Express thoughts safely. Entries are private to you alone.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Plus size={18} />
            <span>New Journal Entry</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="relative w-full md:w-80">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search journals by title or content..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedTag === null ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              All Entries ({entries.length})
            </button>
            {moodTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedTag === tag ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Entries Grid */}
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={32} />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1 font-display">No journal entries found</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
              {searchQuery || selectedTag ? 'No entries match your search filters.' : 'Start writing to capture your thoughts, dreams, and reflections.'}
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white font-bold text-sm rounded-2xl shadow-md hover:bg-indigo-700 transition-all"
            >
              Write Your First Entry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEntries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200/80 hover:border-indigo-300 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-100 flex items-center gap-1">
                      <Smile size={13} />
                      <span>{entry.moodTag || 'Reflective'}</span>
                    </span>
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <Calendar size={13} />
                      <span>{new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-slate-900 font-display mb-2 group-hover:text-indigo-600 transition-colors">
                    {entry.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-4 whitespace-pre-wrap mb-4">
                    {entry.content}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {entry.customTags.map((t) => (
                      <span key={t} className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                    <Lock size={14} />
                    <span>Private to you</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExportMd(entry)}
                      title="Export as Markdown"
                      className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => entry.id && handleDelete(entry.id)}
                      title="Delete Entry"
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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
              className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white max-w-2xl w-full rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200 my-8"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                  <h2 className="text-xl font-bold font-display text-slate-900">New Journal Reflection</h2>
                  <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateEntry} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Title</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Today I realized something important..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Primary Mood Tag</label>
                      <select
                        value={moodTag}
                        onChange={(e) => setMoodTag(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                      >
                        {moodTags.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Custom Tags (Press Enter)</label>
                      <input
                        type="text"
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        onKeyDown={handleAddCustomTag}
                        placeholder="Type & press Enter to add..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                      />
                    </div>
                  </div>

                  {customTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {customTags.map(t => (
                        <span key={t} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5">
                          <span>#{t}</span>
                          <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-red-600">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Your Reflection</label>
                    <textarea
                      required
                      rows={8}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write freely and without judgment. Your words are completely secure..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-sans"
                    />
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
                      disabled={isSaving}
                      className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all"
                    >
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      <span>Save Entry</span>
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
