'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  User,
  AlertTriangle,
  X,
  Send,
  Loader2,
  Trash2,
  Edit2,
  Plus,
  Search,
  Download,
  Copy,
  RotateCcw,
  StopCircle,
  Menu,
  HeartPulse,
  CornerDownLeft,
  Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useSanctuaryTranslation } from '@/lib/i18n/useSanctuaryTranslation';
import { triggerGentleSanctuaryCelebration } from '@/components/SanctuaryConfetti';
import { getOrCreateAnonymousUUID } from '@/lib/identity-service';
import { queueOfflineWrite } from '@/lib/offline-sync-queue';
import {
  getConversations,
  createConversation,
  renameConversation,
  deleteConversation,
  ConversationItem
} from '@/lib/db-service';

interface Message {
  id: string;
  text: string;
  senderType: 'user' | 'ai';
  sentiment?: string;
  createdAt: string;
}

const generateMessageId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

const quickActions = [
  { id: 'anxious', labelKey: 'chat.quickActions.anxious', prompt: "I feel anxious right now and could use some gentle guidance to ground myself.", icon: '🍃' },
  { id: 'winddown', labelKey: 'chat.quickActions.winddown', prompt: "Help me wind down for sleep. My mind is racing with thoughts.", icon: '🌙' },
  { id: 'journalPrompt', labelKey: 'chat.quickActions.journalPrompt', prompt: "Can you provide a gentle journal prompt to reflect on my feelings?", icon: '✍️' },
  { id: 'mindfulWalk', labelKey: 'chat.quickActions.mindfulWalk', prompt: "How do I practice a mindful sensory check-in while walking?", icon: '🚶' }
];

export default function ChatInterface() {
  const accumulatedTextRef = useRef("");
  const sentimentValueRef = useRef("neutral");
  const router = useRouter();
  const { t, currentLanguage } = useSanctuaryTranslation();
  const { user } = useAuthStore();
  const { preferences } = useSettingsStore();

  // Navigation / Layout state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Database Sessions state
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [sidebarSearch, setSidebarSearch] = useState('');

  // Messages state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // References
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Syncing layout settings
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch initial conversations list
  const loadConversations = async (userId: string) => {
    try {
      const list = await getConversations(userId);
      
      if (list.length > 0) {
        setConversations(list);
        setSelectedConversationId(list[0].id);
      } else {
        const newId = await createConversation(userId, 'Sanctuary Session');
        const newList = await getConversations(userId);
        if (newId.startsWith('local_') || !newList.some(c => c.id === newId)) {
          const localItem = {
            id: newId,
            userId,
            title: 'Sanctuary Session',
            riskDetected: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          const mergedList = [localItem, ...newList];
          setConversations(mergedList);
        } else {
          setConversations(newList);
        }
        setSelectedConversationId(newId);
      }
    } catch (e) {
      console.error('Error loading conversations:', e);
    }
  };

  useEffect(() => {
    const userId = user?.id || getOrCreateAnonymousUUID();
    setTimeout(() => {
      loadConversations(userId);
    }, 0);
  }, [user]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversationId) {
      setTimeout(() => setMessages([]), 0);
      return;
    }

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', selectedConversationId)
          .order('created_at', { ascending: true })
          .limit(100);

        if (!error && data) {
          const mapped: Message[] = data.map((m: any) => ({
            id: m.id,
            text: m.content,
            senderType: m.role === 'user' ? 'user' : 'ai',
            sentiment: m.sentiment || undefined,
            createdAt: m.created_at || new Date().toISOString()
          }));
          setMessages(mapped);
          try {
            window.localStorage.setItem(`calmnest_messages_${selectedConversationId}`, JSON.stringify(mapped));
          } catch (e) {}
          setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } else {
          const cached = window.localStorage.getItem(`calmnest_messages_${selectedConversationId}`);
          if (cached) {
            setMessages(JSON.parse(cached));
          } else {
            setMessages([]);
          }
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
        const cached = window.localStorage.getItem(`calmnest_messages_${selectedConversationId}`);
        if (cached) {
          setMessages(JSON.parse(cached));
        } else {
          setMessages([]);
        }
      }
    };

    fetchMessages();
  }, [selectedConversationId]);

  // Scroll to bottom helper
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isScrolledUp = target.scrollHeight - target.scrollTop - target.clientHeight > 240;
    setShowScrollBottom(isScrolledUp);
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getEffectiveUserId = (): string => {
    return user?.id || getOrCreateAnonymousUUID();
  };

  // Create new session
  const handleNewSession = async () => {
    const userId = getEffectiveUserId();
    setIsLoading(true);
    try {
      const newId = await createConversation(userId, `Session #${Date.now().toString().slice(-4)}`);
      const list = await getConversations(userId);
      setConversations(list);
      setSelectedConversationId(newId);
      setMessages([]);
      setShowQuickActions(true);
      setCrisisDetected(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Rename Session
  const handleRenameSession = async (convId: string) => {
    if (!editingTitle.trim()) return;
    try {
      await renameConversation(convId, editingTitle.trim());
      const userId = getEffectiveUserId();
      const list = await getConversations(userId);
      setConversations(list);
      setEditingConvId(null);
    } catch (e) {}
  };

  // Delete Session
  const handleDeleteSession = async (convId: string) => {
    if (confirm('Delete this conversation? All message logs will be permanently removed.')) {
      try {
        await deleteConversation(convId);
        const userId = getEffectiveUserId();
        const list = await getConversations(userId);
        setConversations(list);
        if (selectedConversationId === convId) {
          if (list.length > 0) {
            setSelectedConversationId(list[0].id);
          } else {
            handleNewSession();
          }
        }
      } catch (e) {}
    }
  };

  // Copy Message to Clipboard
  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMsgId(id);
      setTimeout(() => setCopiedMsgId(null), 2000);
    });
  };

  // Export session
  const handleExportSession = (format: 'txt' | 'json') => {
    if (messages.length === 0) return;
    let dataStr = "";
    let mimeType = "text/plain";
    let extension = "txt";

    if (format === 'json') {
      dataStr = JSON.stringify(messages, null, 2);
      mimeType = "application/json";
      extension = "json";
    } else {
      dataStr = messages.map(m => `[${m.senderType === 'user' ? 'USER' : 'CALMNEST AI'} - ${new Date(m.createdAt).toLocaleTimeString()}]\n${m.text}\n\n`).join("");
    }

    const blob = new Blob([dataStr], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calmnest_session_${selectedConversationId?.slice(0, 8)}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Send message streaming response
  const sendMessageWithPrompt = async (promptText: string, isRetry = false) => {
    if (!promptText.trim() || !selectedConversationId) return;

    // Abort previous stream if active
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setIsTyping(true);

    const userMsgId = generateMessageId('user');
    const aiMsgId = generateMessageId('ai');

    const newUserMsg: Message = {
      id: userMsgId,
      text: promptText,
      senderType: 'user',
      createdAt: new Date().toISOString()
    };

    const newAiPlaceholderMsg: Message = {
      id: aiMsgId,
      text: "",
      senderType: 'ai',
      createdAt: new Date().toISOString()
    };

    // If not a retry, insert user message first
    if (!isRetry) {
      setMessages(prev => {
        const updated = [...prev, newUserMsg, newAiPlaceholderMsg];
        try {
          window.localStorage.setItem(`calmnest_messages_${selectedConversationId}`, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
      const userPayload = {
        conversation_id: selectedConversationId,
        role: 'user',
        content: promptText,
        created_at: new Date().toISOString()
      };
      try {
        const { error } = await supabase.from('messages').insert(userPayload);
        if (error) {
          queueOfflineWrite('messages', 'insert', userPayload);
        }
      } catch (e) {
        queueOfflineWrite('messages', 'insert', userPayload);
      }
    } else {
      setMessages(prev => [...prev, newAiPlaceholderMsg]);
    }

    setShowQuickActions(false);

    try {
      // Build history payload for API
      const historyPayload = messages.slice(-10).map(m => ({
        role: m.senderType === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversationId,
          message: promptText,
          history: historyPayload,
          language: preferences.aiPreferredLanguage && preferences.aiPreferredLanguage !== 'auto' ? preferences.aiPreferredLanguage : currentLanguage,
          voiceStyle: preferences.aiVoiceOrStyle || 'warm',
          aiPersonality: preferences.aiPersonality || 'counselor',
          aiResponseLength: preferences.aiResponseLength || 'medium',
          aiEmpathyLevel: preferences.aiEmpathyLevel || 'high',
          aiMemoryEnabled: preferences.aiMemoryEnabled !== false
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.body) throw new Error('Readable stream not supported.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      accumulatedTextRef.current = "";
      sentimentValueRef.current = "neutral";

      setIsTyping(false);

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) continue;
                const parsed = JSON.parse(jsonStr);
                
                if (parsed.error) {
                  accumulatedTextRef.current = parsed.error;
                  break;
                }

                if (parsed.done) {
                  if (parsed.isCrisis) {
                    setCrisisDetected(true);
                  }
                  done = true;
                } else if (parsed.text) {
                  accumulatedTextRef.current += parsed.text;
                  sentimentValueRef.current = parsed.sentiment || sentimentValueRef.current;

                  // Update UI message only if streaming is enabled
                  if (preferences.aiStreamingEnabled !== false) {
                    setMessages(prev => {
                      const list = [...prev];
                      const idx = list.findIndex(m => m.id === aiMsgId);
                      if (idx !== -1) {
                        list[idx] = { ...list[idx], text: accumulatedTextRef.current, sentiment: sentimentValueRef.current };
                      }
                      try {
                        window.localStorage.setItem(`calmnest_messages_${selectedConversationId}`, JSON.stringify(list));
                      } catch (e) {}
                      return list;
                    });
                  }
                }
              } catch (e) {}
            }
          }
        }
      }

      // If streaming was disabled, update the UI message with the full accumulated text now
      if (preferences.aiStreamingEnabled === false) {
        setMessages(prev => {
          const list = [...prev];
          const idx = list.findIndex(m => m.id === aiMsgId);
          if (idx !== -1) {
            list[idx] = { ...list[idx], text: accumulatedTextRef.current, sentiment: sentimentValueRef.current };
          }
          return list;
        });
      }

      // Sync AI message back to supabase once finished
      const aiPayload = {
        conversation_id: selectedConversationId,
        role: 'assistant',
        content: accumulatedTextRef.current,
        sentiment: sentimentValueRef.current,
        created_at: new Date().toISOString()
      };
      try {
        const { error } = await supabase.from('messages').insert(aiPayload);
        if (error) {
          queueOfflineWrite('messages', 'insert', aiPayload);
        }

        // Trigger subtle celebration sound or pulse
        if (preferences.ambientAutoResume) {
          // Play lightweight tone if custom sound store handles it
        }
      } catch (dbErr) {
        queueOfflineWrite('messages', 'insert', aiPayload);
      }

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Chat error:", err);
        setMessages(prev => {
          const list = [...prev];
          const idx = list.findIndex(m => m.id === aiMsgId);
          if (idx !== -1) {
            list[idx] = { ...list[idx], text: "I'm right here. Let's take a slow, gentle breath together. (Connection issues, please check your network)." };
          }
          return list;
        });
      }
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const getSuggestedFollowUpQuestions = () => {
    if (messages.length === 0) return [];
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.senderType !== 'ai') return [];
    
    // Check sentiment of last message to suggest relevant follow ups
    const text = lastMsg.text.toLowerCase();
    if (text.includes('breath') || text.includes('breathing') || text.includes('साँस') || text.includes('ਸਾਹ')) {
      return [
        "Let's practice a 4-7-8 breathing exercise together",
        "How does breathing help calm the nervous system?",
        "Can we try a simpler box breathing instead?"
      ];
    }
    if (text.includes('anxious') || text.includes('anxiety') || text.includes('चिंता') || text.includes('ਘਬਰਾਹਟ')) {
      return [
        "What are some sensory grounding techniques?",
        "Help me write a journal entry to release this",
        "Could you guide me through a body scan?"
      ];
    }
    if (text.includes('sleep') || text.includes('night') || text.includes('नींद') || text.includes('ਨੀਂਦ')) {
      return [
        "What is a good sleep hygiene routine?",
        "Play the gentle rain soundscape for me",
        "Tell me a calming mindful story for bedtime"
      ];
    }
    // Default helpful wellness check suggestions
    return [
      "Can you give me a gentle mindfulness exercise?",
      "Let's write a journal reflection together",
      "I'd like to check my streak progress"
    ];
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    setInputText('');
    sendMessageWithPrompt(text);
  };

  const handleRetryResponse = () => {
    if (messages.length < 2) return;
    const lastUserMsg = [...messages].reverse().find(m => m.senderType === 'user');
    if (lastUserMsg) {
      sendMessageWithPrompt(lastUserMsg.text, true);
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Custom parser to format markdown (headings, bold, italics, lists, inline code, code blocks, blockquotes) nicely
  const formatText = (text: string) => {
    if (!text) return "";

    // 1. Detect code blocks first to render them cleanly
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      parts.push({ type: 'code', language: match[1] || 'code', content: match[2].trim() });
      lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }

    // Helper to format line-level elements like lists, headers, bold, italics, inline code
    const formatParagraphText = (paraText: string, blockKey: string) => {
      // Handle Headers
      if (paraText.startsWith('### ')) {
        return <h4 key={blockKey} className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1">{formatInline(paraText.slice(4))}</h4>;
      }
      if (paraText.startsWith('## ')) {
        return <h3 key={blockKey} className="text-sm sm:text-md font-bold text-slate-900 dark:text-white mt-4 mb-1.5">{formatInline(paraText.slice(3))}</h3>;
      }
      if (paraText.startsWith('# ')) {
        return <h2 key={blockKey} className="text-md sm:text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">{formatInline(paraText.slice(2))}</h2>;
      }

      // Handle Blockquotes
      if (paraText.startsWith('> ')) {
        return (
          <blockquote key={blockKey} className="border-l-3 border-[#6B907B] pl-3 italic text-slate-500 dark:text-slate-400 my-2 text-xs leading-relaxed">
            {formatInline(paraText.slice(2))}
          </blockquote>
        );
      }

      // Handle Bullet Lists
      if (paraText.startsWith('- ') || paraText.startsWith('* ')) {
        return (
          <li key={blockKey} className="list-disc ml-4 mt-1 text-slate-800 dark:text-slate-200">
            {formatInline(paraText.slice(2))}
          </li>
        );
      }

      // Handle Numbered Lists
      const numMatch = paraText.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        return (
          <li key={blockKey} className="list-decimal ml-4 mt-1 text-slate-800 dark:text-slate-200" value={parseInt(numMatch[1])}>
            {formatInline(numMatch[2])}
          </li>
        );
      }

      // Default paragraph
      return (
        <p key={blockKey} className="mb-2 last:mb-0 text-slate-800 dark:text-slate-200">
          {formatInline(paraText)}
        </p>
      );
    };

    // Helper to format bold, italics, inline code, and links within a line
    const formatInline = (str: string) => {
      // split by inline code blocks first `code`
      const codeParts = str.split(/`([^`]+)`/g);
      return codeParts.map((codePart, i) => {
        if (i % 2 === 1) {
          return (
            <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-rose-500 dark:text-rose-400">
              {codePart}
            </code>
          );
        }

        // formatting bold and italics inside the text part
        const boldParts = codePart.split(/\*\*([^*]+)\*\*/g);
        return boldParts.map((boldPart, j) => {
          if (j % 2 === 1) {
            return <strong key={j} className="font-semibold text-slate-900 dark:text-white">{boldPart}</strong>;
          }

          const italicParts = boldPart.split(/\*([^*]+)\*/g);
          return italicParts.map((italicPart, k) => {
            if (k % 2 === 1) {
              return <em key={k} className="italic text-slate-850 dark:text-slate-150">{italicPart}</em>;
            }
            return italicPart;
          });
        });
      });
    };

    return parts.map((part, index) => {
      if (part.type === 'code') {
        return (
          <div key={index} className="my-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-200 overflow-hidden shadow-xs">
            <div className="flex justify-between items-center px-4 py-2 bg-slate-900 text-[10px] text-slate-400 font-mono select-none border-b border-white/5">
              <span>{part.language.toUpperCase()}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(part.content);
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Copy
              </button>
            </div>
            <pre className="p-4 overflow-x-auto font-mono text-[11px] leading-relaxed text-slate-350 no-scrollbar select-text">
              <code>{part.content}</code>
            </pre>
          </div>
        );
      }

      return (
        <div key={index} className="space-y-0.5">
          {part.content.split('\n').map((line, lineIdx) => 
            formatParagraphText(line, `${index}-${lineIdx}`)
          )}
        </div>
      );
    });
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#FAF9F6] dark:bg-[#16181D] text-slate-800 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">
      
      {/* Side Panel for Conversations */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="h-full bg-white dark:bg-[#1E2128] border-r border-slate-200/70 dark:border-[#2B2F38] flex flex-col z-30 shrink-0"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-100 dark:border-[#2B2F38] flex items-center justify-between shrink-0">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">Sessions</span>
              <button
                onClick={handleNewSession}
                className="p-1.5 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-2xs transition-colors flex items-center gap-1 text-[11px] font-medium"
                title="New chat session"
              >
                <Plus size={14} />
                <span>New</span>
              </button>
            </div>

            {/* Sidebar Search */}
            <div className="p-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="w-full bg-[#FAF9F6] dark:bg-[#16181D] border border-slate-200 dark:border-[#2B2F38] rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
              {filteredConversations.map((conv) => {
                const isSelected = selectedConversationId === conv.id;
                const isEditing = editingConvId === conv.id;

                return (
                  <div
                    key={conv.id}
                    className={`group relative flex items-center justify-between p-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-primary/15 text-primary dark:text-[#A1C2D4]' 
                        : 'hover:bg-slate-50 dark:hover:bg-[#252932] text-slate-600 dark:text-slate-300'
                    }`}
                    onClick={() => {
                      if (!isEditing) setSelectedConversationId(conv.id);
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0 pr-6">
                      <HeartPulse size={14} className={isSelected ? 'text-primary' : 'text-slate-400'} />
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => handleRenameSession(conv.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSession(conv.id);
                          }}
                          className="w-full bg-white dark:bg-[#16181D] border border-slate-300 rounded px-1 text-xs text-slate-900 dark:text-white"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="truncate">{conv.title}</span>
                      )}
                    </div>

                    {/* Actions */}
                    {!isEditing && (
                      <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingConvId(conv.id);
                            setEditingTitle(conv.title);
                          }}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded"
                          title="Rename"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(conv.id);
                          }}
                          className="p-1 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950 rounded text-slate-500"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-[#2B2F38] flex items-center justify-between text-[11px] text-slate-400 shrink-0">
              <span>{conversations.length} Active Sessions</span>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Conversation Window */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        {/* Chat Header */}
        <header className="h-16 px-4 md:px-6 bg-white/90 dark:bg-[#1E2128]/90 backdrop-blur-md border-b border-slate-200/70 dark:border-[#2B2F38] flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#252932] rounded-xl transition-colors"
              title="Toggle sessions list"
            >
              <Menu size={18} />
            </button>

            <button 
              onClick={() => router.push('/dashboard')}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#252932] rounded-xl transition-colors flex items-center gap-1 text-xs font-medium"
              aria-label="Back to dashboard"
            >
              <ChevronLeft size={18} />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            
            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <span className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate max-w-[150px]">
              {conversations.find(c => c.id === selectedConversationId)?.title || 'AI Therapist'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Export Menu */}
            {messages.length > 0 && (
              <div className="flex items-center bg-slate-100 dark:bg-[#252932] p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => handleExportSession('txt')}
                  className="px-2.5 py-1 text-[10px] text-slate-600 dark:text-slate-300 font-semibold rounded hover:bg-white dark:hover:bg-[#1E2128]"
                  title="Export to Text"
                >
                  TXT
                </button>
                <button
                  onClick={() => handleExportSession('json')}
                  className="px-2.5 py-1 text-[10px] text-slate-600 dark:text-slate-300 font-semibold rounded hover:bg-white dark:hover:bg-[#1E2128]"
                  title="Export to JSON"
                >
                  JSON
                </button>
              </div>
            )}
            
            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-[#4A725D] dark:text-[#A8C8B5] border border-emerald-100 dark:border-[#6B907B]/40 text-[10px] font-mono rounded-full">
              Encrypted
            </span>
          </div>
        </header>

        {/* Message History Container */}
        <main
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-[#FAF9F6] dark:bg-[#16181D] relative"
        >
          {messages.length === 0 && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto space-y-6 py-12 px-4"
            >
              <div className="text-center space-y-3">
                <div className="w-14 h-14 bg-primary/10 dark:bg-primary/20 text-primary dark:text-[#A1C2D4] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <Sparkles size={28} strokeWidth={1.5} className="animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {t('welcome.title') || 'Your Safe Space Begins Here'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                  {t('emptyStates.journal') || 'An anonymous sanctuary without urgency, noise, or judgment. Breathe in deeply and express whatever is on your mind.'}
                </p>
              </div>

              {/* Guide Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl border border-slate-200/60 dark:border-[#2B2F38] bg-white dark:bg-[#1E2128] space-y-1.5 shadow-2xs">
                  <div className="text-base">🧘</div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Emotional Grounding</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">Guidance for when you feel anxious, overwhelmed, or panic-stricken.</p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200/60 dark:border-[#2B2F38] bg-white dark:bg-[#1E2128] space-y-1.5 shadow-2xs">
                  <div className="text-base">🌙</div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Sleep & Wind Down</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">Gentle support for sorting racing thoughts before going to sleep.</p>
                </div>
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((msg) => {
              const sentimentEmojis: Record<string, string> = {
                calm: '🧘 Calm',
                happy: '☀️ Warm',
                joyful: '✨ Uplifted',
                sad: '💙 Understood',
                anxious: '🍃 Grounded',
                stressed: '🌊 Serene',
                reflective: '💭 Reflective',
                empathetic: '❤️ Empathetic',
                neutral: '🤍 Present'
              };

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-3 max-w-[85%] md:max-w-[75%] ${msg.senderType === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${
                      msg.senderType === 'user' 
                        ? 'bg-primary/15 text-primary dark:bg-primary/25 dark:text-white' 
                        : 'bg-primary text-white'
                    }`}>
                      {msg.senderType === 'user' ? <User size={16} strokeWidth={1.75} /> : <Sparkles size={16} strokeWidth={1.75} />}
                    </div>
                    
                    <div className="space-y-1 flex flex-col">
                      <div className={`px-4 py-3 text-xs md:text-sm leading-relaxed relative group ${
                        msg.senderType === 'user' 
                          ? 'chat-bubble-user font-normal' 
                          : 'chat-bubble-ai font-normal'
                      }`}>
                        {msg.senderType === 'ai' && msg.text === "" ? (
                          <div className="flex gap-1 py-1.5">
                            <span className="w-1.5 h-1.5 bg-[#8DA9B7] rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-[#6B907B] rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1.5 h-1.5 bg-[#8D80A9] rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        ) : (
                          <>
                            {formatText(msg.text)}
                            {/* streaming indicator dot if active and last item */}
                            {isLoading && msg.senderType === 'ai' && msg.id === messages[messages.length - 1].id && (
                              <span className="inline-block w-2.5 h-2.5 bg-[#6B907B] dark:bg-[#A8C8B5] rounded-full animate-ping ml-1" />
                            )}
                          </>
                        )}

                        {/* Hover action overlay */}
                        {msg.text && (
                          <div className="absolute bottom-0 right-0 translate-y-1/2 flex items-center gap-1 bg-white dark:bg-[#1E2128] border border-slate-200/80 dark:border-[#2B2F38] p-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10">
                            <button
                              onClick={() => handleCopyMessage(msg.id, msg.text)}
                              className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                              title="Copy message"
                            >
                              {copiedMsgId === msg.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Info bar under bubble: Timestamp + Empathy mood tag */}
                      <div className={`flex items-center gap-2 text-[9px] text-slate-400 dark:text-slate-500 select-none ${
                        msg.senderType === 'user' ? 'self-end mr-1' : 'self-start ml-1'
                      }`}>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {msg.sentiment && msg.senderType === 'ai' && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-[#4A725D] dark:text-[#A8C8B5]">
                              {sentimentEmojis[msg.sentiment.toLowerCase()] || msg.sentiment}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Calming Thinking Skeleton Loader */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start animate-fade-in"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-2xs mt-0.5">
                  <Sparkles size={16} strokeWidth={1.75} className="animate-pulse" />
                </div>
                <div className="bg-white dark:bg-[#1E2128] border border-slate-200/70 dark:border-[#2B2F38] px-4 py-3 rounded-2xl rounded-tl-xs flex flex-col gap-2 shadow-2xs w-64 animate-pulse">
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full w-5/6"></div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full w-full"></div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full w-2/3"></div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic mt-1 select-none">
                    Reflecting with care...
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Floating Jump to Bottom Indicator */}
          {showScrollBottom && (
            <button
              onClick={scrollToBottom}
              className="fixed bottom-24 right-6 sm:right-10 p-3 bg-primary hover:bg-primary-hover text-white rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer z-30 flex items-center justify-center"
              title="Scroll to bottom"
            >
              <ChevronDown size={18} />
            </button>
          )}

          <div ref={scrollRef} />
        </main>

        {/* Dignified Crisis Banner */}
        <AnimatePresence>
          {crisisDetected && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-rose-50 dark:bg-rose-950/50 border-t border-rose-200 dark:border-rose-800/80 px-6 py-4"
            >
              <div className="max-w-3xl mx-auto flex items-start gap-3.5">
                <div className="w-9 h-9 bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} strokeWidth={1.75} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-rose-900 dark:text-rose-100 text-sm mb-1">
                    Immediate Support Available
                  </h4>
                  <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed mb-3 font-normal">
                    {t('chat.crisisAlert') || 'Please remember you do not have to carry heavy feelings alone. Free, confidential support is right here for you.'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <a 
                      href="tel:18005990019" 
                      className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                    >
                      📞 KIRAN Helpline (1800-599-0019)
                    </a>
                    <a 
                      href="tel:988" 
                      className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                    >
                      🚨 US/Canada Crisis (988)
                    </a>
                    <button onClick={() => setCrisisDetected(false)} className="text-rose-400 hover:text-rose-600 p-1.5 ml-auto">
                      <X size={16} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions & Input Footer */}
        <footer className="p-4 bg-white/90 dark:bg-[#1E2128]/90 backdrop-blur-md border-t border-slate-200/70 dark:border-[#2B2F38] shrink-0 z-20">
          <div className="max-w-3xl mx-auto space-y-3">
            
            {/* Quick Actions Strip */}
            {showQuickActions && !isLoading && messages.length === 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                  <span>{t('chat.quickActionsTitle') || 'Suggested prompts for your session'}</span>
                  <button onClick={() => setShowQuickActions(false)} className="hover:text-slate-600 dark:hover:text-slate-300">✕</button>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => sendMessageWithPrompt(action.prompt)}
                      className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-[#1E2128] dark:hover:bg-[#252932] border border-slate-200/60 dark:border-[#2B2F38] rounded-xl text-[11px] text-slate-700 dark:text-slate-300 transition-all font-normal shadow-2xs whitespace-nowrap flex items-center gap-1.5"
                    >
                      <span>{action.icon}</span>
                      <span>{t(action.labelKey) || action.prompt.slice(0, 30) + '...'}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Follow-up Questions */}
            {preferences.aiSuggestedQuestions !== false && !isLoading && messages.length > 0 && messages[messages.length - 1].senderType === 'ai' && (
              <div className="space-y-1.5 animate-fade-in">
                <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                  Suggested Follow-up
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {getSuggestedFollowUpQuestions().map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => sendMessageWithPrompt(q)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-[#1E2128]/80 dark:hover:bg-[#252932] border border-slate-200/60 dark:border-[#2B2F38] rounded-xl text-[11px] text-slate-700 dark:text-slate-350 transition-all whitespace-nowrap shadow-2xs hover:scale-[1.01]"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
              {/* Extra Controls */}
              {isLoading ? (
                <button
                  type="button"
                  onClick={handleStopGeneration}
                  className="p-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-900 rounded-xl hover:bg-rose-100 transition-colors"
                  title="Stop generating"
                >
                  <StopCircle size={16} />
                </button>
              ) : (
                messages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleRetryResponse}
                    className="p-3.5 bg-[#FAF9F6] dark:bg-[#16181D] border border-slate-200 dark:border-[#2B2F38] text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-100 transition-colors"
                    title="Retry AI reply"
                  >
                    <RotateCcw size={16} />
                  </button>
                )
              )}

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Share whatever is on your mind..."
                className="w-full bg-[#FAF9F6] dark:bg-[#16181D] border border-slate-200/80 dark:border-[#2B2F38] rounded-2xl pl-4 pr-12 py-3 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all"
                disabled={isLoading || !selectedConversationId}
              />
              
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading || !selectedConversationId}
                className="absolute right-2 p-2 bg-primary hover:bg-primary-hover disabled:bg-slate-100 disabled:dark:bg-[#1E2128] text-white disabled:text-slate-400 rounded-xl transition-all shadow-2xs flex items-center justify-center"
                aria-label="Send message"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </div>
        </footer>
      </div>
    </div>
  );
}
