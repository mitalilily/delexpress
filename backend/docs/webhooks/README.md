# ExpressoPro Webhook Escalation Matrix

ExpressoPro supports multiple courier partners, including Delhivery and Shadowfax, so webhook handling needs to stay consistent across scan updates, document updates, and the legacy unified route.

Shared webhook secret:
- `expresoprosecret`

Shared webhook headers:
- `x-webhook-secret`
- `x-webhook-signature`
- `authorization`

Production base URL:
- `https://api.expressopro.in`

## Shadowfax routes

- Staging push: `/api/webhook/shadowfax/staging`
- Staging track: `/api/webhook/shadowfax/staging/track`
- Production push: `/api/webhook/shadowfax/production`
- Production track: `/api/webhook/shadowfax/production/track`
- Legacy compatibility: `/api/webhook/shadowfax`
- Legacy compatibility track: `/api/webhook/shadowfax/track`

## Shadowfax auth

Shadowfax can be configured with Basic Auth in the portal.

Suggested staging credentials:
- Username: `expressopro-staging`
- Password: `expressopro-shadowfax-staging`

Suggested production credentials:
- Username: `expressopro-production`
- Password: `expressopro-shadowfax-production`

Fallback credentials:
- Username: `expressopro`
- Password: `expressopro-shadowfax`

The backend also keeps the existing shared-secret header verification in place for legacy integrations.

## Delhivery routes

- Scan push: `/api/webhook/delhivery/scan`
- Document push: `/api/webhook/delhivery/document`
- Unified legacy route: `/api/webhook/delhivery/order`

## Delhivery requirement pack

- Escalation matrix: `backend/docs/webhooks/delhivery_requirement_pack/Delhivery_Webhook_Escalation_Matrix.docx`
- Scan push requirement: `backend/docs/webhooks/delhivery_requirement_pack/Delhivery_Scan_Push_Requirement.docx`
- QC image requirement: `backend/docs/webhooks/delhivery_requirement_pack/Delhivery_QC_Image_Requirement.docx`
- Sorter image requirement: `backend/docs/webhooks/delhivery_requirement_pack/Delhivery_Sorter_Image_Requirement.docx`
- EPOD requirement: `backend/docs/webhooks/delhivery_requirement_pack/Delhivery_EPOD_Requirement.docx`
- Download bundle: `backend/docs/webhooks/delhivery_requirement_pack.zip`

## Routing rules

- Scan payloads map shipment status updates into the internal order status engine.
- Document payloads cover POD, QC image, sorter image, and EPOD delivery artifacts.
- The legacy unified route auto-detects scan versus document payloads and forwards them to the matching processor.

## Expected responses

- `200` when the webhook is accepted and processed
- `202` when the event is queued because the order does not exist yet
- `400` when the payload is missing a required AWB or waybill
- `401` when the shared secret does not match
