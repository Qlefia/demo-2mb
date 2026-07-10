'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { Button, Input, Label } from '@/components/atoms'
import { useAuthStore } from '@/stores/authStore'

const resetSchema = z
  .object({
    password: z.string().min(8, 'auth.passwordTooShort'),
    confirmPassword: z.string().min(1, 'auth.passwordRequired'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth.passwordMismatch',
    path: ['confirmPassword'],
  })

type ResetForm = z.infer<typeof resetSchema>

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const resetPassword = useAuthStore((s) => s.resetPassword)
  const status = useAuthStore((s) => s.status)
  const authError = useAuthStore((s) => s.error)
  const clearError = useAuthStore((s) => s.clearError)
  const [success, setSuccess] = useState(false)
  const redirectTimer = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => () => {
    if (redirectTimer.current) clearTimeout(redirectTimer.current)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  })

  const onSubmit = async (data: ResetForm) => {
    clearError()
    const ok = await resetPassword(data.password)
    if (ok) {
      setSuccess(true)
      redirectTimer.current = setTimeout(() => router.push('/'), 2000)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-sm text-center">
        <CheckCircle2 size={48} className="mx-auto text-success" />
        <h1 className="mt-4 text-2xl font-semibold">{t('auth.passwordUpdated')}</h1>
        <p className="mt-2 text-sm text-muted">{t('auth.passwordUpdatedDesc')}</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold">{t('auth.resetPasswordTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('auth.resetPasswordSubtitle')}</p>

      {authError && (
        <div className="mt-4 rounded-sm border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {t(authError)}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="password" required>{t('auth.newPassword')}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder={t('auth.passwordPlaceholder')}
            error={errors.password ? t(errors.password.message!) : undefined}
            hint={t('auth.passwordHint')}
            {...register('password')}
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword" required>{t('auth.confirmPassword')}</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder={t('auth.confirmPasswordPlaceholder')}
            error={errors.confirmPassword ? t(errors.confirmPassword.message!) : undefined}
            {...register('confirmPassword')}
          />
        </div>

        <Button type="submit" className="w-full" loading={status === 'loading'}>
          {t('auth.resetPasswordButton')}
        </Button>
      </form>
    </div>
  )
}
