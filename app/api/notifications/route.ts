import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearNotifications
} from '@/lib/db-service';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const notifications = await getNotifications(user.id);
    return NextResponse.json({ success: true, notifications });
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
    const { notifId, action } = body;

    if (action === 'mark_all_read') {
      await markAllNotificationsRead(user.id);
      return NextResponse.json({ success: true });
    }

    if (!notifId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    await markNotificationRead(notifId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    await clearNotifications(user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
