import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';
import { isDemoRequest } from '@/lib/supabase/config';
import { logger } from '@/lib/logger';
import { DEMO_USER, DEMO_WORKSPACE } from '@/lib/demo/demo-store';
import { UUID_REGEX } from '@/lib/db/reference-ids';
import { formatRelative } from '@/lib/format/time';

export interface ApiNotification {
  id: string;
  workspace_id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  author: { name: string; avatar: string };
  targetKey?: string;
}

interface NotificationRow {
  id: string;
  workspace_id: string;
  user_id: string;
  type: string | null;
  title: string;
  body: string | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
}

const NOTIFICATION_COLUMNS = 'id, workspace_id, user_id, type, title, body, entity_id, read_at, created_at';

/**
 * Sample notifications for the demo workspace only.
 *
 * These used to be returned to signed-in users whenever their own table was
 * empty, and POST pushed into the same process-wide array — so a real user saw
 * invented activity from "Maya Patel", and one user's notification could be
 * served to another. The array is now read and written in demo mode alone.
 */
let demoNotifications: ApiNotification[] = [
  {
    id: 'n1',
    workspace_id: DEMO_WORKSPACE.id,
    user_id: DEMO_USER.id,
    type: 'comment',
    title: 'Sarah Chen commented on Stripe checkout integration',
    description: '“Added the Apple Pay and Google Pay sheet specs to the Figma branch.”',
    timestamp: new Date(Date.now() - 12 * 60_000).toISOString(),
    isRead: false,
    author: { name: 'Sarah Chen', avatar: '' },
    targetKey: 'APP-104',
  },
  {
    id: 'n2',
    workspace_id: DEMO_WORKSPACE.id,
    user_id: DEMO_USER.id,
    type: 'assign',
    title: 'You were assigned Biometric authentication on Android',
    description: 'Due Sep 18 · High priority',
    timestamp: new Date(Date.now() - 60 * 60_000).toISOString(),
    isRead: false,
    author: { name: 'Sarah Chen', avatar: '' },
    targetKey: 'APP-101',
  },
  {
    id: 'n3',
    workspace_id: DEMO_WORKSPACE.id,
    user_id: DEMO_USER.id,
    type: 'status',
    title: 'Fix login redirect loop moved to Done',
    description: 'Merged into main and verified in staging.',
    timestamp: new Date(Date.now() - 4 * 60 * 60_000).toISOString(),
    isRead: true,
    author: { name: 'Alex Morgan', avatar: '' },
    targetKey: 'APP-91',
  },
];

type ServerClient = Awaited<ReturnType<typeof createServerClient>>;

type RequestContext =
  | { mode: 'demo' }
  | { mode: 'live'; supabase: ServerClient; userId: string }
  | { mode: 'anonymous' };

async function resolveContext(): Promise<RequestContext> {
  try {
    const cookieStore = await cookies();
    if (isDemoRequest(cookieStore)) return { mode: 'demo' };

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? { mode: 'live', supabase, userId: user.id } : { mode: 'anonymous' };
  } catch {
    // Outside a request scope (unit tests): behave as the demo workspace.
    return { mode: 'demo' };
  }
}

function toApiNotification(row: NotificationRow): ApiNotification {
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    user_id: row.user_id,
    type: row.type || 'comment',
    title: row.title,
    description: row.body || '',
    timestamp: row.created_at,
    isRead: Boolean(row.read_at),
    author: { name: 'Workspace', avatar: '' },
    targetKey: row.entity_id || undefined,
  };
}

/** Relative labels are computed per response so they never go stale. */
function present(list: ApiNotification[]): ApiNotification[] {
  return list.map((n) => ({ ...n, timestamp: formatRelative(n.timestamp) }));
}

export async function GET() {
  const ctx = await resolveContext();

  if (ctx.mode === 'demo') {
    return NextResponse.json({ notifications: present(demoNotifications) });
  }
  if (ctx.mode === 'anonymous') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await ctx.supabase
    .from('notifications')
    .select(NOTIFICATION_COLUMNS)
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    logger.error('Notifications GET error', { error: error.message });
    return NextResponse.json({ error: 'Could not load notifications.' }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as NotificationRow[];
  return NextResponse.json({ notifications: present(rows.map(toApiNotification)) });
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { id?: unknown; all?: unknown };
  const id = typeof body.id === 'string' ? body.id : null;
  const all = body.all === true;

  if (!id && !all) {
    return NextResponse.json({ error: 'Provide a notification id or all: true.' }, { status: 400 });
  }

  const ctx = await resolveContext();

  if (ctx.mode === 'demo') {
    demoNotifications = demoNotifications.map((n) => (all || n.id === id ? { ...n, isRead: true } : n));
    return NextResponse.json({ success: true });
  }
  if (ctx.mode === 'anonymous') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let query = ctx.supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', ctx.userId)
    .is('read_at', null);

  if (!all && id) {
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Notification not found.' }, { status: 404 });
    }
    query = query.eq('id', id);
  }

  const { error } = await query;
  if (error) {
    logger.error('Notifications PATCH error', { error: error.message });
    return NextResponse.json({ error: 'Could not update notifications.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const title = typeof body?.title === 'string' ? body.title.trim() : '';

  if (!body || !title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const str = (v: unknown) => (typeof v === 'string' ? v : undefined);
  const ctx = await resolveContext();

  if (ctx.mode === 'anonymous') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const notification: ApiNotification = {
    id: `notif-${Date.now()}`,
    workspace_id: str(body.workspace_id) || DEMO_WORKSPACE.id,
    user_id: ctx.mode === 'live' ? ctx.userId : DEMO_USER.id,
    type: str(body.type) || 'comment',
    title: title.slice(0, 200),
    description: (str(body.description) || str(body.body) || '').slice(0, 1000),
    timestamp: new Date().toISOString(),
    isRead: false,
    author: { name: str(body.author_name) || 'Workspace', avatar: '' },
    targetKey: str(body.targetKey),
  };

  if (ctx.mode === 'demo') {
    demoNotifications = [notification, ...demoNotifications].slice(0, 100);
    return NextResponse.json(
      { success: true, notification: { ...notification, timestamp: 'just now' } },
      { status: 201 }
    );
  }

  if (!UUID_REGEX.test(notification.workspace_id)) {
    return NextResponse.json({ error: 'A valid workspace_id is required.' }, { status: 400 });
  }

  const { data, error } = await ctx.supabase
    .from('notifications')
    .insert({
      workspace_id: notification.workspace_id,
      user_id: ctx.userId,
      type: notification.type,
      title: notification.title,
      body: notification.description,
      // entity_id is a uuid column; display keys such as "APP-104" are not.
      entity_id: notification.targetKey && UUID_REGEX.test(notification.targetKey) ? notification.targetKey : null,
    })
    .select(NOTIFICATION_COLUMNS)
    .single();

  if (error || !data) {
    logger.warn('Notification insert failed', { error: error?.message });
    return NextResponse.json({ error: 'Could not create the notification.' }, { status: 403 });
  }

  const stored = toApiNotification(data as unknown as NotificationRow);
  return NextResponse.json(
    { success: true, notification: { ...stored, targetKey: notification.targetKey, timestamp: 'just now' } },
    { status: 201 }
  );
}
