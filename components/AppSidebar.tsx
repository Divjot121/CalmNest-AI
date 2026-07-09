'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  LayoutDashboard,
  MessageSquareHeart,
  BookOpen,
  SmilePlus,
  Compass,
  ListTodo,
  ClipboardCheck,
  ShieldAlert,
  LogOut,
  Flame,
  User,
  Menu,
  X,
  Settings
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { name: 'AI Therapist', href: '/chat', icon: <MessageSquareHeart size={20} />, badge: '24/7' },
  { name: 'Mood Tracker', href: '/mood', icon: <SmilePlus size={20} /> },
  { name: 'Journal & Notes', href: '/journal', icon: <BookOpen size={20} /> },
  { name: 'Meditation Studio', href: '/meditation', icon: <Compass size={20} /> },
  { name: 'Habits & Routine', href: '/habits', icon: <ListTodo size={20} /> },
  { name: 'Self Assessment', href: '/assessments', icon: <ClipboardCheck size={20} /> },
];

export default function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, checkAuth, logout, isLoading } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans text-slate-900">
      {/* Mobile Header */}
      <header className="md:hidden glass border-b border-slate-200/80 px-4 py-3 flex items-center justify-between sticky top-0 z-40 bg-white/80 backdrop-blur-md">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <Heart size={18} fill="currentColor" />
          </div>
          <span className="font-display font-bold text-lg text-slate-900">CalmNest</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSosModal(true)}
            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm transition-all animate-pulse"
          >
            <ShieldAlert size={14} />
            <span>SOS</span>
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Overlay Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden fixed inset-0 top-14 z-50 bg-white p-6 flex flex-col justify-between overflow-y-auto"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold">
                    <User size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{user?.name || 'CalmNest User'}</h4>
                    <p className="text-xs text-slate-500 truncate max-w-[180px]">{user?.email || 'Anonymous Session'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2.5 py-1 rounded-xl text-xs font-bold border border-amber-200">
                  <Flame size={14} fill="currentColor" />
                  <span>{user?.streak || 1}d</span>
                </div>
              </div>

              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-medium transition-all ${
                        active
                          ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/20'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          active ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all ${
                      pathname === '/admin' ? 'bg-purple-600 text-white shadow-lg' : 'text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    <Settings size={20} />
                    <span>Admin Command Center</span>
                  </Link>
                )}
              </nav>
            </div>

            <div className="pt-6 border-t border-slate-200 flex flex-col gap-3">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="w-full py-3.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200/80 flex-col justify-between p-5 sticky top-0 h-screen shrink-0 z-30">
        <div>
          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-2.5 px-2 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Heart size={20} fill="currentColor" />
            </div>
            <div>
              <span className="font-display font-bold text-xl text-slate-900 leading-none">CalmNest</span>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Enterprise Wellness</p>
            </div>
          </Link>

          {/* SOS Button */}
          <button
            onClick={() => setShowSosModal(true)}
            className="w-full mb-6 py-3 px-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all group"
          >
            <ShieldAlert size={16} className="group-hover:scale-110 transition-transform" />
            <span>CRISIS SOS HELPLINE</span>
          </button>

          {/* Nav */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      active ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-medium transition-all mt-4 ${
                  pathname === '/admin' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-600 hover:bg-purple-50'
                }`}
              >
                <Settings size={20} />
                <span>Admin Panel</span>
              </Link>
            )}
          </nav>
        </div>

        {/* User Card */}
        <div className="pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                  <User size={18} />
                </div>
                <div className="truncate">
                  <h4 className="font-bold text-xs text-slate-900 truncate">{user?.name || 'CalmNest User'}</h4>
                  <p className="text-[10px] text-slate-500 truncate">{user?.email || 'Guest Mode'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
              <span className="text-slate-500 font-medium">Wellness Streak</span>
              <div className="flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                <Flame size={13} fill="currentColor" />
                <span>{user?.streak || 1} Days</span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full py-2.5 px-3 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-h-screen">
        {children}
      </main>

      {/* SOS Crisis Modal */}
      <AnimatePresence>
        {showSosModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white max-w-lg w-full rounded-3xl p-6 md:p-8 shadow-2xl border border-red-100"
            >
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <ShieldAlert size={32} />
              </div>
              <h2 className="text-2xl font-bold text-center text-slate-900 mb-2 font-display">Immediate Emergency Helplines</h2>
              <p className="text-sm text-center text-slate-600 mb-6">
                You are not alone. Free, confidential, professional support is available right now 24/7.
              </p>

              <div className="space-y-3 mb-8">
                <a
                  href="tel:988"
                  className="flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-2xl transition-all group"
                >
                  <div>
                    <h4 className="font-bold text-red-900">National Suicide & Crisis Lifeline (US & Canada)</h4>
                    <p className="text-xs text-red-700 mt-0.5">Call or Text 24 hours a day</p>
                  </div>
                  <span className="px-4 py-2 bg-red-600 group-hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-md">
                    Call 988
                  </span>
                </a>

                <a
                  href="tel:112"
                  className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all group"
                >
                  <div>
                    <h4 className="font-bold text-slate-900">Emergency Services (Europe & International)</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Immediate medical & safety response</p>
                  </div>
                  <span className="px-4 py-2 bg-slate-900 group-hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-md">
                    Call 112
                  </span>
                </a>

                <a
                  href="tel:911"
                  className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all group"
                >
                  <div>
                    <h4 className="font-bold text-slate-900">Emergency Services (USA)</h4>
                    <p className="text-xs text-slate-500 mt-0.5">For urgent medical or life-threatening crises</p>
                  </div>
                  <span className="px-4 py-2 bg-slate-900 group-hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-md">
                    Call 911
                  </span>
                </a>
              </div>

              <div className="flex gap-3">
                <Link
                  href="/chat"
                  onClick={() => setShowSosModal(false)}
                  className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-2xl text-center shadow-lg transition-all"
                >
                  Talk to AI Therapist Now
                </Link>
                <button
                  onClick={() => setShowSosModal(false)}
                  className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-2xl transition-all"
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
