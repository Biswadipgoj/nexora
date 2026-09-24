import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { workItemSchemas, invitationSchemas } from '@/lib/validation/workspace';
import { isDone, isInProgress, countFocus, bucketOf, formatDueLabel } from '@/lib/work/focus';
import { suggestProjectKey, projectKeyError } from '@/lib/work/project-key';
import { descriptionText, withStatusCategories } from '@/lib/work/types';
import { categoryForSlug } from '@/lib/db/reference-ids';
import { formatRelative } from '@/lib/format/time';
import {
  DEMO_PROJECT,
  DEMO_WORKSPACE,
  addDemoProject,
  createDemoWorkItem,
  getDemoWorkItem,
  getDemoWorkItems,
  resetDemoStore,
  softDeleteDemoWorkItem,
} from '@/lib/demo/demo-store';
import { resetInvitationStore } from '@/lib/invitations/store';
import { updateSession } from '@/lib/supabase/middleware';
import * as workItemsRoute from '@/app/api/work-items/route';
import * as workItemRoute from '@/app/api/work-items/[id]/route';
import * as projectsRoute from '@/app/api/projects/route';
import * as invitationsRoute from '@/app/api/invitations/route';
import * as acceptRoute from '@/app/api/invitations/accept/route';
import * as shortenRoute from '@/app/api/shorten/route';

/**
 * Regression tests for defects fixed alongside the redesign. The test
 * environment has no Supabase credentials, so every route runs in demo mode —
 * the same path a visitor exploring the sample workspace takes.
 */

const json = (url: string, method: string, body?: unknown) =>
  new NextRequest(`http://localhost:3000${url}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

beforeEach(() => {
  resetDemoStore();
  resetInvitationStore();
});

describe('Creating a task without optional fields', () => {
  it('accepts null due date and description (the quick-create form sends them)', () => {
    const parsed = workItemSchemas.create.safeParse({
      workspace_id: DEMO_WORKSPACE.id,
      project_id: DEMO_PROJECT.id,
      type_id: 'type-task',
      status_id: 'status-todo',
      title: 'Write the release notes',
      priority: 2,
      due_date: null,
      description: null,
    });
    expect(parsed.success).toBe(true);
  });

  it('POST /api/work-items creates it and returns a real sequence', async () => {
    const res = await workItemsRoute.POST(
      json('/api/work-items', 'POST', {
        workspace_id: DEMO_WORKSPACE.id,
        project_id: DEMO_PROJECT.id,
        type_id: 'type-bug',
        status_id: 'status-todo',
        title: 'Crash on rotate',
        due_date: null,
        description: null,
      })
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.workItem.sequence).toBe(106);
    expect(data.workItem.status_category).toBe('todo');
  });

  it('rejects a blank title', async () => {
    const res = await workItemsRoute.POST(
      json('/api/work-items', 'POST', {
        workspace_id: DEMO_WORKSPACE.id,
        project_id: DEMO_PROJECT.id,
        type_id: 'type-task',
        status_id: 'status-todo',
        title: '   ',
      })
    );
    expect(res.status).toBe(400);
  });
});

describe('Status checks work for database statuses', () => {
  const uuid = 'd1a0c0de-0000-4000-8000-000000000001';

  it('counts a UUID status in a done column as done', () => {
    const item = { id: 'x', title: 'Ship it', status_id: uuid, status_category: 'done' };
    expect(isDone(item)).toBe(true);
    expect(isInProgress({ ...item, status_category: 'in_progress' })).toBe(true);
    expect(countFocus([item]).completed).toBe(1);
  });

  it('tags items with the category of their status', () => {
    const [tagged] = withStatusCategories([{ status_id: uuid }], [{ id: uuid, category: 'done' }]);
    expect(tagged.status_category).toBe('done');
    expect(categoryForSlug('status-review')).toBe('in_progress');
  });
});

describe('Demo store', () => {
  it('reset brings a deleted sample card back', () => {
    const [first] = getDemoWorkItems();
    softDeleteDemoWorkItem(first.id);
    expect(getDemoWorkItem(first.id)).toBeUndefined();
    resetDemoStore();
    expect(getDemoWorkItem(first.id)).toBeDefined();
  });

  it('numbers tasks per project and never reuses an id', () => {
    const project = addDemoProject({ name: 'Website', key: 'WEB' });
    const a = createDemoWorkItem({ workspace_id: DEMO_WORKSPACE.id, project_id: project.id, type_id: 'type-task', status_id: 'status-todo', title: 'A' });
    const b = createDemoWorkItem({ workspace_id: DEMO_WORKSPACE.id, project_id: project.id, type_id: 'type-task', status_id: 'status-todo', title: 'B' });
    expect([a.sequence, b.sequence]).toEqual([1, 2]);
    expect(a.id).not.toBe(b.id);
  });

  it('keeps its sample dates relative to today, so the board is never all overdue', () => {
    resetDemoStore();
    const buckets = getDemoWorkItems(DEMO_PROJECT.id)
      .filter((item) => !isDone(item))
      .map((item) => bucketOf(item));
    expect(buckets).toContain('due-today');
    expect(buckets.filter((b) => b === 'overdue')).toHaveLength(1);
  });

  it('DELETE of a missing item is a 404, not a success', async () => {
    const res = await workItemRoute.DELETE(json('/api/work-items/nope', 'DELETE'), {
      params: Promise.resolve({ id: 'nope' }),
    });
    expect(res.status).toBe(404);
  });
});

describe('Projects API', () => {
  it('lists the demo projects, including new ones', async () => {
    addDemoProject({ name: 'Website', key: 'WEB' });
    const res = await projectsRoute.GET(json('/api/projects', 'GET'));
    const data = await res.json();
    expect(data.projects.map((p: { key: string }) => p.key)).toEqual(['WEB', 'APP']);
  });

  it('refuses a duplicate key instead of creating a second APP', async () => {
    const res = await projectsRoute.POST(
      json('/api/projects', 'POST', { workspace_id: DEMO_WORKSPACE.id, name: 'Another app', key: 'APP' })
    );
    expect(res.status).toBe(409);
  });
});

describe('Invitations', () => {
  it('never grants ownership through an invite', () => {
    const parsed = invitationSchemas.create.safeParse({
      workspace_id: DEMO_WORKSPACE.id,
      project_id: DEMO_PROJECT.id,
      email: 'a@b.co',
      role: 'owner',
    });
    expect(parsed.success).toBe(false);
  });

  it('can be created, listed, revoked by id, and then no longer resolves', async () => {
    const created = await invitationsRoute.POST(
      json('/api/invitations', 'POST', {
        workspace_id: DEMO_WORKSPACE.id,
        project_id: DEMO_PROJECT.id,
        email: 'priya@example.com',
        role: 'member',
      })
    );
    expect(created.status).toBe(200);
    const { invitation, inviteUrl } = await created.json();
    expect(inviteUrl).toContain(`/invite/${invitation.token}`);

    const list = await invitationsRoute.GET(json(`/api/invitations?projectId=${DEMO_PROJECT.id}`, 'GET'));
    expect((await list.json()).invitations).toHaveLength(1);

    // The share dialog revokes with ?id= — which the route used to ignore.
    const revoked = await invitationsRoute.DELETE(json(`/api/invitations?id=${invitation.id}`, 'DELETE'));
    expect(revoked.status).toBe(200);

    const lookup = await invitationsRoute.GET(json(`/api/invitations?token=${invitation.token}`, 'GET'));
    expect(lookup.status).toBe(404);
  });

  it('does not reveal the token when an invitee looks it up', async () => {
    const created = await invitationsRoute.POST(
      json('/api/invitations', 'POST', {
        workspace_id: DEMO_WORKSPACE.id,
        project_id: DEMO_PROJECT.id,
        email: 'sam@example.com',
        role: 'viewer',
      })
    );
    const { invitation } = await created.json();
    const lookup = await invitationsRoute.GET(json(`/api/invitations?token=${invitation.token}`, 'GET'));
    const data = await lookup.json();
    expect(data.invitation.email).toBe('sam@example.com');
    expect(data.invitation.token).toBeUndefined();
  });

  it('accepts once and refuses a replay', async () => {
    const created = await invitationsRoute.POST(
      json('/api/invitations', 'POST', {
        workspace_id: DEMO_WORKSPACE.id,
        project_id: DEMO_PROJECT.id,
        email: 'lee@example.com',
        role: 'member',
      })
    );
    const { invitation } = await created.json();

    const first = await acceptRoute.POST(json('/api/invitations/accept', 'POST', { token: invitation.token }));
    expect(first.status).toBe(200);
    expect((await first.json()).redirectUrl).toBe(`/projects/${DEMO_PROJECT.id}`);

    const replay = await acceptRoute.POST(json('/api/invitations/accept', 'POST', { token: invitation.token }));
    expect(replay.status).toBe(409);
  });
});

describe('Share links', () => {
  it('will not let a custom alias overwrite an existing link', async () => {
    const first = await shortenRoute.POST(
      json('/api/shorten', 'POST', { projectId: DEMO_PROJECT.id, customAlias: 'team-mobile' })
    );
    expect(first.status).toBe(200);

    const second = await shortenRoute.POST(
      json('/api/shorten', 'POST', { projectId: DEMO_PROJECT.id, customAlias: 'team-mobile' })
    );
    expect(second.status).toBe(409);

    const seeded = await shortenRoute.POST(json('/api/shorten', 'POST', { projectId: DEMO_PROJECT.id, customAlias: 'app' }));
    expect(seeded.status).toBe(409);
  });

  it('refuses links to projects that do not exist', async () => {
    const res = await shortenRoute.POST(json('/api/shorten', 'POST', { projectId: 'not-a-project' }));
    expect(res.status).toBe(404);
  });
});

describe('Session proxy', () => {
  it('lets a signed-out invitee open an invitation', async () => {
    const res = await updateSession(new NextRequest('http://localhost:3000/invite/abc123'));
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('answers unauthenticated API calls with JSON 401, not the sign-in page', async () => {
    const res = await updateSession(new NextRequest('http://localhost:3000/api/work-items?projectId=x'));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('sends a signed-out visitor to sign in and back again', async () => {
    const res = await updateSession(new NextRequest('http://localhost:3000/projects/123'));
    const location = res.headers.get('location') ?? '';
    expect(location).toContain('/auth/login');
    expect(decodeURIComponent(location)).toContain('next=/projects/123');
  });

  it('lets a demo visitor through to the workspace', async () => {
    const req = new NextRequest('http://localhost:3000/dashboard', {
      headers: { cookie: 'nexora_demo_session=true' },
    });
    const res = await updateSession(req);
    expect(res.headers.get('x-nexora-mode')).toBe('demo');
  });
});

describe('Due dates', () => {
  it('reads a bare date as local midnight, so a task due today is not overdue', () => {
    const now = new Date(2026, 8, 24, 20, 30);
    const item = { id: 'x', title: 't', status_id: 'status-todo', due_date: '2026-09-24' };
    expect(bucketOf(item, now)).toBe('due-today');
    expect(formatDueLabel(item, now)).toBe('Due today');
    expect(formatDueLabel({ ...item, due_date: '2026-09-23' }, now)).toBe('1 day overdue');
  });
});

describe('Small helpers', () => {
  it('suggests project keys that start with a letter', () => {
    expect(suggestProjectKey('Customer portal')).toBe('CP');
    expect(suggestProjectKey('Mobile')).toBe('MOB');
    expect(suggestProjectKey('3D viewer')).toBe('DV');
    expect(projectKeyError('3D')).toBe('Start with a letter.');
    expect(projectKeyError('A')).toBe('Use at least 2 characters.');
    expect(projectKeyError('APP')).toBeUndefined();
  });

  it('reads descriptions in either stored format', () => {
    expect(descriptionText('plain')).toBe('plain');
    expect(descriptionText({ ops: [{ insert: 'Delta text\n' }] })).toBe('Delta text');
    expect(descriptionText(null)).toBe('');
  });

  it('formats relative times', () => {
    const now = new Date('2026-09-24T12:00:00Z');
    expect(formatRelative('2026-09-24T11:59:40Z', now)).toBe('just now');
    expect(formatRelative('2026-09-24T11:48:00Z', now)).toBe('12m ago');
    expect(formatRelative('2026-09-24T08:00:00Z', now)).toBe('4h ago');
    expect(formatRelative('Yesterday', now)).toBe('Yesterday');
  });
});
