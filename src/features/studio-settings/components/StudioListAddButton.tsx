'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { StudioAccentAddButton } from '@/features/studio-settings/components/StudioAccentAddButton'

type StudioListAddButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
}

export function StudioListAddButton({ children, ...props }: StudioListAddButtonProps) {
  return (
    <StudioAccentAddButton layout="block" {...props}>
      {children}
    </StudioAccentAddButton>
  )
}
