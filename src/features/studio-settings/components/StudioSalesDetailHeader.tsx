'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import {
  studioSalesDetailHeaderBack,
  studioSalesDetailHeaderBar,
  studioSalesDetailHeaderTitle,
} from '@/features/studio-settings/studioBlockChrome'
import { cn } from '@/lib/cn'

type StudioSalesDetailHeaderProps = {
  backHref: string
  backLabelKey?: string
  title: string
  endAdornment?: ReactNode
  className?: string
}

export function StudioSalesDetailHeader({
  backHref,
  backLabelKey = 'studioSettings.back',
  title,
  endAdornment,
  className,
}: StudioSalesDetailHeaderProps) {
  const { t } = useTranslation()

  return (
    <div className={cn(studioSalesDetailHeaderBar, className)}>
      <Link href={backHref} className={studioSalesDetailHeaderBack} aria-label={t(backLabelKey)}>
        <ArrowLeft size={16} aria-hidden />
      </Link>
      <p className={studioSalesDetailHeaderTitle} title={title}>
        {title}
      </p>
      {endAdornment}
    </div>
  )
}
