'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, Label } from '@/components/atoms'
import { PasswordInput } from '@/components/molecules'
import { AuthMarketingSplitLayout } from '@/features/auth/AuthMarketingSplitLayout'
import { useAuthStore } from '@/stores/authStore'

const loginSchema = z.object({
  email: z.string().min(1, 'auth.emailRequired').email('auth.emailInvalid'),
  password: z.string().min(1, 'auth.passwordRequired'),
})

type LoginForm = z.infer<typeof loginSchema>

function safeRedirect(target: string | null): string {
  if (!target) return '/'
  if (!target.startsWith('/')) return '/'
  if (target.startsWith('//')) return '/'
  return target
}

export function LoginPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered') === '1'
  const provisionFailed = searchParams.get('provision') === 'failed'
  const signIn = useAuthStore((s) => s.signIn)
  const status = useAuthStore((s) => s.status)
  const authError = useAuthStore((s) => s.error)
  const clearError = useAuthStore((s) => s.clearError)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    clearError()
    const success = await signIn(data.email, data.password)
    if (success) {
      router.push(safeRedirect(searchParams.get('redirect')))
      router.refresh()
    }
  }

  return (
    <AuthMarketingSplitLayout variant="login">
      <div className="w-full text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t('auth.loginTitle')}</h1>
        <p className="mt-1 text-sm text-muted">{t('auth.loginSubtitle')}</p>

        {authError && (
          <div className="mt-4 rounded-sm border border-destructive/20 bg-destructive/5 px-4 py-3 text-left text-sm text-destructive">
            {t(authError)}
          </div>
        )}

        {registered && (
          <div className="mt-4 rounded-sm border border-border bg-hover px-4 py-3 text-left text-sm text-foreground">
            {t('auth.checkEmail')}
          </div>
        )}

        {provisionFailed && (
          <div className="mt-4 rounded-sm border border-destructive/20 bg-destructive/5 px-4 py-3 text-left text-sm text-destructive">
            {t('auth.provisionFailed')}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5 text-left">
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

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password" required>{t('auth.password')}</Label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-muted hover:text-foreground"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              placeholder={t('auth.passwordPlaceholder')}
              error={errors.password ? t(errors.password.message!) : undefined}
              {...register('password')}
            />
          </div>

          <Button type="submit" className="w-full" loading={status === 'loading'}>
            {t('auth.loginButton')}
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted">
          {t('auth.noAccount')}{' '}
          <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
            {t('auth.signUp')}
          </Link>
        </p>
      </div>
    </AuthMarketingSplitLayout>
  )
}
