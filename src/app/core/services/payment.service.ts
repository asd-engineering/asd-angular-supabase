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
}
