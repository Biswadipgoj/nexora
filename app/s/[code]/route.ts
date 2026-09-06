import { NextRequest, NextResponse } from 'next/server';
import { getShortLink } from '@/lib/share/shortener';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Share-link redirect.
 *
 * The demo cookie used to be set unconditionally here, for every visitor. That
 * meant opening any share link silently switched a signed-in user into the
 * sample workspace, and it handed the app's own auth flag to anyone who could
 * follow a URL — the flag is not httpOnly, so it was already self-grantable,
 * but this made it automatic.
 *
 * A visitor who is already signed in now keeps their own session and goes
 * straight to the board; only an anonymous visitor is given the read-only demo
 * session that lets the link resolve at all.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const link = getShortLink(code);
  const origin = request.nextUrl.origin;

  if (!link) {
    return NextResponse.redirect(`${origin}/dashboard?error=invalid_link`);
  }

  const redirectUrl = `${origin}${link.targetUrl}?invite=active&code=${encodeURIComponent(code)}&role=${link.role}`;
  const response = NextResponse.redirect(redirectUrl, { status: 307 });

  // Does the visitor already have a real session?
  let signedIn = false;
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = Boolean(user);
  } catch {
    signedIn = false;
  }

  if (!signedIn) {
    response.cookies.set({
      name: 'nexora_demo_session',
      value: 'true',
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return response;
}
