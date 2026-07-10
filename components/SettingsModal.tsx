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
  Layers
} from 'lucide-react';
import { useSettingsStore, SettingsTab } from '@/store/useSettingsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSanctuaryTranslation, SupportedLanguage } from '@/lib/i18n/useSanctuaryTranslation';
import { triggerGentleSanctuaryCelebration } from '@/components/SanctuaryConfetti';

export default function SettingsModal() {
  const { isOpen, activeTab, preferences, closeSettings, setActiveTab, updatePreferences } = useSettingsStore();
  const { user, signup, login, mergeAccount, exportData, deleteAnonymousAndReset } = useAuthStore();
  const { t, currentLanguage, setLanguage } = useSanctuaryTranslation();

  // Local UI state for Account Upgrade / Merging
  const [authMode, setAuthMode] = useState<'create' | 'login'>('create');
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authName, setAuthName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Confirmation state for deleting anonymous data
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setConfirmDelete(false);
        setAuthError(null);
        setAuthSuccess(null);
        setExportSuccess(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'appearance', label: 'Appearance', icon: <Palette size={16} />, desc: 'Theme, font scale & motion aesthetics' },
    { id: 'language', label: 'Language & Locale', icon: <Globe size={16} />, desc: 'UI translation & supportive phrasing' },
    { id: 'ai', label: 'AI Sanctuary Voice', icon: <MessageSquareHeart size={16} />, desc: 'Tone, pacing & empathetic counseling style' },
    { id: 'audio', label: 'Meditation & Audio', icon: <Headphones size={16} />, desc: 'Ambient soundscape & breathing rhythms' },
    { id: 'dashboard', label: 'Dashboard Cards', icon: <LayoutDashboard size={16} />, desc: 'Personalize daily check-in layout' },
    { id: 'privacy', label: 'Identity & Privacy', icon: <Shield size={16} />, desc: 'Anonymous device sync, data export & reset' },
  ];

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    setLanguage(lang);
    await updatePreferences({ language: lang });
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

  const handleReset = () => {
    deleteAnonymousAndReset();
    closeSettings();
    if (typeof window !== 'undefined') {
      window.location.reload();
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
          <aside className="w-full md:w-64 bg-slate-100/60 dark:bg-[#16181D]/80 border-b md:border-b-0 md:border-r border-slate-200/70 dark:border-[#2B2F38] p-4 flex flex-col justify-between shrink-0">
            <div>
              <div className="flex items-center justify-between md:justify-start gap-2.5 px-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#5C8397] text-white flex items-center justify-center shadow-2xs">
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
                          ? 'bg-white dark:bg-[#252932] text-[#5C8397] dark:text-[#A1C2D4] shadow-2xs border border-slate-200/60 dark:border-slate-700/50'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-[#1E2128] hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <span className={active ? 'text-[#5C8397] dark:text-[#A1C2D4]' : 'text-slate-400 dark:text-slate-500'}>
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
                              ? 'bg-[#5C8397]/10 border-[#5C8397] text-[#5C8397] dark:bg-[#5C8397]/20 dark:text-[#A1C2D4] shadow-2xs'
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
                    Font Comfort Scale
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
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
                          className={`p-3 rounded-xl border text-left transition-all ${
                            selected
                              ? 'bg-[#6B907B]/10 border-[#6B907B] text-[#4A725D] dark:bg-[#6B907B]/20 dark:text-[#A8C8B5]'
                              : 'border-slate-200 dark:border-[#2B2F38] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#252932]'
                          }`}
                        >
                          <div className="font-medium text-xs sm:text-sm">{fs.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{fs.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                    Motion & Micro-Animations
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'gentle', label: 'Gentle Motion', desc: 'Floating lotus visualizers & smooth cards' },
                      { id: 'reduced', label: 'Reduced Motion', desc: 'Minimal static transitions for sensitivity' },
                    ].map((ms) => {
                      const selected = preferences.motionStyle === ms.id;
                      return (
                        <button
                          key={ms.id}
                          onClick={() => updatePreferences({ motionStyle: ms.id as any })}
                          className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all text-left ${
                            selected
                              ? 'bg-[#5C8397]/10 border-[#5C8397] text-slate-900 dark:text-white'
                              : 'border-slate-200 dark:border-[#2B2F38] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#252932]'
                          }`}
                        >
                          <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            selected ? 'border-[#5C8397] bg-[#5C8397] text-white' : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {selected && <Check size={10} strokeWidth={3} />}
                          </div>
                          <div>
                            <div className="font-medium text-xs">{ms.label}</div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{ms.desc}</div>
                          </div>
                        </button>
                      );
                    })}
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
                            ? 'bg-[#5C8397]/10 border-[#5C8397] shadow-2xs'
                            : 'border-slate-200 dark:border-[#2B2F38] hover:bg-slate-50 dark:hover:bg-[#252932]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-base font-medium ${selected ? 'text-[#5C8397] dark:text-[#A1C2D4]' : 'text-slate-800 dark:text-slate-200'}`}>
                            {item.native}
                          </span>
                          {selected && (
                            <div className="w-5 h-5 rounded-full bg-[#5C8397] text-white flex items-center justify-center">
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
                  <Globe size={18} className="text-[#5C8397] shrink-0" />
                  <span>
                    Need another language? Our AI Sanctuary Counselor supports real-time conversational understanding in over 40 regional dialects during chat sessions.
                  </span>
                </div>
              </div>
            )}

            {/* TAB CONTENT: AI SANCTUARY VOICE */}
            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                    Counseling Style & Tone
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'warm', label: 'Warm & Nurturing', desc: 'Gentle emotional validation, soothing reassurance, and empathetic listening.' },
                      { id: 'concise', label: 'Concise & Grounded', desc: 'Brief, calming check-ins focused directly on breath and sensory grounding.' },
                      { id: 'poetic', label: 'Mindful & Reflective', desc: 'Deeper philosophic wisdom inspired by mindfulness and meditation traditions.' },
                    ].map((voice) => {
                      const selected = preferences.aiVoiceOrStyle === voice.id;
                      return (
                        <button
                          key={voice.id}
                          onClick={() => updatePreferences({ aiVoiceOrStyle: voice.id as any })}
                          className={`p-4 rounded-xl border flex flex-col justify-between transition-all text-left ${
                            selected
                              ? 'bg-[#5C8397]/10 border-[#5C8397] shadow-2xs'
                              : 'border-slate-200 dark:border-[#2B2F38] hover:bg-slate-50 dark:hover:bg-[#252932]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-sm font-medium ${selected ? 'text-[#5C8397] dark:text-[#A1C2D4]' : 'text-slate-800 dark:text-slate-200'}`}>
                                {voice.label}
                              </span>
                              {selected && <Check size={14} className="text-[#5C8397]" />}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                              {voice.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex items-start gap-3">
                  <Sparkles size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-xs text-emerald-900 dark:text-emerald-200">Safety & Compassion First</h5>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed mt-1">
                      Our AI counselor adheres strictly to non-judgmental mental health principles. It will never argue, overwhelm you with complex medical terminology, or push for notifications.
                    </p>
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

                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                    Default Breathing Rhythm
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: '4-7-8', label: '4-7-8 Deep Rest', desc: 'Inhale 4s, Hold 7s, Exhale 8s. Ideal for anxiety relief & better sleep.' },
                      { id: 'box', label: 'Box Breathing', desc: 'Inhale 4s, Hold 4s, Exhale 4s, Hold 4s. Ideal for rapid focus & mental clarity.' },
                      { id: 'coherent', label: 'Coherent Rhythm', desc: 'Inhale 5.5s, Exhale 5.5s. Balances nervous system & heart rate variability.' },
                    ].map((br) => {
                      const selected = preferences.defaultBreathingRhythm === br.id;
                      return (
                        <button
                          key={br.id}
                          onClick={() => updatePreferences({ defaultBreathingRhythm: br.id as any })}
                          className={`p-4 rounded-xl border text-left transition-all ${
                            selected
                              ? 'bg-[#5C8397]/10 border-[#5C8397] shadow-2xs'
                              : 'border-slate-200 dark:border-[#2B2F38] hover:bg-slate-50 dark:hover:bg-[#252932]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm font-medium ${selected ? 'text-[#5C8397] dark:text-[#A1C2D4]' : 'text-slate-800 dark:text-slate-200'}`}>
                              {br.label}
                            </span>
                            {selected && <Check size={14} className="text-[#5C8397]" />}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                            {br.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: DASHBOARD CARDS */}
            {activeTab === 'dashboard' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                  Toggle the check-in cards you wish to see on your primary Sanctuary Dashboard. Hide anything that feels overwhelming or unnecessary for your routine.
                </p>

                <div className="space-y-2.5">
                  {[
                    { key: 'dashboardShowQuote', label: 'Greeting & Daily Mindful Quote', desc: 'Warm contextual welcome and calm quote of the day' },
                    { key: 'dashboardShowMood', label: '5-Point Emotional Check-In Bar', desc: 'Struggling to Great single-click mood check-in' },
                    { key: 'dashboardShowQuickChat', label: 'AI Counselor Quick Check-In Card', desc: 'Instant access card to chat with your AI support companion' },
                    { key: 'dashboardShowHabits', label: 'Daily Self-Care Routines & Habits', desc: 'Check off hydration, walks, or sleep hygiene check-ins' },
                    { key: 'dashboardShowMeditation', label: 'Meditation Studio Teaser', desc: 'One-click launch to 4-7-8 breathing & ambient synth player' },
                  ].map((card) => {
                    const isChecked = (preferences as any)[card.key] !== false;
                    return (
                      <div
                        key={card.key}
                        onClick={() => updatePreferences({ [card.key]: !isChecked } as any)}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-slate-50/50 dark:bg-[#252932]/40 hover:bg-slate-100/70 dark:hover:bg-[#252932] flex items-center justify-between cursor-pointer transition-all"
                      >
                        <div>
                          <h5 className="font-medium text-xs sm:text-sm text-slate-800 dark:text-slate-200">{card.label}</h5>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{card.desc}</p>
                        </div>
                        <div className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center ${
                          isChecked ? 'bg-[#5C8397] justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                        }`}>
                          <motion.div
                            layout
                            className="w-5 h-5 rounded-full bg-white shadow-xs"
                          />
                        </div>
                      </div>
                    );
                  })}
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
                        user?.isAnonymous ? 'bg-[#5C8397]' : 'bg-[#6B907B]'
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
                  <div className="p-5 rounded-xl border border-[#5C8397]/40 dark:border-[#5C8397]/50 bg-[#5C8397]/5 dark:bg-[#5C8397]/10">
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
                          authMode === 'create' ? 'bg-[#5C8397] text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Create New Account
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAuthMode('login'); setAuthError(null); setAuthSuccess(null); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          authMode === 'login' ? 'bg-[#5C8397] text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
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
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-white dark:bg-[#1E2128] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#5C8397]"
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
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-white dark:bg-[#1E2128] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#5C8397]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                          <input
                            type="password"
                            value={authPass}
                            onChange={(e) => setAuthPass(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#2B2F38] bg-white dark:bg-[#1E2128] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#5C8397]"
                          />
                        </div>
                      </div>

                      {authError && (
                        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                          <AlertTriangle size={14} className="shrink-0" />
                          <span>{authError}</span>
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
                        className="py-2 px-4 bg-[#5C8397] hover:bg-[#436475] text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-2xs disabled:opacity-50"
                      >
                        {authLoading && <Loader2 size={13} className="animate-spin" />}
                        <span>{authMode === 'create' ? 'Create Account & Merge Data' : 'Sign In & Merge Data'}</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* Data Portability & Reset Actions */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-[#2B2F38] grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Export JSON */}
                  <div className="p-4 rounded-xl border border-slate-200/80 dark:border-[#2B2F38] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium text-xs mb-1">
                        <Download size={15} className="text-[#5C8397]" />
                        <span>Export Sanctuary Data</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Download all your reflection logs, habit streaks, mood records, and preferences into a portable structured JSON file.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExport}
                      className="mt-3 py-2 px-3 bg-slate-100 dark:bg-[#252932] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Download size={14} />
                      <span>{exportSuccess ? 'Downloaded!' : 'Download Backup (.json)'}</span>
                    </button>
                  </div>

                  {/* Erase & Reset */}
                  <div className="p-4 rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-medium text-xs mb-1">
                        <Trash2 size={15} />
                        <span>Reset Anonymous Device Data</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Permanently erase local browser records (`calmnest_anon_uuid`) and start a completely fresh guest session.
                      </p>
                    </div>

                    {!confirmDelete ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="mt-3 py-2 px-3 bg-rose-100/80 dark:bg-rose-900/30 hover:bg-rose-200 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        <Trash2 size={14} />
                        <span>Erase Device Data & Reset</span>
                      </button>
                    ) : (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={handleReset}
                          className="flex-1 py-2 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-medium transition-colors"
                        >
                          Confirm Erase
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          className="py-2 px-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
