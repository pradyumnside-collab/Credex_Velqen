import { calcAnnualSavings, calcMonthlySavings } from './savingsCalc'
import {
  pricingData,
  getPlan,
  getPlans,
  resolvePlanId,
  type ToolId,
  type ToolPlan,
  type UseCase,
} from './pricingData'

export type RecommendationAction = 'billing-switch' | 'org-feature-tax' | 'plan-downgrade' | 'usage-check' | 'model-rightsizing' | 'optimal'

export type AuditToolInput = {
  toolId: ToolId
  planId: string
  seats: number
  reportedMonthlySpend: number
  currentSpend: number
  usageRatio: number
}

export type AuditContext = {
  teamSize: number
  useCase: UseCase
  tools: AuditToolInput[]
}

export type ToolRecommendation = {
  toolId: ToolId
  toolName: string
  currentPlanId: string
  currentPlanName: string
  currentSpend: number
  recommendedPlanId: string
  recommendedPlanName: string
  recommendedSpend: number
  monthlySavings: number
  annualSavings: number
  recommendation: string
  action: RecommendationAction
  reason: string
  caveat: string | null
  capabilityImpact: 'none' | 'same' | 'tradeoff' | 'usage-dependent'
  isOptimal: boolean
  flags: string[]
}

const capabilityFloorByUseCase: Record<UseCase, 1 | 2 | 3 | 4 | 5> = {
  coding: 3,
  writing: 3,
  data: 2,
  research: 4,
  mixed: 3,
}

const codingTools: ToolId[] = ['cursor', 'github-copilot', 'windsurf']

const currentPlan = (toolId: ToolId, planId: string): ToolPlan => {
  const tool = getPlan(toolId, resolvePlanId(toolId, planId))
  if (tool) {
    return tool
  }

  const fallback = getPlans(toolId)[0]
  if (!fallback) {
    throw new Error(`Unknown plan for tool ${toolId}`)
  }

  return fallback
}

const billablePlanSpend = (plan: ToolPlan, seats: number, reportedSpend: number) => {
  if (plan.billingUnit === 'custom') {
    return reportedSpend
  }

  if (plan.billingUnit.includes('per MTok') || plan.usageTier === 'usage-based') {
    return reportedSpend
  }

  const billableSeats = Math.max(seats, plan.minSeats ?? 1)
  const floorSpend = plan.monthlyMinimum ?? plan.monthlyPrice * billableSeats

  return Math.max(reportedSpend, floorSpend)
}

const requiredCapability = (useCase: UseCase) => capabilityFloorByUseCase[useCase]

const sameCapabilityCandidate = (toolId: ToolId, current: ToolPlan, useCase: UseCase) => {
  const candidates = getPlans(toolId).filter((plan) => {
    if (plan.id === current.id) {
      return false
    }

    return plan.monthlyPrice > 0 || plan.billingUnit !== 'custom'
  })

  return candidates
    .filter((plan) => plan.capabilityScore === current.capabilityScore && plan.bestFor.includes(useCase) && plan.monthlyPrice < current.monthlyPrice)
    .sort((left, right) => left.monthlyPrice - right.monthlyPrice)[0] ?? null
}

const acceptableCheaperCandidate = (toolId: ToolId, current: ToolPlan, useCase: UseCase) => {
  const floor = requiredCapability(useCase)
  const candidates = getPlans(toolId).filter((plan) => {
    if (plan.id === current.id) {
      return false
    }

    return plan.monthlyPrice > 0 || plan.billingUnit !== 'custom'
  })

  return candidates
    .filter((plan) => plan.monthlyPrice < current.monthlyPrice && plan.capabilityScore >= floor && plan.bestFor.includes(useCase))
    .sort((left, right) => left.monthlyPrice - right.monthlyPrice)[0] ?? null
}

const usageBasedCandidateSpend = (current: ToolPlan, candidate: ToolPlan, currentSpend: number) => {
  if (!current.inputPricePerMTok || !candidate.inputPricePerMTok) {
    return currentSpend
  }

  const inputRatio = candidate.inputPricePerMTok / current.inputPricePerMTok
  const outputRatio = current.outputPricePerMTok && candidate.outputPricePerMTok ? candidate.outputPricePerMTok / current.outputPricePerMTok : inputRatio
  const ratio = (inputRatio + outputRatio) / 2

  return Math.max(0, currentSpend * ratio)
}

const makeRecommendation = (
  input: AuditToolInput,
  recommendationPlan: ToolPlan,
  action: RecommendationAction,
  reason: string,
  caveat: string | null,
  capabilityImpact: ToolRecommendation['capabilityImpact'],
  flags: string[] = [],
): ToolRecommendation => {
  const current = currentPlan(input.toolId, input.planId)
  const recommendedSpend = recommendationPlan.billingUnit === 'custom'
    ? input.currentSpend
    : recommendationPlan.usageTier === 'usage-based'
      ? usageBasedCandidateSpend(current, recommendationPlan, input.currentSpend)
      : recommendationPlan.monthlyPrice * Math.max(input.seats, recommendationPlan.minSeats ?? 1)

  const savingsMonthly = calcMonthlySavings(input.currentSpend, recommendedSpend)
  const recommendation =
    action === 'optimal'
      ? 'Already optimal'
      : action === 'billing-switch'
        ? `Switch billing to ${recommendationPlan.name}`
        : action === 'model-rightsizing'
          ? `Rightsize to ${recommendationPlan.name}`
          : action === 'usage-check'
            ? `Check ${recommendationPlan.name} vs current`
            : `Downgrade to ${recommendationPlan.name}`

  return {
    toolId: input.toolId,
    toolName: pricingData[input.toolId].name,
    currentPlanId: current.id,
    currentPlanName: current.name,
    currentSpend: input.currentSpend,
    recommendedPlanId: recommendationPlan.id,
    recommendedPlanName: recommendationPlan.name,
    recommendedSpend,
    monthlySavings: savingsMonthly,
    annualSavings: calcAnnualSavings(savingsMonthly),
    recommendation,
    action,
    reason,
    caveat,
    capabilityImpact,
    isOptimal: savingsMonthly === 0 && action === 'optimal',
    flags,
  }
}

const directPlanDowngrade = (input: AuditToolInput, candidate: ToolPlan, reason: string, caveat: string, flags: string[] = []) =>
  makeRecommendation(input, candidate, 'plan-downgrade', reason, caveat, 'same', flags)

const usageCheck = (input: AuditToolInput, candidate: ToolPlan, reason: string, caveat: string, flags: string[] = []) =>
  makeRecommendation(input, candidate, 'usage-check', reason, caveat, 'usage-dependent', flags)

const modelRightsizing = (input: AuditToolInput, candidate: ToolPlan, reason: string, caveat: string, flags: string[] = []) =>
  makeRecommendation(input, candidate, 'model-rightsizing', reason, caveat, 'usage-dependent', flags)

const optimal = (input: AuditToolInput, reason: string, caveat: string | null, flags: string[] = []) => {
  const plan = currentPlan(input.toolId, input.planId)
  return makeRecommendation(input, plan, 'optimal', reason, caveat, 'none', flags)
}

const orgFeatureTax = (input: AuditToolInput, candidate: ToolPlan, reason: string, caveat: string, flags: string[] = []) =>
  makeRecommendation(input, candidate, 'org-feature-tax', reason, caveat, 'same', flags)

const billingSwitch = (input: AuditToolInput, candidate: ToolPlan, reason: string, caveat: string, flags: string[] = []) =>
  makeRecommendation(input, candidate, 'billing-switch', reason, caveat, 'same', flags)

function auditCursor(input: AuditToolInput, context: AuditContext) {
  const plan = currentPlan(input.toolId, input.planId)

  if (plan.id === 'teams' && context.teamSize <= 3) {
    const pro = currentPlan('cursor', 'pro')
    return orgFeatureTax(
      input,
      pro,
      'Cursor Teams is carrying org features, not extra model capability, for a small team.',
      'Assumes no SSO, policy, or central billing requirement; if those are mandatory, Teams remains justified.',
      ['small-team-org-fee'],
    )
  }

  const cheaperSameCapability = sameCapabilityCandidate('cursor', plan, context.useCase)
  if (cheaperSameCapability) {
    return directPlanDowngrade(
      input,
      cheaperSameCapability,
      'A cheaper Cursor plan provides the same capability for this use case.',
      'If the team hits request limits on the cheaper tier, this downgrade stops being safe.',
      ['same-capability'],
    )
  }

  const cheaperSupported = acceptableCheaperCandidate('cursor', plan, context.useCase)
  if (cheaperSupported && plan.capabilityScore > cheaperSupported.capabilityScore) {
    return usageCheck(
      input,
      cheaperSupported,
      'A lower Cursor tier still appears sufficient for the stated coding workflow.',
      'This assumes the team is not relying on the extra request headroom that comes with the current tier.',
      ['usage-headroom'],
    )
  }

  return optimal(input, 'Current Cursor plan looks aligned to the stated workload.', 'No change is justified from the information provided.')
}

function auditGitHubCopilot(input: AuditToolInput, context: AuditContext) {
  const plan = currentPlan(input.toolId, input.planId)

  if (plan.id === 'business' && context.teamSize <= 1) {
    const pro = currentPlan('github-copilot', 'pro')
    return orgFeatureTax(
      input,
      pro,
      'Copilot Business is adding org controls that a solo developer usually does not need.',
      'If the account is managed under a team policy or needs IP indemnity, Business may still be required.',
      ['solo-org-fee'],
    )
  }

  if (plan.id === 'enterprise' && context.teamSize < 50) {
    const business = currentPlan('github-copilot', 'business')
    return orgFeatureTax(
      input,
      business,
      'Copilot Enterprise is reserved for larger or compliance-heavy teams.',
      'If SAML, compliance, or enterprise support is mandatory, this downgrade is not valid.',
      ['enterprise-overkill'],
    )
  }

  const cheaperSameCapability = sameCapabilityCandidate('github-copilot', plan, context.useCase)
  if (cheaperSameCapability) {
    return directPlanDowngrade(
      input,
      cheaperSameCapability,
      'Copilot has a cheaper plan with the same coding capability.',
      'This only holds if the team does not need the current plan’s org features.',
      ['same-capability'],
    )
  }

  const cheaperSupported = acceptableCheaperCandidate('github-copilot', plan, context.useCase)
  if (cheaperSupported && plan.capabilityScore > cheaperSupported.capabilityScore) {
    return usageCheck(
      input,
      cheaperSupported,
      'Copilot can likely be stepped down without losing the stated use-case fit.',
      'If the team depends on premium request caps or enterprise governance, keep the current tier.',
      ['usage-headroom'],
    )
  }

  return optimal(input, 'Current Copilot plan looks aligned to the team size and coding workload.', 'No cheaper same-purpose plan is clearly justified.')
}

function auditClaude(input: AuditToolInput, context: AuditContext) {
  const plan = currentPlan(input.toolId, input.planId)

  if (plan.id === 'team-standard' || plan.id === 'team-premium') {
    const minimumSeats = plan.minSeats ?? 1

    if (input.seats < minimumSeats) {
      const pro = currentPlan('claude', 'pro')
      return directPlanDowngrade(
        input,
        pro,
        'Claude Team is being evaluated against fewer seats than the plan minimum expects.',
        'If the team actually needs shared workspace, seat pooling, or admin controls, keep the team plan.',
        ['team-minimum'],
      )
    }

    if (plan.id === 'team-premium') {
      const pro = currentPlan('claude', 'pro')

      if (context.useCase === 'data' || context.useCase === 'writing' || context.useCase === 'mixed') {
        return directPlanDowngrade(
          input,
          pro,
          'Claude Pro is enough for this workflow and avoids paying for Team Premium headroom.',
          'This assumes the team does not need Claude workspace features or centralized team controls.',
          ['usage-headroom'],
        )
      }

      const standard = currentPlan('claude', 'team-standard')
      return usageCheck(
        input,
        standard,
        'Team Premium is paying for extra usage headroom that may not be required.',
        'Keep Team Premium if the current workflow is already pressing against the lower team tier.',
        ['quota-headroom'],
      )
    }
  }

  if (plan.id === 'max-20x') {
    const max5x = currentPlan('claude', 'max-5x')
    return usageCheck(
      input,
      max5x,
      'Max 20× is a high-headroom tier that should be justified by actual usage pressure.',
      'Only keep this plan if usage logs show Max 5× is regularly exhausted.',
      ['high-usage-tier'],
    )
  }

  if (plan.id === 'max-5x') {
    const cheaperSupported = acceptableCheaperCandidate('claude', plan, context.useCase)
    if (cheaperSupported && cheaperSupported.id === 'pro') {
      return usageCheck(
        input,
        cheaperSupported,
        'Claude Pro may be enough if the team is not actually hitting Max limits.',
        'This is safe only if the current workflow does not depend on the extra message quota.',
        ['quota-headroom'],
      )
    }
  }

  const cheaperSameCapability = sameCapabilityCandidate('claude', plan, context.useCase)
  if (cheaperSameCapability) {
    return directPlanDowngrade(
      input,
      cheaperSameCapability,
      'Claude has a cheaper plan with equivalent capability for this use case.',
      'Do not downgrade if the current plan’s usage ceiling is already being hit.',
      ['same-capability'],
    )
  }

  const cheaperSupported = acceptableCheaperCandidate('claude', plan, context.useCase)
  if (cheaperSupported && plan.capabilityScore > cheaperSupported.capabilityScore) {
    return usageCheck(
      input,
      cheaperSupported,
      'A lower Claude tier still looks sufficient for the stated workload.',
      'This assumes the team is not already hitting the current plan’s usage cap.',
      ['usage-headroom'],
    )
  }

  return optimal(input, 'Current Claude plan looks defensible for the stated workload.', 'No lower tier can be justified without more usage data.')
}

function auditChatGPT(input: AuditToolInput, context: AuditContext) {
  const plan = currentPlan(input.toolId, input.planId)

  if (plan.id === 'business-monthly' && input.seats >= 2) {
    const annual = currentPlan('chatgpt', 'business-annual')
    return billingSwitch(
      input,
      annual,
      'ChatGPT Business Monthly can be moved to the annual billing option without losing capability.',
      'Only switch if the team is committed to the product for 12+ months.',
      ['billing-switch'],
    )
  }

  if ((plan.id === 'business-monthly' || plan.id === 'business-annual') && input.seats === 1) {
    const plus = currentPlan('chatgpt', 'plus')
    return orgFeatureTax(
      input,
      plus,
      'A single-seat ChatGPT Business plan is paying for workspace features that are unlikely to be used.',
      'If the account needs enterprise data boundaries or workspace controls, keep Business.',
      ['solo-org-fee'],
    )
  }

  if (plan.id === 'enterprise' && context.teamSize < 150) {
    const teamPlan = input.seats >= 2 ? currentPlan('chatgpt', 'business-annual') : currentPlan('chatgpt', 'plus')
    return orgFeatureTax(
      input,
      teamPlan,
      'ChatGPT Enterprise is only justified for very large seat counts or strict procurement needs.',
      'If the company has a mandated enterprise contract or SSO requirement, keep Enterprise.',
      ['enterprise-overkill'],
    )
  }

  const cheaperSameCapability = sameCapabilityCandidate('chatgpt', plan, context.useCase)
  if (cheaperSameCapability) {
    return directPlanDowngrade(
      input,
      cheaperSameCapability,
      'ChatGPT has a cheaper plan with equivalent capability for this use case.',
      'This assumes the team is not depending on the higher-tier reasoning quota.',
      ['same-capability'],
    )
  }

  const cheaperSupported = acceptableCheaperCandidate('chatgpt', plan, context.useCase)
  if (cheaperSupported && plan.capabilityScore > cheaperSupported.capabilityScore) {
    return usageCheck(
      input,
      cheaperSupported,
      'ChatGPT can likely step down to a lower tier without changing the core use case.',
      'This is only valid if the current plan’s extra reasoning limits are not being used.',
      ['usage-headroom'],
    )
  }

  return optimal(input, 'Current ChatGPT plan looks aligned to the stated usage.', 'No lower tier is clearly safe from the data provided.')
}

function auditAnthropicApi(input: AuditToolInput, context: AuditContext) {
  const plan = currentPlan(input.toolId, input.planId)
  const flatAlternative = context.teamSize >= 5 ? currentPlan('claude', 'team-standard') : currentPlan('claude', 'pro')
  const flatCost = billablePlanSpend(flatAlternative, input.seats, input.currentSpend)

  if (input.currentSpend > flatCost) {
    if (plan.id === 'opus-4-6') {
      const sonnet = currentPlan('anthropic-api', 'sonnet-4-6')
      return modelRightsizing(
        input,
        sonnet,
        'Claude Opus looks overspecified relative to the lower-cost subscription alternative.',
        'Only downgrade if the workload does not actually need the extra reasoning depth of Opus.',
        ['api-vs-flat'],
      )
    }

    if (plan.id === 'sonnet-4-6') {
      const haiku = currentPlan('anthropic-api', 'haiku-4-5')
      return modelRightsizing(
        input,
        haiku,
        'Claude Sonnet appears more expensive than a lower-capability model for the same workload class.',
        'This is only valid for extraction, summarisation, or similar lightweight tasks.',
        ['api-vs-flat'],
      )
    }

    return usageCheck(
      input,
      flatAlternative,
      'The API spend appears higher than the comparable flat subscription alternative.',
      'We need actual token mix and prompt complexity before making a hard switch recommendation.',
      ['api-cost-higher-than-flat'],
    )
  }

  return optimal(input, 'Usage-based Claude API spend appears cheaper than the flat plan alternative.', 'No cheaper flat plan is justified by the current spend.')
}

function auditOpenAIApi(input: AuditToolInput, context: AuditContext) {
  const plan = currentPlan(input.toolId, input.planId)
  const flatAlternative = context.teamSize >= 2 ? currentPlan('chatgpt', 'business-monthly') : currentPlan('chatgpt', 'plus')
  const flatCost = billablePlanSpend(flatAlternative, input.seats, input.currentSpend)

  if (input.currentSpend > flatCost) {
    if (plan.id === 'gpt-5-5') {
      const gpt54 = currentPlan('openai-api', 'gpt-5-4')
      return modelRightsizing(
        input,
        gpt54,
        'GPT-5.5 is likely oversized if the workload is paying more than a comparable flat plan.',
        'Only downgrade if the current tasks do not need the stronger reasoning tier.',
        ['api-vs-flat'],
      )
    }

    if (plan.id === 'gpt-5-4') {
      const mini = currentPlan('openai-api', 'gpt-5-4-mini')
      return modelRightsizing(
        input,
        mini,
        'GPT-5.4 may be more expensive than the task actually needs.',
        'Only use the mini tier for extraction, simple writing, or classification work.',
        ['api-vs-flat'],
      )
    }

    return usageCheck(
      input,
      flatAlternative,
      'The API spend appears higher than the analogous flat ChatGPT plan.',
      'We need token-level usage data before making this a hard recommendation.',
      ['api-cost-higher-than-flat'],
    )
  }

  return optimal(input, 'OpenAI API usage appears cheaper than the flat plan alternative.', 'No flat subscription switch is clearly cheaper.')
}

function auditGemini(input: AuditToolInput, context: AuditContext) {
  const plan = currentPlan(input.toolId, input.planId)
  const hasClaude = context.tools.some((tool) => tool.toolId === 'claude')
  const hasChatGPT = context.tools.some((tool) => tool.toolId === 'chatgpt')

  if (hasClaude || hasChatGPT) {
    return usageCheck(
      input,
      plan,
      'Gemini overlaps with Claude or ChatGPT in the same conversational workstream.',
      'If Gemini serves a distinct workflow such as Workspace integration, the overlap flag can be ignored.',
      ['cross-tool-overlap'],
    )
  }

  return optimal(input, 'No meaningful overlap detected for Gemini.', 'No alternative is clearly cheaper for the stated use case.')
}

function auditWindsurf(input: AuditToolInput, context: AuditContext) {
  const plan = currentPlan(input.toolId, input.planId)

  if (context.useCase === 'coding') {
    const cursor = currentPlan('cursor', 'pro')

    if ((plan.id === 'teams' || plan.id === 'max') && input.seats <= 3) {
      return directPlanDowngrade(
        input,
        cursor,
        'Cursor Pro delivers the same coding-use-case capability at a lower price for a small team.',
        'If the team is actually using Windsurf-specific workflow features, this comparison is invalid.',
        ['coding-overlap'],
      )
    }

    if (plan.capabilityScore > cursor.capabilityScore) {
      return usageCheck(
        input,
        cursor,
        'Windsurf appears to be carrying extra headroom that a cheaper coding assistant can provide.',
        'If the team regularly hits Windsurf limits, the higher tier may still be justified.',
        ['usage-headroom'],
      )
    }
  }

  return optimal(input, 'Current Windsurf plan looks aligned to the coding workload.', 'No cheaper coding-first plan is clearly safer.')
}

export function detectCrossToolRedundancy(context: AuditContext) {
  const codingToolCount = context.tools.filter((tool) => codingTools.includes(tool.toolId) && tool.currentSpend > 0).length
  const smallTeam = context.teamSize <= 3
  const redundant = (context.teamSize <= 1 && codingToolCount >= 2) || (smallTeam && codingToolCount >= 3)

  // Simple consolidation option finder: try to replace multiple coding tools with one subscription plan
  const consolidationOptions: Array<{
    keeperToolId: ToolId
    planId: string
    planName: string
    estimatedCost: number
    replacedTools: string[]
    savings: number
    caveat: string
  }> = []

  try {
    const codingToolsInContext = context.tools.filter((t) => codingTools.includes(t.toolId) && t.currentSpend > 0)
    if (codingToolsInContext.length >= 2) {
      const replacedSpend = codingToolsInContext.reduce((s, t) => s + t.currentSpend, 0)
      const requiredCapability = Math.max(...codingToolsInContext.map((t) => (getPlans(t.toolId).find((p) => p.id === t.planId)?.capabilityScore ?? 1)))

      // for each candidate tool that targets coding, find a plan that can replace
      for (const key of Object.keys(pricingData) as ToolId[]) {
        const tool = pricingData[key]
        for (const plan of tool.plans) {
          if (!plan.bestFor.includes('coding')) continue
          if (plan.capabilityScore < requiredCapability) continue

          const candidateCost = plan.billingUnit === 'custom' ? Number.MAX_SAFE_INTEGER : (plan.usageTier === 'usage-based' ? replacedSpend : (plan.monthlyMinimum ?? plan.monthlyPrice * Math.max(context.teamSize, plan.minSeats ?? 1)))
          if (candidateCost < replacedSpend) {
            consolidationOptions.push({
              keeperToolId: key,
              planId: plan.id,
              planName: plan.name,
              estimatedCost: candidateCost,
              replacedTools: codingToolsInContext.map((t) => t.toolId),
              savings: replacedSpend - candidateCost,
              caveat: 'May lose specialized integrations or per-user workflows; validate request limits and org features.',
            })
          }
        }
      }
    }
  } catch (e) {
    // best-effort only; do not throw the audit for consolidation heuristics
  }

  return {
    redundant,
    codingToolCount,
    reason: redundant
      ? 'A small team is paying for multiple coding assistants with overlapping value.'
      : 'No cross-tool redundancy threshold was reached.',
    consolidationOptions,
  }
}

// Cross-vendor candidate finder for single-plan audits
function findCrossVendorCandidate(input: AuditToolInput, context: AuditContext) {
  const current = currentPlan(input.toolId, input.planId)
  const currentCost = input.currentSpend
  const floor = requiredCapability(context.useCase)
  let best: { toolId: ToolId; plan: ToolPlan; cost: number; savings: number } | null = null

  for (const key of Object.keys(pricingData) as ToolId[]) {
    if (key === input.toolId) continue
    if (pricingData[key].category !== pricingData[input.toolId].category) continue
    const tool = pricingData[key]
    for (const plan of tool.plans) {
      if (!plan.bestFor.includes(context.useCase)) continue
      if (plan.orgFeatures && !current.orgFeatures) continue
      if (plan.capabilityScore < floor) continue

      let candidateCost = Number.MAX_SAFE_INTEGER
      if (plan.billingUnit === 'custom') continue
      if (plan.usageTier === 'usage-based') {
        // approximate using token-price ratios when available
        candidateCost = usageBasedCandidateSpend(current, plan, currentCost)
      } else {
        candidateCost = plan.monthlyMinimum ?? plan.monthlyPrice * Math.max(input.seats, plan.minSeats ?? 1)
      }

      if (candidateCost < currentCost) {
        const savings = currentCost - candidateCost
        if (!best || savings > best.savings) {
          best = { toolId: key, plan, cost: candidateCost, savings }
        }
      }
    }
  }

  return best
}

export function evaluateToolRecommendation(input: AuditToolInput, context: AuditContext): ToolRecommendation {
  // First run the per-tool rules
  let base: ToolRecommendation
  switch (input.toolId) {
    case 'cursor':
      base = auditCursor(input, context)
      break
    case 'github-copilot':
      base = auditGitHubCopilot(input, context)
      break
    case 'claude':
      base = auditClaude(input, context)
      break
    case 'chatgpt':
      base = auditChatGPT(input, context)
      break
    case 'anthropic-api':
      base = auditAnthropicApi(input, context)
      break
    case 'openai-api':
      base = auditOpenAIApi(input, context)
      break
    case 'gemini':
      base = auditGemini(input, context)
      break
    case 'windsurf':
      base = auditWindsurf(input, context)
      break
    default:
      base = optimal(input, 'No recommendation available.', 'The tool was not recognised.')
      break
  }

  // If per-tool rules produced no change (optimal), try cross-vendor single-plan comparison
  try {
    if (context.tools.length === 1 && base.action === 'optimal') {
      const cross = findCrossVendorCandidate(input, context)
      if (cross) {
        const current = currentPlan(input.toolId, input.planId)
        const caveat = `Cross-vendor candidate ${pricingData[cross.toolId].name} ${cross.plan.name} — validate org features and request limits.`
        if (cross.plan.capabilityScore >= current.capabilityScore) {
          return makeRecommendation(input, cross.plan, 'plan-downgrade', 'Cheaper cross-vendor plan provides equal or higher capability for this use case.', caveat, 'same', ['cross-vendor'])
        }

        return makeRecommendation(input, cross.plan, 'usage-check', 'Cheaper cross-vendor plan exists but may be lower capability; review tradeoffs.', caveat, 'tradeoff', ['cross-vendor-tradeoff'])
      }
    }
  } catch (e) {
    // ignore cross-vendor failures
  }

  return base
}
