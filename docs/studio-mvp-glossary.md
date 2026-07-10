# Studio MVP — domain glossary (product + engineering)

This document fixes vocabulary and pipeline anchoring for the **multi-tenant “CRM for studios”** direction. It does not replace [`AGENTS.md`](../AGENTS.md) or internal role rules; it layers **workspace** scope on top.

## Entities

| Term (product) | DB / code (today) | Notes |
| --- | --- | --- |
| **Workspace** | `workspaces` | One studio tenant. All CRM rows that belong to a customer organisation are scoped through the workspace of the logged-in member. |
| **Company** | `accounts` | Legal / firmographic company. Shown as “Company” in the prospect workspace UI. |
| **Pipeline card / opportunity** | `prospects` | **Kanban anchor for MVP:** each column card is still a `prospect` row (working unit: company + trigger + owner + stage). Product copy may say “company” when the user thinks about the account header, but **we do not split the kanban onto `accounts` yet** — that would require one-card-per-account rules, duplicate handling across triggers, and new APIs. |
| **Contact** | `contacts` | People at a company (`account_id`). |
| **Offer / proposal deck** | `proposals` + `proposal_versions` | Commercial deck; published versions stay immutable (Phase 9). |
| **Dossier** | `dossiers` | Internal research artifact (2mb-era); studios may repurpose or hide later. Left column can still surface dossier snippets next to **service ↔ company mapping**. |

## Kanban decision (locked for MVP)

- **Anchor:** `prospects` (existing 10-stage pipeline, Kanban, `/prospects/[id]` shell).
- **UX:** Lead with **company** (`account`) name in cards and headers; keep `prospect` as the technical ID in URLs and APIs until a dedicated “opportunity” split is justified.

## Onboarding (studio setup)

Wizard captures: **services** the studio sells, **client segments** + priority, links **which services apply to which segments**, and optional **pitch** text per pair. Status: `draft` → `in_review` → `confirmed`. Only **confirmed** snapshots should feed customer-facing generation (merge / prompts), not drafts.

## RLS (multi-tenant gate)

Existing **permissive** policies from `20260429080100_rls_policies.sql`, `20260506140000_deals.sql`, and `20260508120000_proposals_phase9.sql` stay as the role matrix (founder / ops / sales / admin).

**Restrictive** policies added in `20260515153000_studio_workspaces_multitenant.sql` AND with `public.user_has_workspace_access(...)` so every row is additionally scoped to workspaces where `auth.uid()` has a `workspace_members` row. Global tables (`service_tags`, `comparable_cases`, `provider_quota`, `enrichment_cache`) are unchanged in this migration.

