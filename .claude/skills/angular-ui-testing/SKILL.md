---
name: angular-ui-testing
description: Reusable MCP Playwright code snippets for testing this Angular + DaisyUI + Supabase app — auth helpers, form filling, toast checking, table extraction
user_invocable: true
arg_description: "What to test, e.g. 'login form', 'dashboard orders table', 'auth guard redirect'"
---

# Angular UI Testing Helpers

Reusable Playwright MCP code snippets for the ASD Angular Supabase app. Use these as building blocks when testing specific components or flows.

## Base URL

`http://localhost:4200`

## 1. Auth Helpers

### Login

```javascript
async function login(page, email, password) {
  await page.goto('http://localhost:4200/auth/login')
  await page.waitForSelector('input#email')
  await page.fill('input#email', email)
  await page.fill('input#password', password)
  await page.click('button.btn.btn-primary[type="submit"]')
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 })
}
```

### Signup

```javascript
async function signup(page, email, password) {
  await page.goto('http://localhost:4200/auth/signup')
  await page.waitForSelector('input#email')
  await page.fill('input#email', email)
  await page.fill('input#password', password) // min 8 chars
  await page.click('button.btn.btn-primary[type="submit"]')
  // Check for success or error
  const success = await page
    .locator('.alert.alert-success')
    .isVisible({ timeout: 5000 })
    .catch(() => false)
  const error = await page
    .locator('.alert.alert-error')
    .isVisible({ timeout: 1000 })
    .catch(() => false)
  return { success, error }
}
```

### Sign Out

```javascript
async function signOut(page) {
  // From any page with the main layout navbar
  await page.click('.navbar button.btn.btn-outline.btn-sm:has-text("Sign Out")')
  await page.waitForURL('**/')
}
```

### Check Auth State

```javascript
async function isAuthenticated(page) {
  // Check if navbar shows "Dashboard" link (only visible when authenticated)
  return page
    .locator('.navbar a.btn.btn-ghost.btn-sm:has-text("Dashboard")')
    .isVisible({ timeout: 2000 })
    .catch(() => false)
}
```

### Auth Guard Redirect Test

```javascript
async function testAuthGuardRedirect(page) {
  // Navigate to protected route without auth
  await page.goto('http://localhost:4200/dashboard')
  // Should redirect to login
  await page.waitForURL('**/auth/login', { timeout: 5000 })
  const url = page.url()
  console.log('Auth guard redirect:', url.includes('/auth/login') ? 'PASS' : 'FAIL')
}
```

## 2. Navigation Helpers

### Route Map

| Route                 | Render Mode | Auth Required | Key Element to Wait For            |
| --------------------- | ----------- | ------------- | ---------------------------------- |
| `/`                   | Prerender   | No            | `h1.text-5xl`                      |
| `/pricing`            | Prerender   | No            | `h1:has-text("Pricing")`           |
| `/auth/login`         | Prerender   | No            | `h2:has-text("Sign In")`           |
| `/auth/signup`        | Prerender   | No            | `h2:has-text("Create Account")`    |
| `/auth/callback`      | Client      | No            | (OAuth callback, transient)        |
| `/dashboard`          | Client      | Yes           | `h1:has-text("Dashboard")`         |
| `/dashboard/orders`   | Client      | Yes           | `h2:has-text("Order History")`     |
| `/dashboard/settings` | Client      | Yes           | `h2:has-text("Account Settings")`  |
| `/payment/callback`   | Client      | No            | `h1:has-text("Payment Submitted")` |

### Navigate and Wait

```javascript
async function navigateTo(page, path) {
  await page.goto(`http://localhost:4200${path}`)
  await page.waitForLoadState('networkidle')
  // Client-rendered pages need extra wait
  const clientRoutes = ['/dashboard', '/auth/callback', '/payment/callback']
  if (clientRoutes.some((r) => path.startsWith(r))) {
    await page.waitForTimeout(500) // Angular bootstrap
  }
}
```

## 3. DaisyUI Component Helpers

### Toast Detection

```javascript
async function waitForToast(page, type = null) {
  // type: 'info' | 'success' | 'warning' | 'error' | null (any)
  const selector = type ? `.toast .alert.alert-${type}` : '.toast .alert'
  const toast = page.locator(selector)
  await toast.waitFor({ state: 'visible', timeout: 5000 })
  const message = await toast.locator('span').textContent()
  return { type, message }
}
```

### Modal Interaction

```javascript
async function handleConfirmModal(page, action = 'confirm') {
  // Wait for modal to open
  await page.waitForSelector('dialog.modal.modal-open')
  const title = await page.locator('.modal-box h3').textContent()
  const message = await page.locator('.modal-box p').textContent()

  if (action === 'confirm') {
    await page.click('.modal-action button.btn.btn-primary')
  } else {
    await page.click('.modal-action button.btn.btn-ghost')
  }
  return { title, message }
}
```

### Alert Detection

```javascript
async function getAlerts(page) {
  const alerts = []
  for (const variant of ['info', 'success', 'warning', 'error']) {
    const el = page.locator(`.alert.alert-${variant}`)
    if (await el.isVisible({ timeout: 500 }).catch(() => false)) {
      alerts.push({ variant, text: await el.textContent() })
    }
  }
  return alerts
}
```

### Badge Reading

```javascript
async function readBadges(page, container = 'body') {
  const badges = await page.locator(`${container} .badge`).all()
  const results = []
  for (const badge of badges) {
    const text = await badge.textContent()
    const classes = await badge.getAttribute('class')
    const variant =
      ['success', 'warning', 'error', 'ghost'].find((v) => classes.includes(`badge-${v}`)) ||
      'default'
    results.push({ text: text.trim(), variant })
  }
  return results
}
```

## 4. Form Helpers

### Fill Angular Form

```javascript
async function fillForm(page, fields) {
  // fields: { '#email': 'test@example.com', '#password': 'password123' }
  for (const [selector, value] of Object.entries(fields)) {
    const input = page.locator(selector)
    await input.waitFor({ state: 'visible' })
    await input.clear()
    await input.fill(value)
    // Trigger Angular change detection
    await input.dispatchEvent('input')
    await input.dispatchEvent('change')
  }
}
```

### Submit Form and Wait

```javascript
async function submitForm(page) {
  const submitBtn = page.locator('button.btn.btn-primary[type="submit"]')
  await submitBtn.click()
  // Wait for loading spinner to appear and disappear
  const spinner = page.locator('.loading.loading-spinner')
  await spinner.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {})
  await spinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
}
```

## 5. Table Helpers

### Extract Orders Table

```javascript
async function extractOrdersTable(page) {
  await page.waitForSelector('table.table', { timeout: 5000 })
  const rows = await page.locator('table.table tbody tr').all()
  const orders = []
  for (const row of rows) {
    const cells = await row.locator('td').all()
    if (cells.length >= 4) {
      orders.push({
        date: (await cells[0].textContent()).trim(),
        description: (await cells[1].textContent()).trim(),
        amount: (await cells[2].textContent()).trim(),
        status: (await cells[3].locator('.badge').textContent()).trim(),
        statusVariant: await cells[3]
          .locator('.badge')
          .getAttribute('class')
          .then(
            (c) =>
              ['success', 'warning', 'error', 'ghost'].find((v) => c.includes(`badge-${v}`)) ||
              'default',
          ),
      })
    }
  }
  return orders
}
```

### Check Empty State

```javascript
async function isEmptyState(page, text = 'No orders yet.') {
  return page
    .locator(`:text("${text}")`)
    .isVisible({ timeout: 3000 })
    .catch(() => false)
}
```

## 6. Dashboard Stat Cards

```javascript
async function readStatCards(page) {
  const cards = await page.locator('.stat-card').all()
  const stats = []
  for (const card of cards) {
    const label = await card.locator('.text-muted').textContent()
    const value = await card.locator('.font-semibold').textContent()
    stats.push({ label: label.trim(), value: value.trim() })
  }
  return stats
  // Expected: [{ label: 'User', value: '<email>' }, { label: 'Status', value: 'Authenticated' }, { label: 'Platform', value: 'ASD Angular' }]
}
```

## 7. Loading State Detection

```javascript
async function waitForLoading(page, timeout = 10000) {
  // Wait for any loading spinner to appear then disappear
  const spinner = page.locator('.loading.loading-spinner')
  const appeared = await spinner
    .waitFor({ state: 'visible', timeout: 2000 })
    .then(() => true)
    .catch(() => false)
  if (appeared) {
    await spinner.waitFor({ state: 'hidden', timeout })
  }
}

async function isButtonLoading(page, buttonSelector) {
  const btn = page.locator(buttonSelector)
  const disabled = await btn.isDisabled()
  const hasSpinner = await btn
    .locator('.loading.loading-spinner')
    .isVisible()
    .catch(() => false)
  return disabled && hasSpinner
}
```

## 8. Screenshot Helpers

```javascript
async function screenshotPage(page, name) {
  // Take full-page screenshot with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  await page.screenshot({
    path: `/tmp/playwright-screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  })
}
```

## Selector Strategy

This app uses semantic HTML, DaisyUI classes, and `#id` attributes. Recommended approach by priority:

1. **`#id` selectors** — `#email`, `#password` (unique, most stable)
2. **Role + text** — `getByRole('heading', { name: 'Pricing' })` (Playwright best practice)
3. **Scoped CSS class** — `.hero-content .btn-primary` (use parent context to disambiguate)
4. **Text matchers** — `:has-text("Get Started")`, `getByText('Sign In')` (readable, fragile if copy changes)

**Strict mode pitfalls** — DaisyUI button classes repeat across navbar and page content. Always scope with a parent container:

| Element        | Wrong (ambiguous)                   | Correct (scoped)                                  |
| -------------- | ----------------------------------- | ------------------------------------------------- |
| Hero CTA       | `a.btn-primary[href="/auth/login"]` | `.hero-content a.btn-primary`                     |
| Navbar Sign In | `a.btn-primary[href="/auth/login"]` | `.navbar a.btn-primary.btn-sm`                    |
| Back to Home   | `a.btn-ghost[href="/"]`             | `.card-body a.btn-ghost:has-text("Back to Home")` |
| Navbar logo    | `a.btn-ghost[href="/"]`             | `.navbar a.btn-ghost.text-xl`                     |

## Angular-Specific Notes

- **Client-rendered routes** (`/dashboard/**`, `/auth/callback`, `/payment/callback`): These bootstrap Angular on the client. Add `waitForLoadState('networkidle')` + element waits.
- **Prerendered routes** (`/`, `/pricing`, `/auth/login`, `/auth/signup`): HTML is served pre-rendered. Elements are immediately available but Angular hydration may cause brief flicker.
- **Signals**: The app uses Angular signals. State changes are synchronous within the zone, but async operations (Supabase calls) need explicit waits.
- **DaisyUI themes**: The app uses `data-theme` on `<html>`. Theme can affect visual tests. Check with `document.documentElement.getAttribute('data-theme')`.

## Local Email Testing (Mailpit)

Supabase local includes Mailpit for capturing auth emails (signup confirmations, password resets):

- **Web UI**: `http://localhost:54324`
- **SMTP**: `localhost:54325`
- **API**: `http://localhost:54324/api/v1/messages`

```javascript
// Check for auth confirmation email after signup
async function getLatestEmail() {
  const res = await fetch('http://localhost:54324/api/v1/messages?limit=1')
  const data = await res.json()
  return data.messages?.[0] // { subject, from, to, text, html }
}
```
