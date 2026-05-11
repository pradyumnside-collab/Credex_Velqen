import { useEffect, useLayoutEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Bell } from 'lucide-react'

import { AISummary } from '@/components/AuditResults/AISummary'
import { AuditSidebar } from '@/components/AuditResults/AuditSidebar'
import { CredexCTA } from '@/components/AuditResults/CredexCTA'
import { HeroSavings } from '@/components/AuditResults/HeroSavings'
import { ToolBreakdown } from '@/components/AuditResults/ToolBreakdown'
import { LeadCapture } from '@/components/LeadCapture/LeadCapture'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { generateSummary } from '@/api/anthropic'
import type { AuditResult } from '@/engine/auditEngine'
import { AnimatePresence } from 'framer-motion'

const AUDIT_STORAGE_KEY = 'velqen_last_audit'

type ResultsLocationState = {
  auditResult?: AuditResult
}

function deriveStatus(result: AuditResult): 'savings' | 'optimal' | 'review' {
  if (result.totals.monthly === 0) {
    return 'optimal'
  }

  if (result.tools.some((recommendation) => recommendation.action === 'usage-check' || recommendation.action === 'model-rightsizing')) {
    return 'review'
  }

  return 'savings'
}

function initializeAuditResult(state: ResultsLocationState | null): AuditResult | null {
  if (state?.auditResult) {
    return state.auditResult
  }

  const stored = window.localStorage.getItem(AUDIT_STORAGE_KEY)
  if (!stored) {
    return null
  }

  try {
    return JSON.parse(stored) as AuditResult
  } catch {
    window.localStorage.removeItem(AUDIT_STORAGE_KEY)
    return null
  }
}

function getAppBaseUrl(): string {
  if (import.meta.env.VITE_APP_BASE_URL) {
    return import.meta.env.VITE_APP_BASE_URL
  }

  return typeof window !== 'undefined' ? window.location.origin : ''
}

export function Results() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as ResultsLocationState | null
  const [auditResult] = useState<AuditResult | null>(() => initializeAuditResult(state))
  const [summary, setSummary] = useState<string | null>(null)
  const [notifyEmail, setNotifyEmail] = useState('')
  const [showLeadCapture, setShowLeadCapture] = useState(false)
  const [auditSlug, setAuditSlug] = useState<string | null>(null)

  // Derive loading state: we're loading if we have audit result but no summary yet
  const isAiLoading = auditResult !== null && summary === null

  useEffect(() => {
    if (auditResult) {
      window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(auditResult))
    }
  }, [auditResult])

  useLayoutEffect(() => {
    if (!auditResult) {
      return
    }

    generateSummary(auditResult)
      .then(setSummary)
      .catch(() => setSummary(''))  // Fallback or empty string to mark as loaded
  }, [auditResult])

  function handleLeadSuccess(slug: string) {
    setAuditSlug(slug)
    setShowLeadCapture(false)
  }

  if (!auditResult) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
        <div className="text-center">
          <p className="mb-4 text-zinc-500">No audit found.</p>
          <Button variant="outline" onClick={() => navigate('/audit')}>
            Run an audit
          </Button>
        </div>
      </div>
    )
  }

  const status = deriveStatus(auditResult)
  const isLowSavings = auditResult.totals.monthly < 100
  const shareUrl = auditSlug ? `${getAppBaseUrl()}/audit/${auditSlug}` : null

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900">
              <span className="text-xs font-bold text-white">V</span>
            </div>
            <span className="text-sm font-semibold text-zinc-900">Velqen</span>
          </Link>
          <span className="text-xs text-zinc-400">Audit · {new Date().toLocaleDateString()}</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 print:py-4">
        <Link to="/audit" className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-700 print:hidden">
          <ArrowLeft className="h-3.5 w-3.5" />
          Edit audit
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="data-label mb-2 text-zinc-400">Audit results</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Your AI spend audit is complete.</h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-500">We calculated the likely savings from your stack, normalized any invalid seat counts, and flagged overlap where multiple tools cover the same use case.</p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <HeroSavings monthlyTotal={auditResult.totals.monthly} annualTotal={auditResult.totals.annual} status={status} />

            {!auditSlug && (
              <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-card">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="data-label mb-1 text-zinc-400">Save your audit</p>
                    <h3 className="text-base font-semibold text-zinc-900">Get your full report and share link</h3>
                    <p className="mt-1 text-sm text-zinc-500">Email the report to yourself and reveal a public share page with personal details removed.</p>
                  </div>
                  <Button
                    onClick={() => setShowLeadCapture(true)}
                    className="h-11 rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700"
                  >
                    Get my full report →
                  </Button>
                </div>
              </div>
            )}

            {auditSlug && shareUrl && (
              <div className="rounded-xl border border-velqen-100 bg-velqen-50 p-4 shadow-card">
                <p className="mb-2 text-xs font-medium text-velqen-700">Report saved · Share link</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate font-mono text-xs text-velqen-600">{shareUrl}</code>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-velqen-200 text-xs text-velqen-700"
                    onClick={() => window.open(`/audit/${auditSlug}`, '_blank', 'noreferrer')}
                  >
                    Open share page
                  </Button>
                </div>
              </div>
            )}

            <CredexCTA monthlySavings={auditResult.totals.monthly} annualSavings={auditResult.totals.annual} />

            <AISummary summary={summary} isLoading={isAiLoading} />

            <ToolBreakdown recommendations={auditResult.tools} />

            {isLowSavings && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="rounded-xl border border-zinc-100 bg-white p-6 shadow-card">
                <div className="mb-3 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-zinc-400" />
                  <h3 className="text-sm font-semibold text-zinc-900">Notify me when optimizations apply</h3>
                </div>
                <p className="mb-4 text-sm text-zinc-500">Your current stack looks well optimized. We will email you when pricing changes or better alternatives emerge for your tools.</p>
                <div className="flex gap-2">
                  <Input type="email" placeholder="you@company.com" value={notifyEmail} onChange={(event) => setNotifyEmail(event.target.value)} className="h-9 border-zinc-200 text-sm" />
                  <Button size="sm" className="h-9 flex-shrink-0 bg-zinc-900 text-white hover:bg-zinc-700">
                    Notify me
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          <div className="print:hidden">
            <AuditSidebar result={auditResult} />
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showLeadCapture && auditResult && (
          <LeadCapture
            auditResult={auditResult}
            onClose={() => setShowLeadCapture(false)}
            onSuccess={handleLeadSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
