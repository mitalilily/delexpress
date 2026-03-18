#!/bin/bash

# Simulate Delivery Webhook via API Call
# This sends a webhook to your local server to mark order as delivered

AWB_NUMBER="43493010000044"  # ← Change this to your AWB
API_URL="http://localhost:3000/api/webhook/nimbus/order"

echo "🚀 Simulating delivery webhook for AWB: $AWB_NUMBER"
echo ""

# Create payload
PAYLOAD=$(cat <<EOF
{
  "awb_number": "$AWB_NUMBER",
  "status": "Delivered",
  "location": "Test Location",
  "message": "Order delivered successfully (simulated)",
  "delivered_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
)

echo "📦 Payload:"
echo "$PAYLOAD" | jq '.'
echo ""

# NOTE: This will fail signature verification!
# For testing, temporarily disable signature check in:
# backend/src/controllers/webhooks/nimbuspost.webhook.ts
# Comment out lines 21-23 (signature verification)

echo "⚠️  WARNING: Signature verification must be disabled for this to work!"
echo "   Comment out signature check in nimbuspost.webhook.ts lines 21-23"
echo ""
echo "⏳ Sending webhook..."
echo ""

# Send webhook
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "x-hmac-sha256: test-signature" \
  -d "$PAYLOAD" \
  --verbose

echo ""
echo ""
echo "✅ Webhook sent! Check server logs for result."

