import { ArrowRight, BadgeCheck, LayoutGrid, TrendingDown, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SpendForm } from '@/components/SpendForm/SpendForm'
import { runAudit } from '@/engine/auditEngine'

const features = [
  {
    icon: TrendingDown,
    title: 'Reveal hidden waste',
    description: 'Duplicate subscriptions, unused seats, and API costs consolidated into a clear savings plan.',
  },
  {
    icon: BadgeCheck,
    title: 'Finance defensible',
    description: 'Actionable recommendations and conservative savings estimates ready for finance review.',
  },
  {
    icon: LayoutGrid,
    title: 'Stack aware',
    description: 'Supports ChatGPT, Claude, Cursor, Gemini, Copilot and direct API spend in one audit.',
  },
]

export function Home() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start">
          {/* Hero */}
          <header className="lg:col-span-7">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-slate-900/40 px-4 py-1 text-xs font-medium tracking-wider text-emerald-300">
              <Sparkles className="h-4 w-4 text-emerald-300" />
              Velqen — AI spend audit (private preview)
            </div>

            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              The operating system for AI spend — precise, private, inevitable.
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-slate-300">
              Instantly audit your AI tool stack to reveal conservative, finance-defensible savings across subscriptions, seats, and API usage. Clarity first — recommendations next.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#audit-form" className="inline-flex items-center gap-3 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow-md transition-transform hover:-translate-y-0.5">
                Run a quick audit
                <ArrowRight className="h-4 w-4" />
              </a>

              <Button variant="ghost" className="rounded-full border border-slate-800 px-4 py-2 text-sm text-slate-300">
                Request demo
              </Button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {features.map((f) => {
                const Icon = f.icon
                return (
                  <Card key={f.title} className="bg-transparent border border-slate-800/50">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-emerald-400">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                          <p className="mt-1 text-sm text-slate-400">{f.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </header>

          {/* Right column: Savings preview + audit form compact */}
          <aside className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-800/40 p-6 shadow-lg">
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Instant preview</h4>
                <h2 className="mt-3 text-3xl font-bold text-white">Potential savings</h2>
                <p className="mt-2 text-sm text-slate-400">Based on common stack patterns — conservative estimates.</p>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-300">Monthly run rate</div>
                    <div className="text-lg font-semibold text-white">$42,300</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-300">Estimated recoverable</div>
                    <div className="text-lg font-semibold text-emerald-400">$9,620</div>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
                    <div className="h-2 bg-emerald-400" style={{ width: '22%' }} />
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <a href="#audit-form" className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900">
                      Start your audit
                    </a>
                    <a href="#features" className="text-sm text-slate-400 hover:underline">How it works</a>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Full-width audit form */}
        <section id="audit-form" className="mt-16 sm:mt-24">
          <div className="rounded-2xl bg-slate-900/40 p-6 sm:p-10 w-full shadow-xl ring-1 ring-slate-800/50">
            <CardHeader className="p-0 pb-6">
              <CardTitle className="text-xl sm:text-2xl font-semibold text-white">Run a detailed audit</CardTitle>
              <p className="mt-2 text-sm sm:text-base text-slate-400">Add tools, seats, and API usage — your draft saves locally as you work.</p>
            </CardHeader>

            <CardContent className="p-0">
              <div className="w-full">
                <SpendForm
                  className="w-full bg-transparent border-0 shadow-none"
                  onSubmit={(formData) => {
                    const auditResult = runAudit(formData)
                    navigate('/results', { state: { auditResult } })
                  }}
                />
              </div>
            </CardContent>
          </div>
        </section>

        {/* Deepen the story: Why Velqen */}
        <section id="features" className="mt-20 grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-semibold text-white">Why Velqen?</h3>
            <p className="mt-4 text-lg text-slate-300">Velqen is designed for teams that treat AI like infrastructure — measurable, governed, and optimized. We combine subscription intelligence with conservative API spend modelling so you can reduce monthly run rates without risking productivity.</p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/20 p-5">
                <h4 className="text-sm font-semibold text-white">Audit-first workflow</h4>
                <p className="mt-2 text-sm text-slate-400">No account access required for a first-pass audit — save locally and share a PDF-ready summary with finance.</p>
              </div>

              <div className="rounded-xl border border-slate-800/60 bg-slate-900/20 p-5">
                <h4 className="text-sm font-semibold text-white">Conservative estimates</h4>
                <p className="mt-2 text-sm text-slate-400">All savings are presented conservatively so recommendations are defensible during vendor discussions.</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/20 p-6">
              <h5 className="text-sm font-semibold text-emerald-300">Trusted by teams</h5>
              <p className="mt-3 text-sm text-slate-400">Engineering and finance teams use Velqen to convert tool chaos into a plan.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}