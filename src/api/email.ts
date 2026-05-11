import emailjs from '@emailjs/browser'

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  as string
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  as string

export type SendEmailInput = {
  email:        string
  monthlyTotal: number
  annualTotal:  number
  highSavings:  boolean
  slug:         string
  teamSize:     number
  useCase:      string
  toolCount:    number
}

export type SendEmailResult =
  | { success: true }
  | { success: false; error: string }
export async function sendAuditConfirmation(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn('[email] EmailJS env vars not configured — skipping send')
    return { success: true }
  }

  const appUrl   = (import.meta.env.VITE_APP_BASE_URL as string) ?? 'http://localhost:5173'
  const auditUrl = `${appUrl}/audit/${input.slug}`
  const subjectLine = input.monthlyTotal > 0
    ? `$${input.monthlyTotal.toLocaleString()}/month in AI savings found`
    : 'Your Velqen AI spend audit is ready'
  const bodyLines: string[] = ['Hi,', '']

  if (input.monthlyTotal > 0) {
    bodyLines.push(
      `Your Velqen audit found $${input.monthlyTotal.toLocaleString()}/month ` +
      `($${input.annualTotal.toLocaleString()}/year) in potential savings across ` +
      `${input.toolCount} AI tool${input.toolCount > 1 ? 's' : ''}.`,
    )
  } else {
    bodyLines.push(
      `Your Velqen audit is complete. Your ${input.toolCount}-tool stack looks ` +
      `well-optimised for a ${input.teamSize}-person team focused on ${input.useCase}.`,
    )
  }

  bodyLines.push('')

  bodyLines.push(
    `Your shareable audit link is below. It shows your savings breakdown ` +
    `without any identifying details.`,
  )

  const templateParams: Record<string, string> = {
    to_email:        input.email,
    subject_line:    subjectLine,
    email_body:      bodyLines.join('\n'),
    audit_url:       auditUrl,
    monthly_savings: `$${input.monthlyTotal.toLocaleString()}`,
    annual_savings:  `$${input.annualTotal.toLocaleString()}`,
    team_size:       String(input.teamSize),
    use_case:        input.useCase,
    tool_count:      String(input.toolCount),
    high_savings:    input.highSavings ? 'true' : 'false',
  }

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
    return { success: true }
  } catch (err) {
    console.error('[email] EmailJS send failed:', err)
    return { success: false, error: 'Email delivery failed — audit is still saved.' }
  }
}