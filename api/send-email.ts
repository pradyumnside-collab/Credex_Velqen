import type { VercelRequest, VercelResponse } from '@vercel/node'

type EmailPayload = {
  email: string
  monthlyTotal: number
  annualTotal: number
  highSavings: boolean
  slug: string
  teamSize: number
  useCase: string
  toolCount: number
}

function getAppUrl(): string {
  return process.env.VITE_APP_BASE_URL ?? 'https://velqen.vercel.app'
}

function buildEmailHtml(payload: EmailPayload): string {
  const appUrl = getAppUrl()
  const auditUrl = `${appUrl}/audit/${payload.slug}`
  const savingsStr = payload.monthlyTotal.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  const annualStr = payload.annualTotal.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Your Velqen Audit</title>
</head>
<body style="margin:0;padding:0;background:#fafafa;font-family:Inter,system-ui,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
    <div style="background:#18181b;padding:24px 32px;">
      <span style="color:#ffffff;font-size:15px;font-weight:600;letter-spacing:-0.01em;">Velqen</span>
      <span style="color:#71717a;font-size:12px;margin-left:8px;">AI spend audit</span>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 8px;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.06em;font-weight:500;">Audit complete</p>
      <h1 style="margin:0 0 20px;font-size:24px;font-weight:600;color:#09090b;line-height:1.2;">
        ${payload.highSavings
          ? `Your team could save ${savingsStr}/month`
          : payload.monthlyTotal > 0
            ? `We found ${savingsStr}/month in potential savings`
            : 'Your AI stack looks well-optimised'}
      </h1>
      <div style="background:#fafafa;border:1px solid #f4f4f5;border-radius:8px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding-right:24px;">
              <div style="font-size:11px;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Monthly savings</div>
              <div style="font-family:monospace;font-size:22px;font-weight:600;color:${payload.monthlyTotal > 0 ? '#16a34a' : '#18181b'};">${savingsStr}</div>
            </td>
            <td>
              <div style="font-size:11px;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Annual impact</div>
              <div style="font-family:monospace;font-size:22px;font-weight:600;color:${payload.monthlyTotal > 0 ? '#16a34a' : '#18181b'};">${annualStr}</div>
            </td>
          </tr>
        </table>
      </div>
      ${payload.highSavings ? `
      <div style="background:#09090b;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:500;color:#4ade80;">Significant savings detected</p>
        <p style="margin:0 0 12px;font-size:14px;color:#d4d4d8;line-height:1.5;">A Credex advisor will be in touch to discuss how you can capture these savings through discounted AI credits.</p>
        <a href="https://credex.rocks" style="display:inline-block;background:#ffffff;color:#09090b;font-size:13px;font-weight:500;padding:8px 16px;border-radius:6px;text-decoration:none;">Book a consultation →</a>
      </div>
      ` : ''}
      <a href="${auditUrl}" style="display:block;background:#18181b;color:#ffffff;text-align:center;font-size:14px;font-weight:500;padding:12px 24px;border-radius:8px;text-decoration:none;margin-bottom:24px;">View and share your audit →</a>
      <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.6;">This audit covered ${payload.toolCount} AI tool${payload.toolCount > 1 ? 's' : ''} for a ${payload.teamSize}-person team focused on ${payload.useCase}. All savings estimates are conservative and based on verified vendor pricing.</p>
    </div>
    <div style="border-top:1px solid #f4f4f5;padding:20px 32px;background:#fafafa;">
      <p style="margin:0;font-size:11px;color:#a1a1aa;">Velqen · AI spend audit · Pricing data verified weekly · <a href="${appUrl}" style="color:#71717a;text-decoration:none;">velqen.app</a></p>
    </div>
  </div>
</body>
</html>`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[send-email] RESEND_API_KEY is not set')
    return res.status(500).json({ error: 'Email service not configured' })
  }

  const payload = req.body as EmailPayload

  if (!payload.email || !payload.slug) {
    return res.status(400).json({ error: 'Missing required fields: email, slug' })
  }

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Velqen <onboarding@resend.dev>',
        to: [payload.email],
        subject: payload.monthlyTotal > 0
          ? `Your Velqen audit — $${payload.monthlyTotal.toLocaleString()}/month in savings found`
          : 'Your Velqen AI spend audit is ready',
        html: buildEmailHtml(payload),
      }),
    })

    if (!emailRes.ok) {
      const errorBody = await emailRes.text()
      console.error('[send-email] Resend error:', emailRes.status, errorBody)
      return res.status(502).json({ error: 'Email delivery failed' })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('[send-email] Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}