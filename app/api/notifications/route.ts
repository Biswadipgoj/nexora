import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { DEMO_USER, DEMO_WORKSPACE } from '@/lib/demo/demo-store';

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

// In-memory fallback notifications store
let runtimeNotifications: ApiNotification[] = [
  {
    id: 'n1',
    workspace_id: DEMO_WORKSPACE.id,
    user_id: DEMO_USER.id,
    type: 'comment',
    title: 'New comment on Customer Onboarding Flow',
    description: 'Maya Patel: "Final checkout assets and copy look fantastic. Ready for staging review!"',
    timestamp: '12m ago',
    isRead: false,
    author: { name: 'Maya Patel', avatar: '' },
    targetKey: 'APP-102',
  },
  {
    id: 'n2',
    workspace_id: DEMO_WORKSPACE.id,
    user_id: DEMO_USER.id,
    type: 'assign',
    title: 'Assigned to you',
    description: 'Alex Morgan assigned you as lead for: "Quarterly budget allocation & team resource plan"',
    timestamp: '1h ago',
    isRead: false,
    author: { name: 'Alex Morgan', avatar: '' },
    targetKey: 'APP-104',
  },
  {
    id: 'n3',
    workspace_id: DEMO_WORKSPACE.id,
    user_id: DEMO_USER.id,
    type: 'milestone',
    title: 'Sprint 1 milestone reached',
    description: 'All planned work for this milestone is now in Done.',
    timestamp: '4h ago',
    isRead: true,
    author: { name: 'Workspace', avatar: '' },
    targetKey: 'APP-91',
  },
];

export async function GET() {
  try {
    let supabase: any = null;
    let userId = DEMO_USER.id;
    try {
      supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) userId = user.id;
    } catch {
      // Outside request scope / test environment
    }

    // Try fetching from Supabase notifications table if configured
    if (supabase) {
      try {
        const { data: dbNotifications, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && dbNotifications && dbNotifications.length > 0) {
          const mapped: ApiNotification[] = dbNotifications.map((n: any) => ({
            id: n.id,
            workspace_id: n.workspace_id,
            user_id: n.user_id,
            type: n.type || 'comment',
            title: n.title,
            description: n.body || '',
            timestamp: new Date(n.created_at).toLocaleDateString(),
            isRead: Boolean(n.read_at),
            author: { name: 'Workspace', avatar: '' },
            targetKey: n.entity_id || undefined,
          }));
          return NextResponse.json({ notifications: mapped });
        }
      } catch {
        // Fall through to runtime store
      }
    }

    return NextResponse.json({ notifications: runtimeNotifications });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch notifications';
    logger.error('Notifications GET error', { error: message });
    return NextResponse.json({ notifications: runtimeNotifications });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, all } = body;

    let supabase: any = null;
    let userId = DEMO_USER.id;
    try {
      supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) userId = user.id;
    } catch {
      // Outside request scope / test environment
    }

    if (all) {
      runtimeNotifications = runtimeNotifications.map((n) => ({ ...n, isRead: true }));
      if (supabase) {
        try {
          await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('user_id', userId)
            .is('read_at', null);
        } catch {
          // ignore
        }
      }
    } else if (id) {
      runtimeNotifications = runtimeNotifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      if (supabase) {
        try {
          await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', id);
        } catch {
          // ignore
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update notification';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    let supabase: any = null;
    let user: any = null;
    try {
      supabase = await createServerClient();
      const { data } = await supabase.auth.getUser();
      user = data?.user;
    } catch {
      // Outside request scope / test environment
    }

    const newNotification: ApiNotification = {
      id: 'notif-' + Date.now(),
      workspace_id: body.workspace_id || DEMO_WORKSPACE.id,
      user_id: user?.id || DEMO_USER.id,
      type: body.type || 'comment',
      title: body.title,
      description: body.description || body.body || '',
      timestamp: 'Just now',
      isRead: false,
      author: {
        name: body.author_name || user?.user_metadata?.full_name || 'Team Member',
        avatar: user?.user_metadata?.avatar_url || '',
      },
      targetKey: body.targetKey,
    };

    runtimeNotifications.unshift(newNotification);

    if (supabase) {
      try {
        await supabase.from('notifications').insert({
          workspace_id: newNotification.workspace_id,
          user_id: newNotification.user_id,
          type: newNotification.type,
          title: newNotification.title,
          body: newNotification.description,
          entity_id: newNotification.targetKey || null,
          created_at: new Date().toISOString(),
        });
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ success: true, notification: newNotification }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create notification';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
