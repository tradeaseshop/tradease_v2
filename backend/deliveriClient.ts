import crypto from 'crypto';

const DELIVERI_API_URL = process.env.DELIVERI_API_URL || '';
const DELIVERI_WEBHOOK_SECRET = process.env.DELIVERI_WEBHOOK_SECRET || '';

function signPayload(rawBody: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

export interface DeliveriFulfilmentResult {
  deliveryId: string;
  trackingNumber: string;
  qrCodeToken: string;
  status: string;
  estimatedDeliveryFee: number;
}

/**
 * Hands a newly-placed order off to DELIVERI for real-world fulfilment.
 * Called from routes/orders.ts whenever the buyer's chosen logistics
 * provider is DELIVERI. Returns null (rather than throwing) if DELIVERI
 * isn't configured or can't be reached, so placing an order never fails
 * just because the courier's system is briefly unavailable — the order
 * still gets a locally-generated tracking number as a fallback.
 */
export async function sendOrderToDeliveri(order: {
  orderId: string;
  buyerName: string;
  buyerPhone?: string;
  deliveryAddress: string;
  city?: string;
  state?: string;
  vendorName?: string;
  packageDescription?: string;
  packageValue: number;
  deliveryFee: number;
  paymentMethod?: string;
  paymentStatus?: string;
}): Promise<DeliveriFulfilmentResult | null> {
  if (!DELIVERI_API_URL) {
    console.warn('[deliveri] DELIVERI_API_URL is not configured — skipping fulfilment handoff.');
    return null;
  }

  const payload = {
    orderId: order.orderId,
    buyerName: order.buyerName,
    buyerPhone: order.buyerPhone,
    deliveryAddress: order.deliveryAddress,
    city: order.city,
    state: order.state,
    vendorName: order.vendorName,
    packageDescription: order.packageDescription,
    packageValue: order.packageValue,
    deliveryFee: order.deliveryFee,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
  };
  const rawBody = JSON.stringify(payload);
  const signature = signPayload(rawBody, DELIVERI_WEBHOOK_SECRET);

  try {
    const res = await fetch(`${DELIVERI_API_URL.replace(/\/$/, '')}/api/webhooks/tradeease/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tradeease-Signature': signature,
      },
      body: rawBody,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error(`[deliveri] Fulfilment handoff failed with status ${res.status} for order ${order.orderId}`);
      return null;
    }
    return (await res.json()) as DeliveriFulfilmentResult;
  } catch (err) {
    console.error('[deliveri] Failed to reach DELIVERI for fulfilment handoff:', err);
    return null;
  }
}
