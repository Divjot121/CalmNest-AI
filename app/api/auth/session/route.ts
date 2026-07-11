import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, email, name, role, avatar_url, streak, best_streak')
      .eq('id', session.user.id)
      .single();

    if (error || !user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'USER',
        avatarUrl: user.avatar_url,
        streak: user.streak ?? 1,
        bestStreak: user.best_streak ?? 1,
      },
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
