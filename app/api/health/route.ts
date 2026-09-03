import { NextResponse } from 'next/server';

const startTime = Date.now();

/**
 * Health check endpoint.
 * §21: Liveness check (process up) + readiness indicators.
 * Version hidden in production to prevent information disclosure.
 */
export async function GET() {
  const uptimeMs = Date.now() - startTime;
  const memoryUsage = process.memoryUsage();

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(uptimeMs / 1000),
    // Only expose version in development — §13.11: no info disclosure in prod
    ...(process.env.NODE_ENV === 'development' && {
      version: process.env.npm_package_version ?? '0.0.1',
    }),
    memory: {
      rss_mb: Math.round(memoryUsage.rss / 1024 / 1024),
      heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    },
  });
}
