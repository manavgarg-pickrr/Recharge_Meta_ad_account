/*
 * MOCK Meta Marketing API layer.
 *
 * This file stands in for real integration work that still needs to happen:
 *   - Meta OAuth (Facebook Login for Business) to obtain a merchant access token
 *   - Calling Meta's API to enumerate ad accounts accessible to that token
 *   - Fetching balance / spend insights per ad account
 *   - Handling token expiry / revocation
 *
 * Every function here is written so the call signature matches what a real
 * service call would look like, so swapping localStorage for an HTTP call
 * later shouldn't require touching callers in app/page.js.
 */

const META_CONN_KEY = 'mar_meta_connected';
const META_ACCOUNTS_KEY = 'mar_meta_accounts';

const isBrowser = () => typeof window !== 'undefined';

export const MetaMockAPI = {
  isConnected() {
    if (!isBrowser()) return false;
    return localStorage.getItem(META_CONN_KEY) === 'true';
  },

  // Simulates: redirect to Meta OAuth -> consent -> callback -> token exchange
  // -> GET /me/adaccounts. Real version: async, hits our backend which holds
  // the token server-side (see .env.example) and returns only mapped ad
  // accounts for this merchant.
  connect() {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!isBrowser()) return resolve([]);
        localStorage.setItem(META_CONN_KEY, 'true');
        if (!localStorage.getItem(META_ACCOUNTS_KEY)) {
          this.seedDefaultAccounts();
        }
        resolve(this.getAccounts());
      }, 1400); // simulated OAuth + account-fetch latency
    });
  },

  disconnect() {
    if (!isBrowser()) return;
    localStorage.setItem(META_CONN_KEY, 'false');
  },

  getAccounts() {
    if (!isBrowser()) return [];
    const raw = localStorage.getItem(META_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  getAccount(accountId) {
    return this.getAccounts().find((a) => a.id === accountId) || null;
  },

  _saveAccounts(accounts) {
    if (!isBrowser()) return;
    localStorage.setItem(META_ACCOUNTS_KEY, JSON.stringify(accounts));
  },

  // Simulates calling Meta's add-funds / balance-credit mechanism once payment
  // has cleared on our side. In production this is the step that needs the
  // most validation — see project notes on prepaid vs postpaid billing models.
  applyRecharge(accountId, amount) {
    const accounts = this.getAccounts();
    const idx = accounts.findIndex((a) => a.id === accountId);
    if (idx === -1) throw new Error('Unknown ad account: ' + accountId);
    accounts[idx].balance = Math.round((accounts[idx].balance + amount) * 100) / 100;
    this._saveAccounts(accounts);
    return accounts[idx];
  },

  // Demo data: one brand (Aarogya) connected to multiple Meta Ad Accounts,
  // which is the realistic multi-account case this feature needs to handle.
  seedDefaultAccounts() {
    const now = new Date().toISOString();
    const accounts = [
      {
        id: 'acc_1001',
        name: 'Aarogya 1 <> Shiprocket_BFRS',
        metaAccountId: 'act_9182736450',
        currency: '₹',
        status: 'ACTIVE',
        balance: 1180,
        yesterdaySpend: 940,
        last7DaySpend: 6420,
        last30DaySpend: 24150,
        hasSpendHistory: true,
        connectedAt: now
      },
      {
        id: 'acc_1002',
        name: 'Aarogya Nutri Mix',
        metaAccountId: 'act_4471029384',
        currency: '₹',
        status: 'ACTIVE',
        balance: 42500,
        yesterdaySpend: 1850,
        last7DaySpend: 12300,
        last30DaySpend: 51200,
        hasSpendHistory: true,
        connectedAt: now
      }
    ];
    this._saveAccounts(accounts);
    return accounts;
  },

  // --- Dev helpers used only by the Prototype Controls panel ---
  _devSetScenario(accountId, scenario) {
    const accounts = this.getAccounts();
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) return;
    switch (scenario) {
      case 'critical':
        acc.balance = 1100; acc.yesterdaySpend = 950; acc.hasSpendHistory = true; break;
      case 'low':
        acc.balance = 4200; acc.yesterdaySpend = 850; acc.hasSpendHistory = true; break;
      case 'neutral':
        acc.balance = 9800; acc.yesterdaySpend = 950; acc.hasSpendHistory = true; break;
      case 'positive':
        acc.balance = 42000; acc.yesterdaySpend = 1200; acc.hasSpendHistory = true; break;
      case 'zero-balance':
        acc.balance = 0; acc.yesterdaySpend = 500; acc.hasSpendHistory = true; break;
      case 'zero-spend':
        acc.balance = 8000; acc.yesterdaySpend = 0; acc.hasSpendHistory = true; break;
      case 'no-history':
        acc.balance = 5000; acc.yesterdaySpend = 0; acc.hasSpendHistory = false; break;
      case 'very-high-spend':
        acc.balance = 15000; acc.yesterdaySpend = 48000; acc.hasSpendHistory = true; break;
      default:
        break;
    }
    this._saveAccounts(accounts);
  },

  _devReset() {
    if (!isBrowser()) return;
    localStorage.removeItem(META_CONN_KEY);
    localStorage.removeItem(META_ACCOUNTS_KEY);
  }
};
