import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Landing page — redirects to dashboard if authenticated, or to login.
 */
export default async function Home() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/auth/login');
  }
}
