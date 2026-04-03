import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createMollieClient } from 'https://esm.sh/@mollie/api-client@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { planName, amount, redirectUrl, webhookUrl } = await req.json()
    if (!planName || !amount || !redirectUrl) {
      return new Response(
        JSON.stringify({ error: 'planName, amount, and redirectUrl are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const mollieClient = createMollieClient({ apiKey: Deno.env.get('MOLLIE_API_KEY')! })

    // Create or reuse Mollie customer
    const customer = await mollieClient.customers.create({
      name: user.email!,
      email: user.email!,
    })

    // Insert subscription record
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        mollie_customer_id: customer.id,
        plan_name: planName,
        amount,
        status: 'pending',
      })
      .select()
      .single()

    if (subError) {
      return new Response(JSON.stringify({ error: subError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create "first" payment to establish mandate
    const resolvedWebhookUrl =
      webhookUrl ||
      Deno.env.get('MOLLIE_WEBHOOK_URL') ||
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/mollie-webhook`

    const payment = await mollieClient.payments.create({
      amount: { currency: 'EUR', value: Number(amount).toFixed(2) },
      description: `${planName} Plan - first payment`,
      redirectUrl,
      webhookUrl: resolvedWebhookUrl,
      customerId: customer.id,
      sequenceType: 'first',
      metadata: {
        subscriptionId: subscription.id,
        planName,
        type: 'first',
      },
    })

    // Insert order linked to subscription
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        mollie_payment_id: payment.id,
        amount,
        description: `${planName} Plan - first payment`,
        subscription_id: subscription.id,
      })
      .select()
      .single()

    if (orderError) {
      return new Response(JSON.stringify({ error: orderError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        checkoutUrl: payment.getCheckoutUrl(),
        orderId: order.id,
        subscriptionId: subscription.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
