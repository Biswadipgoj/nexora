import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createServerClient();
  await supabase.auth.signOut();

  const response = NextResponse.json({
    success: true,
    redirect: '/auth/login',
  });

  // Clear demo session cookie
  response.cookies.set({
    name: 'nexora_demo_session',
    value: '',
    path: '/',
    maxAge: 0,
  });

  return response;
}

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createServerClient();
  await supabase.auth.signOut();

  const response = NextResponse.redirect(`${origin}/auth/login`);

  response.cookies.set({
    name: 'nexora_demo_session',
    value: '',
    path: '/',
    maxAge: 0,
  });

  return response;
}
