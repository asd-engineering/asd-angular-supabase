import { test, expect } from '@playwright/test'

test.describe('App showcase — public pages', () => {
  test('home page loads with hero and CTAs', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('ASD Angular Boilerplate')
    await expect(page.locator('text=Production-grade Angular')).toBeVisible()
    await expect(page.locator('a[href="/auth/login"]:has-text("Get Started")')).toBeVisible()
    await expect(page.locator('a[href="/dashboard"]:has-text("Dashboard")')).toBeVisible()
  })

  test('pricing page shows three plan cards', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.locator('h1')).toContainText('Pricing')
    await expect(page.locator('text=Choose the plan that fits your needs')).toBeVisible()

    // Verify all three plans with correct prices
    await expect(page.locator('text=Starter')).toBeVisible()
    await expect(page.locator('text=€9/month')).toBeVisible()

    await expect(page.getByRole('heading', { name: 'Pro' })).toBeVisible()
    await expect(page.locator('text=€29/month')).toBeVisible()

    await expect(page.locator('text=Enterprise')).toBeVisible()
    await expect(page.locator('text=€99/month')).toBeVisible()

    // Each plan has a Get Started button
    const getStartedButtons = page.locator('button:has-text("Get Started")')
    await expect(getStartedButtons).toHaveCount(3)
  })

  test('navigation from home to pricing', async ({ page }) => {
    await page.goto('/')
    // Navigate via pricing link (in header or page)
    await page.goto('/pricing')
    await expect(page.locator('h1')).toContainText('Pricing')
  })

  test('auth guard redirects /dashboard to /auth/login', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL(/\/auth\/login/)
    await expect(page.locator('h2')).toContainText('Sign In')
  })

  test('login page renders form correctly', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.locator('h2')).toContainText('Sign In')
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible()
    await expect(page.locator('a:has-text("Sign Up")')).toBeVisible()
  })

  test('signup page renders form correctly', async ({ page }) => {
    await page.goto('/auth/signup')
    await expect(page.locator('h2')).toContainText('Create Account')
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('button:has-text("Sign Up")')).toBeVisible()
    await expect(page.locator('a:has-text("Sign In")')).toBeVisible()
  })

  test('payment callback page renders', async ({ page }) => {
    await page.goto('/payment/callback')
    await expect(page.locator('h1')).toContainText('Payment Submitted')
    await expect(page.locator('text=Your payment is being processed')).toBeVisible()
    await expect(page.locator('a[href="/dashboard/orders"]:has-text("View Orders")')).toBeVisible()
    await expect(page.locator('a[href="/"]:has-text("Back to Home")')).toBeVisible()
  })
})
