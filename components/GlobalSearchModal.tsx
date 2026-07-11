'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Search, FileText, MessageSquareHeart, ListTodo, ClipboardCheck, ArrowRight, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { getOrCreateAnonymousUUID } from '@/lib/identity-service';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  category: 'journal' | 'chat' | 'habit' | 'assessment';
  link: string;
  date?: string;
}

export default function GlobalSearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        setQuery('');
        setResults([]);
      }, 100);
    }
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const userId = user?.id || getOrCreateAnonymousUUID();

    try {
      const searchTerms = `%${val}%`;
      const matches: SearchResult[] = [];

      // 1. Search Journals
      const { data: journals } = await supabase
        .from('journals')
        .select('id, title, content, created_at')
        .ilike('title', searchTerms)
        .limit(5);

      if (journals) {
        journals.forEach(j => {
          matches.push({
            id: j.id,
            title: j.title,
            subtitle: j.content.slice(0, 70) + '...',
            category: 'journal',
            link: '/journal',
            date: j.created_at
          });
        });
      }

      // 2. Search Conversations
      const { data: convs } = await supabase
        .from('conversations')
        .select('id, title, created_at')
        .ilike('title', searchTerms)
        .limit(5);

      if (convs) {
        convs.forEach(c => {
          matches.push({
            id: c.id,
            title: c.title,
            subtitle: 'Previous chat session',
            category: 'chat',
            link: '/chat',
            date: c.created_at
          });
        });
      }

      // 3. Search Messages contents
      const { data: messages } = await supabase
        .from('messages')
        .select('id, conversation_id, content, created_at')
        .ilike('content', searchTerms)
        .limit(5);

      if (messages) {
        messages.forEach(m => {
          // Avoid duplicate chat entries if possible, label clearly
          matches.push({
            id: m.id,
            title: 'Text snippet matching in chat',
            subtitle: `"${m.content.slice(0, 60)}..."`,
            category: 'chat',
            link: '/chat',
            date: m.created_at
          });
        });
      }

      // 4. Search Habits
      const { data: habits } = await supabase
        .from('habits')
        .select('id, name, icon')
        .ilike('name', searchTerms)
        .limit(5);

      if (habits) {
        habits.forEach(h => {
          matches.push({
            id: h.id,
            title: `${h.icon || '🍃'} ${h.name}`,
            subtitle: 'Self-care Anchor Habit',
            category: 'habit',
            link: '/habits'
          });
        });
      }

      // 5. Search Assessments
      const { data: assessments } = await supabase
        .from('assessment_results')
        .select('id, type, severity, score, created_at')
        .ilike('severity', searchTerms)
        .limit(5);

      if (assessments) {
        assessments.forEach(a => {
          matches.push({
            id: a.id,
            title: `${a.type} Clinical Screener`,
            subtitle: `Severity level: ${a.severity} (Score: ${a.score})`,
            category: 'assessment',
            link: '/assessments',
            date: a.created_at
          });
        });
      }

      setResults(matches);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (link: string) => {
    onClose();
    router.push(link);
  };

  const getIcon = (cat: SearchResult['category']) => {
    if (cat === 'journal') return <FileText size={16} className="text-primary" />;
    if (cat === 'chat') return <MessageSquareHeart size={16} className="text-pink-500" />;
    if (cat === 'habit') return <ListTodo size={16} className="text-[#6B907B]" />;
    return <ClipboardCheck size={16} className="text-[#8D80A9]" />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 md:pt-28">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg bg-white dark:bg-[#1E2128] border border-slate-200/70 dark:border-[#2B2F38] rounded-2xl shadow-xl overflow-hidden relative z-10"
          >
            {/* Input Header */}
            <div className="p-4 border-b border-slate-100 dark:border-[#2B2F38] flex items-center gap-3">
              <Search className="text-slate-400 shrink-0" size={18} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search journals, chats, habits, and assessments..."
                className="w-full text-sm bg-transparent outline-none border-none text-slate-800 dark:text-white placeholder:text-slate-400"
              />
              {loading ? (
                <Loader2 size={16} className="animate-spin text-slate-400 shrink-0" />
              ) : (
                <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-[#252932] rounded-lg text-slate-400 hover:text-slate-600">
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-50 dark:divide-[#2B2F38]">
              {results.length > 0 ? (
                results.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => handleResultClick(res.link)}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-[#252932]/40 rounded-xl cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1 pr-4">
                      <div className="p-2 bg-slate-100/75 dark:bg-slate-800 rounded-lg mt-0.5 shrink-0">
                        {getIcon(res.category)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {res.title}
                        </h4>
                        {res.subtitle && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-normal">
                            {res.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] font-mono text-slate-400 capitalize bg-slate-50 dark:bg-[#16181D] px-2 py-0.5 border border-slate-200/50 dark:border-slate-800 rounded">
                        {res.category}
                      </span>
                      <ArrowRight size={13} className="text-slate-350 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))
              ) : query.trim() ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No matching results found for &quot;{query}&quot;.
                </div>
              ) : (
                <div className="py-10 text-center text-slate-400 text-xs font-normal">
                  Type to search across your Sanctuary items.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
