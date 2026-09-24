/**
 * Supabase middleware for session refresh + security enforcement.
 * §13.2: Sessions use short-lived access tokens + rotating refresh tokens.
 * §13.8: Rate limiting on auth routes.
 * §12.1: First layer in the authorization chain.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit, RATE_LIMITS, rateLimitHeaders } from '@/lib/security/rate-limit';
import { logger } from '@/lib/logger';
import { DEMO_COOKIE_NAME, isDemoCookieValue, isSupabaseConfigured } from './config';

const AUTH_ROUTES = ['/auth/login', '/auth/signup', '/auth/forgot-password'];

/** Shared attributes so the demo cookie is cleared with the same scope it was set with. */
const DEMO_COOKIE = {
  name: DEMO_COOKIE_NAME,
  path: '/',
  httpOnly: false,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
} as const;

/**
 * Routes a signed-out visitor may open.
 *
 * `/invite` and the invitation endpoints are public because the person opening
 * an invite link usually has no account yet — they were previously redirected
 * to sign-in and never saw the invitation. Each invitation handler performs its
 * own authorization for anything beyond resolving a token.
 */
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/callback',
  '/api/health',
  '/api/auth/demo',
  '/api/invitations',
  '/invite',
  '/s',
  '/logo.svg',
];

function denyUnauthenticated(request: NextRequest, requestId: string) {
  const pathname = request.nextUrl.pathname;

  logger.info('Unauthenticated access attempt', {
    request_id: requestId,
    action: 'auth_redirect',
    outcome: 'denied',
    path: pathname,
  });

  // API callers get a JSON 401 rather than the HTML of the sign-in page.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'X-Request-ID': requestId } });
  }

  const url = request.nextUrl.clone();
  url.pathname = '/auth/login';
  url.search = '';
  if (pathname !== '/dashboard') {
    url.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
  }
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const requestId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const isDemo = isDemoCookieValue(request.cookies.get(DEMO_COOKIE_NAME)?.value);
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    route === '/' ? pathname === '/' : pathname === route || pathname.startsWith(`${route}/`)
  );

  // Explicit demo exit.
  if (isDemo && pathname.startsWith('/auth/login') && request.nextUrl.searchParams.get('logout') === 'true') {
    const response = NextResponse.next({ request });
    response.cookies.set({ ...DEMO_COOKIE, value: '', maxAge: 0 });
    return response;
  }

  // A demo session must never block the sign-in routes, and a real Supabase
  // session always outranks the demo cookie — otherwise a user who signed in
  // while the cookie was still set would keep landing in the sample workspace.
  const hasSupabaseSession = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith('sb-') && cookie.name.includes('auth-token'));

  if (isDemo && !isAuthRoute && !hasSupabaseSession) {
    const response = NextResponse.next({ request });
    response.headers.set('X-Request-ID', requestId);
    response.headers.set('X-Nexora-Mode', 'demo');
    return response;
  }

  let supabaseResponse = NextResponse.next({ request });

  // === Rate limiting on auth routes ===
  if (isAuthRoute && request.method === 'POST') {
    try {
      const limitKey = `auth:${ip}:${pathname}`;
      const config = pathname.includes('login')
        ? RATE_LIMITS.login
        : pathname.includes('signup')
          ? RATE_LIMITS.signup
          : RATE_LIMITS.passwordReset;

      const result = checkRateLimit(limitKey, config);

      if (!result.success) {
        logger.warn('Rate limit exceeded', {
          request_id: requestId,
          action: 'rate_limit_exceeded',
          outcome: 'throttled',
          ip,
          path: pathname,
        });

        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
              ...rateLimitHeaders(result),
            },
          }
        );
      }

      for (const [key, value] of Object.entries(rateLimitHeaders(result))) {
        supabaseResponse.headers.set(key, value);
      }
    } catch (rateLimitErr) {
      console.warn('[Rate Limit Warning]:', rateLimitErr);
    }
  }

  supabaseResponse.headers.set('X-Request-ID', requestId);

  // === No Supabase credentials: public pages and the demo only ===
  if (!isSupabaseConfigured()) {
    if (isPublicRoute) return supabaseResponse;
    return denyUnauthenticated(request, requestId);
  }

  // === Supabase auth verification ===
  let user = null;
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
              supabaseResponse = NextResponse.next({ request });
              supabaseResponse.headers.set('X-Request-ID', requestId);
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
              );
            } catch (cookieErr) {
              console.warn('[Middleware Cookie Error]:', cookieErr);
            }
          },
        },
      }
    );

    // getUser() validates the JWT against the server; getSession() only
    // reads cookies and is not safe for authorization.
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) user = data.user;
  } catch (authError) {
    console.error('[Middleware Supabase Client Exception]:', authError);
    user = null;
  }

  // === Signed-in users skip the sign-in pages ===
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    const next = request.nextUrl.searchParams.get('next');
    url.pathname = next && next.startsWith('/') && !next.startsWith('//') ? next.split('?')[0] : '/dashboard';
    url.search = '';
    const redirect = NextResponse.redirect(url);
    if (isDemo) redirect.cookies.set({ ...DEMO_COOKIE, value: '', maxAge: 0 });
    return redirect;
  }

  // A verified session retires the demo cookie, so the two can never disagree
  // about which workspace the user is looking at.
  if (user && isDemo) {
    supabaseResponse.cookies.set({ ...DEMO_COOKIE, value: '', maxAge: 0 });
  }

  // A demo visitor on a protected route still needs the sample workspace.
  if (!user && isDemo && !isPublicRoute) {
    supabaseResponse.headers.set('X-Nexora-Mode', 'demo');
    return supabaseResponse;
  }

  if (!user && !isPublicRoute) {
    return denyUnauthenticated(request, requestId);
  }

  return supabaseResponse;
}
