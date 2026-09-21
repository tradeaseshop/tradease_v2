import 'dotenv/config';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export function isPaystackConfigured(): boolean {
  return Boolean(PAYSTACK_SECRET_KEY);
}

export interface PaystackVerifyResult {
  verified: boolean;
  status: string;
  amountKobo: number;
  amountNaira: number;
  currency: string;
  reference: string;
  paidAt: string | null;
  customerEmail: string | null;
  raw: any;
}

/**
 * Verifies a transaction reference directly with Paystack, using the secret
 * key server-side. This is the only step that can be trusted — the amount
 * a browser reports paying can be spoofed by anyone with devtools open, but
 * the amount Paystack itself says it received cannot. Callers should always
 * check `amountNaira` against the order's real total before treating a
 * payment as valid.
 */
export async function verifyTransaction(reference: string): Promise<PaystackVerifyResult> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Paystack is not configured on this server (missing PAYSTACK_SECRET_KEY).');
  }
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message || `Paystack verification failed with status ${res.status}`);
  }
  const data = json.data;
  return {
    verified: data.status === 'success',
    status: data.status,
    amountKobo: data.amount,
    amountNaira: data.amount / 100,
    currency: data.currency,
    reference: data.reference,
    paidAt: data.paid_at || null,
    customerEmail: data.customer?.email || null,
    raw: data,
  };
}
