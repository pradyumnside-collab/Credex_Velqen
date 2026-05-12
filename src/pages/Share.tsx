import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, CheckCircle2, TrendingDown } from 'lucide-react'

import { getAuditBySlug } from '@/api/supabase'
import { Button } from '@/components/ui/button'
import { setPageMetaTags } from '@/utils/setMetaTags'
import type { AuditRow, AuditToolPublic } from '@/types/audit'

function getAppBaseUrl(): string {
  if (import.meta.env.VITE_APP_BASE_URL) {
    return import.meta.env.VITE_APP_BASE_URL
  }

  return typeof window !== 'undefined' ? window.location.origin : ''
}

function ShareSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-48 rounded" />
      <div className="skeleton h-4 w-72 rounded" />
      <div className="skeleton h-32 w-full rounded-xl" />
      <div className="skeleton h-24 w-full rounded-xl" />
      <div className="skeleton h-24 w-full rounded-xl" />
    </div>
  )
}

function ShareToolCard({ tool, index }: { tool: AuditToolPublic; index: number }) {
  const hasSavings = tool.monthlySavings > 0
  const borderColor = !hasSavings
    ? 'border-l-zinc-200'
    : tool.action === 'seat-overprovision' || tool.action === 'usage-check' || tool.action === 'wrong-use-case'
      ? 'border-l-amber-400'
      : 'border-l-velqen-400'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className={`rounded-xl border border-zinc-100 bg-white border-l-4 ${borderColor} p-5 shadow-card`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 text-sm font-semibold text-zinc-900">{tool.toolName}</h3>
          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">{tool.reason}</p>
          <div className="mt-3 flex items-center gap-3 text-xs text-zinc-400">
            <span className="font-medium text-zinc-600">{tool.currentPlanName}</span>
            {tool.recommendedPlanName && tool.recommendedPlanName !== tool.currentPlanName && (
              <>
                <ArrowRight className="h-3 w-3" />
                <span className="font-medium text-velqen-600">{tool.recommendedPlanName}</span>
              </>
            )}
          </div>
        </div>
        {hasSavings && (
          <div className="flex-shrink-0 text-right">
            <div className="font-mono text-lg font-semibold tabular-nums text-velqen-600">${tool.monthlySavings.toLocaleString()}</div>
            <div className="text-xs text-zinc-400">/mo</div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function Share() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [audit, setAudit] = useState<AuditRow | null>(null)
  const invalidSlug = !slug
  const [loading, setLoading] = useState(() => !invalidSlug ? true : false)
  const [error, setError] = useState<string | null>(() => invalidSlug ? 'Invalid audit link.' : null)

  useEffect(() => {
    if (invalidSlug) {
      return
    }

    getAuditBySlug(slug).then((result) => {
      if (!result.success) {
        setError(result.notFound ? 'This audit does not exist or has been removed.' : 'Failed to load audit.')
        setLoading(false)
        return
      }

      setAudit(result.audit)
      setLoading(false)

      const appUrl = getAppBaseUrl()
      const monthly = result.audit.total_monthly_savings
      const title = monthly > 0
        ? `Velqen Audit — $${monthly.toLocaleString()}/mo in AI savings found`
        : 'Velqen AI Spend Audit'
      const description = monthly > 0
        ? `This team found $${result.audit.total_annual_savings.toLocaleString()}/year in potential AI tool savings across ${result.audit.tools_data.length} tools. Run a free audit for your team.`
        : 'Free AI spend audit — see where your team is overpaying for AI tools.'

      setPageMetaTags({
        title,
        description,
        url: `${appUrl}/audit/${slug}`,
      })
    })
  }, [invalidSlug, slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <ShareNav onRunAudit={() => navigate('/audit')} />
        <main className="mx-auto max-w-2xl px-6 py-12">
          <ShareSkeleton />
        </main>
      </div>
    )
  }

  if (invalidSlug) {
    return <Navigate to="/" replace />
  }

  if (error || !audit) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <ShareNav onRunAudit={() => navigate('/audit')} />
        <main className="mx-auto max-w-2xl px-6 py-20 text-center">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-zinc-300" />
          <h1 className="mb-2 text-xl font-semibold text-zinc-900">Audit not found</h1>
          <p className="mb-6 text-sm text-zinc-500">{error}</p>
          <Button className="bg-zinc-900 text-white hover:bg-zinc-700" onClick={() => navigate('/audit')}>
            Run your own audit
          </Button>
        </main>
      </div>
    )
  }

  const hasSavings = audit.total_monthly_savings > 0

  return (
    <div className="min-h-screen bg-zinc-50">
      <ShareNav onRunAudit={() => navigate('/audit')} />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 shadow-card"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-velqen-500" />
          <span className="text-xs text-zinc-500">Shared audit · Velqen</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 rounded-xl3 border p-8 ${hasSavings ? 'border-velqen-100 bg-velqen-50' : 'border-zinc-100 bg-white'}`}
        >
          <p className="data-label mb-3 text-zinc-400">{hasSavings ? 'Potential monthly savings' : 'Audit status'}</p>
          {hasSavings ? (
            <>
              <div className="font-mono text-5xl font-semibold tabular-nums text-zinc-900">${audit.total_monthly_savings.toLocaleString()}</div>
              <div className="mt-2 text-sm text-zinc-500">
                = <span className="font-mono font-medium text-velqen-600">${audit.total_annual_savings.toLocaleString()}</span> per year
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-velqen-600" />
              <span className="text-lg font-medium text-zinc-700">Already optimal</span>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-400">
            <span>{audit.tools_data.length} tool{audit.tools_data.length > 1 ? 's' : ''} audited</span>
            <span>·</span>
            <span>{audit.team_size}-person team</span>
            <span>·</span>
            <span className="capitalize">{audit.use_case} use case</span>
          </div>
        </motion.div>

        {audit.tools_data.length > 0 && (
          <div className="mb-8 space-y-3">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">Tool breakdown</h2>
            {audit.tools_data.map((tool, index) => (
              <ShareToolCard key={tool.toolId} tool={tool} index={index} />
            ))}
          </div>
        )}

        <div className="rounded-xl2 border border-zinc-100 bg-white p-6 text-center shadow-card">
          <TrendingDown className="mx-auto mb-3 h-8 w-8 text-zinc-300" />
          <h3 className="mb-2 text-base font-semibold text-zinc-900">Find savings in your own stack</h3>
          <p className="mb-5 text-sm text-zinc-500">Free, instant, no account required. Takes under 3 minutes.</p>
          <Button className="bg-zinc-900 text-white hover:bg-zinc-700" onClick={() => navigate('/audit')}>
            Run your own audit <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-zinc-400">Identifying details have been removed from this shared view. Savings estimates are conservative and based on verified vendor pricing.</p>
      </main>
    </div>
  )
}

function ShareNav({ onRunAudit }: { onRunAudit: () => void }) {
  return (
    <header className="border-b border-zinc-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900">
            <span className="text-xs font-bold text-white">V</span>
          </div>
          <span className="text-sm font-semibold text-zinc-900">Velqen</span>
        </Link>
        <Button variant="outline" size="sm" className="border-zinc-200 text-xs text-zinc-700" onClick={onRunAudit}>
          Run your audit
        </Button>
      </div>
    </header>
  )
}