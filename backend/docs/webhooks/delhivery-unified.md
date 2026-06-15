# Delhivery Unified Webhook

Use this route when Delhivery sends a mixed payload and you want ExpressoPro to auto-detect whether it is a scan update or a document push.

Endpoint:
- `POST https://api.expressopro.in/api/webhook/delhivery/order`

Secret:
- `expresoprosecret`

Headers:
- `Content-Type: application/json`
- `x-webhook-secret: expresoprosecret`

What it does:
- Detects whether the payload is a scan event or a document event
- Routes to the matching processor
- Queues orphan events until the order exists

Behavior:
- Returns `200` when the webhook is processed successfully
- Returns `202` when the event is queued
- Returns `400` when the AWB or waybill is missing
- Returns `401` when the webhook secret is invalid

