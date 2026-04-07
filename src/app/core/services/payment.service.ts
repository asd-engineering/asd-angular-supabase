import { Injectable, inject } from '@angular/core'
import { SupabaseService } from './supabase.service'

export interface Order {
  id: string
  user_id: string
  mollie_payment_id: string | null
  amount: number
  currency: string
  status: string
  description: string | null
  metadata: Record<string, unknown>
  subscription_id: string | null
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  mollie_customer_id: string
  mollie_subscription_id: string | null
  plan_name: string
  amount: number
  currency: string
  interval: string
  status: string
  created_at: string
  updated_at: string
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly supabase = inject(SupabaseService)

  async createPayment(amount: number, description: string, redirectUrl: string) {
    const { data, error } = await this.supabase.supabase.functions.invoke('create-payment', {
      body: { amount, description, redirectUrl },
    })

    if (error) throw error
    return data as { checkoutUrl: string; orderId: string }
  }

  async createSubscription(planName: string, amount: number, redirectUrl: string) {
    const { data, error } = await this.supabase.supabase.functions.invoke('create-subscription', {
      body: { planName, amount, redirectUrl },
    })

    if (error) throw error
    return data as { checkoutUrl: string; orderId: string; subscriptionId: string }
  }

  async getOrders() {
    const { data, error } = await this.supabase.supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Order[]
  }

  async getOrder(id: string) {
    const { data, error } = await this.supabase.supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Order
  }

  async getSubscriptions() {
    const { data, error } = await this.supabase.supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Subscription[]
  }

  async getActiveSubscription() {
    const { data, error } = await this.supabase.supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data as Subscription | null
  }
}
