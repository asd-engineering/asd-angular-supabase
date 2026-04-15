---
name: lighthouse-audit
description: Run Lighthouse audits on key pages, score against thresholds, report top 3 issues per failing category
argument-hint: [url|page]
user-invocable: true
---

# Lighthouse Audit

Run Google Lighthouse audits on key pages, score against defined thresholds, and report the top 3 actionable issues per failing category.

**Why this exists:** Performance and SEO regressions creep in gradually. Regular Lighthouse audits catch them before users notice.

## Arguments

- `$ARGUMENTS` — what to audit. Can be:
  - A URL: `http://localhost:4200/pricing`
  - A specific page: `landing`, `pricing`, `dashboard`
  - Empty — audits all key pages

## Score Thresholds

| Category       | Minimum Score | Target Score |
| -------------- | ------------- | ------------ |
| Performance    | 70            | 90           |
| Accessibility  | 80            | 95           |
| Best Practices | 80            | 95           |
| SEO            | 85            | 95           |

Scores below minimum are **FAIL**. Scores between minimum and target are **WARN**.

## Key Pages to Audit

| Page      | URL                   | Priority | Why                          |
| --------- | --------------------- | -------- | ---------------------------- |
| Landing   | `/`                   | High     | First impression, conversion |
| Pricing   | `/pricing`            | High     | Conversion page              |
| Login     | `/auth/login`         | Medium   | Auth entry point             |
| Dashboard | `/dashboard`          | Medium   | Core app experience          |
| Settings  | `/dashboard/settings` | Low      | Authenticated users only     |

## Phase 1: Run Lighthouse

### Option A: Lighthouse CLI (preferred)

```bash
npx lighthouse "{URL}" \
  --output=json \
  --output-path="/tmp/lighthouse-{page}.json" \
  --chrome-flags="--headless --no-sandbox" \
  --only-categories=performance,accessibility,best-practices,seo
```

### Option B: PageSpeed Insights API (no local Chrome needed)

```bash
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={URL}&category=performance&category=accessibility&category=best-practices&category=seo" \
  -o "/tmp/lighthouse-{page}.json"
```

### Option C: MCP Playwright Performance Metrics

If Lighthouse is unavailable, collect basic metrics via Playwright:

```javascript
await page.goto('{URL}', { waitUntil: 'networkidle' })
const metrics = await page.evaluate(() => {
  const nav = performance.getEntriesByType('navigation')[0]
  const paint = performance.getEntriesByType('paint')
  return {
    domContentLoaded: nav.domContentLoadedEventEnd,
    loadComplete: nav.loadEventEnd,
    firstPaint: paint.find((p) => p.name === 'first-paint')?.startTime,
    firstContentfulPaint: paint.find((p) => p.name === 'first-contentful-paint')?.startTime,
    transferSize: nav.transferSize,
  }
})
```

## Phase 2: Parse Results

Extract scores and top issues from JSON output:

```bash
cat /tmp/lighthouse-{page}.json | jq '{
  scores: {
    performance: (.categories.performance.score * 100),
    accessibility: (.categories.accessibility.score * 100),
    bestPractices: (.categories["best-practices"].score * 100),
    seo: (.categories.seo.score * 100)
  },
  performance_issues: [.audits | to_entries[] | select(.value.score != null and .value.score < 1 and .value.details) | {id: .key, title: .value.title, score: .value.score, displayValue: .value.displayValue}] | sort_by(.score)[:3],
  accessibility_issues: [.audits | to_entries[] | select(.value.score == 0 and (.key | startswith("aria") or startswith("color") or startswith("heading") or startswith("image") or startswith("label"))) | {id: .key, title: .value.title}][:3]
}'
```

## Phase 3: Report

```markdown
## Lighthouse Audit Report

**Date:** {date}
**Target:** {url}

### Scores Overview

| Page    | Performance              | Accessibility | Best Practices | SEO     |
| ------- | ------------------------ | ------------- | -------------- | ------- |
| Landing | {score} {PASS/WARN/FAIL} | {score}       | {score}        | {score} |
| Pricing | {score}                  | {score}       | {score}        | {score} |
| Login   | {score}                  | {score}       | {score}        | {score} |
| ...     | ...                      | ...           | ...            | ...     |

### Failing Categories

#### Performance — {page} ({score}/100)

| Issue     | Impact          | Fix              |
| --------- | --------------- | ---------------- |
| {issue 1} | {display value} | {actionable fix} |
| {issue 2} | {display value} | {actionable fix} |
| {issue 3} | {display value} | {actionable fix} |

#### Accessibility — {page} ({score}/100)

| Issue     | Elements            | Fix   |
| --------- | ------------------- | ----- |
| {issue 1} | {affected elements} | {fix} |
| {issue 2} | {affected elements} | {fix} |
| {issue 3} | {affected elements} | {fix} |

### Trends (if previous audit exists)

| Category    | Previous | Current | Change |
| ----------- | -------- | ------- | ------ |
| Performance | {X}      | {Y}     | {+/-Z} |
| ...         | ...      | ...     | ...    |

### Action Items

1. {Highest impact fix}
2. {Second highest impact fix}
3. {Third highest impact fix}
```

## Phase 4: Store Results

Save audit results for trend tracking:

```bash
mkdir -p ~/tmp/lighthouse-audits/asd-angular
cp /tmp/lighthouse-*.json ~/tmp/lighthouse-audits/asd-angular/$(date +%Y%m%d)/
```

## Anti-Patterns to Avoid

- **Don't audit with dev server** — use production or production-like builds for accurate scores
- **Don't report all issues** — limit to top 3 per category, focus on highest impact
- **Don't ignore mobile** — run audits in both desktop and mobile emulation
- **Don't treat Lighthouse scores as absolute** — focus on trends and regressions
- **Don't skip low-traffic pages** — all pages matter for SEO
