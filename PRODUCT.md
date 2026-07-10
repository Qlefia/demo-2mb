# Product

## Register

product

## Users

- **Ops** (single seat): triage inbound signals, run enrichment, draft and review **Dossiers**, hand off ready prospects.
- **Sales (DE / UK)**: work assigned prospects from **dossier_ready** onward: outreach, calls, tasks, stage updates.
- **Founder**: escalation, overrides, team and policy; **admin** seat for read-only audit.

Primary context: desktop-first internal tool, often long sessions; mobile must remain usable for key flows.

## Product Purpose

Internal **2mb CRM** connects account research (dossiers), pipeline stages, tasks, and proposals so Ops and Sales share one source of truth. Success means fewer dropped handoffs, traceable stage changes, and dossiers that Sales can execute from without re-research.

## Brand Personality

Swiss minimal, confident, calm. **Trade Republic / Nothing OS** lineage: monochrome structure, one warm accent where emphasis is needed, no decorative noise. Expert tool, not a consumer growth landing.

## Anti-references

- Generic “AI SaaS” dashboards: purple gradients, glass cards, metric hero blocks, Inter-only sameness without intent.
- Dense admin tables with no hierarchy or empty states.
- Modals as the default for every secondary action.
- Decorative motion (bounce, elastic easing) and layout-thrash animations.

## Design Principles

- **Hierarchy over decoration** — typography and spacing carry structure; color is sparing.
- **Pipeline truth** — what the user sees matches stage rules and RLS; no hidden state.
- **Handoff clarity** — Ops output (dossier) must be obviously “ready” before Sales owns the next step.
- **EU-first** — data residency and copy tone respect DE/EN/RU audiences without clownish localization.
- **Ship working UI** — prefer Headless UI primitives and shared tokens over one-off visuals.

## Accessibility & Inclusion

Target **WCAG 2.2 AA** for core flows. Respect **prefers-reduced-motion** where motion is used. Keyboard paths for dialogs, command palette, and pipeline. No critical information by color alone (pair with label/icon/text).
