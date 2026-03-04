# Web Design Agency OS

Autonomous AI workflow to discover weak service-business websites in the US, qualify leads, send compliant cold outreach, close with redesigned preview + invoice, and hand off paid clients to delivery and client success.

## Stack

- Next.js 15 + TypeScript (App Router)
- Supabase (workflow state + logs)
- Parallel APIs (`findall`, `extract`, `search`, `taskRun`)
- OpenAI (qualification, message generation, dynamic logging)
- Resend (email)
- Optional Telegram for client-success alerts

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Fill `.env` with your real credentials.

4. Apply database schema in Supabase SQL Editor:

- Run [`supabase/schema.sql`](/C:/Users/HP/Desktop/web-agency/web-design-agency/supabase/schema.sql)

5. Optional: import your existing Parallel CSV output:

```bash
npm run seed:csv
```

6. Start app:

```bash
npm run dev
```

## API Routes

- `POST /api/automation/run` (discovery/qualification/outreach/full)
- `POST /api/findall/start`
- `POST /api/findall/sync`
- `POST /api/leads/qualify`
- `POST /api/outreach/send`
- `POST /api/replies/process`
- `POST /api/projects/handoff`
- `POST /api/payments/mark-paid`
- `GET /api/leads/list`
- `GET /api/metrics`
- `GET /api/health`

## Core Modules

- [`lib/agents/lead-research-agent.ts`](/C:/Users/HP/Desktop/web-agency/web-design-agency/lib/agents/lead-research-agent.ts)
- [`lib/agents/qualification-agent.ts`](/C:/Users/HP/Desktop/web-agency/web-design-agency/lib/agents/qualification-agent.ts)
- [`lib/agents/outreach-agent.ts`](/C:/Users/HP/Desktop/web-agency/web-design-agency/lib/agents/outreach-agent.ts)
- [`lib/agents/closing-agent.ts`](/C:/Users/HP/Desktop/web-agency/web-design-agency/lib/agents/closing-agent.ts)
- [`lib/agents/web-design-agent.ts`](/C:/Users/HP/Desktop/web-agency/web-design-agency/lib/agents/web-design-agent.ts)
- [`lib/agents/client-success-agent.ts`](/C:/Users/HP/Desktop/web-agency/web-design-agency/lib/agents/client-success-agent.ts)
- [`lib/automation/pipeline-orchestrator.ts`](/C:/Users/HP/Desktop/web-agency/web-design-agency/lib/automation/pipeline-orchestrator.ts)

## Security Notes

- Do not commit `.env`.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.
- Use `AUTOMATION_SHARED_SECRET` for scheduled automation trigger auth.
- Rotate credentials if exposed.
