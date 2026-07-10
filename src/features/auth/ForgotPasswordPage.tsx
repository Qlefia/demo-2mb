'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Mail } from 'lucide-react'
import { Button, Input, Label } from '@/components/atoms'
import { useAuthStore } from '@/stores/authStore'

const forgotSchema = z.object({
  email: z.string().min(1, 'auth.emailRequired').email('auth.emailInvalid'),
})

type ForgotForm = z.infer<typeof forgotSchema>

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const forgotPassword = useAuthStore((s) => s.forgotPassword)
  const status = useAuthStore((s) => s.status)
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (data: ForgotForm) => {
    const success = await forgotPassword(data.email)
    if (success) {
      setSentEmail(data.email)
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm text-center">
        <Mail size={48} className="mx-auto text-muted" />
        <h1 className="mt-4 text-2xl font-semibold">{t('auth.resetSent')}</h1>
        <p className="mt-2 text-sm text-muted">
          {t('auth.resetSentDesc', { email: sentEmail })}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
        >
          <ArrowLeft size={14} />
          {t('auth.backToLogin')}
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold">{t('auth.forgotPasswordTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('auth.forgotPasswordSubtitle')}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="email" required>{t('common.email')}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t('auth.emailPlaceholder')}
            error={errors.email ? t(errors.email.message!) : undefined}
            {...register('email')}
          />
        </div>

        <Button type="submit" className="w-full" loading={status === 'loading'}>
          {t('auth.sendResetLink')}
        </Button>
      </form>

      <p className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} />
          {t('auth.backToLogin')}
        </Link>
      </p>
    </div>
  )
}
