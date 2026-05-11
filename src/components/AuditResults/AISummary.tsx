import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

type AISummaryProps = {
  summary: string | null
  isLoading: boolean
}

function SummarySkeleton() {
  return (
    <div className="space-y-2.5" aria-label="Loading AI summary">
      <div className="skeleton h-4 w-full rounded" />
      <div className="skeleton h-4 w-[92%] rounded" />
      <div className="skeleton h-4 w-[85%] rounded" />
      <div className="skeleton h-4 w-[70%] rounded" />
    </div>
  )
}

export function AISummary({ summary, isLoading }: AISummaryProps) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-900">AI analysis</h3>
        {isLoading && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-zinc-400" />
            Generating
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SummarySkeleton />
          </motion.div>
        ) : (
          <motion.p key="summary" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-sm leading-relaxed text-zinc-600">
            {summary}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}