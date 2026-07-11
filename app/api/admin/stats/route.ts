import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    
    // Check if the user is an admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    // Fetch aggregates
    const { count: totalUsers } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
    
    // Active users in last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('last_check_in', oneDayAgo);

    const { count: totalChats } = await supabase.from('conversations').select('id', { count: 'exact', head: true });
    
    const { count: riskCases } = await supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('risk_detected', true);

    const { count: totalReflections } = await supabase.from('journals').select('id', { count: 'exact', head: true });
    
    const { count: totalHabits } = await supabase.from('habits').select('id', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalChats: totalChats || 0,
        riskCases: riskCases || 0,
        totalReflections: totalReflections || 0,
        totalHabits: totalHabits || 0
      }
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
