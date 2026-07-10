'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Maximize2, Minimize2, PanelRightOpen, X } from 'lucide-react'
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/react'
import { IconButton } from '@/components/atoms'
import { Select } from '@/components/molecules/Select'
import { cn } from '@/lib/cn'
import {
  tabListStudioRelationsRailClass,
  tabTriggerStudioRelationsClass,
} from '@/components/molecules/Tabs/tabListStyles'
import {
  studioRelationsRailAside,
  studioRelationsRailMobileTrigger,
  studioRelationsRailMobileTriggerButton,
  studioRelationsRailTabPanel,
  studioRelationsTabPanels,
  studioSettingsRailBodyTop,
} from '@/features/studio-settings/studioBlockChrome'
import { StudioRelationListShell } from '@/features/studio-settings/components/StudioRelationListShell'
import {
  StudioRelationsRailScroll,
  StudioRelationsTabBody,
} from '@/features/studio-settings/components/StudioRelationsRailScroll'
import { StudioCatalogMemberPicker } from '@/features/studio-settings/components/StudioCatalogMemberPicker'
import { StudioCatalogLinePricingFields } from '@/features/studio-settings/components/StudioCatalogLinePricingFields'
import { StudioCommercialPricingFields } from '@/features/studio-settings/components/StudioCommercialPricingFields'
import { pickCommercialPricing } from '@/features/studio-settings/lib/studioCommercialPricing'
import { StudioCatalogLineRelationsFields } from '@/features/studio-settings/components/StudioCatalogLineRelationsFields'
import { StudioReviewMemberPicker } from '@/features/studio-settings/components/StudioReviewMemberPicker'
import { StudioWorkMemberPicker } from '@/features/studio-settings/components/StudioWorkMemberPicker'
import { StudioServiceGroupMemberPicker } from '@/features/studio-settings/components/StudioServiceGroupMemberPicker'
import {
  relationsTabsForEntity,
  type StudioRelationsEntity,
  type StudioRelationsTabId,
} from '@/features/studio-settings/lib/studioRelationsSidebar'
import {
  mergeReviewCatalogFromWork,
  pruneReviewCatalogAfterWorkUnlink,
} from '@/features/studio-settings/lib/studioReviewCatalogFromWorks'
import { STUDIO_WORK_TEXT_LIMITS } from '@/features/studio-settings/constants'
import { getStudioServiceGroupTitle, useStudioProfileStore } from '@/stores/studioProfileStore'
import { serviceGroupsContainingCatalogLine } from '@/features/studio-settings/lib/catalogLineRelations'
import {
  canLinkLinkedCatalogBundle,
  canLinkWorkToServiceGroup,
  selectedWorkIdsForServiceGroup,
  toggleLinkedCatalogBundle,
  toggleWorkServiceGroupLink,
  workIsLinkedToServiceGroup,
} from '@/features/studio-settings/lib/studioGroupWorks'

const ICON_SIZE = 14
const ICON_STROKE = { strokeWidth: 1.25 as const }

type StudioRelationsSidebarProps = {
  entity: StudioRelationsEntity
}

export function StudioRelationsSidebar({ entity }: StudioRelationsSidebarProps) {
  const { t } = useTranslation()
  const tabs = useMemo(() => relationsTabsForEntity(entity.kind), [entity.kind])
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileFullscreen, setMobileFullscreen] = useState(false)

  const closeMobile = () => {
    setMobileOpen(false)
    setMobileFullscreen(false)
  }

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (mobileFullscreen) {
        setMobileFullscreen(false)
        return
      }
      closeMobile()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen, mobileFullscreen])

  useEffect(() => {
    if (!mobileOpen) setMobileFullscreen(false)
  }, [mobileOpen])

  if (tabs.length === 0) return null

  const panelLabel = t('studioSettings.relationsSidebar.aria')

  return (
    <>
      {!mobileOpen && (
        <div className={studioRelationsRailMobileTrigger}>
          <button
            type="button"
            className={studioRelationsRailMobileTriggerButton}
            onClick={() => setMobileOpen(true)}
            aria-expanded={false}
            aria-controls="studio-relations-mobile-panel"
          >
            <PanelRightOpen size={16} strokeWidth={1.25} className="shrink-0 text-muted" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{panelLabel}</span>
          </button>
        </div>
      )}

      {mobileOpen && !mobileFullscreen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          aria-label={t('studioSettings.relationsSidebar.closePanel')}
          onClick={closeMobile}
        />
      )}

      <aside
        id="studio-relations-mobile-panel"
        className={cn(
          studioRelationsRailAside,
          !mobileOpen && 'max-lg:hidden',
          mobileOpen && 'max-lg:fixed max-lg:z-50 max-lg:flex max-lg:shadow-lg',
          mobileOpen &&
            !mobileFullscreen &&
            'max-lg:inset-y-0 max-lg:right-0 max-lg:w-full max-lg:max-w-md max-lg:border-l max-lg:border-t-0',
          mobileOpen && mobileFullscreen && 'max-lg:inset-0 max-lg:w-full max-lg:max-w-none max-lg:border-0',
        )}
        aria-label={panelLabel}
      >
        <RelationsSidebarPanels
          entity={entity}
          tabs={tabs}
          mobileFullscreen={mobileFullscreen}
          onToggleFullscreen={() => setMobileFullscreen((prev) => !prev)}
          onClose={closeMobile}
        />
      </aside>
    </>
  )
}

type RelationsSidebarPanelsProps = {
  entity: StudioRelationsEntity
  tabs: ReturnType<typeof relationsTabsForEntity>
  mobileFullscreen: boolean
  onToggleFullscreen: () => void
  onClose: () => void
}

function RelationsSidebarPanels({
  entity,
  tabs,
  mobileFullscreen,
  onToggleFullscreen,
  onClose,
}: RelationsSidebarPanelsProps) {
  const { t } = useTranslation()

  return (
    <TabGroup className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-1 border-b border-border bg-background lg:border-b-0">
        <TabList className={cn(tabListStudioRelationsRailClass, 'min-w-0 flex-1 border-b-0')}>
          {tabs.map(({ id, labelKey, icon: Icon }) => (
            <Tab
              key={id}
              className={tabTriggerStudioRelationsClass}
              title={t(labelKey)}
              aria-label={t(labelKey)}
            >
              <Icon size={ICON_SIZE} {...ICON_STROKE} aria-hidden />
            </Tab>
          ))}
        </TabList>
        <div className="flex shrink-0 items-center gap-0.5 pr-2 lg:hidden">
          <IconButton
            icon={mobileFullscreen ? Minimize2 : Maximize2}
            size="xs"
            label={mobileFullscreen ? t('builder.exitFullscreen') : t('builder.fullscreenPanel')}
            onClick={onToggleFullscreen}
          />
          <IconButton
            icon={X}
            size="xs"
            label={t('studioSettings.relationsSidebar.closePanel')}
            onClick={onClose}
          />
        </div>
      </div>
      <TabPanels className={studioRelationsTabPanels}>
        {tabs.map((tab) => (
          <TabPanel
            key={tab.id}
            className={cn(studioRelationsRailTabPanel, 'px-3 pb-3', studioSettingsRailBodyTop)}
          >
            <StudioRelationsTabBody>
              <RelationsTabPanel entity={entity} tabId={tab.id} />
            </StudioRelationsTabBody>
          </TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  )
}

function RelationsTabPanel({ entity, tabId }: { entity: StudioRelationsEntity; tabId: StudioRelationsTabId }) {
  switch (entity.kind) {
    case 'group':
      if (tabId === 'services') return <GroupServicesPanel groupId={entity.id} />
      if (tabId === 'pricing') return <GroupPricingPanel groupId={entity.id} />
      if (tabId === 'works') return <GroupWorksPanel groupId={entity.id} />
      if (tabId === 'reviews') return <GroupReviewsPanel groupId={entity.id} />
      if (tabId === 'tools') return <GroupToolsPanel groupId={entity.id} />
      break
    case 'catalog':
      if (tabId === 'groups') return <CatalogGroupsPanel catalogLineId={entity.id} />
      if (tabId === 'pricing') return <CatalogPricingPanel catalogLineId={entity.id} />
      if (tabId === 'works') return <CatalogWorkPanel catalogLineId={entity.id} />
      if (tabId === 'reviews') return <CatalogReviewsPanel catalogLineId={entity.id} />
      if (tabId === 'tools') return <CatalogToolsPanel catalogLineId={entity.id} />
      break
    case 'work':
      if (tabId === 'services') return <WorkServicesPanel workId={entity.id} />
      if (tabId === 'groups') return <WorkGroupsPanel workId={entity.id} />
      if (tabId === 'tools') return <WorkToolsPanel workId={entity.id} />
      break
    case 'review':
      if (tabId === 'works') return <ReviewWorksPanel reviewId={entity.id} />
      if (tabId === 'services') return <ReviewServicesPanel reviewId={entity.id} />
      if (tabId === 'groups') return <ReviewGroupPanel reviewId={entity.id} />
      break
    case 'segment':
      if (tabId === 'services') return <SegmentServicesPanel segmentId={entity.id} />
      if (tabId === 'groups') return <SegmentGroupsPanel segmentId={entity.id} />
      if (tabId === 'works') return <SegmentWorksPanel segmentId={entity.id} />
      if (tabId === 'reviews') return <SegmentReviewsPanel segmentId={entity.id} />
      break
    case 'tool':
      if (tabId === 'groups') return <ToolGroupsPanel toolId={entity.id} />
      if (tabId === 'services') return <ToolServicesPanel toolId={entity.id} />
      if (tabId === 'works') return <ToolWorksPanel toolId={entity.id} />
      break
    case 'product':
      if (tabId === 'groups') return <ProductGroupPanel productId={entity.id} />
      if (tabId === 'services') return <ProductServicesPanel productId={entity.id} />
      if (tabId === 'works') return <ProductWorksPanel productId={entity.id} />
      break
  }
  return null
}

function GroupPricingPanel({ groupId }: { groupId: string }) {
  const group = useStudioProfileStore((s) => s.serviceGroups.find((g) => g.id === groupId))
  const updateServiceGroup = useStudioProfileStore((s) => s.updateServiceGroup)
  if (!group) return null
  return (
    <StudioRelationsRailScroll>
      <StudioCommercialPricingFields
        values={pickCommercialPricing(group)}
        onPatch={(patch) => updateServiceGroup(groupId, patch)}
        idPrefix={`grp-pricing-${groupId}`}
        defaultTierName={group.title.trim()}
      />
    </StudioRelationsRailScroll>
  )
}

function GroupServicesPanel({ groupId }: { groupId: string }) {
  const group = useStudioProfileStore((s) => s.serviceGroups.find((g) => g.id === groupId))
  const toggleServiceGroupMember = useStudioProfileStore((s) => s.toggleServiceGroupMember)
  const appendServiceGroupMember = useStudioProfileStore((s) => s.appendServiceGroupMember)
  if (!group) return null
  return (
    <StudioCatalogMemberPicker
      layout="rail"
      pickerBlockId={`studio-rel-grp-svc-${groupId}`}
      context="group"
      selectedIds={group.memberIds}
      onToggleSelected={(catalogLineId) => toggleServiceGroupMember(groupId, catalogLineId)}
      onAddNewLine={(newId) => appendServiceGroupMember(groupId, newId)}
    />
  )
}

function GroupWorksPanel({ groupId }: { groupId: string }) {
  const { t } = useTranslation()
  const group = useStudioProfileStore((s) => s.serviceGroups.find((g) => g.id === groupId))
  const works = useStudioProfileStore((s) => s.works)
  const updateWork = useStudioProfileStore((s) => s.updateWork)

  const memberIds = group?.memberIds ?? []
  const selectedIds = useMemo(
    () => selectedWorkIdsForServiceGroup(works, memberIds),
    [works, memberIds],
  )

  if (!group) return null

  if (memberIds.length === 0) {
    return (
      <StudioRelationsRailScroll>
        <p className="px-2 py-3 text-center text-[10px] text-muted">
          {t('studioSettings.relationsSidebar.emptyGroups')}
        </p>
      </StudioRelationsRailScroll>
    )
  }

  if (works.length === 0) {
    return (
      <StudioRelationsRailScroll>
        <p className="px-2 py-3 text-center text-[10px] text-muted">
          {t('studioSettings.reviews.linkedWorksEmptyCatalog')}
        </p>
      </StudioRelationsRailScroll>
    )
  }

  return (
    <StudioWorkMemberPicker
      layout="rail"
      selectedIds={selectedIds}
      emptyWorksMessage={t('studioSettings.reviews.linkedWorksEmptyCatalog')}
      onToggleSelected={(workId) => {
        const work = works.find((w) => w.id === workId)
        if (!work) return
        updateWork(workId, {
          linkedCatalogIds: toggleWorkServiceGroupLink(work, memberIds),
        })
      }}
      canTurnOn={(workId) => {
        const work = works.find((w) => w.id === workId)
        if (!work) return false
        return canLinkWorkToServiceGroup(work, memberIds)
      }}
    />
  )
}

function GroupReviewsPanel({ groupId }: { groupId: string }) {
  const { t } = useTranslation()
  const reviews = useStudioProfileStore((s) => s.reviews)
  const serviceGroups = useStudioProfileStore((s) => s.serviceGroups)
  const updateReview = useStudioProfileStore((s) => s.updateReview)
  const group = serviceGroups.find((g) => g.id === groupId)
  const memberSet = useMemo(() => new Set(group?.memberIds ?? []), [group?.memberIds])

  const selectedIds = useMemo(
    () => reviews.filter((r) => r.linkedServiceGroupId === groupId).map((r) => r.id),
    [reviews, groupId],
  )

  return (
    <StudioReviewMemberPicker
      layout="rail"
      selectedIds={selectedIds}
      onToggleSelected={(reviewId) => {
        const row = reviews.find((r) => r.id === reviewId)
        if (!row) return
        const viaGroup = row.linkedServiceGroupId === groupId
        updateReview(reviewId, { linkedServiceGroupId: viaGroup ? null : groupId })
      }}
      getRowMeta={(r) => {
        const viaGroup = r.linkedServiceGroupId === groupId
        const viaCatalog = r.linkedCatalogIds.some((cid) => memberSet.has(cid)) && !viaGroup
        if (viaCatalog) {
          return { disabled: true, statusTag: t('studioSettings.relationsSidebar.viaService') }
        }
        if (r.rating != null) return { statusTag: `${r.rating}/5` }
        return {}
      }}
    />
  )
}

function CatalogPricingPanel({ catalogLineId }: { catalogLineId: string }) {
  const row = useStudioProfileStore((s) => s.serviceCatalog.find((c) => c.id === catalogLineId))
  const updateCatalogItem = useStudioProfileStore((s) => s.updateCatalogItem)
  if (!row) return null
  return (
    <StudioRelationsRailScroll>
      <StudioCatalogLinePricingFields
        row={row}
        onPatch={(patch) => updateCatalogItem(catalogLineId, patch)}
        idPrefix={`cat-pricing-${catalogLineId}`}
      />
    </StudioRelationsRailScroll>
  )
}

function CatalogGroupsPanel({ catalogLineId }: { catalogLineId: string }) {
  const serviceGroups = useStudioProfileStore((s) => s.serviceGroups)
  const linkedCount = useMemo(
    () => serviceGroupsContainingCatalogLine(catalogLineId, serviceGroups).length,
    [catalogLineId, serviceGroups],
  )
  return (
    <StudioRelationListShell selectedCount={linkedCount}>
      <StudioCatalogLineRelationsFields catalogLineId={catalogLineId} sections={['groups']} compact />
    </StudioRelationListShell>
  )
}

function CatalogReviewsPanel({ catalogLineId }: { catalogLineId: string }) {
  const reviews = useStudioProfileStore((s) => s.reviews)
  const updateReview = useStudioProfileStore((s) => s.updateReview)
  const maxCatalog = STUDIO_WORK_TEXT_LIMITS.maxLinkedCatalogIds

  const selectedIds = useMemo(
    () => reviews.filter((r) => r.linkedCatalogIds.includes(catalogLineId)).map((r) => r.id),
    [catalogLineId, reviews],
  )

  const toggleLinkedCatalog = (reviewId: string) => {
    const row = reviews.find((r) => r.id === reviewId)
    if (!row) return
    const has = row.linkedCatalogIds.includes(catalogLineId)
    if (has) {
      updateReview(reviewId, {
        linkedCatalogIds: row.linkedCatalogIds.filter((cid) => cid !== catalogLineId),
      })
      return
    }
    if (row.linkedCatalogIds.length >= maxCatalog) return
    updateReview(reviewId, { linkedCatalogIds: [catalogLineId, ...row.linkedCatalogIds] })
  }

  const canLinkCatalog = (reviewId: string) => {
    const row = reviews.find((r) => r.id === reviewId)
    if (!row) return false
    return row.linkedCatalogIds.includes(catalogLineId) || row.linkedCatalogIds.length < maxCatalog
  }

  return (
    <StudioReviewMemberPicker
      layout="rail"
      selectedIds={selectedIds}
      onToggleSelected={toggleLinkedCatalog}
      canTurnOn={canLinkCatalog}
    />
  )
}

function CatalogWorkPanel({ catalogLineId }: { catalogLineId: string }) {
  const row = useStudioProfileStore((s) => s.serviceCatalog.find((c) => c.id === catalogLineId))
  const updateCatalogItem = useStudioProfileStore((s) => s.updateCatalogItem)
  if (!row) return null

  const selectedIds = row.linkedWorkId ? [row.linkedWorkId] : []

  const onToggle = (workId: string) => {
    if (row.linkedWorkId === workId) {
      updateCatalogItem(catalogLineId, { linkedWorkId: null })
      return
    }
    updateCatalogItem(catalogLineId, { linkedWorkId: workId })
  }

  return (
    <StudioWorkMemberPicker layout="rail" selectedIds={selectedIds} onToggleSelected={onToggle} />
  )
}

function WorkServicesPanel({ workId }: { workId: string }) {
  const work = useStudioProfileStore((s) => s.works.find((w) => w.id === workId))
  const updateWork = useStudioProfileStore((s) => s.updateWork)
  if (!work) return null

  const toggleLinkedCatalog = (catalogLineId: string) => {
    const has = work.linkedCatalogIds.includes(catalogLineId)
    if (has) {
      updateWork(work.id, { linkedCatalogIds: work.linkedCatalogIds.filter((x) => x !== catalogLineId) })
    } else if (work.linkedCatalogIds.length < STUDIO_WORK_TEXT_LIMITS.maxLinkedCatalogIds) {
      updateWork(work.id, { linkedCatalogIds: [catalogLineId, ...work.linkedCatalogIds] })
    }
  }

  const canLinkMore = (catalogLineId: string) =>
    work.linkedCatalogIds.includes(catalogLineId) ||
    work.linkedCatalogIds.length < STUDIO_WORK_TEXT_LIMITS.maxLinkedCatalogIds

  return (
    <StudioCatalogMemberPicker
      layout="rail"
      pickerBlockId={`studio-rel-work-svc-${workId}`}
      context="work"
      selectedIds={work.linkedCatalogIds}
      onToggleSelected={toggleLinkedCatalog}
      canTurnOn={canLinkMore}
      onAddNewLine={(newId) => {
        if (canLinkMore(newId)) {
          updateWork(work.id, { linkedCatalogIds: [newId, ...work.linkedCatalogIds] })
        }
      }}
    />
  )
}

function SegmentServicesPanel({ segmentId }: { segmentId: string }) {
  const segment = useStudioProfileStore((s) => s.segments.find((x) => x.id === segmentId))
  const updateSegment = useStudioProfileStore((s) => s.updateSegment)
  if (!segment) return null

  const toggleLinkedCatalog = (catalogLineId: string) => {
    const has = segment.linkedCatalogIds.includes(catalogLineId)
    if (has) {
      updateSegment(segment.id, {
        linkedCatalogIds: segment.linkedCatalogIds.filter((x) => x !== catalogLineId),
      })
    } else if (segment.linkedCatalogIds.length < STUDIO_WORK_TEXT_LIMITS.maxLinkedCatalogIds) {
      updateSegment(segment.id, { linkedCatalogIds: [catalogLineId, ...segment.linkedCatalogIds] })
    }
  }

  const canLinkMore = (catalogLineId: string) =>
    segment.linkedCatalogIds.includes(catalogLineId) ||
    segment.linkedCatalogIds.length < STUDIO_WORK_TEXT_LIMITS.maxLinkedCatalogIds

  return (
    <StudioCatalogMemberPicker
      layout="rail"
      pickerBlockId={`studio-rel-seg-svc-${segmentId}`}
      context="segment"
      selectedIds={segment.linkedCatalogIds}
      onToggleSelected={toggleLinkedCatalog}
      canTurnOn={canLinkMore}
      onAddNewLine={(newId) => {
        if (canLinkMore(newId)) {
          updateSegment(segment.id, { linkedCatalogIds: [newId, ...segment.linkedCatalogIds] })
        }
      }}
    />
  )
}

function SegmentGroupsPanel({ segmentId }: { segmentId: string }) {
  const segment = useStudioProfileStore((s) => s.segments.find((x) => x.id === segmentId))
  const serviceGroups = useStudioProfileStore((s) => s.serviceGroups)
  const updateSegment = useStudioProfileStore((s) => s.updateSegment)
  if (!segment) return null

  return (
    <StudioServiceGroupMemberPicker
      linkedCatalogIds={segment.linkedCatalogIds}
      onToggleGroup={(groupId) => {
        const group = serviceGroups.find((g) => g.id === groupId)
        if (!group) return
        updateSegment(segmentId, {
          linkedCatalogIds: toggleLinkedCatalogBundle(segment.linkedCatalogIds, group.memberIds),
        })
      }}
      canToggleGroup={(groupId) => {
        const group = serviceGroups.find((g) => g.id === groupId)
        if (!group) return false
        return canLinkLinkedCatalogBundle(segment.linkedCatalogIds, group.memberIds)
      }}
    />
  )
}

function SegmentWorksPanel({ segmentId }: { segmentId: string }) {
  const { t } = useTranslation()
  const segment = useStudioProfileStore((s) => s.segments.find((x) => x.id === segmentId))
  const works = useStudioProfileStore((s) => s.works)
  const updateSegment = useStudioProfileStore((s) => s.updateSegment)
  const updateWork = useStudioProfileStore((s) => s.updateWork)
  if (!segment) return null

  const maxWorks = STUDIO_WORK_TEXT_LIMITS.maxLinkedWorksPerSegment
  const memberIds = segment.linkedCatalogIds

  const toggleLinkedWork = (workId: string) => {
    const work = works.find((w) => w.id === workId)
    if (!work) return
    const has = segment.linkedWorkIds.includes(workId)
    if (has) {
      updateSegment(segmentId, {
        linkedWorkIds: segment.linkedWorkIds.filter((x) => x !== workId),
      })
      return
    }
    if (segment.linkedWorkIds.length >= maxWorks) return
    const linkedWorkIds = [workId, ...segment.linkedWorkIds]
    updateSegment(segmentId, { linkedWorkIds })
    if (memberIds.length > 0 && !workIsLinkedToServiceGroup(work, memberIds)) {
      updateWork(workId, {
        linkedCatalogIds: toggleWorkServiceGroupLink(work, memberIds),
      })
    }
  }

  const canLinkWork = (workId: string) =>
    segment.linkedWorkIds.includes(workId) || segment.linkedWorkIds.length < maxWorks

  if (works.length === 0) {
    return (
      <StudioRelationsRailScroll>
        <p className="px-2 py-3 text-center text-[10px] text-muted">
          {t('studioSettings.reviews.linkedWorksEmptyCatalog')}
        </p>
      </StudioRelationsRailScroll>
    )
  }

  return (
    <StudioWorkMemberPicker
      layout="rail"
      selectedIds={segment.linkedWorkIds}
      emptyWorksMessage={t('studioSettings.reviews.linkedWorksEmptyCatalog')}
      onToggleSelected={toggleLinkedWork}
      canTurnOn={canLinkWork}
    />
  )
}

function SegmentReviewsPanel({ segmentId }: { segmentId: string }) {
  const reviews = useStudioProfileStore((s) => s.reviews)
  const updateReview = useStudioProfileStore((s) => s.updateReview)

  const selectedIds = useMemo(
    () => reviews.filter((r) => r.linkedSegmentId === segmentId).map((r) => r.id),
    [reviews, segmentId],
  )

  return (
    <StudioReviewMemberPicker
      layout="rail"
      selectedIds={selectedIds}
      onToggleSelected={(reviewId) => {
        const row = reviews.find((r) => r.id === reviewId)
        if (!row) return
        const linked = row.linkedSegmentId === segmentId
        updateReview(reviewId, { linkedSegmentId: linked ? null : segmentId })
      }}
      getRowMeta={(r) => (r.rating != null ? { statusTag: `${r.rating}/5` } : {})}
    />
  )
}

function WorkGroupsPanel({ workId }: { workId: string }) {
  const works = useStudioProfileStore((s) => s.works)
  const serviceGroups = useStudioProfileStore((s) => s.serviceGroups)
  const updateWork = useStudioProfileStore((s) => s.updateWork)
  const work = works.find((w) => w.id === workId)

  if (!work) return null

  return (
    <StudioServiceGroupMemberPicker
      linkedCatalogIds={work.linkedCatalogIds}
      onToggleGroup={(groupId) => {
        const group = serviceGroups.find((g) => g.id === groupId)
        if (!group) return
        updateWork(workId, {
          linkedCatalogIds: toggleWorkServiceGroupLink(work, group.memberIds),
        })
      }}
      canToggleGroup={(groupId) => {
        const group = serviceGroups.find((g) => g.id === groupId)
        if (!group) return false
        return canLinkWorkToServiceGroup(work, group.memberIds)
      }}
    />
  )
}

function ReviewWorksPanel({ reviewId }: { reviewId: string }) {
  const row = useStudioProfileStore((s) => s.reviews.find((r) => r.id === reviewId))
  const works = useStudioProfileStore((s) => s.works)
  const serviceCatalog = useStudioProfileStore((s) => s.serviceCatalog)
  const updateReview = useStudioProfileStore((s) => s.updateReview)
  if (!row) return null

  const maxWorks = STUDIO_WORK_TEXT_LIMITS.maxLinkedWorksPerReview
  const maxCatalog = STUDIO_WORK_TEXT_LIMITS.maxLinkedCatalogIds

  const toggleLinkedWork = (workId: string) => {
    const has = row.linkedWorkIds.includes(workId)
    if (has) {
      const linkedWorkIds = row.linkedWorkIds.filter((x) => x !== workId)
      updateReview(reviewId, {
        linkedWorkIds,
        linkedCatalogIds: pruneReviewCatalogAfterWorkUnlink(
          row.linkedCatalogIds,
          workId,
          linkedWorkIds,
          works,
          serviceCatalog,
        ),
      })
      return
    }
    if (row.linkedWorkIds.length >= maxWorks) return
    updateReview(reviewId, {
      linkedWorkIds: [workId, ...row.linkedWorkIds],
      linkedCatalogIds: mergeReviewCatalogFromWork(
        row.linkedCatalogIds,
        workId,
        works,
        serviceCatalog,
        maxCatalog,
      ),
    })
  }

  const canLinkWork = (workId: string) =>
    row.linkedWorkIds.includes(workId) || row.linkedWorkIds.length < maxWorks

  return (
    <StudioWorkMemberPicker
      layout="rail"
      selectedIds={row.linkedWorkIds}
      onToggleSelected={toggleLinkedWork}
      canTurnOn={canLinkWork}
    />
  )
}

function ReviewServicesPanel({ reviewId }: { reviewId: string }) {
  const row = useStudioProfileStore((s) => s.reviews.find((r) => r.id === reviewId))
  const updateReview = useStudioProfileStore((s) => s.updateReview)
  if (!row) return null

  const maxCatalog = STUDIO_WORK_TEXT_LIMITS.maxLinkedCatalogIds

  const toggleLinkedCatalog = (catalogLineId: string) => {
    const has = row.linkedCatalogIds.includes(catalogLineId)
    if (has) {
      updateReview(reviewId, { linkedCatalogIds: row.linkedCatalogIds.filter((x) => x !== catalogLineId) })
      return
    }
    if (row.linkedCatalogIds.length >= maxCatalog) return
    updateReview(reviewId, { linkedCatalogIds: [catalogLineId, ...row.linkedCatalogIds] })
  }

  const canLinkCatalog = (catalogLineId: string) =>
    row.linkedCatalogIds.includes(catalogLineId) || row.linkedCatalogIds.length < maxCatalog

  return (
    <StudioCatalogMemberPicker
      layout="rail"
      pickerBlockId={`studio-rel-review-svc-${reviewId}`}
      context="work"
      selectedIds={row.linkedCatalogIds}
      onToggleSelected={toggleLinkedCatalog}
      canTurnOn={canLinkCatalog}
      onAddNewLine={(newId) => {
        if (canLinkCatalog(newId)) {
          updateReview(reviewId, { linkedCatalogIds: [newId, ...row.linkedCatalogIds] })
        }
      }}
    />
  )
}

function ReviewGroupPanel({ reviewId }: { reviewId: string }) {
  const { t } = useTranslation()
  const row = useStudioProfileStore((s) => s.reviews.find((r) => r.id === reviewId))
  const serviceGroups = useStudioProfileStore((s) => s.serviceGroups)
  const updateReview = useStudioProfileStore((s) => s.updateReview)
  if (!row) return null

  return (
    <StudioRelationsRailScroll>
      <Select
        value={row.linkedServiceGroupId ?? ''}
        disabled={serviceGroups.length === 0}
        onChange={(v) => updateReview(reviewId, { linkedServiceGroupId: v === '' ? null : v })}
        options={[
          { value: '', label: t('studioSettings.reviews.serviceGroupNone') },
          ...serviceGroups.map((g) => ({
            value: g.id,
            label: getStudioServiceGroupTitle(
              serviceGroups,
              g.id,
              t('studioSettings.services.untitledGroup'),
            ),
          })),
        ]}
        placeholder={t('studioSettings.reviews.serviceGroupNone')}
      />
    </StudioRelationsRailScroll>
  )
}

function WorkToolsPanel({ workId }: { workId: string }) {
  const { t } = useTranslation()
  const works = useStudioProfileStore((s) => s.works)
  const tools = useStudioProfileStore((s) => s.tools)
  const updateWork = useStudioProfileStore((s) => s.updateWork)
  const work = works.find((w) => w.id === workId)
  if (!work) return null

  const linked = work.linkedToolIds ?? []
  const toggleTool = (toolId: string) => {
    const has = linked.includes(toolId)
    updateWork(workId, {
      linkedToolIds: has ? linked.filter((tid) => tid !== toolId) : [toolId, ...linked],
    })
  }

  if (tools.length === 0) {
    return (
      <StudioRelationsRailScroll>
        <p className="px-2 py-3 text-center text-[10px] text-muted">
          {t('studioSettings.tools.emptyShort')}
        </p>
      </StudioRelationsRailScroll>
    )
  }

  return (
    <StudioRelationsRailScroll>
      <ul className="flex flex-col gap-1.5">
        {tools.map((tool) => {
          const isOn = linked.includes(tool.id)
          return (
            <li key={tool.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded-sm px-1.5 py-1.5 text-[11px] text-foreground transition-colors hover:bg-muted/30">
                <input
                  type="checkbox"
                  className="size-3.5 accent-primary"
                  checked={isOn}
                  onChange={() => toggleTool(tool.id)}
                />
                <span className="min-w-0 flex-1 truncate">
                  {tool.name.trim() || t('studioSettings.tools.untitled')}
                </span>
                {tool.vendor.trim() ? (
                  <span className="shrink-0 text-[10px] text-muted">{tool.vendor.trim()}</span>
                ) : null}
              </label>
            </li>
          )
        })}
      </ul>
    </StudioRelationsRailScroll>
  )
}

function ToolWorksPanel({ toolId }: { toolId: string }) {
  const { t } = useTranslation()
  const works = useStudioProfileStore((s) => s.works)
  const updateWork = useStudioProfileStore((s) => s.updateWork)

  const selectedIds = useMemo(
    () => works.filter((w) => (w.linkedToolIds ?? []).includes(toolId)).map((w) => w.id),
    [works, toolId],
  )

  if (works.length === 0) {
    return (
      <StudioRelationsRailScroll>
        <p className="px-2 py-3 text-center text-[10px] text-muted">
          {t('studioSettings.reviews.linkedWorksEmptyCatalog')}
        </p>
      </StudioRelationsRailScroll>
    )
  }

  return (
    <StudioWorkMemberPicker
      layout="rail"
      selectedIds={selectedIds}
      onToggleSelected={(workId) => {
        const work = works.find((w) => w.id === workId)
        if (!work) return
        const linked = work.linkedToolIds ?? []
        const has = linked.includes(toolId)
        updateWork(workId, {
          linkedToolIds: has ? linked.filter((tid) => tid !== toolId) : [toolId, ...linked],
        })
      }}
    />
  )
}

function ToolsCheckboxList({
  selected,
  onToggle,
}: {
  selected: string[]
  onToggle: (toolId: string) => void
}) {
  const { t } = useTranslation()
  const tools = useStudioProfileStore((s) => s.tools)
  if (tools.length === 0) {
    return (
      <StudioRelationsRailScroll>
        <p className="px-2 py-3 text-center text-[10px] text-muted">
          {t('studioSettings.tools.emptyShort')}
        </p>
      </StudioRelationsRailScroll>
    )
  }
  return (
    <StudioRelationsRailScroll>
      <ul className="flex flex-col gap-1.5">
        {tools.map((tool) => {
          const isOn = selected.includes(tool.id)
          return (
            <li key={tool.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded-sm px-1.5 py-1.5 text-[11px] text-foreground transition-colors hover:bg-muted/30">
                <input
                  type="checkbox"
                  className="size-3.5 accent-primary"
                  checked={isOn}
                  onChange={() => onToggle(tool.id)}
                />
                <span className="min-w-0 flex-1 truncate">
                  {tool.name.trim() || t('studioSettings.tools.untitled')}
                </span>
                {tool.vendor.trim() ? (
                  <span className="shrink-0 text-[10px] text-muted">{tool.vendor.trim()}</span>
                ) : null}
              </label>
            </li>
          )
        })}
      </ul>
    </StudioRelationsRailScroll>
  )
}

function GroupToolsPanel({ groupId }: { groupId: string }) {
  const group = useStudioProfileStore((s) => s.serviceGroups.find((g) => g.id === groupId))
  const updateServiceGroup = useStudioProfileStore((s) => s.updateServiceGroup)
  if (!group) return null
  const linked = group.linkedToolIds ?? []
  const onToggle = (toolId: string) => {
    const has = linked.includes(toolId)
    updateServiceGroup(groupId, {
      linkedToolIds: has ? linked.filter((tid) => tid !== toolId) : [toolId, ...linked],
    })
  }
  return <ToolsCheckboxList selected={linked} onToggle={onToggle} />
}

function CatalogToolsPanel({ catalogLineId }: { catalogLineId: string }) {
  const line = useStudioProfileStore((s) => s.serviceCatalog.find((c) => c.id === catalogLineId))
  const updateCatalogItem = useStudioProfileStore((s) => s.updateCatalogItem)
  if (!line) return null
  const linked = line.linkedToolIds ?? []
  const onToggle = (toolId: string) => {
    const has = linked.includes(toolId)
    updateCatalogItem(catalogLineId, {
      linkedToolIds: has ? linked.filter((tid) => tid !== toolId) : [toolId, ...linked],
    })
  }
  return <ToolsCheckboxList selected={linked} onToggle={onToggle} />
}

function ToolGroupsPanel({ toolId }: { toolId: string }) {
  const serviceGroups = useStudioProfileStore((s) => s.serviceGroups)
  const updateServiceGroup = useStudioProfileStore((s) => s.updateServiceGroup)

  const selectedGroupIds = useMemo(
    () => serviceGroups.filter((g) => (g.linkedToolIds ?? []).includes(toolId)).map((g) => g.id),
    [serviceGroups, toolId],
  )

  return (
    <StudioServiceGroupMemberPicker
      mode="direct"
      selectedGroupIds={selectedGroupIds}
      onToggleGroup={(groupId) => {
        const group = serviceGroups.find((g) => g.id === groupId)
        if (!group) return
        const linked = group.linkedToolIds ?? []
        const has = linked.includes(toolId)
        updateServiceGroup(groupId, {
          linkedToolIds: has ? linked.filter((tid) => tid !== toolId) : [toolId, ...linked],
        })
      }}
    />
  )
}

function ToolServicesPanel({ toolId }: { toolId: string }) {
  const serviceCatalog = useStudioProfileStore((s) => s.serviceCatalog)
  const updateCatalogItem = useStudioProfileStore((s) => s.updateCatalogItem)

  const selectedIds = useMemo(
    () => serviceCatalog.filter((c) => (c.linkedToolIds ?? []).includes(toolId)).map((c) => c.id),
    [serviceCatalog, toolId],
  )

  const toggle = (catalogLineId: string) => {
    const line = serviceCatalog.find((c) => c.id === catalogLineId)
    if (!line) return
    const linked = line.linkedToolIds ?? []
    const has = linked.includes(toolId)
    updateCatalogItem(catalogLineId, {
      linkedToolIds: has ? linked.filter((tid) => tid !== toolId) : [toolId, ...linked],
    })
  }

  return (
    <StudioCatalogMemberPicker
      layout="rail"
      pickerBlockId={`studio-rel-tool-svc-${toolId}`}
      context="group"
      selectedIds={selectedIds}
      onToggleSelected={toggle}
      onAddNewLine={(newId) => updateCatalogItem(newId, { linkedToolIds: [toolId] })}
    />
  )
}

function ProductGroupPanel({ productId }: { productId: string }) {
  const { t } = useTranslation()
  const row = useStudioProfileStore((s) => s.products.find((p) => p.id === productId))
  const serviceGroups = useStudioProfileStore((s) => s.serviceGroups)
  const updateProduct = useStudioProfileStore((s) => s.updateProduct)
  if (!row) return null

  return (
    <StudioRelationsRailScroll>
      <Select
        value={row.linkedServiceGroupId ?? ''}
        disabled={serviceGroups.length === 0}
        onChange={(v) => updateProduct(productId, { linkedServiceGroupId: v === '' ? null : v })}
        options={[
          { value: '', label: t('studioSettings.reviews.serviceGroupNone') },
          ...serviceGroups.map((g) => ({
            value: g.id,
            label: getStudioServiceGroupTitle(
              serviceGroups,
              g.id,
              t('studioSettings.services.untitledGroup'),
            ),
          })),
        ]}
        placeholder={t('studioSettings.reviews.serviceGroupNone')}
      />
    </StudioRelationsRailScroll>
  )
}

function ProductServicesPanel({ productId }: { productId: string }) {
  const row = useStudioProfileStore((s) => s.products.find((p) => p.id === productId))
  const updateProduct = useStudioProfileStore((s) => s.updateProduct)
  if (!row) return null

  const toggleLinkedCatalog = (catalogLineId: string) => {
    const has = row.linkedCatalogIds.includes(catalogLineId)
    if (has) {
      updateProduct(productId, {
        linkedCatalogIds: row.linkedCatalogIds.filter((x) => x !== catalogLineId),
      })
      return
    }
    updateProduct(productId, { linkedCatalogIds: [catalogLineId, ...row.linkedCatalogIds] })
  }

  return (
    <StudioCatalogMemberPicker
      layout="rail"
      pickerBlockId={`studio-rel-prod-svc-${productId}`}
      context="work"
      selectedIds={row.linkedCatalogIds}
      onToggleSelected={toggleLinkedCatalog}
      onAddNewLine={(newId) =>
        updateProduct(productId, {
          linkedCatalogIds: [newId, ...row.linkedCatalogIds],
        })
      }
    />
  )
}

function ProductWorksPanel({ productId }: { productId: string }) {
  const row = useStudioProfileStore((s) => s.products.find((p) => p.id === productId))
  const updateProduct = useStudioProfileStore((s) => s.updateProduct)
  if (!row) return null

  const toggleLinkedWork = (workId: string) => {
    const has = row.linkedWorkIds.includes(workId)
    updateProduct(productId, {
      linkedWorkIds: has
        ? row.linkedWorkIds.filter((wid) => wid !== workId)
        : [workId, ...row.linkedWorkIds],
    })
  }

  return (
    <StudioWorkMemberPicker
      layout="rail"
      selectedIds={row.linkedWorkIds}
      onToggleSelected={toggleLinkedWork}
    />
  )
}
