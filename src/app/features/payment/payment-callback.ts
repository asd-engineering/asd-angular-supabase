import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-payment-callback',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container mx-auto p-6 max-w-lg text-center">
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body items-center">
          <h1 class="card-title text-2xl font-heading mb-4">Subscription Started</h1>
          <p class="text-muted mb-6">
            Your subscription is being activated. Monthly billing will begin after your first
            payment is confirmed.
          </p>
          <div class="flex gap-4">
            <a routerLink="/dashboard/subscription" class="btn btn-primary">View Subscription</a>
            <a routerLink="/" class="btn btn-ghost">Back to Home</a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PaymentCallback {}
