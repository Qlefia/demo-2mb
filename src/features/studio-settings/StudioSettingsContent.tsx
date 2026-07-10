'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import { StudioSettingsTabNav } from '@/features/studio-settings/StudioSettingsTabNav'
import { StudioSalesSubNav } from '@/features/studio-settings/StudioSalesSubNav'
import { StudioSettingsMainPane } from '@/features/studio-settings/components/StudioSettingsMainPane'
import { StudioGeneralSection } from '@/features/studio-settings/sections/StudioGeneralSection'
import { StudioProposalSection } from '@/features/studio-settings/sections/StudioProposalSection'
import { StudioInvoicingSection } from '@/features/studio-settings/sections/StudioInvoicingSection'
import { StudioOfferSection } from '@/features/studio-settings/sections/StudioOfferSection'
import { StudioServicesHubSection } from '@/features/studio-settings/sections/StudioServicesHubSection'
import { StudioServiceGroupEditorSection } from '@/features/studio-settings/sections/StudioServiceGroupEditorSection'
import { StudioCatalogSection } from '@/features/studio-settings/sections/StudioCatalogSection'
import { StudioServiceCatalogEditorSection } from '@/features/studio-settings/sections/StudioServiceCatalogEditorSection'
import { StudioBrandKitSection } from '@/features/studio-settings/sections/StudioBrandKitSection'
import { StudioSegmentsSection } from '@/features/studio-settings/sections/StudioSegmentsSection'
import { StudioSegmentDetailSection } from '@/features/studio-settings/sections/StudioSegmentDetailSection'
import { StudioWorksSection } from '@/features/studio-settings/sections/StudioWorksSection'
import { StudioWorkDetailSection } from '@/features/studio-settings/sections/StudioWorkDetailSection'
import { StudioReviewsSection } from '@/features/studio-settings/sections/StudioReviewsSection'
import { StudioReviewDetailSection } from '@/features/studio-settings/sections/StudioReviewDetailSection'
import { StudioToolsHubSection } from '@/features/studio-settings/sections/StudioToolsHubSection'
import { StudioToolDetailSection } from '@/features/studio-settings/sections/StudioToolDetailSection'
import { StudioProductsHubSection } from '@/features/studio-settings/sections/StudioProductsHubSection'
import { StudioProductDetailSection } from '@/features/studio-settings/sections/StudioProductDetailSection'
import { StudioPlaybooksHubSection } from '@/features/playbooks/sections/StudioPlaybooksHubSection'
import { StudioPlaybookDetailSection } from '@/features/playbooks/sections/StudioPlaybookDetailSection'
import { StudioOfficeDetailSection } from '@/features/studio-settings/sections/StudioOfficeDetailSection'
import { StudioBankAccountDetailSection } from '@/features/studio-settings/sections/StudioBankAccountDetailSection'
import { StudioTemplateDetailSection } from '@/features/studio-settings/sections/StudioTemplateDetailSection'
import { StudioSalesListToolbar } from '@/features/studio-settings/components/StudioSalesListToolbar'
import { StudioSyncGate } from '@/features/studio-settings/components/StudioSyncGate'
import { StudioProfileSyncProvider } from '@/features/studio-settings/StudioProfileSyncProvider'
import { TeamSettings } from '@/features/settings/TeamSettings'
import { studioSettingsShellRow } from '@/features/studio-settings/studioBlockChrome'
import {
  STUDIO_SALES_BASE,
  STUDIO_SALES_GROUPS,
  STUDIO_SALES_PRODUCTS,
  STUDIO_SALES_REVIEWS,
  STUDIO_SALES_SEGMENTS,
  STUDIO_SALES_SERVICES,
  STUDIO_SALES_TOOLS,
  STUDIO_SALES_WORKS,
  STUDIO_SALES_PLAYBOOKS,
  isStudioSalesDetailEditorPath,
  isStudioSalesPath,
  studioRelationsEntityFromPath,
  studioSalesListTabFromPath,
} from '@/lib/studio/studioSalesPaths'
import { isStudioOfficeDetailPath } from '@/lib/studio/studioOfficesPaths'
import { isStudioBankAccountDetailPath } from '@/lib/studio/studioBankAccountsPaths'
import { isStudioTemplateDetailPath } from '@/lib/studio/studioTemplatesPaths'
import { isStudioBrandPath } from '@/lib/studio/studioBrandPaths'

const SALES_GROUP_EDITOR = /^\/settings\/studio\/sales\/groups\/[^/]+$/
const SALES_CATALOG_DETAIL = /^\/settings\/studio\/sales\/services\/[^/]+$/
const SALES_WORK_DETAIL = /^\/settings\/studio\/sales\/works\/[^/]+$/
const SALES_REVIEW_DETAIL = /^\/settings\/studio\/sales\/reviews\/[^/]+$/
const SALES_SEGMENT_DETAIL = /^\/settings\/studio\/sales\/segments\/[^/]+$/
const SALES_TOOL_DETAIL = /^\/settings\/studio\/sales\/tools\/[^/]+$/
const SALES_PRODUCT_DETAIL = /^\/settings\/studio\/sales\/products\/[^/]+$/
const SALES_PLAYBOOK_DETAIL = /^\/settings\/studio\/sales\/playbooks\/[^/]+$/

function SalesListHeader({ tab }: { tab: NonNullable<ReturnType<typeof studioSalesListTabFromPath>> }) {
  return (
    <>
      <StudioSalesSubNav />
      <div className="mt-4">
        <StudioSalesListToolbar tab={tab} />
      </div>
    </>
  )
}

export function StudioSettingsContent() {
  const pathname = usePathname()
  const relationsEntity = studioRelationsEntityFromPath(pathname)
  const builderLayout = relationsEntity !== null || isStudioSalesDetailEditorPath(pathname)

  let body: ReactNode
  if (pathname === '/settings/studio') {
    body = <StudioGeneralSection />
  } else if (isStudioOfficeDetailPath(pathname)) {
    // `page` (not `builder`) — office detail intentionally has no relations
    // sidebar, so it needs the shared main-scroll + content gutter that
    // `builder` skips. Mirrors `/settings/studio/{invoicing,offer,proposal}`.
    body = (
      <StudioSettingsMainPane variant="page">
        <StudioOfficeDetailSection />
      </StudioSettingsMainPane>
    )
  } else if (isStudioBankAccountDetailPath(pathname)) {
    // Bank-account detail edit screen — same "page" layout as Offices.
    body = (
      <StudioSettingsMainPane variant="page">
        <StudioBankAccountDetailSection />
      </StudioSettingsMainPane>
    )
  } else if (isStudioTemplateDetailPath(pathname)) {
    // Document-template detail — back-link returns to the Invoicing/Proposal/Offer
    // tab matching the template `kind`.
    body = (
      <StudioSettingsMainPane variant="page">
        <StudioTemplateDetailSection />
      </StudioSettingsMainPane>
    )
  } else if (isStudioSalesPath(pathname)) {
    let inner: ReactNode
    if (pathname === STUDIO_SALES_BASE || pathname === `${STUDIO_SALES_BASE}/`) {
      inner = <StudioServicesHubSection view="groups" />
    } else if (pathname === STUDIO_SALES_GROUPS) {
      inner = <StudioServicesHubSection view="groups" />
    } else if (SALES_GROUP_EDITOR.test(pathname)) {
      inner = <StudioServiceGroupEditorSection />
    } else if (pathname === STUDIO_SALES_SERVICES) {
      inner = <StudioCatalogSection />
    } else if (SALES_CATALOG_DETAIL.test(pathname)) {
      inner = <StudioServiceCatalogEditorSection />
    } else if (pathname === STUDIO_SALES_WORKS) {
      inner = <StudioWorksSection />
    } else if (SALES_WORK_DETAIL.test(pathname)) {
      inner = <StudioWorkDetailSection />
    } else if (pathname === STUDIO_SALES_REVIEWS) {
      inner = <StudioReviewsSection />
    } else if (SALES_REVIEW_DETAIL.test(pathname)) {
      inner = <StudioReviewDetailSection />
    } else if (pathname === STUDIO_SALES_SEGMENTS) {
      inner = <StudioSegmentsSection />
    } else if (SALES_SEGMENT_DETAIL.test(pathname)) {
      inner = <StudioSegmentDetailSection />
    } else if (pathname === STUDIO_SALES_TOOLS) {
      inner = <StudioToolsHubSection />
    } else if (SALES_TOOL_DETAIL.test(pathname)) {
      inner = <StudioToolDetailSection />
    } else if (pathname === STUDIO_SALES_PRODUCTS) {
      inner = <StudioProductsHubSection />
    } else if (SALES_PRODUCT_DETAIL.test(pathname)) {
      inner = <StudioProductDetailSection />
    } else if (pathname === STUDIO_SALES_PLAYBOOKS) {
      inner = <StudioPlaybooksHubSection />
    } else if (SALES_PLAYBOOK_DETAIL.test(pathname)) {
      inner = <StudioPlaybookDetailSection />
    } else {
      inner = <StudioServicesHubSection view="groups" />
    }
    const salesListTab = studioSalesListTabFromPath(pathname)
    body = (
      <StudioSettingsMainPane
        variant={builderLayout ? 'builder' : 'list'}
        header={salesListTab && !builderLayout ? <SalesListHeader tab={salesListTab} /> : undefined}
      >
        {inner}
      </StudioSettingsMainPane>
    )
  } else if (isStudioBrandPath(pathname)) {
    body = (
      <StudioSettingsMainPane variant="builder">
        <StudioBrandKitSection />
      </StudioSettingsMainPane>
    )
  } else if (pathname === '/settings/studio/proposal') {
    body = (
      <StudioSettingsMainPane variant="page">
        <StudioProposalSection />
      </StudioSettingsMainPane>
    )
  } else if (pathname === '/settings/studio/invoicing') {
    body = (
      <StudioSettingsMainPane variant="page">
        <StudioInvoicingSection />
      </StudioSettingsMainPane>
    )
  } else if (pathname === '/settings/studio/offer') {
    body = (
      <StudioSettingsMainPane variant="page">
        <StudioOfferSection />
      </StudioSettingsMainPane>
    )
  } else if (pathname === '/settings/studio/team' || pathname.startsWith('/settings/studio/team/')) {
    body = (
      <StudioSettingsMainPane variant="page">
        <TeamSettings />
      </StudioSettingsMainPane>
    )
  } else {
    body = <StudioGeneralSection />
  }

  return (
    <StudioProfileSyncProvider>
      <div className={cn(studioSettingsShellRow, 'min-h-0 flex-1')}>
        <StudioSettingsTabNav compactShell />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <StudioSyncGate>{body}</StudioSyncGate>
        </div>
      </div>
    </StudioProfileSyncProvider>
  )
}
