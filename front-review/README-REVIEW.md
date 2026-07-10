# 2mb CRM — frontend bundle for review

Снимок UI-кода без `node_modules`, `.next`, backend и секретов.

## Запуск локально

```bash
npm install
cp .env.example .env.local   # заполнить NEXT_PUBLIC_* и Supabase при необходимости
npm run dev
```

## Структура

| Папка / файл | Назначение |
| --- | --- |
| `app/` | Next.js App Router — страницы, layouts, API routes (BFF) |
| `src/components/` | Design system: atoms → molecules → organisms |
| `src/features/` | Feature-модули (prospects, proposals, studio-settings, …) |
| `src/views/` | Page-level view-компоненты |
| `src/lib/` | Утилиты, pipeline, proposals, db schema (Drizzle types) |
| `src/i18n/` | Локали de / en / ru |
| `src/stores/` | Zustand (UI prefs) |
| `src/providers/` | React providers (Query, Auth, …) |
| `src/layouts/` | Dashboard shell |
| `src/styles/` | globals.css, Tailwind v4 `@theme` |
| `public/` | Статика |
| `.storybook/` | Storybook (компоненты) |
| `e2e/` | Playwright smoke (опционально) |

## Конфиг

- `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.js`
- `proxy.ts` — middleware-прокси
- `.env.example` — шаблон env (без секретов)

## Не включено

- `node_modules/`, `.next/`, `.git/`
- `supabase/` — миграции и SQL
- `scripts/` — seed/smoke CLI
- `.env.local` — секреты
- `.cursor/`, CI, wrangler/cloudflare deploy

## Ключевые экраны (routes)

- `/` — dashboard
- `/prospects`, `/prospects/[id]` — компании + карточка
- `/settings/studio/**` — Studio / Sales catalogue
- `/profile/**` — профиль пользователя
- `/p/[token]` — публичный proposal deck
