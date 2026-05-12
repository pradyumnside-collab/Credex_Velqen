# Reflection

**1. The hardest bug you hit this week, and how you debugged it**
The most frustrating bug hit me when navigating from the home page to the sharing result page—users with a direct `/audit` or `/results` link were getting a `404: NOT_FOUND` error after I deployed to Vercel. I hypothesized it was a routing issue since the React app handled it fine locally. I checked Vercel documentation and found that single page applications running on Vercel require routing all unmatched endpoints back to the `index.html`. I fixed it by creating a `vercel.json` file containing a `rewrites` rule that redirects `/(.*)` to `/index.html`.

**2. A decision you reversed mid-week, and what made you reverse it**
I originally intended to use Resend as the primary email service provider and successfully set up my Resend account and fully integrated the SDK into the application. However, mid-week I found a critical blocker: Resend requires a verified domain to reliably send transactional emails, which I do not have for this project. Then I switched to EmailJS. EmailJS works directly from the browser without requiring a verified domain or a standalone server function

**3. What you would build in week 2 if you had it**
I would complete the Bonus features mentioned in assignment. By completing that the website better B2B product. I would have also implement an admin dashboard to track incoming leads to see which software stacks are generating the highest potential savings. 

**4. How you used AI tools**
I used claude code for complete planning, understanding and frontend design. Ii used Github Copilot for some code writing, fixing bugs and keeping track of all requirements of this assignment.

**5. Self-rating on a 1–10 scale**
- **Discipline (10/10):** Maintained consistent momentum
- **Code Quality (7/10):** Good use of TypeScript types for predictability, but I can increase modularity.
- **Design Sense (7/10):** Effectively leaned on Tailwind to maintain a clean startup aesthetic and logical UX flow.
- **Problem Solving (6/10):** I Still think the audit engine logic can be improved a lot, due to time I have to go with currect logic which is also good.
- **Entrepreneurial Thinking (8/10):** Prioritized lead-capture UX and immediate user value calculations to hook potential clients fast.