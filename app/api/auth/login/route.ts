import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/ratelimit';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rateCheck = checkRateLimit(`login_${ip}`, 10, 60000);
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { email, password } = validation.data;
    const normalizedEmail = email.toLowerCase();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password,
    });

    if (authError || !authData.user || !authData.session) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const userId = authData.user.id;

    // Fetch profile from profiles table
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const now = new Date();
    let newStreak = userProfile?.streak || 1;
    let bestStreak = userProfile?.best_streak || 1;

    if (userProfile?.last_check_in) {
      const diffHours = (now.getTime() - new Date(userProfile.last_check_in).getTime()) / (1000 * 60 * 60);
      if (diffHours >= 20 && diffHours <= 48) {
        newStreak += 1;
      } else if (diffHours > 48) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }
    bestStreak = Math.max(bestStreak, newStreak);

    await supabase
      .from('profiles')
      .update({
        streak: newStreak,
        best_streak: bestStreak,
        last_check_in: now.toISOString(),
      })
      .eq('id', userId);

    const accessToken = authData.session.access_token;
    const refreshToken = authData.session.refresh_token;

    const res = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: userProfile?.email || normalizedEmail,
        name: userProfile?.name || authData.user.user_metadata?.name || 'User',
        role: userProfile?.role || 'USER',
        avatarUrl: userProfile?.avatar_url || null,
        streak: newStreak,
        bestStreak: bestStreak,
      },
      token: accessToken,
    });

    res.cookies.set('calmnest_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    res.cookies.set('calmnest_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
