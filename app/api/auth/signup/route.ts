import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/ratelimit';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rateCheck = checkRateLimit(`signup_${ip}`, 5, 60000);
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Too many signup attempts. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { email, password, name } = validation.data;
    const normalizedEmail = email.toLowerCase();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: password,
      options: {
        data: { name },
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Could not register user' }, { status: 400 });
    }

    const userId = authData.user.id;

    // Create profile in public schema
    await supabase.from('profiles').upsert({
      id: userId,
      email: normalizedEmail,
      name,
      role: 'USER',
      streak: 1,
      best_streak: 1,
      last_check_in: new Date().toISOString(),
    });

    // Create welcome conversation
    const { data: conv } = await supabase.from('conversations').insert({
      user_id: userId,
      anon_uuid: userId,
      title: 'Welcome to CalmNest',
      risk_detected: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select('id').single();

    if (conv?.id) {
      await supabase.from('messages').insert({
        conversation_id: conv.id,
        role: 'assistant',
        content: `Hello ${name}! Welcome to CalmNest, your AI-powered mental wellness safe space. How are you feeling right now?`,
        sentiment: 'Hopeful',
        created_at: new Date().toISOString(),
      });
    }

    // Create default habits
    await supabase.from('habits').insert([
      { user_id: userId, anon_uuid: userId, name: 'Daily 10m Mindful Walk', icon: '🚶‍♂️', frequency: 'DAILY', color: '#10b981', streak: 0, best_streak: 0 },
      { user_id: userId, anon_uuid: userId, name: 'Evening Gratitude Journal', icon: '📓', frequency: 'DAILY', color: '#6366f1', streak: 0, best_streak: 0 },
      { user_id: userId, anon_uuid: userId, name: '5m Deep Breathing', icon: '🧘', frequency: 'DAILY', color: '#3b82f6', streak: 0, best_streak: 0 },
    ]);

    const accessToken = authData.session?.access_token || 'pending_auth';
    const refreshToken = authData.session?.refresh_token || 'pending_auth';

    const res = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: normalizedEmail,
        name,
        role: 'USER',
        avatarUrl: null,
        streak: 1,
        bestStreak: 1,
      },
      token: accessToken,
    });

    if (authData.session) {
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
    }

    return res;
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
