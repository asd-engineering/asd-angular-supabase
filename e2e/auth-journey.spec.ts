import { test, expect } from '@playwright/test'

const email = `journey-${Date.now()}@example.com`
const password = 'TestPass1234'

test.describe.serial('Auth Journey — Signup → Login → Dashboard', () => {
  test('1. Visit home page and click Get Started', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const cta = page.locator('a[href="/auth/signup"]').first()
    await expect(cta).toBeVisible()
    await cta.click()
    await page.waitForURL('**/auth/signup')
  })

  test('2. Sign up with new account', async ({ page }) => {
    await page.goto('/auth/signup')
    await page.waitForLoadState('networkidle')

    await page.fill('input#email', email)
    await page.fill('input#password', password)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    const error = page.locator('.alert-error')
    const hasError = await error.isVisible()
    if (hasError) {
      console.log('SIGNUP ERROR:', await error.textContent())
    }
    expect(hasError).toBe(false)
  })

  test('3. Login with the new account', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')

    await page.fill('input#email', email)
    await page.fill('input#password', password)
    await page.click('button[type="submit"]')

    // Wait for navigation to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 })
  })

  test('4. Dashboard is accessible when logged in', async ({ page }) => {
    // Login first (each test gets fresh browser context)
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    await page.fill('input#email', email)
    await page.fill('input#password', password)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 })

    // Verify dashboard content
    expect(page.url()).toContain('/dashboard')
  })

  test('5. Auth guard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/auth/login')
  })
})
