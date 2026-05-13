# METRICS.md — Velqen

## North Star Metric

**Qualified email captures from high-savings audits per week.**

Not audits run. Not pageviews. Not signups.

Here's why this specific framing matters: an audit completed with no email capture is a user who got value and left. An email capture from a *low-savings* audit is a lead Credex can't do anything with. The only outcome that creates business value is someone who discovered they're significantly overspending *and* trusted Velqen enough to give their email. That's the unit of success. Everything else is noise.

Velqen is not a product people use daily. An engineering manager audits their stack once, maybe again when they onboard a new tool or renew a contract. Measuring DAU or weekly active users would tell you almost nothing about whether the product is working. The question is: are the right people finding it, completing it, and raising their hand for Credex?

---

## 3 Input Metrics That Drive the North Star

**1. Audit completion rate**
Definition: audits submitted ÷ audit page loads.
Why it matters: if people land on the form and leave, the value proposition isn't landing or the form is too heavy. Target: above 55%. Below 35% means something is wrong before users even see a result.

**2. Email capture rate from completed audits**
Definition: email submissions ÷ audits completed.
Why it matters: this measures whether the results page is compelling enough to earn trust. If people see their savings and still don't give their email, the results aren't credible or the ask feels too aggressive. Target: above 12%. Below 6% after 200 audits means the results page needs a rethink.

**3. High-savings rate**
Definition: audits showing >$500/month in savings ÷ total audits completed.
Why it matters: only high-savings audits trigger the Credex CTA and create a consultation opportunity. If most audits return $0 or $30, the audit engine is either too conservative or the wrong users are arriving. Target: 20–30% of audits. Below 10% is a signal that the tool is reaching already-optimised teams or the engine logic needs tuning.

---

## What to Instrument First

In the first two weeks, before any analytics platform, instrument four events directly into Supabase:

- `audit_started` — form page loaded with at least one tool added
- `audit_completed` — Run Audit clicked and results rendered
- `email_captured` — lead form submitted successfully
- `share_link_copied` — copy button clicked on the share URL

These four events give you the full funnel. Everything else can wait.

---

## Pivot Trigger

If after **200 completed audits** the email capture rate is below 5%, stop optimising copy and button colours. That number means users are seeing the results, deciding the tool isn't worth their email, and leaving. The problem is upstream — either the savings estimates feel too small to act on, the recommendations aren't credible, or the wrong users are arriving. At that point, the right move is to interview five people who completed an audit and didn't submit their email, not to run A/B tests on the CTA button.