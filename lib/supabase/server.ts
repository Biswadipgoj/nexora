/**
 * Supabase client for server components, API routes, and middleware.
 * §12.2: The service-role key never reaches a client.
 * §13.4: Secrets only in server-side code.
 */

import { createServerClient as createSSRServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/db/types';
import { DEMO_USER } from '@/lib/demo/demo-store';
import { DEMO_COOKIE_NAME, isDemoCookieValue, isSupabaseConfigured } from './config';

const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'placeholder-anon-key';

/**
 * Server client bound to the request's cookies.
 *
 * `auth.getUser()` resolves in three ways:
 * - demo cookie present: the sample workspace's user, with no network call;
 * - Supabase not configured: no user, with no network call (the old code
 *   answered with the demo user here, so every signed-out visitor on an
 *   unconfigured deployment looked signed in);
 * - otherwise: the verified Supabase session.
 */
export async function createServerClient() {
  const cookieStore = await cookies();
  const isDemo = isDemoCookieValue(cookieStore.get(DEMO_COOKIE_NAME)?.value);
  const configured = isSupabaseConfigured();

  const client = createSSRServerClient<Database>(
    configured ? process.env.NEXT_PUBLIC_SUPABASE_URL! : PLACEHOLDER_URL,
    configured ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! : PLACEHOLDER_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component; the proxy refreshes the session.
          }
        },
      },
    }
  );

  if (isDemo || !configured) {
    const user = isDemo ? (DEMO_USER as unknown as User) : null;
    client.auth.getUser = (async () => ({ data: { user }, error: null })) as typeof client.auth.getUser;
  }

  return client;
}

/**
 * The verified Supabase user for this request, ignoring the demo cookie.
 * Use it where a demo session must not count as signed in, such as deciding
 * whether a share link should hand out a demo session.
 */
export async function getRealUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = await cookies();
  const client = createSSRServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Read-only lookup.
        },
      },
    }
  );

  try {
    const { data } = await client.auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}

/** True when the service-role key is configured for trusted server-side writes. */
export function isAdminConfigured(): boolean {
  return isSupabaseConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Admin client with service role key — NEVER use in client code.
 * §12.2: Only for server-side operations that must bypass RLS after the
 * caller has been authorized by other means (e.g. a verified invitation).
 */
export function createAdminClient() {
  const supabaseUrl = isSupabaseConfigured() ? process.env.NEXT_PUBLIC_SUPABASE_URL! : PLACEHOLDER_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
