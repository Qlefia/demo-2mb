# Public `/api/v1/*` API checklist (BACKLOG #38)

These routes are **not** protected by session middleware (`src/lib/supabase/middleware.ts` / root `proxy.ts`). Each handler **must** authenticate via S2S API key or widget JWT.

**Also public (middleware):** `/api/webhooks/*` (e.g. Paddle) — no user session; handlers verify provider signatures / secrets.

**Last verified:** 2026-03-25 (handlers in repo; re-run checks after changing these routes).

## Routes

| Path | Method | Auth | Expected without auth |
|------|--------|------|------------------------|
| `app/api/v1/sessions/route.ts` | POST | `Authorization: Bearer <workspace_integration_api_key>` | 401 |
| `app/api/v1/sessions/[sessionId]/token/route.ts` | POST | Same | 401 |
| `app/api/v1/widget/session/route.ts` | GET | `Authorization: Bearer <widget_jwt>` | 401 |
| `app/api/v1/widget/session/answers/route.ts` | PATCH | Widget JWT | 401 |
| `app/api/v1/widget/session/complete/route.ts` | POST | Widget JWT | 401 |

## Local verification (no secrets in repo)

1. `GET http://127.0.0.1:3000/api/v1/widget/session` without header → **401**.
2. `POST http://127.0.0.1:3000/api/v1/sessions` with body `{"survey_id":"<uuid>","external_user_id":"x"}` without header → **401**.
3. `POST http://127.0.0.1:3000/api/v1/sessions/<sessionId>/token` without header → **401**.
4. With a valid key/JWT: wrong `survey_id` / mismatched session claims → **404** or **400**, not **200** with another tenant’s data.

## Tampering

- Replay with another workspace’s `survey_id` in JSON (valid key for workspace A, survey from B) → must **404**.
- Truncate JSON fields or wrong types → **400** where Zod applies.

Playwright: `e2e/api-v1-unauthorized.spec.ts` (401 without `Authorization`). `e2e/api-v1-extended.spec.ts` — billing 401, Paddle webhook 401 (skip if `PADDLE_WEBHOOK_SKIP_VERIFY=true`). Extend per BACKLOG **#37** for JWT happy path with real secrets.
