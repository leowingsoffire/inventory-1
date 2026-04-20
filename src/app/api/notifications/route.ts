import { NextRequest, NextResponse } from 'next/server';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteOldNotifications,
  ensureNotificationTable,
} from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const [notifications, unreadCount] = await Promise.all([
      getNotifications(userId, { unreadOnly, limit, offset }),
      getUnreadCount(userId),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ids, all } = body;

    if (all && userId) {
      await markAllAsRead(userId);
    } else if (ids && Array.isArray(ids) && ids.length > 0) {
      await markAsRead(ids);
    } else {
      return NextResponse.json({ error: 'Provide ids array or { all: true, userId }' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/notifications error:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const daysOld = parseInt(searchParams.get('daysOld') || '30', 10);
    await deleteOldNotifications(userId, daysOld);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/notifications error:', error);
    return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 });
  }
}
