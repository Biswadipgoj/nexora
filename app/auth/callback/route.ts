import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sanitizeRedirectUrl } from '@/lib/security/sanitize';
import { logger } from '@/lib/logger';
import type { EmailOtpType } from '@supabase/supabase-js';

/**
 * Authentication callback handler.
 * §3.7: Handles the redirect after OAuth and email verification.
 * §13.3: PKCE + OTP state validation handled by Supabase.
 * §13.10: Redirect URL validated against allowlist to prevent open redirects.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const rawNext = searchParams.get('next') ?? '/dashboard';
  const errorParam = searchParams.get('error_description') || searchParams.get('error');

  if (errorParam) {
    logger.warn('Auth callback returned error param', { error: errorParam });
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(errorParam)}`);
  }

  // Sanitize the redirect URL to prevent open redirect attacks
  const next = sanitizeRedirectUrl(rawNext, ['/dashboard', '/onboarding', '/projects']);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';
  const redirectTarget = isLocalEnv
    ? `${origin}${next}`
    : forwardedHost
    ? `https://${forwardedHost}${next}`
    : `${origin}${next}`;

  const supabase = await createServerClient();

  // 1. Handle PKCE authorization code exchange (OAuth, PKCE signup)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      logger.info('OAuth/PKCE auth successful', {
        action: 'auth_callback',
        outcome: 'success',
      });
      return NextResponse.redirect(redirectTarget);
    }

    logger.warn('OAuth code exchange failed', {
      action: 'auth_callback',
      outcome: 'failure',
      error_message: error.message,
    });
  }

  // 2. Handle Supabase email confirmation & recovery OTP (token_hash flow)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });

    if (!error) {
      logger.info('Email OTP verification successful', {
        action: 'verify_otp',
        type,
        outcome: 'success',
      });
      return NextResponse.redirect(redirectTarget);
    }

    logger.warn('Email OTP verification failed', {
      action: 'verify_otp',
      type,
      outcome: 'failure',
      error_message: error.message,
    });
  }

  // Fallback: Auth error — redirect to login with notification
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`);
}
