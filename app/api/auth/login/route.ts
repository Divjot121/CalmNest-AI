import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';
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

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check check-in streak
    const now = new Date();
    let newStreak = user.streak;
    if (user.lastCheckIn) {
      const diffHours = (now.getTime() - new Date(user.lastCheckIn).getTime()) / (1000 * 60 * 60);
      if (diffHours >= 20 && diffHours <= 48) {
        newStreak += 1;
      } else if (diffHours > 48) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        streak: newStreak,
        bestStreak: Math.max(user.bestStreak, newStreak),
        lastCheckIn: now,
      },
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
        action: 'LOGIN',
        details: 'User logged in successfully',
        ipAddress: ip,
      },
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatarUrl,
        streak: updatedUser.streak,
        bestStreak: updatedUser.bestStreak,
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
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
