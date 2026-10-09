import { NextResponse } from 'next/server';
import { META_GRAPH_VERSION, META_TOKEN_COOKIE } from '@/lib/metaAuthConfig';

export const dynamic = 'force-dynamic';

// Real Graph API call: returns every ad account the connected Meta user can
// access. Only the fields that are universally available regardless of
// billing model are requested here — per-account daily/weekly/monthly spend
// trends require separate /act_<id>/insights calls, which aren't wired up
// yet (see note in app/page.js).
export async function GET(request) {
  const token = request.cookies.get(META_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ connected: false, accounts: [] });
  }

  const url = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/me/adaccounts`);
  url.searchParams.set('fields', 'id,account_id,name,account_status,currency,amount_spent,balance,spend_cap');
  url.searchParams.set('access_token', token);
  url.searchParams.set('limit', '100');

  let res;
  let data;
  try {
    res = await fetch(url.toString(), { cache: 'no-store' });
    data = await res.json();
  } catch (err) {
    return NextResponse.json({ connected: true, accounts: [], error: 'Could not reach Meta right now. Please try again.' });
  }

  if (!res.ok) {
    // Most commonly an expired/revoked token — drop it so the UI falls back
    // to the "Connect" screen instead of silently showing nothing.
    const response = NextResponse.json({
      connected: false,
      accounts: [],
      error: data?.error?.message || 'Your Meta connection expired or was revoked. Please reconnect.'
    });
    response.cookies.delete(META_TOKEN_COOKIE);
    return response;
  }

  return NextResponse.json({ connected: true, accounts: data.data || [] });
}
