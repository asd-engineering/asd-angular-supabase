import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createMollieClient } from 'https://esm.sh/@mollie/api-client@4'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const formData = await req.formData()
    const paymentId = formData.get('id') as string

    if (!paymentId) {
      return new Response('Missing payment id', { status: 400 })
    }

    const mollieClient = createMollieClient({ apiKey: Deno.env.get('MOLLIE_API_KEY')! })
    const payment = await mollieClient.payments.get(paymentId)

    const statusMap: Record<string, string> = {
      paid: 'paid',
      failed: 'failed',
      expired: 'expired',
      canceled: 'failed',
    }
    const orderStatus = statusMap[payment.status] || 'pending'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Update the order status
    await supabase
      .from('orders')
      .update({ status: orderStatus, updated_at: new Date().toISOString() })
      .eq('mollie_payment_id', paymentId)

    const metadata = payment.metadata as Record<string, string> | null

    // Handle "first" payment for subscription — activate the Mollie subscription
    if (metadata?.type === 'first' && metadata.subscriptionId && orderStatus === 'paid') {
      const subscriptionId = metadata.subscriptionId

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single()

      if (sub && !sub.mollie_subscription_id) {
        try {
          const mollieSubscription = await mollieClient.customers_subscriptions.create({
            customerId: sub.mollie_customer_id,
            amount: { currency: sub.currency || 'EUR', value: Number(sub.amount).toFixed(2) },
            interval: sub.interval || '1 month',
            description: `${sub.plan_name} Plan - monthly`,
            webhookUrl:
              Deno.env.get('MOLLIE_WEBHOOK_URL') ||
              `${Deno.env.get('SUPABASE_URL')}/functions/v1/mollie-webhook`,
          })

          await supabase
            .from('subscriptions')
            .update({
              mollie_subscription_id: mollieSubscription.id,
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscriptionId)
        } catch (subError) {
          // Subscription creation may fail in test mode (invalid mandate).
          // Log but don't fail the webhook — the order is already updated.
          console.error('Subscription activation failed:', (subError as Error).message)
          await supabase
            .from('subscriptions')
            .update({
              status: 'pending',
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscriptionId)
        }
      }
    }

    // Handle recurring payment (Mollie auto-charges have subscriptionId on the payment)
    if (payment.subscriptionId) {
      // Check idempotency — skip if order with this payment ID already exists
      const { data: existing } = await supabase
        .from('orders')
        .select('id')
        .eq('mollie_payment_id', paymentId)
        .maybeSingle()

      if (!existing) {
        // Look up the subscription by mollie_subscription_id
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('mollie_subscription_id', payment.subscriptionId)
          .single()

        if (sub) {
          await supabase.from('orders').insert({
            user_id: sub.user_id,
            mollie_payment_id: paymentId,
            amount: sub.amount,
            description: `${sub.plan_name} Plan - recurring`,
            status: orderStatus,
            subscription_id: sub.id,
          })
        }
      }
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', (error as Error).message)
    return new Response('Internal error', { status: 500 })
  }
})
