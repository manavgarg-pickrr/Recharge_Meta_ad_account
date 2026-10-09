import { NextResponse } from 'next/server';
import { META_GRAPH_VERSION, META_STATE_COOKIE, META_TOKEN_COOKIE, isProd } from '@/lib/metaAuthConfig';

export const dynamic = 'force-dynamic';

// Meta redirects the browser back here after the user approves (or denies)
// access on the real facebook.com consent screen. This is the only place
// the authorization code ever exists, and the App Secret is only ever used
// here, server-side — neither reaches the browser.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const deniedError = searchParams.get('error');
  const appUrl = new URL('/', request.url);

  if (deniedError) {
    appUrl.searchParams.set('meta_error', 'denied');
    return NextResponse.redirect(appUrl);
  }

  const storedState = request.cookies.get(META_STATE_COOKIE)?.value;
  if (!code || !state || !storedState || state !== storedState) {
    appUrl.searchParams.set('meta_error', 'invalid_state');
    return NextResponse.redirect(appUrl);
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.META_REDIRECT_URI;

  try {
    // Step 1: exchange the one-time authorization code for a short-lived
    // user access token.
    const tokenUrl = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`);
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('client_secret', appSecret);
    tokenUrl.searchParams.set('code', code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData?.error?.message || 'Token exchange failed');
    }

    // Step 2: exchange the short-lived token for a long-lived one (~60 days)
    // so the connection doesn't expire after an hour.
    const longLivedUrl = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`);
    longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longLivedUrl.searchParams.set('client_id', appId);
    longLivedUrl.searchParams.set('client_secret', appSecret);
    longLivedUrl.searchParams.set('fb_exchange_token', tokenData.access_token);

    const longLivedRes = await fetch(longLivedUrl.toString());
    const longLivedData = await longLivedRes.json();
    const finalToken = longLivedData.access_token || tokenData.access_token;
    const expiresIn = longLivedData.expires_in || tokenData.expires_in || 3600;

    const response = NextResponse.redirect(appUrl);
    response.cookies.set(META_TOKEN_COOKIE, finalToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: expiresIn,
      path: '/'
    });
    response.cookies.delete(META_STATE_COOKIE);
    return response;
  } catch (err) {
    appUrl.searchParams.set('meta_error', 'token_exchange_failed');
    return NextResponse.redirect(appUrl);
  }
}
