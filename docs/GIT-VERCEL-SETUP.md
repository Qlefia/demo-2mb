# Git and Vercel Setup

## Done

- Git initialized, initial commit pushed to `BEDEROV-GmbH/2mb-crm`
- Branch `main` is production
- Commit convention: [docs/COMMITS.md](COMMITS.md)

## GitHub Repo Settings (Recommended)

1. **Settings > General**
   - Default branch: `main`
   - Allow squash merging (optional, keeps history clean)

2. **Settings > Branches**
   - Add rule for `main`: Require pull request before merging (when team grows)
   - Require status checks to pass (optional, after Vercel is connected)

3. **Branch Strategy**
   - `main` = production
   - `develop` = integration (optional, create when needed)
   - Feature branches: `feat/feature-name`, `fix/bug-name`

## Vercel CI/CD

1. **Connect repo**: [vercel.com](https://vercel.com) > Add New Project > Import `BEDEROV-GmbH/2mb-crm`

2. **Build settings** (auto-detected for Next.js)
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Environment variables**
   - Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`
   - Never commit `.env.local` — use Vercel dashboard

4. **Region**: Set to `fra1` (Frankfurt) for GDPR

5. **Auto-deploy**: Every push to `main` triggers a production deploy. Preview deploys for PRs.

## Commit Examples

```
feat(auth): add dark mode support
fix(switch): thumb invisible on dark theme
docs: add Git/Vercel setup guide
refactor(billing): use semantic tokens
chore(deps): bump next to 16.0.0
```
