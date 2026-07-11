'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  AlertTriangle, 
  MessageSquare, 
  ChevronRight, 
  Search, 
  Clock,
  Send,
  Loader2,
  X,
  User,
  HeartHandshake
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { triggerGentleSanctuaryCelebration } from '@/components/SanctuaryConfetti';

interface Chat {
  id: string;
  userId: string;
  status: string;
  crisisDetected: boolean;
  title: string;
  updatedAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | 'assistant' | 'volunteer';
  content: string;
  createdAt: string;
}

export default function VolunteerDashboard() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [filter, setFilter] = useState<'all' | 'crisis'>('all');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(30);

    if (!error && data) {
      const mapped = data.map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        status: 'active',
        crisisDetected: d.risk_detected || false,
        title: d.title || `Session #${d.id.slice(0, 8)}`,
        updatedAt: d.updated_at || new Date().toISOString()
      }));
      setChats(mapped);
    }
  };

  const fetchMessages = async (chatId: string) => {
    setMessagesLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', chatId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        const mapped = data.map((m: any) => ({
          id: m.id,
          conversationId: m.conversation_id,
          sender: m.sender || 'user',
          content: m.content,
          createdAt: m.created_at || new Date().toISOString()
        }));
        setMessages(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMessagesLoading(false);
      setTimeout(() => messageEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  useEffect(() => {
    fetchConversations();

    const channelName = 'volunteer_conversations_realtime';

    // Clean up any existing channel with the same name (React Strict Mode)
    const existingChannel = supabase.getChannels().find(
      (c) => c.topic === `realtime:${channelName}` || c.topic === channelName
    );
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Sync messages when selectedChatId changes
  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }

    fetchMessages(selectedChatId);

    const channelName = `volunteer_messages_${selectedChatId}`;

    // Clean up any existing channel with the same name (React Strict Mode)
    const existingChannel = supabase.getChannels().find(
      (c) => c.topic === `realtime:${channelName}` || c.topic === channelName
    );
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${selectedChatId}`
      }, (payload) => {
        const newMsg: Message = {
          id: payload.new.id,
          conversationId: payload.new.conversation_id,
          sender: payload.new.sender || 'user',
          content: payload.new.content,
          createdAt: payload.new.created_at || new Date().toISOString()
        };
        setMessages(prev => [...prev, newMsg]);
        setTimeout(() => messageEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChatId]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChatId || isSending) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedChatId,
          sender: 'assistant', // Render as counselor / volunteer assistant bubble
          content: replyText.trim(),
          created_at: new Date().toISOString()
        });

      if (!error) {
        setReplyText('');
        triggerGentleSanctuaryCelebration('petals');
      } else {
        console.error(error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
      setTimeout(() => messageEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const filteredChats = filter === 'crisis' ? chats.filter(c => c.crisisDetected) : chats;

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#16181D] flex font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white p-6 hidden lg:flex flex-col border-r border-slate-800 shrink-0">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <HeartHandshake size={18} />
          </div>
          <div>
            <span className="font-semibold tracking-tight text-base block">CalmNest Support</span>
            <span className="text-[10px] text-slate-400 font-mono">Volunteer Gateway</span>
          </div>
        </div>

        <nav className="space-y-1.5 flex-1">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-indigo-600 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all">
            <MessageSquare size={16} />
            <span>Active Chats</span>
          </button>
        </nav>

        <div className="pt-6 border-t border-slate-800">
          <div className="bg-slate-800 p-4 rounded-xl">
            <p className="text-[10px] text-slate-500 uppercase font-mono mb-2">My Duty Status</p>
            <div className="flex items-center gap-2 text-xs font-bold">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <span>Available Listener</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row min-w-0">
        {/* Left List Pane */}
        <div className={`flex-1 flex flex-col min-w-0 p-4 md:p-8 ${selectedChatId ? 'hidden md:flex md:max-w-md border-r border-slate-200/60 dark:border-[#2B2F38]' : ''}`}>
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Volunteer Dashboard</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Monitoring anonymous support reflections</p>
            </div>
            
            <div className="flex bg-slate-100 dark:bg-[#1E2128] p-0.5 rounded-lg border border-slate-200/70 dark:border-[#2B2F38] text-[11px] shrink-0">
              <button 
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-md transition-all font-semibold ${filter === 'all' ? 'bg-white dark:bg-[#252932] text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilter('crisis')}
                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 font-semibold ${filter === 'crisis' ? 'bg-rose-500 text-white shadow-2xs' : 'text-slate-500'}`}
              >
                <AlertTriangle size={11} />
                <span>Crisis Only</span>
              </button>
            </div>
          </header>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white dark:bg-[#1E2128] p-4 rounded-2xl border border-slate-200/80 dark:border-[#2B2F38] shadow-2xs space-y-1">
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">Conversations</span>
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{chats.length}</div>
            </div>
            <div className="bg-white dark:bg-[#1E2128] p-4 rounded-2xl border border-slate-200/80 dark:border-[#2B2F38] shadow-2xs space-y-1">
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">Crisis Triggers</span>
              <div className="text-xl font-bold text-rose-600 dark:text-rose-400">{chats.filter(c => c.crisisDetected).length}</div>
            </div>
          </div>

          {/* List Area */}
          <div className="bg-white dark:bg-[#1E2128] border border-slate-200 dark:border-[#2B2F38] rounded-2xl overflow-hidden flex-1 flex flex-col shadow-2xs">
            <div className="p-4 border-b border-slate-100 dark:border-[#2B2F38] flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Session Queue</span>
              <span className="text-[10px] text-slate-400 font-mono">Live Sync Active</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#2B2F38] overflow-y-auto flex-1">
              {filteredChats.map((chat) => {
                const isActive = selectedChatId === chat.id;
                return (
                  <div 
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`p-4 hover:bg-slate-50 dark:hover:bg-[#252932]/30 transition-colors cursor-pointer flex items-center justify-between group ${
                      isActive ? 'bg-primary/5 dark:bg-primary/15 border-l-4 border-primary' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        chat.crisisDetected ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-350' : 'bg-slate-50 dark:bg-slate-850 text-slate-400'
                      }`}>
                        {chat.crisisDetected ? <AlertTriangle size={18} /> : <Users size={18} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">{chat.title}</span>
                          {chat.crisisDetected && (
                            <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[8px] font-bold rounded-full uppercase tracking-wider shrink-0">
                              Crisis
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                          <Clock size={10} />
                          <span>{new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-1 bg-slate-100 dark:bg-[#16181D] text-slate-400 rounded-lg group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                      <ChevronRight size={14} />
                    </div>
                  </div>
                );
              })}
              {filteredChats.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No active support requests found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Chat Panel */}
        <div className={`flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1E2128] ${!selectedChatId ? 'hidden md:flex items-center justify-center text-center text-slate-400 p-8' : ''}`}>
          {!selectedChatId ? (
            <div className="space-y-3">
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <MessageSquare size={24} />
              </div>
              <h3 className="font-medium text-sm text-slate-800 dark:text-slate-200">No Session Selected</h3>
              <p className="text-xs max-w-xs leading-normal">Select a session request from the list to initiate real-time listening and guidance takeover.</p>
            </div>
          ) : (
            <div className="flex-grow flex flex-col h-full overflow-hidden relative">
              
              {/* Chat Panel Header */}
              <div className="p-4 border-b border-slate-100 dark:border-[#2B2F38] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#252932]/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-850 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-350">
                    <User size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-slate-900 dark:text-white">
                      {chats.find(c => c.id === selectedChatId)?.title || 'Counseling Takeover'}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span>Live Session taking place</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedChatId(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Chat Pane Logs */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF9F6] dark:bg-[#16181D]">
                {messagesLoading && messages.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-slate-400">
                    <Loader2 size={24} className="animate-spin mr-2" />
                    <span className="text-xs">Loading message logs...</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.sender === 'user';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isUser
                              ? 'bg-white dark:bg-[#1E2128] border border-slate-200/80 dark:border-[#2B2F38] text-slate-800 dark:text-slate-200'
                              : 'bg-primary text-white'
                          }`}
                        >
                          <p className="font-sans whitespace-pre-wrap">{msg.content}</p>
                          <div className={`text-[9px] mt-1 font-mono text-right ${isUser ? 'text-slate-400' : 'text-white/80'}`}>
                            {msg.sender === 'assistant' ? 'AI Counselor' : msg.sender === 'volunteer' ? 'Peer Volunteer' : 'Friend'} •{' '}
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messageEndRef} />
              </div>

              {/* Send Reply Box */}
              <form
                onSubmit={handleSendReply}
                className="p-4 border-t border-slate-100 dark:border-[#2B2F38] flex items-center gap-3 bg-white dark:bg-[#1E2128] shrink-0"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a compassionate, empathetic reply to take over chat..."
                  className="flex-grow bg-slate-50 dark:bg-[#16181D] border-none outline-none rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-white placeholder:text-slate-450 focus:ring-2 focus:ring-primary/25"
                />
                <button
                  type="submit"
                  disabled={isSending || !replyText.trim()}
                  className="btn-primary p-3 rounded-xl shrink-0"
                >
                  {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}
