import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { META_GRAPH_VERSION, META_OAUTH_SCOPES, META_STATE_COOKIE, isProd } from '@/lib/metaAuthConfig';

// Without this, Next.js has no dynamic-API signal (no cookies()/headers()
// call) to tell it this route must run per-request, so it can treat the
// handler as static and let Vercel's edge cache serve/replay a cached
// response — which strips the Set-Cookie header entirely. That silently
// drops the state cookie, so the callback's CSRF check always fails with
// "could not be verified" even though the code looks correct.
export const dynamic = 'force-dynamic';

// Kicks off real Meta OAuth: redirects the browser to Meta's actual consent
// screen on facebook.com. There is no way to do this "on our own screen" —
// Meta must serve that page itself for the authorization to be genuine.
export async function GET() {
  const appId = process.env.META_APP_ID;
  const redirectUri = process.env.META_REDIRECT_URI;

  if (!appId || !redirectUri) {
    return NextResponse.json(
      {
        error:
          'Meta OAuth is not configured. Set META_APP_ID and META_REDIRECT_URI in your environment (Vercel Project Settings > Environment Variables), then redeploy.'
      },
      { status: 500 }
    );
  }

  // CSRF protection: a random value we can verify matches on the way back
  // in the callback, so a forged redirect can't impersonate this flow.
  const state = randomBytes(16).toString('hex');

  const authUrl = new URL(`https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth`);
  authUrl.searchParams.set('client_id', appId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('scope', META_OAUTH_SCOPES);
  authUrl.searchParams.set('response_type', 'code');

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set(META_STATE_COOKIE, state, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 600, // 10 minutes — just long enough for the Meta round trip
    path: '/'
  });
  return response;
}
