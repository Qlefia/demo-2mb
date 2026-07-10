# Phase 2 audit — 2026-04-29

Comprehensive review of Phase 1 (prospect pipeline) + Phase 2 (manual dossier, contacts, activities, tasks). Combined findings from 4 parallel sub-agent reviewers (UX/UI design, functional flow, backend/RLS, product) + my own Playwright walkthrough as a founder user.

> Severity: **🔴 P0 = blocks daily use / security / data loss · 🟡 P1 = hurts UX significantly · 🟢 P2 = polish**

---

## 🔴 P0 — must fix before Phase 3

### Security & data integrity

1. **JWT default-to-admin gives any authenticated user full read access.** `current_role()` in `supabase/migrations/20260429080000_rls_helpers.sql` L25–L34 coalesces a missing/empty `app_metadata.role` to `'admin'`. Combined with admin SELECT-on-everything policies, a user with no CRM role assignment can read the entire CRM through `withUserRls`. **Fix:** default to a deny-all role (or `null` + policies that require an explicit known role).

2. **`triggers_sales_select` and `playbooks_sales_select` are too loose.** Both gate only on `is_sales()` with no territory/stage filter (`20260429080100_rls_policies.sql` L161–L164, L361–L364). A DE sales rep can read UK trigger intel via shared accounts, and the entire playbook catalog. **Fix:** scope like `contacts_sales_select`.

3. **`getSession()` instead of `getUser()` on most CRM routes.** Routes like `app/api/prospects/route.ts:71`, `tasks/route.ts:27`, `activities/[activityId]/route.ts:30` use the cookie-only `getSession()`. Supabase guidance is to use `getUser()` server-side for authoritative identity. **Fix:** swap to `getUser()` everywhere actor identity is consulted.

4. **System dossier-reopen activity is stored as `type: 'note'`** (`mark-in-review/route.ts:95–105` + `activities/service.ts:13–22`). UI treats it as a normal user note with edit/delete buttons; API allows PATCH/DELETE because `isUserActivityType('note')` is true. Privileged users can rewrite the audit row. **Fix:** use a dedicated `dossier_reopened` activity type or treat `payload.system === true` as immutable in API + DTO.

5. **Internal error details leaked through API responses** in `app/api/health/route.ts:23`, `app/api/me/route.ts:127`, `app/api/team/seats/route.ts:97` (raw `error.message` returned). **Fix:** stable error codes only.

### Functional bugs

6. **Side panel from Kanban does NOT link to `/prospects/[id]`** (where Dossier/Activity/Tasks live). `ProspectDetailPanel.tsx` ends with a placeholder text "*Activities, dossier, and tasks will appear here in upcoming iterations*" — but Phase 2 already shipped them. Users navigating via Kanban will believe Phase 2 doesn't exist. **Verified in Playwright (screenshot 03).** Fix: add a primary "Open full view" / "Dossier öffnen" CTA + remove the misleading placeholder.

7. **Stale prospect on client-side `/prospects/[id]` → `/prospects/[id2]` navigation.** `ProspectDetailPage.tsx:35–69` initialises state once; if the new id is in the Zustand store, `setLoading(true)` doesn't run and the previous header/owner/`prospectId` flashes through. Add `key={id}` on the page subtree or reset state on `id` change.

8. **Pipeline UI lets you drag to `dossier_ready` while dossier is not ready; server rejects → revert.** `ProspectKanban.tsx:90` calls `canTransition` without `dossierStatus`; PATCH returns `requiresDossierReady`. Confusing for ops. Pass `dossierStatus` from each card.

9. **Tab switching after creating sibling-tab entities can wipe Dossier form state** (verified in Playwright, screenshots 21–23). Reproducible by Save → Activity tab → log note → Tasks tab → create task → back to Dossier. Form re-mounts empty even though DB has the data. Likely a desync between `prospect`/`dossier` refetch and `formState` initialisation. Investigate `DossierEditor.tsx` initial state lifecycle.

### Legacy / branding leaks (we said this was cleaned up)

10. **Top-nav link is "Leads" but URL = `/prospects`.** `<Link to="/prospects">Leads</Link>`. Not localised, not internally consistent. Verified in EN and DE (screenshots 01, 02, 30, 31). Should be "Prospects" (or "Interessenten" if you want a German term).

11. **Notification settings still say "Per-survey overrides" / "Every response"** (`settings/notifications`). Survey product UI bleeding through after the rename pass. Replace with CRM events (dossier ready, task due, mention, stage change). Verified in screenshot 26.

12. **Data & Privacy page still references "surveys, responses"** in Export My Data, has unconnected services (Paddle for "Payment processing", Cloudflare for "CDN, DNS, WAF", Sentry for "Error tracking" — none wired). Verified in screenshot 27. Consent log shows raw i18n key `common.noData`.

13. **Dashboard placeholder shows English-only dev chatter:** *"Ops Today placeholder. The triage queue, KPI cards, and pipeline summary will be built in the next iteration. See `OPS-NEXT.md`."* — leaks internal file path to users; not localised. Verified in screenshots 01 and 31.

---

## 🟡 P1 — significant UX hit

### Dossier

14. **Two `variant="primary"` buttons (Save + Mark ready)** in one cluster confuses ops about the next step (`DossierEditor.tsx:348–378`). Make exactly one primary by state.
15. **No assignee shown on task rows** (verified in screenshots 16–18). User must edit a task to know who's responsible. Add the avatar+name inline on each row.
16. **Activity stage-change meta uses raw enum slugs** (`activities/ActivityTimeline.tsx:93–96`) — DE users see `1st_call`, `dossier_in_progress` instead of localised stage labels. Map through `STAGE_META_BY_ID`.
17. **Owner reassign toast can show raw API codes/English to DE Ops** (`OwnerReassignCombobox.tsx:78`). Always `t(...)` with mapped server codes.
18. **`en.json:1783` has a German placeholder** (`Geschäftsführer, Bauleiter`) under the English bundle for `contacts.fields.rolePlaceholder`. Wrong copy for UK Sales.
19. **QualityChecklist is buried below 10 sections on small viewports** (`DossierEditor.tsx:328–411`). Make it sticky/collapsible on `max-lg` or add jump-link nav.
20. **Date formatting uses browser locale (no explicit `Intl` argument).** Verified in Playwright — day headers in Activity timeline rendered as Russian "ср, 29 апр. 2026 г." because Cursor's Chromium had `ru` locale (screenshot 12, 19). Pass `i18n.language` into `Intl.DateTimeFormat` everywhere (`tasks/dueDate.ts:67`, `ProspectDetailPage.tsx:166`, `ActivityTimeline.tsx`).

### Tasks

21. **Status chips offer every other status in one hop** (`TasksList.tsx:168` → `tasks/[taskId]/route.ts` does not enforce a state machine). Done can be reached directly from Open without going through In Progress. Add server-side guard if business rule requires it.
22. **"Due in 1d" still shown on a `done` task** (verified in screenshot 18). After completion, switch to "Completed at …" and hide the future hint.
23. **Native `<input type="datetime-local">` shows browser-locale placeholder** ("ДД.ММ.ГГГГ --:--"). Replace with a styled date picker or at minimum render a hint above with the expected format.

### Activity

24. **Failed fetches silently yield empty lists** (`ActivityPanel.tsx:58–61`, `TasksPanel.tsx:32–34`) — looks identical to "no data". Add inline error + retry.
25. **Filter chips are plain `<button>`s without `aria-pressed` / `role="tab"`** — A11y regression. Use `aria-pressed={filter === mode}` or wrap in Headless `TabGroup`.
26. **Pluralisation broken**: "1 contact(s)", "1 entries", "1 prospects". Use `i18next` plural keys.

### General

27. **Tab `focus:outline-none` with no `focus-visible:` replacement** (`ProspectDetailPage.tsx:180`). Keyboard focus disappears.
28. **Prospect list rows are click-only `<tr onClick>`** (`ProspectListView.tsx:44`) — not keyboard focusable. Add `tabIndex={0}` and `onKeyDown` or use real `<a>`.
29. **Mark Ready** disabled with hint instead of hidden for sales — fine — but if API returns 403 we have no role-specific copy. Map `requiresRole` → `t('errors.role.forbidden')`.
30. **Reopen dossier after hours of work has no confirm dialog** (`MarkReadyButton.tsx:84–90`).
31. **Concurrent Kanban drags** can race (each handler snapshots `allProspects` independently). Per-id in-flight flag.
32. **Double-save race**: `if (saving)` guard happens before the async `setSaving(true)` resolves (`DossierEditor.tsx:199`). Use a ref lock or sync disable.
33. **DE i18n typo "persoenlichen" instead of "persönlichen"** in profile subtitle (verified in screenshot 29).

---

## 🟢 P2 — polish & consistency

34. **§ glyph in QualityChecklist labels** ("§3 · Section 3 has a recent signal") — legalistic, conflicts with the design rule. Use `Abschnitt {n}` or drop the glyph.
35. **Version drawer shows raw JSON keys** ("Changed: snapshot, what_they_do") — map to localised section labels.
36. **Version drawer doesn't refetch after save** (`DossierVersionsDrawer.tsx:20–37`). Pass `version` as a dep.
37. **Single error state bound only to title in TaskForm** (`TaskForm.tsx:48–77`). Field-level errors for assignee/due.
38. **Stage colors drift from the monochrome design system** (`stageMeta.ts:10–35`) — intentional pipeline coloring, but document or tone down.
39. **"Phase 2.x" leaking into user-facing strings** (e.g. `dossier.actions.markReadyHint.qualityPending` mentions "Phase 2.2"). Strip dev language from i18n.
40. **Two test users named "Sales DE (test)" and "Sales DE 2 (test)"** in the picker (verified in screenshot 15) — residual smoke-test data noise. Clean up dev seeds or mark with a "(dev)" prefix.
41. **`safeNext` open-redirect protection** in auth callback works (only same-origin paths) — good, keep.

---

## 🚀 Quick wins (cheap, high-impact)

1. **Add an "Open full view" CTA in `ProspectDetailPanel`** linking to `/prospects/[id]`. Single-line patch, unblocks Phase 2 discovery.
2. **Strip "OPS-NEXT.md" + English copy from Dashboard placeholder.** Replace with localised "Dashboard kommt mit Phase 5".
3. **Rename top-nav "Leads" → "Prospects" (i18n key).** 1-line change, removes a glaring inconsistency every session.
4. **`Intl.DateTimeFormat(i18n.language, …)` everywhere we currently do `toLocaleDateString()`.** Ten call sites across `dueDate.ts`, `ActivityTimeline.tsx`, `ProspectDetailPage.tsx`.
5. **Plural i18n keys** for "{count} contact(s)", "{count} entries", "{count} prospects".
6. **Move `current_role()` default from `'admin'` → `'authenticated_no_role'`** + add `is_admin()` strictly checks for `admin`.
7. **Replace Notification & Data&Privacy survey copy** (or hide the unimplemented sections behind a "Coming soon" feature flag).
8. **Decision-maker checkbox needs `aria-label={t('contacts.actions.toggleDecisionMaker', { name })}`** — A11y fix in 2 lines (`ContactsList.tsx:127`).
9. **`Sales sees `Mark ready` disabled w/ hint`** — add a one-line note "Wird von Operations finalisiert" so sales knows it's intentional.
10. **Show task age + assignee on the row** — adds 8 lines, eliminates 80% of "who owns this?" Slack pings.

---

## ✅ What is working well (keep / replicate)

- **Dossier `validateDossier` shared between server (`mark-ready` guard) and client (`QualityChecklist`)** — no drift between UI checklist and server gate.
- **Explicit Save + `beforeunload` on dirty edits** — clearer mental model for ops than silent autosave.
- **`task_completed` activity inserted in the same `withUserRls` tx** as task transition — atomic, can't half-fail.
- **Activity API blocks `system_*` types from create/update/delete paths** — system events are immutable.
- **`withUserRls` helper** — one transaction, `SET LOCAL role` + `request.jwt.claims`, no cross-tx leakage.
- **Optimistic Kanban drag with rollback on error** — good UX.
- **Toast coverage on contact, activity, task mutations** — consistent.
- **`getContactWithGuard` joining prospect_id + contact_id** — prevents IDOR.
- **DE locale switch is actually live** (verified in screenshot 29) — no page reload needed.
- **Settings/Team page is polished** — invite form, role chips, territory column, status, last active (screenshot 25).

---

## Recommended sequence before Phase 3

1. **Day 1 — security:** items 1, 2, 3, 5 (RLS hardening + getUser + leak cleanup). 1 short migration + 1 PR.
2. **Day 1 — discoverability:** items 6, 10, 13 (panel CTA + nav rename + dashboard copy). Same PR.
3. **Day 2 — i18n correctness:** items 16, 18, 20, 26, 33, 39 (locale-aware dates, plurals, typos, dev language). One sweep PR.
4. **Day 2 — Phase 2 polish:** items 14, 15, 21, 22, 24 (assignee on row, single primary CTA, task state machine, completed-at copy, error states).
5. **Day 3 — legacy cleanup batch:** items 11, 12 (notifications + data privacy redesign).
6. **Day 3 — quality-of-life:** quick wins #6 to #10.

After this, Phase 3 (AI dossier draft, enrichment) starts on a solid foundation.
