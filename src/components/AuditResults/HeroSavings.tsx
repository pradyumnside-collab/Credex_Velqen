import { motion } from 'framer-motion'
import NumberFlow from '@number-flow/react'
import { AlertCircle, CheckCircle2, TrendingDown } from 'lucide-react'
import type { ComponentType } from 'react'

type HeroSavingsProps = {
  monthlyTotal: number
  annualTotal: number
  status: 'savings' | 'optimal' | 'review'
}

const STATUS_CONFIG: Record<HeroSavingsProps['status'], { badge: string; icon: ComponentType<{ className?: string }>; color: string; bg: string; border: string; label: string }> = {
  savings: { badge: 'Savings found', icon: TrendingDown, color: 'text-velqen-600', bg: 'bg-velqen-50', border: 'border-velqen-100', label: 'Monthly savings' },
  review: { badge: 'Needs review', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', label: 'Estimated recoverable' },
  optimal: { badge: 'Already optimal', icon: CheckCircle2, color: 'text-zinc-500', bg: 'bg-zinc-50', border: 'border-zinc-100', label: 'Monthly savings' },
}

export function HeroSavings({ monthlyTotal, annualTotal, status }: HeroSavingsProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  const hasSavings = monthlyTotal > 0

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className={`rounded-xl3 border ${config.border} ${config.bg} p-8 sm:p-12`}>
      <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${hasSavings ? 'bg-velqen-100' : 'bg-zinc-100'}`}>
              <Icon className={`h-4 w-4 ${config.color}`} />
            </div>
            <span className={`text-sm font-medium ${config.color}`}>{config.badge}</span>
          </div>

          <p className="data-label mb-2 text-zinc-500">{config.label}</p>
          <div className={`font-mono text-6xl font-semibold tabular-nums sm:text-7xl ${hasSavings ? 'text-zinc-900' : 'text-zinc-400'}`}>
            <NumberFlow value={monthlyTotal} format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }} willChange />
          </div>

          {hasSavings && (
            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-sm text-zinc-500">Annual potential</span>
              <span className="font-mono text-xl font-medium tabular-nums text-zinc-900">
                <NumberFlow value={annualTotal} format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }} willChange />
              </span>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-zinc-100 bg-white p-5 shadow-card sm:min-w-[200px]">
          {hasSavings ? (
            <>
              <p className="data-label mb-3 text-zinc-400">Breakdown</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Per month</span>
                  <span className="font-mono font-medium text-zinc-900 tabular-nums">${monthlyTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Per year</span>
                  <span className="font-mono font-medium tabular-nums text-velqen-600">${annualTotal.toLocaleString()}</span>
                </div>
                <div className="border-t border-zinc-100 pt-2">
                  <p className="text-xs leading-relaxed text-zinc-400">Conservative estimates based on verified pricing data.</p>
                </div>
              </div>
            </>
          ) : (
            <div className="py-2 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
              <p className="text-sm font-medium text-zinc-700">Spending well</p>
              <p className="mt-1 text-xs text-zinc-400">No clear optimizations found for this stack.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}