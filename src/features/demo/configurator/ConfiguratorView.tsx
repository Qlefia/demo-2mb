'use client'

import Link from 'next/link'
import { useReducer } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from '@/components/molecules/Toast'
import { TwoMbWordmark } from '@/components/brand/TwoMbWordmark'
import { PAGE_FRAME_CLASS } from '@/lib/layout/pageFrame'
import { cn } from '@/lib/cn'
import { demoCopy } from './copy.en'
import type { ConfiguratorManifest } from './types'
import {
  INITIAL_CONFIGURATOR_STATE,
  configuratorReducer,
} from './configuratorReducer'
import { buildSummaryLines } from './buildSummary'
import { downloadConfigurationSpec } from './downloadConfigurationSpec'
import { ConfiguratorPreview } from './components/ConfiguratorPreview'
import { ConfiguratorPanel } from './components/ConfiguratorPanel'
import { useHotspotDebug } from './useHotspotDebug'

type ConfiguratorViewProps = {
  manifest: ConfiguratorManifest
}

function isHotspotDebugEnabled(searchParams: URLSearchParams): boolean {
  const flag = searchParams.get('hotspotDebug')
  return flag === '1' || flag === 'true'
}

export function ConfiguratorView({ manifest }: ConfiguratorViewProps) {
  const searchParams = useSearchParams()
  const hotspotDebugEnabled = isHotspotDebugEnabled(searchParams)
  const [state, dispatch] = useReducer(configuratorReducer, INITIAL_CONFIGURATOR_STATE)
  const hotspotDebug = useHotspotDebug(hotspotDebugEnabled)
  const { project } = manifest

  const handleSave = () => {
    const summary = buildSummaryLines(state, manifest).join(' · ')
    void navigator.clipboard?.writeText(summary).catch(() => undefined)
    toast(demoCopy.saveToast, 'success')
  }

  const handleDownload = () => {
    downloadConfigurationSpec(state, manifest)
    toast(demoCopy.downloadToast, 'success')
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground md:h-dvh md:max-h-dvh md:overflow-hidden">
      <header className="z-30 shrink-0 border-b border-border bg-background">
        <div className={cn(PAGE_FRAME_CLASS, 'flex items-center gap-3 py-3')}>
          <div className="h-5 w-28 shrink-0 text-foreground">
            <TwoMbWordmark className="h-full w-full" />
          </div>
          <Link
            href={`/demo/projects/${project.slug}`}
            className="min-w-0 truncate text-sm text-muted-foreground hover:text-foreground"
          >
            {demoCopy.headerSampleLabel}
          </Link>
          {hotspotDebugEnabled ? (
            <span className="ml-auto rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-800">
              Hotspot debug
            </span>
          ) : null}
        </div>
      </header>

      <div
        className={cn(
          PAGE_FRAME_CLASS,
          'flex min-h-0 flex-1 flex-col gap-3 py-3 md:h-0 md:flex-row md:gap-5 md:overflow-hidden md:py-4',
        )}
      >
        <section className="flex min-h-0 min-w-0 flex-1 flex-col md:overflow-hidden">
          <ConfiguratorPreview
            state={state}
            manifest={manifest}
            projectTitle={project.title}
            dispatch={dispatch}
            onViewModeChange={(mode) => dispatch({ type: 'SET_VIEW_MODE', viewMode: mode })}
            hotspotDebug={
              hotspotDebugEnabled
                ? {
                    enabled: true,
                    debugLayout: hotspotDebug.debugLayout,
                    sessionOverrides: hotspotDebug.sessionOverrides,
                    onHotspotMove: hotspotDebug.moveHotspot,
                  }
                : undefined
            }
          />
        </section>

        <aside className="flex h-full min-h-0 w-full shrink-0 flex-col md:max-h-full md:w-[min(420px,38vw)] md:overflow-hidden">
          <ConfiguratorPanel
            state={state}
            manifest={manifest}
            dispatch={dispatch}
            onSave={handleSave}
            onDownload={handleDownload}
            hotspotDebug={
              hotspotDebugEnabled
                ? {
                    debugLayout: hotspotDebug.debugLayout,
                    onDebugLayoutChange: hotspotDebug.setDebugLayout,
                    sessionOverrides: hotspotDebug.sessionOverrides,
                    onSave: () => void hotspotDebug.saveAll(),
                    onResetLayout: hotspotDebug.resetCurrentLayout,
                  }
                : undefined
            }
          />
        </aside>
      </div>
    </div>
  )
}
