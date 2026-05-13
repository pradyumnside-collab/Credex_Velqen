 # PROMPTS.md — Velqen

## The Prompt (Production — v3)

```
You are a senior finance analyst advising a {teamSize}-person team that primarily uses AI for {useCase}.

Their current AI tool audit found ${totals.monthly}/month (${totals.annual}/year) in potential savings.

Tool findings:
{toolSummaries}

Write a 90-100 word summary paragraph for this team. Rules:
- Be specific: reference their actual tools, savings amounts, and use case.
- Tone: direct and advisory, like a trusted CFO speaking to a department head.
- Do not start with "In conclusion", "Overall", or "Based on the analysis".
- Do not use em dashes.
- End with one concrete next step they should take this week.
- Exactly 90-100 words.
```

**Model:** `claude-haiku-4-5`
**Max tokens:** 250
**Timeout:** 6 seconds (falls back to template if exceeded)

---

## Why the prompt is written this way

**Persona instruction first — "senior finance analyst"**

Without a persona, the model defaults to a helpful assistant voice. That sounds like a chatbot, not a financial advisor.

**Word count is exact, not approximate**

"Write a short paragraph" produced wildly inconsistent output. "Approximately 90-100 words" was only marginally better. "Exactly 90-100 words" is the constraint that finally produced consistent length. The output lives in a UI card with fixed space length unpredictability breaks the layout.

**"End with one concrete next step"**

Early versions ended with vague advice: "consider reviewing your AI subscriptions regularly" or "staying informed about pricing changes is important." These are useless to a user who just ran an audit and wants to know what to do. The explicit instruction forces the model to name a tool, name an action, and put a timeframe on it. That's the only kind of ending worth showing a user.

**"Do not use em dashes"**

LLMs use em dashes constantly in analytical writing it's a strong stylistic tell. They look unnatural in short UI paragraphs and break PDF rendering in some environments. One explicit rule eliminates this without needing to rewrite outputs.

**"Do not start with In conclusion, Overall, or Based on the analysis"**

These are the three most common LLM opening patterns when generating summaries. Blocking them forces the model to start with the actual finding rather than a meta-comment about the finding.

---

## What Didn't Work

**v1 — No persona, no word count, no tone instruction**

---

## Fallback Summary (no API key or timeout)

When the Anthropic API is unavailable, times out past 6 seconds, or returns an error, the tool falls back to a deterministic template built from the audit result object. The user never sees an error state — they see a summary regardless.

Two cases are handled:

**Zero savings:**
```
Your {teamSize}-person team's AI stack is well-matched to your {useCase} workload.
The plans selected align with your usage tier and team size, and there is no
significant overlap between tools. AI tool pricing shifts frequently, so run this
audit again in 90 days to catch new alternatives as they emerge.
```

**Positive savings (uses top saving tool):**
```
Your team is spending ${totals.monthly}/month more than necessary on AI subscriptions.
The clearest opportunity is {topTool.toolName}: {topTool.reason} Across your full
stack, optimizing seat counts and plan tiers saves ${totals.annual}/year without
changing the AI models your team depends on. Start with {topTool.toolName} this
week and make the billing change in under 10 minutes.
```

The fallback is intentionally readable and specific it references real numbers from the audit. A user reading the fallback summary should not be able to tell it is not AI-generated. The distinction matters because the email confirmation and share page also display this summary. If the fallback looks broken, it damages trust in the audit itself.
