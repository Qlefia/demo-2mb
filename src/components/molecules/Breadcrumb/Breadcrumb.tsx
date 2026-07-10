'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const { t } = useTranslation()
  return (
    <nav aria-label={t('aria.breadcrumb')}>
      <ol className="flex items-center gap-1.5 text-sm">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={`${i}-${item.href ?? item.label}`} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={14} className="text-muted" />}
              {isLast ? (
                <span className="font-medium" aria-current="page">{item.label}</span>
              ) : (
                <Link href={item.href ?? '/'} className="text-muted transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
