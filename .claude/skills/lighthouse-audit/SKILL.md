---
name: lighthouse-audit
description: Run Lighthouse audits on key pages, score against thresholds, report top 3 issues per failing category. Use for performance and SEO regression checks.
argument-hint: [url|page]
user-invocable: true
---

# Lighthouse Audit

Run Lighthouse on key pages. Score against thresholds. Report top 3 actionable issues per failing category.

## Thresholds

| Category       | Minimum | Target |
| -------------- | ------- | ------ |
| Performance    | 70      | 90     |
| Accessibility  | 80      | 95     |
| Best Practices | 80      | 95     |
| SEO            | 85      | 95     |

Below minimum = **FAIL**. Between minimum and target = **WARN**.

## Discover Pages

Read `src/app/app.routes.ts` and `src/app/app.routes.server.ts` to discover all routes. Audit every page route — prioritize prerendered/public routes (high: landing, conversion pages) then client-rendered/auth routes (medium).

## Run

### Lighthouse CLI (preferred)

```bash
npx lighthouse "{URL}" --output=json --output-path="/tmp/lighthouse-{page}.json" --chrome-flags="--headless --no-sandbox" --only-categories=performance,accessibility,best-practices,seo
```

### PageSpeed Insights API (no local Chrome)

```bash
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={URL}&category=performance&category=accessibility&category=best-practices&category=seo" -o "/tmp/lighthouse-{page}.json"
```

### Playwright metrics (fallback)

```javascript
await page.goto('{URL}', { waitUntil: 'networkidle' })
const metrics = await page.evaluate(() => {
  const nav = performance.getEntriesByType('navigation')[0]
  const paint = performance.getEntriesByType('paint')
  return {
    domContentLoaded: nav.domContentLoadedEventEnd,
    loadComplete: nav.loadEventEnd,
    firstContentfulPaint: paint.find((p) => p.name === 'first-contentful-paint')?.startTime,
    transferSize: nav.transferSize,
  }
})
```

## Parse

```bash
cat /tmp/lighthouse-{page}.json | jq '{
  scores: { performance: (.categories.performance.score * 100), accessibility: (.categories.accessibility.score * 100), bestPractices: (.categories["best-practices"].score * 100), seo: (.categories.seo.score * 100) },
  top_issues: [.audits | to_entries[] | select(.value.score != null and .value.score < 1 and .value.details) | {id: .key, title: .value.title, score: .value.score, displayValue: .value.displayValue}] | sort_by(.score)[:3]
}'
```

## Report

Scores overview table (page × category × PASS/WARN/FAIL), top 3 issues per failing category with actionable fixes, trends vs previous audit (if exists), and 3 prioritized action items.

Store results: `~/tmp/lighthouse-audits/asd-angular/$(date +%Y%m%d)/`
