import { NextResponse } from 'next/server';
import { DEMO_USER, resetDemoStore } from '@/lib/demo/demo-store';
import { DEMO_COOKIE_MAX_AGE, DEMO_COOKIE_NAME, DEMO_COOKIE_OPTIONS } from '@/lib/supabase/config';

/** Starts a demo session in the sample workspace. */
export async function POST() {
  try {
    resetDemoStore();

    const response = NextResponse.json({ success: true, user: DEMO_USER, redirect: '/dashboard' });
    response.cookies.set({ name: DEMO_COOKIE_NAME, value: 'true', maxAge: DEMO_COOKIE_MAX_AGE, ...DEMO_COOKIE_OPTIONS });
    return response;
  } catch {
    return NextResponse.json({ error: 'Failed to initialize demo session' }, { status: 500 });
  }
}

/** Leaves the demo workspace. */
export async function DELETE() {
  const response = NextResponse.json({ success: true, redirect: '/auth/login' });
  response.cookies.set({ name: DEMO_COOKIE_NAME, value: '', maxAge: 0, ...DEMO_COOKIE_OPTIONS });
  return response;
}
