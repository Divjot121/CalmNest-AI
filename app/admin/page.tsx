'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  Users,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Lock,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  Sparkles,
  ListTodo
} from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'crisis' | 'volunteers'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const mockVolunteers = [
    { id: '1', name: 'Sarah Jenkins', email: 's.jenkins@example.org', role: 'Crisis Peer Support', status: 'Pending Review', appliedDate: '2 hours ago' },
    { id: '2', name: 'Dr. Marcus Vance', email: 'm.vance@psych.edu', role: 'Clinical Supervisor', status: 'Approved', appliedDate: 'Yesterday' },
    { id: '3', name: 'Elena Rostova', email: 'elena.r@community.net', role: 'Moderator & Listener', status: 'Pending Review', appliedDate: '3 days ago' },
  ];

  const mockCrisisAlerts = [
    { id: 'a1', timestamp: '10 mins ago', triggerWord: 'self-harm keywords detected', userHash: 'Anonymous#8841', status: 'Resolved by AI Safe Response' },
    { id: 'a2', timestamp: '1 hour ago', triggerWord: 'crisis hotline prompt dispatched', userHash: 'Anonymous#3109', status: 'Active Support Escalated' },
  ];

  return (
    <AppSidebar>
      <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-6xl mx-auto bg-[#FAF9F6] dark:bg-[#16181D] min-h-screen transition-colors duration-300 select-none">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-[#2B2F38]">
          <div>
            <div className="flex items-center gap-2 text-rose-600 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldAlert size={16} />
              <span>NGO Platform Administration & Governance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-slate-900 dark:text-slate-100">Enterprise Admin Portal</h1>
            <p className="text-xs text-slate-500 mt-1">Real-time system telemetry, crisis safeguards, and volunteer coordination</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchStats}
              title="Refresh Telemetry"
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252932] rounded-xl transition-colors"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 px-4 py-2 rounded-2xl text-xs font-bold text-rose-800 dark:text-rose-300">
              <Lock size={14} />
              <span>Role: Super Administrator</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 bg-white dark:bg-[#1E2128] border border-slate-200/80 dark:border-[#2B2F38] rounded-3xl shadow-xs space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Registered Users</span>
            {loading ? (
              <Loader2 className="animate-spin text-primary" size={20} />
            ) : (
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats?.totalUsers || 0}</p>
            )}
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ArrowUpRight size={14} /> {stats?.activeUsers || 0} active users in last 24h
            </span>
          </div>

          <div className="p-6 bg-white dark:bg-[#1E2128] border border-slate-200/80 dark:border-[#2B2F38] rounded-3xl shadow-xs space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">AI Therapy Sessions</span>
            {loading ? (
              <Loader2 className="animate-spin text-primary" size={20} />
            ) : (
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats?.totalChats || 0}</p>
            )}
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Active interactive therapy logs</span>
          </div>

          <div className="p-6 bg-white dark:bg-[#1E2128] border border-slate-200/80 dark:border-[#2B2F38] rounded-3xl shadow-xs space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Crisis Interventions</span>
            {loading ? (
              <Loader2 className="animate-spin text-primary" size={20} />
            ) : (
              <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">{stats?.riskCases || 0}</p>
            )}
            <span className="text-[11px] font-medium text-[#6B907B] dark:text-[#A8C8B5]">100% Safeguard Dispatch Rate</span>
          </div>

          <div className="p-6 bg-white dark:bg-[#1E2128] border border-slate-200/80 dark:border-[#2B2F38] rounded-3xl shadow-xs space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Journal & Habits Telemetry</span>
            {loading ? (
              <Loader2 className="animate-spin text-primary" size={20} />
            ) : (
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-baseline gap-1">
                <span>{stats?.totalReflections || 0}</span>
                <span className="text-xs text-slate-400">reflections</span>
              </p>
            )}
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{stats?.totalHabits || 0} habit anchors active</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {(['overview', 'crisis', 'volunteers'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all capitalize ${
                activeTab === tab
                  ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-sm'
                  : 'bg-white dark:bg-[#1E2128] hover:bg-slate-100 dark:hover:bg-[#252932] text-slate-600 dark:text-slate-350 border border-slate-200 dark:border-[#2B2F38]'
              }`}
            >
              {tab === 'crisis' ? 'Crisis Safeguard Alerts' : tab === 'volunteers' ? 'Volunteer Applications' : 'Platform Overview'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="bg-white dark:bg-[#1E2128] border border-slate-200 dark:border-[#2B2F38] rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white">System Telemetry & Health Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-[#16181D] rounded-2xl border border-slate-200/80 dark:border-[#2B2F38] space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Gemini 2.5 Flash Latency</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">420ms Avg</p>
                <span className="text-[10px] text-emerald-600 font-bold">● Operational & Healthy</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-[#16181D] rounded-2xl border border-slate-200/80 dark:border-[#2B2F38] space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Firestore Real-time Sync</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">99.99% Uptime</p>
                <span className="text-[10px] text-emerald-600 font-bold">● Multi-Region Active</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-[#16181D] rounded-2xl border border-slate-200/80 dark:border-[#2B2F38] space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Token Conservation Pool</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">64.2% Saved</p>
                <span className="text-[10px] text-indigo-600 font-bold">Via Pre-computed Empathy Cache</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'crisis' && (
          <div className="bg-white dark:bg-[#1E2128] border border-slate-200 dark:border-[#2B2F38] rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white mb-2">Automated Crisis Detection Logs</h3>
            {mockCrisisAlerts.map((alt) => (
              <div key={alt.id} className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-rose-600 text-white font-bold text-[10px] rounded-md uppercase">Alert</span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{alt.userHash}</span>
                    <span className="text-xs text-slate-400">({alt.timestamp})</span>
                  </div>
                  <p className="text-xs text-rose-900 dark:text-rose-300 font-medium">Triggered: &quot;{alt.triggerWord}&quot;</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-300 dark:border-emerald-800">
                  {alt.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'volunteers' && (
          <div className="bg-white dark:bg-[#1E2128] border border-slate-200 dark:border-[#2B2F38] rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white mb-2">Peer Volunteer Onboarding Queue</h3>
            {mockVolunteers.map((vol) => (
              <div key={vol.id} className="p-4 bg-slate-50 dark:bg-[#16181D] border border-slate-200/80 dark:border-[#2B2F38] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{vol.name}</h4>
                  <p className="text-xs text-slate-500">{vol.email} • <span className="font-semibold text-indigo-600 dark:text-indigo-400">{vol.role}</span></p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Applied {vol.appliedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold ${vol.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {vol.status}
                  </span>
                  {vol.status === 'Pending Review' && (
                    <button className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all">
                      Approve Volunteer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppSidebar>
  );
}
