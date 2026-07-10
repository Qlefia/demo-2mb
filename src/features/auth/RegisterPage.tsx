'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, Label } from '@/components/atoms'
import { PasswordInput, PasswordStrengthMeter } from '@/components/molecules'
import { AuthMarketingSplitLayout } from '@/features/auth/AuthMarketingSplitLayout'
import { useAuthStore } from '@/stores/authStore'
import { POST_AUTH_STUDIO_PATH } from '@/lib/featureFlags'

const registerSchema = z
  .object({
    studioName: z.string().min(1, 'auth.studioNameRequired').max(120, 'auth.studioNameTooLong'),
    displayName: z.string().max(80).optional(),
    email: z.string().min(1, 'auth.emailRequired').email('auth.emailInvalid'),
    password: z.string().min(8, 'auth.passwordTooShort'),
  })
  .strict()

type RegisterForm = z.infer<typeof registerSchema>

function safeRedirect(target: string | null): string {
  if (!target) return POST_AUTH_STUDIO_PATH
  if (!target.startsWith('/')) return POST_AUTH_STUDIO_PATH
  if (target.startsWith('//')) return POST_AUTH_STUDIO_PATH
  return target
}

export function RegisterPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const signUp = useAuthStore((s) => s.signUp)
  const status = useAuthStore((s) => s.status)
  const authError = useAuthStore((s) => s.error)
  const clearError = useAuthStore((s) => s.clearError)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '' },
  })

  const passwordValue = watch('password') ?? ''

  const onSubmit = async (data: RegisterForm) => {
    clearError()
    const result = await signUp({
      email: data.email,
      password: data.password,
      displayName: data.displayName?.trim() || undefined,
      studioName: data.studioName.trim(),
    })
    if (!result.ok) {
      return
    }
    if (result.needsEmailConfirmation) {
      router.push('/login?registered=1')
      return
    }
    const prov = await fetch('/api/workspace/provision', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studioName: data.studioName.trim() }),
    })
    if (!prov.ok) {
      router.push('/login?provision=failed')
      return
    }
    router.push(safeRedirect(searchParams.get('redirect')))
    router.refresh()
  }

  return (
    <AuthMarketingSplitLayout variant="register">
      <div className="w-full text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t('auth.registerTitle')}</h1>
        <p className="mt-1 text-sm text-muted">{t('auth.registerSubtitle')}</p>

        {authError && (
          <div className="mt-4 rounded-sm border border-destructive/20 bg-destructive/5 px-4 py-3 text-left text-sm text-destructive">
            {t(authError)}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5 text-left">
          <div>
            <Label htmlFor="studioName" required>
              {t('auth.studioName')}
            </Label>
            <Input
              id="studioName"
              autoComplete="organization"
              placeholder={t('auth.studioNamePlaceholder')}
              error={errors.studioName ? t(errors.studioName.message!) : undefined}
              {...register('studioName')}
            />
          </div>

          <div>
            <Label htmlFor="displayName">{t('auth.displayName')}</Label>
            <Input
              id="displayName"
              autoComplete="name"
              placeholder={t('auth.displayNamePlaceholder')}
              error={errors.displayName ? t(errors.displayName.message!) : undefined}
              {...register('displayName')}
            />
          </div>

          <div>
            <Label htmlFor="email" required>
              {t('common.email')}
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t('auth.emailPlaceholder')}
              error={errors.email ? t(errors.email.message!) : undefined}
              {...register('email')}
            />
          </div>

          <div>
            <Label htmlFor="password" required>
              {t('auth.password')}
            </Label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              placeholder={t('auth.passwordPlaceholder')}
              error={errors.password ? t(errors.password.message!) : undefined}
              {...register('password')}
            />
            <PasswordStrengthMeter password={passwordValue} />
          </div>

          <Button type="submit" className="w-full" loading={status === 'loading'}>
            {t('auth.registerButton')}
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted">
          {t('auth.hasAccount')}{' '}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            {t('auth.signIn')}
          </Link>
        </p>
      </div>
    </AuthMarketingSplitLayout>
  )
}
