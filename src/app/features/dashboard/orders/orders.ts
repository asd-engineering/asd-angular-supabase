import { Component, inject, signal, OnInit } from '@angular/core'
import { DatePipe, CurrencyPipe } from '@angular/common'
import { PaymentService, Order } from '@core/services/payment.service'

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [DatePipe, CurrencyPipe],
  template: `
    <div>
      <h2 class="text-2xl font-bold font-heading mb-6">Order History</h2>

      @if (loading()) {
        <div class="flex justify-center p-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      } @else if (orders().length === 0) {
        <div class="text-center p-8 text-muted">
          <p>No orders yet.</p>
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (order of orders(); track order.id) {
                <tr>
                  <td>{{ order.created_at | date: 'short' }}</td>
                  <td>{{ order.description }}</td>
                  <td>{{ order.amount | currency: order.currency }}</td>
                  <td>
                    <span class="badge" [class]="statusClass(order.status)">
                      {{ order.status }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (error()) {
        <div class="alert alert-error mt-4">{{ error() }}</div>
      }
    </div>
  `,
})
export class Orders implements OnInit {
  private readonly payment = inject(PaymentService)

  protected readonly orders = signal<Order[]>([])
  protected readonly loading = signal(true)
  protected readonly error = signal<string | null>(null)

  async ngOnInit() {
    try {
      const orders = await this.payment.getOrders()
      this.orders.set(orders)
    } catch (e) {
      this.error.set((e as Error).message)
    } finally {
      this.loading.set(false)
    }
  }

  statusClass(status: string): string {
    const classes: Record<string, string> = {
      paid: 'badge-success',
      pending: 'badge-warning',
      failed: 'badge-error',
      expired: 'badge-ghost',
    }
    return classes[status] || 'badge-ghost'
  }
}
