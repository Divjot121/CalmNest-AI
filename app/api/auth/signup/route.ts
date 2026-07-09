import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';
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

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: 'User already exists with this email address' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name,
        role: 'USER',
        isVerified: true, // Auto-verify in demo/enterprise free deployment
        streak: 1,
        bestStreak: 1,
        lastCheckIn: new Date(),
      },
    });

    // Create default welcome conversation and initial habits
    await prisma.conversation.create({
      data: {
        userId: user.id,
        title: 'Welcome to CalmNest',
        messages: {
          create: [
            {
              role: 'assistant',
              content: `Hello ${user.name}! Welcome to CalmNest, your AI-powered mental wellness safe space. How are you feeling right now?`,
              sentiment: 'Hopeful',
            },
          ],
        },
      },
    });

    await prisma.habit.createMany({
      data: [
        { userId: user.id, name: 'Daily 10m Mindful Walk', icon: '🚶‍♂️', frequency: 'DAILY', color: '#10b981' },
        { userId: user.id, name: 'Evening Gratitude Journal', icon: '📓', frequency: 'DAILY', color: '#6366f1' },
        { userId: user.id, name: '5m Deep Breathing', icon: '🧘', frequency: 'DAILY', color: '#3b82f6' },
      ],
    });

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = await signAccessToken(tokenPayload);
    const refreshToken = await signRefreshToken({ userId: user.id });

    await prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        deviceInfo: req.headers.get('user-agent') || 'Browser',
        ipAddress: ip,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'SIGNUP',
        details: 'User registered account',
        ipAddress: ip,
      },
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        streak: user.streak,
        bestStreak: user.bestStreak,
      },
      token: accessToken,
    });

    res.cookies.set('calmnest_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    });

    res.cookies.set('calmnest_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
