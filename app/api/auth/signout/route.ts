import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { DEMO_COOKIE_NAME, DEMO_COOKIE_OPTIONS } from '@/lib/supabase/config';

/** Ends the Supabase session (if any) and always clears the demo session. */
async function endSession() {
  try {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
  } catch {
    // Signing out of a session that no longer exists is not an error.
  }
}

function clearDemoCookie(response: NextResponse) {
  response.cookies.set({ name: DEMO_COOKIE_NAME, value: '', maxAge: 0, ...DEMO_COOKIE_OPTIONS });
  return response;
}

export async function POST() {
  await endSession();
  return clearDemoCookie(NextResponse.json({ success: true, redirect: '/auth/login' }));
}

export async function GET(request: Request) {
  await endSession();
  const { origin } = new URL(request.url);
  return clearDemoCookie(NextResponse.redirect(`${origin}/auth/login`, { status: 303 }));
}
