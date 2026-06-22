# Razorpay Webhook Setup

Configure this endpoint in the Razorpay Dashboard:

```text
https://api.expressopro.in/api/payments/wallet/webhook
```

Use the same webhook secret value as `RAZORPAY_WEBHOOK_SECRET_PROD` in the production backend environment.

Subscribe to these events:

```text
payment.captured
payment.failed
fund.account.validation.completed
```

The backend verifies `X-Razorpay-Signature` against the raw request body before processing the event.

Runtime environment variables required for production:

```text
RAZORPAY_MODE=live
RAZORPAY_KEY_ID_PROD=
RAZORPAY_KEY_SECRET_PROD=
RAZORPAY_WEBHOOK_SECRET_PROD=
RAZORPAY_SOURCE_ACC=
RAZORPAY_COD_PAYOUT_MODE=IMPS
```
