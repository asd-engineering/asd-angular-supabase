import { test, expect } from '@playwright/test'
import { waitForEmail, extractConfirmationLink, deleteAllMessages } from './fixtures/mailpit'

const email = `journey-${Date.now()}@example.com`
const password = 'TestPass1234'

test.describe.serial('Auth Journey — Signup → Email Confirm → Login → Dashboard', () => {
  test.beforeAll(async () => {
    await deleteAllMessages()
  })

  test('1. Visit home page and click Get Started', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const cta = page.locator('a[href="/auth/signup"]').first()
    await expect(cta).toBeVisible()
    await cta.click()
    await page.waitForURL('**/auth/signup')
  })

  test('2. Sign up — confirmation email arrives in Mailpit', async ({ page }) => {
    await page.goto('/auth/signup')
    await page.waitForLoadState('networkidle')

    await page.fill('input#email', email)
    await page.fill('input#password', password)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    // Should show success message (not error)
    const error = page.locator('.alert-error')
    expect(await error.isVisible()).toBe(false)

    // Email should arrive in Mailpit
    const message = await waitForEmail(email, { subject: 'Confirm', timeout: 10000 })
    expect(message).toBeDefined()
    expect(message.Subject).toContain('Confirm')
    expect(message.To[0].Address).toBe(email)
  })

  test('3. Confirm email via Mailpit link', async ({ page }) => {
    const message = await waitForEmail(email, { subject: 'Confirm' })
    const confirmLink = extractConfirmationLink(message)
    expect(confirmLink).toBeTruthy()

    // Navigate to confirmation link — Supabase confirms and redirects to site_url
    await page.goto(confirmLink!)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // User should be authenticated (Sign Out button visible in navbar)
    await expect(page.locator('button:has-text("Sign Out"), a:has-text("Sign Out")')).toBeVisible({
      timeout: 5000,
    })
  })

  test('4. Login with confirmed account', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')

    await page.fill('input#email', email)
    await page.fill('input#password', password)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 })
  })

  test('5. Dashboard is accessible when logged in', async ({ page }) => {
    // Login first (fresh browser context)
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    await page.fill('input#email', email)
    await page.fill('input#password', password)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 })

    expect(page.url()).toContain('/dashboard')
  })

  test('6. Auth guard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/auth/login')
  })
})
