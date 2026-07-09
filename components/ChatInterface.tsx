'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Send, 
  User, 
  Bot, 
  ChevronLeft, 
  MoreVertical, 
  Smile, 
  ShieldCheck, 
  Heart,
  AlertTriangle,
  Loader2,
  X,
  History
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

interface Message {
  id: string;
  text: string;
  senderType: 'user' | 'ai' | 'volunteer';
  createdAt: any;
}

export default function ChatInterface() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (u) {
          setUser(u);
        } else {
          const cred = await signInAnonymously(auth);
          setUser(cred.user);
        }
      } catch (err: any) {
        console.error("Auth error:", err);
        setAuthError(err.message || "Failed to authenticate. Please check if anonymous auth is enabled.");
      }
    });
    return unsub;
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    if (!user) return;

    const initChat = async () => {
      try {
        const chatRef = await addDoc(collection(db, 'chats'), {
          userId: user.uid,
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          crisisDetected: false
        });
        setChatId(chatRef.id);
      } catch (err: any) {
        console.error("Chat init error:", err);
        setAuthError("Failed to initialize secure chat. Please try again.");
      }
    };

    initChat();
  }, [user]);

  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      const flatMsgs: Message[] = [];
      docs.forEach(doc => {
        if (doc.text) {
          flatMsgs.push({
            id: doc.id + '-user',
            text: doc.text,
            senderType: 'user',
            createdAt: doc.createdAt
          });
        }
        if (doc.responseText) {
          flatMsgs.push({
            id: doc.id + '-ai',
            text: doc.responseText,
            senderType: 'ai',
            createdAt: doc.responseCreatedAt || doc.createdAt
          });
        }
      });

      setMessages(flatMsgs);
      scrollToBottom();
    });

    return unsub;
  }, [chatId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !user || !chatId || isLoading) return;

    const text = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      const msgDocRef = await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text,
        senderId: user.uid,
        anonymousUserId: user.uid,
        senderType: 'user',
        createdAt: serverTimestamp()
      });

      setIsTyping(true);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          messages: messages.map(m => ({ 
            role: m.senderType === 'user' ? 'user' : 'assistant', 
            content: m.text 
          })).concat({ role: 'user', content: text })
        })
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      
      if (data.crisisDetected) {
        setCrisisDetected(true);
        await updateDoc(doc(db, 'chats', chatId), { crisisDetected: true });
      }

      await updateDoc(msgDocRef, {
        responseText: data.text,
        responseCreatedAt: serverTimestamp()
      });

    } catch (err: any) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, {
        id: 'error-' + Date.now(),
        text: "I'm having a little trouble connecting right now. Please try again in a moment.",
        senderType: 'ai',
        createdAt: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const logMood = async (mood: number) => {
    if (!user || !chatId) return;
    try {
      await addDoc(collection(db, 'moodLogs'), {
        userId: user.uid,
        mood,
        createdAt: serverTimestamp()
      });
      setShowMoodPicker(false);
      
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: `I'm feeling a ${mood}/5 today.`,
        senderId: user.uid,
        senderType: 'user',
        createdAt: serverTimestamp(),
        isMoodLog: true
      });
    } catch (err) {
      console.error("Mood error:", err);
    }
  };

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] p-6 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Connection Issue</h2>
        <p className="text-slate-500 mb-6 max-w-sm">{authError}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:bg-indigo-700 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-slate-500 font-medium">Entering CalmNest safely...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="glass flex items-center justify-between px-4 py-3 md:px-8 border-b border-white/20 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/')} 
            className="p-2 hover:bg-white/50 rounded-full transition-colors"
            aria-label="Back to home"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Heart size={20} fill="currentColor" />
            </div>
            <div>
              <h1 className="font-display font-bold text-slate-900">CalmNest AI</h1>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Always Online</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full text-xs font-bold text-indigo-600">
            <ShieldCheck size={14} />
            ANONYMOUS SESSION
          </div>
          <button className="p-2 hover:bg-white/50 rounded-full transition-colors text-slate-500">
            <MoreVertical size={20} />
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id || i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end gap-3 max-w-[85%] ${msg.senderType === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                  msg.senderType === 'user' ? 'bg-slate-200 text-slate-500' : 'bg-indigo-600 text-white'
                }`}>
                  {msg.senderType === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`px-5 py-3 ${
                  msg.senderType === 'user' 
                    ? 'chat-bubble-user' 
                    : 'chat-bubble-ai'
                } text-sm leading-relaxed`}>
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <div className="flex justify-start">
             <div className="flex items-end gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <Bot size={16} />
                </div>
                <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
             </div>
          </div>
        )}

        <div ref={scrollRef} />
      </main>

      {/* Crisis Warning */}
      <AnimatePresence>
        {crisisDetected && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-50 border-t border-red-100 px-6 py-4"
          >
            <div className="max-w-4xl mx-auto flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-red-900 text-sm mb-1">Safety Alert Detected</h4>
                <p className="text-xs text-red-700 leading-relaxed mb-3">
                  It sounds like you might be going through a very difficult time. Please know that you are not alone and there is help available.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-700 transition-colors">
                    Emergency Hotline
                  </button>
                  <button className="bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors">
                    Connect with Human Volunteer
                  </button>
                  <button onClick={() => setCrisisDetected(false)} className="text-red-400 hover:text-red-600 p-2">
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <footer className="p-4 md:p-6 bg-white border-t border-slate-100 relative z-30">
        <div className="max-w-4xl mx-auto relative">
          <AnimatePresence>
            {showMoodPicker && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-0 mb-4 glass p-6 rounded-[32px] w-full md:w-96 shadow-2xl z-40"
              >
                <h3 className="font-display font-bold text-slate-800 mb-4">How are you feeling right now?</h3>
                <div className="flex justify-between gap-2">
                  {[1, 2, 3, 4, 5].map((mood) => (
                    <button 
                      key={mood}
                      onClick={() => logMood(mood)}
                      className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl hover:bg-indigo-50 hover:border-indigo-200 transition-all hover:scale-110"
                    >
                      {mood === 1 ? '😢' : mood === 2 ? '😕' : mood === 3 ? '😐' : mood === 4 ? '🙂' : '✨'}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-slate-100 p-2 rounded-[2rem] border border-slate-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
            <button 
              type="button"
              onClick={() => setShowMoodPicker(!showMoodPicker)}
              className={`p-3 rounded-full transition-colors ${showMoodPicker ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}
            >
              <Smile size={24} />
            </button>
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tell me what's on your mind..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 py-3 px-2 font-medium"
            />
            <button 
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="bg-indigo-600 text-white p-4 rounded-full disabled:opacity-50 disabled:bg-slate-300 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              <Send size={20} />
            </button>
          </form>
          <div className="text-center mt-3">
             <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">CalmNest AI can make mistakes. Consider professional help for serious issues.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
