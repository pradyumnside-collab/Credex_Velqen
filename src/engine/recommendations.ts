import { calcAnnualSavings, calcMonthlySavings, calcSeatOverprovisionSavings, round2 } from './savingsCalc'
import {
  pricingData,
  getPlan,
  getPlans,
  resolvePlanId,
  type ToolId,
  type ToolPlan,
  type UseCase,
} from './pricingData'

export type RecommendationAction =
  | 'billing-switch'
  | 'org-feature-tax'
  | 'plan-downgrade'
  | 'usage-check'
  | 'model-rightsizing'
  | 'seat-overprovision'
  | 'wrong-use-case'
  | 'spend-discrepancy'
  | 'optimal'

export type AuditToolInput = {
  toolId: ToolId
  planId: string
  seats: number
  reportedMonthlySpend: number
  currentSpend: number
  resolvedSpend: number
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
  recommendedToolId: ToolId
  recommendedToolName: string
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
  spendDiscrepancy: {
    reported: number
    computed: number
    difference: number
    flag: boolean
  } | null
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

const requiredCapability = (useCase: UseCase) => capabilityFloorByUseCase[useCase]

function currentPlanComputedSpend(input: AuditToolInput, plan: ToolPlan) {
  if (plan.billingUnit === 'custom' || plan.usageTier === 'usage-based' || plan.billingUnit.includes('per MTok')) {
    return input.currentSpend
  }

  const effectiveSeats = Math.max(input.seats, plan.minSeats ?? 1)
  const computedSpend = plan.monthlyPrice * effectiveSeats
  const floor = Math.max(computedSpend, plan.monthlyMinimum ?? 0)
  return round2(floor)
}

function buildSpendDiscrepancy(
  input: AuditToolInput,
  computedSpend: number,
): ToolRecommendation['spendDiscrepancy'] {
  const difference = round2(Math.abs(input.reportedMonthlySpend - computedSpend))
  const percentDiff = computedSpend > 0 ? difference / computedSpend : 0

  return {
    reported: round2(input.reportedMonthlySpend),
    computed: round2(computedSpend),
    difference,
    flag: percentDiff > 0.2,
  }
}

const effectiveCandidateCost = (current: ToolPlan, candidate: ToolPlan, input: AuditToolInput) => {
  if (candidate.billingUnit === 'custom') {
    return Number.MAX_SAFE_INTEGER
  }

  if (candidate.usageTier === 'usage-based' || candidate.billingUnit.includes('per MTok')) {
    return usageBasedCandidateSpend(current, candidate, input.currentSpend)
  }

  return candidate.monthlyMinimum ?? candidate.monthlyPrice * Math.max(input.seats, candidate.minSeats ?? 1)
}

const sameCapabilityCandidate = (input: AuditToolInput, useCase: UseCase) => {
  const current = currentPlan(input.toolId, input.planId)
  const toolId = input.toolId
  const candidates = getPlans(toolId).filter((plan) => {
    if (plan.id === current.id) {
      return false
    }

    return plan.billingUnit !== 'custom'
  })

  return candidates
    .map((plan) => ({
      plan,
      effectiveCost: effectiveCandidateCost(current, plan, input),
    }))
    .filter(({ plan, effectiveCost }) => plan.capabilityScore === current.capabilityScore && plan.bestFor.includes(useCase) && effectiveCost < input.currentSpend)
    .sort((left, right) => left.effectiveCost - right.effectiveCost)[0]?.plan ?? null
}

const acceptableCheaperCandidate = (input: AuditToolInput, useCase: UseCase) => {
  const current = currentPlan(input.toolId, input.planId)
  const toolId = input.toolId
  const floor = requiredCapability(useCase)
  const candidates = getPlans(toolId).filter((plan) => {
    if (plan.id === current.id) {
      return false
    }

    return plan.billingUnit !== 'custom'
  })

  return candidates
    .map((plan) => ({
      plan,
      effectiveCost: effectiveCandidateCost(current, plan, input),
    }))
    .filter(({ plan, effectiveCost }) => effectiveCost < input.currentSpend && plan.capabilityScore >= floor && plan.bestFor.includes(useCase))
    .sort((left, right) => left.effectiveCost - right.effectiveCost)[0]?.plan ?? null
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
  recommendationToolId?: ToolId,
): ToolRecommendation => {
  const current = currentPlan(input.toolId, input.planId)
  const effectiveRecommendationToolId = recommendationToolId ?? input.toolId
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
    recommendedToolId: effectiveRecommendationToolId,
    recommendedToolName: pricingData[effectiveRecommendationToolId].name,
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
    spendDiscrepancy: buildSpendDiscrepancy(input, currentPlanComputedSpend(input, current)),
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

function checkSeatOverprovision(
  input: AuditToolInput,
  context: AuditContext,
  plan: ToolPlan,
): ToolRecommendation | null {
  if (plan.billingUnit === 'custom') return null
  if (plan.usageTier === 'usage-based') return null
  if (plan.billingUnit.includes('per MTok')) return null

  const excessSeats = input.seats - context.teamSize
  if (excessSeats <= 0) return null

  const monthlySavings = calcSeatOverprovisionSavings(input.seats, context.teamSize, plan.monthlyPrice)
  if (monthlySavings <= 0) return null

  const projectedSeats = context.teamSize
  const projectedSpend = round2(plan.monthlyPrice * Math.max(projectedSeats, plan.minSeats ?? 1))
  const actualSpend = round2(plan.monthlyPrice * input.seats)

  return {
    toolId: input.toolId,
    toolName: pricingData[input.toolId].name,
    currentPlanId: plan.id,
    currentPlanName: plan.name,
    currentSpend: actualSpend,
    recommendedToolId: input.toolId,
    recommendedToolName: pricingData[input.toolId].name,
    recommendedPlanId: plan.id,
    recommendedPlanName: plan.name,
    recommendedSpend: projectedSpend,
    monthlySavings,
    annualSavings: calcAnnualSavings(monthlySavings),
    recommendation: `Reduce from ${input.seats} to ${projectedSeats} seats`,
    action: 'seat-overprovision',
    reason: `You have ${input.seats} paid seats on ${pricingData[input.toolId].name} ${plan.name} but only ${context.teamSize} people on your team. You are paying for ${excessSeats} seat${excessSeats > 1 ? 's' : ''} that no one is using. At $${plan.monthlyPrice}/seat, that is $${monthlySavings}/month ($${calcAnnualSavings(monthlySavings)}/year) of pure waste with zero capability change.`,
    caveat: 'Verify the actual seat count in your billing dashboard before reducing. Some plans require a minimum seat count.',
    capabilityImpact: 'none',
    isOptimal: false,
    flags: ['seat-overprovision'],
    spendDiscrepancy: buildSpendDiscrepancy(input, actualSpend),
  }
}

function checkWrongUseCase(
  input: AuditToolInput,
  context: AuditContext,
  plan: ToolPlan,
): ToolRecommendation | null {
  const tool = pricingData[input.toolId]

  const isCodingTool = tool.category === 'ai-editor' || tool.category === 'copilot'
  const isNonCodingUseCase = context.useCase !== 'coding' && context.useCase !== 'mixed'

  if (isCodingTool && isNonCodingUseCase && input.currentSpend > 0) {
    return {
      toolId: input.toolId,
      toolName: tool.name,
      currentPlanId: plan.id,
      currentPlanName: plan.name,
      currentSpend: input.currentSpend,
      recommendedToolId: input.toolId,
      recommendedToolName: tool.name,
      recommendedPlanId: 'free',
      recommendedPlanName: 'Free',
      recommendedSpend: 0,
      monthlySavings: input.currentSpend,
      annualSavings: calcAnnualSavings(input.currentSpend),
      recommendation: `Review whether ${tool.name} is needed for a ${context.useCase} team`,
      action: 'wrong-use-case',
      reason: `${tool.name} is a coding-focused AI tool (AI code editor / coding assistant). Your team's stated primary use case is ${context.useCase}. Unless part of the team writes code as a secondary task, this subscription may not be delivering value. If nobody actively uses it, the free tier covers light evaluation.`,
      caveat: 'If part of your team does write code as a secondary task, ignore this flag. This is a review prompt, not a hard recommendation.',
      capabilityImpact: 'tradeoff',
      isOptimal: false,
      flags: ['wrong-use-case'],
      spendDiscrepancy: buildSpendDiscrepancy(input, currentPlanComputedSpend(input, plan)),
    }
  }

  return null
}

function auditCursor(input: AuditToolInput, context: AuditContext) {
  const plan = currentPlan(input.toolId, input.planId)

  const seatCheck = checkSeatOverprovision(input, context, plan)
  if (seatCheck) return seatCheck

  const useCaseCheck = checkWrongUseCase(input, context, plan)
  if (useCaseCheck) return useCaseCheck

  if (plan.id === 'teams' && input.seats <= 3) {
    const pro = currentPlan('cursor', 'pro')
    const projectedSpend = pro.monthlyPrice * input.seats
    const monthlySavings = calcMonthlySavings(input.currentSpend, projectedSpend)
    return orgFeatureTax(
      input,
      pro,
      `Cursor Teams ($40/seat) adds SSO, admin controls, and centralized billing. With ${input.seats} paid seat${input.seats > 1 ? 's' : ''}, these features are unused overhead. Cursor Pro at $20/seat provides identical AI completions and model access. Switching saves $${monthlySavings}/month with no capability change.`,
      'Only keep Teams if SSO or centralized billing is a company policy requirement.',
      ['small-team-org-fee'],
    )
  }

  if (plan.id === 'ultra') {
    const proPlus = currentPlan('cursor', 'pro-plus')
    const projectedSpend = proPlus.monthlyPrice * input.seats
    const monthlySavings = calcMonthlySavings(input.currentSpend, projectedSpend)
    if (monthlySavings > 0) {
      return usageCheck(
        input,
        proPlus,
        `Cursor Ultra at $200/seat is for developers running full agentic workflows for 8+ hours daily. Pro+ at $60/seat covers intensive professional use for most engineers. Unless you are consistently exhausting Pro+ credits, downgrading saves $${monthlySavings}/month.`,
        'Check your Cursor usage dashboard for actual credit consumption before downgrading.',
        ['ultra-headroom'],
      )
    }
  }

  if (plan.id === 'pro-plus') {
    const pro = currentPlan('cursor', 'pro')
    const projectedSpend = pro.monthlyPrice * input.seats
    const monthlySavings = calcMonthlySavings(input.currentSpend, projectedSpend)
    if (monthlySavings > 0) {
      return usageCheck(
        input,
        pro,
        `Cursor Pro+ costs $60/seat for a larger credit pool. Cursor Pro at $20/seat covers most full-time developers who are not running multi-file agentic sessions back-to-back. Downgrading saves $${monthlySavings}/month if you are not hitting Pro's credit limit mid-session.`,
        'If your team regularly sees "credit limit reached" messages before end of day, keep Pro+.',
        ['pro-plus-headroom'],
      )
    }
  }

  const cheaperSameCapability = sameCapabilityCandidate(input, context.useCase)
  if (cheaperSameCapability) {
    return directPlanDowngrade(
      input,
      cheaperSameCapability,
      'A cheaper Cursor plan provides the same capability for this use case.',
      'If the team hits request limits on the cheaper tier, this downgrade stops being safe.',
      ['same-capability'],
    )
  }

  return optimal(input, 'Current Cursor plan matches the stated workload and seat count.', null)
}

function auditGitHubCopilot(input: AuditToolInput, context: AuditContext) {
  const plan = currentPlan(input.toolId, input.planId)

  const seatCheck = checkSeatOverprovision(input, context, plan)
  if (seatCheck) return seatCheck

  const useCaseCheck = checkWrongUseCase(input, context, plan)
  if (useCaseCheck) return useCaseCheck

  if (plan.id === 'business' && input.seats <= 2) {
    const pro = currentPlan('github-copilot', 'pro')
    const projectedSpend = pro.monthlyPrice * input.seats
    const monthlySavings = calcMonthlySavings(input.currentSpend, projectedSpend)
    return orgFeatureTax(
      input,
      pro,
      `GitHub Copilot Business ($19/seat) adds org-wide policy controls, license management, and audit logs. With ${input.seats} paid seat${input.seats > 1 ? 's' : ''}, these features provide zero practical value. Pro at $10/seat provides identical completions and chat. Saves $${monthlySavings}/month.`,
      'If the account is managed under a GitHub organization with IP indemnity requirements, keep Business.',
      ['small-team-org-fee'],
    )
  }

  if (plan.id === 'enterprise' && input.seats < 50) {
    const business = currentPlan('github-copilot', 'business')
    const projectedSpend = business.monthlyPrice * input.seats
    const monthlySavings = calcMonthlySavings(input.currentSpend, projectedSpend)
    return orgFeatureTax(
      input,
      business,
      `GitHub Copilot Enterprise ($39/seat) adds org-wide knowledge indexing and private model fine-tuning. These features deliver meaningful value at 50+ developers or in regulated industries. At ${input.seats} seats, Business at $19/seat covers all standard team needs. Saves $${monthlySavings}/month.`,
      'Keep Enterprise if private model access or SAML SSO is a compliance requirement.',
      ['enterprise-overkill'],
    )
  }

  if (plan.id === 'pro-plus') {
    const target = input.seats >= 5 ? currentPlan('github-copilot', 'business') : currentPlan('github-copilot', 'pro')
    const projectedSpend = target.monthlyPrice * input.seats
    const monthlySavings = calcMonthlySavings(input.currentSpend, projectedSpend)
    if (monthlySavings > 0) {
      return usageCheck(
        input,
        target,
        `GitHub Copilot Pro+ at $39/seat gives access to premium frontier models with very high message limits. ${target.id === 'business' ? `For a team of ${input.seats}, Business at $19/seat provides the same org controls at half the per-seat cost.` : 'Pro at $10/seat provides unlimited completions and chat for most coding workflows.'} Saves $${monthlySavings}/month.`,
        'Only keep Pro+ if your team specifically depends on the premium model tier or very high request caps.',
        ['pro-plus-headroom'],
      )
    }
  }

  return optimal(input, 'Current Copilot plan looks right for the team size and use case.', null)
}

function auditClaude(input: AuditToolInput, context: AuditContext) {
  const plan = currentPlan(input.toolId, input.planId)

  const seatCheck = checkSeatOverprovision(input, context, plan)
  if (seatCheck) return seatCheck

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
    const cheaperSupported = acceptableCheaperCandidate(input, context.useCase)
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

  const cheaperSameCapability = sameCapabilityCandidate(input, context.useCase)
  if (cheaperSameCapability) {
    return directPlanDowngrade(
      input,
      cheaperSameCapability,
      'Claude has a cheaper plan with equivalent capability for this use case.',
      'Do not downgrade if the current plan’s usage ceiling is already being hit.',
      ['same-capability'],
    )
  }

  const cheaperSupported = acceptableCheaperCandidate(input, context.useCase)
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

  const seatCheck = checkSeatOverprovision(input, context, plan)
  if (seatCheck) return seatCheck

  if (plan.id === 'business-monthly' && input.seats >= 2) {
    const annual = currentPlan('chatgpt', 'business-annual')
    const projectedSpend = annual.monthlyPrice * Math.max(input.seats, annual.minSeats ?? 2)
    const monthlySavings = calcMonthlySavings(input.currentSpend, projectedSpend)
    if (monthlySavings > 0) {
      return billingSwitch(
        input,
        annual,
        `ChatGPT Business billed monthly costs $27.10/seat. The annual plan is identical — same features, same limits — at $21.60/seat. At ${input.seats} seats that is $${monthlySavings}/month ($${calcAnnualSavings(monthlySavings)}/year) saved by changing one billing setting.`,
        'Only switch to annual if you expect to continue using ChatGPT Business for 12+ months.',
        ['billing-switch'],
      )
    }
  }

  if ((plan.id === 'business-monthly' || plan.id === 'business-annual') && input.seats === 1) {
    const plus = currentPlan('chatgpt', 'plus')
    const monthlySavings = calcMonthlySavings(input.currentSpend, plus.monthlyPrice)
    if (monthlySavings > 0) {
      return orgFeatureTax(
        input,
        plus,
        `ChatGPT Business is designed for teams: shared workspace, admin controls, and data privacy boundaries. With 1 seat, you get none of those benefits. ChatGPT Plus at $24/month has the same model access and message limits for individual use. Saves $${monthlySavings}/month.`,
        'If the account needs enterprise data isolation or SSO as a company requirement, keep Business.',
        ['solo-org-fee'],
      )
    }
  }

  if (plan.id === 'enterprise' && context.teamSize < 150) {
    const teamPlan = input.seats >= 2 ? currentPlan('chatgpt', 'business-annual') : currentPlan('chatgpt', 'plus')
    return orgFeatureTax(
      input,
      teamPlan,
      `ChatGPT Enterprise is designed for 150+ seat deployments requiring SOC 2 compliance, SAML SSO, and dedicated support. At ${context.teamSize} people, ${teamPlan.name} covers all practical needs at significantly lower cost.`,
      'If the company has a mandated enterprise contract or SSO requirement, keep Enterprise.',
      ['enterprise-overkill'],
    )
  }

  if (plan.id === 'pro') {
    const plus = currentPlan('chatgpt', 'plus')
    const monthlySavings = calcMonthlySavings(input.currentSpend, plus.monthlyPrice)
    if (monthlySavings > 0) {
      return usageCheck(
        input,
        plus,
        `ChatGPT Pro at $128.90/month provides unlimited high-end reasoning model access for heavy power users. Plus at $24/month covers most professional workflows with generous limits. If you are not regularly hitting Plus message caps, downgrading saves $${monthlySavings}/month.`,
        'Check your ChatGPT usage page for actual message limit hits before downgrading.',
        ['usage-headroom'],
      )
    }
  }

  const cheaperSameCapability = sameCapabilityCandidate(input, context.useCase)
  if (cheaperSameCapability) {
    return directPlanDowngrade(
      input,
      cheaperSameCapability,
      'ChatGPT has a cheaper plan with equivalent capability for this use case.',
      'This assumes the team is not depending on the higher-tier reasoning quota.',
      ['same-capability'],
    )
  }

  const cheaperSupported = acceptableCheaperCandidate(input, context.useCase)
  if (cheaperSupported && plan.capabilityScore > cheaperSupported.capabilityScore) {
    return usageCheck(
      input,
      cheaperSupported,
      'ChatGPT can likely step down to a lower tier without changing the core use case.',
      'This is only valid if the current plan’s extra reasoning limits are not being used.',
      ['usage-headroom'],
    )
  }

  return optimal(input, 'Current ChatGPT plan looks aligned to the team size and usage.', null)
}

function auditAnthropicApi(input: AuditToolInput, context: AuditContext) {
  const plan = currentPlan(input.toolId, input.planId)
  const flatAlternative = context.teamSize >= 5 ? currentPlan('claude', 'team-standard') : currentPlan('claude', 'pro')
  const flatCost = currentPlanComputedSpend(input, flatAlternative)

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
  const flatCost = currentPlanComputedSpend(input, flatAlternative)

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

  const seatCheck = checkSeatOverprovision(input, context, plan)
  if (seatCheck) return seatCheck

  const useCaseCheck = checkWrongUseCase(input, context, plan)
  if (useCaseCheck) return useCaseCheck

  if (plan.id === 'max') {
    const pro = currentPlan('windsurf', 'pro')
    const projectedSpend = pro.monthlyPrice * input.seats
    const monthlySavings = calcMonthlySavings(input.currentSpend, projectedSpend)
    if (monthlySavings > 0) {
      return usageCheck(
        input,
        pro,
        `Windsurf Max at $200/seat provides unlimited credits for developers running intensive agentic coding around the clock. Pro at $20/seat includes 500 credits/month — sufficient for full-time professional development. If the team is not exhausting Pro credits before month end, downgrading saves $${monthlySavings}/month.`,
        'Check your Windsurf credit consumption before downgrading.',
        ['high-usage-tier'],
      )
    }
  }

  if (plan.id === 'teams' && input.seats <= 3) {
    const pro = currentPlan('windsurf', 'pro')
    const projectedSpend = pro.monthlyPrice * input.seats
    const monthlySavings = calcMonthlySavings(input.currentSpend, projectedSpend)
    if (monthlySavings > 0) {
      return orgFeatureTax(
        input,
        pro,
        `Windsurf Teams ($40/seat) adds admin dashboard, SSO, and usage analytics. With ${input.seats} paid seat${input.seats > 1 ? 's' : ''}, these features go unused. Pro at $20/seat has the same AI IDE experience and credit pool. Saves $${monthlySavings}/month.`,
        'Keep Teams if SSO or centralized admin is a company requirement.',
        ['small-team-org-fee'],
      )
    }
  }

  return optimal(input, 'Current Windsurf plan matches the stated workload.', null)
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
  } catch {
    // Silently ignore consolidation option errors
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
      if (current.orgFeatures && !plan.orgFeatures) continue
      if (plan.capabilityScore < floor) continue
      if (plan.capabilityScore < current.capabilityScore) continue

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

  try {
    if (context.tools.length === 1 && base.action === 'optimal') {
      const cross = findCrossVendorCandidate(input, context)
      if (cross) {
        const current = currentPlan(input.toolId, input.planId)
        const caveat = `Cross-vendor candidate ${pricingData[cross.toolId].name} ${cross.plan.name} — validate org features and request limits.`
        if (cross.plan.capabilityScore >= current.capabilityScore) {
          return makeRecommendation(input, cross.plan, 'plan-downgrade', 'Cheaper cross-vendor plan provides equal or higher capability for this use case.', caveat, 'same', ['cross-vendor'], cross.toolId)
        }

        return makeRecommendation(input, cross.plan, 'usage-check', 'Cheaper cross-vendor plan exists but may be lower capability; review tradeoffs.', caveat, 'tradeoff', ['cross-vendor-tradeoff'], cross.toolId)
      }
    }
  } catch {
    // Silently ignore cross-vendor candidate search errors
  }

  const plan = currentPlan(input.toolId, input.planId)
  if (plan.billingUnit !== 'custom' && plan.usageTier !== 'usage-based') {
    const computedSpend = currentPlanComputedSpend(input, plan)
    const discrepancy = buildSpendDiscrepancy(input, computedSpend)
    if (discrepancy && discrepancy.flag && discrepancy.difference > 10) {
      return {
        ...base,
        flags: [...base.flags, 'spend-discrepancy'],
        spendDiscrepancy: discrepancy,
      }
    }
  }

  return base
}
