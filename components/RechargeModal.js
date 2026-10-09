'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MetaMockAPI } from '../lib/mockMetaApi';
import { PaymentMockAPI } from '../lib/mockPaymentApi';
import { createRechargeOrchestrator } from '../lib/rechargeOrchestrator';
import { getSuggestedRecharge } from '../lib/balanceInsight';
import { fmt, renderFakeQr } from '../lib/format';

// Multi-step state machine, mirroring the original prototype's modal flow:
//   amount -> checkout -> waiting -> paymentSuccess -> processing -> rechargeSuccess
//                                                                  \-> failed -> checkout (retry)
export default function RechargeModal({ account, onClose, onRechargeComplete }) {
  const suggested = useMemo(
    () => getSuggestedRecharge(account.yesterdaySpend, account.hasSpendHistory),
    [account]
  );
  const chips = useMemo(
    () => [suggested, 1000, 5000, 10000].filter((v, i, arr) => arr.indexOf(v) === i),
    [suggested]
  );

  const [step, setStep] = useState('amount');
  const [amount, setAmount] = useState(suggested);
  const [txn, setTxn] = useState(null);
  const [rechargeResult, setRechargeResult] = useState(null); // { txn, account }
  const orchestratorRef = useRef(null);

  if (!orchestratorRef.current) orchestratorRef.current = createRechargeOrchestrator();

  useEffect(() => {
    return () => orchestratorRef.current.stop();
  }, []);

  function handleClose() {
    orchestratorRef.current.stop();
    onClose();
  }

  function proceedToCheckout() {
    if (!amount || amount <= 0) return;
    const order = PaymentMockAPI.createOrder({ accountId: account.id, accountName: account.name, amount });
    setTxn(order);
    setStep('checkout');
  }

  function launchDummyPayment(currentTxn) {
    window.open(`/dummy-payment?txn=${currentTxn.id}`, '_blank');
    setStep('waiting');
    orchestratorRef.current.watch(currentTxn.id, {
      onPaymentSuccess: () => setStep('paymentSuccess'),
      onProcessing: () => setStep('processing'),
      onRechargeSuccess: (finalTxn, updatedAccount) => {
        setRechargeResult({ txn: finalTxn, account: updatedAccount });
        setStep('rechargeSuccess');
        onRechargeComplete && onRechargeComplete();
      },
      onFailed: () => setStep('failed')
    });
  }

  function retryPayment() {
    const freshAccount = MetaMockAPI.getAccount(account.id);
    const order = PaymentMockAPI.createOrder({ accountId: account.id, accountName: freshAccount.name, amount: txn.amount });
    setTxn(order);
    setStep('checkout');
  }

  return (
    <div className="modal-overlay show">
      <div className="modal-box">
        <button className="modal-close" onClick={handleClose}>✕</button>

        {step === 'amount' && (
          <AmountStep
            account={account}
            suggested={suggested}
            chips={chips}
            amount={amount}
            setAmount={setAmount}
            onProceed={proceedToCheckout}
          />
        )}

        {step === 'checkout' && txn && (
          <CheckoutStep account={account} txn={txn} onPay={() => launchDummyPayment(txn)} onCancel={handleClose} />
        )}

        {step === 'waiting' && (
          <div>
            <div className="status-step">
              <div className="spin" />
              <h3>Waiting for payment confirmation</h3>
              <p>Complete the payment in the new tab that just opened. This screen will update automatically.</p>
            </div>
            <button className="btn btn-text btn-block" onClick={handleClose}>Cancel</button>
          </div>
        )}

        {step === 'paymentSuccess' && (
          <div className="status-step">
            <div className="check">✓</div>
            <h3>Payment Successful</h3>
            <p>Confirming your Meta Ad Account recharge…</p>
          </div>
        )}

        {step === 'processing' && (
          <div className="status-step">
            <div className="spin" />
            <h3>Recharge Processing</h3>
            <p>We&apos;re adding funds to your Meta Ad Account. This usually takes a few seconds.</p>
          </div>
        )}

        {step === 'rechargeSuccess' && rechargeResult && (
          <RechargeSuccessStep result={rechargeResult} onDone={handleClose} />
        )}

        {step === 'failed' && (
          <div>
            <div className="status-step">
              <div className="cross">✕</div>
              <h3>Payment Failed</h3>
              <p>Your payment could not be completed. No funds were deducted.</p>
            </div>
            <button className="btn btn-primary btn-block" onClick={retryPayment}>Retry Payment</button>
            <button className="btn btn-text btn-block" style={{ marginTop: 6 }} onClick={handleClose}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

function AmountStep({ account, suggested, chips, amount, setAmount, onProceed }) {
  return (
    <div>
      <h3 className="modal-title">Recharge {account.name}</h3>
      <p className="modal-sub">Current balance: {fmt(account.balance)}</p>
      <div className="amount-suggested-note">
        {account.hasSpendHistory && account.yesterdaySpend > 0
          ? `Suggested: ${fmt(suggested)} — covers ~7 days at yesterday's spend (${fmt(account.yesterdaySpend)}/day).`
          : `Suggested: ${fmt(suggested)} — a starting amount since we don't have enough spend history yet.`}
      </div>
      <div className="amount-chips">
        {chips.map((c) => (
          <div
            key={c}
            className={`amount-chip${Number(amount) === c ? ' active' : ''}`}
            onClick={() => setAmount(c)}
          >
            {fmt(c)}
          </div>
        ))}
      </div>
      <input
        type="number"
        min="1"
        className="amount-input"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        placeholder="Enter custom amount"
      />
      <button className="btn btn-primary btn-block" style={{ marginTop: 10 }} onClick={onProceed}>
        Proceed to Pay
      </button>
    </div>
  );
}

function CheckoutStep({ account, txn, onPay, onCancel }) {
  const qrSvg = useMemo(() => renderFakeQr(txn.id), [txn.id]);
  return (
    <div>
      <h3 className="modal-title">Complete Payment</h3>
      <p className="modal-sub">Dummy Easebuzz checkout (prototype only — no real payment gateway is called)</p>
      <div className="qr-order-row"><span>Account</span><strong>{account.name}</strong></div>
      <div className="qr-order-row"><span>Amount</span><strong>{fmt(txn.amount)}</strong></div>
      <div className="qr-box" onClick={onPay}>
        <span dangerouslySetInnerHTML={{ __html: qrSvg }} />
        <div className="qr-caption">
          Scan with any UPI app to pay<br /><strong>{fmt(txn.amount)}</strong>
        </div>
      </div>
      <button className="btn btn-primary btn-block" onClick={onPay}>Simulate Scan &amp; Pay</button>
      <button className="btn btn-text btn-block" style={{ marginTop: 6 }} onClick={onCancel}>Cancel</button>
    </div>
  );
}

function RechargeSuccessStep({ result, onDone }) {
  const { txn, account } = result;
  const oldBalance = account.balance - txn.amount;
  return (
    <div>
      <div className="status-step">
        <div className="check">✓</div>
        <h3>Recharge Successful</h3>
        <p>{fmt(txn.amount)} has been added to {account.name}.</p>
        <div className="balance-transition">{fmt(oldBalance)} → {fmt(account.balance)}</div>
      </div>
      <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} onClick={onDone}>Done</button>
    </div>
  );
}
