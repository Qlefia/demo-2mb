'use client'

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import {
  getPasswordScore,
  passwordStrengthBarClass,
  passwordStrengthLabelKey,
} from '@/lib/passwordPolicy'

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { t } = useTranslation()
  const rawScore = getPasswordScore(password)
  const filledSegments = Math.min(5, rawScore)
  const barTone = passwordStrengthBarClass(rawScore)
  const strengthLabelKey = passwordStrengthLabelKey(rawScore)

  return (
    <div className="space-y-1.5 pt-0.5">
      <p className="text-[0.6875rem] font-medium leading-tight text-muted">{t('auth.passwordHint')}</p>
      <div className="flex gap-0.5" role="presentation" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className={cn('h-1 flex-1 rounded-sm transition-colors', i < filledSegments ? barTone : 'bg-border')}
          />
        ))}
      </div>
      <p
        className={cn(
          'text-xs font-medium',
          rawScore === 0 && 'text-muted',
          rawScore > 0 && rawScore <= 2 && 'text-destructive',
          rawScore === 3 && 'text-warning',
          rawScore >= 4 && 'text-success',
        )}
      >
        {t(strengthLabelKey)}
      </p>
    </div>
  )
}
