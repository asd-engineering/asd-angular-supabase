---
name: angular-user-journey
description: Simulate full user journeys (signup -> login -> dashboard -> purchase) via MCP Playwright with screenshots and timing at each step
user_invocable: true
arg_description: 'Journey name: full | signup | login | purchase | dashboard (default: full)'
---

# Angular User Journey Simulation

Simulate end-to-end user journeys through the ASD Angular Supabase app using MCP Playwright. Each journey captures screenshots, checks for console errors, and reports timing.

## Base URL

`http://localhost:4200`

## Available Journeys

| Journey     | Description                                          |
| ----------- | ---------------------------------------------------- |
| `full`      | Signup -> Login -> Dashboard -> Purchase -> Sign Out |
| `signup`    | Create account, verify confirmation message          |
| `login`     | Sign in, verify redirect to dashboard                |
| `purchase`  | Pricing -> Select plan -> Payment callback           |
| `dashboard` | Login -> Dashboard stats -> Orders -> Settings       |

## Page Selector Reference

### Home (`/`)

- Hero heading: `h1.text-5xl`
- Get Started CTA: `.hero-content a.btn.btn-primary` (scoped — navbar also has `btn-primary`)
- Dashboard CTA: `.hero-content a.btn.btn-outline[href="/dashboard"]`

### Auth Login (`/auth/login`)

- Card title: `h2.card-title` (text: "Sign In")
- Email input: `input#email[type="email"]`
- Password input: `input#password[type="password"]`
- Submit button: `button.btn.btn-primary[type="submit"]`
- Error alert: `.alert.alert-error`
- Signup link: `a[href="/auth/signup"]`

### Auth Signup (`/auth/signup`)

- Card title: `h2.card-title` (text: "Create Account")
- Email input: `input#email[type="email"]`
- Password input: `input#password[type="password"]` (minlength 8)
- Submit button: `button.btn.btn-primary[type="submit"]`
- Success alert: `.alert.alert-success` (text: "Check your email for a confirmation link.")
- Error alert: `.alert.alert-error`
- Login link: `a[href="/auth/login"]`

### Pricing (`/pricing`)

- Page heading: `h1` (text: "Pricing")
- Pricing cards: `.card.bg-base-200` (3 cards: Starter/Pro/Enterprise)
- Plan names: `h2.card-title` (text: "Starter", "Pro", "Enterprise")
- Prices: `span.text-4xl.font-bold` (text: "€9", "€29", "€99") — use exact match (`getByText('€9', { exact: true })`) to avoid `€9` matching `€99`
- Buy buttons: `.card-actions button.btn.btn-primary` (text: "Get Started")
- Error alert: `.alert.alert-error`

### Payment Callback (`/payment/callback`)

- Card title: `h1.card-title` (text: "Payment Submitted")
- View Orders button: `a.btn.btn-primary[href="/dashboard/orders"]`
- Back to Home button: `.card-body a.btn.btn-ghost:has-text("Back to Home")` (scoped — navbar logo also has `btn-ghost href="/"`)

### Dashboard (`/dashboard`)

- Page title: `h1` (text: "Dashboard")
- Orders nav: `a.btn[href="/dashboard/orders"]` (text: "Orders")
- Settings nav: `a.btn[href="/dashboard/settings"]` (text: "Settings")
- Stat cards: `.stat-card` (User, Status, Platform)
- User email: `.stat-card .font-semibold`

### Dashboard Orders (`/dashboard/orders`)

- Heading: `h2` (text: "Order History")
- Loading spinner: `.loading.loading-spinner`
- Empty state: text "No orders yet."
- Orders table: `table.table`
- Table headers: `th` (Date, Description, Amount, Status)
- Status badges: `span.badge` with `.badge-success` / `.badge-warning` / `.badge-error` / `.badge-ghost`

### Dashboard Settings (`/dashboard/settings`)

- Card title: `h2.card-title` (text: "Account Settings")
- Email label: text "Email"
- User ID: `.font-mono` (user ID)
- Sign Out button: `button.btn.btn-error` (text: "Sign Out")

### Navigation (Main Layout)

- Logo: `.navbar a.btn.btn-ghost.text-xl` (in `.flex-1`)
- Pricing link: `.navbar a.btn.btn-ghost.btn-sm:has-text("Pricing")` (in `.flex-none`)
- Dashboard link: `.navbar a.btn.btn-ghost.btn-sm:has-text("Dashboard")` (authenticated only)
- Sign Out button: `.navbar button.btn.btn-outline.btn-sm:has-text("Sign Out")` (authenticated only)
- Sign In link: `.navbar a.btn.btn-primary.btn-sm:has-text("Sign In")` (unauthenticated only)
- Footer: `footer` (text: "Built with ASD Platform")

## Execution Protocol

### Phase 1: Initialize

```javascript
// MCP Playwright: init-browser
// Viewport: 1400x900, headless

await page.goto('http://localhost:4200')
await page.waitForLoadState('networkidle')
```

### Phase 2: Execute Journey Steps

For each step:

1. Navigate to the target URL
2. Wait for Angular stability: `await page.waitForLoadState('networkidle')`
3. For client-rendered pages (`/dashboard/**`, `/auth/callback`, `/payment/callback`), also wait: `await page.waitForSelector('[relevant-element]')`
4. Capture screenshot with descriptive name
5. Check for console errors: `page.on('console', msg => { if (msg.type() === 'error') ... })`
6. Record timing (ms since previous step)

### Phase 3: Report

Output a summary table:

| Step | URL | Screenshot | Time (ms) | Console Errors |
| ---- | --- | ---------- | --------- | -------------- |

## Journey: `full`

1. **Home** - Go to `/`, verify hero heading visible, screenshot
2. **Navigate to Signup** - Click "Get Started" CTA, verify signup form
3. **Fill Signup** - Enter email + password (min 8 chars), submit
4. **Verify Signup** - Check for success alert or error
5. **Navigate to Login** - Click "Sign In" link or go to `/auth/login`
6. **Fill Login** - Enter credentials, submit
7. **Verify Dashboard** - Wait for redirect to `/dashboard`, verify stats
8. **View Orders** - Click "Orders" nav, verify table or empty state
9. **View Settings** - Click "Settings" nav, verify email displayed
10. **Navigate to Pricing** - Click "Pricing" in navbar
11. **Start Purchase** - Click "Get Started" on a plan card
12. **Sign Out** - Click "Sign Out" button, verify redirect to home

## Journey: `signup`

Steps 1-4 from the full journey.

## Journey: `login`

Steps 5-7 from the full journey (requires existing account).

## Journey: `purchase`

1. Go to `/pricing`, verify 3 plan cards
2. Click "Get Started" on Pro plan (second card)
3. Verify redirect to Mollie or payment callback
4. Screenshot final state

## Journey: `dashboard`

Steps 5-9 from the full journey (requires existing account).

## Selector Strategy

DaisyUI button classes repeat across navbar and page content. Always scope with a parent container to avoid strict mode violations:

| Element        | Wrong (ambiguous)                   | Correct (scoped)                                  |
| -------------- | ----------------------------------- | ------------------------------------------------- |
| Hero CTA       | `a.btn-primary[href="/auth/login"]` | `.hero-content a.btn-primary`                     |
| Navbar Sign In | `a.btn-primary[href="/auth/login"]` | `.navbar a.btn-primary.btn-sm`                    |
| Back to Home   | `a.btn-ghost[href="/"]`             | `.card-body a.btn-ghost:has-text("Back to Home")` |
| Navbar logo    | `a.btn-ghost[href="/"]`             | `.navbar a.btn-ghost.text-xl`                     |

## Local Email Testing (Mailpit)

Supabase local includes Mailpit for capturing auth emails:

- **Web UI**: `http://localhost:54324`
- **SMTP**: `localhost:54325`
- **API**: `http://localhost:54324/api/v1/messages`

Use after signup to verify confirmation emails are sent.

## Angular-Specific Notes

- **SSR vs Client render**: Home (`/`), Pricing (`/pricing`) are prerendered. Dashboard (`/dashboard/**`), Auth Callback, Payment Callback are client-rendered. Client pages need explicit waits for content.
- **authGuard redirects**: Navigating to `/dashboard` without auth redirects to `/auth/login`. Test this behavior explicitly.
- **Zone.js stability**: Use `networkidle` wait state. For Angular signals/change detection, wait for specific elements rather than arbitrary timeouts.
- **Loading states**: Buttons show `.loading.loading-spinner` and become disabled during async operations. Wait for spinner to disappear before asserting results.
