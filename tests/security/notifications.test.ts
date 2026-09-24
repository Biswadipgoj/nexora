import { describe, it, expect } from 'vitest';
import { GET, PATCH, POST } from '@/app/api/notifications/route';
import { NextRequest } from 'next/server';

describe('Notifications API & Engine Suite', () => {
  it('GET /api/notifications returns a list of notifications', async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.notifications).toBeDefined();
    expect(Array.isArray(data.notifications)).toBe(true);
    expect(data.notifications.length).toBeGreaterThan(0);

    const first = data.notifications[0];
    expect(first.id).toBeDefined();
    expect(first.title).toBeDefined();
    expect(typeof first.isRead).toBe('boolean');
  });

  it('POST /api/notifications creates a new unread notification', async () => {
    const req = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Deployment Succeeded',
        description: 'Production v2.4 successfully deployed to edge nodes.',
        type: 'milestone',
        targetKey: 'APP-105',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.notification).toBeDefined();
    expect(data.notification.title).toBe('Deployment Succeeded');
    expect(data.notification.isRead).toBe(false);
    expect(data.notification.targetKey).toBe('APP-105');
  });

  it('POST /api/notifications rejects payloads missing a title', async () => {
    const req = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Missing title payload',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Title is required');
  });

  it('PATCH /api/notifications marks all notifications as read', async () => {
    const req = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ all: true }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);

    // Verify through GET that all items are read
    const getRes = await GET();
    const data = await getRes.json();
    const unread = data.notifications.filter((n: { isRead: boolean }) => !n.isRead);
    expect(unread.length).toBe(0);
  });
});
