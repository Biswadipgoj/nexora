/**
 * Supabase client for browser (client components).
 * §13.4: Only the anon/publishable key is shipped to clients.
 * §12.2: Client-supplied workspace_id, user_id, or role claims are never trusted.
 * Singleton-cached in the browser to prevent multiple instances and race conditions.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/db/types';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  if (typeof window === 'undefined') {
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}
