# ExpressoPro Webhook Escalation Matrix

ExpressoPro supports multiple courier partners, including Delhivery, so webhook handling needs to stay consistent across scan updates, document updates, and the legacy unified route.

Shared webhook secret:
- `expresoprosecret`

Shared webhook headers:
- `x-webhook-secret`
- `x-webhook-signature`
- `authorization`

Production base URL:
- `https://api.expressopro.in`

## Delhivery routes

- Scan push: `/api/webhook/delhivery/scan`
- Document push: `/api/webhook/delhivery/document`
- Unified legacy route: `/api/webhook/delhivery/order`

## Routing rules

- Scan payloads map shipment status updates into the internal order status engine.
- Document payloads cover POD, QC image, sorter image, and EPOD delivery artifacts.
- The legacy unified route auto-detects scan versus document payloads and forwards them to the matching processor.

## Expected responses

- `200` when the webhook is accepted and processed
- `202` when the event is queued because the order does not exist yet
- `400` when the payload is missing a required AWB or waybill
- `401` when the shared secret does not match

