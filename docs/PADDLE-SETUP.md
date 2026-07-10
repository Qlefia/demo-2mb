# Paddle Billing (Sandbox) Setup

## 1. Environment Variables

Add to `.env.local`:

```env
# Paddle sandbox
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_xxx   # Developer tools > Authentication (create client-side token)
NEXT_PUBLIC_PADDLE_ENV=sandbox
NEXT_PUBLIC_PADDLE_PRICE_PRO=pri_xxx      # From Product catalog > Prices
NEXT_PUBLIC_PADDLE_PRICE_BUSINESS=pri_xxx
PADDLE_API_KEY=pdl_sdbx_apikey_xxx       # Server-only, for webhooks/API
PADDLE_WEBHOOK_SECRET=xxx                 # Developer tools > Notifications
```

- **Client token**: Paddle Dashboard > Developer tools > Authentication. Sandbox tokens start with `test_`.
- **Price IDs**: Create products in Product catalog, then copy price IDs (start with `pri_`).
- **API key**: Same Authentication page. Sandbox keys contain `_sdbx`.
- **Webhook secret**: Developer tools > Notifications > Add destination > copy signing secret.

## 2. Product Catalog

In Paddle sandbox (https://sandbox.paddle.com):

1. Product catalog > Create product (e.g. "Pro Plan", "Business Plan").
2. Add prices (monthly subscription).
3. Copy price IDs to env vars.

## 3. Webhook URL

**Production:** `https://your-domain.com/api/webhooks/paddle`

**Local dev:** Use [ngrok](https://ngrok.com) or [Hookdeck CLI](https://hookdeck.com/docs/cli):

```bash
# ngrok
ngrok http 3000
# Use: https://xxx.ngrok.io/api/webhooks/paddle

# Hookdeck
hookdeck listen 3000 paddle --path /api/webhooks/paddle
```

In Paddle: Developer tools > Notifications > New destination > URL = your public URL.

After saving, copy the **Signing secret** (endpoint secret key) to `PADDLE_WEBHOOK_SECRET` in `.env.local`.

## 4. Billing Flow

- Billing is **per workspace**. `workspace_id` is passed as `customData` in checkout.
- Webhook updates `subscriptions` table on `subscription.created`, `subscription.updated`, `subscription.canceled`, etc.

## 5. Webhook Events Handled

The endpoint handles: `subscription.created`, `subscription.updated`, `subscription.canceled`, `subscription.activated`, `subscription.past_due`.

## 6. Test Cards (Sandbox)

| Card     | Number              | CVC |
| -------- | ------------------- | --- |
| Valid    | 4242 4242 4242 4242 | 100 |
| 3DS      | 4000 0038 0000 0446 | 100 |
| Declined | 4000 0000 0000 0002 | 100 |

Use any future expiry and cardholder name.
