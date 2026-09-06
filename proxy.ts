/**
 * Next.js proxy (formerly the `middleware` file convention, renamed in Next 16).
 *
 * Validates the session on every request and forms the first layer of the
 * authorization chain. Server-side checks in route handlers remain the
 * authority — section 10, "Permission leakage".
 */

import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (error) {
    console.error('[CRITICAL] Unhandled Next.js proxy exception caught safely:', error);
    // Never let an uncaught exception surface as a 500 from the edge runtime.
    const response = NextResponse.next({ request });
    response.headers.set('X-Proxy-Fallback', 'recovered');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match every request path except:
     * - _next/static and _next/image (framework assets)
     * - the generated icon set and web manifest, which must stay reachable to
     *   signed-out visitors and to the browser's install prompt
     * - static image files in public/
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|robots.txt|sitemap.xml|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)',
  ],
};
