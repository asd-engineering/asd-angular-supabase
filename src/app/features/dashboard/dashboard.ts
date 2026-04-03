import { Component, inject } from '@angular/core'
import { RouterLink, RouterOutlet } from '@angular/router'
import { AuthService } from '@core/services/auth.service'

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <div class="container mx-auto p-6 max-w-6xl">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold font-heading">Dashboard</h1>
        <div class="flex gap-2">
          <a routerLink="/dashboard/orders" class="btn btn-ghost btn-sm">Orders</a>
          <a routerLink="/dashboard/settings" class="btn btn-ghost btn-sm">Settings</a>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="stat-card">
          <div class="text-sm text-muted mb-1">User</div>
          <div class="text-lg font-semibold truncate">{{ auth.user()?.email }}</div>
        </div>
        <div class="stat-card stat-card--info">
          <div class="text-sm text-muted mb-1">Status</div>
          <div class="text-lg font-semibold">Authenticated</div>
        </div>
        <div class="stat-card stat-card--success">
          <div class="text-sm text-muted mb-1">Platform</div>
          <div class="text-lg font-semibold">ASD Angular</div>
        </div>
      </div>
      <router-outlet />
    </div>
  `,
})
export class Dashboard {
  protected readonly auth = inject(AuthService)
}
