/**
 * Supabase client for browser (client components).
 * §13.4: Only the anon/publishable key is shipped to clients.
 * §12.2: Client-supplied workspace_id, user_id, or role claims are never trusted.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/db/types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
