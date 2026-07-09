import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

const resetSchema = z.object({
  token: z.string().min(10, 'Invalid recovery token'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = resetSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { token, newPassword } = validation.data;
    // Verify token or find associated session/user
    const session = await prisma.session.findUnique({ where: { token } });
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Recovery token has expired or is invalid' }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash },
    });

    await prisma.session.delete({ where: { id: session.id } });
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'PASSWORD_RESET_COMPLETED',
        details: 'Password reset successfully completed',
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
