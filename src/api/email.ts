type SendEmailInput = {
  email: string
  monthlyTotal: number
  annualTotal: number
  highSavings: boolean
  slug: string
  teamSize: number
  useCase: string
  toolCount: number
}

type SendEmailResult =
  | { success: true }
  | { success: false; error: string }

export async function sendAuditConfirmation(input: SendEmailInput): Promise<SendEmailResult> {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string }
      return { success: false, error: body.error ?? 'Failed to send email' }
    }

    return { success: true }
  } catch (error) {
    console.error('[sendAuditConfirmation] Error:', error)
    return { success: false, error: 'Network error sending email' }
  }
}