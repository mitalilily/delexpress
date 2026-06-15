# Delhivery Document Push Webhook

Use this webhook for Delhivery delivery artifacts such as POD, EPOD, QC image, and sorter image events.

Endpoint:
- `POST https://api.expressopro.in/api/webhook/delhivery/document`

Related aliases:
- `/api/webhook/delhivery/qc-image`
- `/api/webhook/delhivery/sorter-image`
- `/api/webhook/delhivery/epod`

Secret:
- `expresoprosecret`

Headers:
- `Content-Type: application/json`
- `x-webhook-secret: expresoprosecret`

Supported payload fields:
- `awb`
- `awb_number`
- `waybill`
- `waybill_number`
- `tracking_id`

Behavior:
- Returns `200` when the document is processed successfully
- Returns `202` when the order is not found yet and the event is queued
- Returns `400` when the AWB or waybill is missing
- Returns `401` when the webhook secret is invalid

