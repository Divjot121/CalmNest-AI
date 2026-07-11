import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    await supabase.auth.signOut().catch(() => {});

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
