import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

const resetSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = resetSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { newPassword } = validation.data;
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      return NextResponse.json({ error: error.message || 'Recovery token has expired or is invalid' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
