'use client'

import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/atoms'
import {
  studioWorkPublicationBadgeVariant,
  studioWorkPublicationStatusI18nKey,
  type StudioWorkPublicationStatus,
} from '@/features/studio-settings/lib/studioWorkPublicationStatus'

type StudioWorkPublicationBadgeProps = {
  status: StudioWorkPublicationStatus
  size?: 'sm' | 'md'
}

export function StudioWorkPublicationBadge({ status, size = 'sm' }: StudioWorkPublicationBadgeProps) {
  const { t } = useTranslation()
  return (
    <Badge variant={studioWorkPublicationBadgeVariant(status)} size={size}>
      {t(studioWorkPublicationStatusI18nKey(status))}
    </Badge>
  )
}
