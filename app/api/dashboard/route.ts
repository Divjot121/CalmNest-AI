import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const todayStr = new Date().toISOString().split('T')[0];

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      { data: todayMoods },
      { data: recentLogsData },
      { data: habitsData },
      { data: completionsData },
      { data: announcementsData }
    ] = await Promise.all([
      supabase
        .from('moods')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString())
        .order('created_at', { ascending: false })
        .limit(1),
      supabase
        .from('moods')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('date_str', todayStr),
      supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3),
    ]);

    const todayMood = todayMoods && todayMoods.length > 0 ? todayMoods[0] : null;
    const recentLogs = recentLogsData || [];
    const habits = habitsData || [];
    const completions = completionsData || [];
    const announcements = announcementsData || [];

    const completedHabitIds = new Set(completions.map((c: any) => c.habit_id));
    const formattedHabits = habits.map((h: any) => ({
      id: h.id,
      name: h.name,
      icon: h.icon,
      frequency: h.frequency,
      color: h.color,
      streak: h.streak,
      bestStreak: h.best_streak,
      completedToday: completedHabitIds.has(h.id),
    }));

    const formattedLogs = recentLogs.map((log: any) => ({
      id: log.id,
      moodScore: log.mood_score,
      intensity: log.intensity,
      tags: typeof log.tags === 'string' ? JSON.parse(log.tags || '[]') : (log.tags || []),
      notes: log.notes,
      createdAt: log.created_at || new Date().toISOString(),
    }));

    const formattedTodayMood = todayMood
      ? {
          id: todayMood.id,
          moodScore: todayMood.mood_score,
          intensity: todayMood.intensity,
          tags: typeof todayMood.tags === 'string' ? JSON.parse(todayMood.tags || '[]') : (todayMood.tags || []),
          notes: todayMood.notes,
          createdAt: todayMood.created_at || new Date().toISOString(),
        }
      : null;

    // Generate dynamic summary
    let aiSummary = `Welcome back, ${user.name}! You are on a ${user.streak || 1}-day check-in streak. Remember that small daily mindful steps build lasting mental resilience.`;
    if (formattedTodayMood) {
      if (formattedTodayMood.moodScore >= 4) {
        aiSummary = `You're reporting a positive mood today (${formattedTodayMood.moodScore}/5)! Your tags indicate good momentum. Take a moment to notice what contributed to this feeling.`;
      } else if (formattedTodayMood.moodScore <= 2) {
        aiSummary = `You logged a lower mood today (${formattedTodayMood.moodScore}/5). Be gentle with yourself. Consider trying the 4-7-8 Breathing Exercise or chatting with your AI Therapist.`;
      }
    }

    return NextResponse.json({
      success: true,
      todayMood: formattedTodayMood,
      recentLogs: formattedLogs,
      streak: user.streak || 0,
      habits: formattedHabits,
      aiSummary,
      announcements,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
