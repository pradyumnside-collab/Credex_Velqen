import { motion } from 'framer-motion'
import { ArrowRight, Zap } from 'lucide-react'

import { Button } from '@/components/ui/button'

type CredexCTAProps = {
  monthlySavings: number
  annualSavings: number
}

export function CredexCTA({ monthlySavings, annualSavings }: CredexCTAProps) {
  if (monthlySavings <= 500) {
    return null
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="rounded-xl3 bg-zinc-900 p-8 sm:p-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-velqen-500">
              <Zap className="h-3.5 w-3.5 fill-white text-white" />
            </div>
            <span className="text-sm font-medium text-velqen-400">Significant savings detected</span>
          </div>
          <h3 className="text-2xl font-semibold text-white">
            You could recover <span className="text-velqen-400">${annualSavings.toLocaleString()}/year</span>
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Credex sources discounted AI infrastructure credits from companies that overforecast. The same tools, at 20 to 40 percent less.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-shrink-0">
          <Button type="button" className="h-10 rounded-lg bg-white px-5 text-sm font-medium text-zinc-900 hover:bg-zinc-100" onClick={() => window.open('https://credex.rocks', '_blank', 'noreferrer')}>
            Book a consultation <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
          <p className="text-center text-xs text-zinc-600">Free · 20 minutes · No commitment</p>
        </div>
      </div>
    </motion.div>
  )
}