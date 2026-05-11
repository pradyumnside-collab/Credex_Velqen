import type { AuditResult } from '@/engine/auditEngine'
import type { ToolRecommendation } from '@/engine/recommendations'

export type AuditToolPublic = {
  toolId: string
  toolName: string
  currentPlanName: string
  recommendedPlanName: string | null
  currentSpend: number
  recommendedSpend: number
  monthlySavings: number
  annualSavings: number
  action: string
  reason: string
  caveat: string | null
}

export type AuditRow = {
  id: string
  slug: string
  team_size: number
  use_case: string
  tools_data: AuditToolPublic[]
  total_monthly_savings: number
  total_annual_savings: number
  high_savings: boolean
  already_optimal: boolean
  redundancy_flagged: boolean
  overlap_detected: boolean
  generated_at: string
  created_at: string
}

export type AuditInsert = {
  slug: string
  team_size: number
  use_case: string
  tools_data: AuditToolPublic[]
  total_monthly_savings: number
  total_annual_savings: number
  high_savings: boolean
  already_optimal: boolean
  redundancy_flagged: boolean
  overlap_detected: boolean
}

export type LeadInsert = {
  audit_id: string | null
  audit_slug: string
  email: string
  company: string | null
  role: string | null
  team_size: string | null
  is_high_savings: boolean
}

export function toPublicToolData(results: ToolRecommendation[]): AuditToolPublic[] {
  return results.map((result) => ({
    toolId: result.toolId,
    toolName: result.toolName,
    currentPlanName: result.currentPlanName,
    recommendedPlanName: result.recommendedPlanName,
    currentSpend: result.currentSpend,
    recommendedSpend: result.recommendedSpend,
    monthlySavings: result.monthlySavings,
    annualSavings: result.annualSavings,
    action: result.action,
    reason: result.reason,
    caveat: result.caveat,
  }))
}

export type SavedAuditSource = AuditResult