import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Copy, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

type CredexCTAProps = {
  annualSavings: number
  shareUrl: string | null
}

export function CredexCTA({ annualSavings, shareUrl }: CredexCTAProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    if (copyStatus === 'idle') {
      return
    }

    const timeoutId = window.setTimeout(() => setCopyStatus('idle'), 1800)
    return () => window.clearTimeout(timeoutId)
  }, [copyStatus])

  function copyWithFallback(value: string): boolean {
    const textArea = document.createElement('textarea')
    textArea.value = value
    textArea.setAttribute('readonly', '')
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    textArea.style.pointerEvents = 'none'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    let copied = false
    try {
      copied = document.execCommand('copy')
    } catch {
      copied = false
    }

    document.body.removeChild(textArea)
    return copied
  }

  async function handleCopyShareUrl(): Promise<void> {
    if (!shareUrl) {
      return
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
        setCopyStatus('copied')
        return
      }

      const copied = copyWithFallback(shareUrl)
      setCopyStatus(copied ? 'copied' : 'failed')
    } catch {
      const copied = copyWithFallback(shareUrl)
      setCopyStatus(copied ? 'copied' : 'failed')
    }
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
            Save your audit and share the public link with your team. The shared page hides personal details and keeps only audit insights.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-shrink-0">
          <Button
            type="button"
            className="h-10 rounded-lg bg-white px-5 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => handleCopyShareUrl()}
            disabled={!shareUrl}
          >
            {copyStatus === 'copied' ? (
              <>
                Copied <CheckCircle2 className="ml-1.5 h-4 w-4" />
              </>
            ) : copyStatus === 'failed' ? (
              <>
                Copy failed <AlertCircle className="ml-1.5 h-4 w-4" />
              </>
            ) : (
              <>
                Copy share link <Copy className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
          <p className="text-center text-xs text-zinc-600">{shareUrl ?? 'Save report first to generate link'}</p>
        </div>
      </div>
    </motion.div>
  )
}