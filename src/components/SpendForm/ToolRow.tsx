import { CircleMinus, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { pricingData, toolOptions, type ToolId } from '@/engine/pricingData'
import type { SpendFormToolRow } from './useFormPersist'

type ToolRowProps = {
  value: SpendFormToolRow
  onChange: (nextValue: SpendFormToolRow) => void
  onRemove: () => void
  canRemove: boolean
  disabledToolIds: ToolId[]
}

export function ToolRow({ value, onChange, onRemove, canRemove, disabledToolIds }: ToolRowProps) {
  const currentTool = pricingData[value.toolId] ?? toolOptions[0]
  const currentPlan = currentTool.plans.find((plan) => plan.id === value.planId) ?? currentTool.plans[0]

  const handleSeatsChange = (nextValue: string) => {
    if (nextValue === '0') {
      onChange({ ...value, seats: '1' })
      return
    }

    onChange({ ...value, seats: nextValue })
  }

  const planLabel = (() => {
    if (currentPlan.priceLabel) {
      return `${currentPlan.name} · ${currentPlan.priceLabel}`
    }

    if (currentPlan.billingUnit === 'custom') {
      return `${currentPlan.name} · Custom`
    }

    if (currentPlan.billingUnit === 'discounted usage') {
      return `${currentPlan.name} · ${currentPlan.billingUnit}`
    }

    if (currentPlan.monthlyPrice === 0) {
      return `${currentPlan.name} · Pay-as-you-go`
    }

    return `${currentPlan.name} · $${currentPlan.monthlyPrice}/mo`
  })()

  return (
    <Card className="tool-card overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-card transition-shadow hover:shadow-card-lg">
      <CardContent className="p-0">
        <div className="border-b border-zinc-100 bg-zinc-50/70 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">AI tool</p>
              <h3 className="text-xl font-semibold text-zinc-900">{currentTool.name}</h3>
              <p className="text-sm text-zinc-600">{planLabel}</p>
            </div>

            <Button type="button" variant="ghost" size="sm" onClick={onRemove} disabled={!canRemove} className="self-start text-zinc-500">
              <CircleMinus className="h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_0.8fr_0.8fr]">
            <div className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <Label htmlFor={`tool-${value.toolId}`} className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Tool
              </Label>
              <Select
                id={`tool-${value.toolId}`}
                value={value.toolId}
                onChange={(event) => {
                  const nextToolId = event.target.value as ToolId
                  const nextTool = pricingData[nextToolId]
                  onChange({
                    ...value,
                    toolId: nextToolId,
                    planId: nextTool.defaultPlanId,
                  })
                }}
              >
                {toolOptions.map((tool) => (
                  <option key={tool.id} value={tool.id} disabled={disabledToolIds.includes(tool.id) && tool.id !== value.toolId}>
                    {tool.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-4 py-7 shadow-sm">
              <Label htmlFor={`plan-${value.toolId}`} className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Plan
              </Label>
              <Select
                className='w-40'
                id={`plan-${value.toolId}`}
                value={value.planId}
                onChange={(event) => onChange({ ...value, planId: event.target.value })}
              >
                {currentTool.plans.map((plan: typeof currentTool['plans'][number]) => {
                  if (plan.priceLabel) {
                    return (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} · {plan.priceLabel}
                      </option>
                    )
                  }
                  if (plan.monthlyPrice === 0) {
                    return (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} · Pay-as-you-go
                      </option>
                    )
                  }
                  return (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} · ${plan.monthlyPrice}/mo
                    </option>
                  )
                })}
              </Select>
            </div>

            <div className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <Label htmlFor={`spend-${value.toolId}`} className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Monthly spend
              </Label>
              <Input
                id={`spend-${value.toolId}`}
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                placeholder="20"
                value={value.monthlySpend}
                onChange={(event) => onChange({ ...value, monthlySpend: event.target.value })}
                className="h-11"
              />
            </div>

            <div className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <Label htmlFor={`seats-${value.toolId}`} className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Seats
              </Label>
              <Input
                id={`seats-${value.toolId}`}
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                placeholder="1"
                value={value.seats}
                onChange={(event) => handleSeatsChange(event.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
            <span>Source: official pricing at {currentTool.sourceUrl.replace('https://', '')}</span>
            <a className="inline-flex items-center gap-1 font-medium text-zinc-900 hover:underline" href={currentTool.sourceUrl} target="_blank" rel="noreferrer">
              View pricing
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}