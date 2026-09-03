import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * OAuth callback handler.
 * §3.7: Handles the redirect after OAuth authentication.
 * §13.3: PKCE + state validation handled by Supabase.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successfully authenticated — redirect to dashboard or intended page
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Auth error — redirect to login with error message
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`);
}
