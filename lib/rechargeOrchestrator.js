/*
 * Orchestrates the hand-off between the payment leg (Easebuzz) and the Meta
 * recharge leg, the way our backend will eventually do it:
 *
 *   payment webhook success -> trigger Meta add-funds call -> reconcile
 *
 * In this prototype that glue runs client-side (polling localStorage from the
 * main tab), but the state machine below (created -> payment_success ->
 * processing_recharge -> recharge_success / payment_failed) is written to
 * mirror what a real backend job would track, so the UI layer and this state
 * machine can be lifted largely as-is once Easebuzz + Meta APIs are real.
 *
 * Exposed as a factory (not a module-level singleton) so each RechargeModal
 * instance owns its own poll handle — avoids cross-talk if the modal were
 * ever mounted more than once.
 */
import { PaymentMockAPI } from './mockPaymentApi';
import { MetaMockAPI } from './mockMetaApi';

export function createRechargeOrchestrator() {
  let pollHandle = null;

  function stop() {
    if (pollHandle) {
      clearInterval(pollHandle);
      pollHandle = null;
    }
  }

  // Poll the shared transaction record (written by the dummy payment tab)
  // until it reaches a terminal state, driving the recharge side-effect
  // (MetaMockAPI.applyRecharge) once payment is confirmed.
  function watch(txnId, { onPaymentSuccess, onProcessing, onRechargeSuccess, onFailed }) {
    stop();
    let handledPaymentSuccess = false;

    pollHandle = setInterval(() => {
      const txn = PaymentMockAPI.getOrder(txnId);
      if (!txn) return;

      if (txn.status === 'payment_failed') {
        stop();
        onFailed && onFailed(txn);
        return;
      }

      if (txn.status === 'payment_success' && !handledPaymentSuccess) {
        handledPaymentSuccess = true;
        onPaymentSuccess && onPaymentSuccess(txn);

        PaymentMockAPI._updateOrder(txnId, { status: 'processing_recharge' });
        onProcessing && onProcessing(txn);

        // Simulated latency for the actual Meta add-funds API call.
        setTimeout(() => {
          const updatedAccount = MetaMockAPI.applyRecharge(txn.accountId, txn.amount);
          const finalTxn = PaymentMockAPI._updateOrder(txnId, {
            status: 'recharge_success',
            completedAt: new Date().toISOString()
          });
          stop();
          onRechargeSuccess && onRechargeSuccess(finalTxn, updatedAccount);
        }, 1800);
      }
    }, 700);
  }

  return { watch, stop };
}
