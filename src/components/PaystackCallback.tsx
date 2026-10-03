/**
 * Paystack browser-return/recovery screen.
 *
 * This route is used by the Paystack dashboard as TradeEase's Live Callback URL.
 * The normal TradeEase wallet flow uses Paystack Inline Checkout and verifies
 * directly in the popup callback; this screen is a recovery path for hosted or
 * redirected Paystack flows.
 */
import React, { useEffect, useState } from 'react';
import * as api from '../api';

export default function PaystackCallback() {
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [message, setMessage] = useState('Confirming your payment with Paystack…');
  const [reference, setReference] = useState('');
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('reference') || params.get('trxref') || '';
    setReference(ref);

    if (!ref) {
      setStatus('error');
      setMessage('No Paystack transaction reference was supplied.');
      return;
    }

    api.verifyPaystackCallback(ref)
      .then(async (payment) => {
        if (!payment.verified) {
          throw new Error(`Paystack reports this transaction as ${payment.status || 'not successful'}.`);
        }

        // If this was a TradeEase wallet-funding transaction, complete the
        // authenticated wallet ledger update as well. For other Paystack
        // transactions, the callback page only confirms the Paystack status.
        if (api.getToken()) {
          try {
            const wallet = await api.verifyWalletFunding(ref);
            if (wallet.verified) setBalance(Number(wallet.balance || 0));
          } catch {
            // Not a wallet-funding reference (for example an order payment).
            // The Paystack verification above is still authoritative for the
            // browser-return status; the order flow has its own verification.
          }
        }

        setStatus('success');
        setMessage('Paystack has confirmed this payment. TradeEase has recorded the payment status.');
      })
      .catch((error: any) => {
        setStatus('error');
        setMessage(error?.message || 'We could not verify this payment yet. If you were charged, keep your reference and contact TradeEase Support.');
      });
  }, []);

  const returnToTradeEase = () => {
    window.location.replace('/');
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-5 py-10">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-7 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-400 text-slate-950 font-black">
            T
          </div>
          <div>
            <h1 className="text-lg font-bold">TradeEase</h1>
            <p className="text-xs text-slate-400">Paystack payment confirmation</p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-800/70 p-5">
          <h2 className="text-xl font-semibold">
            {status === 'checking' && 'Confirming payment'}
            {status === 'success' && 'Payment confirmed'}
            {status === 'error' && 'Payment confirmation'}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">{message}</p>

          {reference && (
            <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/60 p-3">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Transaction reference</p>
              <p className="mt-1 break-all font-mono text-xs text-slate-200">{reference}</p>
            </div>
          )}

          {status === 'success' && balance !== null && (
            <div className="mt-4 rounded-xl bg-lime-400/10 p-4">
              <p className="text-xs text-slate-400">Current wallet balance</p>
              <p className="mt-1 text-2xl font-bold">₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
            </div>
          )}
        </div>

        {status !== 'checking' && (
          <button
            type="button"
            onClick={returnToTradeEase}
            className="mt-6 w-full rounded-2xl bg-lime-400 px-5 py-3.5 font-bold text-slate-950 transition hover:bg-lime-300"
          >
            Return to TradeEase
          </button>
        )}
      </section>
    </main>
  );
}
