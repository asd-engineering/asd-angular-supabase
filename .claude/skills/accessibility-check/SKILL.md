---
name: accessibility-check
description: Run axe-core or Lighthouse accessibility audit, report WCAG violations by severity with actionable fixes
argument-hint: [url|page]
user-invocable: true
---

# Accessibility Check

Run accessibility audits using axe-core (via Playwright) or Lighthouse, identify WCAG 2.1 violations, and report them by severity with specific, actionable fixes.

**Why this exists:** Accessibility issues are invisible to sighted developers. Automated checks catch 30-50% of WCAG violations — the easy wins that should never ship.

## Arguments

- `$ARGUMENTS` — what to check. Can be:
  - A URL: `http://localhost:4200/pricing`
  - A specific page: `landing`, `pricing`, `login`, `dashboard`
  - Empty — checks all key pages

## WCAG Severity Levels

| Severity | WCAG Level | Impact                 | Example                                         |
| -------- | ---------- | ---------------------- | ----------------------------------------------- |
| Critical | A          | Blocks access entirely | No alt text on functional images, keyboard trap |
| Serious  | A/AA       | Significant barrier    | Missing form labels, low contrast text          |
| Moderate | AA         | Inconvenience          | Missing skip links, unclear focus indicators    |
| Minor    | AAA        | Enhancement            | Touch target too small, redundant alt text      |

## Key Pages to Audit

| Page      | URL                   | Priority |
| --------- | --------------------- | -------- |
| Landing   | `/`                   | High     |
| Pricing   | `/pricing`            | High     |
| Login     | `/auth/login`         | High     |
| Signup    | `/auth/signup`        | High     |
| Dashboard | `/dashboard`          | Medium   |
| Settings  | `/dashboard/settings` | Medium   |

## Phase 1: Run Accessibility Audit

### Option A: axe-core via Playwright (preferred)

```javascript
// Inject axe-core into the page
await page.goto('{URL}', { waitUntil: 'networkidle' })

// Inject and run axe
const results = await page.evaluate(async () => {
  const script = document.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js'
  document.head.appendChild(script)
  await new Promise((r) => (script.onload = r))

  return await window.axe.run(document, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
    },
  })
})
```

### Option B: Lighthouse Accessibility Category

```bash
npx lighthouse "{URL}" \
  --output=json \
  --output-path="/tmp/a11y-{page}.json" \
  --chrome-flags="--headless --no-sandbox" \
  --only-categories=accessibility
```

## Phase 2: Categorize Violations

Group violations by severity and WCAG criteria:

### Critical (must fix)

| Rule                 | WCAG  | Common in Angular + DaisyUI                     |
| -------------------- | ----- | ----------------------------------------------- |
| `image-alt`          | 1.1.1 | Feature images, product screenshots             |
| `button-name`        | 4.1.2 | Icon-only buttons (theme toggle, lang switcher) |
| `link-name`          | 4.1.2 | Icon links, social media links                  |
| `aria-required-attr` | 4.1.2 | Custom components missing ARIA                  |

### Serious (should fix)

| Rule                | WCAG  | Common in Angular + DaisyUI                      |
| ------------------- | ----- | ------------------------------------------------ |
| `color-contrast`    | 1.4.3 | Light text on gradients, DaisyUI disabled states |
| `label`             | 1.3.1 | Form inputs without associated labels            |
| `heading-order`     | 1.3.1 | Skipping heading levels (h1 → h3)                |
| `landmark-one-main` | n/a   | Missing `<main>` landmark                        |

### Moderate (consider fixing)

| Rule                   | WCAG  | Common in Angular + DaisyUI |
| ---------------------- | ----- | --------------------------- |
| `skip-link`            | 2.4.1 | No skip-to-content link     |
| `focus-visible`        | 2.4.7 | Custom focus styles missing |
| `page-has-heading-one` | n/a   | Pages without h1            |

## Phase 3: Generate Fixes

For each violation, provide the specific fix:

````markdown
### {rule-id}: {description}

**Severity:** {critical/serious/moderate/minor}
**WCAG:** {criterion}
**Elements:** {count} affected

**Affected:**

```html
<!-- Current (broken) -->
<button class="btn btn-ghost btn-circle">
  <svg>...</svg>
</button>
```
````

**Fix:**

```html
<!-- Fixed -->
<button class="btn btn-ghost btn-circle" aria-label="Toggle dark mode">
  <svg aria-hidden="true">...</svg>
</button>
```

**File:** `src/app/shared/components/theme-toggle/theme-toggle.component.html:{line}`

````

## Phase 4: Report

```markdown
## Accessibility Report

**Date:** {date}
**Target:** {url}
**Standard:** WCAG 2.1 AA
**Tool:** axe-core 4.9 / Lighthouse

### Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | {N} | {FAIL if >0} |
| Serious | {N} | {WARN if >0} |
| Moderate | {N} | {INFO} |
| Minor | {N} | {INFO} |
| **Total** | **{N}** | |

### Critical Issues (fix immediately)
{Detailed list with fixes as shown in Phase 3}

### Serious Issues (fix soon)
{Detailed list with fixes}

### Quick Wins
{Top 3 issues that are easy to fix and have high impact}

### Not Testable Automatically
These require manual testing:
- Keyboard navigation flow (tab order makes sense)
- Screen reader experience (announcements are meaningful)
- Content reflow at 200% zoom
- Motion/animation preferences respected
````

## Anti-Patterns to Avoid

- **Don't only test the landing page** — check auth pages, error pages, and dynamic content
- **Don't ignore color contrast on dark mode** — audit both DaisyUI themes
- **Don't fix ARIA by adding `role` everywhere** — use semantic HTML first
- **Don't suppress violations** — fix them or document why they're false positives
- **Don't treat 100% Lighthouse a11y as "fully accessible"** — automated tools catch <50% of real issues
