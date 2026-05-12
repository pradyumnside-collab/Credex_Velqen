# Velqen

Velqen is a SaaS spend evaluation and recommendation Website designed for startups and mid-sized businesses. It allows teams to input their current software stack and team size outputting an instant audit that identifies redundancies, overspending, and better alternative tooling based on their specific use-case.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run locally
npm run dev
```

### Manual Deployment to Vercel (One-Go)
1. Commit and push your code to a GitHub repository.
2. Go to the [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..." > "Project"**.
3. Import your GitHub repository.
4. Leave the Framework Preset as **Vite** and leave the build commands as default.
5. Add any required Environment Variables (like Supabase URLs or APIs) in the settings.
6. Click **Deploy**. Vercel will automatically build and publish the app!

## Decisions

1. **Vite + React (TypeScript):** I chose a client-side heavy SPA to allow instant UI feedback. **Why not Next.js?** Next.js is fantastic for server-side rendering, but for this specific tool, the primary value is instant calculator feedback. A pure React SPA with Vite builds faster, avoids unnecessary server round-trips for the audit engine, and keeps deployment incredibly simple.
2. **Supabase for Backend:** Needed a quick out-of-the-box solution to persist shared audits. **Why not Firebase or Cloudflare D1?** Firebase's NoSQL structure gets messy for relational data (like tying leads to audits). I wanted the strictness of a true relational SQL database. Cloudflare D1 is great but the DX and client SDKs aren't as mature as Supabase's `supabase-js`, which gave me instant Postgres and Row Level Security.
3. **Anthropic API for AI Summaries:** Used Claude for generating unique, readable audit summaries. **Why not OpenAI/GPT-4?** I found that Claude consistently writes with a more natural, conversational tone. It synthesizes analytical pricing data feeling more like a human consultant giving advice rather than a bot spitting out bullet points.
4. **Local Engine over Server Engine:** The `auditEngine.ts` calculates everything client-side for rapid response times. This compromises some business logic security but improves UX immensely.
5. **Tailwind CSS + shadcn/ui:** Allowed extremely rapid UI iteration while ensuring a clean, modern design out of the box, saving days of design effort.

## Deployed URL
**[https://velqen.vercel.app](https://velqen.vercel.app)**
