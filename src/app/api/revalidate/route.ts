import type { NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';

/**
 * Webhook for the Tahrio admin/API: POST /api/revalidate with header
 * `x-revalidate-secret: $REVALIDATE_SECRET` after editing products/prices so pages refresh now
 * instead of at the next hourly revalidation.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get('x-revalidate-secret') !== secret) {
    return Response.json({ revalidated: false, message: 'Invalid secret' }, { status: 401 });
  }
  // expire: 0 → the next request waits for fresh data (updateTag is Server-Action only).
  revalidateTag('catalog', { expire: 0 });
  return Response.json({ revalidated: true });
}
