/**
 * Supabase client for server components, API routes, and middleware.
 * §12.2: The service-role key never reaches a client.
 * §13.4: Secrets only in server-side code.
 */

import { createServerClient as createSSRServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/db/types';
import { DEMO_USER } from '@/lib/demo/demo-store';

export async function createServerClient() {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get('nexora_demo_session')?.value === 'true';

  const client = createSSRServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );

  if (isDemo) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client.auth.getUser = (async () => ({ data: { user: DEMO_USER as any }, error: null })) as any;
  }

  return client;
}

import { createClient } from '@supabase/supabase-js';

/**
 * Admin client with service role key — NEVER use in client code.
 * §12.2: Only for server-side Edge Functions and CI.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
