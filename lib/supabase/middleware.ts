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

const AUTH_ROUTES = ['/auth/login', '/auth/signup', '/auth/forgot-password'];

/** Shared attributes so the demo cookie is cleared with the same scope it was set with. */
const DEMO_COOKIE = {
  name: 'nexora_demo_session',
  path: '/',
  httpOnly: false,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
} as const;
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/callback',
  '/api/health',
  '/api/auth/demo',
  '/s',
  '/logo.svg',
];

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const isDemo = request.cookies.get('nexora_demo_session')?.value === 'true';
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Handle explicit demo exit
  if (isDemo && pathname.startsWith('/auth/login') && request.nextUrl.searchParams.get('logout') === 'true') {
    const response = NextResponse.next({ request });
    response.cookies.set({ ...DEMO_COOKIE, value: '', maxAge: 0 });
    return response;
  }

  // A demo session must never block the sign-in routes.
  //
  // This previously redirected every /auth/* request to /dashboard, so a single
  // click on "Explore the demo workspace" set a seven-day cookie that made
  // signing in unreachable from the UI — the only escape was an undocumented
  // ?logout=true parameter. Section 3.5 counts unexpected navigation as an
  // unresolved defect, and section 10 requires every route to offer a useful
  // recovery path. Demo visitors now fall through to the normal auth handling
  // below, which renders the page and lets a real session supersede the demo.
  // A real Supabase session always outranks the demo cookie. Without this a
  // user who signed in while the demo cookie was still set would keep landing
  // in the sample workspace instead of their own.
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
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route)) && request.method === 'POST') {
    try {
      const limitKey = `auth:${ip}:${pathname}`;
      const config = pathname.includes('login') ? RATE_LIMITS.login
        : pathname.includes('signup') ? RATE_LIMITS.signup
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

        return new NextResponse(
          JSON.stringify({ error: 'Too many requests. Please try again later.' }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
              ...rateLimitHeaders(result),
            },
          }
        );
      }

      // Attach rate limit headers to successful responses
      const headers = rateLimitHeaders(result);
      for (const [key, value] of Object.entries(headers)) {
        supabaseResponse.headers.set(key, value);
      }
    } catch (rateLimitErr) {
      console.warn('[Rate Limit Warning]:', rateLimitErr);
    }
  }

  // === Security headers on every response ===
  supabaseResponse.headers.set('X-Request-ID', requestId);

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    route === '/' ? pathname === '/' : pathname === route || pathname.startsWith(`${route}/`)
  );

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // === Graceful Fallback if Supabase credentials are missing on Vercel ===
  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
    if (isPublicRoute) {
      return supabaseResponse;
    }
    // Redirect unauthenticated user trying to access protected route to login
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // === Supabase Auth Verification with Error Shield ===
  let user = null;
  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value)
              );
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

    // IMPORTANT: Do NOT use getSession() here — it reads from cookies
    // and is not secure. getUser() validates the JWT against the server.
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) {
      user = data.user;
    }
  } catch (authError) {
    console.error('[Middleware Supabase Client Exception]:', authError);
    user = null;
  }

  // === Redirect authenticated users away from auth pages ===
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    const redirect = NextResponse.redirect(url);
    // A real session supersedes a leftover demo session, so the user lands in
    // their own workspace rather than the sample data.
    if (isDemo) redirect.cookies.set({ ...DEMO_COOKIE, value: '', maxAge: 0 });
    return redirect;
  }

  // A verified session retires the demo cookie, so the two can never disagree
  // about which workspace the user is looking at (section 3.4).
  if (user && isDemo) {
    supabaseResponse.cookies.set({ ...DEMO_COOKIE, value: '', maxAge: 0 });
  }

  // A demo visitor who reaches a protected route still needs the sample
  // workspace: they have no real session, but they are not signed out either.
  if (!user && isDemo && !isPublicRoute) {
    supabaseResponse.headers.set('X-Nexora-Mode', 'demo');
    return supabaseResponse;
  }

  // === Protected routes — redirect to login if not authenticated ===
  if (!user && !isPublicRoute) {
    logger.info('Unauthenticated access attempt', {
      request_id: requestId,
      action: 'auth_redirect',
      outcome: 'denied',
      path: pathname,
    });

    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
