'use client'

import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, Label } from '@/components/atoms'
import { PasswordStrengthMeter } from '@/components/molecules'
import { toast } from '@/components/molecules/Toast'
import { changePasswordSchema, type ChangePasswordFormValues } from '@/lib/passwordPolicy'
export function SecuritySettings() {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onChange',
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const newPassword = watch('newPassword') ?? ''

  const onSubmit = async (_data: ChangePasswordFormValues) => {
    toast(t('settingsPage.passwordChanged'), 'success')
    reset({ newPassword: '', confirmPassword: '' })
  }

  return (
    <div className="max-w-lg space-y-8">
      <section>
        <h2 className="text-base font-semibold">{t('settingsPage.changePassword')}</h2>
        <p className="mt-1 max-w-xl text-sm text-muted">{t('settingsPage.changePasswordHint')}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="security-new-password" required>
              {t('settingsPage.newPassword')}
            </Label>
            <Input
              id="security-new-password"
              type="password"
              autoComplete="new-password"
              placeholder={t('auth.passwordPlaceholder')}
              error={errors.newPassword ? t(errors.newPassword.message!) : undefined}
              {...register('newPassword')}
            />
            <PasswordStrengthMeter password={newPassword} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="security-confirm-password" required>
              {t('settingsPage.confirmPassword')}
            </Label>
            <Input
              id="security-confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder={t('auth.confirmPasswordPlaceholder')}
              error={errors.confirmPassword ? t(errors.confirmPassword.message!) : undefined}
              {...register('confirmPassword')}
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="submit" disabled={isSubmitting || !isValid}>
              {t('settingsPage.changePasswordSubmit')}
            </Button>
          </div>
        </form>
      </section>

      <section className="border-t border-border pt-8">
        <h2 className="text-base font-semibold">{t('settingsPage.connectedAccounts')}</h2>
        <p className="mt-2 text-sm text-muted">{t('settingsPage.connectedAccountsEmpty')}</p>
      </section>
    </div>
  )
}
