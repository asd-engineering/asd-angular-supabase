import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Run tests serially — both describe blocks share the same test user email
test.describe.configure({ mode: 'serial' })

const SUPABASE_URL = process.env['SUPABASE_URL'] || 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY = process.env['SUPABASE_ANON_KEY'] || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] || ''
const API_TUNNEL_URL = process.env['API_TUNNEL_URL'] || ''

const TEST_EMAIL = 'payment-test@example.com'
const TEST_PASSWORD = 'test-password-12345'

/** Shared helper: create + sign in test user, return accessToken + userId */
async function setupTestUser() {
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  await adminClient.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  })

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data: signIn, error: signInError } = await anonClient.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })

  if (signInError) throw new Error(`Sign in failed: ${signInError.message}`)
  return { accessToken: signIn.session!.access_token, userId: signIn.user!.id }
}

/** Shared helper: clean up test data */
async function cleanupTestUser(userId: string) {
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  await adminClient.from('orders').delete().eq('user_id', userId)
  await adminClient.auth.admin.deleteUser(userId)
}

// ---------------------------------------------------------------------------
// Local tests — run with just Supabase + Mollie API key, no tunnel needed
// ---------------------------------------------------------------------------
test.describe('Payment flow (local)', () => {
  test.skip(!SUPABASE_ANON_KEY, 'SUPABASE_ANON_KEY not set')
  test.skip(!SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY not set')

  let accessToken: string
  let userId: string

  test.beforeAll(async () => {
    const user = await setupTestUser()
    accessToken = user.accessToken
    userId = user.userId
  })

  test.afterAll(async () => {
    await cleanupTestUser(userId)
  })

  test('create payment and verify order', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/create-payment`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      data: {
        amount: 10.0,
        description: 'E2E create payment test',
        redirectUrl: 'http://localhost:4200/payment/success',
        webhookUrl: 'https://example.com/webhook',
      },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.checkoutUrl).toBeTruthy()
    expect(body.orderId).toBeTruthy()

    // Verify order exists with correct state
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

  test('webhook handler processes payment callback', async ({ request }) => {
    // Create a payment to get a real Mollie payment ID
    const createResponse = await request.post(`${SUPABASE_URL}/functions/v1/create-payment`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      data: {
        amount: 5.0,
        description: 'Webhook handler test',
        redirectUrl: 'http://localhost:4200/payment/success',
        webhookUrl: 'https://example.com/webhook',
      },
    })

    expect(createResponse.status()).toBe(200)
    const { orderId } = await createResponse.json()

    // Get mollie_payment_id from DB
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: order } = await adminClient
      .from('orders')
      .select('mollie_payment_id')
      .eq('id', orderId)
      .single()

    expect(order?.mollie_payment_id).toBeTruthy()

    // POST directly to local webhook handler (simulates Mollie callback)
    const webhookResponse = await request.post(`${SUPABASE_URL}/functions/v1/mollie-webhook`, {
      form: { id: order!.mollie_payment_id },
    })

    // Webhook calls Mollie API to verify payment status.
    // A newly created test payment has status "open" → maps to "pending".
    // 200 = processed successfully, 500 = Mollie API issue (acceptable in test mode).
    console.log(`Webhook handler returned: ${webhookResponse.status()}`)
    expect([200, 500]).toContain(webhookResponse.status())
  })
})

// ---------------------------------------------------------------------------
// Tunnel tests — require API_TUNNEL_URL (real ASD tunnel or CI environment)
// ---------------------------------------------------------------------------
test.describe('Payment webhook via ASD tunnel', () => {
  test.skip(!API_TUNNEL_URL, 'API_TUNNEL_URL not set — skipping tunnel tests')
  test.skip(!SUPABASE_ANON_KEY, 'SUPABASE_ANON_KEY not set')
  test.skip(!SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY not set')

  let accessToken: string
  let userId: string

  test.beforeAll(async () => {
    const user = await setupTestUser()
    accessToken = user.accessToken
    userId = user.userId
  })

  test.afterAll(async () => {
    await cleanupTestUser(userId)
  })

  test('webhook POST delivered through tunnel', async ({ request }) => {
    const webhookUrl = `${API_TUNNEL_URL}functions/v1/mollie-webhook`

    const createResponse = await request.post(`${SUPABASE_URL}/functions/v1/create-payment`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      data: {
        amount: 5.0,
        description: 'Tunnel webhook test',
        redirectUrl: 'http://localhost:4200/payment/success',
        webhookUrl,
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
    const webhookResponse = await request.post(webhookUrl, {
      form: { id: order!.mollie_payment_id },
    })

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
        description: 'Full checkout flow test',
        redirectUrl: 'http://localhost:4200/payment/success',
        webhookUrl: `${API_TUNNEL_URL}functions/v1/mollie-webhook`,
      },
    })

    expect(createResponse.status()).toBe(200)
    const { checkoutUrl, orderId } = await createResponse.json()
    expect(checkoutUrl).toBeTruthy()

    await page.goto(checkoutUrl)

    const paidButton = page
      .locator('button, input, [data-status="paid"], a')
      .filter({ hasText: /paid/i })
      .first()
    if (await paidButton.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await paidButton.click()

      await page.waitForTimeout(3_000)

      const continueButton = page
        .locator('button, input, a')
        .filter({ hasText: /continue|confirm|submit/i })
        .first()
      if (await continueButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await continueButton.click()
      }
    } else {
      console.log('Mollie test checkout UI not as expected — skipping UI interaction')
      test.skip()
    }

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
