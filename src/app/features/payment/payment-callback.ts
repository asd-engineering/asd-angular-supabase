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
          <h1 class="card-title text-2xl font-heading mb-4">Payment Submitted</h1>
          <p class="text-muted mb-6">
            Your payment is being processed. You can check the status in your order history.
          </p>
          <div class="flex gap-4">
            <a routerLink="/dashboard/orders" class="btn btn-primary">View Orders</a>
            <a routerLink="/" class="btn btn-ghost">Back to Home</a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PaymentCallback {}
