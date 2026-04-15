# Mollie Payment & Subscription Integration

## Architecture

Three Supabase Edge Functions handle payments and subscriptions:

- **`create-payment`** — JWT-authenticated, creates a one-time Mollie payment and stores an order
- **`create-subscription`** — JWT-authenticated, creates a Mollie customer + "first" payment to establish a mandate for recurring billing
- **`mollie-webhook`** — No JWT (Mollie calls it), receives `application/x-www-form-urlencoded` POST with payment ID, verifies status via Mollie API, updates order and subscription status

## Subscription Flow

1. **Create Customer** — `create-subscription` creates a Mollie customer and a `subscriptions` row (status: `pending`)
2. **First Payment** — user completes checkout (`sequenceType: 'first'`), which establishes a payment mandate
3. **Webhook Activates Subscription** — when the first payment succeeds, the webhook calls `customers_subscriptions.create()` on Mollie, setting up automatic monthly charges. Subscription status becomes `active`.

Subsequent recurring payments are handled automatically by Mollie. Each recurring charge triggers the webhook, which inserts a new `orders` row linked to the subscription.

## Database Schema

| Table           | Purpose                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| `orders`        | Individual payment records (one-time or recurring), linked to `subscriptions` via `subscription_id`     |
| `subscriptions` | Recurring billing records with `mollie_customer_id`, `mollie_subscription_id`, plan details, and status |

## Frontend Flow

- **Pricing page** (`/pricing`) — shows plans, calls `create-subscription`, shows "Current Plan" badge for active subscriptions
- **Payment callback** (`/payment/callback`) — confirmation page after Mollie checkout
- **Subscription dashboard** (`/dashboard/subscription`) — active plan name, amount, billing interval, status, start date

## Webhook Delivery via ASD Tunnel

In development/CI, Mollie reaches local Supabase via: `Mollie servers → ASD tunnel → Caddy → Supabase Edge Functions`

Webhook URL: `https://{prefix}api-{client_id}.{tunnel_host}/functions/v1/mollie-webhook`

## E2E Test Flow

1. Create test user via Supabase Admin API
2. Sign in to get JWT access token
3. Call `create-subscription` edge function with tunnel webhook URL
4. Navigate to Mollie test checkout → select "Paid"
5. Mollie POSTs to webhook via tunnel → webhook updates order status + activates subscription
6. Poll database to verify order status → `paid` and subscription status → `active`

**Note:** In Mollie test mode, subscription activation may fail (test mandates may not be valid). The E2E test treats subscription activation as best-effort.

The `playwright-e2e.yml` workflow runs payment E2E automatically when `MOLLIE_API_KEY` and `ASD_API_KEY` secrets are configured.
