import { NextRequest, NextResponse } from 'next/server';
import { getShortLink } from '@/lib/share/shortener';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const link = getShortLink(code);

  const origin = request.nextUrl.origin;

  if (!link) {
    // If not found, redirect to projects with notice
    return NextResponse.redirect(`${origin}/dashboard?error=invalid_link`);
  }

  // Create redirect response to the target project board
  const redirectUrl = `${origin}${link.targetUrl}?invite=active&code=${encodeURIComponent(code)}&role=${link.role}`;
  const response = NextResponse.redirect(redirectUrl, { status: 307 });

  // Automatically authenticate guest collaborator via demo session cookie
  response.cookies.set({
    name: 'nexora_demo_session',
    value: 'true',
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
