'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  AlertTriangle, 
  MessageSquare, 
  ChevronRight, 
  Search, 
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';

interface Chat {
  id: string;
  userId: string;
  status: string;
  crisisDetected: boolean;
  updatedAt: any;
}

export default function VolunteerDashboard() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [filter, setFilter] = useState<'all' | 'crisis'>('all');

  useEffect(() => {
    const q = query(
      collection(db, 'chats'),
      orderBy('updatedAt', 'desc'),
      limit(20)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const chatData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];
      setChats(chatData);
    });

    return unsub;
  }, []);

  const filteredChats = filter === 'crisis' ? chats.filter(c => c.crisisDetected) : chats;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6 hidden lg:flex flex-col">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Users size={18} />
          </div>
          <span className="text-xl font-display font-bold">Partner Portal</span>
        </div>

        <nav className="space-y-2 flex-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-600 rounded-xl font-medium transition-all">
            <MessageSquare size={18} />
            Active Chats
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 rounded-xl font-medium transition-all">
            <Users size={18} />
            Volunteers
          </button>
        </nav>

        <div className="pt-6 border-t border-slate-800">
          <div className="bg-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-500 uppercase font-bold mb-2">My Status</p>
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              Available
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900">Volunteer Dashboard</h1>
            <p className="text-slate-500">Managing anonymous support requests</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'all' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              All Requests
            </button>
            <button 
              onClick={() => setFilter('crisis')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${filter === 'crisis' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <AlertTriangle size={14} />
              Crisis Only
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {[
            { label: "Active Chats", value: chats.length, icon: <MessageSquare />, color: "text-indigo-600" },
            { label: "Crisis Cases", value: chats.filter(c => c.crisisDetected).length, icon: <AlertTriangle />, color: "text-red-500" },
            { label: "Average Response", value: "2.4m", icon: <Clock />, color: "text-emerald-500" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 bg-slate-50 rounded-lg ${stat.color}`}>{stat.icon}</div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today</span>
              </div>
              <div className="text-3xl font-display font-bold text-slate-900">{stat.value}</div>
              <div className="text-sm font-medium text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-display font-bold text-xl text-slate-800">Support Requests</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {filteredChats.map((chat) => (
              <motion.div 
                key={chat.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                    chat.crisisDetected ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {chat.crisisDetected ? <AlertTriangle size={24} /> : <Users size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900">Session #{chat.id.slice(0, 8)}</span>
                      {chat.crisisDetected && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                          Crisis
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {chat.updatedAt?.toDate().toLocaleTimeString() || 'Recently'}
                      </span>
                      <span>•</span>
                      <span>Anonymous</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-100 text-slate-400 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
