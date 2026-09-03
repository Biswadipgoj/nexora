import { NextResponse } from 'next/server';

/**
 * Health check endpoint.
 * §21: Liveness check (process up).
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.0.1',
  });
}
