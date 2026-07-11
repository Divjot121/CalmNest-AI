'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Trash2, Check, Clock, Loader2, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationDropdown() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();

      const channelName = `user_notifications_${user.id}`;

      // Clean up any existing channel with the same name before creating a new one (React 18 Strict Mode)
      const existingChannel = supabase.getChannels().find(
        (c) => c.topic === `realtime:${channelName}` || c.topic === channelName
      );
      if (existingChannel) {
        supabase.removeChannel(existingChannel);
      }

      // Realtime subscription for incoming notifications
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchNotifications();
          // Trigger subtle sound or visual check
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifId: id })
      });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' })
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {}
  };

  const handleClearAll = async () => {
    try {
      await fetch('/api/notifications', { method: 'DELETE' });
      setNotifications([]);
    } catch (e) {}
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 hover:bg-slate-100 dark:hover:bg-[#252932] rounded-xl transition-all text-slate-600 dark:text-slate-300"
        title="Sanctuary Notifications"
      >
        <Bell size={18} strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#6B907B] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white dark:border-[#1E2128]">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1E2128] border border-slate-200/70 dark:border-[#2B2F38] rounded-2xl shadow-lg z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-[#252932]/30 border-b border-slate-100 dark:border-[#2B2F38] flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Notifications</span>
              {notifications.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-primary dark:text-[#A1C2D4] hover:underline font-semibold"
                  >
                    Mark read
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={handleClearAll}
                    className="text-[10px] text-rose-500 hover:underline font-semibold"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-[#2B2F38]">
              {loading && notifications.length === 0 ? (
                <div className="py-8 flex justify-center items-center text-slate-400">
                  <Loader2 size={16} className="animate-spin mr-1.5" />
                  <span className="text-xs">Loading...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <div className="w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Sparkles size={16} />
                  </div>
                  <p className="text-xs text-slate-400">No new alerts. Rest in peace.</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                      notif.isRead ? 'opacity-70 bg-white hover:bg-slate-50 dark:bg-[#1E2128]' : 'bg-primary-subtle/20 hover:bg-primary-subtle/35 dark:bg-primary/5 dark:hover:bg-primary/10'
                    }`}
                  >
                    <div className="flex-1 space-y-0.5">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className={`text-xs ${notif.isRead ? 'font-normal text-slate-800 dark:text-slate-200' : 'font-semibold text-slate-900 dark:text-white'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-[9px] text-slate-400 font-mono flex items-center gap-0.5 shrink-0 mt-0.5">
                          <Clock size={9} />
                          {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal font-normal">
                        {notif.body}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <span className="w-1.5 h-1.5 bg-[#6B907B] rounded-full mt-1.5 shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
