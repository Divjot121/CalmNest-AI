import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const todayStr = new Date().toISOString().split('T')[0];

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [todayMood, recentLogs, habits, completions, announcements] = await Promise.all([
      prisma.moodLog.findFirst({
        where: {
          userId: user.id,
          createdAt: { gte: todayStart, lte: todayEnd },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.moodLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.habit.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.habitCompletion.findMany({
        where: {
          userId: user.id,
          date: todayStr,
        },
      }),
      prisma.announcement.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
    ]);

    const completedHabitIds = new Set(completions.map((c) => c.habitId));
    const formattedHabits = habits.map((h) => ({
      id: h.id,
      name: h.name,
      icon: h.icon,
      frequency: h.frequency,
      color: h.color,
      streak: h.streak,
      bestStreak: h.bestStreak,
      completedToday: completedHabitIds.has(h.id),
    }));

    const formattedLogs = recentLogs.map((log) => ({
      id: log.id,
      moodScore: log.moodScore,
      intensity: log.intensity,
      tags: JSON.parse(log.tags || '[]'),
      notes: log.notes,
      createdAt: log.createdAt.toISOString(),
    }));

    const formattedTodayMood = todayMood
      ? {
          id: todayMood.id,
          moodScore: todayMood.moodScore,
          intensity: todayMood.intensity,
          tags: JSON.parse(todayMood.tags || '[]'),
          notes: todayMood.notes,
          createdAt: todayMood.createdAt.toISOString(),
        }
      : null;

    // Generate dynamic summary
    let aiSummary = `Welcome back, ${user.name}! You are on a ${(user as any).streak || 1}-day check-in streak. Remember that small daily mindful steps build lasting mental resilience.`;
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
