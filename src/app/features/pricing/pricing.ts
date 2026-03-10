import { Component, inject, signal } from '@angular/core'
import { Router } from '@angular/router'
import { PaymentService } from '@core/services/payment.service'
import { AuthService } from '@core/services/auth.service'

interface Plan {
  name: string
  price: number
  description: string
  features: string[]
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  template: `
    <div class="container mx-auto p-6 max-w-5xl">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold font-heading mb-4">Pricing</h1>
        <p class="text-lg text-muted">Choose the plan that fits your needs</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        @for (plan of plans; track plan.name) {
          <div class="card bg-base-200 shadow-xl">
            <div class="card-body items-center text-center">
              <h2 class="card-title text-2xl font-heading">{{ plan.name }}</h2>
              <p class="text-muted">{{ plan.description }}</p>
              <div class="my-4">
                <span class="text-4xl font-bold">&euro;{{ plan.price }}</span>
                <span class="text-muted">/month</span>
              </div>
              <ul class="text-left w-full space-y-2 mb-6">
                @for (feature of plan.features; track feature) {
                  <li class="flex items-center gap-2">
                    <span class="text-success">&#10003;</span>
                    {{ feature }}
                  </li>
                }
              </ul>
              <div class="card-actions w-full">
                <button class="btn btn-primary w-full" [disabled]="loading()" (click)="buy(plan)">
                  @if (loading()) {
                    <span class="loading loading-spinner loading-sm"></span>
                  } @else {
                    Get Started
                  }
                </button>
              </div>
            </div>
          </div>
        }
      </div>

      @if (error()) {
        <div class="alert alert-error mt-8">{{ error() }}</div>
      }
    </div>
  `,
})
export class Pricing {
  private readonly payment = inject(PaymentService)
  private readonly auth = inject(AuthService)
  private readonly router = inject(Router)

  protected readonly loading = signal(false)
  protected readonly error = signal<string | null>(null)

  protected readonly plans: Plan[] = [
    {
      name: 'Starter',
      price: 9,
      description: 'For individuals getting started',
      features: ['1 project', '1 GB storage', 'Community support', 'Basic analytics'],
    },
    {
      name: 'Pro',
      price: 29,
      description: 'For growing teams',
      features: ['10 projects', '10 GB storage', 'Priority support', 'Advanced analytics'],
    },
    {
      name: 'Enterprise',
      price: 99,
      description: 'For large organizations',
      features: [
        'Unlimited projects',
        '100 GB storage',
        'Dedicated support',
        'Custom integrations',
      ],
    },
  ]

  async buy(plan: Plan) {
    if (!this.auth.isAuthenticated()) {
      await this.router.navigate(['/auth/login'])
      return
    }

    this.loading.set(true)
    this.error.set(null)

    try {
      const { checkoutUrl } = await this.payment.createPayment(
        plan.price,
        `${plan.name} Plan`,
        `${window.location.origin}/payment/callback`,
      )
      window.location.href = checkoutUrl
    } catch (e) {
      this.error.set((e as Error).message || 'Payment failed. Please try again.')
    } finally {
      this.loading.set(false)
    }
  }
}
