

# Plan: Register Asaas Webhook via API

## What
Add a `register-webhook` action to the `billing-service` edge function that calls the Asaas API (`POST /v3/webhooks`) to automatically register the billing-webhook URL for all relevant payment and subscription events.

## Why
Currently the webhook endpoint exists but is not registered with Asaas. Without this registration, Asaas won't send payment events to the system.

## Implementation

### Step 1: Add `register-webhook` handler to `billing-service/index.ts`

Add a new handler function that calls `POST https://sandbox.asaas.com/api/v3/webhooks` with:

```json
{
  "name": "DeclaraIR Billing Webhook",
  "url": "https://bykqurgeptipguqvxwiq.supabase.co/functions/v1/billing-webhook",
  "email": "<escritorio email>",
  "enabled": true,
  "interrupted": false,
  "sendType": "SEQUENTIALLY",
  "events": [
    "PAYMENT_CREATED",
    "PAYMENT_RECEIVED",
    "PAYMENT_CONFIRMED",
    "PAYMENT_OVERDUE",
    "PAYMENT_REFUNDED",
    "PAYMENT_CHARGEBACK",
    "PAYMENT_DELETED",
    "SUBSCRIPTION_DELETED",
    "SUBSCRIPTION_INACTIVATED"
  ]
}
```

Also add a `list-webhooks` action (GET `/v3/webhooks`) to check existing registrations and avoid duplicates.

### Step 2: Add route in the switch statement

Add `register-webhook` and `list-webhooks` cases to the existing action router in `billing-service`.

### Step 3: Add admin UI trigger (optional)

Add a button in `/configuracoes` or `/planos` page to trigger webhook registration, or auto-register on first subscription creation.

## Technical Details

- Reuses existing `asaasRequest()` helper -- no new dependencies
- The Asaas sandbox base URL is already configured
- Events list matches exactly what `billing-webhook/index.ts` handles
- No database changes needed
- No new secrets needed (uses existing `ASAAS_API_KEY`)

