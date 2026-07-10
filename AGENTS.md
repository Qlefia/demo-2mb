# 2mb CRM (Ops + Sales)

Internal CRM for 2mb. Two roles drive day-to-day usage:
- **Ops** (single seat at launch) produces a research **Dossier** for every promising company.
- **Sales** (DE + UK) runs outbound from a `dossier_ready` prospect.

Founder (Vlad) is escalation point and read-only auditor.

Domain reference: [`.cursor/rules/crm-domain.mdc`](.cursor/rules/crm-domain.mdc) and [`ops-role-deep-dive.md`](ops-role-deep-dive.md). Roadmap: [`ROADMAP.md`](ROADMAP.md) (short summary in [`OPS-NEXT.md`](OPS-NEXT.md)). Open work: [`BACKLOG.md`](BACKLOG.md).

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`, `@theme` in CSS)
- **UI:** Headless UI, Lucide React
- **State:** Zustand (pipeline filters, prospect selection, dossier draft), React Context (auth shell via [`AuthProvider`](src/providers/AuthProvider.tsx))
- **Forms:** React Hook Form + Zod
- **DnD:** @dnd-kit (Pipeline Kanban, task lists, dossier sections)
- **i18n:** react-i18next (DE, EN, RU — `src/i18n/locales/*.json`)
- **Backend:** Supabase (Auth + Postgres + Edge Functions + Storage), Drizzle ORM. Project: `2mb` (`adiptvvvorqtpxpcylcn`, `eu-west-1`, Postgres 17). Schema and RLS land in the next plan.
- **AI:** Anthropic Claude for dossier generation (see [`.cursor/rules/ai-prompting.mdc`](.cursor/rules/ai-prompting.mdc)).
- **Enrichment:** Apollo, PhantomBuster, Browse.ai, NewsAPI, Wayback Machine — all server-side, all cached (see [`.cursor/rules/enrichment.mdc`](.cursor/rules/enrichment.mdc)).
- **Docs / audit:** Storybook (`npm run storybook`) — foundations + chrome templates only after this cleanup.

## Data and auth (current state)

This repo is in cleanup phase: the survey-builder fork has been stripped, but the Supabase wiring lands in the next plan.

- **Auth (now):** mock user via [`src/stores/authStore.ts`](src/stores/authStore.ts); [`AuthProvider`](src/providers/AuthProvider.tsx) exposes `useAuth()` without Supabase yet.
- **Mock API (now):** [`src/mocks/router.ts`](src/mocks/router.ts) handles `/api/*` for `me`, `workspaces`, `leads`, `notifications`, `consent-log`. Seed in [`src/mocks/seed.ts`](src/mocks/seed.ts).
- **Auth (next plan):** swap mock for `@supabase/ssr` against the `2mb` project; reshape mocks into seed for design audit only.

## Principles

- **Mobile-first:** base mobile, `md:` / `lg:` for desktop.
- **Design:** Swiss minimalist palette, Inter, semantic HTML, accessibility-first.
- **SOLID, KISS, DRY** — small focused components and functions, composition over inheritance, no dead code.
- **No AI slop** — no junk comments, redundant checks, or type escapes.

## Region

EU only. The `2mb` Supabase project is in `eu-west-1` (Ireland). `eu-central-1` (Frankfurt) is also acceptable for any new EU project. No data leaves the EU.

## Communication

- AI responds in **Russian**; code and identifiers in **English**; UI strings localized via i18n (`de`, `en`, `ru`).
- Domain terms (`prospect`, `dossier`, `account`, `contact`, `playbook`, `trigger`, `activity`) are English in code and DB; translated in the UI.

## Execution tracking (Linear)

- **Workflow:** [`.cursor/rules/linear-workflow.md`](.cursor/rules/linear-workflow.md) — задачи в Linear, закрытие после выполнения, ретро после фазы.
- **Phase 4 (Enrichment) + маппинг тикетов:** [`.cursor/plans/phase-4-linear-sync.md`](.cursor/plans/phase-4-linear-sync.md) (эпик **QLE-29**).

## Where to look

- Domain: [`.cursor/rules/crm-domain.mdc`](.cursor/rules/crm-domain.mdc)
- Dossier shape: [`.cursor/rules/dossier.mdc`](.cursor/rules/dossier.mdc)
- Roles + RLS: [`.cursor/rules/roles-rls.mdc`](.cursor/rules/roles-rls.mdc)
- Enrichment: [`.cursor/rules/enrichment.mdc`](.cursor/rules/enrichment.mdc)
- AI: [`.cursor/rules/ai-prompting.mdc`](.cursor/rules/ai-prompting.mdc)
- i18n: [`.cursor/rules/i18n-de-en.mdc`](.cursor/rules/i18n-de-en.mdc)
- Supabase + Drizzle: [`.cursor/rules/supabase-backend.mdc`](.cursor/rules/supabase-backend.mdc), [`.cursor/rules/supabase-mcp-schema.mdc`](.cursor/rules/supabase-mcp-schema.mdc)
- Client state (TanStack Query for server, Zustand for UI prefs only): [`.cursor/rules/state-management.mdc`](.cursor/rules/state-management.mdc)
- Code quality: [`.cursor/rules/code-quality.mdc`](.cursor/rules/code-quality.mdc)
- Components: [`.cursor/rules/component-patterns.mdc`](.cursor/rules/component-patterns.mdc)
- Next.js conventions: [`.cursor/rules/nextjs-conventions.mdc`](.cursor/rules/nextjs-conventions.mdc)
- Tailwind v4: [`.cursor/rules/tailwind-v4.mdc`](.cursor/rules/tailwind-v4.mdc)
- API design: [`.cursor/rules/api-design.mdc`](.cursor/rules/api-design.mdc)
- Backlog discipline: [`.cursor/rules/backlog.mdc`](.cursor/rules/backlog.mdc)
- Linear workflow: [`.cursor/rules/linear-workflow.md`](.cursor/rules/linear-workflow.md)
- Design system: [`.cursor/rules/design-system.mdc`](.cursor/rules/design-system.mdc)
- **Phase 9 proposals:** apply migration `supabase/migrations/20260508120000_proposals_phase9.sql`, then `npm run smoke:proposals-phase9` (optional `SMOKE_BASE_URL=http://localhost:3000` checks `/p/[token]` HTML hints).
