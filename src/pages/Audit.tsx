import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { SpendForm } from '@/components/SpendForm/SpendForm'
import { runAudit } from '@/engine/auditEngine'

export function Audit() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900">
              <span className="text-xs font-bold text-white">V</span>
            </div>
            <span className="text-sm font-semibold text-zinc-900">Velqen</span>
          </button>
          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-500 shadow-card">Audit draft - saves locally</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-500 shadow-card">
            <Sparkles className="h-3.5 w-3.5" />
            Audit draft - saves locally
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Run an AI spend audit</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">Add tools, seats, and spend. The form keeps your draft in this browser until you run the audit.</p>
        </motion.div>

        <SpendForm
          className="shadow-card-lg"
          onSubmit={(formData) => {
            const auditResult = runAudit(formData)
            navigate('/results', { state: { auditResult } })
          }}
        />

        <div className="mt-6 flex justify-center">
          <Button variant="ghost" className="text-zinc-500 hover:text-zinc-900" onClick={() => navigate('/')}>
            <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
            Back to home
          </Button>
        </div>
      </main>
    </div>
  )
}