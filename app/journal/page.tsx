'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  X,
  Leaf,
  Edit2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import AppSidebar from '@/components/AppSidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { getJournalEntries, saveJournalEntry, updateJournalEntry, deleteJournalEntry, JournalEntryData } from '@/lib/db-service';
import { triggerGentleSanctuaryCelebration } from '@/components/SanctuaryConfetti';
import { useAmbientSoundStore } from '@/store/useAmbientSoundStore';

const moodTags = ['Hopeful', 'Calm', 'Reflective', 'Anxious', 'Processing', 'Overwhelmed', 'Grateful'];

export default function JournalPage() {
  const { user, isLoading: authLoading } = useAuthStore();
  const [entries, setEntries] = useState<JournalEntryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [moodTag, setMoodTag] = useState('Reflective');
  const [customTagInput, setCustomTagInput] = useState('');
  const [customTags, setCustomTags] = useState<string[]>(['Mindfulness']);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDraft, setIsDraft] = useState(true);
  const [autosaveState, setAutosaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

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

  useEffect(() => {
    useAmbientSoundStore.getState().triggerRecommendation('journal');
  }, []);

  const handleOpenModal = (entry?: JournalEntryData) => {
    if (entry && entry.id) {
      setEditingEntryId(entry.id);
      setTitle(entry.title);
      setContent(entry.content);
      setMoodTag(entry.moodTag || 'Reflective');
      setCustomTags(entry.customTags || []);
      setImageUrl(entry.imageUrl || '');
      setIsDraft(entry.isDraft ?? false);
    } else {
      setEditingEntryId(null);
      setTitle('');
      setContent('');
      setMoodTag('Reflective');
      setCustomTags(['Mindfulness']);
      setImageUrl('');
      setIsDraft(true);
    }
    setAutosaveState('idle');
    setShowModal(true);
  };

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        setImageUrl(data.url);
      } else {
        alert(data.error || 'Failed to upload image');
      }
    } catch (err) {
      alert('Upload failed. Check your connection.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !user?.id) return;

    setIsSaving(true);
    if (editingEntryId) {
      await updateJournalEntry(editingEntryId, {
        title,
        content,
        moodTag,
        customTags,
        imageUrl,
        isDraft: false
      });
      setEntries(entries.map(entry => entry.id === editingEntryId ? {
        ...entry,
        title,
        content,
        moodTag,
        customTags,
        imageUrl,
        isDraft: false,
        updatedAt: new Date().toISOString()
      } : entry));
    } else {
      const id = await saveJournalEntry(user.id, {
        title,
        content,
        moodTag,
        customTags,
        imageUrl,
        isDraft: false
      });
      const newEntry: JournalEntryData = {
        id,
        userId: user.id,
        title,
        content,
        moodTag,
        customTags,
        imageUrl,
        isDraft: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setEntries([newEntry, ...entries]);
    }
    setIsSaving(false);
    setShowModal(false);
    setEditingEntryId(null);
    setTitle('');
    setContent('');
    setImageUrl('');
    setCustomTags(['Mindfulness']);
    setAutosaveState('idle');
    triggerGentleSanctuaryCelebration('petals');
  };

  // Debounced Autosave draft logic
  const tagsKey = customTags.join(',');
  useEffect(() => {
    if (!showModal || !user?.id || !title.trim() || !content.trim() || !isDraft) {
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setAutosaveState('saving');
      const resolvedTags = tagsKey ? tagsKey.split(',') : [];
      try {
        if (editingEntryId) {
          await updateJournalEntry(editingEntryId, {
            title,
            content,
            moodTag,
            customTags: resolvedTags,
            imageUrl,
            isDraft: true
          });
          setEntries(current => current.map(e => e.id === editingEntryId ? {
            ...e,
            title,
            content,
            moodTag,
            customTags: resolvedTags,
            imageUrl,
            isDraft: true,
            updatedAt: new Date().toISOString()
          } : e));
        } else {
          const newId = await saveJournalEntry(user.id, {
            title,
            content,
            moodTag,
            customTags: resolvedTags,
            imageUrl,
            isDraft: true
          });
          setEditingEntryId(newId);
          const newEntry: JournalEntryData = {
            id: newId,
            userId: user.id,
            title,
            content,
            moodTag,
            customTags: resolvedTags,
            imageUrl,
            isDraft: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setEntries(current => [newEntry, ...current]);
        }
        setAutosaveState('saved');
      } catch (err) {
        setAutosaveState('error');
      }
    }, 2000);

    return () => clearTimeout(delayDebounce);
  }, [title, content, moodTag, tagsKey, imageUrl, showModal, user?.id, isDraft, editingEntryId]);

  const handleDelete = async (id: string) => {
    await deleteJournalEntry(id);
    setEntries(entries.filter(e => e.id !== id));
  };

  const handleExportMd = (entry: JournalEntryData) => {
    const mdContent = `# ${entry.title}\n**Date:** ${new Date(entry.createdAt).toLocaleString()}\n**Mood:** ${entry.moodTag}\n**Tags:** ${entry.customTags.join(', ')}\n${entry.imageUrl ? `**Image:** ${entry.imageUrl}\n` : ''}\n---\n\n${entry.content}`;
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entry.title.replace(/\s+/g, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportPdf = (entry: JournalEntryData) => {
    const doc = new jsPDF();
    
    // Set Header
    doc.setFontSize(22);
    doc.setTextColor(92, 131, 151); // primary color #5C8397
    doc.text(entry.title, 20, 30);
    
    // Metadata
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date: ${new Date(entry.createdAt).toLocaleString()}`, 20, 40);
    doc.text(`Mood: ${entry.moodTag || 'Reflective'}`, 20, 46);
    doc.text(`Tags: ${entry.customTags.join(', ')}`, 20, 52);
    
    // Horizontal rule
    doc.setLineWidth(0.5);
    doc.line(20, 56, 190, 56);
    
    // Body Text
    doc.setFontSize(12);
    doc.setTextColor(50);
    const splitText = doc.splitTextToSize(entry.content, 170);
    doc.text(splitText, 20, 66);
    
    doc.save(`${entry.title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  const filteredEntries = entries.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || e.moodTag === selectedTag || e.customTags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <AppSidebar>
      <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-6xl mx-auto bg-[#FAF9F6] dark:bg-[#16181D] min-h-screen transition-colors duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-[#2B2F38]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-blue text-[11px] py-0.5 px-2.5 font-mono flex items-center gap-1.5">
                <Lock size={12} /> Encrypted Private Space
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-slate-900 dark:text-slate-100">
              Reflective Journal
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Express your thoughts without pressure. Every entry belongs solely and securely to you.
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary px-5 py-2.5 text-xs flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus size={16} strokeWidth={1.75} />
            <span>New Journal Entry</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="card-minimal p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search journals by title or content..."
              className="input-minimal pl-10 py-2 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-normal transition-all shrink-0 ${
                selectedTag === null
                  ? 'bg-primary text-white shadow-2xs font-medium'
                  : 'bg-slate-100 dark:bg-[#16181D] border border-slate-200/70 dark:border-[#2B2F38] text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-[#252932]'
              }`}
            >
              All Entries ({entries.length})
            </button>
            {moodTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-normal transition-all shrink-0 ${
                  selectedTag === tag
                    ? 'bg-primary text-white shadow-2xs font-medium'
                    : 'bg-slate-100 dark:bg-[#16181D] border border-slate-200/70 dark:border-[#2B2F38] text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-[#252932]'
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
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="card-minimal text-center py-16">
            <div className="w-12 h-12 bg-primary-subtle dark:bg-primary/20 text-primary dark:text-[#A1C2D4] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <BookOpen size={22} strokeWidth={1.75} />
            </div>
            <h3 className="font-medium text-base text-slate-900 dark:text-slate-100 mb-1">No journal entries found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
              {searchQuery || selectedTag ? 'No entries match your search filters.' : 'Start writing to capture your thoughts, dreams, and quiet reflections.'}
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="btn-primary px-6 py-2.5 text-xs"
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
                className="card-minimal flex flex-col justify-between group hover:border-primary/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-primary-subtle dark:bg-primary/20 text-primary-hover dark:text-[#A1C2D4] text-[11px] font-medium rounded-lg border border-primary-light/40 dark:border-primary/40 flex items-center gap-1">
                        <Smile size={12} />
                        <span>{entry.moodTag || 'Reflective'}</span>
                      </span>
                      {entry.isDraft && (
                        <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-[10px] font-semibold rounded-md border border-amber-200 dark:border-amber-900/50">
                          Draft
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </span>
                  </div>

                  <h3 className="font-medium text-base text-slate-900 dark:text-slate-100 mb-2 group-hover:text-primary dark:group-hover:text-[#A1C2D4] transition-colors">
                    {entry.title}
                  </h3>

                  {entry.imageUrl && (
                    <div className="mb-3 overflow-hidden rounded-xl border border-slate-200/50 dark:border-[#2B2F38]">
                      <img src={entry.imageUrl} alt={entry.title} className="w-full h-40 object-cover" />
                    </div>
                  )}

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4 whitespace-pre-wrap mb-4 font-normal">
                    {entry.content}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {entry.customTags.map((t) => (
                      <span key={t} className="text-[11px] px-2 py-0.5 bg-slate-100 dark:bg-[#16181D] border border-slate-200/60 dark:border-[#2B2F38] text-slate-600 dark:text-slate-400 rounded-md font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/60 dark:border-[#2B2F38] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                    <Lock size={12} />
                    <span>Private to you</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(entry)}
                      title="Edit Reflection"
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252932] rounded-lg transition-colors"
                    >
                      <Edit2 size={15} strokeWidth={1.75} />
                    </button>
                    <button
                      onClick={() => handleExportMd(entry)}
                      title="Export as Markdown"
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252932] rounded-lg transition-colors"
                    >
                      <Download size={15} strokeWidth={1.75} />
                    </button>
                    <button
                      onClick={() => handleExportPdf(entry)}
                      title="Export as PDF"
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252932] rounded-lg transition-colors"
                    >
                      <FileText size={15} strokeWidth={1.75} />
                    </button>
                    <button
                      onClick={() => entry.id && handleDelete(entry.id)}
                      title="Delete Entry"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* New/Edit Reflection Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.96, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.96, y: 16 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-[#1E2128] border border-slate-200/80 dark:border-[#2B2F38] max-w-2xl w-full rounded-2xl p-6 sm:p-8 shadow-xl my-8"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-[#2B2F38] mb-5">
                  <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Leaf size={18} className="text-[#6B907B] dark:text-[#A8C8B5]" />
                    <span>{editingEntryId ? 'Edit Journal Reflection' : 'New Journal Reflection'}</span>
                  </h2>
                  <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
                    <X size={18} strokeWidth={1.75} />
                  </button>
                </div>

                <form onSubmit={handleSaveEntry} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Reflection Title</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Today I realized something important..."
                      className="input-minimal text-xs py-2.5"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Primary Mood Tag</label>
                      <select
                        value={moodTag}
                        onChange={(e) => setMoodTag(e.target.value)}
                        className="input-minimal text-xs py-2.5"
                      >
                        {moodTags.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Custom Tags (Press Enter)</label>
                      <input
                        type="text"
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        onKeyDown={handleAddCustomTag}
                        placeholder="Type & press Enter to add..."
                        className="input-minimal text-xs py-2.5"
                      />
                    </div>
                  </div>

                  {customTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {customTags.map(t => (
                        <span key={t} className="px-2.5 py-1 bg-primary-subtle dark:bg-primary/20 text-primary-hover dark:text-[#A1C2D4] border border-primary-light/40 dark:border-primary/40 rounded-lg text-[11px] font-mono flex items-center gap-1.5">
                          <span>#{t}</span>
                          <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-rose-600">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Image Attachment Upload */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Image Attachment</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="journal-image-file"
                      />
                      <label
                        htmlFor="journal-image-file"
                        className="btn-secondary px-4 py-2 text-xs cursor-pointer flex items-center gap-1.5"
                      >
                        {isUploading ? <Loader2 size={13} className="animate-spin text-primary" /> : <Tag size={13} />}
                        <span>{imageUrl ? 'Change Image' : 'Add Image'}</span>
                      </label>
                      {imageUrl && (
                        <div className="flex items-center gap-2">
                          <img src={imageUrl} alt="Attachment" className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-[#2B2F38]" />
                          <button
                            type="button"
                            onClick={() => setImageUrl('')}
                            className="text-xs text-rose-500 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Your Reflection</label>
                    <textarea
                      required
                      rows={5}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write freely without judgment. Your words are private..."
                      className="input-minimal text-xs resize-none py-3"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/60 dark:border-[#2B2F38]">
                    <div className="flex items-center gap-2 mr-auto text-xs text-slate-400">
                      {autosaveState === 'saving' && <span className="flex items-center gap-1"><Loader2 size={12} className="animate-spin text-primary" /> Saving draft...</span>}
                      {autosaveState === 'saved' && <span className="text-[#6B907B] font-medium">✓ Draft autosaved</span>}
                      {autosaveState === 'error' && <span className="text-rose-500">⚠ Autosave failed</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="btn-secondary px-5 py-2 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="btn-primary px-6 py-2 text-xs flex items-center gap-1.5"
                    >
                      {isSaving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                      <span>{editingEntryId ? 'Update Reflection' : 'Save Reflection'}</span>
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
