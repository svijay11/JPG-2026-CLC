# Stripe Integration TODO

Single source of truth for remaining Stripe Checkout setup after applying Checkout Studio parameters (Scenario A).

## Values to Replace

No `sample_only` placeholders remain in the Checkout Session create call. Existing app values were preserved:

| Field | Current Value | Status |
|-------|--------------|--------|
| mode | `payment` | Correct for one-time custom label orders. |
| success_url | Built by the app (`/?checkout=success&session_id={CHECKOUT_SESSION_ID}&order_id=…`) | Real — keep as-is. |
| cancel_url | Built by the app (`/?checkout=cancelled&order_id=…`) | Real — keep as-is. |
| line_items | Dynamic `price_data` from the cart (not Dashboard Price IDs) | Real — keep as-is for custom labels. |

**Files containing these parameters:**
- [server/createCheckoutSession.js](server/createCheckoutSession.js)

## Configured Parameters

These parameters were configured in Checkout Studio and are set on the Checkout Session create call.

**Files containing these parameters:**
- [server/createCheckoutSession.js](server/createCheckoutSession.js)

| Parameter | Value |
|-----------|-------|
| ui_mode | `hosted_page` (required by Stripe API; legacy `hosted` is rejected even on SDK 20.4.1) |
| billing_address_collection | `required` |
| phone_number_collection | `{ enabled: true }` |
| automatic_tax | `{ enabled: false }` |
| allow_promotion_codes | `false` |
| submit_type | `auto` |
| shipping_address_collection | `{ allowed_countries: ["US"] }` |
| name_collection | `{ individual: { enabled: true, optional: true } }` |
| integration_identifier | `hosted_web_0001` |
| origin_context | `web` |

**Not applied (by product rules):**
- `payment_method_collection` — Checkout Studio set `always`, but this parameter is only included when `mode` is `"subscription"`. Current mode is `"payment"`.

## Setup and next steps

### Environment variables

Ensure `.env` (never commit) matches what the server reads:

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Server-only restricted/secret key (`rk_…` / `sk_…`). **Do not** use a `VITE_` prefix. |
| `STRIPE_PUBLISHABLE_KEY` | Publishable key (`pk_…`). Optional for hosted Checkout (redirect). If used in the browser later, expose as `VITE_STRIPE_PUBLISHABLE_KEY`. |
| `STRIPE_WEBHOOK_SECRET` | From `stripe listen` (local) or Dashboard webhook endpoint. |
| `RESEND_API_KEY` / `ORDER_NOTIFY_EMAILS` | Existing shop notification email (webhook + PDF flow). |

Copy from [`.env.example`](.env.example) if needed.

### Project structure (existing)

- `server/createCheckoutSession.js` — Checkout Session create (Studio params applied here)
- `server/stripeClient.js` — Stripe client
- `server/verifyCheckoutSession.js` — post-redirect payment verification
- `server/handleStripeWebhook.js` — `checkout.session.completed` / async payment events
- `api/create-checkout-session.js`, `api/verify-checkout-session.js`, `api/stripe-webhook.js` — Vercel handlers
- `src/utils/stripeCheckout.js` — client redirect helper
- `vite.config.js` — local `/api/*` middleware

### How the integration works

1. Customer reviews cart → **Pay with Stripe**.
2. Server creates a hosted Checkout Session with Studio parameters + cart `line_items`.
3. Browser redirects to Stripe-hosted Checkout.
4. On success, customer returns to the app; the session is verified and the order PDF / Resend flow runs.
5. Webhooks should confirm payment for fulfillment (required before go-live / async methods).

### Local testing

```bash
npm run dev
stripe listen --forward-to localhost:5173/api/stripe-webhook
```

Test card: `4242 4242 4242 4242` (any future expiry, any CVC).

### Next steps

1. Claim or connect your Stripe account / sandbox; rotate to your own keys for production.
2. Optionally upgrade `stripe` to **≥ 21.0.0** for SDK alignment with `ui_mode: "hosted_page"` (already set).
3. Enable Automatic Tax in the Dashboard only if you set `automatic_tax.enabled` to `true` and complete tax registrations.
4. Confirm webhook endpoint on Vercel with `STRIPE_WEBHOOK_SECRET` from the Dashboard.
5. Optionally add Stripe Price IDs later if you stop using dynamic `price_data`.

### Resources

- https://support.stripe.com
- https://docs.stripe.com/mcp
- https://docs.stripe.com/payments/checkout
