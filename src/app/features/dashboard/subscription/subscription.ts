import { Component, inject, signal, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { DatePipe, CurrencyPipe } from '@angular/common'
import { PaymentService, Subscription as SubscriptionModel } from '@core/services/payment.service'

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [RouterLink, DatePipe, CurrencyPipe],
  template: `
    <div class="max-w-2xl">
      <h2 class="text-2xl font-bold font-heading mb-6">Subscription</h2>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      } @else if (subscription()) {
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between mb-4">
              <h3 class="card-title">{{ subscription()!.plan_name }} Plan</h3>
              <span
                class="badge"
                [class.badge-success]="subscription()!.status === 'active'"
                [class.badge-warning]="subscription()!.status === 'pending'"
                [class.badge-error]="
                  subscription()!.status === 'canceled' || subscription()!.status === 'suspended'
                "
              >
                {{ subscription()!.status }}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-muted">Amount</span>
                <div class="font-semibold">
                  {{ subscription()!.amount | currency: subscription()!.currency }}
                  / {{ subscription()!.interval }}
                </div>
              </div>
              <div>
                <span class="text-muted">Started</span>
                <div class="font-semibold">
                  {{ subscription()!.created_at | date: 'mediumDate' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body items-center text-center">
            <p class="text-muted mb-4">You don't have an active subscription.</p>
            <a routerLink="/pricing" class="btn btn-primary">View Plans</a>
          </div>
        </div>
      }

      @if (error()) {
        <div class="alert alert-error mt-4">{{ error() }}</div>
      }
    </div>
  `,
})
export class Subscription implements OnInit {
  private readonly payment = inject(PaymentService)

  protected readonly loading = signal(true)
  protected readonly subscription = signal<SubscriptionModel | null>(null)
  protected readonly error = signal<string | null>(null)

  async ngOnInit() {
    try {
      const sub = await this.payment.getActiveSubscription()
      this.subscription.set(sub)
    } catch (e) {
      this.error.set((e as Error).message)
    } finally {
      this.loading.set(false)
    }
  }
}
