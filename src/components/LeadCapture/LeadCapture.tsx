import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Copy, ExternalLink, Loader2, X } from 'lucide-react'

import { saveAudit, saveLead } from '@/api/supabase'
import { sendAuditConfirmation } from '@/api/email'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HoneypotField } from './HoneypotField'
import type { AuditResult } from '@/engine/auditEngine'

interface LeadCaptureProps {
  auditResult: AuditResult
  onClose: () => void
  onSuccess: (slug: string) => void
}

type Step = 'form' | 'submitting' | 'success'

function getAppBaseUrl(): string {
  if (import.meta.env.VITE_APP_BASE_URL) {
    return import.meta.env.VITE_APP_BASE_URL
  }

  return typeof window !== 'undefined' ? window.location.origin : ''
}

export function LeadCapture({ auditResult, onClose, onSuccess }: LeadCaptureProps) {
  const [step, setStep] = useState<Step>('form')
  const [error, setError] = useState<string | null>(null)
  const [emailWarning, setEmailWarning] = useState<string | null>(null)
  const [slug, setSlug] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')

  const shareUrl = slug ? `${getAppBaseUrl()}/audit/${slug}` : null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (honeypot !== '') {
      return
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setStep('submitting')

    const auditSave = await saveAudit(auditResult)
    if (!auditSave.success) {
      setError(auditSave.error)
      setStep('form')
      return
    }

    const { slug: newSlug } = auditSave

    const leadSave = await saveLead({
      audit_id: null,
      audit_slug: newSlug,
      email: email.trim(),
      company: company.trim() || null,
      role: role.trim() || null,
      team_size: String(auditResult.teamSize),
      is_high_savings: auditResult.flags.highSavings,
    })

    if (!leadSave.success) {
      setError(leadSave.rateLimited ? leadSave.error : 'Failed to save your contact details. Please try again.')
      setStep('form')
      return
    }

    setSlug(newSlug)
    setStep('success')
    onSuccess(newSlug)

    const emailResult = await sendAuditConfirmation({
      email: email.trim(),
      monthlyTotal: auditResult.totals.monthly,
      annualTotal: auditResult.totals.annual,
      highSavings: auditResult.flags.highSavings,
      slug: newSlug,
      teamSize: auditResult.teamSize,
      useCase: auditResult.useCase,
      toolCount: auditResult.tools.length,
    })

    if (!emailResult.success) {
      setEmailWarning(`Audit saved, but confirmation email was not sent: ${emailResult.error}`)
      console.warn('[LeadCapture] Email send failed (non-fatal):', emailResult.error)
    }
  }

  async function copyLink() {
    if (!shareUrl) {
      return
    }

    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md overflow-hidden rounded-xl3 bg-white shadow-hero"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <AnimatePresence mode="wait">
          {(step === 'form' || step === 'submitting') && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8"
            >
              <div className="mb-6">
                <p className="data-label mb-2 text-zinc-400">Save your audit</p>
                <h2 className="text-xl font-semibold text-zinc-900">Get your full report</h2>
                <p className="mt-1.5 text-sm text-zinc-500">We&apos;ll email your savings report and generate a shareable link. No account required.</p>
              </div>

              {auditResult.totals.monthly > 0 && (
                <div className="mb-6 rounded-lg border border-velqen-100 bg-velqen-50 px-4 py-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-velqen-700">Monthly savings found</span>
                    <span className="font-mono font-semibold tabular-nums text-velqen-700">${auditResult.totals.monthly.toLocaleString()}/mo</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <HoneypotField value={honeypot} onChange={setHoneypot} />

                <div className="space-y-1.5">
                  <Label htmlFor="lc_email" className="text-sm font-medium text-zinc-700">Work email <span className="text-zinc-400">(required)</span></Label>
                  <Input
                    id="lc_email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                    className="h-10 border-zinc-200 text-sm focus:border-zinc-400 focus:ring-0"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lc_company" className="text-sm font-medium text-zinc-700">Company <span className="text-zinc-400">(optional)</span></Label>
                  <Input
                    id="lc_company"
                    type="text"
                    placeholder="Acme Inc."
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    autoComplete="organization"
                    className="h-10 border-zinc-200 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lc_role" className="text-sm font-medium text-zinc-700">Your role <span className="text-zinc-400">(optional)</span></Label>
                  <Input
                    id="lc_role"
                    type="text"
                    placeholder="Engineering Manager"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    className="h-10 border-zinc-200 text-sm"
                  />
                </div>

                {error && (
                  <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={step === 'submitting'}
                  className="h-11 w-full rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700"
                >
                  {step === 'submitting' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving audit…
                    </>
                  ) : (
                    'Get my report →'
                  )}
                </Button>

                <p className="text-center text-xs text-zinc-400">Your data is stored securely. Share link strips all personal details.</p>
              </form>
            </motion.div>
          )}

          {step === 'success' && shareUrl && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-velqen-50">
                <CheckCircle2 className="h-6 w-6 text-velqen-600" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-zinc-900">Audit saved</h2>
              <p className="mb-6 text-sm text-zinc-500">Check your inbox — we&apos;ve sent your report to <span className="font-medium text-zinc-700">{email}</span>.</p>

              <div className="mb-4 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                <p className="data-label mb-2 text-left text-zinc-400">Shareable link</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate font-mono text-xs text-zinc-600">{shareUrl}</code>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="flex flex-shrink-0 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-velqen-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 border-zinc-200 text-xs text-zinc-700"
                  onClick={() => window.open(shareUrl, '_blank', 'noreferrer')}
                >
                  <ExternalLink className="mr-1.5 h-3 w-3" />
                  Open share page
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="flex-1 bg-zinc-900 text-xs text-white hover:bg-zinc-700"
                  onClick={onClose}
                >
                  Done
                </Button>
              </div>

              {auditResult.flags.highSavings && (
                <p className="mt-4 text-xs leading-relaxed text-zinc-400">Your savings qualify for a Credex consultation — a team member will reach out within 2 business days.</p>
              )}

              {emailWarning && (
                <p className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-left text-xs text-amber-700">
                  {emailWarning}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}