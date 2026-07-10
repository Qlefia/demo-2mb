'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { Button, Input, Label } from '@/components/atoms'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'

const acceptSchema = z
  .object({
    displayName: z.string().min(1, 'acceptInvite.errors.displayNameRequired').max(120),
    password: z.string().min(12, 'acceptInvite.errors.passwordTooShort'),
    confirmPassword: z.string().min(1, 'acceptInvite.errors.passwordRequired'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'acceptInvite.errors.passwordMismatch',
    path: ['confirmPassword'],
  })

type AcceptForm = z.infer<typeof acceptSchema>

export interface AcceptInvitePageProps {
  initialEmail: string
  initialDisplayName: string
}

export function AcceptInvitePage({ initialEmail, initialDisplayName }: AcceptInvitePageProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptForm>({
    resolver: zodResolver(acceptSchema),
    defaultValues: {
      displayName: initialDisplayName,
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: AcceptForm) => {
    setSubmitting(true)
    setServerError(null)
    const supabase = createClient()
    const { data: updated, error } = await supabase.auth.updateUser({
      password: data.password,
      data: { display_name: data.displayName },
    })

    if (error || !updated.user) {
      setServerError(error?.message ?? 'unknown')
      setSubmitting(false)
      return
    }

    // Refresh local profile so the dashboard greets the user with the new name.
    try {
      await useUserStore.getState().loadProfile({
        id: updated.user.id,
        email: updated.user.email,
        user_metadata: updated.user.user_metadata,
      })
    } catch {
      // Profile load is best-effort; dashboard will refetch on its own.
    }

    setSuccess(true)
    setSubmitting(false)
    setTimeout(() => router.replace('/'), 1200)
  }

  if (success) {
    return (
      <div className="w-full max-w-sm text-center">
        <CheckCircle2 size={48} className="mx-auto text-success" />
        <h1 className="mt-4 text-2xl font-semibold">{t('acceptInvite.successTitle')}</h1>
        <p className="mt-2 text-sm text-muted">{t('acceptInvite.successSubtitle')}</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold">{t('acceptInvite.title')}</h1>
      <p className="mt-1 text-sm text-muted">
        {t('acceptInvite.subtitle', { email: initialEmail })}
      </p>

      {serverError && (
        <div className="mt-4 rounded-sm border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="ai-displayName" required>
            {t('acceptInvite.displayNameLabel')}
          </Label>
          <Input
            id="ai-displayName"
            type="text"
            autoComplete="name"
            placeholder={t('acceptInvite.displayNamePlaceholder')}
            error={errors.displayName ? t(errors.displayName.message!) : undefined}
            {...register('displayName')}
          />
        </div>

        <div>
          <Label htmlFor="ai-password" required>
            {t('acceptInvite.passwordLabel')}
          </Label>
          <Input
            id="ai-password"
            type="password"
            autoComplete="new-password"
            placeholder={t('acceptInvite.passwordPlaceholder')}
            error={errors.password ? t(errors.password.message!) : undefined}
            hint={t('acceptInvite.passwordHint')}
            {...register('password')}
          />
        </div>

        <div>
          <Label htmlFor="ai-confirm" required>
            {t('acceptInvite.confirmPasswordLabel')}
          </Label>
          <Input
            id="ai-confirm"
            type="password"
            autoComplete="new-password"
            placeholder={t('acceptInvite.confirmPasswordPlaceholder')}
            error={errors.confirmPassword ? t(errors.confirmPassword.message!) : undefined}
            {...register('confirmPassword')}
          />
        </div>

        <Button type="submit" className="w-full" loading={submitting}>
          {t('acceptInvite.submit')}
        </Button>
      </form>
    </div>
  )
}
