import { Component, inject, signal } from '@angular/core'
import { RouterOutlet, RouterLink } from '@angular/router'
import { AuthService } from '@core/services/auth.service'

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="min-h-screen flex flex-col bg-base-100">
      <!-- Navbar -->
      <header class="navbar navbar-blur sticky top-0 z-50 border-b border-base-300">
        <div class="flex-1">
          <a routerLink="/" class="btn btn-ghost text-xl font-heading">
            <span class="asd-letter">ASD</span> Angular
          </a>
        </div>
        <!-- Desktop nav -->
        <div class="flex-none gap-2 hidden md:flex">
          <a href="/#features" class="btn btn-ghost btn-sm">Features</a>
          <a href="/#devinci" class="btn btn-ghost btn-sm">DeVinCI</a>
          <a routerLink="/pricing" class="btn btn-ghost btn-sm">Pricing</a>
          @if (auth.isAuthenticated()) {
            <a routerLink="/dashboard" class="btn btn-ghost btn-sm">Dashboard</a>
            <button class="btn btn-outline btn-sm" (click)="auth.signOut()">Sign Out</button>
          } @else {
            <a routerLink="/auth/login" class="btn btn-primary btn-sm">Sign In</a>
          }
        </div>
        <!-- Mobile hamburger -->
        <div class="flex-none md:hidden">
          <button class="btn btn-ghost btn-square" (click)="mobileMenuOpen.set(!mobileMenuOpen())">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              @if (mobileMenuOpen()) {
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              } @else {
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              }
            </svg>
          </button>
        </div>
      </header>

      <!-- Mobile menu -->
      @if (mobileMenuOpen()) {
        <div class="md:hidden bg-base-200 border-b border-base-300 px-4 py-3 space-y-2">
          <a
            href="/#features"
            class="btn btn-ghost btn-sm btn-block justify-start"
            (click)="mobileMenuOpen.set(false)"
            >Features</a
          >
          <a
            href="/#devinci"
            class="btn btn-ghost btn-sm btn-block justify-start"
            (click)="mobileMenuOpen.set(false)"
            >DeVinCI</a
          >
          <a
            routerLink="/pricing"
            class="btn btn-ghost btn-sm btn-block justify-start"
            (click)="mobileMenuOpen.set(false)"
            >Pricing</a
          >
          @if (auth.isAuthenticated()) {
            <a
              routerLink="/dashboard"
              class="btn btn-ghost btn-sm btn-block justify-start"
              (click)="mobileMenuOpen.set(false)"
              >Dashboard</a
            >
            <button
              class="btn btn-outline btn-sm btn-block"
              (click)="auth.signOut(); mobileMenuOpen.set(false)"
            >
              Sign Out
            </button>
          } @else {
            <a
              routerLink="/auth/login"
              class="btn btn-primary btn-sm btn-block"
              (click)="mobileMenuOpen.set(false)"
              >Sign In</a
            >
          }
        </div>
      }

      <main class="flex-1">
        <router-outlet />
      </main>

      <!-- Footer -->
      <footer class="bg-base-200 border-t border-base-300">
        <div class="max-w-6xl mx-auto px-4 py-12">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- Brand column -->
            <div>
              <p class="font-heading font-bold text-lg mb-2">
                <span class="asd-letter">ASD</span> Platform
              </p>
              <p class="text-sm text-muted">Accelerated Software Development</p>
              <p class="text-sm text-muted mt-2">Your code. Any machine. Instant access.</p>
            </div>
            <!-- Product column -->
            <div>
              <h4 class="font-heading font-semibold text-sm mb-3 uppercase tracking-wider">
                Product
              </h4>
              <ul class="space-y-2 text-sm">
                <li><a routerLink="/pricing" class="text-muted hover:text-primary">Pricing</a></li>
                <li>
                  <a routerLink="/dashboard" class="text-muted hover:text-primary">Dashboard</a>
                </li>
                <li>
                  <a
                    href="https://github.com/asd-engineering/asd-angular-supabase/actions/workflows/devinci.yml"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-muted hover:text-primary"
                    >DeVinCI</a
                  >
                </li>
              </ul>
            </div>
            <!-- Resources column -->
            <div>
              <h4 class="font-heading font-semibold text-sm mb-3 uppercase tracking-wider">
                Resources
              </h4>
              <ul class="space-y-2 text-sm">
                <li>
                  <a
                    href="https://github.com/asd-engineering/asd-angular-supabase"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-muted hover:text-primary"
                    >GitHub</a
                  >
                </li>
                <li>
                  <a
                    href="https://asd.host"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-muted hover:text-primary"
                    >Documentation</a
                  >
                </li>
              </ul>
              <p class="mt-4 text-sm">
                Powered by
                <a
                  href="https://asd.host"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="asd-letter font-semibold hover:underline"
                  >asd.host</a
                >
              </p>
            </div>
          </div>
        </div>
        <!-- Bottom bar -->
        <div class="border-t border-base-300 px-4 py-4">
          <div
            class="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-muted"
          >
            <p>&copy; 2026 <span class="asd-letter">ASD</span> Platform. All rights reserved.</p>
            <p>
              Built with <span class="asd-letter font-semibold">ASD</span> &middot;
              <a
                href="https://asd.host"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-primary"
                >asd.host</a
              >
            </p>
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class MainLayout {
  protected readonly auth = inject(AuthService)
  protected readonly mobileMenuOpen = signal(false)
}
