---
name: accessibility-check
description: Run axe-core or Lighthouse accessibility audit, report WCAG violations by severity with actionable fixes. Use when checking pages for accessibility compliance.
argument-hint: [url|page]
user-invocable: true
---

# Accessibility Check

Run WCAG 2.1 AA audit via axe-core (Playwright) or Lighthouse. Report violations by severity with specific fixes.

## Discover Pages

Read `src/app/app.routes.ts` and `src/app/app.routes.server.ts` to discover all routes, their render modes, and auth requirements. Audit every route that renders a page — prioritize public-facing routes first, then authenticated routes.

## Run Audit

### axe-core via Playwright (preferred)

```javascript
await page.goto('{URL}', { waitUntil: 'networkidle' })
const results = await page.evaluate(async () => {
  const script = document.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js'
  document.head.appendChild(script)
  await new Promise((r) => (script.onload = r))
  return await window.axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
  })
})
```

### Lighthouse (alternative)

```bash
npx lighthouse "{URL}" --output=json --output-path="/tmp/a11y-{page}.json" --chrome-flags="--headless --no-sandbox" --only-categories=accessibility
```

## Common Violations in Angular + DaisyUI

### Critical (must fix)

- `button-name` / `link-name`: Icon-only buttons missing `aria-label`
- `image-alt`: Images missing alt text
- `aria-required-attr`: Custom components missing ARIA

### Serious (should fix)

- `color-contrast`: Light text on gradients, DaisyUI disabled states
- `label`: Form inputs without labels
- `heading-order`: Skipped heading levels

### Moderate

- `skip-link`: No skip-to-content link
- `focus-visible`: Missing focus indicators

## Fix Format

For each violation:

```
### {rule-id}: {description}
**Severity:** {level}  **Elements:** {count}
**Current:** {broken HTML}
**Fix:** {fixed HTML}
**File:** {component}:{line}
```

## Report

Summary table (severity × count × status), critical issues with fixes, serious issues with fixes, top 3 quick wins, and what needs manual testing (keyboard nav, screen reader, zoom reflow).

Audit both DaisyUI themes if dark mode exists.
