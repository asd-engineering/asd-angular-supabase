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
    const mollieApiKey = Deno.env.get('MOLLIE_API_KEY')
    if (!mollieApiKey) {
      console.error('MOLLIE_API_KEY is not configured')
      return new Response(JSON.stringify({ error: 'MOLLIE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

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

    const { amount, description, redirectUrl, webhookUrl } = await req.json()
    if (!amount || !redirectUrl) {
      return new Response(JSON.stringify({ error: 'amount and redirectUrl are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ user_id: user.id, amount, description: description || 'Payment' })
      .select()
      .single()

    if (orderError) {
      return new Response(JSON.stringify({ error: orderError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create Mollie payment
    const mollieClient = createMollieClient({ apiKey: mollieApiKey })
    const payment = await mollieClient.payments.create({
      amount: { currency: 'EUR', value: Number(amount).toFixed(2) },
      description: description || 'Payment',
      redirectUrl,
      webhookUrl:
        webhookUrl ||
        Deno.env.get('MOLLIE_WEBHOOK_URL') ||
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/mollie-webhook`,
      metadata: { orderId: order.id },
    })

    // Update order with Mollie payment ID
    await supabase.from('orders').update({ mollie_payment_id: payment.id }).eq('id', order.id)

    return new Response(
      JSON.stringify({ checkoutUrl: payment.getCheckoutUrl(), orderId: order.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('create-payment error:', (error as Error).message)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
