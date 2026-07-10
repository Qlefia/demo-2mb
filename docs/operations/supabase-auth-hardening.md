# Supabase Auth hardening (operations)

## Leaked password protection (BACKLOG #22)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) for the 2mb CRM project (region **eu-central-1**).
2. **Authentication** → **Providers** → **Email**.
3. Enable **Leaked password protection** (HaveIBeenPwned check).

Reference: [Password strength and leaked password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

No app deploy is required; verify new sign-ups still work after enabling.
