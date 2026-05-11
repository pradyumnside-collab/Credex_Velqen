import type { AuditResult } from '@/engine/auditEngine'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5'
const TIMEOUT_MS = 6000

function buildPrompt(result: AuditResult): string {
  const { tools, totals, teamSize, useCase } = result

  const toolSummaries = tools
    .map((recommendation) => {
      if (recommendation.monthlySavings > 0) {
        return `${recommendation.toolName} (${recommendation.currentPlanName} -> ${recommendation.recommendedPlanName}, saves $${recommendation.monthlySavings}/mo): ${recommendation.reason}`
      }

      return `${recommendation.toolName}: optimal`
    })
    .join('\n')

  return `You are a senior finance analyst advising a ${teamSize}-person team that primarily uses AI for ${useCase}.

  Their current AI tool audit found $${totals.monthly}/month ($${totals.annual}/year) in potential savings.

Tool findings:
${toolSummaries}

Write a 90-100 word summary paragraph for this team. Rules:
- Be specific: reference their actual tools, savings amounts, and use case.
- Tone: direct and advisory, like a trusted CFO speaking to a department head.
- Do not start with "In conclusion", "Overall", or "Based on the analysis".
- Do not use em dashes.
- End with one concrete next step they should take this week.
- Exactly 90-100 words.`
}

export function generateFallbackSummary(result: AuditResult): string {
  const { tools, totals, teamSize, useCase } = result

  if (totals.monthly === 0) {
    return `Your ${teamSize}-person team's AI stack is well-matched to your ${useCase} workload. The plans selected align with your usage tier and team size, and there is no significant overlap between tools. AI tool pricing shifts frequently, so run this audit again in 90 days to catch new alternatives as they emerge.`
  }

  const topTool = [...tools].sort((left, right) => right.monthlySavings - left.monthlySavings)[0]

  return `Your team is spending $${totals.monthly}/month more than necessary on AI subscriptions. The clearest opportunity is ${topTool?.toolName}: ${topTool?.reason} Across your full stack, optimizing seat counts and plan tiers saves $${totals.annual}/year without changing the AI models your team depends on. Start with ${topTool?.toolName} this week and make the billing change in under 10 minutes.`
}

export async function generateSummary(result: AuditResult): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) {
    return generateFallbackSummary(result)
  }

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 250,
        messages: [{ role: 'user', content: buildPrompt(result) }],
      }),
    })

    window.clearTimeout(timeout)

    if (!response.ok) {
      return generateFallbackSummary(result)
    }

    const data = await response.json() as { content?: Array<{ type: string; text: string }> }
    const text = data.content?.find((block) => block.type === 'text')?.text?.trim()
    return text ?? generateFallbackSummary(result)
  } catch {
    window.clearTimeout(timeout)
    return generateFallbackSummary(result)
  }
}