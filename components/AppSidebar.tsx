'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  MessageSquareHeart,
  BookOpen,
  SmilePlus,
  Compass,
  ListTodo,
  ClipboardCheck,
  ShieldAlert,
  LogOut,
  User,
  Menu,
  X,
  Settings,
  Sparkles,
  Search
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useSanctuaryTranslation } from '@/lib/i18n/useSanctuaryTranslation';
import { useSettingsStore } from '@/store/useSettingsStore';
import SettingsModal from '@/components/SettingsModal';
import { GlobalAudioPlayer } from '@/components/GlobalAudioPlayer';
import { initializeUserCollections } from '@/lib/db-service';
import GlobalSearchModal from '@/components/GlobalSearchModal';
import NotificationDropdown from '@/components/NotificationDropdown';

export default function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useSanctuaryTranslation();
  const { user, checkAuth, logout } = useAuthStore();
  const { openSettings, initDomStyles } = useSettingsStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    initDomStyles();
  }, [checkAuth, initDomStyles]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (user?.id) {
      initializeUserCollections(user.id);
    }
  }, [user]);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  const navItems = [
    { name: t('nav.sanctuary') || 'Sanctuary', href: '/dashboard', icon: <LayoutDashboard size={18} strokeWidth={1.75} /> },
    { name: t('nav.chat') || 'AI Therapist', href: '/chat', icon: <MessageSquareHeart size={18} strokeWidth={1.75} />, badge: '24/7' },
    { name: t('nav.mood') || 'Mood Tracker', href: '/mood', icon: <SmilePlus size={18} strokeWidth={1.75} /> },
    { name: t('nav.journal') || 'Journal & Notes', href: '/journal', icon: <BookOpen size={18} strokeWidth={1.75} /> },
    { name: t('breathing.title') || 'Meditation Studio', href: '/meditation', icon: <Compass size={18} strokeWidth={1.75} /> },
    { name: t('nav.habits') || 'Habits & Routine', href: '/habits', icon: <ListTodo size={18} strokeWidth={1.75} /> },
    { name: 'Self Assessment', href: '/assessments', icon: <ClipboardCheck size={18} strokeWidth={1.75} /> },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#16181D] flex flex-col md:flex-row font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Mobile Header */}
      <header className="md:hidden bg-white/90 dark:bg-[#1E2128]/90 backdrop-blur-md border-b border-slate-200/70 dark:border-[#2B2F38] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white shadow-2xs">
            <Sparkles size={16} />
          </div>
          <span className="font-medium tracking-tight text-base text-slate-900 dark:text-slate-100">CalmNest</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#252932] rounded-xl transition-colors"
            title="Search"
          >
            <Search size={18} strokeWidth={1.75} />
          </button>
          <NotificationDropdown />
          <button
            onClick={() => openSettings()}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#252932] rounded-xl transition-colors"
            title="Sanctuary Settings"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={() => setShowSosModal(true)}
            className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all"
          >
            <ShieldAlert size={14} />
            <span>SOS</span>
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#252932] rounded-xl transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-[#16181D] border-b border-slate-200/70 dark:border-[#2B2F38] overflow-hidden z-30"
          >
            <div className="p-4 space-y-1">
              <button
                onClick={() => {
                  setShowSosModal(true);
                  setMobileOpen(false);
                }}
                className="w-full mb-3 py-2.5 px-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl font-medium text-xs flex items-center gap-2 transition-colors"
              >
                <ShieldAlert size={16} />
                <span>Crisis Helpline & SOS</span>
              </button>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm transition-all duration-150 ${
                        active
                          ? 'bg-primary/12 dark:bg-primary/20 text-primary dark:text-[#A1C2D4] font-medium'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-[#1E2128]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          active ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    openSettings();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-[#1E2128] transition-all"
                >
                  <Settings size={18} strokeWidth={1.75} />
                  <span>Preferences & Settings</span>
                </button>
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-200/70 dark:border-[#2B2F38]">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="w-full py-3 bg-white dark:bg-[#1E2128] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 border border-slate-200/70 dark:border-[#2B2F38] rounded-xl font-normal text-sm flex items-center justify-center gap-2 transition-all"
              >
                <LogOut size={16} strokeWidth={1.75} />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Inspired by Linear / Apple HIG) */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-[#16181D] border-r border-slate-200/70 dark:border-[#2B2F38] flex-col justify-between p-4 sticky top-0 h-screen shrink-0 z-30 select-none">
        <div>
          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-3 px-2 mb-6 group">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-2xs group-hover:scale-105 transition-all duration-200">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="font-medium tracking-tight text-base text-slate-900 dark:text-slate-100 leading-none">CalmNest</span>
              <p className="text-[11px] font-normal text-[#6B907B] dark:text-[#A8C8B5] mt-0.5">Sanctuary Workspace</p>
            </div>
          </Link>

          {/* SOS Crisis Button */}
          <button
            onClick={() => setShowSosModal(true)}
            className="w-full mb-5 py-2.5 px-3.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/80 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all duration-200 group"
          >
            <ShieldAlert size={15} strokeWidth={1.75} className="group-hover:scale-105 transition-transform" />
            <span>Crisis Helpline & SOS</span>
          </button>

          {/* Quick Actions Row */}
          <div className="flex items-center justify-between gap-2 px-1 mb-4 shrink-0">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex-grow flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-[#1E2128]/40 hover:bg-slate-100 dark:hover:bg-[#252932] border border-slate-200/60 dark:border-[#2B2F38] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-250 rounded-xl text-xs transition-all text-left cursor-pointer"
              title="Search (Cmd+K)"
            >
              <Search size={14} />
              <span>Search...</span>
            </button>
            <NotificationDropdown />
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                    active
                      ? 'bg-primary/12 dark:bg-primary/20 text-primary dark:text-[#A1C2D4] font-medium'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-[#1E2128] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      active ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <button
              onClick={() => openSettings()}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-[#1E2128] hover:text-slate-900 dark:hover:text-white transition-all text-left"
            >
              <Settings size={18} strokeWidth={1.75} />
              <span>Preferences & Settings</span>
            </button>
            {isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all mt-4 ${
                  pathname === '/admin' ? 'bg-[#8D80A9]/15 text-[#8D80A9] font-medium' : 'text-slate-500 hover:bg-slate-100/70 dark:hover:bg-[#1E2128]'
                }`}
              >
                <Settings size={18} strokeWidth={1.75} />
                <span>Admin Panel</span>
              </Link>
            )}
          </nav>
        </div>

        {/* User Card */}
        <div className="pt-4 border-t border-slate-200/70 dark:border-[#2B2F38]">
          <div className="bg-slate-50/80 dark:bg-[#1E2128]/70 p-3 rounded-xl border border-slate-200/60 dark:border-[#2B2F38] mb-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 bg-primary/15 dark:bg-primary/25 text-primary dark:text-[#A1C2D4] rounded-lg flex items-center justify-center font-medium text-sm shrink-0">
                  <User size={16} />
                </div>
                <div className="truncate">
                  <h4 className="font-medium text-xs text-slate-800 dark:text-slate-100 truncate">{user?.name || 'Sanctuary Friend'}</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user?.email || 'Anonymous Session'}</p>
                </div>
              </div>
              <button
                onClick={() => openSettings('privacy')}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                title="Manage Account Identity"
              >
                <Settings size={14} />
              </button>
            </div>
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200/60 dark:border-[#2B2F38] text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Streak</span>
              <span className="font-mono text-[#6B907B] dark:text-[#A8C8B5] font-medium">{user?.streak || 1} Days Active</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full py-2 px-3 bg-white dark:bg-[#1E2128] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 border border-slate-200/70 dark:border-[#2B2F38] rounded-xl font-normal text-xs flex items-center justify-center gap-2 transition-all duration-150"
          >
            <LogOut size={14} strokeWidth={1.75} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-h-screen">
        {children}
      </main>

      {/* Settings Dialog Modal */}
      <SettingsModal />

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Global Ambient Sound Engine Pill & Mixer */}
      <GlobalAudioPlayer />

      {/* SOS Crisis Modal */}
      <AnimatePresence>
        {showSosModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md"
            onClick={() => setShowSosModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1E2128] border border-slate-200/80 dark:border-[#2B2F38] rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowSosModal(false)}
                className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-5 shadow-2xs">
                <ShieldAlert size={24} strokeWidth={1.75} />
              </div>

              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                Immediate Crisis Support
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                You are not alone. If you are experiencing overwhelming distress, emotional pain, or thoughts of self-harm, please reach out to compassionate human helplines available 24/7 right now.
              </p>

              <div className="space-y-3 mb-6">
                <a
                  href="tel:18005990019"
                  className="flex items-center justify-between p-4 bg-slate-50/80 dark:bg-[#16181D] hover:bg-rose-50/50 dark:hover:bg-rose-950/30 border border-slate-200/80 dark:border-[#2B2F38] rounded-xl transition-all group"
                >
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">🇮🇳 KIRAN National Helpline (India)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">24/7 mental health rehabilitation helpline</p>
                  </div>
                  <span className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium text-xs shadow-2xs transition-colors">
                    Call 1800-599-0019
                  </span>
                </a>

                <a
                  href="tel:988"
                  className="flex items-center justify-between p-4 bg-slate-50/80 dark:bg-[#16181D] hover:bg-slate-100 dark:hover:bg-[#252932] border border-slate-200/80 dark:border-[#2B2F38] rounded-xl transition-all group"
                >
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">🇺🇸 Suicide & Crisis Lifeline (USA & Canada)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Free, confidential 24/7 crisis support</p>
                  </div>
                  <span className="px-3.5 py-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-lg font-medium text-xs shadow-2xs transition-colors">
                    Call 988
                  </span>
                </a>

                <a
                  href="tel:112"
                  className="flex items-center justify-between p-4 bg-slate-50/80 dark:bg-[#16181D] hover:bg-slate-100 dark:hover:bg-[#252932] border border-slate-200/80 dark:border-[#2B2F38] rounded-xl transition-all group"
                >
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">🌍 Global Emergency Services (International)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Immediate medical & safety intervention</p>
                  </div>
                  <span className="px-3.5 py-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-lg font-medium text-xs shadow-2xs transition-colors">
                    Call 112
                  </span>
                </a>
              </div>

              <div className="flex gap-3">
                <Link
                  href="/chat"
                  onClick={() => setShowSosModal(false)}
                  className="btn-primary flex-1 py-3 text-center"
                >
                  Talk to AI Therapist Now
                </Link>
                <button
                  onClick={() => setShowSosModal(false)}
                  className="btn-secondary px-6 py-3"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
