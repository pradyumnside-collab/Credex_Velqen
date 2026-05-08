import { Plus, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useMemo, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { toolOptions } from '@/engine/pricingData'
import { cn } from '@/lib/utils'
import { createDefaultToolRow, useFormPersist, type SpendFormData, type SpendFormToolRow, type UseCase } from './useFormPersist'
import { ToolRow } from './ToolRow'

type SpendFormProps = {
  onSubmit?: (formData: SpendFormData) => void
  onChange?: (formData: SpendFormData) => void
  className?: string
}

const useCaseOptions: Array<{ value: UseCase; label: string }> = [
  { value: 'coding', label: 'Coding' },
  { value: 'writing', label: 'Writing' },
  { value: 'data', label: 'Data' },
  { value: 'research', label: 'Research' },
  { value: 'mixed', label: 'Mixed' },
]

const isPositiveNumber = (value: string) => Number.isFinite(Number(value)) && Number(value) > 0

const isValidToolRow = (toolRow: SpendFormToolRow) => isPositiveNumber(toolRow.monthlySpend) && Number(toolRow.seats) >= 1

export function SpendForm({ onSubmit, onChange, className }: SpendFormProps) {
  const { formData, setFormData } = useFormPersist()

  useEffect(() => {
    onChange?.(formData)
  }, [formData, onChange])

  const selectedToolIds = useMemo(() => formData.tools.map((toolRow) => toolRow.toolId), [formData.tools])
  const isValid = formData.tools.length > 0 && formData.tools.every(isValidToolRow)

  const updateToolRow = (index: number, nextValue: SpendFormToolRow) => {
    setFormData((currentValue) => ({
      ...currentValue,
      tools: currentValue.tools.map((toolRow, toolIndex) => (toolIndex === index ? nextValue : toolRow)),
    }))
  }

  const removeToolRow = (index: number) => {
    setFormData((currentValue) => {
      if (currentValue.tools.length <= 1) {
        return currentValue
      }

      return {
        ...currentValue,
        tools: currentValue.tools.filter((_, toolIndex) => toolIndex !== index),
      }
    })
  }

  const addToolRow = () => {
    setFormData((currentValue) => {
      const nextTool = toolOptions.find((tool) => !currentValue.tools.some((toolRow) => toolRow.toolId === tool.id)) ?? toolOptions[0]

      return {
        ...currentValue,
        tools: [...currentValue.tools, createDefaultToolRow(nextTool.id)],
      }
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isValid) {
      return
    }

    onSubmit?.(formData)
  }

  return (
    <Card className={cn('border-slate-200/80 bg-white/95 shadow-[0_30px_80px_rgba(15,23,42,0.12)]', className)}>
      <form onSubmit={handleSubmit} className="contents">
        <CardHeader className="space-y-3 border-b border-slate-100 bg-slate-50/80 p-6">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          <Sparkles className="h-3.5 w-3.5" />
          Day 2 audit draft
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl text-slate-950 sm:text-3xl">Tell us what your team is paying for</CardTitle>
          <CardDescription className="max-w-2xl text-sm text-slate-600 sm:text-base">
            Add the AI tools your team uses, set the plan and monthly spend for each one, and we’ll keep the draft saved locally while you build.
          </CardDescription>
        </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="team-size">Team size</Label>
            <Input
              id="team-size"
              type="number"
              min="1"
              step="1"
              placeholder="8"
              value={formData.teamSize}
              onChange={(event) => setFormData((currentValue) => ({ ...currentValue, teamSize: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="use-case">Primary use case</Label>
            <Select id="use-case" value={formData.useCase} onChange={(event) => setFormData((currentValue) => ({ ...currentValue, useCase: event.target.value as UseCase }))}>
              {useCaseOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Tracked tools</h4>
              <p className="mt-1 text-sm text-slate-500">Add as many rows as needed. Every row needs a spend above zero and at least one seat.</p>
            </div>

            <Button type="button" variant="outline" onClick={addToolRow} className="border-slate-300 bg-white">
              <Plus className="h-4 w-4" />
              Add tool
            </Button>
          </div>

          <div className="space-y-4">
            {formData.tools.map((toolRow, index) => (
              <ToolRow
                key={`${toolRow.toolId}-${index}`}
                value={toolRow}
                onChange={(nextValue) => updateToolRow(index, nextValue)}
                onRemove={() => removeToolRow(index)}
                canRemove={formData.tools.length > 1}
                disabledToolIds={selectedToolIds}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-slate-950">Saved locally on every change</p>
              <p className="text-sm text-slate-600">Your draft stays in this browser so you can continue the audit later without losing work.</p>
            </div>
          </div>

          <Button type="submit" size="lg" disabled={!isValid} className="min-w-[160px] bg-slate-950 text-white hover:bg-slate-800">
            Run Audit
          </Button>
        </div>

        {!isValid ? (
          <p className="text-sm text-rose-600">Add at least one tool, set a monthly spend greater than zero, and keep seats at one or more.</p>
        ) : (
          <p className="text-sm text-emerald-700">Everything looks valid. The form is ready to run.</p>
        )}
        </CardContent>
      </form>
    </Card>
  )
}