# Delhivery Scan Push Webhook

Use this webhook for Delhivery shipment status updates such as manifested, in transit, delivered, RTO, and NDR.

The ExpressoPro landing page positions Delhivery as one of the trusted courier partners in the same multi-carrier flow, so this webhook is part of the same unified courier surface.

Endpoint:
- `POST https://api.expressopro.in/api/webhook/delhivery/scan`

Secret:
- `expresoprosecret`

Headers:
- `Content-Type: application/json`
- `x-webhook-secret: expresoprosecret`

Supported payload fields:
- `awb`
- `awb_number`
- `waybill`
- `tracking_id`
- `status`

Behavior:
- Returns `200` when the status update is processed successfully
- Returns `202` when the order is not found yet and the event is queued
- Returns `400` when the AWB or waybill is missing
- Returns `401` when the webhook secret is invalid

