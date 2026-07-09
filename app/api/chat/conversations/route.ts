import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const createConvSchema = z.object({
  title: z.string().max(100).optional().default('New Session'),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        riskDetected: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, conversations });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json().catch(() => ({}));
    const validation = createConvSchema.safeParse(body);
    const title = validation.success ? validation.data.title : 'New Session';

    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        title,
        messages: {
          create: [
            {
              role: 'assistant',
              content: `Hello ${user.name}! I'm here to listen, support, and help you navigate whatever is on your mind today. How are you feeling right now?`,
              sentiment: 'Hopeful',
            },
          ],
        },
      },
      select: {
        id: true,
        title: true,
        riskDetected: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, conversation });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
