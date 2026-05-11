import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, CheckCircle2, Info, TrendingDown } from 'lucide-react'
import type { ComponentType } from 'react'

import type { RecommendationAction, ToolRecommendation } from '@/engine/recommendations'

type ToolBreakdownProps = {
  recommendations: ToolRecommendation[]
}

const ACTION_CONFIG: Record<RecommendationAction, { borderColor: string; badgeBg: string; badgeText: string; icon: ComponentType<{ className?: string }>; label: string }> = {
  'seat-overprovision': { borderColor: 'border-l-amber-400', badgeBg: 'bg-amber-50', badgeText: 'text-amber-700', icon: AlertTriangle, label: 'Excess seats' },
  'plan-downgrade': { borderColor: 'border-l-velqen-500', badgeBg: 'bg-velqen-50', badgeText: 'text-velqen-700', icon: TrendingDown, label: 'Downgrade available' },
  'org-feature-tax': { borderColor: 'border-l-velqen-500', badgeBg: 'bg-velqen-50', badgeText: 'text-velqen-700', icon: TrendingDown, label: 'Org feature tax' },
  'billing-switch': { borderColor: 'border-l-blue-400', badgeBg: 'bg-blue-50', badgeText: 'text-blue-700', icon: Info, label: 'Switch billing' },
  'usage-check': { borderColor: 'border-l-amber-400', badgeBg: 'bg-amber-50', badgeText: 'text-amber-700', icon: AlertTriangle, label: 'Review usage' },
  'model-rightsizing': { borderColor: 'border-l-velqen-500', badgeBg: 'bg-velqen-50', badgeText: 'text-velqen-700', icon: TrendingDown, label: 'Model switch' },
  'wrong-use-case': { borderColor: 'border-l-orange-400', badgeBg: 'bg-orange-50', badgeText: 'text-orange-700', icon: AlertTriangle, label: 'Wrong use case' },
  'spend-discrepancy': { borderColor: 'border-l-red-400', badgeBg: 'bg-red-50', badgeText: 'text-red-700', icon: AlertTriangle, label: 'Spend discrepancy' },
  optimal: { borderColor: 'border-l-zinc-200', badgeBg: 'bg-zinc-50', badgeText: 'text-zinc-500', icon: CheckCircle2, label: 'Optimal' },
}

function ToolCard({ rec, index }: { rec: ToolRecommendation; index: number }) {
  const config = ACTION_CONFIG[rec.action] ?? ACTION_CONFIG.optimal
  const Icon = config.icon
  const hasSavings = rec.monthlySavings > 0

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07, duration: 0.4 }} className={`tool-card rounded-xl border border-zinc-100 bg-white shadow-card border-l-4 ${config.borderColor} overflow-hidden`}>
      <div className="p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2.5">
              <h3 className="text-base font-semibold text-zinc-900">{rec.toolName}</h3>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.badgeBg} ${config.badgeText}`}>
                <Icon className="h-3 w-3" />
                {config.label}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-zinc-500">{rec.reason}</p>
          </div>
          {hasSavings && (
            <div className="flex-shrink-0 text-right">
              <div className="font-mono text-2xl font-semibold tabular-nums text-velqen-600">${rec.monthlySavings.toLocaleString()}</div>
              <div className="text-xs text-zinc-400">/ month</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg bg-zinc-50 px-4 py-3">
          <div>
            <p className="data-label mb-1 text-zinc-400">Current</p>
            <p className="text-sm font-medium text-zinc-700">{rec.currentPlanName}</p>
            <p className="font-mono text-sm tabular-nums text-zinc-500">${rec.currentSpend.toLocaleString()}/mo</p>
          </div>

          <ArrowRight className="h-4 w-4 flex-shrink-0 text-zinc-300" />

          <div>
            <p className="data-label mb-1 text-zinc-400">Recommended</p>
            <p className="text-sm font-medium text-zinc-700">{rec.recommendedPlanName}</p>
            <p className={`font-mono text-sm tabular-nums ${hasSavings ? 'text-velqen-600' : 'text-zinc-500'}`}>${rec.recommendedSpend.toLocaleString()}/mo</p>
          </div>
        </div>

        {rec.caveat && <p className="mt-3 border-t border-zinc-50 pt-3 text-xs leading-relaxed text-zinc-400">⚠ {rec.caveat}</p>}

        {hasSavings && (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-velqen-50 px-4 py-2.5">
            <span className="text-xs font-medium text-velqen-700">Annual impact</span>
            <span className="font-mono text-sm font-semibold tabular-nums text-velqen-700">${rec.annualSavings.toLocaleString()} saved per year</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function ToolBreakdown({ recommendations }: ToolBreakdownProps) {
  const withSavings = recommendations.filter((recommendation) => recommendation.monthlySavings > 0)
  const optimal = recommendations.filter((recommendation) => recommendation.monthlySavings === 0)

  return (
    <div className="space-y-4">
      {withSavings.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Recommendations - {withSavings.length} tool{withSavings.length > 1 ? 's' : ''}</h2>
          <div className="space-y-3">
            {withSavings.map((recommendation, index) => (
              <ToolCard key={recommendation.toolId} rec={recommendation} index={index} />
            ))}
          </div>
        </div>
      )}

      {optimal.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none">
            <div className="flex items-center gap-2 py-2 text-sm text-zinc-400 transition-colors hover:text-zinc-600">
              <CheckCircle2 className="h-4 w-4" />
              {optimal.length} tool{optimal.length > 1 ? 's' : ''} already optimized
              <span className="text-xs group-open:hidden">(click to expand)</span>
            </div>
          </summary>
          <div className="mt-2 space-y-3">
            {optimal.map((recommendation, index) => (
              <ToolCard key={recommendation.toolId} rec={recommendation} index={index} />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}