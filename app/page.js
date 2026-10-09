'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import MetaOAuthOverlay from '../components/MetaOAuthOverlay';
import RechargeModal from '../components/RechargeModal';
import DevPanel from '../components/DevPanel';
import { MetaMockAPI } from '../lib/mockMetaApi';
import { PaymentMockAPI } from '../lib/mockPaymentApi';
import { getBalanceInsight } from '../lib/balanceInsight';
import { fmt, fmtDate } from '../lib/format';

const DOT_COLOR_BY_TIER = {
  critical: 'var(--red)',
  low: 'var(--amber)',
  moderate: 'var(--yellow)',
  healthy: 'var(--green)',
  excellent: 'var(--green)',
  neutral: 'var(--text-faint)',
  new: 'var(--text-faint)'
};

const HISTORY_STATUS = {
  created: ['Processing', 'badge-blue'],
  payment_success: ['Processing', 'badge-blue'],
  processing_recharge: ['Processing', 'badge-blue'],
  recharge_success: ['Successful', 'badge-green'],
  payment_failed: ['Failed', 'badge-red']
};

export default function MetaAdAccountRechargePage() {
  // Avoids a hydration mismatch: this whole page's data lives in localStorage,
  // which doesn't exist during SSR, so we render nothing meaningful until the
  // client has mounted and the real (possibly already-connected) state loads.
  const [mounted, setMounted] = useState(false);
  const [connected, setConnected] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [activeAccountId, setActiveAccountId] = useState(null);
  const [showMetaAuth, setShowMetaAuth] = useState(false);
  const [rechargeAccount, setRechargeAccount] = useState(null);

  function refresh() {
    const isConnected = MetaMockAPI.isConnected();
    setConnected(isConnected);
    const accts = isConnected ? MetaMockAPI.getAccounts() : [];
    setAccounts(accts);
    setActiveAccountId((prev) => (accts.find((a) => a.id === prev) ? prev : accts[0]?.id ?? null));
  }

  useEffect(() => {
    setMounted(true);
    refresh();
  }, []);

  if (!mounted) return null;

  async function handleMetaAuthContinue() {
    await MetaMockAPI.connect();
    refresh();
    setShowMetaAuth(false);
  }

  function handleDevDisconnect() {
    MetaMockAPI.disconnect();
    refresh();
  }

  async function handleDevReconnect() {
    MetaMockAPI._devReset();
    await MetaMockAPI.connect();
    refresh();
  }

  async function handleDevScenario(scenario) {
    if (!MetaMockAPI.isConnected()) {
      await MetaMockAPI.connect();
    }
    MetaMockAPI._devSetScenario('acc_1001', scenario);
    refresh();
  }

  function closeRechargeModal() {
    setRechargeAccount(null);
    refresh();
  }

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || null;

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

          {!connected && (
            <div className="card mar-empty-state">
              <div className="mar-empty-icon">🔗</div>
              <div className="mar-empty-title">Connect your Meta Ads account</div>
              <div className="mar-empty-desc">
                To monitor your balance and recharge your Meta Ad Account yourself, connect your Meta account.
                We&apos;ll only access the ad account(s) you authorize — you won&apos;t see anyone else&apos;s accounts, and no one
                else will see yours.
              </div>
              <button className="btn btn-primary" onClick={() => setShowMetaAuth(true)}>Connect Meta Account</button>
            </div>
          )}

          {connected && accounts.length === 0 && (
            <div className="card mar-empty-state">
              <div className="mar-empty-icon">🔍</div>
              <div className="mar-empty-title">No ad accounts found</div>
              <div className="mar-empty-desc">
                We couldn&apos;t find any Meta Ad Accounts accessible through your Meta login. Make sure you&apos;re an admin on
                the Business Manager that owns your ad account, then try reconnecting.
              </div>
              <button className="btn btn-secondary" onClick={handleDevReconnect}>Reconnect Meta Account</button>
            </div>
          )}

          {connected && activeAccount && (
            <>
              {accounts.length > 1 && (
                <AccountSwitcher accounts={accounts} activeId={activeAccountId} onSelect={setActiveAccountId} />
              )}
              <AccountDetailCard account={activeAccount} onRecharge={() => setRechargeAccount(activeAccount)} />
            </>
          )}
        </main>
      </div>

      {showMetaAuth && (
        <MetaOAuthOverlay onContinue={handleMetaAuthContinue} onCancel={() => setShowMetaAuth(false)} />
      )}

      {rechargeAccount && (
        <RechargeModal account={rechargeAccount} onClose={closeRechargeModal} />
      )}

      <DevPanel
        onDisconnect={handleDevDisconnect}
        onReconnect={handleDevReconnect}
        onScenario={handleDevScenario}
      />
    </div>
  );
}

function AccountSwitcher({ accounts, activeId, onSelect }) {
  return (
    <div className="mar-switcher">
      {accounts.map((a) => {
        const insight = getBalanceInsight(a.balance, a.yesterdaySpend, a.hasSpendHistory);
        const dotColor = DOT_COLOR_BY_TIER[insight.tier] || 'var(--text-faint)';
        return (
          <div
            key={a.id}
            className={`mar-pill${a.id === activeId ? ' active' : ''}`}
            onClick={() => onSelect(a.id)}
          >
            <span className="mar-pill-dot" style={{ background: dotColor }} />
            <span>
              <div className="mar-pill-name">{a.name}</div>
              <div className="mar-pill-balance">{fmt(a.balance)} balance</div>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function AccountDetailCard({ account, onRecharge }) {
  const insight = getBalanceInsight(account.balance, account.yesterdaySpend, account.hasSpendHistory);
  const history = PaymentMockAPI.listForAccount(account.id);

  return (
    <>
      <div className="card mar-detail-card">
        <div className="mar-detail-head">
          <div>
            <p className="mar-acc-name">{account.name}</p>
            <p className="mar-acc-id">{account.metaAccountId} · {account.currency} INR</p>
          </div>
          <span className="badge badge-green"><span className="badge-dot" />Active</span>
        </div>

        <div className="mar-hero">
          <div>
            <div className="mar-balance-label">Current Balance</div>
            <div className="mar-balance-value">{fmt(account.balance)}</div>
          </div>
          <div className="mar-insight">
            <span className={`badge ${insight.badgeClass}`}><span className="badge-dot" />{insight.badge}</span>
            <div className="mar-insight-msg">{insight.message}</div>
          </div>
          <div>
            <button className="btn btn-primary" onClick={onRecharge}>Recharge</button>
          </div>
        </div>

        <div className="mar-stats-row">
          <div className="mar-stat">
            <div className="mar-stat-label">Yesterday&apos;s Spend</div>
            <div className="mar-stat-value">{account.hasSpendHistory ? fmt(account.yesterdaySpend) : '—'}</div>
          </div>
          <div className="mar-stat">
            <div className="mar-stat-label">Last 7 Days Spend</div>
            <div className="mar-stat-value">{account.hasSpendHistory ? fmt(account.last7DaySpend) : '—'}</div>
          </div>
          <div className="mar-stat">
            <div className="mar-stat-label">Last 30 Days Spend</div>
            <div className="mar-stat-value">{account.hasSpendHistory ? fmt(account.last30DaySpend) : '—'}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '20px 24px' }}>
        <div className="mar-history-head">
          <strong style={{ fontSize: 14 }}>Recharge History</strong>
        </div>
        <table className="mar-table">
          <thead>
            <tr><th>Date</th><th>Amount</th><th>Status</th><th>Reference</th></tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr className="mar-empty-row"><td colSpan={4}>No recharges yet.</td></tr>
            ) : (
              history.map((t) => {
                const [label, cls] = HISTORY_STATUS[t.status] || ['Processing', 'badge-blue'];
                return (
                  <tr key={t.id}>
                    <td>{fmtDate(t.createdAt)}</td>
                    <td>{fmt(t.amount)}</td>
                    <td><span className={`badge ${cls}`}><span className="badge-dot" />{label}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t.id}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
