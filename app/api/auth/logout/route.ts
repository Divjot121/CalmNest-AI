import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (session?.user?.id) {
      const cookieStore = await cookies();
      const token = cookieStore.get('calmnest_token')?.value;
      if (token) {
        await prisma.session.deleteMany({ where: { token } }).catch(() => {});
      }
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'LOGOUT',
          details: 'User logged out',
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        },
      }).catch(() => {});
    }

    const res = NextResponse.json({ success: true });
    res.cookies.delete('calmnest_token');
    res.cookies.delete('calmnest_refresh');
    return res;
  } catch (error) {
    const res = NextResponse.json({ success: true });
    res.cookies.delete('calmnest_token');
    res.cookies.delete('calmnest_refresh');
    return res;
  }
}
