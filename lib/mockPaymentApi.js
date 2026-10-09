/*
 * MOCK Easebuzz-style payment layer.
 *
 * Stands in for the real Easebuzz integration:
 *   - createOrder()   -> POST /initiate-payment (Easebuzz order creation)
 *   - submitPin()     -> stands in for the entire UPI/bank-redirect leg that
 *                        normally happens outside our app
 *   - getOrder()      -> stands in for Easebuzz webhook delivery + our own
 *                        "check payment status" endpoint
 *
 * Transactions are persisted to localStorage (shared across tabs) so the
 * dummy payment tab (app/dummy-payment) and the main app tab can both
 * read/write the same record to simulate a real async payment + webhook
 * round trip.
 */

const TXN_KEY = 'mar_transactions';

const isBrowser = () => typeof window !== 'undefined';

function readTxns() {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(TXN_KEY);
  return raw ? JSON.parse(raw) : [];
}

function writeTxns(list) {
  if (!isBrowser()) return;
  localStorage.setItem(TXN_KEY, JSON.stringify(list));
}

function genId() {
  return 'txn_' + Math.random().toString(36).slice(2, 10);
}

export const PaymentMockAPI = {
  // Simulates Easebuzz order creation. Real version: server call that returns
  // an access_key / payment URL from Easebuzz (see .env.example).
  createOrder({ accountId, accountName, amount }) {
    const txns = readTxns();
    const txn = {
      id: genId(),
      accountId,
      accountName,
      amount,
      status: 'created', // created -> payment_success | payment_failed -> processing_recharge -> recharge_success
      pinAttempts: 0,
      createdAt: new Date().toISOString()
    };
    txns.push(txn);
    writeTxns(txns);
    return txn;
  },

  getOrder(txnId) {
    return readTxns().find((t) => t.id === txnId) || null;
  },

  _updateOrder(txnId, patch) {
    const txns = readTxns();
    const idx = txns.findIndex((t) => t.id === txnId);
    if (idx === -1) return null;
    txns[idx] = Object.assign({}, txns[idx], patch);
    writeTxns(txns);
    return txns[idx];
  },

  // Called from the dummy payment tab. DUMMY_PIN stands in for whatever the
  // merchant's bank/UPI app would normally verify.
  DUMMY_PIN: '1234',

  submitPin(txnId, pin) {
    const txn = this.getOrder(txnId);
    if (!txn) return null;
    if (pin === this.DUMMY_PIN) {
      return this._updateOrder(txnId, { status: 'payment_success' });
    }
    return this._updateOrder(txnId, { pinAttempts: (txn.pinAttempts || 0) + 1 });
  },

  markFailed(txnId) {
    return this._updateOrder(txnId, { status: 'payment_failed' });
  },

  listForAccount(accountId) {
    return readTxns()
      .filter((t) => t.accountId === accountId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
};
