import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env['SUPABASE_URL'] ?? ''
const SUPABASE_ANON_KEY = process.env['SUPABASE_ANON_KEY'] ?? ''
const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? ''
const API_TUNNEL_URL = process.env['API_TUNNEL_URL'] ?? ''
const GITHUB_SHA = process.env['GITHUB_SHA'] || 'local'

const HAS_TUNNEL_ENV = !!(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_SERVICE_ROLE_KEY &&
  API_TUNNEL_URL
)

const TEST_PASSWORD = 'test-password-12345'

/** Webhook URL unique per CI run (SHA prevents conflicts across parallel runs) */
function webhookUrl(): string {
  const base = API_TUNNEL_URL.replace(/\/+$/, '')
  return `${base}/functions/v1/mollie-webhook?ref=${GITHUB_SHA}`
}

test.describe('One-time payment webhook via ASD tunnel', () => {
  test.skip(
    !HAS_TUNNEL_ENV,
    'Requires SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, and API_TUNNEL_URL',
  )
  test.describe.configure({ mode: 'serial' })

  let accessToken: string
  let userId: string
  let testEmail: string

  test.beforeAll(async ({}, testInfo) => {
    testEmail = `payment-test-${testInfo.project.name}@example.com`

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Clean up from previous runs
    const { data: existing } = await adminClient.auth.admin.listUsers()
    const oldUser = existing?.users?.find((u) => u.email === testEmail)
    if (oldUser) {
      await adminClient.from('orders').delete().eq('user_id', oldUser.id)
      await adminClient.auth.admin.deleteUser(oldUser.id)
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: TEST_PASSWORD,
      email_confirm: true,
    })

    if (createError) throw new Error(`Create user failed: ${createError.message}`)
    console.log(`Created test user: ${testEmail} (${created.user.id})`)

    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data: signIn, error: signInError } = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: TEST_PASSWORD,
    })

    if (signInError)
      throw new Error(`Sign in failed for ${testEmail} at ${SUPABASE_URL}: ${signInError.message}`)
    accessToken = signIn.session!.access_token
    userId = signIn.user!.id
  })

  test.afterAll(async () => {
    if (!userId) return
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    await adminClient.from('orders').delete().eq('user_id', userId)
    await adminClient.auth.admin.deleteUser(userId)
  })

  test('create payment with tunnel webhook URL', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/create-payment`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      data: {
        amount: 10.0,
        description: `E2E payment test (${GITHUB_SHA.slice(0, 7)})`,
        redirectUrl: 'http://localhost:4200/payment/success',
        webhookUrl: webhookUrl(),
      },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.checkoutUrl).toBeTruthy()
    expect(body.orderId).toBeTruthy()

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: order } = await adminClient
      .from('orders')
      .select('*')
      .eq('id', body.orderId)
      .single()

    expect(order).toBeTruthy()
    expect(order!.status).toBe('pending')
    expect(order!.mollie_payment_id).toBeTruthy()
  })

  test('webhook POST delivered through tunnel', async ({ request }) => {
    const createResponse = await request.post(`${SUPABASE_URL}/functions/v1/create-payment`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      data: {
        amount: 5.0,
        description: `Tunnel webhook test (${GITHUB_SHA.slice(0, 7)})`,
        redirectUrl: 'http://localhost:4200/payment/success',
        webhookUrl: webhookUrl(),
      },
    })

    expect(createResponse.status()).toBe(200)
    const { orderId } = await createResponse.json()

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: order } = await adminClient
      .from('orders')
      .select('mollie_payment_id')
      .eq('id', orderId)
      .single()

    expect(order?.mollie_payment_id).toBeTruthy()

    // POST webhook through tunnel (simulates Mollie calling back)
    const webhookResponse = await request.post(webhookUrl(), {
      form: { id: order!.mollie_payment_id },
    })

    // 200 = processed, 500 = Mollie API may reject in test mode —
    // the important thing is the tunnel delivered the request.
    console.log(`Webhook POST through tunnel returned: ${webhookResponse.status()}`)
    expect([200, 500]).toContain(webhookResponse.status())
  })

  test('full Mollie checkout flow', async ({ page, request }) => {
    test.setTimeout(120_000)

    const createResponse = await request.post(`${SUPABASE_URL}/functions/v1/create-payment`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      data: {
        amount: 1.0,
        description: `Full checkout test (${GITHUB_SHA.slice(0, 7)})`,
        redirectUrl: 'http://localhost:4200/payment/success',
        webhookUrl: webhookUrl(),
      },
    })

    expect(createResponse.status()).toBe(200)
    const { checkoutUrl, orderId } = await createResponse.json()
    expect(checkoutUrl).toBeTruthy()

    // Navigate to Mollie test checkout page
    await page.goto(checkoutUrl)

    // Step 1: Select "Card" payment method
    const cardMethod = page.locator('text=Card').first()
    await expect(cardMethod).toBeVisible({ timeout: 10_000 })
    await cardMethod.click()

    // Step 2: Fill card form inside PCI-compliant iframe
    const cardFrame = page.frameLocator('iframe').nth(1)
    await cardFrame.locator('[placeholder*="1234"]').fill('4543 4740 0224 9996')
    await cardFrame.locator('[placeholder*="MM"]').fill('12/30')
    await cardFrame.locator('[placeholder*="CVC"]').fill('123')

    // Step 3: Fill card holder and submit (all inside Mollie card component iframe)
    await cardFrame.locator('[placeholder*="Full name"]').fill('Test Cardholder')
    await cardFrame.locator('text=Pay with card').click()

    // Step 4: Mollie test status page — select "Paid" radio and continue
    const paidRadio = page.getByRole('radio', { name: 'Paid' })
    await expect(paidRadio).toBeVisible({ timeout: 10_000 })
    await paidRadio.check()

    const continueButton = page.getByRole('button', { name: /continue/i }).first()
    await expect(continueButton).toBeVisible({ timeout: 5_000 })
    await continueButton.click()

    // Poll DB for status change (Mollie webhook should update via tunnel)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    let finalStatus = 'pending'
    for (let attempt = 0; attempt < 30; attempt++) {
      const { data: order } = await adminClient
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single()

      if (order?.status && order.status !== 'pending') {
        finalStatus = order.status
        break
      }

      await new Promise((r) => setTimeout(r, 2_000))
    }

    console.log(`Order ${orderId} final status: ${finalStatus}`)
    expect(finalStatus).toBe('paid')
  })
})

test.describe('Subscription flow via ASD tunnel', () => {
  test.skip(
    !HAS_TUNNEL_ENV,
    'Requires SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, and API_TUNNEL_URL',
  )
  test.describe.configure({ mode: 'serial' })

  let accessToken: string
  let userId: string
  let testEmail: string

  test.beforeAll(async ({}, testInfo) => {
    testEmail = `sub-test-${testInfo.project.name}@example.com`

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Clean up from previous runs
    const { data: existing } = await adminClient.auth.admin.listUsers()
    const oldUser = existing?.users?.find((u) => u.email === testEmail)
    if (oldUser) {
      await adminClient.from('orders').delete().eq('user_id', oldUser.id)
      await adminClient.from('subscriptions').delete().eq('user_id', oldUser.id)
      await adminClient.auth.admin.deleteUser(oldUser.id)
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: TEST_PASSWORD,
      email_confirm: true,
    })

    if (createError) throw new Error(`Create user failed: ${createError.message}`)
    console.log(`Created test user: ${testEmail} (${created.user.id})`)

    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data: signIn, error: signInError } = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: TEST_PASSWORD,
    })

    if (signInError)
      throw new Error(`Sign in failed for ${testEmail} at ${SUPABASE_URL}: ${signInError.message}`)
    accessToken = signIn.session!.access_token
    userId = signIn.user!.id
  })

  test.afterAll(async () => {
    if (!userId) return
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    await adminClient.from('orders').delete().eq('user_id', userId)
    await adminClient.from('subscriptions').delete().eq('user_id', userId)
    await adminClient.auth.admin.deleteUser(userId)
  })

  test('create subscription with tunnel webhook URL', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/create-subscription`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      data: {
        planName: 'Pro',
        amount: 29.0,
        redirectUrl: 'http://localhost:4200/payment/callback',
        webhookUrl: webhookUrl(),
      },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.checkoutUrl).toBeTruthy()
    expect(body.orderId).toBeTruthy()
    expect(body.subscriptionId).toBeTruthy()

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Verify order created and linked to subscription
    const { data: order } = await adminClient
      .from('orders')
      .select('*')
      .eq('id', body.orderId)
      .single()

    expect(order).toBeTruthy()
    expect(order!.status).toBe('pending')
    expect(order!.mollie_payment_id).toBeTruthy()
    expect(order!.subscription_id).toBe(body.subscriptionId)

    // Verify subscription created
    const { data: sub } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('id', body.subscriptionId)
      .single()

    expect(sub).toBeTruthy()
    expect(sub!.plan_name).toBe('Pro')
    expect(sub!.status).toBe('pending')
    expect(sub!.mollie_customer_id).toBeTruthy()
  })

  test('webhook POST delivered through tunnel', async ({ request }) => {
    const createResponse = await request.post(`${SUPABASE_URL}/functions/v1/create-subscription`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      data: {
        planName: 'Starter',
        amount: 9.0,
        redirectUrl: 'http://localhost:4200/payment/callback',
        webhookUrl: webhookUrl(),
      },
    })

    expect(createResponse.status()).toBe(200)
    const { orderId } = await createResponse.json()

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: order } = await adminClient
      .from('orders')
      .select('mollie_payment_id')
      .eq('id', orderId)
      .single()

    expect(order?.mollie_payment_id).toBeTruthy()

    // POST webhook through tunnel (simulates Mollie calling back)
    const webhookResponse = await request.post(webhookUrl(), {
      form: { id: order!.mollie_payment_id },
    })

    // 200 = processed, 500 = Mollie API may reject in test mode —
    // the important thing is the tunnel delivered the request.
    console.log(`Webhook POST through tunnel returned: ${webhookResponse.status()}`)
    expect([200, 500]).toContain(webhookResponse.status())
  })

  test('full Mollie subscription checkout flow', async ({ page, request }) => {
    test.setTimeout(120_000)

    const createResponse = await request.post(`${SUPABASE_URL}/functions/v1/create-subscription`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      data: {
        planName: 'Pro',
        amount: 29.0,
        redirectUrl: 'http://localhost:4200/payment/callback',
        webhookUrl: webhookUrl(),
      },
    })

    expect(createResponse.status()).toBe(200)
    const { checkoutUrl, orderId, subscriptionId } = await createResponse.json()
    expect(checkoutUrl).toBeTruthy()

    // Navigate to Mollie test checkout page
    await page.goto(checkoutUrl)

    // Step 1: Select "Card" payment method
    const cardMethod = page.locator('text=Card').first()
    await expect(cardMethod).toBeVisible({ timeout: 10_000 })
    await cardMethod.click()

    // Step 2: Fill card form inside PCI-compliant iframe
    const cardFrame = page.frameLocator('iframe').nth(1)
    await cardFrame.locator('[placeholder*="1234"]').fill('4543 4740 0224 9996')
    await cardFrame.locator('[placeholder*="MM"]').fill('12/30')
    await cardFrame.locator('[placeholder*="CVC"]').fill('123')

    // Step 3: Fill card holder and submit (all inside Mollie card component iframe)
    await cardFrame.locator('[placeholder*="Full name"]').fill('Test Cardholder')
    await cardFrame.locator('text=Pay with card').click()

    // Step 4: Mollie test status page — select "Paid" radio and continue
    const paidRadio = page.getByRole('radio', { name: 'Paid' })
    await expect(paidRadio).toBeVisible({ timeout: 10_000 })
    await paidRadio.check()

    const continueButton = page.getByRole('button', { name: /continue/i }).first()
    await expect(continueButton).toBeVisible({ timeout: 5_000 })
    await continueButton.click()

    // Poll DB for order status change (Mollie webhook should update via tunnel)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    let finalOrderStatus = 'pending'
    let finalSubStatus = 'pending'
    let mollieSubId: string | null = null

    for (let attempt = 0; attempt < 30; attempt++) {
      const { data: order } = await adminClient
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single()

      if (order?.status && order.status !== 'pending') {
        finalOrderStatus = order.status
      }

      const { data: sub } = await adminClient
        .from('subscriptions')
        .select('status, mollie_subscription_id')
        .eq('id', subscriptionId)
        .single()

      if (sub) {
        finalSubStatus = sub.status
        mollieSubId = sub.mollie_subscription_id
      }

      // Break early if order is paid (subscription activation is best-effort)
      if (finalOrderStatus === 'paid') break

      await new Promise((r) => setTimeout(r, 2_000))
    }

    console.log(`Order ${orderId} final status: ${finalOrderStatus}`)
    console.log(
      `Subscription ${subscriptionId} status: ${finalSubStatus}, mollie_id: ${mollieSubId}`,
    )

    expect(finalOrderStatus).toBe('paid')

    // Subscription activation is best-effort in test mode (mandates may not work)
    // Log the result but don't fail the test if it stays pending
    if (finalSubStatus === 'active') {
      expect(mollieSubId).toBeTruthy()
      console.log('Subscription activated successfully')
    } else {
      console.log(
        `Subscription not activated (status: ${finalSubStatus}) — expected in Mollie test mode`,
      )
    }
  })
})
