import { NextRequest, NextResponse } from 'next/server';
import { DEMO_USER, resetDemoStore } from '@/lib/demo/demo-store';

export async function POST(request: NextRequest) {
  try {
    resetDemoStore();

    const response = NextResponse.json({
      success: true,
      user: DEMO_USER,
      redirect: '/dashboard',
    });

    // Set demo session cookie (expires in 7 days)
    response.cookies.set({
      name: 'nexora_demo_session',
      value: 'true',
      path: '/',
      httpOnly: false, // Accessible to client scripts if needed
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Failed to initialize demo session' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    redirect: '/auth/login',
  });

  // Clear demo session cookie
  response.cookies.set({
    name: 'nexora_demo_session',
    value: '',
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 0,
  });

  return response;
}
