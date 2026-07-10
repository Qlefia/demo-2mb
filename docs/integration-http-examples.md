# Integration API: quick checks (curl / Insomnia)

Base URL (local): `http://localhost:3000`

## 1. Create session (S2S, API key `psk_...`)

**Method:** `POST`  
**URL:** `/api/v1/sessions` (exact path; a typo such as `sassions` returns 404, not a valid session response)  
**Headers:**

- `Authorization`: `Bearer <YOUR_PSK_KEY>`
- `Content-Type`: `application/json`

**Body (JSON):**

```json
{
  "survey_id": "<published survey UUID>",
  "external_user_id": "any_string_per_user",
  "metadata": {}
}
```

**Response:** `session_id`, `current_step`, `widget_token` (JWT starting with `eyJ`).

---

## 2. Complete survey (widget JWT only)

Call this **after** the respondent has finished all steps in the UI (session has full answers).  
Use a **new** `widget_token` from step 1 if the previous session is already completed.

**Method:** `POST`  
**URL:** `/api/v1/widget/session/complete`  
**Headers:**

- `Authorization`: `Bearer <widget_token from step 1>`
- `Content-Type`: `application/json`

**Body:** empty or `{}`

**Response (200):** includes:

- `results_payload` — same object we would send in the outbound webhook (`survey.completed`). Your mapped keys (e.g. `investment_goal`) appear here.
- `webhook_delivered` — whether HTTPS webhook was called successfully (requires webhook URL + secret in **workspace** settings).

---

## PowerShell (copy-paste blocks)

Replace placeholders.

```powershell
$BASE = "http://localhost:3000"
$PSK = "<psk_...>"
$SURVEY = "<survey-uuid>"

$session = Invoke-RestMethod -Method POST -Uri "$BASE/api/v1/sessions" `
  -Headers @{ Authorization = "Bearer $PSK"; "Content-Type" = "application/json" } `
  -Body (@{ survey_id = $SURVEY; external_user_id = "insomnia_test_1" } | ConvertTo-Json -Compress)

$session.widget_token
# Open in browser: "$BASE/s/$SURVEY?widget_token=$($session.widget_token)"
# Finish the survey in the browser, then:

Invoke-RestMethod -Method POST -Uri "$BASE/api/v1/widget/session/complete" `
  -Headers @{ Authorization = "Bearer $($session.widget_token)"; "Content-Type" = "application/json" } `
  -Body "{}"
```

If `complete` returns `already_completed: true`, the session was already finished (e.g. you clicked through in the browser). The response still includes **`results_payload`** and **`response_id`** (when saved) so you can inspect mapped keys without creating a new session. For a fresh end-to-end test, create a **new** session (step 1) and a new `widget_token`.

---

## Insomnia

1. **Folder:** 2mb CRM local  
2. **Request A — Create session:** as in section 1; copy `widget_token` from the response.  
3. **Request B — Complete:** as in section 2; set Auth to **Bearer Token** = `widget_token` from A.  
4. Run A, complete the survey in the browser with that token, then run B. Inspect **`results_payload`** in the JSON body.

---

## Refresh widget token (optional)

**POST** `/api/v1/sessions/<session_id>/token`  
**Headers:** `Authorization: Bearer <PSK>`

Use when the JWT expired before `complete`.

---

## Answers shape: composite steps and mapping rules

- For a **`composite`** step, `answers[step_id]` is an object keyed by **block id** (each value matches the shape for that block kind: string for `text_input`, option map for multiselect, etc.).
- In the builder **Dev** tab **payload mapping**, pick a specific block when mapping select / multiselect / scale; the rule stores optional **`source_block_id`**. Mapping the whole composite step as raw JSON uses the step without `source_block_id`.
- For select / multiselect, **API codes** are set per option in the **center editor** (not in Dev). Dev only chooses **send as**: visible labels, option UUIDs, or those API codes.
- Webhook / `results_payload` uses the same mapping rules; keys you define still appear at the top level of `results_payload`.
