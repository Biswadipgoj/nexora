/**
 * Environment and session-mode helpers shared by the proxy, route handlers
 * and server components.
 *
 * Two modes exist:
 * - **Live**: Supabase credentials are configured and a real session decides
 *   who the user is.
 * - **Demo**: the visitor opted into the sample workspace (demo cookie), or the
 *   deployment has no Supabase credentials at all. Demo data lives in the
 *   in-memory store in lib/demo and never touches the database.
 */

export const DEMO_COOKIE_NAME = 'nexora_demo_session';

/** Shared attributes so the demo cookie is always cleared with the scope it was set with. */
export const DEMO_COOKIE_OPTIONS = {
  path: '/',
  httpOnly: false,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

export const DEMO_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && url.startsWith('http') && !url.includes('placeholder'));
}

export function isDemoCookieValue(value: string | undefined | null): boolean {
  return value === 'true';
}

/** Minimal cookie reader shape shared by NextRequest.cookies and next/headers cookies(). */
interface CookieReader {
  get(name: string): { value: string } | undefined;
}

/** True when a request should be served from the demo store. */
export function isDemoRequest(cookies: CookieReader): boolean {
  return isDemoCookieValue(cookies.get(DEMO_COOKIE_NAME)?.value) || !isSupabaseConfigured();
}
