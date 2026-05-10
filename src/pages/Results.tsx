import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AuditResult } from '@/engine/auditEngine.ts'

type ResultsLocationState = {
  auditResult?: AuditResult
}

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function Results() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as ResultsLocationState | null
  const auditResult = state?.auditResult

  if (!auditResult) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Velqen results</p>
          <h1 className="text-4xl font-semibold text-white">No audit data found</h1>
          <p className="max-w-xl text-slate-300">Run an audit from the home page to generate results. The results view only renders after the audit engine finishes.</p>
          <Button onClick={() => navigate('/')}>Return home</Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <header className="rounded-[2rem] border border-slate-800/70 bg-gradient-to-br from-slate-900/90 to-slate-950 p-8 shadow-2xl shadow-slate-950/40">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">Audit results</p>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Your AI spend audit is complete.</h1>
            <p className="text-base text-slate-300 sm:text-lg">We calculated the likely savings from your stack, normalized any invalid seat counts, and flagged overlap where multiple tools cover the same coding use case.</p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Card className="border-emerald-500/30 bg-emerald-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-200">Monthly savings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-semibold text-white">{money.format(auditResult.totals.monthly)}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-900/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-[0.18em] text-slate-300">Annual savings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-semibold text-white">{money.format(auditResult.totals.annual)}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-900/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-[0.18em] text-slate-300">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium text-white">
                  {auditResult.flags.alreadyOptimal ? 'Already optimal' : auditResult.flags.highSavings ? 'High savings opportunity' : 'Needs review'}
                </p>
              </CardContent>
            </Card>
          </div>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-4">
            {auditResult.tools.map((tool) => (
              <Card key={`${tool.toolId}-${tool.currentPlanId}`} className="border-slate-800/70 bg-slate-900/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl text-white">{tool.toolName}</CardTitle>
                  <p className="text-sm text-slate-400">{tool.reason}</p>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                  <div>
                    <p className="text-slate-400">Current</p>
                    <p className="text-white">{tool.currentPlanName}</p>
                    <p>{money.format(tool.currentSpend)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Recommended</p>
                    <p className="text-white">
                      {tool.recommendedToolId !== tool.toolId
                        ? `${tool.recommendedToolName} — ${tool.recommendedPlanName}`
                        : tool.recommendedPlanName}
                    </p>
                    <p>{money.format(tool.recommendedSpend)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Monthly savings</p>
                    <p className="text-white">{money.format(tool.monthlySavings)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Flags</p>
                    <p className="text-white">{tool.flags.length > 0 ? tool.flags.join(', ') : 'None'}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <aside className="space-y-4">
            <Card className="border-slate-800/70 bg-slate-900/60">
              <CardHeader>
                <CardTitle className="text-white">Audit summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <p>Team size: {auditResult.teamSize}</p>
                <p>Use case: {auditResult.useCase}</p>
                <p>Redundancy flagged: {auditResult.flags.redundancy ? 'Yes' : 'No'}</p>
                <p>Overlap detected: {auditResult.flags.overlapDetected ? 'Yes' : 'No'}</p>
              </CardContent>
            </Card>

            <Button className="w-full" onClick={() => navigate('/')}>Run another audit</Button>
          </aside>
        </section>
      </div>
    </main>
  )
}
