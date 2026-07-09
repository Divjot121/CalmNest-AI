import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken, TokenPayload } from './jwt';
import { prisma } from './db';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getAuthSession(reqHeaderOrRequest?: NextRequest | Headers): Promise<{
  user: {
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'MODERATOR' | 'ADMIN';
    avatarUrl: string | null;
    streak?: number;
    bestStreak?: number;
    isAnonymous?: boolean;
  };
} | null> {
  try {
    let token: string | undefined;

    if (reqHeaderOrRequest && 'cookies' in reqHeaderOrRequest) {
      token = reqHeaderOrRequest.cookies.get('calmnest_token')?.value;
      if (!token && reqHeaderOrRequest.headers.get('authorization')?.startsWith('Bearer ')) {
        token = reqHeaderOrRequest.headers.get('authorization')?.split(' ')[1];
      }
    } else if (reqHeaderOrRequest && 'get' in reqHeaderOrRequest) {
      const authHeader = (reqHeaderOrRequest as Headers).get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get('calmnest_token')?.value;
    }

    if (!token) return null;

    const payload = await verifyAccessToken(token);
    if (!payload || !payload.userId) return null;

    const user: any = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        streak: true,
        bestStreak: true,
      },
    });

    if (!user) return null;

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'USER' | 'MODERATOR' | 'ADMIN',
        avatarUrl: user.avatarUrl,
        streak: user.streak ?? 1,
        bestStreak: user.bestStreak ?? 1,
        isAnonymous: user.email?.startsWith('anon_') || false,
      },
    };
  } catch (error) {
    return null;
  }
}

export async function requireAuth(req: NextRequest) {
  const session = await getAuthSession(req);
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session.user;
}

export async function requireRole(req: NextRequest, allowedRoles: ('USER' | 'MODERATOR' | 'ADMIN')[]) {
  const user = await requireAuth(req);
  if (!allowedRoles.includes(user.role)) {
    throw new Error('FORBIDDEN');
  }
  return user;
}
