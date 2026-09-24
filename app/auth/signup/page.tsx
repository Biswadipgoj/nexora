import { SignupForm } from '@/components/auth/SignupForm';
import { sanitizeRedirectUrl } from '@/lib/security/sanitize';

export const metadata = { title: 'Create your account' };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const next = params.next
    ? sanitizeRedirectUrl(params.next, ['/dashboard', '/onboarding', '/projects', '/invite'])
    : '/dashboard';

  return <SignupForm next={next} />;
}
