'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';

// Meta's numeric account_status codes we're likely to actually see.
// https://developers.facebook.com/docs/marketing-api/reference/ad-account/#fields
const STATUS_LABEL = {
  1: 'Active',
  2: 'Disabled',
  3: 'Unsettled',
  7: 'Pending Risk Review',
  8: 'Pending Settlement',
  9: 'In Grace Period',
  100: 'Pending Closure',
  101: 'Closed'
};

const META_ERROR_MESSAGES = {
  denied: 'You declined the Meta authorization request.',
  invalid_state: 'The authorization request could not be verified. Please try connecting again.',
  token_exchange_failed: 'Meta could not be reached to complete the connection. Please try again.'
};

// Meta returns amount_spent / spend_cap in the smallest currency unit (paise
// for INR, cents for USD), matching how Meta's own UI displays it.
function fmtMoney(minorUnits, currency) {
  if (minorUnits === undefined || minorUnits === null) return '—';
  const amount = Number(minorUnits) / 100;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `${currency || ''} ${amount.toLocaleString('en-IN')}`;
  }
}

export default function MetaAdAccountRechargePage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch('/api/meta/accounts', { cache: 'no-store' });
      const data = await res.json();
      setConnected(!!data.connected);
      setAccounts(data.accounts || []);
      if (data.error) setError(data.error);
    } catch {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setMounted(true);

    const params = new URLSearchParams(window.location.search);
    const metaError = params.get('meta_error');
    const metaErrorDetail = params.get('meta_error_detail');
    if (metaError) {
      const baseMessage = META_ERROR_MESSAGES[metaError] || 'Something went wrong connecting to Meta.';
      setError(metaErrorDetail ? `${baseMessage} (detail: ${metaErrorDetail})` : baseMessage);
      window.history.replaceState({}, '', window.location.pathname);
    }

    refresh();
  }, []);

  if (!mounted) return null;

  async function handleDisconnect() {
    await fetch('/api/auth/meta/logout', { method: 'POST' });
    setError(null);
    refresh();
  }

  return (
    <div className="app-shell">
      <Sidebar activeId="recharge-meta-ad-account" />
      <div className="main-area">
        <header className="topbar" />
        <main className="page-content">
          <div className="page-head">
            <h1 className="page-title">Meta Ad Account Recharge</h1>
            <p className="page-sub">Monitor your Meta Ads balance and recharge it yourself — no need to contact support.</p>
          </div>

          {error && (
            <div
              className="card"
              style={{
                padding: '14px 18px',
                marginBottom: 18,
                borderColor: 'var(--red)',
                background: 'var(--red-bg)',
                color: 'var(--red)',
                fontSize: 13.5
              }}
            >
              {error}
            </div>
          )}

          {!loading && !connected && (
            <div className="card mar-empty-state">
              <div className="mar-empty-icon">🔗</div>
              <div className="mar-empty-title">Connect your Meta Ads account</div>
              <div className="mar-empty-desc">
                Connect your real Meta account to see every ad account you&apos;re authorized to access. We only request
                read access — nothing on your Meta account is changed.
              </div>
              <a className="btn btn-primary" href="/api/auth/meta/login">Connect Meta Account</a>
            </div>
          )}

          {!loading && connected && accounts.length === 0 && (
            <div className="card mar-empty-state">
              <div className="mar-empty-icon">🔍</div>
              <div className="mar-empty-title">No ad accounts found</div>
              <div className="mar-empty-desc">
                We couldn&apos;t find any Meta Ad Accounts accessible with your account. Make sure you&apos;re an admin on the
                Business Manager that owns the ad account, then reconnect.
              </div>
              <button className="btn btn-secondary" onClick={handleDisconnect}>Disconnect &amp; Reconnect</button>
            </div>
          )}

          {!loading && connected && accounts.length > 0 && (
            <>
              <div className="card" style={{ padding: '20px 24px' }}>
                <div className="mar-history-head">
                  <strong style={{ fontSize: 14 }}>Connected Meta Ad Accounts ({accounts.length})</strong>
                  <button className="btn btn-text" onClick={handleDisconnect}>Disconnect</button>
                </div>
                <table className="mar-table">
                  <thead>
                    <tr><th>Account</th><th>Status</th><th>Currency</th><th>Lifetime Spend</th></tr>
                  </thead>
                  <tbody>
                    {accounts.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{a.name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                            {a.account_id ? `act_${a.account_id}` : a.id}
                          </div>
                        </td>
                        <td>{STATUS_LABEL[a.account_status] || a.account_status}</td>
                        <td>{a.currency}</td>
                        <td>{fmtMoney(a.amount_spent, a.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 12.5, marginTop: 12 }}>
                Daily spend trends, balance health, and recharging are not yet wired up for real accounts — that&apos;s the
                next step once we confirm how your ad accounts bill (prepaid balance vs. postpaid spend cap).
              </p>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
