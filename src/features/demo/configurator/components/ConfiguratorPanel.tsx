'use client'

import type { Dispatch } from 'react'
import { Divider } from '@/components/atoms/Divider'
import { ConfiguratorSelectionSummary } from './ConfiguratorSelectionSummary'
import type { ConfiguratorManifest, ConfiguratorState } from '../types'
import type { ConfiguratorAction } from '../configuratorReducer'
import { ConfiguratorSelectionLedger } from './ConfiguratorSelectionLedger'
import { ConfiguratorProjectIntro } from './ConfiguratorProjectIntro'
import { DesignPackagePicker } from './DesignPackagePicker'
import { HotspotDebugPanel } from './HotspotDebugPanel'
import type { HotspotLayoutKey } from '../hotspotLayouts'
import type { HotspotLayoutOverrides } from '../hotspotLayoutStorage'
import { resolvePreviewFrame } from '../resolvePreviewUrl'

type HotspotDebugPanelHandlers = {
  debugLayout: HotspotLayoutKey
  onDebugLayoutChange: (layout: HotspotLayoutKey) => void
  sessionOverrides?: HotspotLayoutOverrides
  onSave: () => void
  onResetLayout: (layout: HotspotLayoutKey) => void
}

type ConfiguratorPanelProps = {
  state: ConfiguratorState
  manifest: ConfiguratorManifest
  dispatch: Dispatch<ConfiguratorAction>
  onSave: () => void
  onDownload: () => void
  hotspotDebug?: HotspotDebugPanelHandlers
}

export function ConfiguratorPanel({
  state,
  manifest,
  dispatch,
  onSave,
  onDownload,
  hotspotDebug,
}: ConfiguratorPanelProps) {
  const previewLayout = hotspotDebug
    ? hotspotDebug.debugLayout
    : resolvePreviewFrame(state, manifest).hotspotLayout

  return (
    <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain border-t border-border bg-background md:border-t-0 md:border-l">
      <div className="p-4 md:pl-6">
        <ConfiguratorProjectIntro project={manifest.project} />

        <Divider className="my-4" />

        <DesignPackagePicker
          manifest={manifest}
          selectedId={state.designId}
          onChange={(id) => dispatch({ type: 'SET_DESIGN', designId: id })}
        />

        {hotspotDebug ? (
          <>
            <Divider className="my-4" />
            <HotspotDebugPanel
              layout={previewLayout}
              onLayoutChange={hotspotDebug.onDebugLayoutChange}
              sessionOverrides={hotspotDebug.sessionOverrides}
              onSave={hotspotDebug.onSave}
              onResetLayout={hotspotDebug.onResetLayout}
            />
          </>
        ) : null}

        <Divider className="my-4" />

        <ConfiguratorSelectionLedger state={state} manifest={manifest} dispatch={dispatch} />

        <Divider className="my-4" />

        <ConfiguratorSelectionSummary
          state={state}
          manifest={manifest}
          onSave={onSave}
          onDownload={onDownload}
        />
      </div>
    </div>
  )
}
