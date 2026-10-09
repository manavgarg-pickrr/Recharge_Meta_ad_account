'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PaymentMockAPI } from '../../lib/mockPaymentApi';
import { fmt } from '../../lib/format';
import './dummy-payment.css';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

function DummyPaymentInner() {
  const searchParams = useSearchParams();
  const txnId = searchParams.get('txn');

  const [txn, setTxn] = useState(null);
  const [lookedUp, setLookedUp] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('entry'); // entry | success | failure
  const [closedHintVisible, setClosedHintVisible] = useState(false);

  useEffect(() => {
    setTxn(PaymentMockAPI.getOrder(txnId));
    setLookedUp(true);
  }, [txnId]);

  useEffect(() => {
    if (pin.length === 4) {
      const id = setTimeout(() => submitPin(pin), 200);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  function pressKey(k) {
    setError('');
    if (k === '⌫') {
      setPin((p) => p.slice(0, -1));
    } else if (pin.length < 4) {
      setPin((p) => p + k);
    }
  }

  function submitPin(currentPin) {
    const result = PaymentMockAPI.submitPin(txnId, currentPin);
    if (result && result.status === 'payment_success') {
      setPhase('success');
      return;
    }
    const attempts = result ? result.pinAttempts : 0;
    setPin('');
    if (attempts >= 3) {
      PaymentMockAPI.markFailed(txnId);
      setPhase('failure');
    } else {
      setError(`Incorrect PIN. ${3 - attempts} attempt(s) left.`);
    }
  }

  function closeThisTab() {
    window.close();
    setTimeout(() => setClosedHintVisible(true), 400);
  }

  if (!lookedUp) return null;

  return (
    <div className="dp-body">
      <div className="phone-frame">
        <div className="bank-bar">🔒 Simulated UPI App <span className="tag">PROTOTYPE</span></div>
        <div className="dp-content">
          {!txn && (
            <div className="result-screen">
              <div className="result-icon fail">✕</div>
              <div className="result-title">Payment session not found</div>
              <div className="result-sub">This payment link is invalid or has expired.</div>
            </div>
          )}

          {txn && phase === 'entry' && (
            <>
              <div className="merchant-row">
                <div className="label">Pay to ShiprocketAds (via Easebuzz)</div>
                <div className="amount">{fmt(txn.amount)}</div>
                <div className="to">For: {txn.accountName} — Meta Ad Account Recharge</div>
              </div>
              <div className="pin-dots">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`pin-dot${i < pin.length ? ' filled' : ''}`} />
                ))}
              </div>
              <div className="error-msg">{error}</div>
              <div className="keypad">
                {KEYS.map((k, i) =>
                  k === '' ? (
                    <div key={i} className="key empty" />
                  ) : (
                    <div key={i} className="key" onClick={() => pressKey(k)}>{k}</div>
                  )
                )}
              </div>
              <div className="dp-hint">Enter dummy UPI PIN <strong>1234</strong> to simulate a successful payment</div>
            </>
          )}

          {txn && phase === 'success' && (
            <div className="result-screen">
              <div className="result-icon ok">✓</div>
              <div className="result-title">Payment Successful</div>
              <div className="result-sub">
                {fmt(txn.amount)} paid to ShiprocketAds.<br />You can return to the Meta Ad Account Recharge tab.
              </div>
              <button className="close-btn" onClick={closeThisTab}>Return to Meta Ad Account Recharge</button>
              {closedHintVisible && (
                <p className="dp-hint" style={{ marginTop: 14 }}>
                  If this tab did not close automatically, you can close it and switch back manually.
                </p>
              )}
            </div>
          )}

          {txn && phase === 'failure' && (
            <div className="result-screen">
              <div className="result-icon fail">✕</div>
              <div className="result-title">Payment Failed</div>
              <div className="result-sub">
                Too many incorrect PIN attempts. No amount was deducted.<br />You can return and retry from the Meta Ad
                Account Recharge tab.
              </div>
              <button className="close-btn" onClick={closeThisTab}>Return to Meta Ad Account Recharge</button>
              {closedHintVisible && (
                <p className="dp-hint" style={{ marginTop: 14 }}>
                  If this tab did not close automatically, you can close it and switch back manually.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DummyPaymentPage() {
  return (
    <Suspense fallback={null}>
      <DummyPaymentInner />
    </Suspense>
  );
}
