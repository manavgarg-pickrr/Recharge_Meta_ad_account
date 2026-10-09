import { NextResponse } from 'next/server';
import { META_TOKEN_COOKIE } from '@/lib/metaAuthConfig';

export const dynamic = 'force-dynamic';

// Clears the stored access token. This only forgets the token on our side —
// it does not revoke the grant on Meta's side (that's managed by the user
// from their own Facebook "Apps and Websites" settings).
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(META_TOKEN_COOKIE);
  return response;
}
