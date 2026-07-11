import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

const createConvSchema = z.object({
  title: z.string().max(100).optional().default('New Session'),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('id, title, risk_detected, updated_at')
      .or(`user_id.eq.${user.id},anon_uuid.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    const mapped = (conversations || []).map((c: any) => ({
      id: c.id,
      title: c.title,
      riskDetected: c.risk_detected,
      updatedAt: c.updated_at,
    }));

    return NextResponse.json({ success: true, conversations: mapped });
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

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        anon_uuid: user.id,
        title,
        risk_detected: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id, title, risk_detected, updated_at')
      .single();

    if (error || !conversation) {
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      role: 'assistant',
      content: `Hello ${user.name}! I'm here to listen, support, and help you navigate whatever is on your mind today. How are you feeling right now?`,
      sentiment: 'Hopeful',
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        title: conversation.title,
        riskDetected: conversation.risk_detected,
        updatedAt: conversation.updated_at,
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
