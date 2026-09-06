/**
 * Next.js middleware.
 * §13.2: Validates session on every request.
 * §12.1: First layer in the authorization chain.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (error) {
    console.error('[CRITICAL] Unhandled Next.js Middleware Exception caught safely:', error);
    // Never allow an uncaught exception to crash Vercel Edge with MIDDLEWARE_INVOCATION_FAILED (500)
    const response = NextResponse.next({ request });
    response.headers.set('X-Middleware-Fallback', 'recovered');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
