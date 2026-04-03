import { Component, signal, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'

interface ExposedService {
  project: string
  id: string
  name: string
  url: string
  port?: number
  pid?: number
  alive?: boolean
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <!-- Section 1: Hero -->
    <section class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div class="max-w-5xl mx-auto text-center">
        <p class="terminal-header mb-6">
          <span class="terminal-text" style="--char-count: 40"
            >Your code. Any machine. Instant access.</span
          >
          <span class="terminal-cursor"></span>
        </p>
        <h1 class="text-4xl md:text-6xl font-bold font-heading mb-6 leading-tight">
          Ship SaaS Apps with
          <span class="asd-letter">ASD</span> Platform
        </h1>
        <p class="text-lg md:text-xl text-muted max-w-3xl mx-auto mb-8">
          Angular + Supabase + Mollie payments + ASD orchestration. One config file. One command.
          Full-stack development with cloud IDE, tunnels, and AI-safe credentials.
        </p>
        <div class="flex gap-4 justify-center flex-wrap mb-12">
          <a routerLink="/auth/signup" class="btn btn-primary btn-lg">Get Started</a>
          <a
            href="https://github.com/asd-engineering/asd-angular-supabase"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-outline btn-lg"
          >
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
              />
            </svg>
            View on GitHub
          </a>
        </div>

        <!-- Faux terminal -->
        <div class="max-w-2xl mx-auto text-left">
          <div class="bg-base-200 rounded-lg border border-base-300 overflow-hidden glow-primary">
            <div class="flex items-center gap-2 px-4 py-2 bg-base-300/50 border-b border-base-300">
              <span class="w-3 h-3 rounded-full bg-error opacity-70"></span>
              <span class="w-3 h-3 rounded-full bg-warning opacity-70"></span>
              <span class="w-3 h-3 rounded-full bg-success opacity-70"></span>
              <span class="text-xs text-muted ml-2 font-mono">terminal</span>
            </div>
            <div class="p-4 font-mono text-sm leading-relaxed">
              <p><span class="text-success">$</span> asd run dev</p>
              <p class="text-muted mt-1">
                <span class="text-info">[supabase]</span> Starting PostgreSQL, Auth, Storage...
              </p>
              <p class="text-muted">
                <span class="text-info">[caddy]</span> Reverse proxy ready on :443
              </p>
              <p class="text-muted">
                <span class="text-info">[network]</span> Routes seeded, tunnels connected
              </p>
              <p class="text-muted"><span class="text-info">[angular]</span> Dev server on :4200</p>
              <p class="text-success mt-1">
                <span class="text-success">[ready]</span> All services running
                <span class="hero-cursor">_</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Live Services (shown when tunnels are active) -->
    @if (exposedServices().length > 0) {
      <section class="py-16 px-4 bg-success/5 border-y border-success/20">
        <div class="max-w-6xl mx-auto">
          <div class="flex items-center justify-center gap-2 mb-4">
            <span class="w-2.5 h-2.5 rounded-full bg-success animate-pulse"></span>
            <p class="terminal-header !mb-0">
              <span class="terminal-text text-success" style="--char-count: 18"
                >Services Are Live</span
              >
            </p>
          </div>
          <h2 class="text-3xl md:text-4xl font-bold font-heading text-center mb-4">
            Your Dev Environment
          </h2>
          <p class="text-muted text-center max-w-2xl mx-auto mb-10">
            Tunnels are connected. Click to open your services in a new tab.
          </p>
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            @for (svc of exposedServices(); track svc.id) {
              <a
                [href]="svc.url"
                target="_blank"
                rel="noopener noreferrer"
                class="feature-card group hover:border-success/40 transition-colors cursor-pointer no-underline"
              >
                <h3
                  class="font-heading font-semibold text-lg mb-1 group-hover:text-success transition-colors"
                >
                  {{ svc.name }}
                </h3>
                <p class="text-muted text-sm mb-3">{{ svc.id }}</p>
                <span class="text-success text-sm font-semibold">Open &rarr;</span>
              </a>
            }
          </div>
          <div
            class="bg-base-200 rounded-lg border border-base-300 p-3 font-mono text-xs mt-6 max-w-lg mx-auto overflow-x-auto"
          >
            <span class="text-muted">Basic auth credentials:</span>
            <span class="text-success ml-1">grep BASIC_AUTH .env</span>
          </div>
        </div>
      </section>
    }

    <!-- Section 2: How It Works -->
    <section id="features" class="py-20 px-4 bg-developer-tint">
      <div class="max-w-6xl mx-auto">
        <p class="terminal-header mb-4">
          <span class="terminal-text" style="--char-count: 20">Quick Start</span>
        </p>
        <h2 class="text-3xl md:text-4xl font-bold font-heading text-center mb-4">
          Two Steps to Full Stack
        </h2>
        <p class="text-muted text-center max-w-2xl mx-auto mb-12">
          Everything is preconfigured in <code class="text-primary">asd.yaml</code>. Install the CLI
          and go.
        </p>
        <div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          @for (step of setupSteps(); track step.num) {
            <div class="feature-card">
              <div
                class="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-bold mb-3"
              >
                {{ step.num }}
              </div>
              <h3 class="font-heading font-semibold text-lg mb-2">{{ step.title }}</h3>
              <p class="text-muted text-sm mb-3">{{ step.desc }}</p>
              <div class="bg-base-300/50 rounded p-3 font-mono text-xs overflow-x-auto">
                <pre class="whitespace-pre-wrap">{{ step.code }}</pre>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Section 3: Supabase Plugin -->
    <section class="py-20 px-4 bg-solution-tint">
      <div class="max-w-6xl mx-auto">
        <p class="terminal-header mb-4">
          <span class="terminal-text" style="--char-count: 16">ASD Plugin</span>
        </p>
        <h2 class="text-3xl md:text-4xl font-bold font-heading text-center mb-4">
          Supabase — Zero Config
        </h2>
        <p class="text-muted text-center max-w-2xl mx-auto mb-12">
          <code class="text-primary">asd supabase bootstrap</code> starts your entire backend.
          PostgreSQL, Auth, Storage, Edge Functions, and Realtime — with auto-migrations applied.
        </p>

        <div class="grid lg:grid-cols-2 gap-8 items-start">
          <!-- Left: terminal showing bootstrap -->
          <div class="bg-base-200 rounded-lg border border-base-300 overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-2 bg-base-300/50 border-b border-base-300">
              <span class="w-3 h-3 rounded-full bg-error opacity-70"></span>
              <span class="w-3 h-3 rounded-full bg-warning opacity-70"></span>
              <span class="w-3 h-3 rounded-full bg-success opacity-70"></span>
              <span class="text-xs text-muted ml-2 font-mono">supabase bootstrap</span>
            </div>
            <div class="p-4 font-mono text-xs leading-relaxed">
              <p><span class="text-success">$</span> asd supabase bootstrap</p>
              <p class="text-muted mt-2">
                <span class="text-info">[supabase]</span> Starting containers...
              </p>
              <p class="text-muted">
                <span class="text-info">[supabase]</span> PostgreSQL ready on
                <span class="text-warning">:54322</span>
              </p>
              <p class="text-muted">
                <span class="text-info">[supabase]</span> Auth + Kong API on
                <span class="text-warning">:54321</span>
              </p>
              <p class="text-muted">
                <span class="text-info">[supabase]</span> Studio UI on
                <span class="text-warning">:54323</span>
              </p>
              <p class="text-muted">
                <span class="text-info">[supabase]</span> Mailpit inbox on
                <span class="text-warning">:54324</span>
              </p>
              <p class="text-muted">
                <span class="text-info">[supabase]</span> Applying migrations...
              </p>
              <p class="text-success mt-1">
                <span class="text-success">[ready]</span> Supabase running locally
              </p>
            </div>
          </div>

          <!-- Right: env config -->
          <div>
            <h3 class="font-heading font-semibold text-lg mb-3">
              Your local environment — auto-configured
            </h3>
            <p class="text-muted text-sm mb-4">
              These values are generated by Supabase and written to
              <code class="text-primary">.env</code> automatically. Your Angular app reads them from
              <code class="text-primary">environment.development.ts</code>.
            </p>
            <div class="bg-base-200 rounded-lg border border-base-300 overflow-hidden">
              <div
                class="flex items-center gap-2 px-4 py-2 bg-base-300/50 border-b border-base-300"
              >
                <span class="text-xs text-muted font-mono">environment.development.ts</span>
              </div>
              <div class="p-4 font-mono text-xs leading-relaxed overflow-x-auto">
                <pre class="whitespace-pre-wrap">{{ supabaseEnvSnippet() }}</pre>
              </div>
            </div>
            <div class="mt-4 space-y-2">
              @for (tip of supabaseTips(); track tip.label) {
                <div class="flex gap-2 items-start">
                  <span class="text-primary text-xs mt-0.5">&#9654;</span>
                  <p class="text-muted text-sm">
                    <span class="text-base-content font-semibold">{{ tip.label }}:</span>
                    {{ tip.text }}
                  </p>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 4: asd.yaml -->
    <section class="py-20 px-4">
      <div class="max-w-6xl mx-auto">
        <p class="terminal-header mb-4">
          <span class="terminal-text" style="--char-count: 14">Configuration</span>
        </p>
        <h2 class="text-3xl md:text-4xl font-bold font-heading text-center mb-4">
          One File, Full Stack
        </h2>
        <p class="text-muted text-center max-w-2xl mx-auto mb-12">
          <code class="text-primary">asd.yaml</code> defines your services, automation, network
          routing, and hub views. One file replaces dozens of scripts.
        </p>
        <div class="grid lg:grid-cols-2 gap-8 items-start">
          <!-- YAML snippet -->
          <div class="bg-base-200 rounded-lg border border-base-300 overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-2 bg-base-300/50 border-b border-base-300">
              <span class="text-xs text-muted font-mono">asd.yaml</span>
            </div>
            <div class="p-4 font-mono text-xs leading-relaxed overflow-x-auto">
              <pre class="whitespace-pre-wrap">{{ yamlSnippet() }}</pre>
            </div>
          </div>
          <!-- Feature list -->
          <div class="space-y-4">
            @for (feat of yamlFeatures(); track feat.title) {
              <div class="flex gap-3">
                <div
                  class="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-0.5"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <h4 class="font-heading font-semibold text-sm">{{ feat.title }}</h4>
                  <p class="text-muted text-sm">{{ feat.desc }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </section>

    <!-- Section 5: DeVinCI -->
    <section id="devinci" class="py-20 px-4 bg-future-tint">
      <div class="max-w-6xl mx-auto">
        <p class="terminal-header mb-4">
          <span class="terminal-text" style="--char-count: 10">Cloud IDE</span>
        </p>
        <h2 class="text-3xl md:text-4xl font-bold font-heading text-center mb-4">
          DeVinCI: Your IDE in the Cloud
        </h2>
        <p class="text-muted text-center max-w-2xl mx-auto mb-12">
          Trigger a GitHub Action and get a full cloud development environment — VS Code, terminal,
          and all services accessible via HTTPS tunnels.
        </p>
        <div
          class="bg-base-200 rounded-lg border border-base-300 p-4 font-mono text-sm mb-8 max-w-3xl mx-auto overflow-x-auto"
        >
          <p>
            <span class="text-success">$</span> gh workflow run devinci.yml --ref $(git branch
            --show-current)
          </p>
          <p>&nbsp;&nbsp;&nbsp;&nbsp;-f username="dev" -f password="secret"</p>
          <p class="text-muted mt-1">Triggering cloud IDE on feature/my-branch...</p>
        </div>
        <div class="grid md:grid-cols-3 gap-6">
          @for (feat of devinciFeatures(); track feat.title) {
            <div class="feature-card">
              <div class="text-2xl mb-3">{{ feat.icon }}</div>
              <h3 class="font-heading font-semibold text-lg mb-2">{{ feat.title }}</h3>
              <p class="text-muted text-sm">{{ feat.desc }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Section 6: Claude Code Integration -->
    <section class="py-20 px-4 bg-attention-tint">
      <div class="max-w-6xl mx-auto">
        <p class="terminal-header mb-4">
          <span class="terminal-text" style="--char-count: 14">AI Integration</span>
        </p>
        <h2 class="text-3xl md:text-4xl font-bold font-heading text-center mb-4">
          AI-Powered Development with Claude Code
        </h2>
        <p class="text-muted text-center max-w-2xl mx-auto mb-12">
          This repo is built for AI-assisted development. Claude Code reads project instructions,
          respects safety hooks, and uses vault-secured credentials — never raw secrets.
        </p>
        <div class="grid sm:grid-cols-2 gap-6">
          @for (feat of claudeFeatures(); track feat.title) {
            <div class="feature-card">
              <h3 class="font-heading font-semibold text-lg mb-2">
                <code class="text-primary text-sm mr-2">{{ feat.tag }}</code>
                {{ feat.title }}
              </h3>
              <p class="text-muted text-sm">{{ feat.desc }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Section 7: Testing -->
    <section class="py-20 px-4">
      <div class="max-w-6xl mx-auto">
        <p class="terminal-header mb-4">
          <span class="terminal-text" style="--char-count: 8">Testing</span>
        </p>
        <h2 class="text-3xl md:text-4xl font-bold font-heading text-center mb-4">
          Test Everything — Payments, Email, E2E
        </h2>
        <p class="text-muted text-center max-w-2xl mx-auto mb-12">
          Full-stack testing from unit tests to payment webhooks. All orchestrated through
          <code class="text-primary">asd.yaml</code>.
        </p>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          @for (test of testingFeatures(); track test.title) {
            <div class="feature-card">
              <div class="text-2xl mb-3">{{ test.icon }}</div>
              <h3 class="font-heading font-semibold text-sm mb-2">{{ test.title }}</h3>
              <p class="text-muted text-xs">{{ test.desc }}</p>
            </div>
          }
        </div>
        <div
          class="bg-base-200 rounded-lg border border-base-300 p-4 font-mono text-sm mt-8 max-w-xl mx-auto overflow-x-auto"
        >
          <p><span class="text-success">$</span> asd run test-e2e</p>
          <p class="text-muted mt-1">Running Playwright E2E across Chromium, Firefox, WebKit...</p>
        </div>
      </div>
    </section>

    <!-- Section 8: CTA -->
    <section class="py-20 px-4 bg-solution-tint">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="text-3xl md:text-4xl font-bold font-heading mb-4">Ready to build?</h2>
        <p class="text-muted text-lg mb-8">
          Clone the repo, install the ASD CLI, and ship your SaaS in minutes — not weeks.
        </p>
        <div class="flex gap-4 justify-center flex-wrap">
          <a routerLink="/auth/signup" class="btn btn-primary btn-lg">Get Started Free</a>
          <a routerLink="/pricing" class="btn btn-outline btn-lg">View Pricing</a>
        </div>
      </div>
    </section>
  `,
})
export class Home implements OnInit {
  protected readonly exposedServices = signal<ExposedService[]>([])

  ngOnInit() {
    fetch('/tunnel-config.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0)
          this.exposedServices.set(data.filter((s: ExposedService) => s.id !== 'angular:dev'))
      })
      .catch(() => {})
  }

  protected readonly setupSteps = signal([
    {
      num: 1,
      title: 'Install ASD CLI',
      desc: 'One-line install on Linux, macOS, or Windows.',
      code: 'curl -fsSL https://raw.githubusercontent.com/asd-engineering/asd-cli/main/install.sh | bash',
    },
    {
      num: 2,
      title: 'Run asd run dev',
      desc: 'One command starts Supabase, Caddy, Angular, code-server, ttyd, and tunnels.',
      code: '$ asd run dev\n# Everything configured in asd.yaml — just run it.',
    },
  ])

  protected readonly supabaseEnvSnippet = signal(`export const environment = {
  supabaseUrl: 'http://127.0.0.1:54321',
  supabaseAnonKey: 'eyJhbGci...CRXP1A7W...',
}

// Supabase local services:
//   API + Auth   → http://127.0.0.1:54321
//   PostgreSQL   → postgresql://postgres:postgres@127.0.0.1:54322/postgres
//   Studio       → http://127.0.0.1:54323
//   Mailpit      → http://127.0.0.1:54324`)

  protected readonly supabaseTips = signal([
    {
      label: 'Studio',
      text: 'Browse tables, run SQL, manage RLS policies — open 127.0.0.1:54323 in your browser.',
    },
    {
      label: 'Mailpit',
      text: 'All auth emails (signup, password reset, magic links) are captured at 127.0.0.1:54324.',
    },
    {
      label: 'Migrations',
      text: 'supabase/migrations/ are applied automatically on bootstrap. Add new ones with npx supabase migration new.',
    },
    {
      label: 'Edge Functions',
      text: 'Functions in supabase/functions/ are served locally. Test with curl or Playwright.',
    },
  ])

  protected readonly yamlSnippet = signal(`network:
  services:
    # public: true = create HTTPS tunnel
    # public: false = local only (default)
    supabase:studio:
      public: true
    supabase:mailpit:
      public: true
    angular:dev:
      public: true
      subdomain: app
      env:
        # Kong API auto-routes through app:
        # /auth/v1  /rest/v1  /storage/v1
        # /functions/v1  /realtime/v1
        API_TUNNEL_URL: '\${{ macro.exposedOrigin() }}'
    codeserver:
      public: false
    ttyd:
      public: false`)

  protected readonly yamlFeatures = signal([
    {
      title: 'Plugin System',
      desc: 'Add Supabase with one line. Plugins handle bootstrap, migrations, and teardown.',
    },
    {
      title: 'Automation Sequences',
      desc: 'Define named sequences (dev, start, stop, test) that run steps in order with health checks.',
    },
    {
      title: 'public: true = Tunnel',
      desc: 'Services are local-only by default. Set public: true to create an HTTPS tunnel — explicit opt-in for internet exposure.',
    },
    {
      title: 'Kong API on App URL',
      desc: 'Supabase Kong gateway auto-routes through the main app tunnel: /auth/v1, /rest/v1, /storage/v1, /functions/v1. Auth works through tunnels.',
    },
    {
      title: 'Hub Views',
      desc: 'Unified dashboard with iframe widgets for App, Studio, Code Studio, and Terminal.',
    },
    {
      title: 'Vault Integration',
      desc: 'asd:// references in tpl.env resolve at runtime. AI agents never see raw secrets.',
    },
  ])

  protected readonly devinciFeatures = signal([
    {
      icon: '{}',
      title: 'VS Code in Browser',
      desc: 'code-server gives you a full VS Code experience with extensions, themes, and terminal — accessible via HTTPS.',
    },
    {
      icon: '>_',
      title: 'Browser Terminal',
      desc: 'ttyd provides a real terminal in your browser. Run asd commands, git, npm — anything you need.',
    },
    {
      icon: '////',
      title: 'Cross-Platform',
      desc: 'Works on Linux and macOS runners. code-server on Linux/macOS, ttyd on all platforms including Windows.',
    },
  ])

  protected readonly claudeFeatures = signal([
    {
      tag: 'CLAUDE.md',
      title: 'Project Instructions',
      desc: 'Claude reads CLAUDE.md automatically — tech stack, commands, architecture rules, and conventions. No manual onboarding needed.',
    },
    {
      tag: 'hooks/',
      title: 'Safety Hooks',
      desc: 'asd-guard.sh prompts before internet exposure. inject-ai-session.sh adds audit trails to tickets. Guardrails built in.',
    },
    {
      tag: '/skills',
      title: 'Slash Commands',
      desc: 'Skills like /asd-setup, /playwright-ui-testing, and /code-review give Claude specialized capabilities for this project.',
    },
    {
      tag: 'asd://',
      title: 'Vault Credentials',
      desc: 'ASD Vault injects secrets at runtime via asd:// references. Claude never sees raw API keys — only template references.',
    },
  ])

  protected readonly testingFeatures = signal([
    {
      icon: '💳',
      title: 'Mollie Payments',
      desc: 'Create payment, redirect to Mollie test checkout, webhook verifies via ASD tunnel.',
    },
    {
      icon: '📧',
      title: 'Mailpit',
      desc: 'Auth emails captured locally. REST API for programmatic access in E2E tests.',
    },
    {
      icon: '🎭',
      title: 'Playwright E2E',
      desc: 'Full checkout flow automated across Chromium, Firefox, and WebKit.',
    },
    {
      icon: '⚙️',
      title: 'CI Pipeline',
      desc: 'GitHub Actions: lint, typecheck, format, unit tests, E2E, duplication check.',
    },
  ])
}
