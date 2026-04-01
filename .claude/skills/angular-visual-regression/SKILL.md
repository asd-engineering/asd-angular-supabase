---
name: angular-visual-regression
description: Capture baseline screenshots of all app pages and pixel-diff on subsequent runs to detect unintended UI changes
user_invocable: true
arg_description: 'Action: baseline | diff | single <page> (default: baseline)'
---

# Angular Visual Regression Testing

Capture baseline screenshots of every page in the ASD Angular Supabase app, then diff against baselines on subsequent runs to catch unintended visual changes.

## Base URL

`http://localhost:4200`

## Skill Maintenance

**This skill file must be kept up to date by Claude.** When you encounter selectors or page structures that no longer match, or new pages are added to the app, update this SKILL.md immediately. Outdated skills waste time — fix them as you find them.

## Baseline Storage

```
~/tmp/visual-regression/asd-angular-supabase/
  baseline/
    home.png
    pricing.png
    auth-login.png
    auth-signup.png
    dashboard.png
    dashboard-orders.png
    dashboard-orders-empty.png
    dashboard-settings.png
    payment-callback.png
  current/
    (same structure, captured on diff runs)
  diffs/
    (pixel-diff images, only for pages with changes)
```

## Page Matrix

| Page               | URL                   | Render Mode | Auth Required | Key Elements to Wait For                                                   |
| ------------------ | --------------------- | ----------- | ------------- | -------------------------------------------------------------------------- |
| Home               | `/`                   | Prerender   | No            | `h1.text-5xl`, `.btn.btn-primary`                                          |
| Pricing            | `/pricing`            | Prerender   | No            | `h1:has-text("Pricing")`, `.card` (3x)                                     |
| Auth Login         | `/auth/login`         | Prerender   | No            | `h2:has-text("Sign In")`, `input#email`                                    |
| Auth Signup        | `/auth/signup`        | Prerender   | No            | `h2:has-text("Create Account")`, `input#email`                             |
| Dashboard          | `/dashboard`          | Client      | Yes           | `h1:has-text("Dashboard")`, `.stat-card`                                   |
| Dashboard Orders   | `/dashboard/orders`   | Client      | Yes           | `h2:has-text("Order History")`, `table.table` OR `:text("No orders yet.")` |
| Dashboard Settings | `/dashboard/settings` | Client      | Yes           | `h2:has-text("Account Settings")`, `.btn.btn-error`                        |
| Payment Callback   | `/payment/callback`   | Client      | No            | `h1:has-text("Payment Submitted")`                                         |

## Actions

### `baseline` (default)

Capture fresh baseline screenshots for all pages.

1. Initialize browser at 1400x900 viewport
2. Capture public pages (no auth needed): Home, Pricing, Auth Login, Auth Signup, Payment Callback
3. Login with test credentials
4. Capture protected pages: Dashboard, Dashboard Orders, Dashboard Settings
5. Save all screenshots to `baseline/` directory
6. Report captured pages with file sizes

### `diff`

Compare current state against baselines.

1. Initialize browser at 1400x900 viewport
2. Capture all pages (same flow as baseline) to `current/` directory
3. For each page, pixel-diff against `baseline/` version
4. Save diff images to `diffs/` directory (only for changed pages)
5. Report results table with pass/fail and pixel change percentage

### `single <page>`

Capture or diff a single page. Page names: `home`, `pricing`, `auth-login`, `auth-signup`, `dashboard`, `dashboard-orders`, `dashboard-settings`, `payment-callback`.

## Capture Protocol

### For Each Page:

```javascript
// 1. Navigate
await page.goto(url)
await page.waitForLoadState('networkidle')

// 2. Wait for key elements (ensures page is fully rendered)
for (const selector of keyElements) {
  await page.waitForSelector(selector, { timeout: 10000 })
}

// 3. Wait for animations/transitions to settle
await page.waitForTimeout(300)

// 4. Hide dynamic content that causes false positives
await page.evaluate(() => {
  // Hide toast notifications
  document.querySelectorAll('.toast').forEach((el) => (el.style.display = 'none'))
})

// 5. Capture screenshot
await page.screenshot({
  path: screenshotPath,
  fullPage: true,
})
```

### Auth Flow for Protected Pages:

```javascript
// Login before capturing dashboard pages
await page.goto('http://localhost:4200/auth/login')
await page.waitForSelector('input#email')
await page.fill('input#email', testEmail)
await page.fill('input#password', testPassword)
await page.click('button.btn.btn-primary[type="submit"]')
await page.waitForURL('**/dashboard', { timeout: 10000 })
```

## Pixel Diff Strategy

```javascript
// Using page.screenshot comparison
// Threshold: 0.1% pixel difference = PASS (accounts for anti-aliasing)
// Above threshold = FAIL, generate diff image

function compareScreenshots(baseline, current) {
  // Use Playwright's built-in screenshot comparison if available
  // Or use pixelmatch library for pixel-level comparison
  // Return: { match: boolean, diffPercent: number, diffImagePath: string }
}
```

## DaisyUI Theme Consistency

Before capturing any screenshots, verify the theme is consistent:

```javascript
const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
console.log('Current theme:', theme || 'default')
// Store theme name with baseline metadata for comparison
```

## Report Format

### Baseline Report

```
Visual Regression Baselines Captured
=====================================
Theme: [theme-name]
Viewport: 1400x900
Date: [timestamp]

| Page                | File                       | Size   |
| ------------------- | -------------------------- | ------ |
| Home                | baseline/home.png          | 245 KB |
| Pricing             | baseline/pricing.png       | 312 KB |
| ...                 | ...                        | ...    |

Total: 9 pages captured
```

### Diff Report

```
Visual Regression Diff Results
===============================
Baseline date: [date]
Current date: [date]
Theme: [theme-name]
Viewport: 1400x900

| Page                | Status | Diff %  | Diff Image                   |
| ------------------- | ------ | ------- | ---------------------------- |
| Home                | PASS   | 0.00%   | -                            |
| Pricing             | FAIL   | 2.34%   | diffs/pricing-diff.png       |
| ...                 | ...    | ...     | ...                          |

Result: 1 of 9 pages changed
```

## Selector Strategy

DaisyUI button classes repeat across navbar and page content. When clicking elements during capture flows, scope selectors with parent containers:

- Hero CTA: `.hero-content a.btn-primary` (not `a.btn-primary[href="/auth/login"]`)
- Navbar buttons: `.navbar a.btn-sm` or `.navbar button.btn-sm`
- Card actions: `.card-body a.btn-ghost:has-text("Back to Home")`

## Notes

- Always use the same viewport (1400x900) for consistency
- Run against local dev server (`pnpm dev` on port 4200)
- Protected pages require valid Supabase test credentials
- Toast notifications are hidden before capture to avoid false positives
- DaisyUI theme changes will cause all pages to fail diff - this is expected and desired
- The `data-theme` attribute is checked and recorded to catch unintentional theme changes
- **Mailpit** (`http://localhost:54324`): Supabase local email capture — useful for verifying auth emails after signup in visual tests
