'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Palette,
  Globe,
  MessageSquareHeart,
  Headphones,
  LayoutDashboard,
  Shield,
  Sun,
  Moon,
  Laptop,
  Check,
  Download,
  Trash2,
  KeyRound,
  UserCheck,
  Sparkles,
  Volume2,
  VolumeX,
  Eye,
  AlertTriangle,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Layers,
  Bell,
  Clock,
  Lock,
  FileText,
  Database,
  RefreshCw,
  Sliders,
  Sparkle
} from 'lucide-react';
import { useSettingsStore, SettingsTab } from '@/store/useSettingsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSanctuaryTranslation, SupportedLanguage } from '@/lib/i18n/useSanctuaryTranslation';
import { triggerGentleSanctuaryCelebration } from '@/components/SanctuaryConfetti';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SettingsModal() {
  const router = useRouter();
  const { isOpen, activeTab, preferences, closeSettings, setActiveTab, updatePreferences } = useSettingsStore();
  const { user, signup, login, mergeAccount, exportData, deleteAnonymousAndReset, checkAuth, logout } = useAuthStore();
  const { t, currentLanguage, setLanguage } = useSanctuaryTranslation();

  // Local UI state for Account Upgrade / Merging
  const [authMode, setAuthMode] = useState<'create' | 'login'>('create');
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authName, setAuthName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Registered User Profile / Security Edit states
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [securityFeedback, setSecurityFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Confirmation state for deleting anonymous data
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Download loading states
  const [journalDownloading, setJournalDownloading] = useState(false);
  const [chatsDownloading, setChatsDownloading] = useState(false);
  const [journalDeleting, setJournalDeleting] = useState(false);
  const [chatDeleting, setChatDeleting] = useState(false);

  // Fetch initial profile values when settings open
  useEffect(() => {
    if (user && isOpen) {
      setProfileName(user.name || '');
      setProfileBio((user as any).bio || '');
      setProfileAvatarUrl(user.avatarUrl || (user as any).avatar_url || '');
    }
  }, [user, isOpen]);

  // Clean local alerts on close
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setConfirmDelete(false);
        setAuthError(null);
        setAuthSuccess(null);
        setExportSuccess(false);
        setSecurityFeedback(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'appearance', label: 'Appearance', icon: <Palette size={16} />, desc: 'Theme, accent colors, text scaling & spacing density' },
    { id: 'language', label: 'Language & Locale', icon: <Globe size={16} />, desc: 'System-wide language translations' },
    { id: 'ai', label: 'AI Counselor', icon: <MessageSquareHeart size={16} />, desc: 'Tone, response length, memory toggles & empathy' },
    { id: 'audio', label: 'Ambience & Audio', icon: <Headphones size={16} />, desc: 'Background loop, volume & breathing rhythms' },
    { id: 'dashboard', label: 'Dashboard Layout', icon: <LayoutDashboard size={16} />, desc: 'Widget visibility & greeting preferences' },
    { id: 'notifications', label: 'Reminders & Sync', icon: <Bell size={16} />, desc: 'Time schedules for checks, meditations & summary updates' },
    { id: 'wellness', label: 'Wellness Goals', icon: <Sparkles size={16} />, desc: 'Meditation lengths, breathing exercises & habits targets' },
    { id: 'privacy', label: 'Identity & Privacy', icon: <Shield size={16} />, desc: 'History exports, deletion, cache wipe & data retention' },
    { id: 'security', label: 'Account Security', icon: <KeyRound size={16} />, desc: 'Profile details, passwords, Google links & sessions' }
  ];

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    setLanguage(lang);
    await updatePreferences({ language: lang });
  };

  const handleForgotPassword = async () => {
    if (!authEmail.trim()) {
      setAuthError('Please enter your email address first to reset your password.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthSuccess('If an account exists with this email, a reset link has been sent!');
      } else {
        setAuthError(data.error || 'Failed to send password reset email.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'An unexpected error occurred.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      if (authMode === 'create') {
        if (!authName.trim() || !authEmail.trim() || !authPass.trim()) {
          setAuthError('Please fill in your name, email, and password.');
          setAuthLoading(false);
          return;
        }
        const res = await signup(authEmail, authPass, authName);
        if (res.success) {
          setAuthSuccess('Account created! Your anonymous reflections & streak have been seamlessly linked.');
          triggerGentleSanctuaryCelebration();
        } else {
          setAuthError(res.error || 'Failed to create account');
        }
      } else {
        if (!authEmail.trim() || !authPass.trim()) {
          setAuthError('Please provide your email and password.');
          setAuthLoading(false);
          return;
        }
        const res = await mergeAccount(authEmail, authPass);
        if (res.success) {
          setAuthSuccess('Signed in successfully! All local device data has been merged.');
          triggerGentleSanctuaryCelebration();
        } else {
          setAuthError(res.error || 'Failed to sign in');
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'An unexpected error occurred.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const data = exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `calmnest_sanctuary_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  const handleDownloadJournals = async () => {
    setJournalDownloading(true);
    try {
      const { data, error } = await supabase
        .from('journals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        alert("No journal entries found to download.");
        return;
      }

      let content = "CALMNEST JOURNAL REFLECTIONS EXPORT\n";
      content += `Generated on: ${new Date().toLocaleString()}\n`;
      content += "========================================\n\n";
      data.forEach((j: any, idx: number) => {
        content += `${idx + 1}. ${j.title || 'Untitled Reflection'}\n`;
        content += `Date: ${new Date(j.created_at).toLocaleDateString()} | Mood: ${j.mood_tag || 'None'}\n`;
        content += "----------------------------------------\n";
        content += `${j.content}\n\n`;
      });

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `calmnest_journal_export_${new Date().toISOString().split('T')[0]}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("Failed to export journals: " + e.message);
    } finally {
      setJournalDownloading(false);
    }
  };

  const handleDownloadChats = async () => {
    setChatsDownloading(true);
    try {
      const { data: convs, error: cErr } = await supabase
        .from('conversations')
        .select('id, title, created_at');

      if (cErr) throw cErr;
      if (!convs || convs.length === 0) {
        alert("No chat conversations found to download.");
        return;
      }

      let content = "CALMNEST AI COMPANION CONVERSATIONS EXPORT\n";
      content += `Generated on: ${new Date().toLocaleString()}\n`;
      content += "========================================\n\n";

      for (const c of convs) {
        content += `Session: ${c.title || 'New Session'}\n`;
        content += `Started: ${new Date(c.created_at).toLocaleString()}\n`;
        content += "----------------------------------------\n";

        const { data: msgs, error: mErr } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', c.id)
          .order('created_at', { ascending: true });

        if (!mErr && msgs) {
          msgs.forEach((m: any) => {
            const roleName = m.role === 'user' ? 'USER' : 'CALMNEST AI';
            content += `[${roleName} - ${new Date(m.created_at).toLocaleTimeString()}]: ${m.content}\n`;
          });
        }
        content += "\n========================================\n\n";
      }

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `calmnest_conversations_export_${new Date().toISOString().split('T')[0]}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("Failed to export chats: " + e.message);
    } finally {
      setChatsDownloading(false);
    }
  };

  const handleDeleteConversationHistory = async () => {
    if (confirm("Are you sure you want to delete all chat history? This will delete all messages and conversations permanently. This action is irreversible.")) {
      setChatDeleting(true);
      try {
        const { error } = await supabase
          .from('conversations')
          .delete()
          .or(`user_id.eq.${user?.id},anon_uuid.eq.${user?.id}`);

        if (error) throw error;
        alert("Conversation history deleted successfully.");
        router.refresh();
      } catch (e: any) {
        alert("Failed to delete chat history: " + e.message);
      } finally {
        setChatDeleting(false);
      }
    }
  };

  const handleDeleteJournalHistory = async () => {
    if (confirm("Are you sure you want to delete all journal entries? This will clear your entire diary permanently. This action is irreversible.")) {
      setJournalDeleting(true);
      try {
        const { error } = await supabase
          .from('journals')
          .delete()
          .or(`user_id.eq.${user?.id},anon_uuid.eq.${user?.id}`);

        if (error) throw error;
        alert("Journal history deleted successfully.");
        router.refresh();
      } catch (e: any) {
        alert("Failed to delete journal history: " + e.message);
      } finally {
        setJournalDeleting(false);
      }
    }
  };

  const handleClearLocalCache = () => {
    if (confirm("Are you sure you want to clear your local cache? This will reset custom soundscapes, themes, volume sliders, and widget layouts, but will not delete your account database records.")) {
      if (typeof window !== 'undefined') {
        const keysToRemove = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith('calmnest_') && key !== 'calmnest_anon_uuid') {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => window.localStorage.removeItem(k));
        alert("Local cache cleared successfully.");
        window.location.reload();
      }
    }
  };

  const handleReset = () => {
    deleteAnonymousAndReset();
    closeSettings();
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        setProfileAvatarUrl(data.url);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      alert('Upload failed');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setSecurityFeedback(null);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          bio: profileBio,
          avatarUrl: profileAvatarUrl
        })
      });
      const data = await res.json();
      if (data.success) {
        setSecurityFeedback({ type: 'success', text: 'Profile updated successfully!' });
        checkAuth(); // Refresh user session details in store
      } else {
        setSecurityFeedback({ type: 'error', text: data.error || 'Failed to update profile.' });
      }
    } catch (err: any) {
      setSecurityFeedback({ type: 'error', text: err.message || 'An error occurred.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setSecurityFeedback({ type: 'error', text: 'Both passwords are required.' });
      return;
    }
    if (newPassword.length < 8) {
      setSecurityFeedback({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    setPasswordLoading(true);
    setSecurityFeedback(null);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        setSecurityFeedback({ type: 'success', text: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setSecurityFeedback({ type: 'error', text: data.error || 'Failed to change password. Make sure current password is correct.' });
      }
    } catch (err: any) {
      setSecurityFeedback({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (confirm('Sign out from all active sessions?')) {
      try {
        await supabase.auth.signOut({ scope: 'global' });
        closeSettings();
        logout();
        router.push('/login');
      } catch (e) {}
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('WARNING: THIS IS IRREVERSIBLE. Delete your account permanently? All journal reflections, moods, and settings will be lost.')) {
      try {
        const res = await fetch('/api/auth/profile', {
          method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
          closeSettings();
          logout();
          router.push('/signup');
        } else {
          alert('Failed to delete account');
        }
      } catch (e) {
        alert('An error occurred');
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeSettings}
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', duration: 0.45, bounce: 0.15 }}
          className="relative w-full max-w-4xl bg-[#FAF9F6] dark:bg-[#1C1F26] border border-slate-200/80 dark:border-[#2B2F38] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh] sm:max-h-[80vh] z-10"
        >
          {/* Left Navigation Sidebar */}
          <aside className="w-full md:w-64 bg-slate-100/60 dark:bg-[#16181D]/80 border-b md:border-b-0 md:border-r border-slate-200/70 dark:border-[#2B2F38] p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between md:justify-start gap-2.5 px-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center shadow-2xs">
                  <Sparkles size={14} />
                </div>
                <div>
                  <h3 className="font-medium text-sm text-slate-900 dark:text-slate-100 leading-none">Sanctuary Settings</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Personalize your safe space</p>
                </div>
                <button
                  onClick={closeSettings}
                  className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors ml-auto"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Tab List */}
              <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none">
                {tabs.map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-left shrink-0 md:shrink ${
                        active
                          ? 'bg-white dark:bg-[#252932] text-primary dark:text-[#A1C2D4] shadow-2xs border border-slate-200/60 dark:border-slate-700/50'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-[#1E2128] hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <span className={active ? 'text-primary dark:text-[#A1C2D4]' : 'text-slate-400 dark:text-slate-500'}>
                        {tab.icon}
                      </span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Mini Badge */}
            <div className="hidden md:block pt-4 border-t border-slate-200/60 dark:border-[#2B2F38] text-center">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">CalmNest v2.5 Production</p>
              <p className="text-[10px] text-[#6B907B] dark:text-[#A8C8B5] mt-0.5">Encrypted Device Identity</p>
            </div>
          </aside>

          {/* Right Main Content Area */}
          <main className="flex-1 flex flex-col min-h-0 overflow-y-auto p-5 sm:p-7 bg-white dark:bg-[#1C1F26]">
            {/* Top Bar for Desktop */}
            <div className="hidden md:flex items-center justify-between pb-4 border-b border-slate-200/70 dark:border-[#2B2F38] mb-6">
              <div>
                <h2 className="text-base font-medium text-slate-900 dark:text-slate-100">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {tabs.find(t => t.id === activeTab)?.desc}
                </p>
              </div>
              <button
                onClick={closeSettings}
                className="p-2 bg-slate-100 dark:bg-[#252932] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
                title="Close settings"
              >
                <X size={16} />
              </button>
            </div>

            {/* TAB CONTENT: APPEARANCE */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                    Color Theme
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'light', label: 'Light Sanctuary', icon: <Sun size={18} /> },
                      { id: 'dark', label: 'Dark Restful', icon: <Moon size={18} /> },
                      { id: 'system', label: 'System Sync', icon: <Laptop size={18} /> },
                    ].map((th) => {
                      const selected = preferences.theme === th.id;
                      return (
                        <button
                          key={th.id}
                          onClick={() => updatePreferences({ theme: th.id as any })}
                          className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-xs font-medium transition-all ${
                            selected
                              ? 'bg-primary/10 border-primary text-primary dark:bg-primary/20 dark:text-[#A1C2D4] shadow-2xs'
                              : 'border-slate-200 dark:border-[#2B2F38] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#252932]'
                          }`}
                        >
                          {th.icon}
                          <span>{th.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                    Accent Color Theme
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'slate', label: 'Slate Blue', color: 'bg-primary' },
                      { id: 'emerald', label: 'Emerald Sage', color: 'bg-[#6B907B]' },
                      { id: 'violet', label: 'Lavender Violet', color: 'bg-[#8D80A9]' },
                      { id: 'rose', label: 'Blush Rose', color: 'bg-[#B87B7B]' },
                      { id: 'amber', label: 'Sand Amber', color: 'bg-[#C1885C]' },
                      { id: 'teal', label: 'Sanctuary Teal', color: 'bg-[#5C9794]' },
                      { id: 'indigo', label: 'Deep Indigo', color: 'bg-[#5C6597]' },
                    ].map((ac) => {
                      const selected = (preferences.accentColor || 'slate') === ac.id;
                      return (
                        <button
                          key={ac.id}
                          onClick={() => updatePreferences({ accentColor: ac.id as any })}
                          className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-medium transition-all text-left ${
                            selected
                              ? 'bg-slate-100 dark:bg-[#252932] border-primary dark:border-[#A1C2D4]'
                              : 'border-slate-200 dark:border-[#2B2F38] hover:bg-slate-50 dark:hover:bg-[#252932]'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full ${ac.color} shrink-0`} />
                          <span className="truncate">{ac.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                      Font Family
                    </h4>
                    <div className="space-y-2">
                      {[
                        { id: 'standard', label: 'Standard Sans', preview: 'Arial / System Sans-serif' },
                        { id: 'serif', label: 'Elegant Serif', preview: 'Times / Georgia Reader' },
                        { id: 'monospace', label: 'Monospace Code', preview: 'Courier / SF Mono Style' },
                        { id: 'dyslexia', label: 'Dyslexia Friendly', preview: 'Comic Styled Accessibility' },
                      ].map((fn) => {
                        const selected = (preferences.fontFamily || 'standard') === fn.id;
                        return (
                          <button
                            key={fn.id}
                            onClick={() => updatePreferences({ fontFamily: fn.id as any })}
                            className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                              selected
                                ? 'bg-primary/15 border-primary text-[#4A725D] dark:text-[#A8C8B5] font-medium'
                                : 'border-slate-200 dark:border-[#2B2F38] text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#252932]'
                            }`}
                          >
                            <div>
                              <span className="text-xs block font-semibold">{fn.label}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 block">{fn.preview}</span>
                            </div>
                            {selected && <Check size={14} className="text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                      Font Comfort Scale
                    </h4>
                    <div className="space-y-2">
                      {[
                        { id: 'regular', label: 'Standard (16px)', desc: 'Balanced & airy' },
                        { id: 'large', label: 'Large (18px)', desc: 'Easy reading' },
                        { id: 'xlarge', label: 'Extra Large (20px)', desc: 'High accessibility' },
                      ].map((fs) => {
                        const selected = preferences.fontSize === fs.id;
                        return (
                          <button
                            key={fs.id}
                            onClick={() => updatePreferences({ fontSize: fs.id as any })}
                            className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                              selected
                                ? 'bg-primary/15 border-primary text-[#4A725D] dark:text-[#A8C8B5] font-medium'
                                : 'border-slate-200 dark:border-[#2B2F38] text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#252932]'
                            }`}
                          >
                            <div>
                              <span className="text-xs block font-semibold">{fs.label}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">{fs.desc}</span>
                            </div>
                            {selected && <Check size={14} className="text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Layout Density
                    </h4>
                    <div className="flex rounded-xl border border-slate-200 dark:border-[#2B2F38] overflow-hidden">
                      {[
                        { id: 'comfortable', label: 'Comfortable' },
                        { id: 'compact', label: 'Compact' }
                      ].map((ld) => {
                        const selected = (preferences.layoutDensity || 'comfortable') === ld.id;
                        return (
                          <button
                            key={ld.id}
                            onClick={() => updatePreferences({ layoutDensity: ld.id as any })}
                            className={`flex-1 py-2 text-center text-xs font-medium transition-colors ${
                              selected
                                ? 'bg-primary text-white'
                                : 'bg-slate-50 dark:bg-[#1E2128]/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            {ld.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Reduced Motion
                    </h4>
                    <div className="flex rounded-xl border border-slate-200 dark:border-[#2B2F38] overflow-hidden">
                      {[
                        { id: 'gentle', label: 'Gentle Motion' },
                        { id: 'reduced', label: 'No Animations' }
                      ].map((ms) => {
                        const selected = (preferences.motionStyle || 'gentle') === ms.id;
                        return (
                          <button
                            key={ms.id}
                            onClick={() => updatePreferences({ motionStyle: ms.id as any })}
                            className={`flex-1 py-2 text-center text-xs font-medium transition-colors ${
                              selected
                                ? 'bg-primary text-white'
                                : 'bg-slate-50 dark:bg-[#1E2128]/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            {ms.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      High Contrast Mode
                    </h4>
                    <div className="flex rounded-xl border border-slate-200 dark:border-[#2B2F38] overflow-hidden">
                      {[
                        { id: 'normal', label: 'Standard Colors' },
                        { id: 'high-contrast', label: 'High Contrast' }
                      ].map((hc) => {
                        const selected = (preferences.accessibilityTheme || 'normal') === hc.id;
                        return (
                          <button
                            key={hc.id}
                            onClick={() => updatePreferences({ accessibilityTheme: hc.id as any })}
                            className={`flex-1 py-2 text-center text-xs font-medium transition-colors ${
                              selected
                                ? 'bg-primary text-white'
                                : 'bg-slate-50 dark:bg-[#1E2128]/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            {hc.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: LANGUAGE */}
            {activeTab === 'language' && (
              <div className="space-y-5">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Choose the language in which you feel most comfortable receiving support, quotes, and reflections. CalmNest automatically adapts its empathetic guidance to your selected culture and dialect.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {[
                    { code: 'en', native: 'English', sub: 'Global English' },
                    { code: 'hi', native: 'हिंदी (Hindi)', sub: 'भारतीय हिंदी' },
                    { code: 'pa', native: 'ਪੰਜਾਬੀ (Punjabi)', sub: 'ਗੁਰਮੁਖੀ ਪੰਜਾਬੀ' },
                  ].map((item) => {
                    const selected = currentLanguage === item.code;
                    return (
                      <button
                        key={item.code}
                        onClick={() => handleLanguageChange(item.code as SupportedLanguage)}
                        className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between ${
                          selected
                            ? 'bg-primary/10 border-primary shadow-2xs'
                            : 'border-slate-200 dark:border-[#2B2F38] hover:bg-slate-50 dark:hover:bg-[#252932]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-base font-medium ${selected ? 'text-primary dark:text-[#A1C2D4]' : 'text-slate-800 dark:text-slate-200'}`}>
                            {item.native}
                          </span>
                          {selected && (
                            <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{item.sub}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-[#252932]/70 border border-slate-200/70 dark:border-[#2B2F38] flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                  <Globe size={18} className="text-primary shrink-0" />
                  <span>
                    Need another language? Our AI Sanctuary Counselor supports real-time conversational understanding in over 40 regional dialects during chat sessions.
                  </span>
                </div>
              </div>
            )}

            {/* TAB CONTENT: AI SANCTUARY */}
            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                    Counseling Style & Tone
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { id: 'counselor', label: 'Warm Counselor', desc: 'Default validation and empathetic support.' },
                      { id: 'companion', label: 'Sanctuary Friend', desc: 'Soothing check-ins, friendly and highly casual conversational style.' },
                      { id: 'philosopher', label: 'Reflective Sage', desc: 'Philosophic quotes, spacious reflection, and meditative insights.' },
                      { id: 'mentor', label: 'Empathetic Mentor', desc: 'Direct feedback, guidance steps, and goal adjustments.' }
                    ].map((voice) => {
                      const selected = (preferences.aiPersonality || 'counselor') === voice.id;
                      return (
                        <button
                          key={voice.id}
                          onClick={() => updatePreferences({ aiPersonality: voice.id as any })}
                          className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all text-left ${
                            selected
                              ? 'bg-primary/10 border-primary shadow-2xs'
                              : 'border-slate-200 dark:border-[#2B2F38] hover:bg-slate-50 dark:hover:bg-[#252932]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-xs font-bold ${selected ? 'text-primary dark:text-[#A1C2D4]' : 'text-slate-800 dark:text-slate-200'}`}>
                                {voice.label}
                              </span>
                              {selected && <Check size={12} className="text-primary" />}
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                              {voice.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                      Response Style
                    </h4>
                    <div className="flex rounded-xl border border-slate-200 dark:border-[#2B2F38] overflow-hidden">
                      {[
                        { id: 'short', label: 'Brief' },
                        { id: 'medium', label: 'Balanced' },
                        { id: 'long', label: 'Detailed' }
                      ].map((rl) => {
                        const selected = (preferences.aiResponseLength || 'medium') === rl.id;
                        return (
                          <button
                            key={rl.id}
                            onClick={() => updatePreferences({ aiResponseLength: rl.id as any })}
                            className={`flex-1 py-2 text-center text-xs font-medium transition-colors ${
                              selected
                                ? 'bg-primary text-white'
                                : 'bg-slate-50 dark:bg-[#1E2128]/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            {rl.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                      Conversational Empathy
                    </h4>
                    <div className="flex rounded-xl border border-slate-200 dark:border-[#2B2F38] overflow-hidden">
                      {[
                        { id: 'high', label: 'Deep' },
                        { id: 'moderate', label: 'Moderate' },
                        { id: 'low', label: 'Objective' }
                      ].map((el) => {
                        const selected = (preferences.aiEmpathyLevel || 'high') === el.id;
                        return (
                          <button
                            key={el.id}
                            onClick={() => updatePreferences({ aiEmpathyLevel: el.id as any })}
                            className={`flex-1 py-2 text-center text-xs font-medium transition-colors ${
                              selected
                                ? 'bg-primary text-white'
                                : 'bg-slate-50 dark:bg-[#1E2128]/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            {el.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                      Chat Input Language
                    </h4>
                    <select
                      value={preferences.aiPreferredLanguage || 'auto'}
                      onChange={(e) => updatePreferences({ aiPreferredLanguage: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-white dark:bg-[#1E2128] text-xs text-slate-800 dark:text-white focus:outline-none focus:border-primary"
                    >
                      <option value="auto">Auto-Detect Dialect</option>
                      <option value="en">Force English</option>
                      <option value="hi">Force हिन्दी (Hindi)</option>
                      <option value="pa">Force ਪੰਜਾਬੀ (Punjabi)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    AI Capabilities & Memory
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'aiStreamingEnabled', label: 'Real-Time Streaming Response', desc: 'Stream messages token-by-token for a natural flow' },
                      { key: 'aiSuggestedQuestions', label: 'Empathetic Follow-Up Suggestions', desc: 'Display suggested actions or questions after replies' },
                      { key: 'aiMemoryEnabled', label: 'Sanctuary Memory Persistence', desc: 'Allow companion to recall your background and goals' },
                      { key: 'aiDailyReflection', label: 'AI Daily Journal Reflection Analyser', desc: 'Prompt companion to help you reflect on your diary logs' }
                    ].map((opt) => {
                      const isChecked = (preferences as any)[opt.key] !== false;
                      return (
                        <div
                          key={opt.key}
                          onClick={() => updatePreferences({ [opt.key]: !isChecked })}
                          className="p-3 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-slate-50/50 dark:bg-[#252932]/20 hover:bg-slate-100/50 dark:hover:bg-[#252932]/40 flex items-center justify-between cursor-pointer transition-all"
                        >
                          <div>
                            <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block">{opt.label}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">{opt.desc}</span>
                          </div>
                          <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors flex items-center shrink-0 ml-2 ${
                            isChecked ? 'bg-primary justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                          }`}>
                            <span className="w-3.5 h-3.5 bg-white rounded-full shadow-xs" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: MEDITATION & AUDIO */}
            {activeTab === 'audio' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                    Default Background Ambience
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'rain', label: 'Gentle Rain', icon: '🌧️' },
                      { id: 'ocean', label: 'Ocean Waves', icon: '🌊' },
                      { id: 'forest', label: 'Forest Breeze', icon: '🌲' },
                      { id: 'silence', label: 'Pure Silence', icon: '🔇' },
                    ].map((snd) => {
                      const selected = preferences.ambientSound === snd.id;
                      return (
                        <button
                          key={snd.id}
                          onClick={() => updatePreferences({ ambientSound: snd.id as any })}
                          className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                            selected
                              ? 'bg-[#6B907B]/15 border-[#6B907B] text-[#4A725D] dark:text-[#A8C8B5] shadow-2xs font-medium'
                              : 'border-slate-200 dark:border-[#2B2F38] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#252932]'
                          }`}
                        >
                          <span className="text-xl">{snd.icon}</span>
                          <span className="text-xs">{snd.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Soundscape Volume
                    </h4>
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-slate-50/50 dark:bg-[#1E2128] flex items-center gap-3">
                      {preferences.ambientVolume === 0 ? <VolumeX size={16} className="text-slate-400" /> : <Volume2 size={16} className="text-primary" />}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={preferences.ambientVolume ?? 50}
                        onChange={(e) => updatePreferences({ ambientVolume: parseInt(e.target.value) })}
                        className="flex-1 accent-primary"
                      />
                      <span className="text-xs font-mono w-8 text-right">{preferences.ambientVolume ?? 50}%</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Sleep Timer Preference
                    </h4>
                    <div className="flex rounded-xl border border-slate-200 dark:border-[#2B2F38] overflow-hidden">
                      {[
                        { id: 0, label: 'Continuous Loop' },
                        { id: 15, label: '15 Mins' },
                        { id: 30, label: '30 Mins' },
                        { id: 60, label: '60 Mins' }
                      ].map((tm) => {
                        const selected = (preferences.ambientTimer ?? 0) === tm.id;
                        return (
                          <button
                            key={tm.id}
                            onClick={() => updatePreferences({ ambientTimer: tm.id })}
                            className={`flex-1 py-3 text-center text-xs font-medium transition-colors ${
                              selected
                                ? 'bg-primary text-white'
                                : 'bg-slate-50 dark:bg-[#1E2128]/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            {tm.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Playback Controls
                    </h4>
                    <div className="space-y-2">
                      {[
                        { key: 'ambientAutoResume', label: 'Auto-Resume Background Audio', desc: 'Automatically resume sound playback on page start' },
                        { key: 'ambientLoop', label: 'Loop Favorite Ambient Mixes', desc: 'Keep track playing continuously unless sleep timer fires' }
                      ].map((opt) => {
                        const isChecked = (preferences as any)[opt.key] !== false;
                        return (
                          <div
                            key={opt.key}
                            onClick={() => updatePreferences({ [opt.key]: !isChecked })}
                            className="p-3 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-slate-50/50 dark:bg-[#252932]/20 hover:bg-slate-100/50 dark:hover:bg-[#252932]/40 flex items-center justify-between cursor-pointer transition-all animate-fade-in"
                          >
                            <div>
                              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block">{opt.label}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">{opt.desc}</span>
                            </div>
                            <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors flex items-center shrink-0 ml-2 ${
                              isChecked ? 'bg-primary justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                            }`}>
                              <span className="w-3.5 h-3.5 bg-white rounded-full shadow-xs" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Default Breathing Rhythm
                    </h4>
                    <div className="space-y-2">
                      {[
                        { id: '4-7-8', label: '4-7-8 Deep Rest', desc: 'Inhale 4s, Hold 7s, Exhale 8s. Balances anxiety.' },
                        { id: 'box', label: 'Box Breathing', desc: 'Inhale 4s, Hold 4s, Exhale 4s, Hold 4s. Promotes focus.' },
                        { id: 'coherent', label: 'Coherent Rhythm', desc: 'Inhale 5.5s, Exhale 5.5s. Balances heart variability.' },
                      ].map((br) => {
                        const selected = preferences.defaultBreathingRhythm === br.id;
                        return (
                          <button
                            key={br.id}
                            onClick={() => updatePreferences({ defaultBreathingRhythm: br.id as any })}
                            className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                              selected
                                ? 'bg-primary/15 border-primary text-[#4A725D] dark:text-[#A8C8B5] font-medium'
                                : 'border-slate-200 dark:border-[#2B2F38] text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#252932]'
                            }`}
                          >
                            <div>
                              <span className="text-xs block font-semibold">{br.label}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">{br.desc}</span>
                            </div>
                            {selected && <Check size={14} className="text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: DASHBOARD CARDS */}
            {activeTab === 'dashboard' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                  Toggle the check-in cards and welcome panels you wish to see on your primary Sanctuary Dashboard. Hide anything that feels cluttering.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Default Landing Page
                    </h4>
                    <select
                      value={preferences.dashboardLandingPage || 'dashboard'}
                      onChange={(e) => updatePreferences({ dashboardLandingPage: e.target.value as any })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-white dark:bg-[#1E2128] text-xs text-slate-800 dark:text-white focus:outline-none focus:border-primary"
                    >
                      <option value="dashboard">Sanctuary Dashboard</option>
                      <option value="chat">AI companion Chatroom</option>
                      <option value="journal">Reflections Journal</option>
                      <option value="breathing">Breathing Studio</option>
                    </select>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Landing Page Greeting
                    </h4>
                    <div className="flex rounded-xl border border-slate-200 dark:border-[#2B2F38] overflow-hidden h-10">
                      {[
                        { id: true, label: 'Show Welcome' },
                        { id: false, label: 'Hide Welcome' }
                      ].map((gw) => {
                        const selected = (preferences.dashboardGreetingVisible ?? true) === gw.id;
                        return (
                          <button
                            key={gw.label}
                            type="button"
                            onClick={() => updatePreferences({ dashboardGreetingVisible: gw.id })}
                            className={`flex-1 text-center text-xs font-medium transition-colors ${
                              selected
                                ? 'bg-primary text-white'
                                : 'bg-slate-50 dark:bg-[#1E2128]/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            {gw.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Active Widget Cards
                </h4>
                <div className="space-y-2.5">
                  {[
                    { key: 'dashboardShowQuote', label: 'Daily Mindful Quote Check-In', desc: 'Soothing daily quote banner validating self-care and patience' },
                    { key: 'dashboardShowMood', label: '5-Point Mental Energy Check-In Bar', desc: 'Log mood tag, energy index, and gratitude check off' },
                    { key: 'dashboardShowQuickChat', label: 'AI Companion Quick Check-In Card', desc: 'Instant access message box to trigger chats with your companion' },
                    { key: 'dashboardShowHabits', label: 'Daily Self-Care Routines & Habits', desc: 'Tick off check list routines (mindful walking, screen break, sleep hygiene)' },
                    { key: 'dashboardShowMeditation', label: 'Interactive Breathing Studio Teaser', desc: 'One-click launch to deep coherent breathing practice' },
                  ].map((card) => {
                    const isChecked = (preferences as any)[card.key] !== false;
                    return (
                      <div
                        key={card.key}
                        onClick={() => updatePreferences({ [card.key]: !isChecked } as any)}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-slate-50/50 dark:bg-[#252932]/40 hover:bg-slate-100/70 dark:hover:bg-[#252932] flex items-center justify-between cursor-pointer transition-all"
                      >
                        <div>
                          <h5 className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">{card.label}</h5>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{card.desc}</p>
                        </div>
                        <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors flex items-center ${
                          isChecked ? 'bg-primary justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                        }`}>
                          <span className="w-3.5 h-3.5 bg-white rounded-full shadow-xs" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT: REMINDERS & NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                    Personalized Reminders Scheduler
                  </h4>
                  
                  <div className="space-y-3">
                    {/* Check-In Reminder details */}
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-slate-50/30 dark:bg-[#252932]/25">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">Daily check-in Alert</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Push notification check-ins to monitor streak updates</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => updatePreferences({ remindCheckIn: !preferences.remindCheckIn })}
                          className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            preferences.remindCheckIn ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                            preferences.remindCheckIn ? 'translate-x-3.5' : 'translate-x-0'
                          }`}
                          />
                        </button>
                      </div>
                      
                      {preferences.remindCheckIn && (
                        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-750">
                          <div>
                            <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">Time</label>
                            <input
                              type="time"
                              value={preferences.remindCheckInTime || '09:00'}
                              onChange={(e) => updatePreferences({ remindCheckInTime: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-250 dark:border-slate-750 bg-white dark:bg-[#16181D] text-xs text-slate-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">Frequency</label>
                            <select
                              value={preferences.remindCheckInFrequency || 'daily'}
                              onChange={(e) => updatePreferences({ remindCheckInFrequency: e.target.value as any })}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-250 dark:border-slate-750 bg-white dark:bg-[#16181D] text-xs text-slate-800 dark:text-white focus:outline-none"
                            >
                              <option value="daily">Daily check</option>
                              <option value="weekly">Weekly check</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Journal Reminder */}
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-slate-50/30 dark:bg-[#252932]/25 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">Journal Reflections Reminder</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Encourage evening reflections writing</span>
                      </div>
                      <div className="flex items-center gap-3.5">
                        {preferences.remindJournal && (
                          <input
                            type="time"
                            value={preferences.remindJournalTime || '21:00'}
                            onChange={(e) => updatePreferences({ remindJournalTime: e.target.value })}
                            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16181D] text-xs"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => updatePreferences({ remindJournal: !preferences.remindJournal })}
                          className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            preferences.remindJournal ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                            preferences.remindJournal ? 'translate-x-3.5' : 'translate-x-0'
                          }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Meditation Reminder */}
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-slate-50/30 dark:bg-[#252932]/25 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">Meditation Studio Reminder</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Encourage quiet meditation breaks</span>
                      </div>
                      <div className="flex items-center gap-3.5">
                        {preferences.remindMeditation && (
                          <input
                            type="time"
                            value={preferences.remindMeditationTime || '18:00'}
                            onChange={(e) => updatePreferences({ remindMeditationTime: e.target.value })}
                            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16181D] text-xs"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => updatePreferences({ remindMeditation: !preferences.remindMeditation })}
                          className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            preferences.remindMeditation ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                            preferences.remindMeditation ? 'translate-x-3.5' : 'translate-x-0'
                          }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Habit Reminder */}
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-slate-50/30 dark:bg-[#252932]/25 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">Self-Care Habits Reminder</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Reminder to check seedlings progress</span>
                      </div>
                      <div className="flex items-center gap-3.5">
                        {preferences.remindHabit && (
                          <input
                            type="time"
                            value={preferences.remindHabitTime || '08:00'}
                            onChange={(e) => updatePreferences({ remindHabitTime: e.target.value })}
                            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16181D] text-xs"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => updatePreferences({ remindHabit: !preferences.remindHabit })}
                          className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            preferences.remindHabit ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                            preferences.remindHabit ? 'translate-x-3.5' : 'translate-x-0'
                          }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                    Delivery Preferences
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'emailNotifications', label: 'Email Notifications Support', desc: 'Receive summaries and reports directly in your inbox' },
                      { key: 'pushNotifications', label: 'Browser Push Notifications (Future Ready)', desc: 'Receive instant visual alerts inside this browser' },
                      { key: 'remindWeeklySummary', label: 'Weekly Self-Care Mindful Summary', desc: 'Receive a report reflecting habit streaks and mood summaries' },
                      { key: 'remindMonthlyReport', label: 'Monthly Wellness Analysis Report', desc: 'Deconstruct long term reflections and assessment recommendations' },
                      { key: 'remindProductUpdates', label: 'CalmNest Articles and Newsletters', desc: 'Get updates on mental health features and sanctuary guides' }
                    ].map((opt) => {
                      const isChecked = (preferences as any)[opt.key] !== false;
                      return (
                        <div
                          key={opt.key}
                          onClick={() => updatePreferences({ [opt.key]: !isChecked })}
                          className="p-3 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-slate-50/50 dark:bg-[#252932]/20 hover:bg-slate-100/50 dark:hover:bg-[#252932]/40 flex items-center justify-between cursor-pointer transition-all"
                        >
                          <div>
                            <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block">{opt.label}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">{opt.desc}</span>
                          </div>
                          <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors flex items-center shrink-0 ml-2 ${
                            isChecked ? 'bg-primary justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                          }`}>
                            <span className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-[#1E2128] flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">Device Timezone Alignment</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Schedules adjust to this region</span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={preferences.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16181D] text-slate-500 font-mono text-right"
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT: WELLNESS GOALS */}
            {activeTab === 'wellness' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                    Habits and Routines Targets
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">Meditation length goal</label>
                      <select
                        value={preferences.wellnessMeditationLength ?? 10}
                        onChange={(e) => updatePreferences({ wellnessMeditationLength: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-white dark:bg-[#1E2128] text-xs text-slate-800 dark:text-white focus:outline-none"
                      >
                        <option value="5">5 Minutes</option>
                        <option value="10">10 Minutes</option>
                        <option value="15">15 Minutes</option>
                        <option value="20">20 Minutes</option>
                        <option value="30">30 Minutes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">Breathing technique goal</label>
                      <select
                        value={preferences.wellnessBreathingExercise || '4-7-8'}
                        onChange={(e) => updatePreferences({ wellnessBreathingExercise: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-white dark:bg-[#1E2128] text-xs text-slate-800 dark:text-white focus:outline-none"
                      >
                        <option value="4-7-8">Relaxation (4-7-8)</option>
                        <option value="box">Box breathing (4-4-4-4)</option>
                        <option value="coherent">Coherent (5.5s-5.5s)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">Daily Self-Care Targets</label>
                      <select
                        value={preferences.wellnessHabitGoalsCount ?? 3}
                        onChange={(e) => updatePreferences({ wellnessHabitGoalsCount: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-white dark:bg-[#1E2128] text-xs text-slate-800 dark:text-white focus:outline-none"
                      >
                        <option value="1">1 Active Seedling</option>
                        <option value="3">3 Active Seedlings</option>
                        <option value="5">5 Active Seedlings</option>
                        <option value="7">7 Active Seedlings</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                      Daily Mindful Minutes Goal
                    </h4>
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-slate-50/50 dark:bg-[#1E2128] flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">Meditation & Breathing Goal</span>
                        <span className="text-xs font-mono font-bold text-primary">{preferences.wellnessDailyGoalMinutes ?? 15} mins/day</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="60"
                        step="5"
                        value={preferences.wellnessDailyGoalMinutes ?? 15}
                        onChange={(e) => updatePreferences({ wellnessDailyGoalMinutes: parseInt(e.target.value) })}
                        className="w-full accent-primary mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                      Mood Logging reminder alert
                    </h4>
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-slate-50/50 dark:bg-[#1E2128] flex flex-col gap-2.5">
                      <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Reminder notification frequency</label>
                      <select
                        value={preferences.wellnessMoodFrequency || 'daily'}
                        onChange={(e) => updatePreferences({ wellnessMoodFrequency: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200/80 dark:border-[#2B2F38] bg-white dark:bg-[#1C1F26] text-xs text-slate-800 dark:text-white focus:outline-none"
                      >
                        <option value="daily">Once a day (Evening check)</option>
                        <option value="twice_daily">Twice daily (Morning & Evening)</option>
                        <option value="hourly">Hourly supportive checks (Anxious periods)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                    Supportive Gratitude & Sleep Cues
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Sleep reminder */}
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-slate-50/30 dark:bg-[#252932]/25">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">Mindful Wind Down Reminder</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Encourage sleep prep and soundscape playing</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => updatePreferences({ wellnessSleepReminder: !preferences.wellnessSleepReminder })}
                          className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            preferences.wellnessSleepReminder ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                            preferences.wellnessSleepReminder ? 'translate-x-3.5' : 'translate-x-0'
                          }`}
                          />
                        </button>
                      </div>
                      
                      {preferences.wellnessSleepReminder && (
                        <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-750 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-medium">Bedtime Alert Time</span>
                          <input
                            type="time"
                            value={preferences.wellnessSleepReminderTime || '22:30'}
                            onChange={(e) => updatePreferences({ wellnessSleepReminderTime: e.target.value })}
                            className="px-2.5 py-1 rounded-lg border border-slate-250 dark:border-slate-750 bg-white dark:bg-[#16181D] text-xs text-slate-800 dark:text-white"
                          />
                        </div>
                      )}
                    </div>

                    {/* Gratitude reminder */}
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-slate-50/30 dark:bg-[#252932]/25">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">Daily Gratitude Reflection Reminder</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Reminder to record daily thankfulness checks</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => updatePreferences({ wellnessGratitudeReminder: !preferences.wellnessGratitudeReminder })}
                          className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            preferences.wellnessGratitudeReminder ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                            preferences.wellnessGratitudeReminder ? 'translate-x-3.5' : 'translate-x-0'
                          }`}
                          />
                        </button>
                      </div>
                      
                      {preferences.wellnessGratitudeReminder && (
                        <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-750 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-medium">Reflection Alert Time</span>
                          <input
                            type="time"
                            value={preferences.wellnessGratitudeReminderTime || '20:00'}
                            onChange={(e) => updatePreferences({ wellnessGratitudeReminderTime: e.target.value })}
                            className="px-2.5 py-1 rounded-lg border border-slate-250 dark:border-slate-750 bg-white dark:bg-[#16181D] text-xs text-slate-800 dark:text-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: IDENTITY & PRIVACY */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                {/* Current Identity Card */}
                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-[#2B2F38] bg-slate-50/80 dark:bg-[#252932]/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                        user?.isAnonymous ? 'bg-primary' : 'bg-[#6B907B]'
                      }`}>
                        {user?.isAnonymous ? <Shield size={18} /> : <UserCheck size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">
                            {user?.isAnonymous ? 'Anonymous Sanctuary Guest' : user?.name || 'Sanctuary Member'}
                          </h4>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            user?.isAnonymous
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                            {user?.isAnonymous ? 'Local Device ID' : 'Synchronized Account'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate max-w-xs sm:max-w-md">
                          {user?.email || `Anon ID: ${user?.id?.slice(0, 16)}...`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <span className="text-xs text-slate-400">Current Streak</span>
                      <div className="font-mono text-sm font-medium text-[#6B907B] dark:text-[#A8C8B5]">
                        {user?.streak || preferences.streakDays || 1} Days Active
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Upgrade & Merging Section (Only when anonymous) */}
                {user?.isAnonymous && (
                  <div className="p-5 rounded-xl border border-primary/40 dark:border-primary/50 bg-primary/5 dark:bg-primary/10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">
                          Upgrade to Permanent Account (Optional)
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                          Create an account to securely sync your streak, journal reflections, and mood logs across multiple devices.
                        </p>
                      </div>
                    </div>

                    {/* Mode selector */}
                    <div className="flex gap-2 p-1 bg-white dark:bg-[#1E2128] rounded-xl border border-slate-200 dark:border-[#2B2F38] mb-4 w-fit">
                      <button
                        type="button"
                        onClick={() => { setAuthMode('create'); setAuthError(null); setAuthSuccess(null); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          authMode === 'create' ? 'bg-primary text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Create New Account
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAuthMode('login'); setAuthError(null); setAuthSuccess(null); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          authMode === 'login' ? 'bg-primary text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Sign In & Merge
                      </button>
                    </div>

                    <form onSubmit={handleAuthSubmit} className="space-y-3">
                      {authMode === 'create' && (
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Your Name</label>
                          <input
                            type="text"
                            value={authName}
                            onChange={(e) => setAuthName(e.target.value)}
                            placeholder="e.g. Divjot"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-white dark:bg-[#1E2128] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                          <input
                            type="email"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-white dark:bg-[#1E2128] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Password</label>
                            {authMode === 'login' && (
                              <button
                                type="button"
                                onClick={handleForgotPassword}
                                className="text-[10px] text-primary hover:underline"
                              >
                                Forgot?
                              </button>
                            )}
                          </div>
                          <input
                            type="password"
                            value={authPass}
                            onChange={(e) => setAuthPass(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-white dark:bg-[#1E2128] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      {authError && (
                        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex flex-col gap-1.5 w-full">
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={14} className="shrink-0" />
                            <span>{authError}</span>
                          </div>
                          {authMode === 'login' && (authError.toLowerCase().includes('password') || authError.toLowerCase().includes('invalid')) && (
                            <button
                              type="button"
                              onClick={handleForgotPassword}
                              className="text-[10px] text-primary dark:text-[#8DA9B7] hover:underline text-left font-semibold mt-1"
                            >
                              Reset password via email link
                            </button>
                          )}
                        </div>
                      )}

                      {authSuccess && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                          <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                          <span>{authSuccess}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="py-2 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-2xs disabled:opacity-50"
                      >
                        {authLoading && <Loader2 size={13} className="animate-spin" />}
                        <span>{authMode === 'create' ? 'Create Account & Merge Data' : 'Sign In & Merge Data'}</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* Data Retention & Privacy Settings */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                        Data Retention Preferences
                      </h4>
                      <select
                        value={preferences.dataRetention || 'indefinite'}
                        onChange={(e) => updatePreferences({ dataRetention: e.target.value as any })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-white dark:bg-[#1E2128] text-xs text-slate-800 dark:text-white focus:outline-none focus:border-primary"
                      >
                        <option value="indefinite">Keep indefinitely (Recommended)</option>
                        <option value="1_year">Delete data older than 1 year</option>
                        <option value="90_days">Delete data older than 90 days</option>
                      </select>
                    </div>

                    <div>
                      <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                        System Screen Reader support
                      </h4>
                      <div
                        onClick={() => updatePreferences({ screenReaderOptimized: !preferences.screenReaderOptimized })}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-slate-50/50 dark:bg-[#1E2128] flex items-center justify-between cursor-pointer transition-all h-10.5"
                      >
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Force Screen Reader Cues</span>
                        <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors flex items-center shrink-0 ml-2 ${
                          preferences.screenReaderOptimized ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                        }`}>
                          <span className="w-3.5 h-3.5 bg-white rounded-full shadow-xs" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Portability Downloads & Action buttons */}
                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                    Backup and Portability Exports
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-slate-50/30 flex flex-col justify-between h-36">
                      <div>
                        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold text-xs mb-1">
                          <Download size={14} className="text-primary" />
                          <span>All-Data Backup (.json)</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                          structured JSON data dump of journal logs, streaks, and preferences
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleExport}
                        className="py-1.5 px-3 bg-slate-100 dark:bg-[#252932] hover:bg-slate-250 dark:hover:bg-slate-700 border border-slate-200 dark:border-[#2B2F38] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors w-full"
                      >
                        <Download size={12} />
                        <span>{exportSuccess ? 'Downloaded!' : 'Export Backup'}</span>
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-slate-50/30 flex flex-col justify-between h-36">
                      <div>
                        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold text-xs mb-1">
                          <FileText size={14} className="text-primary" />
                          <span>Reflections Journal (.txt)</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                          Readably formatted text file of all logged entries and mood values
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={journalDownloading}
                        onClick={handleDownloadJournals}
                        className="py-1.5 px-3 bg-slate-100 dark:bg-[#252932] hover:bg-slate-250 dark:hover:bg-slate-700 border border-slate-200 dark:border-[#2B2F38] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors w-full disabled:opacity-50"
                      >
                        {journalDownloading ? <Loader2 size={12} className="animate-spin text-primary" /> : <Download size={12} />}
                        <span>Download Journal</span>
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-slate-50/30 flex flex-col justify-between h-36">
                      <div>
                        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold text-xs mb-1">
                          <MessageSquareHeart size={14} className="text-primary" />
                          <span>Chat Conversations (.txt)</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                          Empathetic discussions conversations backup transcript history
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={chatsDownloading}
                        onClick={handleDownloadChats}
                        className="py-1.5 px-3 bg-slate-100 dark:bg-[#252932] hover:bg-slate-250 dark:hover:bg-slate-700 border border-slate-200 dark:border-[#2B2F38] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors w-full disabled:opacity-50"
                      >
                        {chatsDownloading ? <Loader2 size={12} className="animate-spin text-primary" /> : <Download size={12} />}
                        <span>Download Chats</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* History Clear danger buttons */}
                <div>
                  <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-3">
                    Privacy History Deletion
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl border border-rose-100 dark:border-rose-950/40 bg-rose-50/5 flex flex-col justify-between h-36">
                      <div>
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block">Delete Reflections</span>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-normal">
                          Clear all database reflections and tags history permanently
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={journalDeleting}
                        onClick={handleDeleteJournalHistory}
                        className="py-1.5 bg-rose-100/50 hover:bg-rose-200/70 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-medium rounded-xl border border-rose-200 dark:border-rose-900 transition-colors w-full flex items-center justify-center gap-1"
                      >
                        {journalDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        <span>Wipe Journal logs</span>
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl border border-rose-100 dark:border-rose-950/40 bg-rose-50/5 flex flex-col justify-between h-36">
                      <div>
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block">Delete Chat History</span>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-normal">
                          Clear all conversation transcripts and assistant sessions logs
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={chatDeleting}
                        onClick={handleDeleteConversationHistory}
                        className="py-1.5 bg-rose-100/50 hover:bg-rose-200/70 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-medium rounded-xl border border-rose-200 dark:border-rose-900 transition-colors w-full flex items-center justify-center gap-1"
                      >
                        {chatDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        <span>Wipe Chat transcripts</span>
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl border border-rose-100 dark:border-rose-950/40 bg-rose-50/5 flex flex-col justify-between h-36">
                      <div>
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block">Clear local cache</span>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-normal">
                          Erase custom soundscapes and visual preferences cached locally
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearLocalCache}
                        className="py-1.5 bg-rose-100/50 hover:bg-rose-200/70 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-medium rounded-xl border border-rose-200 dark:border-rose-900 transition-colors w-full flex items-center justify-center gap-1"
                      >
                        <RefreshCw size={12} />
                        <span>Clear Cache</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Reset Anonymous Device Data */}
                <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/10 dark:bg-rose-950/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h5 className="font-bold text-xs text-rose-700 dark:text-rose-300 uppercase tracking-wide">Erase Anonymous Guest ID</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                      Resets local browser UUID (`calmnest_anon_uuid`) and terminates this guest device instance.
                    </p>
                  </div>
                  
                  {!confirmDelete ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shrink-0"
                    >
                      Reset Guest Session
                    </button>
                  ) : (
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="py-1.5 px-3.5 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-xl font-bold transition-colors"
                      >
                        Confirm Erase
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="py-1.5 px-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-250 text-xs rounded-xl font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: SECURITY & PROFILE */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Profile Edit fields */}
                {!user?.isAnonymous ? (
                  <div className="space-y-4">
                    <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Profile Customization
                    </h4>
                    
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Display Name</label>
                          <input
                            type="text"
                            required
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-white dark:bg-[#1E2128] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                            placeholder="Your name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Avatar Image</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              className="hidden"
                              id="avatar-image-file"
                            />
                            <label
                              htmlFor="avatar-image-file"
                              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#2B2F38] rounded-xl text-xs cursor-pointer flex items-center gap-1.5 font-medium transition-all"
                            >
                              {avatarUploading ? <Loader2 size={12} className="animate-spin text-primary" /> : <Download size={12} />}
                              <span>{profileAvatarUrl ? 'Change Photo' : 'Upload Avatar'}</span>
                            </label>
                            {profileAvatarUrl && (
                              <img src={profileAvatarUrl} alt="Avatar" className="w-9 h-9 object-cover rounded-xl border border-slate-200 dark:border-[#2B2F38]" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Bio</label>
                        <textarea
                          value={profileBio}
                          onChange={(e) => setProfileBio(e.target.value)}
                          rows={2}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-white dark:bg-[#1E2128] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-primary resize-none"
                          placeholder="Tell us about yourself..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="py-2 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-2xs disabled:opacity-50"
                      >
                        {profileLoading && <Loader2 size={13} className="animate-spin" />}
                        <span>Update Profile</span>
                      </button>
                    </form>

                    <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-200/60 dark:border-[#2B2F38]">
                      Account Security
                    </h4>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Current Password</label>
                          <input
                            type="password"
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-white dark:bg-[#1E2128] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                            placeholder="••••••••"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
                          <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-white dark:bg-[#1E2128] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                            placeholder="Min. 8 characters"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="py-2 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-2xs disabled:opacity-50"
                      >
                        {passwordLoading && <Loader2 size={13} className="animate-spin" />}
                        <span>Change Password</span>
                      </button>
                    </form>

                    {securityFeedback && (
                      <div className={`p-3 rounded-xl border text-xs mt-3 ${
                        securityFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-250'
                      }`}>
                        {securityFeedback.text}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/20 text-amber-800 text-xs">
                    You are logged in as an anonymous guest. Profile settings, active sessions, and password management will become available once you upgrade your account in the <strong>Identity & Privacy</strong> tab.
                  </div>
                )}

                {/* Google Connected Account indicator */}
                {!user?.isAnonymous && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-slate-50/40 dark:bg-[#1E2128] flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block">Connected Login Providers</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Google OAuth single sign-on synchronization</span>
                    </div>
                    
                    {user?.email?.includes('gmail.com') ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                        <Check size={12} strokeWidth={3} />
                        Connected via Google
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Email & Password only</span>
                    )}
                  </div>
                )}

                {/* Active Sessions List & Logout other devices */}
                {!user?.isAnonymous && (
                  <div className="pt-2 border-t border-slate-200 dark:border-[#2B2F38] space-y-4">
                    <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Active Device Sessions
                    </h4>
                    
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-slate-50/50 dark:bg-[#1E2128]/50 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Current Web Session</span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded-full">Active</span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono leading-normal">
                          User Agent: {typeof window !== 'undefined' ? window.navigator.userAgent.slice(0, 70) : 'Browser context'}...
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-rose-200 dark:border-rose-950 p-4 bg-rose-50/5 dark:bg-rose-950/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h5 className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wide">Danger Zone</h5>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                          Sign out from all active sessions globally, or delete your account permanently.
                        </p>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleLogoutAllDevices}
                          className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#2B2F38] text-xs rounded-xl transition-all font-medium"
                        >
                          Global Logout
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteAccount}
                          className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-xl transition-all font-semibold"
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
