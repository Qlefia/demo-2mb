'use client'

import { createContext, useContext, type ReactNode } from 'react'

export type StudioSalesListCardLayout = 'list' | 'grid'

const StudioSalesListLayoutContext = createContext<StudioSalesListCardLayout>('list')

export function StudioSalesListLayoutProvider({
  layout,
  children,
}: {
  layout: StudioSalesListCardLayout
  children: ReactNode
}) {
  return (
    <StudioSalesListLayoutContext.Provider value={layout}>
      {children}
    </StudioSalesListLayoutContext.Provider>
  )
}

export function useStudioSalesListCardLayout(): StudioSalesListCardLayout {
  return useContext(StudioSalesListLayoutContext)
}
