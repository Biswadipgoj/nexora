import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sanitizeRedirectUrl } from '@/lib/security/sanitize';
import { logger } from '@/lib/logger';

/**
 * OAuth callback handler.
 * §3.7: Handles the redirect after OAuth authentication.
 * §13.3: PKCE + state validation handled by Supabase.
 * §13.10: Redirect URL validated against allowlist to prevent open redirects.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next') ?? '/dashboard';

  // Sanitize the redirect URL to prevent open redirect attacks
  const next = sanitizeRedirectUrl(rawNext, ['/dashboard', '/onboarding', '/projects']);

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      logger.info('OAuth login successful', {
        action: 'oauth_callback',
        outcome: 'success',
      });

      // Redirect to validated destination
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

    logger.warn('OAuth code exchange failed', {
      action: 'oauth_callback',
      outcome: 'failure',
      error_message: error.message,
    });
  }

  // Auth error — redirect to login with error message
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`);
}
