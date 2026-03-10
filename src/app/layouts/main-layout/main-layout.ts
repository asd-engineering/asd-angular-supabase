import { Component, inject } from '@angular/core'
import { RouterOutlet, RouterLink } from '@angular/router'
import { AuthService } from '@core/services/auth.service'

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="min-h-screen flex flex-col bg-base-100">
      <header class="navbar navbar-blur sticky top-0 z-50 border-b border-base-300">
        <div class="flex-1">
          <a routerLink="/" class="btn btn-ghost text-xl font-heading">
            <span class="asd-letter">ASD</span> Angular
          </a>
        </div>
        <div class="flex-none gap-2">
          <a routerLink="/pricing" class="btn btn-ghost btn-sm">Pricing</a>
          @if (auth.isAuthenticated()) {
            <a routerLink="/dashboard" class="btn btn-ghost btn-sm">Dashboard</a>
            <button class="btn btn-outline btn-sm" (click)="auth.signOut()">Sign Out</button>
          } @else {
            <a routerLink="/auth/login" class="btn btn-primary btn-sm">Sign In</a>
          }
        </div>
      </header>
      <main class="flex-1">
        <router-outlet />
      </main>
      <footer
        class="footer footer-center p-4 bg-base-200 text-base-content border-t border-base-300"
      >
        <p class="text-muted text-sm">
          Built with <span class="asd-letter font-semibold">ASD</span> Platform
        </p>
      </footer>
    </div>
  `,
})
export class MainLayout {
  protected readonly auth = inject(AuthService)
}
