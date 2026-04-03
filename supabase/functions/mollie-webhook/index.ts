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

    await supabase
      .from('orders')
      .update({ status: orderStatus, updated_at: new Date().toISOString() })
      .eq('mollie_payment_id', paymentId)

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', (error as Error).message)
    return new Response('Internal error', { status: 500 })
  }
})
