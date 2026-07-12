'use client'

import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type Dispatch, type SyntheticEvent } from 'react'
import { TabBar } from '@/components/molecules/Tabs'
import { cn } from '@/lib/cn'
import { demoCopy } from '../copy.en'
import { KuulaEmbed } from './KuulaEmbed'
import { ConfiguratorVideoPlayer } from './ConfiguratorVideoPlayer'
import { ConfiguratorHotspots } from './ConfiguratorHotspots'
import { ConfiguratorGallery } from './ConfiguratorGallery'
import { ConfiguratorZoneFocusOverlay } from './ConfiguratorZoneFocusOverlay'
import { URBAN_OASIS_APARTMENT_VIDEO } from '../assets'
import { buildConfigurationZones } from '../hotspotUtils'
import type { ConfiguratorManifest, ConfiguratorState, ViewMode } from '../types'
import type { ConfiguratorAction } from '../configuratorReducer'
import { applyHotspotLayout, aspectRatioForLayout } from '../hotspotLayouts'
import type { HotspotLayoutOverrides } from '../hotspotLayoutStorage'
import { getAllHotspots } from '../hotspotUtils'
import { resolveHotspotLayoutForUrl } from '../resolveHotspotLayout'
import { resolveKuulaUrl, resolvePreviewFrame, resolvePreviewFrameForDebug } from '../resolvePreviewUrl'
import { useObjectContainLayout } from '../useObjectContainRect'
import type { HotspotLayoutKey } from '../hotspotLayouts'
import type { HotspotId } from '../types'

type HotspotDebugHandlers = {
  enabled: boolean
  debugLayout: HotspotLayoutKey
  sessionOverrides?: HotspotLayoutOverrides
  onHotspotMove: (layout: HotspotLayoutKey, id: HotspotId, x: number, y: number) => void
}

type ConfiguratorPreviewProps = {
  state: ConfiguratorState
  manifest: ConfiguratorManifest
  projectTitle: string
  dispatch: Dispatch<ConfiguratorAction>
  onViewModeChange: (mode: ViewMode) => void
  hotspotDebug?: HotspotDebugHandlers
}

export function ConfiguratorPreview({
  state,
  manifest,
  projectTitle,
  dispatch,
  onViewModeChange,
  hotspotDebug,
}: ConfiguratorPreviewProps) {
  const design = manifest.designs[state.designId]
  const debugMode = Boolean(hotspotDebug?.enabled)
  const configPreview = debugMode
    ? resolvePreviewFrameForDebug(state, manifest, hotspotDebug!.debugLayout)
    : resolvePreviewFrame(state, manifest)
  const displayUrl = debugMode
    ? configPreview.url
    : (state.galleryImageUrl ?? configPreview.url)
  const displayHotspotLayout = debugMode
    ? configPreview.hotspotLayout
    : resolveHotspotLayoutForUrl(state, manifest, displayUrl)
  const kuulaUrl = resolveKuulaUrl(state, manifest)
  const allHotspots = getAllHotspots(design)
  const layoutHotspots = displayHotspotLayout
    ? applyHotspotLayout(
        allHotspots,
        displayHotspotLayout,
        hotspotDebug?.sessionOverrides,
      )
    : []
  const showGallery = state.viewMode === 'photo' && !debugMode
  const showHotspots = state.viewMode === 'photo' && (debugMode || displayHotspotLayout != null)
  const visibleHotspots = layoutHotspots
  const layoutForAspect = displayHotspotLayout ?? configPreview.hotspotLayout
  const activeSpot =
    state.activeHotspot != null
      ? (visibleHotspots.find((spot) => spot.id === state.activeHotspot) ?? null)
      : null
  const activeZoneSummary = state.activeHotspot
    ? buildConfigurationZones(state, manifest).find((zone) => zone.hotspotId === state.activeHotspot)
    : null

  const previewTabs = [
    { id: 'photo', label: demoCopy.previewPhoto },
    { id: '360', label: demoCopy.preview360 },
    { id: 'video', label: demoCopy.previewVideo },
  ] as const

  const stageRef = useRef<HTMLDivElement>(null)
  const [imageSize, setImageSize] = useState(() => {
    const aspect = aspectRatioForLayout(layoutForAspect)
    return { width: aspect * 1000, height: 1000 }
  })

  const { rect: imageRect, container: containerSize } = useObjectContainLayout(stageRef, imageSize)

  const handleImageLoad = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
    }
  }, [])

  useEffect(() => {
    const aspect = aspectRatioForLayout(layoutForAspect)
    setImageSize({ width: aspect * 1000, height: 1000 })
  }, [layoutForAspect, displayUrl])

  const handleGallerySelect = useCallback(
    (url: string) => {
      if (url === configPreview.url) {
        dispatch({ type: 'SET_GALLERY_IMAGE', url: null })
        return
      }
      dispatch({ type: 'SET_GALLERY_IMAGE', url })
    },
    [configPreview.url, dispatch],
  )

  const stepGallery = useCallback(
    (delta: number) => {
      const urls = design.gallery
      if (urls.length === 0) return
      const found = urls.indexOf(displayUrl)
      const fallback = urls.indexOf(configPreview.url)
      const currentIndex = found >= 0 ? found : fallback >= 0 ? fallback : 0
      const nextUrl = urls[(currentIndex + delta + urls.length) % urls.length]
      if (nextUrl) handleGallerySelect(nextUrl)
    },
    [configPreview.url, design.gallery, displayUrl, handleGallerySelect],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-2 flex h-8 shrink-0 items-center">
        <TabBar
          items={previewTabs}
          selectedId={state.viewMode}
          onChange={(id) => onViewModeChange(id as ViewMode)}
          ariaLabel={demoCopy.previewAria}
          variant="segmented"
          panelIdPrefix="configurator-preview"
        />
      </div>

      <div
        ref={stageRef}
        data-testid="configurator-stage"
        className={cn(
          'relative min-h-0 flex-1 overflow-hidden rounded-xl border bg-background',
          debugMode ? 'border-amber-500/50' : 'border-border',
        )}
      >
        {state.viewMode === '360' ? (
          <KuulaEmbed
            key={state.designId}
            embedUrl={kuulaUrl}
            title={`${projectTitle} — 3D tour`}
          />
        ) : state.viewMode === 'video' ? (
          <ConfiguratorVideoPlayer
            key={URBAN_OASIS_APARTMENT_VIDEO}
            src={URBAN_OASIS_APARTMENT_VIDEO}
            title={`${projectTitle} — apartment video`}
            active
          />
        ) : (
          <>
            <Image
              key={`${state.designId}-${displayUrl}`}
              src={displayUrl}
              alt=""
              fill
              unoptimized
              priority
              sizes="(max-width: 768px) 100vw, 65vw"
              className="object-contain"
              onLoad={handleImageLoad}
            />
            {!debugMode && state.activeHotspot && showHotspots ? (
              <ConfiguratorZoneFocusOverlay
                activeSpot={activeSpot}
                imageRect={imageRect}
                containerWidth={containerSize.width}
                containerHeight={containerSize.height}
              />
            ) : null}
            {!debugMode && activeZoneSummary ? (
              <div className="pointer-events-none absolute top-3 left-3 z-20 max-w-[min(18rem,calc(100%-1.5rem))] rounded-full border border-border bg-background/95 px-3 py-1.5 shadow-sm backdrop-blur-sm">
                <p className="truncate text-xs text-foreground">
                  <span className="text-muted-foreground">{demoCopy.editingZoneLabel}</span>{' '}
                  <span className="font-medium">{activeZoneSummary.zone}</span>
                  <span className="text-muted-foreground"> · </span>
                  <span>{activeZoneSummary.value}</span>
                </p>
              </div>
            ) : null}
            {showGallery && design.gallery.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label={demoCopy.galleryPrev}
                  onClick={() => stepGallery(-1)}
                  className="absolute top-1/2 left-1 z-20 flex size-9 -translate-y-1/2 items-center justify-center border-0 bg-transparent p-0 text-white/45 drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)] transition-colors hover:text-white focus-visible:outline-none"
                >
                  <ChevronLeft className="size-9" strokeWidth={1.5} aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label={demoCopy.galleryNext}
                  onClick={() => stepGallery(1)}
                  className="absolute top-1/2 right-1 z-20 flex size-9 -translate-y-1/2 items-center justify-center border-0 bg-transparent p-0 text-white/45 drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)] transition-colors hover:text-white focus-visible:outline-none"
                >
                  <ChevronRight className="size-9" strokeWidth={1.5} aria-hidden />
                </button>
              </>
            ) : null}
            {showHotspots ? (
              <ConfiguratorHotspots
                  hotspots={visibleHotspots}
                  activeHotspotId={state.activeHotspot}
                  design={design}
                  state={state}
                  dispatch={dispatch}
                  imageRect={imageRect}
                  containerWidth={containerSize.width}
                  containerHeight={containerSize.height}
                  debugMode={debugMode}
                  debugLayout={displayHotspotLayout ?? configPreview.hotspotLayout}
                  onHotspotMove={hotspotDebug?.onHotspotMove}
              />
            ) : null}
          </>
        )}
      </div>

      {showGallery ? (
        <ConfiguratorGallery
          className="mt-2"
          urls={design.gallery}
          activeUrl={displayUrl}
          onSelect={handleGallerySelect}
        />
      ) : null}
    </div>
  )
}
