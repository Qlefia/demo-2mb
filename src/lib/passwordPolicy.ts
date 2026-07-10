import { z } from 'zod'

/** Same rules as registration: length + upper, lower, digit. */
export const strongPasswordSchema = z
  .string()
  .min(8, 'auth.passwordTooShort')
  .refine((v) => /[A-Z]/.test(v), 'auth.passwordWeak')
  .refine((v) => /[a-z]/.test(v), 'auth.passwordWeak')
  .refine((v) => /\d/.test(v), 'auth.passwordWeak')

export const changePasswordSchema = z
  .object({
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'auth.passwordRequired'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'auth.passwordMismatch',
    path: ['confirmPassword'],
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

/** Raw score 0–6 from length and character classes; bar shows min(5, score) filled segments. */
export function getPasswordScore(pw: string): number {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

export function passwordStrengthLabelKey(score: number): string {
  if (score === 0) return 'auth.passwordStrengthPending'
  if (score <= 2) return 'auth.passwordStrengthWeak'
  if (score === 3) return 'auth.passwordStrengthMedium'
  if (score <= 5) return 'auth.passwordStrengthStrong'
  return 'auth.passwordStrengthVeryStrong'
}

export function passwordStrengthBarClass(score: number): string {
  if (score === 0) return 'bg-border'
  if (score <= 2) return 'bg-destructive'
  if (score === 3) return 'bg-warning'
  return 'bg-success'
}
