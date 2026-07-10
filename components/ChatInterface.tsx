'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { 
  Send, 
  User, 
  ChevronLeft, 
  Smile, 
  ShieldCheck, 
  AlertTriangle,
  Loader2,
  X,
  Sparkles,
  Leaf
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { signInAnonymously, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  updateDoc,
  limit
} from 'firebase/firestore';
import { useSanctuaryTranslation } from '@/lib/i18n/useSanctuaryTranslation';
import { triggerGentleSanctuaryCelebration } from './SanctuaryConfetti';
import { useSettingsStore } from '@/store/useSettingsStore';

interface Message {
  id: string;
  text: string;
  senderType: 'user' | 'ai' | 'volunteer';
  createdAt: any;
}

function generateMessageId(prefix: 'user' | 'ai'): string {
  return `local_${prefix === 'user' ? 'u' : 'ai'}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
}

function generateGuestId(): string {
  return 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
}

interface QuickAction {
  id: string;
  labelKey: string;
  prompt: string;
  icon: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'anxious', labelKey: 'chat.quickActions.anxious', prompt: "I feel anxious right now and could use some gentle guidance to ground myself.", icon: '🍃' },
  { id: 'overwhelmed', labelKey: 'chat.quickActions.overwhelmed', prompt: "I'm feeling overwhelmed with everything happening around me right now.", icon: '🌊' },
  { id: 'sleep', labelKey: 'chat.quickActions.sleep', prompt: "I can't seem to quiet my mind to sleep. Can we do a quick relaxation exercise?", icon: '🌙' },
  { id: 'motivation', labelKey: 'chat.quickActions.motivation', prompt: "I need some gentle, kind motivation to help me get through today.", icon: '✨' },
  { id: 'vent', labelKey: 'chat.quickActions.vent', prompt: "I just want a safe, quiet space to vent about what happened today.", icon: '💬' },
  { id: 'calm', labelKey: 'chat.quickActions.calm', prompt: "Please help me calm down and take a slow, deep breath together.", icon: '🪷' },
  { id: 'win', labelKey: 'chat.quickActions.win', prompt: "I want to celebrate a small win I had today with you!", icon: '🌱' },
  { id: 'gratitude', labelKey: 'chat.quickActions.gratitude', prompt: "Let's practice a short moment of gratitude together right now.", icon: '🙏' },
];

const getLocalChatHistory = (uid: string): Message[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`calmnest_chat_${uid}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalChatHistory = (uid: string, msgs: Message[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`calmnest_chat_${uid}`, JSON.stringify(msgs));
  } catch (e) {}
};

export default function ChatInterface() {
  const router = useRouter();
  const { t, currentLanguage } = useSanctuaryTranslation();
  const { preferences } = useSettingsStore();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        try {
          const userCredential = await signInAnonymously(auth);
          setCurrentUser(userCredential.user);
        } catch (e) {
          console.error("Anonymous auth error:", e);
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let timer1: any = null;
    if (!currentUser) {
      if (typeof window !== 'undefined') {
        const guestId = window.localStorage.getItem('calmnest_guest_uid') || 'guest_user';
        const saved = getLocalChatHistory(guestId);
        if (saved.length > 0) {
          timer1 = setTimeout(() => setMessages(saved), 0);
        }
      }
      return () => {
        if (timer1) clearTimeout(timer1);
      };
    }

    const saved = getLocalChatHistory(currentUser.uid);
    let timer2: any = null;
    if (saved.length > 0) {
      timer2 = setTimeout(() => setMessages(saved), 0);
    }

    const q = query(
      collection(db, 'users', currentUser.uid, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const remote: Message[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Message, 'id'>)
      }));
      if (remote.length > 0) {
        setMessages(remote);
        saveLocalChatHistory(currentUser.uid, remote);
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }, (err) => {
      console.warn("Firestore messages snapshot error (handled):", err);
    });
    return () => {
      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
      unsubscribeMessages();
    };
  }, [currentUser]);

  const getEffectiveUserId = async (): Promise<string> => {
    if (currentUser) return currentUser.uid;
    try {
      const cred = await signInAnonymously(auth);
      if (cred.user) {
        setCurrentUser(cred.user);
        return cred.user.uid;
      }
    } catch (e) {}
    if (typeof window !== 'undefined') {
      let guestId = window.localStorage.getItem('calmnest_guest_uid');
      if (!guestId) {
        guestId = generateGuestId();
        window.localStorage.setItem('calmnest_guest_uid', guestId);
      }
      return guestId;
    }
    return 'guest_user';
  };

  const logMood = async (score: number) => {
    setShowMoodPicker(false);
    const uid = await getEffectiveUserId();
    try {
      await addDoc(collection(db, 'users', uid, 'moods'), {
        score,
        tags: ['chat-checkin'],
        notes: `Logged via AI Therapist session`,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      // Silently handled without permission error
    }
    triggerGentleSanctuaryCelebration('petals');
    await sendMessageWithPrompt(`I just logged my current mood as ${score}/5. Can we reflect on this?`);
  };

  const sendMessageWithPrompt = async (promptText: string) => {
    if (!promptText.trim() || isLoading) return;
    setIsLoading(true);
    setShowQuickActions(false);
    
    const uid = await getEffectiveUserId();
    const userMsg: Message = {
      id: generateMessageId('user'),
      text: promptText,
      senderType: 'user',
      createdAt: new Date().toISOString()
    };

    let currentHistory: Message[] = [];
    setMessages(prev => {
      const next = [...prev, userMsg];
      currentHistory = next;
      saveLocalChatHistory(uid, next);
      return next;
    });

    setIsTyping(true);
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    // Try saving to remote Firestore silently
    try {
      await addDoc(collection(db, 'users', uid, 'messages'), {
        text: promptText,
        senderType: 'user',
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      // Silently handled by local storage cache without throwing permission errors
    }

    try {
      const historyPayload = currentHistory.slice(-12, -1).map(m => ({
        role: m.senderType === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: promptText,
          history: historyPayload,
          language: currentLanguage,
          voiceStyle: preferences.aiVoiceOrStyle || 'warm'
        })
      });

      const data = await response.json();
      setIsTyping(false);

      if (data.isCrisis || data.crisisDetected) {
        setCrisisDetected(true);
      }

      const replyText = data.reply || data.text || t('chat.errorReply') || "I'm right here with you. Let's take a slow, gentle breath together.";
      const aiMsg: Message = {
        id: generateMessageId('ai'),
        text: replyText,
        senderType: 'ai',
        createdAt: new Date().toISOString()
      };

      setMessages(prev => {
        const next = [...prev, aiMsg];
        saveLocalChatHistory(uid, next);
        return next;
      });

      try {
        await addDoc(collection(db, 'users', uid, 'messages'), {
          text: replyText,
          senderType: 'ai',
          createdAt: serverTimestamp(),
        });
      } catch (e) {}

      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) {
      console.error("Chat error:", e);
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    setInputText('');
    sendMessageWithPrompt(text);
  };

  return (
    <div className="flex flex-col h-screen bg-[#FAF9F6] dark:bg-[#16181D] text-slate-800 dark:text-slate-100 font-sans select-none overflow-hidden transition-colors duration-300">
      
      {/* Header */}
      <header className="h-16 px-4 md:px-8 bg-white/90 dark:bg-[#1E2128]/90 backdrop-blur-md border-b border-slate-200/70 dark:border-[#2B2F38] flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/dashboard')}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#252932] rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium"
            aria-label="Back to dashboard"
          >
            <ChevronLeft size={18} strokeWidth={1.75} />
            <span className="hidden sm:inline">Workspace</span>
          </button>
          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block" />
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#5C8397] rounded-xl flex items-center justify-center text-white shadow-2xs">
              <Sparkles size={16} strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="font-medium text-sm text-slate-900 dark:text-slate-100 leading-none">
                {t('nav.chat') || 'AI Therapist'}
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 bg-[#6B907B] rounded-full" />
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  Online 24/7 Sanctuary
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge-blue text-[11px] py-1 px-3">
            <ShieldCheck size={13} strokeWidth={1.75} />
            <span>100% Anonymous</span>
          </span>
        </div>
      </header>

      {/* Main Stream Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 max-w-3xl mx-auto w-full">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center py-10 space-y-3 max-w-sm mx-auto"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#E8F0F8] dark:bg-[#5C8397]/20 text-[#5C8397] dark:text-[#A1C2D4] flex items-center justify-center mx-auto shadow-2xs">
              <Leaf size={22} strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-medium text-slate-900 dark:text-slate-100">
              {t('welcome.title') || 'Your Safe Space Begins Here'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('emptyStates.journal') || 'No judgment, no urgency. Take a deep, quiet breath and share whatever is on your mind when you feel ready.'}
            </p>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id || i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-3 max-w-[85%] md:max-w-[75%] ${msg.senderType === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${
                  msg.senderType === 'user' 
                    ? 'bg-[#5C8397]/15 text-[#5C8397] dark:bg-[#5C8397]/25 dark:text-white' 
                    : 'bg-[#5C8397] text-white'
                }`}>
                  {msg.senderType === 'user' ? <User size={16} strokeWidth={1.75} /> : <Sparkles size={16} strokeWidth={1.75} />}
                </div>
                <div className={`px-4.5 py-3.5 text-sm leading-relaxed ${
                  msg.senderType === 'user' 
                    ? 'chat-bubble-user font-normal' 
                    : 'chat-bubble-ai font-normal'
                }`}>
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Calming Thinking Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#5C8397] text-white flex items-center justify-center shadow-2xs">
                <Sparkles size={16} strokeWidth={1.75} className="animate-pulse" />
              </div>
              <div className="bg-white dark:bg-[#1E2128] border border-slate-200/70 dark:border-[#2B2F38] px-4 py-3 rounded-2xl rounded-tl-xs flex items-center gap-2.5 shadow-2xs">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[#8DA9B7] rounded-full animate-pulse" />
                  <span className="w-1.5 h-1.5 bg-[#6B907B] rounded-full animate-pulse [animation-delay:0.25s]" />
                  <span className="w-1.5 h-1.5 bg-[#8D80A9] rounded-full animate-pulse [animation-delay:0.5s]" />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal italic">
                  {t('chat.thinking') || 'Reflecting with care...'}
                </span>
              </div>
            </div>
          </motion.div>
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
                <h4 className="font-medium text-rose-900 dark:text-rose-100 text-sm mb-1">
                  Immediate Support Available
                </h4>
                <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed mb-3">
                  {t('chat.crisisAlert') || 'Please remember you do not have to carry heavy feelings alone. Free, confidential support is right here for you.'}
                </p>
                <div className="flex flex-wrap items-center gap-2.5">
                  <a 
                    href="tel:18005990019" 
                    className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-2xs"
                  >
                    📞 KIRAN Helpline (1800-599-0019)
                  </a>
                  <a 
                    href="tel:988" 
                    className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-2xs"
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
          {showQuickActions && !isLoading && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                <span>{t('chat.quickActionsTitle') || 'Gentle suggestions for your session'}</span>
                <button onClick={() => setShowQuickActions(false)} className="hover:text-slate-600 dark:hover:text-slate-300">✕</button>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => sendMessageWithPrompt(action.prompt)}
                    className="shrink-0 bg-slate-50 dark:bg-[#16181D] border border-slate-200/80 dark:border-[#2B2F38] text-slate-700 dark:text-slate-300 px-3.5 py-1.5 rounded-xl text-xs font-normal flex items-center gap-1.5 hover:bg-[#E8F0F8] dark:hover:bg-[#5C8397]/20 hover:border-[#5C8397]/40 hover:text-[#5C8397] dark:hover:text-[#A1C2D4] transition-all"
                  >
                    <span>{action.icon}</span>
                    <span>{t(action.labelKey) || action.prompt.slice(0, 24) + '...'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mood Picker Modal */}
          <AnimatePresence>
            {showMoodPicker && (
              <motion.div 
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.16 }}
                className="absolute bottom-full left-4 right-4 md:left-auto md:right-auto md:w-80 mb-3 bg-white dark:bg-[#1E2128] border border-slate-200/80 dark:border-[#2B2F38] p-5 rounded-2xl shadow-lg z-40"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 text-xs">
                    {t('dashboard.moodLabel') || 'Log your current feeling'}
                  </h3>
                  <button onClick={() => setShowMoodPicker(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={15} />
                  </button>
                </div>
                <div className="flex justify-between gap-1.5">
                  {[
                    { score: 1, icon: '😔' },
                    { score: 2, icon: '😕' },
                    { score: 3, icon: '😐' },
                    { score: 4, icon: '🙂' },
                    { score: 5, icon: '😄' },
                  ].map((item) => (
                    <button 
                      key={item.score}
                      onClick={() => logMood(item.score)}
                      className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-[#16181D] border border-slate-200/70 dark:border-[#2B2F38] flex items-center justify-center text-xl hover:bg-[#E8F0F8] hover:border-[#5C8397] transition-all hover:scale-105"
                      title={`Score: ${item.score}/5`}
                    >
                      {item.icon}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Form */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-[#FAF9F6] dark:bg-[#16181D] p-1.5 rounded-2xl border border-slate-200/80 dark:border-[#2B2F38] focus-within:border-[#5C8397] dark:focus-within:border-[#5C8397]/60 transition-all">
            <button 
              type="button"
              onClick={() => setShowMoodPicker(!showMoodPicker)}
              className={`p-2.5 rounded-xl transition-colors ${showMoodPicker ? 'bg-[#5C8397] text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-[#252932]'}`}
              title="Log Mood Check-in"
              aria-label="Log mood check-in"
            >
              <Smile size={18} strokeWidth={1.75} />
            </button>
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('chat.placeholder') || 'Type your message with zero judgment...'}
              className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-slate-800 dark:text-slate-100 py-2 px-2 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {!showQuickActions && (
              <button
                type="button"
                onClick={() => setShowQuickActions(true)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl transition-colors text-xs"
                title="Show quick suggestions"
                aria-label="Show suggestions"
              >
                <Sparkles size={16} strokeWidth={1.75} />
              </button>
            )}
            <button 
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="btn-primary p-2.5 rounded-xl disabled:opacity-40 disabled:scale-100 shadow-2xs min-h-[38px] min-w-[38px]"
              aria-label="Send message"
            >
              <Send size={16} strokeWidth={1.75} />
            </button>
          </form>

          <div className="text-center">
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              AI companion for emotional reflection & grounding. Not clinical or medical advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
