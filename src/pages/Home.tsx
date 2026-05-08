import { ArrowRight, BadgeCheck, LayoutGrid, TrendingDown } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { SpendForm } from '@/components/SpendForm/SpendForm'

const highlights = [
  {
    icon: TrendingDown,
    title: 'See waste fast',
    description: 'Spot duplicate plans, overpriced seats, and tools that can be downgraded.',
  },
  {
    icon: BadgeCheck,
    title: 'No login required',
    description: 'Value shows first so managers can evaluate the audit before sharing an email.',
  },
  {
    icon: LayoutGrid,
    title: 'Built for tool stacks',
    description: 'Track Cursor, Copilot, Claude, ChatGPT, APIs, Gemini, and Windsurf in one place.',
  },
]

export function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.08),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-28 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute right-[-5rem] top-44 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-12 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid flex-1 items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <div className="flex flex-col justify-center space-y-8 pt-4 lg:pt-12">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Velqen audit draft for engineering managers
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Find out if your AI tools are costing you more than they should.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                Add your stack, keep the draft saved locally, and prepare a finance-defensible audit that shows where the spend can come down.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {highlights.map((highlight) => {
                const Icon = highlight.icon

                return (
                  <Card key={highlight.title} className="border-white/80 bg-white/70 shadow-[0_12px_45px_rgba(15,23,42,0.08)] backdrop-blur">
                    <CardContent className="space-y-3 p-5">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-slate-950">{highlight.title}</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{highlight.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">Instant local persistence</span>
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">Tailored for 3+ tool teams</span>
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">Professional audit workflow</span>
            </div>

            <a
              href="#audit-form"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition-transform hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Start your audit
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div id="audit-form" className="scroll-mt-6 lg:pt-4">
            <SpendForm />
          </div>
        </div>
      </section>
    </main>
  )
}