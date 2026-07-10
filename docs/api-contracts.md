# API Contracts -- Supabase Edge Functions

Planned Edge Functions for the Survey Builder MVP. Each function runs in Deno on Supabase (`eu-central-1`).

---

## 1. POST `/functions/v1/paddle-webhook`

Handles Paddle webhook events (subscription lifecycle).

**Auth:** Paddle webhook signature verification (no Supabase JWT).

**Input:** Raw Paddle webhook payload (JSON).

**Key events handled:**

| Paddle Event                      | Action                                    |
| --------------------------------- | ----------------------------------------- |
| `subscription.created`            | Insert row in `subscriptions`             |
| `subscription.updated`            | Update subscription status and period     |
| `subscription.canceled`           | Set status to `canceled`                  |
| `subscription.past_due`           | Set status to `past_due`                  |
| `transaction.completed`           | Update `current_period_end`               |

**Output:** `{ ok: true }` (200) or `{ error: string }` (400/500).

---

## 2. POST `/functions/v1/submit-response`

Receives a survey response from the widget or survey page.

**Auth:** Anonymous (public endpoint, rate-limited via Upstash Redis).

**Input:**

```typescript
{
  survey_id: string
  respondent_email?: string
  respondent_phone?: string
  respondent_name?: string
  consent_given: boolean
  answers: { step_id: string; step_type: string; value: unknown }[]
}
```

**Actions:**

1. Validate survey exists and is `published`
2. Check response limit not exceeded
3. Check expiration date
4. Compute scores (if scoring configured)
5. Insert into `survey_responses`
6. Update survey `stats` (total_responses, last_response_at)
7. Trigger notification (insert into `notifications`, send email if configured)

**Output:** `{ id: string; computed_scores: Record<string, number> }` (201).

---

## 3. POST `/functions/v1/ai-proxy` (post-MVP)

Proxy for AI API calls (ElevenLabs voice, HeyGen video).

**Auth:** Supabase JWT (authenticated user, Business plan required).

**Input:**

```typescript
{
  provider: 'elevenlabs' | 'heygen'
  action: string
  payload: Record<string, unknown>
}
```

**Actions:**

1. Verify user has Business plan
2. Retrieve encrypted API key from `user_api_keys`
3. Decrypt and forward request to provider
4. Deduct tokens from usage balance

**Output:** Provider response (proxied).

---

## 4. POST `/functions/v1/send-notification-email`

Sends email notifications via Brevo API.

**Auth:** Internal (called by database trigger or other Edge Functions, not exposed publicly).

**Input:**

```typescript
{
  to_email: string
  survey_title: string
  response_id: string
  respondent_email?: string
}
```

**Output:** `{ sent: true }` (200).
