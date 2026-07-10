# Supabase: Dev/Prod Setup and Best Practices

## Current State (as of 2025-03-18)

| Item           | Value                          |
| -------------- | ------------------------------ |
| Project        | 2mb CRM (okoyexyqutdiujjlpcpf) |
| Region         | eu-central-1 (Frankfurt)       |
| Branch         | main (PRODUCTION only)         |
| Migrations     | 17 applied                     |
| Edge Functions | 0                              |

### Tables (public schema)

- `workspaces`, `users`, `surveys`, `survey_responses`, `leads`, `notifications`, `branding_templates`, `consent_log`
- All tables have RLS enabled

### Realtime (for dashboard live updates)

Dashboard uses Supabase Realtime for `leads` and `survey_responses`. Enable in Dashboard > Database > Replication: add `leads` and `survey_responses` to the publication if not already present.

---

## 1. Create Dev Branch (Manual)

Supabase MCP `create_branch` requires `confirm_cost_id` (cost confirmation flow). Create the dev branch manually:

1. Dashboard: **2mb CRM** > Branch dropdown (top) > **Create branch**
2. Name: `dev` (or `develop`)
3. Type: **Persistent** (recommended for long-lived dev environment)
4. After creation, dev gets its own project ref, URL, and keys

**Cost:** ~$0.01344/hour for Micro compute. Pause dev when not in use to reduce cost.

---

## 2. Environment Variables

### Prod (main)

Use `.env.local` (or Vercel env vars) with prod Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://okoyexyqutdiujjlpcpf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod anon key>
SUPABASE_SERVICE_ROLE_KEY=<prod service_role key>
```

### Dev (branch)

After creating the dev branch, get its URL and keys from Dashboard > Project Settings > API. Use a separate env file or Vercel preview env:

- `.env.development` for local dev against dev branch
- Vercel: add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Preview environment

**Important:** Never mix prod and dev credentials. Dev branch has no production data.

---

## 3. Backups (Free Tier)

Free tier has **no automatic backups** in the Dashboard. Manual backups are required.

### Option A: Project script (recommended)

```powershell
# Set password in env (from Dashboard > Settings > Database)
$env:SUPABASE_DB_PASSWORD = "your-db-password"

# Run backup
npm run db:backup
```

Output: `backups/schema-YYYYMMDD-HHmm.sql`

Or run directly: `pwsh -File scripts/backup-supabase.ps1`

### Option B: pg_dump (requires Postgres client)

```powershell
pg_dump "postgresql://postgres.okoyexyqutdiujjlpcpf:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require" --schema-only --no-owner --no-privileges -f backup-schema.sql
```

### Backup schedule (SaaS best practice)

- **Before major migrations:** manual dump
- **Weekly:** automated dump (CI/GitHub Action) to secure storage
- **Pro/Team plan:** enables Daily Backups (7–30 days retention)

---

## 4. Branching Workflow

1. **Dev branch:** apply migrations, test features, seed test data
2. **Merge to main:** Dashboard > Branches > dev > Merge into main
3. **Deploy:** migrations run automatically on merge; Vercel deploys from main

---

## 5. Migrations

Migrations are stored in Supabase (applied via Dashboard or MCP). Current migrations:

- create_users_and_workspaces
- enable_rls_and_policies
- handle_new_user_trigger
- updated_at_trigger
- ... (17 total, last: add_lead_assigned_notification)

For new schema changes: create migration in Dashboard SQL Editor or via `apply_migration` MCP tool, test on dev first, then merge to main.

---

## 6. Auth URL Configuration (One-Time Setup)

**Problem:** Confirmation and password reset links in emails point to localhost instead of production.

**Fix (one-time, no need to add each new domain):**

### 1. Vercel env var (auto-detection per deployment)

Add to Vercel > Project > Settings > Environment Variables:

| Name                   | Value                 | Environment         |
| ---------------------- | --------------------- | ------------------- |
| `NEXT_PUBLIC_SITE_URL` | `https://$VERCEL_URL` | Production, Preview |

`$VERCEL_URL` is replaced automatically per deployment (prod, preview, custom domain).

### 2. Supabase Dashboard > Authentication > URL Configuration

| Setting           | Value                                                              |
| ----------------- | ------------------------------------------------------------------ |
| **Site URL**      | `https://2mb-crm.vercel.app` (or your main production domain)      |
| **Redirect URLs** | Add these (wildcard covers all Vercel deployments):                |
|                   | `https://*.vercel.app/**`                                          |
|                   | `http://localhost:3000/**`                                         |

Optional: add custom domain when you have one, e.g. `https://crm.2mb.dev/**`.

**Site URL** is the base for email links. **Redirect URLs** must allow where Supabase can redirect; `*.vercel.app` covers production + all preview deployments.

---

## 7. Checklist Before Going Live

- [ ] Dev branch created and tested
- [ ] Manual backup taken (schema + data if needed)
- [ ] `.env.example` documents all required vars
- [ ] Vercel prod env uses prod Supabase
- [ ] Vercel preview env uses dev Supabase (optional)
- [ ] Consider Pro plan for Daily Backups when revenue allows
- [ ] Supabase Site URL set to production domain (see §6)
