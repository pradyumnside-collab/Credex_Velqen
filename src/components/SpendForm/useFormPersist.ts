import { useEffect, useMemo } from 'react'

import { pricingData, toolOptions, type ToolId } from '@/engine/pricingData'
import { useLocalStorage } from '@/hooks/useLocalStorage'

export type UseCase = 'coding' | 'writing' | 'data' | 'research' | 'mixed'

export type SpendFormToolRow = {
  toolId: ToolId
  planId: string
  monthlySpend: string
  seats: string
}

export type SpendFormData = {
  teamSize: string
  useCase: UseCase
  tools: SpendFormToolRow[]
}

const STORAGE_KEY = 'velqen-spend-form'

const createDefaultToolRow = (toolId: ToolId = 'cursor'): SpendFormToolRow => {
  const tool = pricingData[toolId]

  return {
    toolId,
    planId: tool.defaultPlanId,
    monthlySpend: '',
    seats: '1',
  }
}

export const createInitialSpendForm = (): SpendFormData => ({
  teamSize: '',
  useCase: 'coding',
  tools: [createDefaultToolRow()],
})

const normalizeToolRow = (toolRow: Partial<SpendFormToolRow> | undefined, fallbackIndex: number): SpendFormToolRow => {
  const fallbackTool = toolOptions[fallbackIndex % toolOptions.length] ?? toolOptions[0]
  const nextToolId = toolRow?.toolId && toolOptions.some((option) => option.id === toolRow.toolId) ? toolRow.toolId : fallbackTool.id
  const nextTool = pricingData[nextToolId]
  const nextPlanId = toolRow?.planId && nextTool.plans.some((plan) => plan.id === toolRow.planId) ? toolRow.planId : nextTool.defaultPlanId
  const seatsValue = typeof toolRow?.seats === 'string' ? Number.parseInt(toolRow.seats, 10) : Number.NaN

  return {
    toolId: nextToolId,
    planId: nextPlanId,
    monthlySpend: typeof toolRow?.monthlySpend === 'string' ? toolRow.monthlySpend : '',
    seats: Number.isFinite(seatsValue) && seatsValue > 0 ? String(seatsValue) : '1',
  }
}

const normalizeSpendForm = (value: SpendFormData | null | undefined): SpendFormData => {
  const baseline = createInitialSpendForm()
  if (!value) {
    return baseline
  }

  const cleanedTools = value.tools
    .filter((toolRow): toolRow is SpendFormToolRow => Boolean(toolRow && toolOptions.some((option) => option.id === toolRow.toolId)))
    .map((toolRow, index) => normalizeToolRow(toolRow, index))

  return {
    teamSize: typeof value.teamSize === 'string' ? value.teamSize : baseline.teamSize,
    useCase: value.useCase ?? baseline.useCase,
    tools: cleanedTools.length > 0 ? cleanedTools : baseline.tools,
  }
}

export function useFormPersist() {
  const [savedForm, setSavedForm, clearSavedForm] = useLocalStorage<SpendFormData>(STORAGE_KEY, createInitialSpendForm())

  const normalizedForm = useMemo(() => normalizeSpendForm(savedForm), [savedForm])
  const savedSnapshot = useMemo(() => JSON.stringify(savedForm), [savedForm])
  const normalizedSnapshot = useMemo(() => JSON.stringify(normalizedForm), [normalizedForm])

  useEffect(() => {
    if (savedSnapshot !== normalizedSnapshot) {
      setSavedForm(normalizedForm)
    }
  }, [normalizedForm, normalizedSnapshot, savedSnapshot, setSavedForm])

  return {
    formData: normalizedForm,
    setFormData: setSavedForm,
    clearFormData: clearSavedForm,
  }
}

export { createDefaultToolRow, normalizeSpendForm }