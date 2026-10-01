# TradeEase ↔ DELIVERI Integration Contract v1.1

## Ownership
TradeEase owns commerce: buyers, vendors, catalogue, checkout, payments, orders and vendor settlement.
DELIVERI owns logistics: drivers, dispatch, pickup, transit, delivery confirmation, driver earnings and logistics payouts.

## Fulfilment model
A parent TradeEase order can contain multiple vendor orders. Each vendor order becomes one `delivery_fulfillment` and one DELIVERI delivery. `fulfillmentId` is the canonical cross-system key.

## TradeEase → DELIVERI
`POST /api/webhooks/tradeease/orders` with HMAC-SHA256 `X-TradeEase-Signature`, unique `X-TradeEase-Event-Id`, `X-TradeEase-Spec-Version: 1.1`, and `X-TradeEase-Provider-Code: DELIVERI`.
Event: `order.fulfillment_requested`.
DELIVERI returns `deliveryId`, `trackingNumber`, `qrCodeToken`, `status`, and `estimatedDeliveryFee`.

## DELIVERI → TradeEase
`POST /api/webhooks/deliveri` with HMAC-SHA256 `X-Deliveri-Signature` and `X-Deliveri-Event-Id`.
Events: `delivery.created`, `delivery.assigned`, `delivery.accepted`, `delivery.picked_up`, `delivery.in_transit`, `delivery.delivered`, `delivery.rejected`.
TradeEase deduplicates events by event ID and aggregates fulfilment statuses before changing the parent order status.

## Idempotency and retry
TradeEase outbound events are stored in `deliveri_outbox`; DELIVERI inbound events are stored in `integration_events`; DELIVERI also protects by `source_fulfillment_id`; TradeEase inbound events are stored in `deliveri_webhook_events`. Failed outbound events are retried with exponential backoff and recovered after restarts.

## Tracking
DELIVERI generates the authoritative tracking number for each physical fulfilment. TradeEase stores it in `delivery_fulfillments.tracking_number` and mirrors the first tracking number to legacy parent-order fields for compatibility.

## Security
Use two independent secrets: `TRADEEASE_TO_DELIVERI_SECRET` for TradeEase → DELIVERI and `DELIVERI_TO_TRADEEASE_SECRET` for DELIVERI → TradeEase. Never commit secrets.
