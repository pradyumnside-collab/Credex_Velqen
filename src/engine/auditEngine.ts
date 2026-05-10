import { resolveCurrentSpend, round2 } from './savingsCalc'
import {
  detectCrossToolRedundancy,
  evaluateToolRecommendation,
  type AuditContext,
  type AuditToolInput,
  type ToolRecommendation,
} from './recommendations'
import { getPlan, resolvePlanId, type ToolId, type UseCase } from './pricingData'

export type AuditFormTool = {
  toolId: ToolId
  planId: string
  monthlySpend: string
  seats: string
}

export type AuditFormData = {
  teamSize: string
  useCase: UseCase
  tools: AuditFormTool[]
}

export type AuditResult = {
  teamSize: number
  useCase: UseCase
  tools: ToolRecommendation[]
  totals: {
    monthly: number
    annual: number
  }
  flags: {
    alreadyOptimal: boolean
    highSavings: boolean
    redundancy: boolean
    overlapDetected: boolean
  }
  consolidationSuggestions?: Array<{
    keeperToolId: string
    planId: string
    planName: string
    estimatedCost: number
    replacedTools: string[]
    savings: number
    caveat: string
  }>
}

const parsePositiveNumber = (value: string | number | undefined, fallback = 1) => {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value ?? '')
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const parseMoney = (value: string | number | undefined) => {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value ?? '')
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

const estimateCurrentSpend = (tool: AuditFormTool, seats: number, reportedSpend: number) => {
  const plan = getPlan(tool.toolId, resolvePlanId(tool.toolId, tool.planId))

  if (!plan) {
    return reportedSpend
  }

  if (plan.billingUnit === 'custom' || plan.usageTier === 'usage-based' || plan.billingUnit.includes('per MTok')) {
    return reportedSpend
  }

  return resolveCurrentSpend(
    reportedSpend,
    plan.monthlyPrice,
    seats,
    plan.minSeats ?? 1,
    plan.monthlyMinimum ?? 0,
  )
}

const normalizeTool = (tool: AuditFormTool): AuditToolInput => {
  const seats = parsePositiveNumber(tool.seats, 1)
  const reportedMonthlySpend = parseMoney(tool.monthlySpend)
  const currentSpend = estimateCurrentSpend(tool, seats, reportedMonthlySpend)
  const usageRatio = reportedMonthlySpend > 0 ? currentSpend / reportedMonthlySpend : 1

  return {
    toolId: tool.toolId,
    planId: tool.planId,
    seats,
    reportedMonthlySpend,
    currentSpend,
    resolvedSpend: currentSpend,
    usageRatio,
  }
}

export function runAudit(formData: AuditFormData): AuditResult {
  const teamSize = parsePositiveNumber(formData.teamSize, 1)
  const tools = formData.tools.map(normalizeTool)

  const context: AuditContext = {
    teamSize,
    useCase: formData.useCase,
    tools,
  }

  const toolResults = tools.map((tool) => evaluateToolRecommendation(tool, context))
  const redundancy = detectCrossToolRedundancy(context)
  const overlapDetected = toolResults.some((tool) => tool.flags.includes('cross-tool-overlap') || tool.flags.includes('coding-overlap'))

  const toolSavings = toolResults.reduce((sum, result) => sum + result.monthlySavings, 0)
  const overlapSavings = redundancy.consolidationOptions
    .filter((option) => option.savings > 0)
    .reduce((max, option) => Math.max(max, option.savings), 0)
  const totalMonthlySavings = round2(toolSavings + overlapSavings)
  const totals = {
    monthly: totalMonthlySavings,
    annual: round2(totalMonthlySavings * 12),
  }

  return {
    teamSize,
    useCase: formData.useCase,
    tools: toolResults,
    totals,
    consolidationSuggestions: redundancy.consolidationOptions,
    flags: {
      alreadyOptimal: totals.monthly === 0,
      highSavings: totals.monthly > 500,
      redundancy: redundancy.redundant,
      overlapDetected,
    },
  }
}

export type { AuditToolInput, ToolRecommendation }