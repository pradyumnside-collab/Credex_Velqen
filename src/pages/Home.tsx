import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Layers, ShieldCheck, TrendingDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'

const TOOL_LOGOS = ['ChatGPT', 'Claude', 'Cursor', 'Copilot', 'Gemini', 'Windsurf']

const FEATURES = [
  { icon: TrendingDown, title: 'Reveal hidden waste', body: 'Duplicate subscriptions, unused seats, and API costs consolidated into a clear savings plan.' },
  { icon: ShieldCheck, title: 'Finance defensible', body: 'Conservative savings estimates with source citations and a clear audit trail.' },
  { icon: Layers, title: 'Stack aware', body: 'Audits ChatGPT, Claude, Cursor, Gemini, Copilot, and direct API spend simultaneously.' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Add your tools', body: 'Enter the tools your team pays for, the plan, monthly spend, and seat count.' },
  { step: '02', title: 'Instant analysis', body: 'The audit engine evaluates plan fit, seat counts, and cross-tool overlap.' },
  { step: '03', title: 'Act on savings', body: 'Get a finance-ready report with conservative, numbered savings estimates.' },
]

const STATS = [
  { label: 'Average monthly savings', value: '$3,200' },
  { label: 'Tools supported', value: '8+' },
  { label: 'Time to first audit', value: '< 3 min' },
]

export function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900">
              <span className="text-xs font-bold text-white">V</span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-zinc-900">Velqen</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">Private preview</span>
          </div>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-zinc-600 hover:text-zinc-900" onClick={() => navigate('/audit')}>
              Open audit
            </Button>
            <Button size="sm" className="bg-zinc-900 text-white hover:bg-zinc-700" onClick={() => navigate('/audit')}>
              Run audit <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-zinc-100 grid-bg">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-br from-velqen-100/60 via-transparent to-transparent blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 text-center">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 shadow-card">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-velqen-500" />
            <span className="text-xs font-medium text-zinc-600">Private preview - audit your AI stack for free</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }} className="mx-auto max-w-3xl text-balance text-5xl font-semibold leading-[1.1] tracking-tight text-zinc-900 sm:text-6xl">
            The operating system for <span className="text-velqen-600">AI spend</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="mx-auto mt-5 max-w-xl text-balance text-lg leading-relaxed text-zinc-500">
            Instantly audit your AI tool stack to reveal conservative, finance-defensible savings across subscriptions, seats, and API usage.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="h-11 gap-2 rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white shadow-card-lg hover:bg-zinc-700" onClick={() => navigate('/audit')}>
              Run a quick audit <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="h-11 rounded-lg border-zinc-200 px-6 text-sm font-medium text-zinc-700">
              Request demo
            </Button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }} className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <span className="text-xs text-zinc-400">Supports</span>
            {TOOL_LOGOS.map((tool) => (
              <span key={tool} className="text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-700">
                {tool}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="border-b border-zinc-100 bg-zinc-50">
        <div className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-zinc-100 px-6">
          {STATS.map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08, duration: 0.5, ease: 'easeOut' }} className="px-8 py-8 text-center">
              <div className="font-mono text-3xl font-semibold tabular-nums text-zinc-900">{stat.value}</div>
              <div className="mt-1 text-sm text-zinc-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 text-center">
          <p className="data-label mb-3">Why Velqen</p>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">Built for teams that treat AI like infrastructure</h2>
          <p className="mx-auto mt-3 max-w-lg text-zinc-500">Measurable, governed, and optimized without requiring account access or vendor integrations.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon

            return (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08, duration: 0.5, ease: 'easeOut' }} className="group rounded-xl2 border border-zinc-100 bg-white p-7 shadow-card transition-shadow hover:shadow-card-lg">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-50 text-zinc-700 transition-colors group-hover:bg-velqen-50 group-hover:text-velqen-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{feature.body}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      <section className="border-y border-zinc-100 bg-zinc-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <p className="data-label mb-3">Process</p>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">Audit in under three minutes</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, index) => (
              <motion.div key={step.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08, duration: 0.5, ease: 'easeOut' }} className="relative">
                {index < HOW_IT_WORKS.length - 1 && <div className="absolute left-full top-5 hidden h-px w-full -translate-x-4 bg-zinc-200 sm:block" />}
                <div className="font-mono text-sm font-medium text-zinc-300">{step.step}</div>
                <h3 className="mt-3 text-base font-semibold text-zinc-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="overflow-hidden rounded-xl3 border border-zinc-100 bg-zinc-900 p-10 shadow-hero sm:p-14">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="data-label mb-3 text-zinc-500">Instant preview</p>
              <h2 className="text-3xl font-semibold text-white">Potential savings from common stacks</h2>
              <p className="mt-3 text-zinc-400">Conservative estimates. Based on real pricing data, not inflated benchmarks.</p>
              <div className="mt-8 flex gap-10">
                <div>
                  <div className="data-label text-zinc-500">Monthly run rate</div>
                  <div className="mt-1 font-mono text-3xl font-semibold tabular-nums text-white">$42,300</div>
                </div>
                <div>
                  <div className="data-label text-zinc-500">Estimated recoverable</div>
                  <div className="mt-1 font-mono text-3xl font-semibold tabular-nums text-velqen-400">$9,620</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-shrink-0">
              <Button size="lg" className="h-11 rounded-lg bg-white px-6 text-sm font-medium text-zinc-900 hover:bg-zinc-100" onClick={() => navigate('/audit')}>
                Start your audit <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
              <p className="text-center text-xs text-zinc-600">No account required</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-100 py-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900">
              <span className="text-xs font-bold text-white">V</span>
            </div>
            <span className="text-sm font-medium text-zinc-700">Velqen</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Pricing data verified weekly.
          </div>
        </div>
      </footer>
    </div>
  )
}