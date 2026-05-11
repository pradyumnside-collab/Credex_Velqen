import { AlertCircle, CheckCircle2, RefreshCw, Tag, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import type { AuditResult } from '@/engine/auditEngine'

type AuditSidebarProps = {
  result: AuditResult
  onShare?: () => void
}

export function AuditSidebar({ result, onShare }: AuditSidebarProps) {
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-100 bg-white p-5 shadow-card">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900">Audit summary</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-sm">
            <Users className="h-4 w-4 flex-shrink-0 text-zinc-400" />
            <span className="text-zinc-500">Team size</span>
            <span className="ml-auto font-medium text-zinc-900">{result.teamSize}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <Tag className="h-4 w-4 flex-shrink-0 text-zinc-400" />
            <span className="text-zinc-500">Use case</span>
            <span className="ml-auto font-medium capitalize text-zinc-900">{result.useCase}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            {result.flags.redundancy ? <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-velqen-500" />}
            <span className="text-zinc-500">Redundancy</span>
            <span className={`ml-auto font-medium ${result.flags.redundancy ? 'text-amber-600' : 'text-velqen-600'}`}>{result.flags.redundancy ? 'Flagged' : 'None'}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            {result.flags.overlapDetected ? <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-velqen-500" />}
            <span className="text-zinc-500">Overlap</span>
            <span className={`ml-auto font-medium ${result.flags.overlapDetected ? 'text-amber-600' : 'text-velqen-600'}`}>{result.flags.overlapDetected ? 'Detected' : 'None'}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
        <p className="text-xs leading-relaxed text-zinc-500">All savings are conservative estimates based on verified vendor pricing. Actual savings depend on negotiated rates and usage patterns.</p>
      </div>

      <div className="space-y-2">
        <Button variant="outline" className="w-full justify-center border-zinc-200 text-zinc-700 hover:text-zinc-900" onClick={() => navigate('/audit')}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Run another audit
        </Button>
        {onShare && (
          <Button variant="outline" className="w-full justify-center border-zinc-200 text-zinc-700 hover:text-zinc-900" onClick={onShare}>
            Share this audit
          </Button>
        )}
      </div>
    </div>
  )
}