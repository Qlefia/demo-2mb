# 2mb — Urban Oasis configurator (client demo)

Interactive apartment configurator showcase for **Urban Oasis**.

## Live demo entry

After deploy, open:

- **Configurator:** `/demo/projects/urban-oasis/configure`
- **Project catalog:** `/demo/projects`

Root `/` redirects to the configurator.

## Deploy on Vercel

1. Import this repo in [Vercel](https://vercel.com) (region: **Frankfurt / fra1**).
2. Add environment variables from `.env.example` (minimum for build):

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`

3. Deploy. No extra build command — default `npm run build` works.

## Local development

```bash
npm install
cp .env.example .env.local
# fill Supabase + DATABASE_URL
npm run dev
```

Open http://localhost:3000/demo/projects/urban-oasis/configure

## Stack

Next.js 16 · React 19 · Tailwind CSS v4
