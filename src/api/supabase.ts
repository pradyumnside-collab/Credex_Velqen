import type { AuditResult } from '@/engine/auditEngine'
import { supabase } from '@/lib/supabaseClient'
import { generateSlug } from '@/utils/generateSlug'
import type { AuditInsert, AuditRow, LeadInsert } from '@/types/audit'
import { toPublicToolData } from '@/types/audit'

export type SaveAuditResult =
  | { success: true; slug: string; id: string }
  | { success: false; error: string }

export async function saveAudit(result: AuditResult): Promise<SaveAuditResult> {
  const slug = generateSlug()

  const row: AuditInsert = {
    slug,
    team_size: result.teamSize,
    use_case: result.useCase,
    tools_data: toPublicToolData(result.tools),
    total_monthly_savings: result.totals.monthly,
    total_annual_savings: result.totals.annual,
    high_savings: result.flags.highSavings,
    already_optimal: result.flags.alreadyOptimal,
    redundancy_flagged: result.flags.redundancy,
    overlap_detected: result.flags.overlapDetected,
  }

  const { data, error } = await supabase
    .from('audits')
    .insert(row)
    .select('id, slug')
    .single()

  if (error || !data) {
    console.error('[saveAudit] Supabase error:', error)
    return { success: false, error: error?.message ?? 'Failed to save audit' }
  }

  return { success: true, slug: data.slug, id: data.id }
}

export type GetAuditResult =
  | { success: true; audit: AuditRow }
  | { success: false; error: string; notFound?: boolean }

export async function getAuditBySlug(slug: string): Promise<GetAuditResult> {
  const { data, error } = await supabase
    .from('audits')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    const notFound = error.code === 'PGRST116'
    return { success: false, error: error.message, notFound }
  }

  return { success: true, audit: data as AuditRow }
}

export type SaveLeadResult =
  | { success: true }
  | { success: false; error: string; rateLimited?: boolean }

const submissionWindowMs = 60 * 60 * 1000
const maxSubmissionsPerHour = 3

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

function getSubmissionHistory(email: string): number[] {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(`velqen_lead_submissions:${normalizeEmail(email)}`)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as number[]
    return Array.isArray(parsed) ? parsed.filter((entry) => Number.isFinite(entry)) : []
  } catch {
    return []
  }
}

function setSubmissionHistory(email: string, history: number[]): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(`velqen_lead_submissions:${normalizeEmail(email)}`, JSON.stringify(history))
}

async function isRateLimited(email: string): Promise<boolean> {
  const cutoff = Date.now() - submissionWindowMs
  const recentHistory = getSubmissionHistory(email).filter((entry) => entry >= cutoff)
  return recentHistory.length >= maxSubmissionsPerHour
}

export async function saveLead(lead: LeadInsert): Promise<SaveLeadResult> {
  const email = normalizeEmail(lead.email)

  if (await isRateLimited(email)) {
    return { success: false, error: 'Too many submissions. Please wait an hour.', rateLimited: true }
  }

  const { error } = await supabase
    .from('leads')
    .insert({
      ...lead,
      email,
    })

  if (error) {
    console.error('[saveLead] Supabase error:', error)
    return { success: false, error: error.message }
  }

  const history = getSubmissionHistory(email)
  history.push(Date.now())
  setSubmissionHistory(email, history)

  return { success: true }
}