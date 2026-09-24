import { LoginForm } from '@/components/auth/LoginForm';
import { sanitizeRedirectUrl } from '@/lib/security/sanitize';

export const metadata = { title: 'Sign in' };

const NEXT_ALLOWLIST = ['/dashboard', '/onboarding', '/projects', '/invite'];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  // Only same-site destinations inside the app are honoured (§13.10).
  const next = params.next ? sanitizeRedirectUrl(params.next, NEXT_ALLOWLIST) : '/dashboard';

  return <LoginForm next={next} initialError={params.error} />;
}
